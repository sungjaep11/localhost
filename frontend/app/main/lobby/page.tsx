"use client";

import { useRouter } from 'next/navigation';

export default function LobbyPage() {
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
      }}
    >
      {/* 떠다니는 음표들 */}
      <div className="floating-notes">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`floating-note note-${i}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        ))}
      </div>
      
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1400px",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4rem",
          gap: "4rem",
        }}
      >
        {/* 왼쪽 버튼 3개 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "1.5rem",
            flex: 1,
          }}
        >
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-left"
            onClick={() => router.push("/game/song-guess")}
          >
            <div className="cyberpunk-btn-glow" />
            <div className="cyberpunk-btn-pattern" />
            <div className="cyberpunk-btn-wave" />
            <div className="cyberpunk-btn-content">
              <svg className="cyberpunk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <div className="cyberpunk-btn-text">
                <span className="cyberpunk-btn-title">노래 전주 듣고 맞추기</span>
              </div>
            </div>
            <div className="cyberpunk-btn-shine" />
          </button>
          
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-left"
            onClick={() => router.push("/game/sauturi-quiz")}
          >
            <div className="cyberpunk-btn-glow" />
            <div className="cyberpunk-btn-pattern" />
            <div className="cyberpunk-btn-wave" />
            <div className="cyberpunk-btn-content">
              <svg className="cyberpunk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <div className="cyberpunk-btn-text">
                <span className="cyberpunk-btn-title">사투리로 게임하기</span>
              </div>
            </div>
            <div className="cyberpunk-btn-shine" />
          </button>
          
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-left cyberpunk-3d-btn-round"
            onClick={() => router.push("/main/playlist")}
          >
            <div className="cyberpunk-btn-glow" />
            <div className="cyberpunk-btn-pattern" />
            <div className="cyberpunk-btn-wave" />
            <div className="cyberpunk-btn-content">
              <svg className="cyberpunk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <div className="cyberpunk-btn-text">
                <span className="cyberpunk-btn-title">Our Playlist</span>
              </div>
            </div>
            <div className="cyberpunk-btn-shine" />
          </button>
        </div>

        {/* 오른쪽 Myhome과 Store */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2rem",
            flex: 1,
          }}
        >
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-right"
            onClick={() => router.push("/main/mypage")}
          >
            <div className="cyberpunk-btn-glow" />
            <div className="cyberpunk-btn-pattern" />
            <div className="cyberpunk-btn-wave" />
            <div className="cyberpunk-btn-content">
              <svg className="cyberpunk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div className="cyberpunk-btn-text">
                <span className="cyberpunk-btn-title">Myhome</span>
              </div>
            </div>
            <div className="cyberpunk-btn-shine" />
          </button>
          
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-right"
            onClick={() => router.push("/main/shop")}
          >
            <div className="cyberpunk-btn-glow" />
            <div className="cyberpunk-btn-pattern" />
            <div className="cyberpunk-btn-wave" />
            <div className="cyberpunk-btn-content">
              <svg className="cyberpunk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div className="cyberpunk-btn-text">
                <span className="cyberpunk-btn-title">STORE</span>
              </div>
            </div>
            <div className="cyberpunk-btn-shine" />
          </button>
        </div>
      </div>
    </main>
  );
}
