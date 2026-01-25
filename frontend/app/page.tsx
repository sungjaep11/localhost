"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 처음 시작할 때 로그인 페이지로 리다이렉트
    router.push('/auth/login');
  }, [router]);

  return (
    <main
      style={{
        height: "100vh",
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
      }}
    >
      <div
        style={{
          color: "#00ffff",
          fontSize: "1.5rem",
          fontWeight: 600,
          textShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
        }}
      >
        로딩 중...
      </div>
    </main>
  );
}
