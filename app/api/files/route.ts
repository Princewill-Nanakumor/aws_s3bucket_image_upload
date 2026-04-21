import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/aws/s3";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

const encodeS3Key = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const getPublicUrlForKey = (key: string) => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const cdnBaseUrl = process.env.AWS_S3_CDN_URL;
  const encodedKey = encodeS3Key(key);

  if (cdnBaseUrl) {
    const normalizedBaseUrl = cdnBaseUrl.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/${encodedKey}`;
  }

  if (!bucket) return null;
  return null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const continuationToken = searchParams.get("cursor") || undefined;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: "uploads/",
    ContinuationToken: continuationToken,
    MaxKeys: limit,
  });

  const data = await s3.send(command);

  const files =
    data.Contents?.map((item) => item.Key).filter(
      (key): key is string => typeof key === "string",
    ) || [];
  const fileItems = await Promise.all(
    files.map(async (key) => {
      const publicUrl = getPublicUrlForKey(key);
      if (publicUrl) {
        return { key, url: publicUrl };
      }

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
        { expiresIn: 3600 },
      );

      return { key, url: signedUrl };
    }),
  );

  return Response.json({
    files: fileItems,
    nextCursor: data.IsTruncated ? data.NextContinuationToken || null : null,
    hasMore: Boolean(data.IsTruncated),
  });
}
