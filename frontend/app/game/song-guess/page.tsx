"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

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
  rounds: number;
  songsPerRound: number;
  genres: string[];
  createdAt: number;
}

export default function SongGuessPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // 백엔드에서 방 목록 불러오기
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
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
            setRooms(musicRooms);
          }
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
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

    socket.on('room_created', handleRoomCreated);
    socket.on('room_deleted', handleRoomDeleted);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_deleted', handleRoomDeleted);
    };
  }, [socket]);

  // 백엔드 방 형식을 프론트엔드 형식으로 변환
  const mapBackendRoomToFrontend = (backendRoom: BackendRoom): Room => {
    const options = backendRoom.options || {};
    return {
      id: backendRoom.id,
      name: backendRoom.title,
      currentPlayers: 0, // TODO: 실제 참가자 수를 가져와야 함
      maxPlayers: options.maxPlayers || 8,
      isLocked: backendRoom.isPrivate,
      password: backendRoom.password || undefined,
      hostId: backendRoom.hostId,
      hostName: 'Host', // TODO: 호스트 이름을 가져와야 함
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
        if (res.status === 403) {
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
          alert(error.error || '방 입장에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('방 입장에 실패했습니다.');
    }
  };

  const handleDeleteRoom = async (room: Room, e: React.MouseEvent) => {
    e.stopPropagation(); // 방 클릭 이벤트 방지

    if (!confirm('정말 이 방을 삭제하시겠습니까?')) {
      return;
    }

    const userId = localStorage.getItem('userId');
    console.log(`[DeleteRoom] Attempting to delete room ${room.id}, userId: ${userId}, room.hostId: ${room.hostId}, isHost: ${room.hostId === userId}`);
    
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      // 응답 본문 파싱
      let data: any = { success: false, error: '방 삭제에 실패했습니다.' };
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await res.text();
          if (text && text.trim()) {
            data = JSON.parse(text);
          }
        } else if (!res.ok) {
          data = { success: false, error: `서버 오류 (${res.status}): ${res.statusText}` };
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        data = { success: false, error: `서버 응답 오류 (${res.status}): ${res.statusText}` };
      }

      if (res.ok && data.success) {
        // 방 목록에서 제거
        setRooms((prevRooms) => prevRooms.filter((r) => r.id !== room.id));
        alert('방이 삭제되었습니다.');
      } else {
        const errorMessage = data.error || data.message || '방 삭제에 실패했습니다.';
        console.error('Room deletion failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
          roomId: room.id,
          userId: userId,
          responseData: data,
        });
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      const errorMessage = error.message || '방 삭제에 실패했습니다. 네트워크 오류가 발생했을 수 있습니다.';
      alert(errorMessage);
    }
  };

  // 검색 필터링
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main
      style={{
        height: "100vh",
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto",
        position: "relative",
        padding: "2rem",
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
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => router.push('/main/lobby')}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            뒤로
          </button>

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

        {/* 상단 바 - 방 생성 버튼과 검색 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
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
              flex: 1,
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

        {/* 방 목록 그리드 */}
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
                    {/* 아이콘 */}
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0, 255, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(0, 255, 255, 0.3)",
                      }}
                    >
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
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
                      onClick={(e) => handleDeleteRoom(room, e)}
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
    </main>
  );
}
