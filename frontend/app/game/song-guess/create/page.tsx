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
  const [alertModal, setAlertModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const handleNext = () => {
    if (!roomName.trim()) {
      setAlertModal({ open: true, message: '방 이름을 입력해주세요.' });
      return;
    }
    if (!isPublic && !password.trim()) {
      setAlertModal({ open: true, message: '비공개 방은 비밀번호를 설정해주세요.' });
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
    router.push(`/game/song-guess/create/genre?rounds=${rounds}`);
  };

  const handleBack = () => {
    router.push('/game/song-guess');
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
      {/* 뒤로 버튼 — 왼쪽 위, 단순화 */}
      <button
        type="button"
        onClick={handleBack}
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

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      {/* 방 생성 폼 — 홀로그램 스타일, 꽉 찬 느낌 */}
      <div
        style={{
          background: "linear-gradient(160deg, rgba(0, 255, 255, 0.05) 0%, rgba(8, 12, 28, 0.9) 40%, rgba(4, 8, 22, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "2.25rem 2.5rem",
          maxWidth: "620px",
          width: "100%",
          border: "1px solid rgba(0, 255, 255, 0.4)",
          boxShadow: "0 0 0 1px rgba(100, 80, 255, 0.15), 0 0 40px rgba(0, 255, 255, 0.12), inset 0 0 60px rgba(0, 255, 255, 0.03)",
          zIndex: 10,
          boxSizing: "border-box",
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

        {/* 다음 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleNext}
            style={{
              padding: "0.9rem 2.2rem",
              minWidth: "120px",
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
      </div>

      {/* 입력 안내 팝업 — 홀로그램 스타일 */}
      {alertModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          onClick={() => setAlertModal({ open: false, message: '' })}
        >
          <div
            style={{
              maxWidth: "360px",
              width: "90%",
              padding: "1.75rem 2rem",
              background: "linear-gradient(160deg, rgba(0, 255, 255, 0.06) 0%, rgba(8, 12, 28, 0.92) 40%, rgba(4, 8, 20, 0.96) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 255, 255, 0.45)",
              borderRadius: "16px",
              boxShadow: "0 0 0 1px rgba(100, 80, 255, 0.2), 0 0 40px rgba(0, 255, 255, 0.15), inset 0 0 50px rgba(0, 255, 255, 0.03)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
              {alertModal.message}
            </p>
            <button
              type="button"
              onClick={() => setAlertModal({ open: false, message: '' })}
              style={{
                padding: "0.6rem 1.5rem",
                background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 200, 220, 0.15))",
                border: "1px solid rgba(0, 255, 255, 0.6)",
                borderRadius: "10px",
                color: "#00ffff",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 0 16px rgba(0, 255, 255, 0.2)",
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
