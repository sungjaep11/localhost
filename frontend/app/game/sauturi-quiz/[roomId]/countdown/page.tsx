"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt?: number;
  character?: string;
  characterUrl?: string;
  score?: number;
}

const PLAYERS_KEY = (rid: string) => `sauturi-quiz-room-${rid}-players`;

export default function CountdownPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState(3);
  const [players, setPlayers] = useState<Player[]>([]);
  const hasJoinedRef = useRef(false);

  // 참가자 목록 불러오기 (localStorage) + 주기적 리로드로 play 진입 전 데이터 확보
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem(PLAYERS_KEY(roomId));
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Player[];
          setPlayers((prev) => (prev.length > 0 ? prev : parsed));
        } catch (e) {
          console.error('Failed to parse players', e);
        }
      }
    };
    load();
    const t = setInterval(load, 400);
    return () => clearInterval(t);
  }, [roomId]);

  // 소켓: game_join → game_players_update 수신 시 play용 형식으로 localStorage 저장 (게임 시작 시 캐릭터/플레이어 복구)
  useEffect(() => {
    if (!socket || !roomId) return;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') ?? '' : '';
    if (!userId) return;

    const handlePlayersUpdate = (data: {
      roomId: string;
      players: Array<{ id: string; name: string; isHost: boolean; joinedAt: number }>;
    }) => {
      if (data.roomId !== roomId) return;
      const forPlay = data.players.map((p) => {
        const url =
          typeof window !== 'undefined'
            ? localStorage.getItem(`equipped-character-${p.id}`) || '/character1.glb'
            : '/character1.glb';
        return {
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          joinedAt: p.joinedAt,
          character: url,
          characterUrl: url,
          score: 0,
        };
      });
      try {
        localStorage.setItem(PLAYERS_KEY(roomId), JSON.stringify(forPlay));
        setPlayers((prev) => (prev.length > 0 ? prev : forPlay));
      } catch (_) {}
    };

    socket.on('game_players_update', handlePlayersUpdate);

    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.emit('game_join', { roomId, userId });
    }

    return () => {
      socket.off('game_players_update', handlePlayersUpdate);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // 카운트다운이 끝나면 게임 화면으로 이동
      setTimeout(() => {
        router.push(`/game/sauturi-quiz/${roomId}/play`);
      }, 500);
    }
  }, [countdown, router, roomId]);

  return (
    <main className="lobby-premium-root">
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
            <div key={i} className={`lobby-particle ${isPurple ? 'lobby-particle-purple' : ''} ${size}`} style={{ left: `${8 + (i % 10) * 8}%`, top: `${8 + (Math.floor(i / 10) % 4) * 22}%`, animationDelay: `${(i * 0.4) % 8}s`, animationDuration: `${10 + (i % 5)}s` }} />
          );
        })}
      </div>
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.75rem', width: '100%' }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "3rem",
          alignItems: "center",
          boxSizing: "border-box",
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

        {/* 오른쪽 - 대기방(참가자들), 칸 늘림 */}
        <div
          style={{
            flex: 1,
            marginRight: "96px",
            maxWidth: "420px",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          {players.map((player) => (
            <div
              key={player.id}
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "18px",
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                position: "relative",
              }}
            >
              {/* 방장 표시 */}
              {player.isHost && (
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    left: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255, 215, 0, 0.9)",
                    padding: "0.35rem 0.9rem",
                    borderRadius: "20px",
                    color: "#000",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  방장
                </div>
              )}

              {/* 캐릭터 아이콘 */}
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  background: "rgba(0, 255, 255, 0.1)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                }}
              >
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* 이름 */}
              <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 600 }}>
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
      </div>
    </main>
  );
}
