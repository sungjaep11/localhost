"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const genres = [
  '발라드',
  'K-pop',
  'J-pop',
  '팝송',
  '댄스',
  '인디',
  'R&B',
  '힙합',
];

const STORAGE_KEY = 'song-guess-rooms';

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

export default function GenreSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rounds = parseInt(searchParams.get('rounds') || '4', 10);
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length < rounds) {
        setSelectedGenres([...selectedGenres, genre]);
      }
    }
  };

  const handleCreateRoom = () => {
    if (selectedGenres.length !== rounds) {
      alert(`라운드 개수(${rounds}개)만큼 장르를 선택해주세요.`);
      return;
    }

    // sessionStorage에서 임시 저장된 방 정보 가져오기
    const tempRoomInfo = sessionStorage.getItem('temp-room-info');
    if (!tempRoomInfo) {
      alert('방 정보를 찾을 수 없습니다. 다시 시도해주세요.');
      router.push('/game/song-guess/create');
      return;
    }

    try {
      const roomInfo = JSON.parse(tempRoomInfo);
      
      // 현재 사용자 정보 가져오기
      let currentUser = {
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

      // 새 방 생성
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: roomInfo.name,
        currentPlayers: 1, // 방장 포함
        maxPlayers: roomInfo.maxPlayers,
        isLocked: !roomInfo.isPublic,
        password: roomInfo.password,
        hostId: currentUser.id,
        hostName: currentUser.name,
        rounds: roomInfo.rounds,
        songsPerRound: roomInfo.songsPerRound,
        genres: selectedGenres,
        createdAt: Date.now(),
      };

      // localStorage에 방 추가
      const existingRooms = localStorage.getItem(STORAGE_KEY);
      const rooms: Room[] = existingRooms ? JSON.parse(existingRooms) : [];
      rooms.push(newRoom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));

      // 방장을 참가자 목록에 추가
      const playersKey = `song-guess-room-${newRoom.id}-players`;
      const hostPlayer = {
        id: currentUser.id,
        name: currentUser.name,
        isHost: true,
        joinedAt: Date.now(),
      };
      localStorage.setItem(playersKey, JSON.stringify([hostPlayer]));

      // 임시 정보 삭제
      sessionStorage.removeItem('temp-room-info');

      // 대기실로 이동
      router.push(`/game/song-guess/${newRoom.id}/waiting`);
    } catch (e) {
      console.error('Failed to create room', e);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <main
      style={{
        height: "100vh",
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
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
          maxWidth: "800px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/game/song-guess/create')}
          style={{
            position: "absolute",
            top: "2rem",
            left: "2rem",
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

        {/* 제목 */}
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "3rem",
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          게임하실 장르를 선택해주세요! ({rounds}라운드)
        </h1>

        {/* 장르 선택 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {genres.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                disabled={!isSelected && selectedGenres.length >= rounds}
                style={{
                  padding: "1.5rem",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))"
                    : "rgba(0, 0, 0, 0.6)",
                  border: isSelected
                    ? "3px solid rgba(0, 255, 255, 0.9)"
                    : "2px solid rgba(0, 255, 255, 0.4)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  cursor: !isSelected && selectedGenres.length >= rounds ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  opacity: !isSelected && selectedGenres.length >= rounds ? 0.5 : 1,
                  boxShadow: isSelected
                    ? "0 0 30px rgba(0, 255, 255, 0.5), 0 0 50px rgba(255, 0, 255, 0.3)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!(!isSelected && selectedGenres.length >= rounds)) {
                    e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* 선택된 장르 개수 표시 */}
        <div
          style={{
            marginBottom: "2rem",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "1rem",
          }}
        >
          선택된 장르: {selectedGenres.length} / {rounds}
        </div>

        {/* 방 생성하기 버튼 */}
        <button
          onClick={handleCreateRoom}
          disabled={selectedGenres.length !== rounds}
          style={{
            padding: "1.25rem 3rem",
            background: selectedGenres.length === rounds
              ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))"
              : "rgba(0, 0, 0, 0.3)",
            border: selectedGenres.length === rounds
              ? "3px solid rgba(0, 255, 255, 0.8)"
              : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            color: selectedGenres.length === rounds ? "#00ffff" : "rgba(255, 255, 255, 0.5)",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: selectedGenres.length === rounds ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: "0 auto",
          }}
          onMouseEnter={(e) => {
            if (selectedGenres.length === rounds) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(0, 255, 255, 0.6)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedGenres.length === rounds) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          방 생성하기
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </main>
  );
}
