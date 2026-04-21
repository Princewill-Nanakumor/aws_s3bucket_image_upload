import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/aws/s3";

export async function POST(req: Request) {
  const { key } = await req.json();

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60, // 1 minute
  });

  return Response.json({ url });
}
