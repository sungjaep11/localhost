"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'sauturi-quiz-rooms';

export default function SauturiQuizPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);

  // localStorage에서 방 목록 불러오기 (최신순 정렬)
  useEffect(() => {
    const storedRooms = localStorage.getItem(STORAGE_KEY);
    if (storedRooms) {
      try {
        const parsedRooms = JSON.parse(storedRooms);
        // 최신순 정렬 (createdAt 내림차순)
        const sortedRooms = parsedRooms.sort((a: Room, b: Room) => b.createdAt - a.createdAt);
        setRooms(sortedRooms);
      } catch (e) {
        console.error('Failed to parse rooms from localStorage', e);
      }
    }
  }, []);

  // 방 목록 업데이트 함수
  const updateRooms = (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
  };

  const handleCreateRoom = () => {
    router.push('/game/sauturi-quiz/create');
  };

  const handleJoinRoom = (room: Room) => {
    // 최대 인원수 체크
    if (room.currentPlayers >= room.maxPlayers) {
      alert('방이 가득 찼습니다.');
      return;
    }

    // 현재 사용자 정보 가져오기
    const currentUser = {
      id: localStorage.getItem('userId') || `user-${Date.now()}`,
      name: localStorage.getItem('userName') || '사용자',
    };

    // userId와 userName이 없으면 저장
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', currentUser.id);
    }
    if (!localStorage.getItem('userName')) {
      const userName = prompt('이름을 입력하세요:') || '사용자';
      localStorage.setItem('userName', userName);
      currentUser.name = userName;
    }

    if (room.isLocked) {
      // 비밀번호 입력
      const password = prompt('비밀번호를 입력하세요:');
      if (password && password === room.password) {
        // 참가자 추가
        addPlayerToRoom(room.id, currentUser);
        router.push(`/game/sauturi-quiz/${room.id}/waiting`);
      } else if (password) {
        alert('비밀번호가 일치하지 않습니다.');
      }
    } else {
      // 참가자 추가
      addPlayerToRoom(room.id, currentUser);
      router.push(`/game/sauturi-quiz/${room.id}/waiting`);
    }
  };

  // 방에 참가자 추가 함수
  const addPlayerToRoom = (roomId: string, player: { id: string; name: string }) => {
    const playersKey = `sauturi-quiz-room-${roomId}-players`;
    const existingPlayers = localStorage.getItem(playersKey);
    const players = existingPlayers ? JSON.parse(existingPlayers) : [];
    
    // 이미 참가한 경우 체크
    if (players.find((p: any) => p.id === player.id)) {
      return;
    }

    // 사용자의 장착된 캐릭터 가져오기
    const equippedCharacter = localStorage.getItem(`equipped-character-${player.id}`) || '/character1.glb';

    // 참가자 추가
    const newPlayer = {
      id: player.id,
      name: player.name,
      isHost: false,
      characterUrl: equippedCharacter,
      joinedAt: Date.now(),
    };
    players.push(newPlayer);
    localStorage.setItem(playersKey, JSON.stringify(players));

    // 방의 참여자 수 증가
    const updatedRooms = rooms.map(r => 
      r.id === roomId 
        ? { ...r, currentPlayers: r.currentPlayers + 1 }
        : r
    );
    updateRooms(updatedRooms);
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
            사투리 게임하기
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
          {filteredRooms.length === 0 ? (
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
            filteredRooms.map((room) => (
              <button
                key={room.id}
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
