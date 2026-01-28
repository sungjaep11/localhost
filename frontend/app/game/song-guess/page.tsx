"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useSocket } from '@/context/SocketContext';
import { RoomDeleteModal, type RoomDeleteModalMode } from '@/components/ui/RoomDeleteModal';
import { toDefaultCharacterPath } from '@/lib/character-paths';
import * as THREE from 'three';

interface BackendRoom {
  id: string;
  title: string;
  isPrivate: boolean;
  password?: string | null;
  type: string;
  status: string;
  hostId: string;
  createdAt: string;
  options?: any;
  hostCharacterUrl?: string | null;
}

interface Room {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  isLocked: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  hostCharacterUrl?: string;
  rounds: number;
  songsPerRound: number;
  genres: string[];
  createdAt: number;
}

// 방 카드용 작은 3D 캐릭터 (방장) — default_characters/ 에서 로드
function RoomCardModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toDefaultCharacterPath(url || '').replace(/ /g, '%20');
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useEffect(() => { Object.values(actions).forEach(a => a?.stop()); }, [actions]);
  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -0.8 : -0.5;
  const scale = isCharacter1 ? 1.2 : 1.6;
  // Y: 옆모습, X: 살짝 위를 보게 (양수 = 머리 들어올림)
  const rotation: [number, number, number] = [0.15, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function RoomCardCharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 1, 2.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <RoomCardModel url={modelUrl} />
      </Canvas>
    </div>
  );
}

export default function SongGuessPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    mode: RoomDeleteModalMode;
    message?: string;
    roomToDelete: Room | null;
  }>({ open: false, mode: 'confirm', roomToDelete: null });

  // 백엔드에서 방 목록 불러오기
  useEffect(() => {
    const fetchRooms = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const userId = localStorage.getItem('userId') || '';
        const res = await fetch('/api/games/rooms?page=1&pageSize=50', {
          headers: userId ? { 'x-user-id': userId } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.rooms) {
            // MUSIC_QUIZ 타입만 필터링
            const musicRooms = data.rooms
              .filter((room: BackendRoom) => room.type === 'MUSIC_QUIZ' && room.status === 'WAITING')
              .map((room: BackendRoom) => mapBackendRoomToFrontend(room));

            // 데이터가 실제로 변경되었을 때만 업데이트 (깜빡임 방지)
            setRooms((prevRooms) => {
              // 방 ID와 currentPlayers를 비교하여 변경사항 확인
              if (prevRooms.length !== musicRooms.length) {
                return musicRooms;
              }

              // Map을 사용하여 더 정확한 비교
              const prevRoomsMap = new Map(prevRooms.map(r => [r.id, r]));
              const hasChanged = musicRooms.some((newRoom: Room) => {
                const prevRoom = prevRoomsMap.get(newRoom.id);
                return !prevRoom ||
                  prevRoom.currentPlayers !== newRoom.currentPlayers ||
                  prevRoom.name !== newRoom.name ||
                  prevRoom.hostCharacterUrl !== newRoom.hostCharacterUrl;
              });

              return hasChanged ? musicRooms : prevRooms;
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    // 초기 로드 시에만 loading 표시
    fetchRooms(true);

    // 주기적으로 방 목록 새로고침 (플레이어 수 업데이트) - loading 없이
    const interval = setInterval(() => fetchRooms(false), 5000); // 5초마다 새로고침 (간격 증가)

    return () => clearInterval(interval);
  }, []);

  // 소켓 이벤트 리스너: 새 방 생성 시 업데이트
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (data: { room: BackendRoom }) => {
      if (data.room.type === 'MUSIC_QUIZ' && data.room.status === 'WAITING') {
        const newRoom = mapBackendRoomToFrontend(data.room);
        setRooms((prevRooms) => [newRoom, ...prevRooms]);
      }
    };

    const handleRoomDeleted = (data: { roomId: string }) => {
      setRooms((prevRooms) => prevRooms.filter((r) => r.id !== data.roomId));
    };

    const handleRoomStatusChanged = (data: { roomId: string; status: string }) => {
      if (data.status === 'PLAYING') {
        setRooms((prevRooms) => prevRooms.filter((r) => r.id !== data.roomId));
      }
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('room_deleted', handleRoomDeleted);
    socket.on('room_status_changed', handleRoomStatusChanged);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_deleted', handleRoomDeleted);
      socket.off('room_status_changed', handleRoomStatusChanged);
    };
  }, [socket]);

  // 백엔드 방 형식을 프론트엔드 형식으로 변환
  const mapBackendRoomToFrontend = (backendRoom: BackendRoom): Room => {
    const options = backendRoom.options || {};
    return {
      id: backendRoom.id,
      name: backendRoom.title,
      currentPlayers: (backendRoom as any).currentPlayers ?? 0, // 백엔드에서 받은 실제 참가자 수 사용
      maxPlayers: options.maxPlayers || 8,
      isLocked: backendRoom.isPrivate,
      password: backendRoom.password || undefined,
      hostId: backendRoom.hostId,
      hostName: 'Host', // TODO: 호스트 이름을 가져와야 함
      hostCharacterUrl: backendRoom.hostCharacterUrl ?? undefined,
      rounds: options.rounds || 4,
      songsPerRound: options.songsPerRound || 1,
      genres: options.genres || [],
      createdAt: new Date(backendRoom.createdAt).getTime(),
    };
  };

  const handleCreateRoom = () => {
    router.push('/game/song-guess/create');
  };

  const handleJoinRoom = async (room: Room) => {
    // 최대 인원수 체크
    if (room.currentPlayers >= room.maxPlayers) {
      alert('방이 가득 찼습니다.');
      return;
    }

    // 현재 사용자 정보 가져오기
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    try {
      // 백엔드 API를 통해 방 입장
      const res = await fetch('/api/games/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          roomId: room.id,
          password: room.isLocked ? undefined : undefined, // 비밀번호는 프롬프트로 받아야 함
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          router.push(`/game/song-guess/${room.id}/waiting`);
        } else {
          alert(data.error || '방 입장에 실패했습니다.');
        }
      } else {
        const error = await res.json();
        const msg = error.error || error.message || '방 입장에 실패했습니다.';
        if (res.status === 403) {
          // 게임이 이미 진행 중인 경우 비밀번호 프롬프트 없이 메시지만 표시
          if (msg.includes('진행 중') || msg.includes('progress')) {
            alert(msg);
            return;
          }
          // 비밀번호 필요
          const password = prompt('비밀번호를 입력하세요:');
          if (password) {
            const retryRes = await fetch('/api/games/rooms/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
              },
              body: JSON.stringify({
                roomId: room.id,
                password: password,
              }),
            });
            if (retryRes.ok) {
              router.push(`/game/song-guess/${room.id}/waiting`);
            } else {
              alert('비밀번호가 일치하지 않습니다.');
            }
          }
        } else {
          alert(msg);
        }
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다.');
    }
  };

  const handleDeleteRoomClick = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setDeleteModal({ open: true, mode: 'error', message: '로그인이 필요합니다.', roomToDelete: null });
      return;
    }
    setDeleteModal({ open: true, mode: 'confirm', roomToDelete: room });
  };

  const performDeleteRoom = async (room: Room) => {
    const userId = localStorage.getItem('userId') || '';
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      let data: any = { success: false, error: '방 삭제에 실패했습니다.' };
      try {
        const ct = res.headers.get('content-type');
        if (ct?.includes('application/json')) data = await res.json();
        else if (!res.ok) data = { success: false, error: `서버 오류 (${res.status}): ${res.statusText}` };
      } catch {
        if (!res.ok) data = { success: false, error: `서버 응답 오류 (${res.status})` };
      }
      if (res.ok && data.success) {
        setRooms((prev) => prev.filter((r) => r.id !== room.id));
        setDeleteModal({ open: true, mode: 'success', roomToDelete: null });
      } else {
        const msg = data.error || data.message || '방 삭제에 실패했습니다.';
        setDeleteModal({ open: true, mode: 'error', message: msg, roomToDelete: null });
      }
    } catch (err: any) {
      const msg = err?.message || '방 삭제에 실패했습니다. 네트워크 오류가 발생했을 수 있습니다.';
      setDeleteModal({ open: true, mode: 'error', message: msg, roomToDelete: null });
    }
  };

  const handleDeleteModalConfirm = () => {
    if (deleteModal.mode === 'confirm' && deleteModal.roomToDelete) {
      performDeleteRoom(deleteModal.roomToDelete);
      return;
    }
    setDeleteModal({ open: false, mode: 'confirm', roomToDelete: null });
  };

  const handleDeleteModalCancel = () => {
    setDeleteModal({ open: false, mode: 'confirm', roomToDelete: null });
  };

  // 검색 필터링
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div style={{ position: 'relative', zIndex: 10, flex: 1, minHeight: 0, overflowX: 'hidden', overflowY: 'auto', padding: '1rem 0.75rem', width: '100%' }}>
      <RoomDeleteModal
        open={deleteModal.open}
        mode={deleteModal.mode}
        message={deleteModal.message}
        onConfirm={handleDeleteModalConfirm}
        onCancel={deleteModal.mode === "confirm" ? handleDeleteModalCancel : undefined}
      />
      <div
        style={{
          width: "100%",
          padding: "0 0.5rem",
          boxSizing: "border-box",
        }}
      >
        {/* 헤더 — 로고(홈) + 제목 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => router.push('/main/lobby')}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                lineHeight: 0,
                transition: "transform 0.2s ease, filter 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.filter = "drop-shadow(0 0 12px rgba(0, 255, 255, 0.5))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.filter = "none";
              }}
              aria-label="홈으로"
            >
              <img src="/logo2.png" alt="LOCAL HOST" style={{ height: "120px", width: "auto" }} />
            </button>
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #00ffff, #ff00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
            }}
          >
            노래 맞추기
          </h1>

          <div style={{ width: "100px" }} /> {/* 공간 맞추기 */}
        </div>

        {/* 상단 바 - 방 생성 버튼과 검색, 가운데 유지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {/* + 버튼 */}
          <button
            onClick={handleCreateRoom}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(0, 255, 255, 0.2)",
              border: "3px solid rgba(0, 255, 255, 0.6)",
              color: "#00ffff",
              fontSize: "2rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            +
          </button>

          {/* 검색 바 */}
          <div
            style={{
              width: "800px",
              maxWidth: "95%",
              position: "relative",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="방 검색하기"
              style={{
                width: "100%",
                padding: "1rem 3rem 1rem 1.5rem",
                background: "rgba(0, 0, 0, 0.6)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1rem",
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#00ffff",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* 방 목록 그리드 — 검색창 너비(800px)에 맞춰 가운데 */}
        <div style={{ maxWidth: "800px", width: "95%", margin: "0 auto", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "1.2rem",
              }}
            >
              방 목록을 불러오는 중...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "1.2rem",
              }}
            >
              생성된 방이 없습니다. + 버튼을 눌러 방을 만들어보세요!
            </div>
          ) : (
            filteredRooms.map((room) => {
              const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
              const isRoomHost = room.hostId === currentUserId;

              return (
                <div
                  key={room.id}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => handleJoinRoom(room)}
                    disabled={room.currentPlayers >= room.maxPlayers}
                    style={{
                      background: room.currentPlayers >= room.maxPlayers
                        ? "rgba(0, 0, 0, 0.4)"
                        : "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                      border: room.currentPlayers >= room.maxPlayers
                        ? "2px solid rgba(255, 0, 0, 0.5)"
                        : "2px solid rgba(0, 255, 255, 0.5)",
                      borderRadius: "16px",
                      padding: "1.5rem",
                      cursor: room.currentPlayers >= room.maxPlayers ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      textAlign: "center",
                      opacity: room.currentPlayers >= room.maxPlayers ? 0.6 : 1,
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (room.currentPlayers < room.maxPlayers) {
                        e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                        e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.4)";
                        e.currentTarget.style.transform = "translateY(-5px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (room.currentPlayers < room.maxPlayers) {
                        e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {/* 방장 캐릭터 */}
                    <div
                      style={{
                        width: "80px",
                        height: "100px",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0, 255, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(0, 255, 255, 0.3)",
                        overflow: "hidden",
                      }}
                    >
                      <RoomCardCharacterViewer modelUrl={room.hostCharacterUrl || '/character1.glb'} />
                    </div>

                    {/* 방 이름 */}
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                      }}
                    >
                      {room.name}
                    </div>

                    {/* 인원 수 */}
                    <div
                      style={{
                        color: room.currentPlayers >= room.maxPlayers
                          ? "rgba(255, 0, 0, 0.8)"
                          : "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.9rem",
                        fontWeight: room.currentPlayers >= room.maxPlayers ? 700 : 400,
                      }}
                    >
                      ({room.currentPlayers}/{room.maxPlayers})
                      {room.currentPlayers >= room.maxPlayers && (
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                          (가득참)
                        </span>
                      )}
                    </div>

                    {/* 자물쇠 아이콘 */}
                    {room.isLocked && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "1rem",
                          right: "1rem",
                          color: "#ffd700",
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* 방 삭제 버튼 (방장만) */}
                  {isRoomHost && (
                    <button
                      onClick={(e) => handleDeleteRoomClick(room, e)}
                      style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(255, 0, 0, 0.7)",
                        border: "2px solid rgba(255, 0, 0, 0.9)",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 0, 0, 0.9)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 0, 0, 0.7)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="방 삭제"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>
      </div>
      </div>
    </main>
  );
}
