"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  characterUrl?: string; // 사용자의 캐릭터 모델 URL
  joinedAt?: number;
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

  // 현재 사용자 정보
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  // 참가자 목록 불러오기
  useEffect(() => {
    const loadPlayers = () => {
      const playersKey = `song-guess-room-${roomId}-players`;
      const storedPlayers = localStorage.getItem(playersKey);
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers);
          // 각 플레이어의 캐릭터 정보 확인 (없으면 기본 캐릭터)
          const playersWithCharacters = parsedPlayers.map((player: Player) => ({
            ...player,
            characterUrl: player.characterUrl || '/character1.glb',
          }));
          setPlayers(playersWithCharacters);
          
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
    router.push(`/game/song-guess/${roomId}/countdown`);
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
