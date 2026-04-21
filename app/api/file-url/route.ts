import { getDownloadUrlForKey } from "@/lib/uploads/service";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string" || !key.startsWith("uploads/")) {
      return Response.json({ error: "Invalid file key" }, { status: 400 });
    }

    const url = await getDownloadUrlForKey(key);

    return Response.json(
      { url },
      {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("Failed to generate file URL", err);
    return Response.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
