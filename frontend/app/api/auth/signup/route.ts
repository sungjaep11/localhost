import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "회원가입에 실패했습니다." }));
      return NextResponse.json(
        { success: false, error: error.message || "회원가입에 실패했습니다." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { 
        success: true, 
        userId: data.userId, 
        nickname: data.nickname,
        email: data.email 
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const err = error as { name?: string; message?: string; cause?: { code?: string } };
    if (err.name === "AbortError" || err.name === "TypeError" || err?.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        { success: false, error: "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요." },
        { status: 503 }
      );
    }
    const msg = process.env.NODE_ENV === "development" && err?.message
      ? `회원가입 처리 중 오류: ${err.message}`
      : "회원가입에 실패했습니다.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
