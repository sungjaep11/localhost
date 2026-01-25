"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateRoomPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [rounds, setRounds] = useState(4);
  const [songsPerRound, setSongsPerRound] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');

  const handleNext = () => {
    if (!roomName.trim()) {
      alert('방 이름을 입력해주세요.');
      return;
    }
    if (!isPublic && !password.trim()) {
      alert('비공개 방은 비밀번호를 설정해주세요.');
      return;
    }
    // 방 정보를 sessionStorage에 임시 저장 (장르 선택 후 실제 생성)
    sessionStorage.setItem('temp-room-info', JSON.stringify({
      name: roomName,
      rounds,
      songsPerRound,
      maxPlayers,
      isPublic,
      password: isPublic ? undefined : password,
    }));
    router.push(`/game/sauturi-quiz/create/genre?rounds=${rounds}`);
  };

  const handleBack = () => {
    router.push('/game/sauturi-quiz');
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

      {/* 모달 */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(15px)",
          borderRadius: "20px",
          padding: "3rem",
          maxWidth: "500px",
          width: "100%",
          border: "3px solid rgba(0, 255, 255, 0.6)",
          boxShadow: 
            "0 0 50px rgba(0, 255, 255, 0.4), 0 0 80px rgba(255, 0, 255, 0.4)",
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "2rem",
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          방 생성하기
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* 방 이름 */}
          <div>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              방 이름
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="방 이름을 입력하세요"
              style={{
                width: "100%",
                padding: "1rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
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
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* 라운드 */}
          <div>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              라운드
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                style={{
                  width: "100%",
                  padding: "1rem 3rem 1rem 1rem",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
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
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#00ffff",
                  pointerEvents: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* 한 라운드당 곡수 */}
          <div>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              한 라운드당 곡수
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={songsPerRound}
                onChange={(e) => setSongsPerRound(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                style={{
                  width: "100%",
                  padding: "1rem 3rem 1rem 1rem",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
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
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#00ffff",
                  pointerEvents: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* 최대 인원수 */}
          <div>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              최대 인원수
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 2)}
                min="2"
                max="20"
                style={{
                  width: "100%",
                  padding: "1rem 3rem 1rem 1rem",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
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
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#00ffff",
                  pointerEvents: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* 공개 설정 */}
          <div>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              공개 설정
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={isPublic ? 'public' : 'private'}
                onChange={(e) => setIsPublic(e.target.value === 'public')}
                style={{
                  width: "100%",
                  padding: "1rem 3rem 1rem 1rem",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  outline: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  appearance: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="public" style={{ background: "#000", color: "#fff" }}>공개</option>
                <option value="private" style={{ background: "#000", color: "#fff" }}>비공개</option>
              </select>
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#00ffff",
                  pointerEvents: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* 비밀번호 */}
          {!isPublic && (
            <div>
              <label
                style={{
                  display: "block",
                  color: "#00ffff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  letterSpacing: "0.05em",
                }}
              >
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
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
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          {!isPublic && (
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.85rem",
                marginTop: "-0.5rem",
              }}
            >
              * 비공개일 경우 비밀번호 설정
            </p>
          )}
        </div>

        {/* 버튼들 */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: "1rem 2rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
            }}
          >
            돌아가기
          </button>
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: "1rem 2rem",
              background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "12px",
              color: "#00ffff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            다음
          </button>
        </div>
      </div>
    </main>
  );
}
