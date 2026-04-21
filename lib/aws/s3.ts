import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

export const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});
