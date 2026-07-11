import { PutObjectCommand } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import { AWS_BUCKET_NAME } from "@/lib/aws/config";
import { s3 } from "@/lib/aws/s3";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  createUploadKey,
  getDownloadUrlForKey,
} from "@/lib/uploads/service";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  isAllowedImageUpload,
} from "@/lib/uploads/validation";

export async function POST(req: Request) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const requestedKey = formData.get("key");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!isAllowedImageUpload(file.name, file.type)) {
      return Response.json(
        { error: "Only jpg, png, webp, gif, avif allowed" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    const bucketName = AWS_BUCKET_NAME;
    if (!bucketName) {
      return Response.json(
        { error: "Missing AWS bucket configuration" },
        { status: 500 },
      );
    }

    const key =
      typeof requestedKey === "string" && requestedKey.startsWith("uploads/")
        ? requestedKey
        : createUploadKey(file.name);

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = await fileTypeFromBuffer(buffer);
    if (
      !detectedType ||
      !detectedType.mime.startsWith("image/") ||
      !ALLOWED_EXTENSIONS.has(detectedType.ext)
    ) {
      return Response.json(
        { error: "File content is not a valid supported image" },
        { status: 400 },
      );
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: detectedType.mime,
      }),
    );

    const fileUrl = await getDownloadUrlForKey(key);
    return Response.json({ message: "File uploaded successfully", key, fileUrl });
  } catch (err) {
    console.error("Fallback upload failed", err);
    return Response.json({ error: "Fallback upload failed" }, { status: 500 });
  }
}
