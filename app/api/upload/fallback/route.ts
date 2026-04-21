import { PutObjectCommand } from "@aws-sdk/client-s3";
import { AWS_BUCKET_NAME } from "@/lib/aws/config";
import { s3 } from "@/lib/aws/s3";
import {
  createUploadKey,
  getDownloadUrlForKey,
} from "@/lib/uploads/service";
import {
  MAX_FILE_SIZE_BYTES,
  isAllowedImageUpload,
} from "@/lib/uploads/validation";

export async function POST(req: Request) {
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
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const fileUrl = await getDownloadUrlForKey(key);
    return Response.json({ message: "File uploaded successfully", key, fileUrl });
  } catch (err) {
    console.error("Fallback upload failed", err);
    return Response.json({ error: "Fallback upload failed" }, { status: 500 });
  }
}
