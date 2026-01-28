"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  toDisplayModelUrl,
  toDefaultCharacterPath,
  toAnimatedCharacterPath,
  toGlbLoadUrl,
  animationKey,
} from '@/lib/character-paths';
const scaleMultiplier = 1.15;

function LobbyStaticModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbLoadUrl(toDefaultCharacterPath(url));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useEffect(() => {
    Object.values(actions).forEach((a) => a?.stop());
  }, [actions]);
  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -2.1 : -1.5;
  const baseScale = isCharacter1 ? 1.8 : 2.8;
  const scale = baseScale * scaleMultiplier;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function LobbyAnimatedModel({
  url,
  selectedOwnedIndex,
  owned,
  onNames,
}: {
  url: string;
  selectedOwnedIndex: number | null;
  owned: { name: string; idx: number }[];
  onNames: (names: string[]) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const displayUrl = toDisplayModelUrl(url);
  const loadUrl = toGlbLoadUrl(toAnimatedCharacterPath(displayUrl));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (animations?.length) onNames(animations.map((c) => c.name));
    else onNames([]);
  }, [animations, onNames]);

  const nameToPlay =
    owned.length && selectedOwnedIndex != null
      ? (owned[selectedOwnedIndex]?.name ?? null)
      : null;

  useEffect(() => {
    Object.values(actions).forEach((a) => a?.stop());
    if (nameToPlay && actions[nameToPlay]) {
      const act = actions[nameToPlay];
      act.reset().fadeIn(0.3).setLoop(THREE.LoopRepeat, Infinity).play();
      return () => { act.stop(); };
    }
  }, [actions, nameToPlay]);

  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -2.1 : -1.5;
  const baseScale = isCharacter1 ? 1.8 : 2.8;
  const scale = baseScale * scaleMultiplier;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function LobbyCharacterViewer({
  equippedCharacter,
  purchasedAnimations,
  equippedAction,
}: {
  equippedCharacter: string;
  purchasedAnimations: string[];
  equippedAction: string | null;
}) {
  const displayUrl = toDisplayModelUrl(equippedCharacter);
  const [clipNames, setClipNames] = useState<string[] | null>(null);
  const [selectedOwnedIndex, setSelectedOwnedIndex] = useState<number | null>(null);

  const owned = useMemo(() => {
    if (!clipNames?.length) return [];
    return clipNames
      .map((name, idx) => ({ name, idx, key: animationKey(displayUrl, idx) }))
      .filter(({ key }) => purchasedAnimations.includes(key))
      .sort((a, b) => a.idx - b.idx);
  }, [clipNames, displayUrl, purchasedAnimations]);

  useEffect(() => {
    if (owned.length && selectedOwnedIndex != null && selectedOwnedIndex >= owned.length) {
      setSelectedOwnedIndex(null);
    }
  }, [owned.length, selectedOwnedIndex]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0.5, 5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Suspense fallback={<LobbyStaticModel url={equippedCharacter} />}>
          <LobbyAnimatedModel
            url={equippedCharacter}
            selectedOwnedIndex={selectedOwnedIndex}
            owned={owned}
            onNames={setClipNames}
          />
        </Suspense>
        <OrbitControls autoRotate={false} enableZoom={false} enablePan={false} enableRotate={true} />
      </Canvas>
      {owned.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          {owned.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedOwnedIndex(i)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `2px solid ${selectedOwnedIndex === i ? 'rgba(0,255,255,0.9)' : 'rgba(0,255,255,0.4)'}`,
                background: selectedOwnedIndex === i ? 'rgba(0,255,255,0.25)' : 'rgba(0,255,255,0.08)',
                color: '#00ffff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(0);
  const [equippedCharacter, setEquippedCharacter] = useState('/character1.glb');
  const [purchasedAnimations, setPurchasedAnimations] = useState<string[]>([]);
  const [equippedAction, setEquippedAction] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    const savedCoins = localStorage.getItem(`userCoins-${userId}`);
    if (savedCoins) {
      const amount = parseInt(savedCoins, 10);
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
    const animKeys = JSON.parse(localStorage.getItem(`purchasedAnimations-${userId}`) || '[]');
    setPurchasedAnimations(animKeys);
    setEquippedAction(localStorage.getItem(`equipped-action-${userId}`) || null);
  }, [router]);

  const handleLogout = () => {
    router.push('/auth/login');
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

      {/* 3D character on holographic podium + companion drones */}
      <div className="lobby-character-stage">
        <div className="lobby-holographic-podium" aria-hidden />
        <div className="lobby-character-viewport">
          <LobbyCharacterViewer
            equippedCharacter={equippedCharacter}
            purchasedAnimations={purchasedAnimations}
            equippedAction={equippedAction}
          />
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
