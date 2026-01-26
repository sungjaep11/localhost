import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const userId = request.headers.get("x-user-id") || "";

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "x-user-id": userId }),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      let errorMessage = "방 삭제에 실패했습니다.";
      try {
        const error = await res.json();
        errorMessage = error.message || error.error || errorMessage;
        console.error("[DELETE /api/rooms/:roomId] Backend error:", errorMessage, "Status:", res.status);
      } catch (parseError) {
        console.error("[DELETE /api/rooms/:roomId] Failed to parse error response:", parseError);
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (error: any) {
    console.error("[DELETE /api/rooms/:roomId] error", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "요청 시간이 초과되었습니다. 백엔드 서버가 응답하지 않습니다.",
        },
        { status: 503 }
      );
    }

    if (error.name === "TypeError" && error.message?.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          error: "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "방 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
