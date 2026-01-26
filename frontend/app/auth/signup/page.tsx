"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!username.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    // 사용자 ID 생성 (이메일 기반)
    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // 기존 사용자 확인
    const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
    if (existingUsers[email]) {
      alert('이미 존재하는 이메일입니다.');
      return;
    }

    // 사용자 정보 저장
    existingUsers[email] = {
      id: userId,
      email: email,
      password: password, // 실제 서비스에서는 암호화 필요
      username: username,
      createdAt: Date.now(),
    };
    localStorage.setItem('users', JSON.stringify(existingUsers));

    // 현재 로그인 사용자 설정
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', username);
    localStorage.setItem('userEmail', email);

    // 기본 캐릭터 설정 (char1)
    const purchasedKey = `purchasedCharacters-${userId}`;
    localStorage.setItem(purchasedKey, JSON.stringify(['char1']));
    localStorage.setItem(`equipped-character-${userId}`, '/character1.glb');

    // 기본 코인 설정
    localStorage.setItem(`userCoins-${userId}`, '1000');

    // 빈 행동 목록 설정
    localStorage.setItem(`purchasedActions-${userId}`, JSON.stringify([]));

    alert('회원가입이 완료되었습니다!');
    router.push('/main/lobby');
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
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
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
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(15px)",
          borderRadius: "20px",
          padding: "2rem 2.5rem",
          maxWidth: "420px",
          width: "100%",
          border: "2px solid rgba(0, 255, 255, 0.6)",
          boxShadow: 
            "0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.2)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "0.3rem",
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          SIGN UP
        </h1>
        
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
            fontSize: "0.85rem",
            marginBottom: "1.8rem",
            letterSpacing: "0.1em",
          }}
        >
          새로운 계정을 만들어보세요
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                letterSpacing: "0.05em",
                textAlign: "left",
                width: "100%",
                maxWidth: "320px",
              }}
            >
              닉네임
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="cyberpunk-input"
              placeholder="게임에서 사용할 이름"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "0.85rem 1rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
                textAlign: "left",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = 
                  "inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(0, 0, 0, 0.3)";
              }}
            />
          </div>

          <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                letterSpacing: "0.05em",
                textAlign: "left",
                width: "100%",
                maxWidth: "320px",
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="cyberpunk-input"
              placeholder="your@email.com"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "0.85rem 1rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
                textAlign: "left",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = 
                  "inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(0, 0, 0, 0.3)";
              }}
            />
          </div>

          <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                letterSpacing: "0.05em",
                textAlign: "left",
                width: "100%",
                maxWidth: "320px",
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="cyberpunk-input"
              placeholder="••••••••"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "0.85rem 1rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
                textAlign: "left",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = 
                  "inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(0, 0, 0, 0.3)";
              }}
            />
          </div>

          <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label
              style={{
                display: "block",
                color: "#00ffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                letterSpacing: "0.05em",
                textAlign: "left",
                width: "100%",
                maxWidth: "320px",
              }}
            >
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="cyberpunk-input"
              placeholder="••••••••"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "0.85rem 1rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
                textAlign: "left",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow = 
                  "inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(0, 0, 0, 0.3)";
              }}
            />
          </div>

          <button
            type="submit"
            className="cyberpunk-submit-btn"
            style={{
              width: "100%",
              maxWidth: "320px",
              padding: "1rem",
              background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "10px",
              color: "#00ffff",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              marginTop: "0.5rem",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6), 0 0 50px rgba(255, 0, 255, 0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            CREATE ACCOUNT
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.85rem",
          }}
        >
          이미 계정이 있으신가요?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              background: "none",
              border: "none",
              color: "#00ffff",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ff00ff";
              e.currentTarget.style.textShadow = "0 0 10px rgba(255, 0, 255, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#00ffff";
              e.currentTarget.style.textShadow = "none";
            }}
          >
            로그인
          </button>
        </div>
      </div>
    </main>
  );
}
