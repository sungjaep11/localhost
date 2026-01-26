"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }

      // 로그인 성공 - 사용자 정보 설정
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userName', data.nickname);
      if (data.email) {
        localStorage.setItem('userEmail', data.email);
      }

      // 사용자별 데이터 확인 및 기본값 설정
      const userId = data.userId;
      
      // 코인 확인
      if (!localStorage.getItem(`userCoins-${userId}`)) {
        localStorage.setItem(`userCoins-${userId}`, '1000');
      }

      // 구매한 캐릭터 확인
      if (!localStorage.getItem(`purchasedCharacters-${userId}`)) {
        localStorage.setItem(`purchasedCharacters-${userId}`, JSON.stringify(['char1']));
      }

      // 장착된 캐릭터 확인
      if (!localStorage.getItem(`equipped-character-${userId}`)) {
        localStorage.setItem(`equipped-character-${userId}`, '/character1.glb');
      }

      // 구매한 행동 확인
      if (!localStorage.getItem(`purchasedActions-${userId}`)) {
        localStorage.setItem(`purchasedActions-${userId}`, JSON.stringify([]));
      }

      router.push('/main/lobby');
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인에 실패했습니다.');
      setLoading(false);
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
          padding: "3rem",
          maxWidth: "500px",
          width: "100%",
          border: "2px solid rgba(0, 255, 255, 0.6)",
          boxShadow: 
            "0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.2)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          LOGIN
        </h1>
        
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
            fontSize: "0.9rem",
            marginBottom: "2.5rem",
            letterSpacing: "0.1em",
          }}
        >
          음악의 세계로 들어가세요
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ position: "relative" }}>
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
                padding: "1rem 1.25rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
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

          <div style={{ position: "relative" }}>
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
                padding: "1rem 1.25rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.3)",
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

          {error && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "0.75rem",
                background: "rgba(255, 68, 68, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 68, 68, 0.3)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cyberpunk-submit-btn"
            style={{
              width: "100%",
              padding: "1.25rem",
              background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "12px",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              marginTop: "1rem",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6), 0 0 50px rgba(255, 0, 255, 0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
            style={{
              width: "100%",
              padding: "1.25rem",
              background: loading 
                ? "rgba(100, 100, 100, 0.3)" 
                : "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "12px",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              marginTop: "1rem",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '로그인 중...' : 'ENTER'}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.9rem",
          }}
        >
          계정이 없으신가요?{' '}
          <button
            onClick={() => router.push('/auth/signup')}
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
            회원가입
          </button>
        </div>
      </div>
    </main>
  );
}
