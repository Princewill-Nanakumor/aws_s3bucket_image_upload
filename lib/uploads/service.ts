import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  AWS_BUCKET_NAME,
  AWS_S3_CDN_URL,
  SIGNED_DOWNLOAD_EXPIRES_IN_SECONDS,
} from "@/lib/aws/config";
import { s3 } from "@/lib/aws/s3";
import { sanitizeFilename } from "@/lib/uploads/utils";

const encodeS3Key = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export const createUploadKey = (fileName: string) => {
  const safeFileName = sanitizeFilename(fileName);
  return `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
};

export const getDownloadUrlForKey = async (key: string) => {
  const bucketName = AWS_BUCKET_NAME;
  if (!bucketName) throw new Error("Missing AWS bucket configuration");

  if (AWS_S3_CDN_URL) {
    const normalizedBaseUrl = AWS_S3_CDN_URL.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/${encodeS3Key(key)}`;
  }

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
    { expiresIn: SIGNED_DOWNLOAD_EXPIRES_IN_SECONDS },
  );
};
