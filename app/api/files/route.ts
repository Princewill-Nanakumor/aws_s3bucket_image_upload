import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  AWS_BUCKET_NAME,
} from "@/lib/aws/config";
import { s3 } from "@/lib/aws/s3";
import { getDownloadUrlForKey } from "@/lib/uploads/service";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
    const continuationToken = searchParams.get("cursor") || undefined;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const bucketName = AWS_BUCKET_NAME;
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
        const url = await getDownloadUrlForKey(key);
        return { key, url };
      }),
    );

    return Response.json(
      {
        files: fileItems,
        nextCursor: data.IsTruncated ? data.NextContinuationToken || null : null,
        hasMore: Boolean(data.IsTruncated),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("Failed to list files", err);
    return Response.json({ error: "Failed to list files" }, { status: 500 });
  }
}
