"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  joinedAt?: number;
}

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(10);
  const [answer, setAnswer] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const timeRemainingRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 사용자 정보
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  // Socket.io 연결 및 게임 상태 동기화
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    // Socket.io 연결
    const socket = io("http://localhost:3001", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected in play page:", socket.id);
      
      // 게임 방 입장
      socket.emit("game_join", { roomId, userId: currentUserId });
      
      // 현재 게임 상태 요청
      socket.emit("game_get_state", { roomId });
    });

    // 플레이어 목록 업데이트
    socket.on("game_players_update", (data: { players: Player[]; sessionStatus: string }) => {
      console.log("👥 Players updated:", data.players);
      setPlayers(data.players);
    });

    // 게임 상태 업데이트
    socket.on("game_state", (data: {
      roomId: string;
      players: Player[];
      status: string;
      currentRound: number;
      totalRounds: number;
      currentQuestion?: any;
    }) => {
      console.log("🎮 Game state:", data);
      setPlayers(data.players);
      setCurrentRound(data.currentRound);
    });

    // 라운드 시작
    socket.on("game_round_start", (data: {
      roomId: string;
      round: number;
      totalRounds: number;
      question: any;
      timeLimit: number;
    }) => {
      console.log("🎯 Round started:", data);
      setCurrentRound(data.round);
      setTimeLimit(data.timeLimit);
      setTimeRemaining(data.timeLimit);
      setAnswer('');
      setHasSubmitted(false);
      
      // 타이머 시작
      if (timeRemainingRef.current) {
        clearInterval(timeRemainingRef.current);
      }
      timeRemainingRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timeRemainingRef.current) {
              clearInterval(timeRemainingRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 답변 제출 상태 업데이트
    socket.on("game_answer_update", (data: {
      roomId: string;
      submittedCount: number;
      totalPlayers: number;
      userId: string;
      hasAnswered: boolean;
    }) => {
      console.log("📝 Answer update:", data);
      if (data.userId === currentUserId) {
        setHasSubmitted(true);
      }
    });

    // 정답 확인
    socket.on("game_answer_correct", (data: {
      roomId: string;
      scoreGained: number;
      totalScore: number;
    }) => {
      console.log("✅ Answer correct! Score:", data.scoreGained);
    });

    // 라운드 결과
    socket.on("game_round_result", (data: {
      roomId: string;
      round: number;
      correctAnswer: string;
      results: any[];
      leaderboard: any[];
    }) => {
      console.log("📊 Round result:", data);
      // 타이머 정리
      if (timeRemainingRef.current) {
        clearInterval(timeRemainingRef.current);
      }
      // 플레이어 점수 업데이트
      const updatedPlayers = players.map(p => {
        const result = data.results.find(r => r.userId === p.id);
        return result ? { ...p, score: result.score } : p;
      });
      setPlayers(updatedPlayers);
    });

    // 게임 종료
    socket.on("game_finished", (data: {
      roomId: string;
      results: any[];
    }) => {
      console.log("🏁 Game finished:", data);
      if (timeRemainingRef.current) {
        clearInterval(timeRemainingRef.current);
      }
      // 결과 페이지로 이동 (필요시)
      // router.push(`/game/sauturi-quiz/${roomId}/result`);
    });

    // 에러 처리
    socket.on("game_error", (error: { message: string }) => {
      console.error("❌ Game error:", error.message);
      alert(error.message);
    });

    // 연결 해제 시 정리
    return () => {
      if (timeRemainingRef.current) {
        clearInterval(timeRemainingRef.current);
      }
      if (socketRef.current) {
        socketRef.current.emit("game_leave", { roomId, userId: currentUserId });
        socketRef.current.disconnect();
      }
    };
  }, [roomId, currentUserId, router]);

  // 답변 제출
  const handleSubmitAnswer = () => {
    if (!socketRef.current || !answer.trim() || hasSubmitted) return;
    
    socketRef.current.emit("game_submit_answer", {
      roomId,
      userId: currentUserId,
      answer: answer.trim(),
    });
  };

  // Enter 키로 답변 제출
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const host = players.find(p => p.isHost);
  const otherPlayers = players.filter(p => !p.isHost);

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
        padding: "1.5rem",
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

      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          Localhost
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          Round {currentRound}/{totalRounds}
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "2rem",
        }}
      >
        {/* 왼쪽 - 방장 캐릭터 */}
        {host && (
          <div
            style={{
              width: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {/* 방장 캐릭터 - 크게 */}
            <div
              style={{
                width: "200px",
                height: "200px",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "3px solid rgba(255, 215, 0, 0.8)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)",
                position: "relative",
              }}
            >
              {/* 방장 표시 */}
              <div
                style={{
                  position: "absolute",
                  top: "-15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255, 215, 0, 0.9)",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  color: "#000",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                방장
              </div>

              {/* 캐릭터 아이콘 */}
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* 방장 이름 */}
            <div
              style={{
                color: "#ffffff",
                fontSize: "1.3rem",
                fontWeight: 700,
                textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
              }}
            >
              {host.name}
            </div>

            {/* 재생 컨트롤 */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 255, 0.2)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                  color: "#00ffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 255, 0.2)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                  color: "#00ffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 중앙 - 정답 입력 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(15px)",
              border: "3px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "20px",
              padding: "3rem",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 0 50px rgba(0, 255, 255, 0.4)",
            }}
          >
            <h2
              style={{
                color: "#00ffff",
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                textAlign: "center",
                textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
              }}
            >
              정답 {hasSubmitted && "✓"}
            </h2>
            <div style={{ marginBottom: "1rem", textAlign: "center", color: "#ffffff" }}>
              남은 시간: {timeRemaining}초
            </div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={hasSubmitted ? "답변 제출 완료" : "정답을 입력하세요"}
              disabled={hasSubmitted}
              style={{
                width: "100%",
                padding: "1.5rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1.2rem",
                outline: "none",
                transition: "all 0.3s ease",
                opacity: hasSubmitted ? 0.6 : 1,
                cursor: hasSubmitted ? "not-allowed" : "text",
              }}
              onFocus={(e) => {
                if (!hasSubmitted) {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.5)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {!hasSubmitted && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  padding: "1rem",
                  background: answer.trim() ? "rgba(0, 255, 255, 0.3)" : "rgba(0, 255, 255, 0.1)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                  borderRadius: "12px",
                  color: "#00ffff",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: answer.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (answer.trim()) {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = answer.trim() ? "rgba(0, 255, 255, 0.3)" : "rgba(0, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                제출
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽 - 다른 플레이어들 */}
        <div
          style={{
            width: "250px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          {otherPlayers.map((player) => (
            <div
              key={player.id}
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {/* 캐릭터 아이콘 */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(0, 255, 255, 0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* 이름과 점수 */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {player.name}
                </div>
                {player.score !== undefined && (
                  <div
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {player.score}P
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 오른쪽 끝 - 채팅 패널 */}
        <div
          style={{
            width: "300px",
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 150px)",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(0, 255, 255, 0.3)",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            채팅
          </div>
          <div
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
              minHeight: "200px",
            }}
          >
            <div
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#00ffff", fontWeight: 600 }}>박찬우박:</span> 아틀란티스소녀 보아
            </div>
          </div>
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid rgba(0, 255, 255, 0.3)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              placeholder="메시지 입력..."
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(0, 255, 255, 0.2)",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
