import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws/s3";

export async function GET() {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: "uploads/",
  });

  const data = await s3.send(command);

  const files = data.Contents?.map((item) => item.Key) || [];

  return Response.json({ files });
}
