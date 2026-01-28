"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { toDisplayModelUrl, toDefaultCharacterPath, toAnimatedCharacterPath, toGlbLoadUrl, animationKey, hasAnimatedVersion } from '@/lib/character-paths';
import * as THREE from 'three';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  character?: string;
  coinEarned: number;
  rank: number;
}

function Model({ url, scale = 1.8 }: { url: string; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbLoadUrl(toDefaultCharacterPath(url || ''));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useEffect(() => { Object.values(actions).forEach(a => a?.stop()); }, [actions]);
  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -1.0 : -0.5;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function ResultAnimatedModel({
  characterUrl,
  scale,
  purchasedAnimations,
  equippedAction,
}: {
  characterUrl: string;
  scale: number;
  purchasedAnimations: string[];
  equippedAction: string | null;
}) {
  const group = useRef<THREE.Group>(null);
  const displayUrl = toDisplayModelUrl(characterUrl);
  const animPath = toAnimatedCharacterPath(displayUrl);
  const loadUrl = toGlbLoadUrl(animPath);
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);

  const nameToPlay = useMemo(() => {
    if (!animations?.length) return null;
    const names = animations.map((c) => c.name);
    const owned = names
      .map((name, idx) => ({ name, idx, key: animationKey(displayUrl, idx) }))
      .filter(({ key }) => purchasedAnimations.includes(key))
      .sort((a, b) => a.idx - b.idx);
    if (!owned.length) return null;
    const match = owned.find((o) => o.name === equippedAction);
    if (match) return match.name;
    return owned[0].name;
  }, [animations, displayUrl, purchasedAnimations, equippedAction]);

  useEffect(() => {
    Object.values(actions).forEach((a) => a?.stop());
    if (nameToPlay && actions[nameToPlay]) {
      const act = actions[nameToPlay];
      act.reset().fadeIn(0.3).setLoop(THREE.LoopRepeat, Infinity).play();
      return () => { act.stop(); };
    }
  }, [actions, nameToPlay]);

  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -1.0 : -0.5;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function ResultAnimatedModelDefault({ characterUrl, scale }: { characterUrl: string; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const displayUrl = toDisplayModelUrl(characterUrl);
  const animPath = toAnimatedCharacterPath(displayUrl);
  const loadUrl = toGlbLoadUrl(animPath);
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const firstClip = animations?.[0]?.name ?? null;

  useEffect(() => {
    Object.values(actions).forEach((a) => a?.stop());
    if (firstClip && actions[firstClip]) {
      const act = actions[firstClip];
      act.reset().fadeIn(0.3).setLoop(THREE.LoopRepeat, Infinity).play();
      return () => { act.stop(); };
    }
  }, [actions, firstClip]);

  const isCharacter1 = loadUrl.includes('character1');
  const positionY = isCharacter1 ? -1.0 : -0.5;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

function CharacterViewer({
  characterUrl,
  size = 150,
  isMe = false,
  purchasedAnimations = [],
  equippedAction = null,
}: {
  characterUrl: string;
  size?: number;
  isMe?: boolean;
  purchasedAnimations?: string[];
  equippedAction?: string | null;
}) {
  const displayUrl = toDisplayModelUrl(characterUrl);
  const isChar1 = displayUrl.includes('character1');
  const scale = isChar1 ? (size > 150 ? 1.4 : 1.0) : (size > 150 ? 2.2 : 1.6);
  const camZ = size > 150 ? 3.5 : 3.2;

  const hasAni = hasAnimatedVersion(displayUrl);
  const useMine = isMe && purchasedAnimations.some((k) => k.startsWith(`${displayUrl}:`));

  return (
    <div style={{ width: size, height: size, overflow: "hidden" }}>
      <Canvas camera={{ position: [0, 0.2, camZ], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        {hasAni ? (
          useMine ? (
            <Suspense fallback={<Model url={displayUrl} scale={scale} />}>
              <ResultAnimatedModel
                characterUrl={displayUrl}
                scale={scale}
                purchasedAnimations={purchasedAnimations}
                equippedAction={equippedAction}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<Model url={displayUrl} scale={scale} />}>
              <ResultAnimatedModelDefault characterUrl={displayUrl} scale={scale} />
            </Suspense>
          )
        ) : (
          <Model url={displayUrl} scale={scale} />
        )}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
      </Canvas>
    </div>
  );
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return { bg: 'rgba(255, 215, 0, 0.3)', border: 'rgba(255, 215, 0, 0.8)', text: '#ffd700' };
    case 2: return { bg: 'rgba(192, 192, 192, 0.3)', border: 'rgba(192, 192, 192, 0.8)', text: '#c0c0c0' };
    case 3: return { bg: 'rgba(205, 127, 50, 0.3)', border: 'rgba(205, 127, 50, 0.8)', text: '#cd7f32' };
    default: return { bg: 'rgba(0, 255, 255, 0.1)', border: 'rgba(0, 255, 255, 0.5)', text: '#00ffff' };
  }
};

const calculateCoins = (rank: number, _totalPlayers: number): number => {
  if (rank === 1) return 300;
  if (rank === 2) return 200;
  if (rank === 3) return 100;
  return 50;
};

export default function SauturiResultPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [myResult, setMyResult] = useState<PlayerResult | null>(null);
  const [purchasedAnimations, setPurchasedAnimations] = useState<string[]>([]);
  const [equippedAction, setEquippedAction] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUserId(userId);
      const animKeys = JSON.parse(localStorage.getItem(`purchasedAnimations-${userId}`) || '[]');
      setPurchasedAnimations(animKeys);
      setEquippedAction(localStorage.getItem(`equipped-action-${userId}`) || null);
    }

    const resultsKey = `sauturi-quiz-room-${roomId}-results`;
    const storedResults = localStorage.getItem(resultsKey);

    if (!storedResults) {
      setShowFullResult(true);
      return;
    }
    try {
      const parsedResults: PlayerResult[] = JSON.parse(storedResults);
      const sortedResults = parsedResults
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          ...player,
          rank: index + 1,
          coinEarned: calculateCoins(index + 1, parsedResults.length),
        }));

      setResults(sortedResults);

      const myRes = sortedResults.find((r) => r.id === userId);
      if (myRes) {
        setMyResult(myRes);
        const currentCoins = parseInt(localStorage.getItem(`userCoins-${userId}`) || '3000', 10);
        const newCoins = currentCoins + myRes.coinEarned;
        localStorage.setItem(`userCoins-${userId}`, newCoins.toString());
        setTimeout(() => setShowCoinAnimation(true), 500);
      } else {
        setShowFullResult(true);
      }
    } catch (e) {
      console.error('Failed to parse results', e);
      setShowFullResult(true);
    }
  }, [roomId]);

  const handleDismissPopup = () => {
    setShowCoinAnimation(false);
    setShowFullResult(true);
  };

  const handleGoToLobby = () => {
    localStorage.removeItem(`sauturi-quiz-room-${roomId}-results`);
    router.push('/main/lobby');
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
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.75rem', width: '100%', boxSizing: 'border-box' }}>
        {showCoinAnimation && myResult && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(20px)",
              border: "3px solid rgba(255, 215, 0, 0.8)",
              borderRadius: "20px",
              padding: "2.5rem 4rem",
              zIndex: 100,
              animation: "coinPopup 0.5s ease-out",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
            <div style={{ color: "#ffd700", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
              {myResult.rank}등!
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "#ffd700", fontSize: "2rem", fontWeight: 800 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9" />
                <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              +{myResult.coinEarned}
            </div>
            <button
              onClick={handleDismissPopup}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 2rem",
                background: "rgba(255, 215, 0, 0.3)",
                border: "2px solid rgba(255, 215, 0, 0.8)",
                borderRadius: "10px",
                color: "#ffd700",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              확인
            </button>
          </div>
        )}

        {showFullResult && (
          <>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ffd700, #ff6b6b, #00ffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.5rem",
                textShadow: "0 0 30px rgba(255, 215, 0, 0.5)",
              }}
            >
              게임 종료!
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.1rem", marginBottom: "2rem" }}>
              사투리 퀴즈 최종 결과입니다
            </p>

            <div style={{ width: "100%", flex: 1, boxSizing: "border-box", overflowY: "auto", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "1.5rem", marginBottom: "2rem", padding: "1rem" }}>
            {results[1] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translateY(30px)" }}>
                <div style={{ background: getRankColor(2).bg, border: `3px solid ${getRankColor(2).border}`, borderRadius: "16px", padding: "1rem", textAlign: "center", minWidth: "160px" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🥈</div>
                  <div style={{ width: "100px", height: "100px", margin: "0 auto" }}>
                    <CharacterViewer characterUrl={results[1].character || '/character1.glb'} size={100} isMe={results[1].id === currentUserId} purchasedAnimations={purchasedAnimations} equippedAction={equippedAction} />
                  </div>
                  <div style={{ color: "#ffffff", fontWeight: 700, marginTop: "0.5rem" }}>{results[1].name}</div>
                  <div style={{ color: getRankColor(2).text, fontWeight: 800, fontSize: "1.3rem" }}>{results[1].score}P</div>
                  <div style={{ color: "#ffd700", fontSize: "0.9rem", marginTop: "0.5rem" }}>+{results[1].coinEarned} 코인</div>
                </div>
              </div>
            )}

            {results[0] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ background: getRankColor(1).bg, border: `3px solid ${getRankColor(1).border}`, borderRadius: "20px", padding: "1.5rem", textAlign: "center", minWidth: "180px", boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👑</div>
                  <div style={{ width: "120px", height: "120px", margin: "0 auto" }}>
                    <CharacterViewer characterUrl={results[0].character || '/character1.glb'} size={120} isMe={results[0].id === currentUserId} purchasedAnimations={purchasedAnimations} equippedAction={equippedAction} />
                  </div>
                  <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.2rem", marginTop: "0.5rem" }}>{results[0].name}</div>
                  <div style={{ color: getRankColor(1).text, fontWeight: 800, fontSize: "1.5rem" }}>{results[0].score}P</div>
                  <div style={{ color: "#ffd700", fontSize: "1rem", marginTop: "0.5rem" }}>+{results[0].coinEarned} 코인</div>
                </div>
              </div>
            )}

            {results[2] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translateY(50px)" }}>
                <div style={{ background: getRankColor(3).bg, border: `3px solid ${getRankColor(3).border}`, borderRadius: "16px", padding: "1rem", textAlign: "center", minWidth: "150px" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🥉</div>
                  <div style={{ width: "90px", height: "90px", margin: "0 auto" }}>
                    <CharacterViewer characterUrl={results[2].character || '/character1.glb'} size={90} isMe={results[2].id === currentUserId} purchasedAnimations={purchasedAnimations} equippedAction={equippedAction} />
                  </div>
                  <div style={{ color: "#ffffff", fontWeight: 700, marginTop: "0.5rem" }}>{results[2].name}</div>
                  <div style={{ color: getRankColor(3).text, fontWeight: 800, fontSize: "1.2rem" }}>{results[2].score}P</div>
                  <div style={{ color: "#ffd700", fontSize: "0.85rem", marginTop: "0.5rem" }}>+{results[2].coinEarned} 코인</div>
                </div>
              </div>
            )}
          </div>

          {results.slice(3).length > 0 && (
            <div style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)", border: "2px solid rgba(0, 255, 255, 0.3)", borderRadius: "16px", padding: "1rem" }}>
              {results.slice(3).map((player) => (
                <div key={player.id} style={{ display: "flex", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", gap: "1rem" }}>
                  <div style={{ width: "40px", color: "rgba(255, 255, 255, 0.6)", fontSize: "1.2rem", fontWeight: 700, textAlign: "center" }}>{player.rank}</div>
                  <div style={{ width: "50px", height: "50px" }}>
                    <CharacterViewer characterUrl={player.character || '/character1.glb'} size={50} isMe={player.id === currentUserId} purchasedAnimations={purchasedAnimations} equippedAction={equippedAction} />
                  </div>
                  <div style={{ flex: 1, color: "#ffffff", fontWeight: 600 }}>{player.name}</div>
                  <div style={{ color: "#00ffff", fontWeight: 700 }}>{player.score}P</div>
                  <div style={{ color: "#ffd700", fontSize: "0.9rem" }}>+{player.coinEarned}</div>
                </div>
              ))}
            </div>
          )}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleGoToLobby}
                style={{
                  padding: "1rem 2.5rem",
                  background: "rgba(100, 100, 100, 0.3)",
                  border: "2px solid rgba(255, 255, 255, 0.5)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(100, 100, 100, 0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(100, 100, 100, 0.3)"; }}
              >
                로비로 돌아가기
              </button>
            </div>
          </>
        )}

        <style jsx>{`
          @keyframes coinPopup {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
      </div>
    </main>
  );
}
