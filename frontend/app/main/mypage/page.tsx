"use client";

import { useRouter } from 'next/navigation';

export default function MyPage() {
  const router = useRouter();

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
        position: "relative",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "3rem",
          maxWidth: "800px",
          width: "100%",
          border: "2px solid rgba(0, 255, 255, 0.5)",
          boxShadow: "0 0 40px rgba(0, 255, 255, 0.3), 0 0 60px rgba(255, 0, 255, 0.3)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "2rem",
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          Myhome
        </h1>
        
        <p
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            fontSize: "1.2rem",
            marginBottom: "3rem",
          }}
        >
          나의 홈 페이지입니다. 프로필과 통계를 확인하세요!
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => router.push("/main/lobby")}
            style={{
              padding: "1rem 2rem",
              background: "rgba(0, 255, 255, 0.2)",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "12px",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            로비로 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}
