const getEnv = (keys: string[], options?: { required?: boolean }) => {
  const shouldWarn = options?.required ?? true;
  let missingKeyLog = "";
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
    if (!missingKeyLog) missingKeyLog = key;
  }
  if (
    shouldWarn &&
    process.env.NODE_ENV !== "production" &&
    missingKeyLog &&
    typeof console !== "undefined"
  ) {
    console.warn(`[aws-config] Missing env: ${keys.join(" or ")}`);
  }
  return undefined;
};

export const AWS_S3_REGION = getEnv(["AWS_S3_REGION"]);
export const AWS_BUCKET_NAME = getEnv(["AWS_BUCKET_NAME", "AWS_S3_BUCKET_NAME"]);
export const AWS_S3_CDN_URL = getEnv(["AWS_S3_CDN_URL"], { required: false });
export const S3_ACCESS_KEY_ID = getEnv(["S3_ACCESS_KEY_ID"]);
export const S3_SECRET_ACCESS_KEY = getEnv(["S3_SECRET_ACCESS_KEY"]);

export const SIGNED_DOWNLOAD_EXPIRES_IN_SECONDS = 900;
export const SIGNED_UPLOAD_EXPIRES_IN_SECONDS = 300;
