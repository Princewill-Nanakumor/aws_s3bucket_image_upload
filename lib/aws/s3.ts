import { S3Client } from "@aws-sdk/client-s3";
import {
  AWS_S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
} from "@/lib/aws/config";

export const s3 = new S3Client({
  region: AWS_S3_REGION,
  credentials:
    S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: S3_ACCESS_KEY_ID,
          secretAccessKey: S3_SECRET_ACCESS_KEY,
        }
      : undefined,
});
