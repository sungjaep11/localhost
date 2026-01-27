"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

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

const STORAGE_KEY = 'sauturi-quiz-rooms';

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

// useSearchParams를 사용하는 내부 컴포넌트
function GenreSelectionContent() {
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

  const handleCreateRoom = async () => {
    if (selectedGenres.length !== rounds) {
      alert(`라운드 개수(${rounds}개)만큼 장르를 선택해주세요.`);
      return;
    }

    // sessionStorage에서 임시 저장된 방 정보 가져오기
    const tempRoomInfo = sessionStorage.getItem('temp-room-info');
    if (!tempRoomInfo) {
      alert('방 정보를 찾을 수 없습니다. 다시 시도해주세요.');
      router.push('/game/sauturi-quiz/create');
      return;
    }

    try {
      const roomInfo = JSON.parse(tempRoomInfo);
      
      // 현재 사용자 정보 가져오기
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        router.push('/auth/login');
        return;
      }

      // 백엔드 API를 통해 방 생성
      const res = await fetch('/api/games/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title: roomInfo.name,
          isPrivate: !roomInfo.isPublic,
          password: roomInfo.password || undefined,
          gameType: 'DIALECT', // DIALECT_QUIZ 타입
          options: {
            rounds: roomInfo.rounds,
            songsPerRound: roomInfo.songsPerRound,
            genres: selectedGenres,
            maxPlayers: roomInfo.maxPlayers || 8,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        const errorMessage = error.error || error.message || '방 생성에 실패했습니다.';
        
        // Invalid user id 오류인 경우 로그인 페이지로 리다이렉트
        if (errorMessage.includes('Invalid user id') || res.status === 401) {
          alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('userId');
          router.push('/auth/login');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.success) {
        const errorMessage = data.error || '방 생성에 실패했습니다.';
        
        // Invalid user id 오류인 경우 로그인 페이지로 리다이렉트
        if (errorMessage.includes('Invalid user id')) {
          alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('userId');
          router.push('/auth/login');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const newRoom = data.room;

      // 임시 정보 삭제
      sessionStorage.removeItem('temp-room-info');

      // 대기실로 이동
      router.push(`/game/sauturi-quiz/${newRoom.id}/waiting`);
    } catch (e: any) {
      console.error('Failed to create room', e);
      alert(e.message || '방 생성에 실패했습니다. 다시 시도해주세요.');
    }
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
      {/* 뒤로 버튼 — 왼쪽 위, 아이콘만 */}
      <button
        type="button"
        onClick={() => router.push('/game/sauturi-quiz/create')}
        aria-label="뒤로"
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 20,
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          border: "1px solid rgba(0, 255, 255, 0.5)",
          background: "rgba(0, 8, 20, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#00ffff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 16px rgba(0, 255, 255, 0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
          e.currentTarget.style.boxShadow = "0 0 24px rgba(0, 255, 255, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
          e.currentTarget.style.boxShadow = "0 0 16px rgba(0, 255, 255, 0.15)";
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          maxWidth: "920px",
          width: "100%",
          textAlign: "center",
          background: "linear-gradient(160deg, rgba(0, 255, 255, 0.05) 0%, rgba(8, 12, 28, 0.9) 40%, rgba(4, 8, 22, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 255, 255, 0.4)",
          borderRadius: "20px",
          padding: "2rem 2.5rem",
          boxShadow: "0 0 0 1px rgba(100, 80, 255, 0.15), 0 0 40px rgba(0, 255, 255, 0.12), inset 0 0 60px rgba(0, 255, 255, 0.03)",
        }}
      >
        {/* 제목 */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "2rem",
            background: "linear-gradient(135deg, #00ffff, #e0a0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          게임하실 장르를 선택해주세요 ({rounds}라운드)
        </h1>

        {/* 장르 선택 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.25rem",
            marginBottom: "2rem",
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
      </div>
    </main>
  );
}

// Suspense로 감싸서 export
export default function GenreSelectionPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#00ffff",
        fontSize: "1.5rem",
      }}>
        로딩 중...
      </div>
    }>
      <GenreSelectionContent />
    </Suspense>
  );
}
