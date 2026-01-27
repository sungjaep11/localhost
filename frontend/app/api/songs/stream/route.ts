import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/** MP3를 같은 출처로 제공 (브라우저 CORS/차단 방지) */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const file = searchParams.get("file");

    if (!genre || !file) {
      return NextResponse.json(
        { error: "genre and file are required" },
        { status: 400 }
      );
    }

    const url = `${BACKEND_URL}/songs/${encodeURIComponent(genre)}/${encodeURIComponent(file)}`;
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn("[GET /api/songs/stream] backend returned", res.status, "for", genre + "/" + file);
      return new NextResponse(null, { status: res.status });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[GET /api/songs/stream] error", e);
    return new NextResponse(null, { status: 500 });
  }
}
