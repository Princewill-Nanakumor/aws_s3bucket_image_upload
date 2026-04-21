import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  AWS_BUCKET_NAME,
  SIGNED_UPLOAD_EXPIRES_IN_SECONDS,
} from "@/lib/aws/config";
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
    const { fileName, fileType, fileSize } = await req.json();

    if (typeof fileName !== "string" || !fileName.trim()) {
      return Response.json({ error: "Invalid file name" }, { status: 400 });
    }
    if (
      typeof fileType !== "string" ||
      !isAllowedImageUpload(fileName, fileType)
    ) {
      return Response.json(
        { error: "Only jpg, png, webp, gif, avif allowed" },
        { status: 400 },
      );
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

    const bucketName = AWS_BUCKET_NAME;
    if (!bucketName) {
      return Response.json(
        { error: "Missing AWS bucket configuration" },
        { status: 500 },
      );
    }

    const key = createUploadKey(fileName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: SIGNED_UPLOAD_EXPIRES_IN_SECONDS,
    });
    const fileUrl = await getDownloadUrlForKey(key);

    return Response.json({
      message: "Upload URL generated",
      key,
      uploadUrl,
      fileUrl,
    });
  } catch (err) {
    console.error("Failed to generate upload URL", err);
    return Response.json({ error: "Upload setup failed" }, { status: 500 });
  }
}
