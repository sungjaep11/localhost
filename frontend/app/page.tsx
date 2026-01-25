"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() || "Guest" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("nickname", data.nickname);
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "1.5rem",
      }}
    >
      <h1
        style={{
          color: "#0ff",
          fontSize: "1.75rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
          marginBottom: "0.5rem",
        }}
      >
        로그인
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        <input
          type="text"
          className="cyberpunk-input"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          disabled={loading}
          autoComplete="username"
        />
        {error && (
          <p
            style={{
              color: "#f44",
              fontSize: "0.9rem",
              textShadow: "0 0 10px rgba(255, 68, 68, 0.8)",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="cyberpunk-btn"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "입장 중..." : "입장"}
        </button>
      </form>
    </main>
  );
}
