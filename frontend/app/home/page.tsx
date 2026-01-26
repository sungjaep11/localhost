"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main
        style={{
          height: "100vh",
          backgroundImage: "url('/images/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <button type="button" className="cyberpunk-btn">
          노래 맞추기
        </button>
        <button type="button" className="cyberpunk-btn cyberpunk-btn-pink">
          사투리 가사 맞추기
        </button>
      </div>
      <Link
        href="/"
        onClick={() => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("userId");
            localStorage.removeItem("nickname");
          }
        }}
        style={{
          color: "rgba(0, 255, 255, 0.8)",
          fontSize: "0.95rem",
          textDecoration: "none",
          letterSpacing: "0.1em",
          transition: "color 0.2s ease, text-shadow 0.2s ease",
        }}
        className="login-link"
      >
        로그아웃
      </Link>
    </main>
  );
}
