"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt?: number;
}

export default function CountdownPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [countdown, setCountdown] = useState(3);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // 네비게이션 중복 방지
  const hasNavigatedRef = useRef(false);

  // 참가자 목록 불러오기
  useEffect(() => {
    const playersKey = `song-guess-room-${roomId}-players`;
    const storedPlayers = localStorage.getItem(playersKey);
    if (storedPlayers) {
      try {
        const parsedPlayers = JSON.parse(storedPlayers);
        setPlayers(parsedPlayers);
      } catch (e) {
        console.error('Failed to parse players', e);
      }
    }
  }, [roomId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!hasNavigatedRef.current) {
      // 카운트다운이 끝나면 게임 화면으로 이동 (한 번만)
      hasNavigatedRef.current = true;
      const timer = setTimeout(() => {
        router.push(`/game/song-guess/${roomId}/play`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown, router, roomId]);

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
        {/* 왼쪽 - 카운트다운 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              border: "4px solid rgba(0, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 80px rgba(0, 255, 255, 0.6)",
            }}
          >
            <div
              style={{
                fontSize: "8rem",
                fontWeight: 900,
                color: "#00ffff",
                textShadow: 
                  "0 0 30px rgba(0, 255, 255, 1), " +
                  "0 0 60px rgba(255, 0, 255, 0.8), " +
                  "0 0 90px rgba(0, 255, 255, 0.6)",
                animation: countdown > 0 ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              {countdown > 0 ? countdown : 'GO!'}
            </div>
          </div>
        </div>

        {/* 오른쪽 - 참가자들 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {players.map((player) => (
            <div
              key={player.id}
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "16px",
                padding: "1rem 1.5rem",
                display: "flex",
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
                    top: "-8px",
                    left: "1rem",
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
                  width: "60px",
                  height: "60px",
                  background: "rgba(0, 255, 255, 0.1)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* 이름 */}
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {player.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </main>
  );
}
