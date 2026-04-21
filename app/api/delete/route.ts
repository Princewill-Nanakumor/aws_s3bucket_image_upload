import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws/s3";

export async function DELETE(req: Request) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== "string" || !key.startsWith("uploads/")) {
      return Response.json({ error: "Invalid file key" }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);

    return Response.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Failed to delete file", err);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
