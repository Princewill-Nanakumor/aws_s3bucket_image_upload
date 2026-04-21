import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws/s3";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

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

  return Response.json({
    files,
    nextCursor: data.IsTruncated ? data.NextContinuationToken || null : null,
    hasMore: Boolean(data.IsTruncated),
  });
}
