import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const userId = request.headers.get("x-user-id") || "";

    console.log(`[Frontend DELETE /api/rooms/:roomId] roomId=${roomId}, userId=${userId}, BACKEND_URL=${BACKEND_URL}`);

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/rooms/${roomId}`;
    console.log(`[Frontend DELETE] Sending request to: ${backendUrl}`);

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "x-user-id": userId }),
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`[Frontend DELETE] Response status: ${res.status}, ok: ${res.ok}`);

    // 응답 본문 파싱 (한 번만 읽기)
    let responseData: any = null;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await res.text();
        if (text && text.trim()) {
          responseData = JSON.parse(text);
        }
      }
    } catch (parseError) {
      console.error("[DELETE /api/rooms/:roomId] Failed to parse response:", parseError);
    }

    if (!res.ok) {
      const errorMessage = responseData?.message || responseData?.error || `서버 오류 (${res.status}): ${res.statusText}`;
      console.error("[DELETE /api/rooms/:roomId] Backend error:", errorMessage, "Status:", res.status);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: res.status }
      );
    }

    // 성공 응답
    return NextResponse.json(
      { success: true, ...(responseData || { message: "Room deleted successfully" }) },
      { status: 200 }
    );
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
