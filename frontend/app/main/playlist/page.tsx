"use client";

import { useRouter } from 'next/navigation';

export default function PlaylistPage() {
  const router = useRouter();

  return (
    <main className="lobby-premium-root">
      {/* 로비와 동일한 배경·분위기 */}
      <div className="lobby-premium-bg">
        <div className="lobby-bg-base" />
        <div className="lobby-city-dense" aria-hidden />
        <div className="lobby-city-bokeh" aria-hidden />
        <div className="lobby-city-traffic" aria-hidden />
        <div className="lobby-interior-overlay" aria-hidden />
        <div className="lobby-fog" aria-hidden />
        <div className="lobby-fog-volumetric" aria-hidden />
        <div className="lobby-floor-reflection" aria-hidden />
      </div>
      <div className="lobby-neon-particles" aria-hidden>
        {[...Array(40)].map((_, i) => {
          const isPurple = i % 4 === 0;
          const size = i % 5 === 0 ? 'lobby-particle-lg' : i % 3 === 1 ? 'lobby-particle-sm' : '';
          return (
            <div
              key={i}
              className={`lobby-particle ${isPurple ? 'lobby-particle-purple' : ''} ${size}`}
              style={{
                left: `${8 + (i % 10) * 8}%`,
                top: `${8 + (Math.floor(i / 10) % 4) * 22}%`,
                animationDelay: `${(i * 0.4) % 8}s`,
                animationDuration: `${10 + (i % 5)}s`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          padding: '1.5rem',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "2.5rem 3rem",
          width: "100%",
          maxWidth: "800px",
          border: "2px solid rgba(0, 255, 255, 0.5)",
          boxShadow: "0 0 40px rgba(0, 255, 255, 0.3), 0 0 60px rgba(255, 0, 255, 0.3)",
          boxSizing: "border-box",
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
          Our Playlist
        </h1>
        
        <p
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            fontSize: "1.2rem",
            marginBottom: "3rem",
          }}
        >
          글로벌 플레이리스트 허브에서 음악을 탐색하세요!
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
      </div>
    </main>
  );
}
