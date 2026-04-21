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
  const cdnBaseUrl = process.env.AWS_S3_CDN_URL;
  const encodedKey = encodeS3Key(key);

  if (cdnBaseUrl) {
    const normalizedBaseUrl = cdnBaseUrl.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/${encodedKey}`;
  }

  return null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
    const continuationToken = searchParams.get("cursor") || undefined;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!bucketName) {
      return Response.json(
        { error: "Missing AWS bucket configuration" },
        { status: 500 },
      );
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "uploads/",
      ContinuationToken: continuationToken,
      MaxKeys: limit,
    });

    const data = await s3.send(command);

    const files =
      data.Contents?.filter(
        (item): item is { Key: string; LastModified?: Date } =>
          typeof item.Key === "string",
      )
        .sort((a, b) => {
          const aTime = a.LastModified ? a.LastModified.getTime() : 0;
          const bTime = b.LastModified ? b.LastModified.getTime() : 0;
          return bTime - aTime;
        })
        .map((item) => item.Key) || [];
    const fileItems = await Promise.all(
      files.map(async (key) => {
        const publicUrl = getPublicUrlForKey(key);
        if (publicUrl) {
          return { key, url: publicUrl };
        }

        const signedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: bucketName,
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
  } catch (err) {
    console.error("Failed to list files", err);
    return Response.json({ error: "Failed to list files" }, { status: 500 });
  }
}
