"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  characterUrl?: string; // 사용자의 캐릭터 모델 URL
  joinedAt?: number;
  score?: number;
}

const STORAGE_KEY = 'song-guess-rooms';

// 3D 모델 컴포넌트
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2.5} position={[0, -1.2, 0]} />;
}

// 캐릭터 뷰어 컴포넌트
function CharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} />
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 현재 사용자 정보
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
  const currentUserNickname = typeof window !== 'undefined' ? localStorage.getItem('nickname') || 'Guest' : 'Guest';

  // Socket.io 연결 및 게임 방 입장
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    // Socket.io 연결
    const socket = io("http://localhost:3001", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      
      // 게임 방 입장
      socket.emit("game_join", { roomId, userId: currentUserId });
    });

    // 플레이어 목록 업데이트
    socket.on("game_players_update", (data: { players: Player[]; sessionStatus: string }) => {
      console.log("👥 Players updated:", data.players);
      const playersWithCharacters = data.players.map((player: Player) => ({
        ...player,
        characterUrl: player.characterUrl || '/character1.glb',
      }));
      setPlayers(playersWithCharacters);
      
      // 방장 여부 확인
      const hostPlayer = playersWithCharacters.find(p => p.isHost);
      setIsHost(hostPlayer?.id === currentUserId);
    });

    // 게임 시작 카운트다운
    socket.on("game_countdown_start", (data: { roomId: string; countdown: number }) => {
      console.log("⏰ Game countdown started:", data.countdown);
      router.push(`/game/song-guess/${roomId}/countdown`);
    });

    // 게임 시작
    socket.on("game_round_start", () => {
      console.log("🎮 Game round started");
      router.push(`/game/song-guess/${roomId}/play`);
    });

    // 에러 처리
    socket.on("game_error", (error: { message: string }) => {
      console.error("❌ Game error:", error.message);
      alert(error.message);
    });

    // 연결 해제 시 정리
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("game_leave", { roomId, userId: currentUserId });
        socketRef.current.disconnect();
      }
    };
  }, [roomId, currentUserId, router]);

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
    if (!socketRef.current || !isHost) return;
    
    // Socket.io를 통해 게임 시작 신호 전송
    socketRef.current.emit("game_start", {
      roomId,
      userId: currentUserId,
      options: {
        totalRounds: 10,
        roundTimeLimit: 30,
      },
    });
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

      {/* 헤더 - 현재 방 참가자 */}
      <h2
        style={{
          color: "#ffffff",
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          textAlign: "center",
        }}
      >
        현재 방 참가자
      </h2>

      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "3rem",
          alignItems: "center",
        }}
      >
        {/* 왼쪽 - Start 버튼 */}
        <div
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isHost ? (
            <button
              onClick={handleStart}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))",
                border: "4px solid rgba(0, 255, 255, 0.8)",
                color: "#00ffff",
                fontSize: "2.5rem",
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
          ) : (
            <div
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.5)",
                border: "4px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "1rem",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              방장이 게임을<br />시작할 때까지<br />기다려주세요
            </div>
          )}
        </div>

        {/* 오른쪽 - 참가자들 (3D 캐릭터) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            alignContent: "flex-start",
          }}
        >
          {players.length === 0 ? (
            <div
              style={{
                width: "100%",
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
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  position: "relative",
                }}
              >
                {/* 방장 왕관 표시 */}
                {player.isHost && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-30px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 10,
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffd700" style={{ filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))" }}>
                      <path d="M12 1L9 9l-8 2 6 5-2 8 7-4 7 4-2-8 6-5-8-2-3-8z" />
                    </svg>
                    <span
                      style={{
                        color: "#ffd700",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textShadow: "0 0 8px rgba(255, 215, 0, 0.8)",
                      }}
                    >
                      방장
                    </span>
                  </div>
                )}

                {/* 3D 캐릭터 */}
                <div
                  style={{
                    width: "150px",
                    height: "200px",
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    border: player.isHost 
                      ? "3px solid rgba(255, 215, 0, 0.8)" 
                      : "2px solid rgba(0, 255, 255, 0.5)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: player.isHost
                      ? "0 0 30px rgba(255, 215, 0, 0.4)"
                      : "0 0 20px rgba(0, 255, 255, 0.3)",
                    position: "relative",
                  }}
                >
                  <CharacterViewer modelUrl={player.characterUrl || '/character1.glb'} />
                </div>

                {/* 이름 */}
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontWeight: 600,
                    textShadow: "0 0 10px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {player.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
