import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const count = searchParams.get("count") || "1";

    if (!genre) {
      return NextResponse.json(
        { success: false, error: "genre parameter is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BACKEND_URL}/api/songs/random?genre=${encodeURIComponent(genre)}&count=${count}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "노래를 불러오는데 실패했습니다.",
      }));
      return NextResponse.json(
        { success: false, error: error.message || "노래를 불러오는데 실패했습니다." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, song: data }, { status: 200 });
  } catch (error: any) {
    console.error("Get random song error:", error);

    if (error.name === "AbortError" || error.name === "TypeError") {
      return NextResponse.json(
        {
          success: false,
          error: "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: "노래를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
