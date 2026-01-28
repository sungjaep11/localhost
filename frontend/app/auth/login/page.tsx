"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        localStorage.setItem(`userCoins-${userId}`, '3000');
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

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          background: "linear-gradient(160deg, rgba(0, 255, 255, 0.05) 0%, rgba(8, 12, 28, 0.9) 40%, rgba(4, 8, 22, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "2.25rem 2.5rem",
          maxWidth: "420px",
          width: "100%",
          border: "1px solid rgba(0, 255, 255, 0.4)",
          boxShadow: "0 0 0 1px rgba(100, 80, 255, 0.15), 0 0 40px rgba(0, 255, 255, 0.12), inset 0 0 60px rgba(0, 255, 255, 0.03)",
          boxSizing: "border-box",
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
          LOGIN
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
          음악의 세계로 들어가세요
        </p>

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "1.2rem", alignItems: "center" }}>
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
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
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
              maxWidth: "320px",
              padding: "1rem",
              background: loading 
                ? "rgba(100, 100, 100, 0.3)" 
                : "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))",
              border: "2px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "10px",
              color: "#00ffff",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              marginTop: "0.5rem",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6), 0 0 50px rgba(255, 0, 255, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? '로그인 중...' : 'ENTER'}
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
      </div>
    </main>
  );
}
