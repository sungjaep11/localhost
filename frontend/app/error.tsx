"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#030508",
        color: "#fff",
        overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        일시적인 오류가 발생했습니다
      </h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", textAlign: "center" }}>
        페이지를 새로고침하거나 아래 버튼으로 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          background: "rgba(0, 255, 255, 0.2)",
          border: "2px solid rgba(0, 255, 255, 0.6)",
          borderRadius: "12px",
          color: "#00ffff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        다시 시도
      </button>
      <a
        href="/main/lobby"
        style={{
          marginTop: "1rem",
          color: "rgba(0, 255, 255, 0.8)",
          fontSize: "0.9rem",
        }}
      >
        로비로 이동
      </a>
    </div>
  );
}
