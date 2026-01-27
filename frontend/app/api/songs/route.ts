import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");

    const url = genre
      ? `${BACKEND_URL}/api/songs?genre=${encodeURIComponent(genre)}`
      : `${BACKEND_URL}/api/songs`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "노래 목록을 불러오는데 실패했습니다." }));
      return NextResponse.json(
        { success: false, error: err.message },
        { status: res.status }
      );
    }

    const songs = await res.json();
    return NextResponse.json(songs, { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/songs] error", e);
    if (e.name === "AbortError" || e.name === "TypeError") {
      return NextResponse.json(
        { success: false, error: "백엔드에 연결할 수 없습니다." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: "노래 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
