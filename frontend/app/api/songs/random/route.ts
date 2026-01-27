import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const count = searchParams.get("count") || "1";
    const exclude = searchParams.get("exclude") || "";

    if (!genre) {
      return NextResponse.json(
        { success: false, error: "genre parameter is required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ genre, count });
    if (exclude) params.set("exclude", exclude);
    const res = await fetch(
      `${BACKEND_URL}/api/songs/random?${params.toString()}`,
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
    // 브라우저가 같은 출처에서 MP3 로드하도록 프록시 URL로 치환 (CORS/차단 방지)
    if (data?.genre != null && data?.id != null) {
      const file = String(data.id).includes("/") ? String(data.id).split("/")[1] : data.id;
      data.mp3Url = `/api/songs/stream?genre=${encodeURIComponent(data.genre)}&file=${encodeURIComponent(file)}`;
    }
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
