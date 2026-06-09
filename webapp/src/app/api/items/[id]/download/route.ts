import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemById } from "@/lib/db/items";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const item = await getItemById(id, { accessToken: session.accessToken });
    if (!item || !item.fileUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const response = await fetch(item.fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") ?? "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(item.fileName ?? "download")}"`);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to download file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
