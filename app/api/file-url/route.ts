import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/aws/s3";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string" || !key.startsWith("uploads/")) {
      return Response.json({ error: "Invalid file key" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 60, // 1 minute
    });

    return Response.json({ url });
  } catch (err) {
    console.error("Failed to generate file URL", err);
    return Response.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
