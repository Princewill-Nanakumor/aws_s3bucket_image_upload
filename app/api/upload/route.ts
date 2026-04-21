import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/aws/s3";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_PREFIX = "image/";

const sanitizeFilename = (name: string) =>
  name.replace(/[^\w.\-]/g, "_").replace(/_+/g, "_");

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const requestedKey = formData.get("key");

      if (!(file instanceof File)) {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
      }

      if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
        return Response.json({ error: "Invalid file type" }, { status: 400 });
      }

      if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: "File must be under 5MB" },
          { status: 400 },
        );
      }

      const bucketName = process.env.AWS_BUCKET_NAME;
      if (!bucketName) {
        return Response.json(
          { error: "Missing AWS bucket configuration" },
          { status: 500 },
        );
      }

      const safeFileName = sanitizeFilename(file.name);
      const key =
        typeof requestedKey === "string" && requestedKey.startsWith("uploads/")
          ? requestedKey
          : `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        }),
      );

      return Response.json({ message: "File uploaded successfully", key });
    }

    const { fileName, fileType, fileSize } = await req.json();

    if (typeof fileName !== "string" || !fileName.trim()) {
      return Response.json({ error: "Invalid file name" }, { status: 400 });
    }

    if (
      typeof fileType !== "string" ||
      !fileType.startsWith(ALLOWED_MIME_PREFIX)
    ) {
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (
      typeof fileSize !== "number" ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE_BYTES
    ) {
      return Response.json(
        { error: "File must be under 5MB" },
        { status: 400 },
      );
    }

    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!bucketName) {
      return Response.json(
        { error: "Missing AWS bucket configuration" },
        { status: 500 },
      );
    }

    const safeFileName = sanitizeFilename(fileName);
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return Response.json({
      message: "Upload URL generated",
      key,
      uploadUrl,
    });
  } catch (err) {
    console.error("Failed to generate upload URL", err);
    return Response.json({ error: "Upload setup failed" }, { status: 500 });
  }
}
