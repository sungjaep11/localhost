import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";

    const userId = request.headers.get("x-user-id") || "";

    const res = await fetch(
      `${BACKEND_URL}/api/games/rooms?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(userId && { "x-user-id": userId }),
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "방 목록을 불러오는데 실패했습니다.",
      }));
      return NextResponse.json(
        { success: false, error: error.message || "방 목록을 불러오는데 실패했습니다." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (error: any) {
    console.error("Get rooms error:", error);

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
      { success: false, error: "방 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || "";

    const res = await fetch(`${BACKEND_URL}/api/games/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "x-user-id": userId }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "방 생성에 실패했습니다.",
      }));
      return NextResponse.json(
        { success: false, error: error.message || "방 생성에 실패했습니다." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, room: data }, { status: 201 });
  } catch (error: any) {
    console.error("Create room error:", error);

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
      { success: false, error: "방 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
