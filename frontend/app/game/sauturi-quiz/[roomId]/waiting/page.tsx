"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useSocket } from '@/context/SocketContext';
import { toDisplayModelUrl, toDefaultCharacterPath } from '@/lib/character-paths';
import * as THREE from 'three';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  characterUrl?: string; // 사용자의 캐릭터 모델 URL
  joinedAt?: number;
}

const STORAGE_KEY = 'sauturi-quiz-rooms';

// 3D 모델 — default_characters/ 에서 로드
function Model({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toDefaultCharacterPath(url || '').replace(/ /g, '%20');
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useEffect(() => { Object.values(actions).forEach(a => a?.stop()); }, [actions]);
  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -0.8 : -0.4;
  const scale = isCharacter1 ? 1.5 : 2.1;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function CharacterViewer({ modelUrl }: { modelUrl: string }) {
  const displayUrl = toDisplayModelUrl(modelUrl);
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0.2, 2.7], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={displayUrl} />
        <OrbitControls autoRotate={false} enableZoom={false} enablePan={false} enableRotate={true} />
      </Canvas>
    </div>
  );
}

const PREVIEW_ROOM_ID = 'preview-room';

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { socket, isConnected } = useSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const isPreview = roomId === PREVIEW_ROOM_ID;

  // 현재 사용자 정보 - useState로 관리하여 무한 렌더 방지
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // 중복 조인 방지용 ref
  const hasJoinedRef = useRef(false);

  // 미리보기 모드: 현재 로그인 사용자를 방장으로 넣어서 게임 시작 가능
  useEffect(() => {
    if (!isPreview || typeof window === 'undefined') return;
    const userId = localStorage.getItem('userId') || 'preview';
    const userName = localStorage.getItem('userName') || '미리보기';
    const char = localStorage.getItem(`equipped-character-${userId}`) || '/character1.glb';
    const me: Player = { id: userId, name: userName, isHost: true, characterUrl: char };
    setPlayers([me]);
    setIsHost(true);
    hasJoinedRef.current = true;
    try {
      localStorage.setItem(
        `sauturi-quiz-room-${PREVIEW_ROOM_ID}-players`,
        JSON.stringify([{ id: userId, name: userName, isHost: true, character: char, score: 0 }])
      );
    } catch (_) {}
  }, [isPreview]);

  // 컴포넌트 마운트 시 한 번만 userId 로드
  useEffect(() => {
    const userId = localStorage.getItem('userId') || '';
    setCurrentUserId(userId);
  }, []);

  // -------------------------------------------------------------
  // [수정된 부분] 소켓 연결 로직 (무한 루프 방지 버전)
  // -------------------------------------------------------------

  // 1. 소켓 이벤트 리스너 등록 (미리보기 시 스킵)
  useEffect(() => {
    if (isPreview || !socket || !roomId) return;

    // 플레이어 목록 업데이트 리스너 (서버에서 각 유저의 character/characterUrl 전달 — 선택한 캐릭터로 표시)
    const handlePlayersUpdate = (data: { 
      roomId: string; 
      players: Array<{ id: string; name: string; isHost: boolean; joinedAt: number; character?: string; characterUrl?: string }>;
      sessionStatus: string;
    }) => {
      if (data.roomId === roomId) {
        const playersWithCharacters = data.players.map((player) => {
          const fromServer = player.character ?? player.characterUrl;
          const url = toDisplayModelUrl(fromServer || '/character1.glb');
          return {
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            characterUrl: url,
            character: url,
            joinedAt: player.joinedAt,
          };
        });
        
        // 플레이 페이지 재입장 시 복구용: 같은 키에 저장 (캐릭터/UI가 다시 뜨도록)
        if (typeof window !== 'undefined' && playersWithCharacters.length > 0) {
          try {
            const forPlay = playersWithCharacters.map((p) => ({
              ...p,
              character: p.characterUrl,
              score: 0,
            }));
            localStorage.setItem(`sauturi-quiz-room-${roomId}-players`, JSON.stringify(forPlay));
          } catch (_) {}
        }
        
        // 중요: 무한 렌더링 방지를 위해 값이 실제로 다를 때만 setState 호출
        setPlayers(prev => {
          if (JSON.stringify(prev) === JSON.stringify(playersWithCharacters)) return prev;
          return playersWithCharacters;
        });
        
        // 현재 사용자가 방장인지 확인
        const currentPlayer = playersWithCharacters.find(p => p.id === currentUserId);
        const hostStatus = currentPlayer?.isHost || false;
        console.log(`[WaitingRoom] Current user: ${currentUserId}, isHost: ${hostStatus}`);
        setIsHost(prev => prev === hostStatus ? prev : hostStatus);
      }
    };

    // 게임 시작 리스너
    const handleGameStart = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        router.push(`/game/sauturi-quiz/${roomId}/countdown`);
      }
    };

    // 에러 리스너
    const handleGameError = (data: { message: string }) => {
      console.error('Game error:', data.message);
      alert(data.message);
    };

    socket.on('game_players_update', handlePlayersUpdate);
    socket.on('game_countdown_start', handleGameStart);
    socket.on('game_error', handleGameError);

    // Cleanup: 리스너만 제거 (game_leave 절대 하지 않음!)
    return () => {
      socket.off('game_players_update', handlePlayersUpdate);
      socket.off('game_countdown_start', handleGameStart);
      socket.off('game_error', handleGameError);
    };
  }, [socket, roomId, currentUserId, router]);

  // 2. 방 입장 처리 (퇴장 로직 완전 제거, 미리보기 시 스킵). 캐릭터 URL 전송 → 다른 유저에게 선택한 캐릭터로 보이게
  useEffect(() => {
    if (isPreview) return;
    if (socket && roomId && currentUserId && !hasJoinedRef.current) {
      console.log('[WaitingRoom] Joining game room:', roomId);
      const char = typeof window !== 'undefined'
        ? toDisplayModelUrl(localStorage.getItem(`equipped-character-${currentUserId}`) || '/character1.glb')
        : '/character1.glb';
      socket.emit('game_join', { roomId, userId: currentUserId, characterUrl: char });
      hasJoinedRef.current = true;
    }
  }, [isPreview, socket, roomId, currentUserId]);

  // -------------------------------------------------------------

  const handleStart = () => {
    if (isPreview) {
      router.push(`/game/sauturi-quiz/${PREVIEW_ROOM_ID}/countdown`);
      return;
    }
    if (!socket || !roomId || !currentUserId) {
      if (!currentUserId) {
        alert('로그인 정보가 없습니다. 새로고침 후 다시 시도해 주세요.');
        return;
      }
      if (!socket || !isConnected) {
        alert('서버와 연결 중입니다. 잠시 후 다시 시작해 주세요.');
        return;
      }
      return;
    }
    console.log(`[WaitingRoom] Starting game: roomId=${roomId}, userId=${currentUserId}, isHost=${isHost}`);
    socket.emit('game_start', { roomId, userId: currentUserId, options: {} });
  };

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
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 0.75rem', width: '100%', boxSizing: 'border-box' }}>
      {/* 헤더 - 뒤로가기 버튼과 현재 방 참가자 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => router.push('/game/sauturi-quiz')}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            color: "#00ffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
            fontSize: "1rem",
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          뒤로
        </button>

        <h2
          style={{
            color: "#ffffff",
            fontSize: "1.5rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
            textAlign: "center",
            flex: 1,
          }}
        >
          현재 방 참가자
        </h2>

        <div style={{ width: "100px" }} /> {/* 공간 맞추기 */}
      </div>

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
              disabled={!socket || !isConnected || !currentUserId}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: !socket || !isConnected || !currentUserId
                  ? "rgba(80, 80, 80, 0.5)"
                  : "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))",
                border: "4px solid rgba(0, 255, 255, 0.8)",
                color: !socket || !isConnected || !currentUserId ? "rgba(255,255,255,0.5)" : "#00ffff",
                fontSize: "2.5rem",
                fontWeight: 800,
                cursor: !socket || !isConnected || !currentUserId ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                boxShadow: "0 0 50px rgba(0, 255, 255, 0.5)",
                letterSpacing: "0.1em",
              }}
              onMouseEnter={(e) => {
                if (socket && isConnected && currentUserId) {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))";
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 1)";
                  e.currentTarget.style.boxShadow = "0 0 80px rgba(0, 255, 255, 0.8)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (socket && isConnected && currentUserId) {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(0, 255, 255, 0.5)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {!socket || !isConnected ? "연결 중..." : !currentUserId ? "로그인 필요" : "Start!"}
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

        {/* 오른쪽 - 참가자들 (3D 캐릭터), 칸 조금 늘리고 왼쪽으로 */}
        <div
          style={{
            flex: 1,
            marginRight: "96px",
            maxWidth: "440px",
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
                <div style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 600, textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}>
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
