"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt?: number;
}

const STORAGE_KEY = 'sauturi-quiz-rooms';

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);

  // 현재 사용자 정보
  const currentUserId = localStorage.getItem('userId') || '';

  // 참가자 목록 불러오기
  useEffect(() => {
    const loadPlayers = () => {
      const playersKey = `sauturi-quiz-room-${roomId}-players`;
      const storedPlayers = localStorage.getItem(playersKey);
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers);
          setPlayers(parsedPlayers);
          
          // 방장 여부 확인
          const room = getRoomInfo();
          if (room) {
            setIsHost(room.hostId === currentUserId);
          }
        } catch (e) {
          console.error('Failed to parse players', e);
        }
      }
    };

    loadPlayers();

    // 주기적으로 참가자 목록 업데이트 (나중에 socket.io로 대체)
    const interval = setInterval(loadPlayers, 1000);

    return () => clearInterval(interval);
  }, [roomId, currentUserId]);

  // 방 정보 가져오기
  const getRoomInfo = () => {
    const storedRooms = localStorage.getItem(STORAGE_KEY);
    if (storedRooms) {
      try {
        const rooms = JSON.parse(storedRooms);
        return rooms.find((r: any) => r.id === roomId);
      } catch (e) {
        console.error('Failed to parse rooms', e);
      }
    }
    return null;
  };

  const handleStart = () => {
    router.push(`/game/sauturi-quiz/${roomId}/countdown`);
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
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
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

      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1200px",
          gap: "3rem",
          alignItems: "center",
        }}
      >
        {/* 왼쪽 - Start 버튼 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {isHost && (
            <button
              onClick={handleStart}
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))",
                border: "4px solid rgba(0, 255, 255, 0.8)",
                color: "#00ffff",
                fontSize: "2rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                boxShadow: "0 0 50px rgba(0, 255, 255, 0.5)",
                letterSpacing: "0.1em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 1)";
                e.currentTarget.style.boxShadow = "0 0 80px rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = "0 0 50px rgba(0, 255, 255, 0.5)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Start!
            </button>
          )}
        </div>

        {/* 오른쪽 - 참가자들 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          <h2
            style={{
              color: "#ffffff",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
              textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
            }}
          >
            현재 방 참가자
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1.5rem",
            }}
          >
            {players.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "2rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "1rem",
                }}
              >
                아직 참가자가 없습니다. 다른 사용자들이 입장할 때까지 기다려주세요.
              </div>
            ) : (
              players.map((player) => (
              <div
                key={player.id}
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(0, 255, 255, 0.5)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  position: "relative",
                }}
              >
                {/* 방장 표시 */}
                {player.isHost && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(255, 215, 0, 0.9)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      color: "#000",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    방장
                  </div>
                )}

                {/* 캐릭터 아이콘 */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "rgba(0, 255, 255, 0.1)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* 이름 */}
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {player.name}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
