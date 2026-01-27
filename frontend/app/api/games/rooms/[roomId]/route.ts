import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/** 진행 중인 방 포함, roomId로 방 옵션(rounds, songsPerRound, genres) 조회 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }
    const userId = request.headers.get("x-user-id") || "";
    const res = await fetch(`${BACKEND_URL}/api/games/rooms/${roomId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "x-user-id": userId }),
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.message || "Room not found" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json({ success: true, room: data }, { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/games/rooms/:roomId] error", e);
    if (e?.name === "AbortError" || e?.name === "TypeError") {
      return NextResponse.json(
        { success: false, error: "백엔드에 연결할 수 없습니다." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: "방 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
