import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");

    if (!genre) {
      return NextResponse.json(
        { message: "genre parameter is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BACKEND_URL}/api/dialect-lyrics/random?genre=${encodeURIComponent(genre)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to load lyric" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("[GET /api/dialect-lyrics/random]", e);
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "AbortError") {
      return NextResponse.json(
        { message: "백엔드 서버에 연결할 수 없습니다." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: "Failed to load random dialect lyric" },
      { status: 500 }
    );
  }
}
