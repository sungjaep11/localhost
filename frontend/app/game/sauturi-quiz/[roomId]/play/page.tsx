"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  joinedAt?: number;
}

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [currentRound] = useState(1);
  const [currentSong] = useState(4);
  const [totalSongs] = useState(10);
  const [answer, setAnswer] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);

  // 참가자 목록 불러오기
  useEffect(() => {
    const loadPlayers = () => {
      const playersKey = `sauturi-quiz-room-${roomId}-players`;
      const storedPlayers = localStorage.getItem(playersKey);
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers);
          // 점수 정보는 별도로 관리 (나중에 socket.io로 대체)
          // 현재는 기본값으로 설정
          const playersWithScore = parsedPlayers.map((p: Player) => ({
            ...p,
            score: p.score || 0,
          }));
          setPlayers(playersWithScore);
        } catch (e) {
          console.error('Failed to parse players', e);
        }
      }
    };

    loadPlayers();

    // 주기적으로 참가자 목록 업데이트 (나중에 socket.io로 대체)
    const interval = setInterval(loadPlayers, 1000);

    return () => clearInterval(interval);
  }, [roomId]);

  const host = players.find(p => p.isHost);
  const otherPlayers = players.filter(p => !p.isHost);

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
        padding: "1.5rem",
        position: "relative",
      }}
    >
      {/* 떠다니는 음표들 */}
      <div className="floating-notes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`floating-note note-${i}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        ))}
      </div>

      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          Localhost
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          Round {currentRound} {currentSong}/{totalSongs}
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "2rem",
        }}
      >
        {/* 왼쪽 - 방장 캐릭터 */}
        {host && (
          <div
            style={{
              width: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {/* 방장 캐릭터 - 크게 */}
            <div
              style={{
                width: "200px",
                height: "200px",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "3px solid rgba(255, 215, 0, 0.8)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)",
                position: "relative",
              }}
            >
              {/* 방장 표시 */}
              <div
                style={{
                  position: "absolute",
                  top: "-15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255, 215, 0, 0.9)",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  color: "#000",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                방장
              </div>

              {/* 캐릭터 아이콘 */}
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* 방장 이름 */}
            <div
              style={{
                color: "#ffffff",
                fontSize: "1.3rem",
                fontWeight: 700,
                textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
              }}
            >
              {host.name}
            </div>

            {/* 재생 컨트롤 */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 255, 0.2)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                  color: "#00ffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 255, 0.2)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                  color: "#00ffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 중앙 - 정답 입력 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(15px)",
              border: "3px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "20px",
              padding: "3rem",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 0 50px rgba(0, 255, 255, 0.4)",
            }}
          >
            <h2
              style={{
                color: "#00ffff",
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                textAlign: "center",
                textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
              }}
            >
              정답
            </h2>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="정답을 입력하세요"
              style={{
                width: "100%",
                padding: "1.5rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1.2rem",
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* 오른쪽 - 다른 플레이어들 */}
        <div
          style={{
            width: "250px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          {otherPlayers.map((player) => (
            <div
              key={player.id}
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {/* 캐릭터 아이콘 */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(0, 255, 255, 0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* 이름과 점수 */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {player.name}
                </div>
                {player.score !== undefined && (
                  <div
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {player.score}P
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 오른쪽 끝 - 채팅 패널 */}
        <div
          style={{
            width: "300px",
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 150px)",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(0, 255, 255, 0.3)",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            채팅
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
              minHeight: "200px",
            }}
          >
            <div
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#00ffff", fontWeight: 600 }}>박찬우박:</span> 아틀란티스소녀 보아
            </div>
          </div>
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid rgba(0, 255, 255, 0.3)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              placeholder="메시지 입력..."
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(0, 255, 255, 0.2)",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
