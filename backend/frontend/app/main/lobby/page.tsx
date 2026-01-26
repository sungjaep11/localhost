"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ModelViewer from '@/components/ModelViewer';

export default function LobbyPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(0);
  const [equippedCharacter, setEquippedCharacter] = useState('/character1.glb');

  // 사용자 데이터 불러오기
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    // 사용자별 코인 가져오기
    const savedCoins = localStorage.getItem(`userCoins-${userId}`);
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    } else {
      setCoins(1000);
      localStorage.setItem(`userCoins-${userId}`, '1000');
    }

    // 장착된 캐릭터 가져오기
    const equipped = localStorage.getItem(`equipped-character-${userId}`);
    setEquippedCharacter(equipped || '/character1.glb');
  }, [router]);

  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현 (세션 제거, 토큰 삭제 등)
    console.log('Logout');
    router.push('/auth/login');
  };

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
      {/* 로고 - 가운데 상단 */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push("/main/lobby")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "all 0.3s ease",
            display: "block",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.filter = "drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter = "none";
          }}
        >
          <img
            src="/logo.png"
            alt="Localhost Logo"
            style={{
              height: "250px",
              width: "auto",
            }}
          />
        </button>
      </div>

      {/* 로그아웃 버튼과 Myhome - 우측 상단 */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push("/main/mypage")}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#00ffff";
            e.currentTarget.style.textShadow = "0 0 15px rgba(0, 255, 255, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.5)";
          }}
        >
          Myhome
        </button>

        <button
          onClick={() => router.push("/main/shop")}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#00ffff";
            e.currentTarget.style.textShadow = "0 0 15px rgba(0, 255, 255, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.5)";
          }}
        >
          Store
        </button>

        {/* 코인 표시 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 215, 0, 0.5)",
            borderRadius: "20px",
            color: "#ffd700",
            fontSize: "0.9rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.3)",
          }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{
              filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))",
            }}
          >
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
            <path 
              d="M12 6v12M8 10h8M8 14h8" 
              stroke="#000" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
          <span>{coins.toLocaleString()}</span>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255, 0, 0, 0.2)",
            border: "2px solid rgba(255, 0, 0, 0.6)",
            borderRadius: "12px",
            color: "#ff4444",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 0, 0, 0.3)";
            e.currentTarget.style.borderColor = "rgba(255, 0, 0, 0.9)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 0, 0, 0.5)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 0, 0, 0.2)";
            e.currentTarget.style.borderColor = "rgba(255, 0, 0, 0.6)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          LOGOUT
        </button>
      </div>
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

      {/* 3D 캐릭터 - 화면 정중앙 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "55%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "700px",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <ModelViewer modelUrl={equippedCharacter} />
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
        {/* 왼쪽 버튼 2개 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "5rem",
            flex: 1,
            paddingTop: "4rem",
          }}
        >
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-left cyberpunk-3d-btn-parallelogram-reverse"
            onClick={() => router.push("/game/song-guess")}
            style={{
              marginLeft: "2rem",
            }}
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
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-left cyberpunk-3d-btn-parallelogram"
            onClick={() => router.push("/game/sauturi-quiz")}
            style={{
              marginRight: "2rem",
            }}
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
          
        </div>

        {/* 오른쪽 Our Playlist */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "2rem",
            flex: 1,
          }}
        >
          <button 
            type="button" 
            className="cyberpunk-3d-btn cyberpunk-3d-btn-music cyberpunk-3d-btn-round"
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
      </div>
    </main>
  );
}
