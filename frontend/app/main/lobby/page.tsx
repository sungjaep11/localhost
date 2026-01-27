"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ModelViewer from '@/components/ModelViewer';

export default function LobbyPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(0);
  const [equippedCharacter, setEquippedCharacter] = useState('/character1.glb');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    const savedCoins = localStorage.getItem(`userCoins-${userId}`);
    if (savedCoins) {
      const amount = parseInt(savedCoins, 10);
      // 이전 기본값(1000)이었으면 3000으로 올림
      if (amount === 1000) {
        localStorage.setItem(`userCoins-${userId}`, '3000');
        setCoins(3000);
      } else {
        setCoins(amount);
      }
    } else {
      setCoins(3000);
      localStorage.setItem(`userCoins-${userId}`, '3000');
    }

    const equipped = localStorage.getItem(`equipped-character-${userId}`);
    setEquippedCharacter(equipped ? equipped.replace(/\s*\(1\)\s*\.glb$/i, '.glb') : '/character1.glb');
  }, [router]);

  const handleLogout = () => {
    router.push('/auth/login');
  };

  const handleRoomPreview = (gameType: 'MUSIC' | 'DIALECT') => {
    const base = gameType === 'MUSIC' ? '/game/song-guess' : '/game/sauturi-quiz';
    router.push(`${base}/preview-room/waiting`);
  };

  const handleDebugRoom = () => {
    const testRoomId = 'debug-room-123';
    const userId = localStorage.getItem('userId') || 'test-user';
    const userName = localStorage.getItem('userName') || '테스트유저';
    const testPlayers = [
      {
        id: userId,
        name: userName,
        isHost: true,
        score: 0,
        character: (localStorage.getItem(`equipped-character-${userId}`) || '/character1.glb').replace(/\s*\(1\)\s*\.glb$/i, '.glb'),
      },
    ];
    localStorage.setItem(`sauturi-quiz-room-${testRoomId}-players`, JSON.stringify(testPlayers));
    const testRoom = { id: testRoomId, name: '디버그 방', rounds: 1, songsPerRound: 1 };
    const rooms = JSON.parse(localStorage.getItem('sauturi-quiz-rooms') || '[]');
    const idx = rooms.findIndex((r: { id: string }) => r.id === testRoomId);
    if (idx >= 0) rooms[idx] = testRoom;
    else rooms.push(testRoom);
    localStorage.setItem('sauturi-quiz-rooms', JSON.stringify(rooms));
    router.push(`/game/sauturi-quiz/${testRoomId}/play`);
  };

  return (
    <main className="lobby-premium-root">
      {/* Layered background: dense cyberpunk city skyline + bokeh + fog */}
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

      {/* Dense neon particles — cyberpunk atmosphere */}
      <div className="lobby-neon-particles" aria-hidden>
        {[...Array(40)].map((_, i) => {
          const isPurple = i % 4 === 0;
          const size = i % 5 === 0 ? 'lobby-particle-lg' : i % 3 === 1 ? 'lobby-particle-sm' : '';
          return (
            <div
              key={i}
              className={`lobby-particle ${isPurple ? 'lobby-particle-purple' : ''} ${size}`}
              style={{
                left: `${8 + (i % 10) * 8}%`,
                top: `${8 + (Math.floor(i / 10) % 4) * 22}%`,
                animationDelay: `${(i * 0.4) % 8}s`,
                animationDuration: `${10 + (i % 5)}s`,
              }}
            />
          );
        })}
      </div>

      {/* Top bar — 로고 가운데, 오른쪽 고정: 프로필·상점·코인·로그아웃 */}
      <header className="lobby-top-bar">
        <div aria-hidden />

        <div className="lobby-logo-wrap">
          <button type="button" onClick={() => router.push('/main/lobby')} aria-label="LOCAL HOST">
            <img src="/logo2.png" alt="LOCAL HOST" />
          </button>
        </div>

        <div className="lobby-top-bar-right">
          <button type="button" className="lobby-nav-btn" onClick={() => router.push('/main/mypage')}>
            프로필
          </button>
          <div className="lobby-nav-sep" aria-hidden />
          <div className="lobby-coin-pill">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>{coins.toLocaleString()}</span>
          </div>
          <div className="lobby-nav-sep" aria-hidden />
          <button type="button" className="lobby-pill lobby-pill-red" onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </header>

      {/* 상점만 — 프로필·코인 밑, 다른 모양 */}
      <button
        type="button"
        className="lobby-shop-float"
        onClick={() => router.push('/main/shop')}
        aria-label="상점"
      >
        <svg className="lobby-shop-float-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span className="lobby-shop-float-label">상점</span>
      </button>

      {/* 나중에 없앨 버튼들 — 임시로 좌하단 배치 */}
      <div className="lobby-temp-buttons">
        <button type="button" className="lobby-pill lobby-pill-cyan" onClick={() => handleRoomPreview('MUSIC')}>
          방미리(노래)
        </button>
        <button type="button" className="lobby-pill lobby-pill-amber" onClick={() => handleRoomPreview('DIALECT')}>
          방미리(사투리)
        </button>
        <button type="button" className="lobby-pill lobby-pill-orange" onClick={handleDebugRoom}>
          디버그
        </button>
      </div>

      {/* 3D character on holographic podium + companion drones */}
      <div className="lobby-character-stage">
        <div className="lobby-holographic-podium" aria-hidden />
        <div className="lobby-character-viewport">
          <ModelViewer modelUrl={equippedCharacter} scaleMultiplier={1.15} />
        </div>
        {[
          { pos: 'lobby-drone-left', size: 56, delay: 0 },
          { pos: 'lobby-drone-right', size: 52, delay: 0.4 },
          { pos: 'lobby-drone-top', size: 44, delay: 0.8 },
          { pos: 'lobby-drone-back', size: 40, delay: 1.2 },
        ].map((d, i) => (
          <div
            key={d.pos}
            className={`lobby-drone-wrap ${d.pos}`}
            aria-hidden
            style={{ animationDelay: `${d.delay}s`, width: d.size, height: d.size }}
          >
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <defs>
                <linearGradient id={`lobby-drone-blue-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0,255,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(0,180,255,0.8)" />
                </linearGradient>
                <filter id={`lobby-drone-glow-${i}`}>
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="32" cy="34" rx="14" ry="10" fill="rgba(18,22,32,0.9)" stroke={`url(#lobby-drone-blue-${i})`} strokeWidth="1.5" filter={`url(#lobby-drone-glow-${i})`} />
              <circle cx="32" cy="34" r="4" fill={`url(#lobby-drone-blue-${i})`} opacity="0.9" />
              <path d="M18 34 L10 34 M54 34 L46 34 M32 22 L32 14 M32 54 L32 46" stroke={`url(#lobby-drone-blue-${i})`} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              <circle cx="14" cy="34" r="2.5" fill="rgba(0,255,255,0.9)" />
              <circle cx="50" cy="34" r="2.5" fill="rgba(0,255,255,0.9)" />
              <circle cx="32" cy="18" r="2.5" fill="rgba(0,255,255,0.9)" />
              <circle cx="32" cy="50" r="2.5" fill="rgba(0,255,255,0.9)" />
            </svg>
          </div>
        ))}
      </div>

      {/* Left & right — floating holographic game panels */}
      <div className="lobby-game-panels">
        <div className="lobby-panel lobby-panel-left">
          <button
            type="button"
            className="lobby-holo-panel lobby-holo-panel-left"
            onClick={() => router.push('/game/song-guess')}
          >
            <div className="lobby-holo-glow" aria-hidden />
            <div className="lobby-holo-content">
              <svg className="lobby-holo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="lobby-holo-title">노래 맞추기</span>
            </div>
          </button>
        </div>

        <div className="lobby-panel lobby-panel-right">
          <button
            type="button"
            className="lobby-holo-panel lobby-holo-panel-right"
            onClick={() => router.push('/game/sauturi-quiz')}
          >
            <div className="lobby-holo-glow" aria-hidden />
            <div className="lobby-holo-content">
              <svg className="lobby-holo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="lobby-holo-title">사투리 가사 맞추기</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
