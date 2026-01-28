"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from 'three';
import { toDisplayModelUrl, toDefaultCharacterPath, toAnimatedCharacterPath, toGlbLoadUrl } from '@/lib/character-paths';

interface Character {
  id: string;
  name: string;
  modelUrl: string;
}

// 캐릭터 목록 — default_characters/ 로 표시, 애니 필요 시 toAnimatedCharacterPath 사용
const ALL_CHARACTERS: Character[] = [
  { id: 'char1', name: '기본 캐릭터', modelUrl: '/character1.glb' },
  { id: 'char2', name: '소년', modelUrl: '/boy.glb' },
  { id: 'char3', name: '토끼', modelUrl: '/bunny.glb' },
  { id: 'char4', name: '귀여운 소녀', modelUrl: '/cute+girl.glb' },
  { id: 'char5', name: '헬스왕', modelUrl: '/gym+rat.glb' },
  { id: 'char6', name: '햄스터', modelUrl: '/hamster.glb' },
  { id: 'char7', name: '펭귄', modelUrl: '/penguin.glb' },
  { id: 'char8', name: '공주', modelUrl: '/princess.glb' },
  { id: 'char9', name: '스타일리시 소녀', modelUrl: '/stylized+girl.glb' },
  { id: 'char10', name: '마법사', modelUrl: '/wizard.glb' },
];

// GLB 로드 시 lib의 toGlbLoadUrl 사용 (공백·+ 인코딩)
const toGlbUrl = toGlbLoadUrl;

function animationKey(modelUrl: string, index: number): string {
  return `${toDisplayModelUrl(modelUrl)}:${index}`;
}

// 3D 모델 컴포넌트 (메인용) — animationName 있으면 animated_characters/ 에서 로드 후 그 행동 반복 재생
// 애니 재생 시 scene 그대로 사용 (clone 사용 시 mixer가 원본 대상이라 애니메이션이 보이지 않음)
function Model({ url, scale: scaleProp, animationName }: { url: string; scale?: number; animationName?: string | null }) {
  const group = useRef<THREE.Group>(null);
  const isFullPath = url.startsWith('/default_characters/') || url.startsWith('/animated_characters/');
  const loadUrl = toGlbUrl(isFullPath ? url : (animationName ? toAnimatedCharacterPath(url) : toDefaultCharacterPath(url)));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    Object.values(actions).forEach(a => a?.stop());
    if (animationName && actions[animationName]) {
      const act = actions[animationName];
      act.reset().fadeIn(0.3).setLoop(THREE.LoopRepeat, Infinity).play();
      return () => { act.stop(); };
    }
  }, [actions, animationName]);
  
  const isCharacter1 = loadUrl.includes('character1');
  const isPrincess = loadUrl.includes('princess');
  const isAnimFile = loadUrl.includes('animated_characters');
  const modelScale = isPrincess ? 2.2 : (isCharacter1 ? 2.0 : 3.6);
  const positionY = isCharacter1 ? -1.0 : -0.6;
  const rotation: [number, number, number] = isAnimFile ? [0, Math.PI / 4, 0] : [0, -Math.PI / 2, 0];
  const effectiveScale = scaleProp != null ? scaleProp : modelScale;
  return <primitive ref={group} object={scene} scale={effectiveScale} position={[0, positionY, 0]} rotation={rotation} />;
}

// 3D 모델 컴포넌트 (작은 박스용) — default_characters/ 에서 로드
function SmallModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbUrl(toDefaultCharacterPath(url));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => {
      action?.stop();
    });
  }, [actions]);
  
  const isCharacter1 = loadUrl.includes('character1');
  const isPrincess = loadUrl.includes('princess');
  const modelScale = isPrincess ? 1.2 : (isCharacter1 ? 1.4 : 2.4);
  const positionY = isCharacter1 ? -0.7 : 0.05;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={modelScale} position={[0, positionY, 0]} rotation={rotation} />;
}

// 메인 캐릭터 뷰어 — 고른 행동(애니메이션) 재생, 왼쪽 "현재 장착 중인 캐릭터"용
function MainCharacterViewer({ modelUrl, animationName }: { modelUrl: string; animationName?: string | null }) {
  const isCharacter1 = modelUrl.includes('character1');
  const cameraY = isCharacter1 ? 0.0 : 0.15;
  const cameraZ = isCharacter1 ? 4.0 : 5.0;
  const modelScale = isCharacter1 ? 2.4 : 3.4;
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, cameraY, cameraZ], fov: 46 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} scale={modelScale} animationName={animationName ?? undefined} />
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

// 현재 장착 캐릭터의 애니메이션 이름 — animated_characters/ GLB에서 clip 이름 추출
function ActionNamesReporter({ modelUrl, onNames }: { modelUrl: string; onNames: (names: string[]) => void }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbUrl(modelUrl);
  const { scene, animations } = useGLTF(loadUrl);
  useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useEffect(() => {
    if (animations?.length) onNames(animations.map((c) => c.name));
    else onNames([]);
  }, [animations, onNames]);
  const isCharacter1 = modelUrl.includes('character1');
  const isPrincess = modelUrl.includes('princess');
  const py = isCharacter1 ? -1.0 : -0.2;
  const s = isPrincess ? 2.0 : (isCharacter1 ? 2.0 : 3.8);
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={s} position={[0, py, 0]} rotation={rotation} />;
}

// 작은 캐릭터 뷰어
function SmallCharacterViewer({ modelUrl }: { modelUrl: string }) {
  const isCharacter1 = modelUrl.includes('character1');
  const cameraY = isCharacter1 ? 0.2 : 0.7;
  const cameraZ = isCharacter1 ? 3.0 : 3.3;
  
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, cameraY, cameraZ], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <SmallModel url={modelUrl} />
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [coins, setCoins] = useState(0);
  const [equippedCharacter, setEquippedCharacter] = useState('/character1.glb');
  const [equippedAction, setEquippedAction] = useState<string | null>(null);
  const [availableActionNames, setAvailableActionNames] = useState<string[]>([]);
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>([]);
  const [purchasedAnimations, setPurchasedAnimations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'characters' | 'actions'>('characters');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    
    if (!storedUserId) {
      router.push('/auth/login');
      return;
    }

    setUserId(storedUserId);
    setUserName(storedUserName || '사용자');
    setNewName(storedUserName || '사용자');

    // 코인 불러오기 (이전 기본 1000이면 3000으로 올림)
    const savedCoins = localStorage.getItem(`userCoins-${storedUserId}`);
    if (savedCoins) {
      const amount = parseInt(savedCoins, 10);
      if (amount === 1000) {
        localStorage.setItem(`userCoins-${storedUserId}`, '3000');
        setCoins(3000);
      } else {
        setCoins(amount);
      }
    } else {
      setCoins(3000);
    }

    // 장착된 캐릭터 불러오기 (표시용 경로 정규화)
    const equipped = localStorage.getItem(`equipped-character-${storedUserId}`);
    setEquippedCharacter(toDisplayModelUrl(equipped || '') || '/character1.glb');
    // 장착된 행동(애니메이션 이름) 불러오기
    const equippedAct = localStorage.getItem(`equipped-action-${storedUserId}`);
    setEquippedAction(equippedAct || null);

    // 보유한 캐릭터 불러오기
    const purchasedCharacterIds = JSON.parse(
      localStorage.getItem(`purchasedCharacters-${storedUserId}`) || '["char1"]'
    );
    const owned = ALL_CHARACTERS.filter(c => purchasedCharacterIds.includes(c.id));
    setOwnedCharacters(owned);

    // 구매한 애니메이션 불러오기 (modelUrl:index)
    const animKeys = JSON.parse(localStorage.getItem(`purchasedAnimations-${storedUserId}`) || '[]');
    setPurchasedAnimations(animKeys);
  }, [router]);

  const handleSaveName = () => {
    if (!newName.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    localStorage.setItem('userName', newName);
    
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[userEmail]) {
        users[userEmail].username = newName;
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    setUserName(newName);
    setIsEditingName(false);
  };

  const handleEquipCharacter = (character: Character) => {
    localStorage.setItem(`equipped-character-${userId}`, character.modelUrl);
    setEquippedCharacter(character.modelUrl);
    setEquippedAction(null);
    localStorage.removeItem(`equipped-action-${userId}`);
    setAvailableActionNames([]);
  };

  const handleEquipAction = (animationName: string) => {
    localStorage.setItem(`equipped-action-${userId}`, animationName);
    setEquippedAction(animationName);
  };

  return (
    <main className="lobby-premium-root">
      {/* 로비와 동일한 배경·분위기 */}
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

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
      {/* 헤더 — 세련된 라인 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.75rem",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/main/lobby")}
          aria-label="로비로"
          style={{
            background: "rgba(0, 255, 255, 0.06)",
            border: "1px solid rgba(0, 255, 255, 0.35)",
            borderRadius: "12px",
            padding: "0.65rem 1rem",
            color: "rgba(255, 255, 255, 0.9)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 255, 255, 0.12)";
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
            e.currentTarget.style.color = "#00ffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 255, 255, 0.06)";
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.35)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          로비
        </button>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.08em",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          프로필
        </h1>

        {/* 코인 — 미니멀 필 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "rgba(255, 215, 0, 0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 215, 0, 0.4)",
            borderRadius: "999px",
            color: "#f5d76e",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span>{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "2rem",
          minHeight: 0,
          overflow: "hidden",
          paddingBottom: "1rem",
        }}
      >
        {/* 왼쪽 - 프로필 & 캐릭터 */}
        <div
          style={{
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* 프로필 카드 — 세련된 글래스 카드 */}
          <div
            style={{
              background: "rgba(12, 18, 28, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 닉네임 */}
            {isEditingName ? (
              <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "0.7rem 1rem",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  aria-label="저장"
                  style={{
                    background: "rgba(0, 255, 0, 0.3)",
                    border: "2px solid rgba(0, 255, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.55rem",
                    color: "#00ff00",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(userName);
                  }}
                  aria-label="취소"
                  style={{
                    background: "rgba(255, 0, 0, 0.3)",
                    border: "2px solid rgba(255, 0, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.55rem",
                    color: "#ff4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {userName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  aria-label="닉네임 수정"
                  style={{
                    background: "rgba(0, 255, 255, 0.1)",
                    border: "1px solid rgba(0, 255, 255, 0.35)",
                    borderRadius: "8px",
                    padding: "0.45rem",
                    color: "rgba(0, 255, 255, 0.9)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.18)";
                    e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.35)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}

            {/* 캐릭터 미리보기 — 세련된 프레임 */}
            <div
              style={{
                width: "100%",
                height: "280px",
                background: "rgba(0, 12, 24, 0.6)",
                border: "1px solid rgba(0, 255, 255, 0.2)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              <MainCharacterViewer modelUrl={equippedAction ? toAnimatedCharacterPath(equippedCharacter) : equippedCharacter} animationName={equippedAction} />
            </div>

            <div
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              현재 장착 중
            </div>
          </div>

          {/* 상점 바로가기 — 세련된 버튼 */}
          <button
            type="button"
            onClick={() => router.push('/main/shop')}
            style={{
              width: "100%",
              padding: "1rem 1.25rem",
              background: "rgba(255, 180, 0, 0.12)",
              border: "1px solid rgba(255, 180, 0, 0.4)",
              borderRadius: "12px",
              color: "#e8b84a",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              letterSpacing: "0.03em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 180, 0, 0.2)";
              e.currentTarget.style.borderColor = "rgba(255, 180, 0, 0.6)";
              e.currentTarget.style.color = "#f0c864";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 180, 0, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 180, 0, 0.4)";
              e.currentTarget.style.color = "#e8b84a";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            상점 가기
          </button>
        </div>

        {/* 오른쪽 — 보유 아이템 패널 (세련된 글래스) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            maxHeight: "calc(100% - 1rem)",
            marginBottom: "1rem",
            background: "rgba(18, 24, 36, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 255, 0.18)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            position: "relative",
          }}
        >
          {/* 탭 헤더 */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('characters')}
              style={{
                flex: 1,
                padding: "1rem 1.25rem",
                background: activeTab === 'characters' ? "rgba(0, 255, 255, 0.08)" : "transparent",
                border: "none",
                borderBottom: activeTab === 'characters' ? "2px solid rgba(0, 255, 255, 0.6)" : "2px solid transparent",
                color: activeTab === 'characters' ? "#00ffff" : "rgba(255, 255, 255, 0.55)",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                letterSpacing: "0.02em",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              캐릭터 ({ownedCharacters.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              style={{
                flex: 1,
                padding: "1rem 1.25rem",
                background: activeTab === 'actions' ? "rgba(255, 0, 255, 0.08)" : "transparent",
                border: "none",
                borderBottom: activeTab === 'actions' ? "2px solid rgba(255, 0, 255, 0.6)" : "2px solid transparent",
                color: activeTab === 'actions' ? "#e066ff" : "rgba(255, 255, 255, 0.55)",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                letterSpacing: "0.02em",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              행동 ({purchasedAnimations.length})
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div
            className="tab-content-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              padding: "1rem 1.5rem",
              paddingBottom: "2rem",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {activeTab === 'characters' ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {ownedCharacters.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "3rem",
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    보유한 캐릭터가 없습니다. 상점에서 구매해보세요!
                  </div>
                ) : (
                  ownedCharacters.map((character) => {
                    const isEquipped = equippedCharacter === character.modelUrl;
                    return (
                      <div
                        key={character.id}
                        className="game-item-card"
                        onClick={() => !isEquipped && handleEquipCharacter(character)}
                        style={{
                          background: isEquipped 
                            ? "linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.2))" 
                            : "linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 30, 50, 0.5))",
                          border: isEquipped 
                            ? "3px solid rgba(0, 255, 0, 0.9)" 
                            : "3px solid rgba(0, 255, 255, 0.5)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          cursor: isEquipped ? "default" : "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: isEquipped 
                            ? "0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1)" 
                            : "0 0 15px rgba(0, 255, 255, 0.2)",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isEquipped) {
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                            e.currentTarget.style.transform = "translateY(-5px) scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isEquipped) {
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                            e.currentTarget.style.transform = "translateY(0) scale(1)";
                            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.2)";
                          }
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "140px",
                            position: "relative",
                          }}
                        >
                          <SmallCharacterViewer modelUrl={character.modelUrl} />
                        </div>
                        <div
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div
                            style={{
                              color: "#ffffff",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              marginBottom: "0.5rem",
                            }}
                          >
                            {character.name}
                          </div>
                          {isEquipped ? (
                            <div
                              style={{
                                background: "rgba(0, 255, 0, 0.3)",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem",
                                color: "#00ff00",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              장착 중
                            </div>
                          ) : (
                            <div
                              style={{
                                background: "rgba(0, 255, 255, 0.2)",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem",
                                color: "#00ffff",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              클릭하여 장착
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* 장착한 캐릭터의 행동 선택 — 홈 화면에 재생됨 (캔버스로 로드해서 애니 이름 가져옴) */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(0, 200, 255, 0.1))",
                    border: "2px solid rgba(0, 255, 255, 0.5)",
                    borderRadius: "16px",
                    padding: "1.25rem",
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ width: "220px", height: "220px", background: "rgba(0,0,0,0.4)", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                    <Canvas camera={{ position: [0, 0.5, 3.5], fov: 50 }} style={{ width: "100%", height: "100%" }}>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1} />
                      <Environment preset="city" />
                      <Suspense fallback={null}>
                        <ActionNamesReporter modelUrl={toAnimatedCharacterPath(equippedCharacter)} onNames={setAvailableActionNames} />
                      </Suspense>
                      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
                    </Canvas>
                  </div>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ color: "#00ffff", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                      홈에 보여질 행동
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      아래 버튼 중 하나를 선택하면 홈 화면 캐릭터가 해당 동작을 합니다.
                    </div>
                    {availableActionNames.length === 0 ? (
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                        {toAnimatedCharacterPath(equippedCharacter).includes('animated_characters') ? '캐릭터 로딩 중…' : '이 캐릭터에는 애니메이션이 없습니다. animated_characters에 있는 캐릭터만 행동 목록이 표시됩니다.'}
                      </div>
                    ) : (() => {
                      const ownedForChar = availableActionNames
                        .map((name, idx) => ({ name, idx, key: animationKey(equippedCharacter, idx) }))
                        .filter(({ key }) => purchasedAnimations.includes(key));
                      if (ownedForChar.length === 0) {
                        return (
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                            이 캐릭터용 구매한 애니메이션이 없습니다.{' '}
                            <button
                              type="button"
                              onClick={() => router.push('/main/shop')}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#00ffff",
                                textDecoration: "underline",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "inherit",
                              }}
                            >
                              상점에서 구매하세요.
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {ownedForChar.map(({ name, idx }) => (
                            <button
                              key={name}
                              onClick={() => handleEquipAction(name)}
                              style={{
                                padding: "0.5rem 1rem",
                                background: equippedAction === name ? "rgba(0, 255, 255, 0.35)" : "rgba(0, 255, 255, 0.1)",
                                border: `2px solid ${equippedAction === name ? "rgba(0, 255, 255, 0.9)" : "rgba(0, 255, 255, 0.4)"}`,
                                borderRadius: "8px",
                                color: "#00ffff",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: equippedAction === name ? 700 : 500,
                              }}
                            >
                              애니메이션 {idx + 1}{equippedAction === name ? ' ✓' : ''}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                {purchasedAnimations.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "2rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.9rem",
                    }}
                  >
                    상점에서 구매한 애니메이션이 없습니다.{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/main/shop')}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00ffff",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "inherit",
                      }}
                    >
                      상점에서 구매하세요.
                    </button>
                  </div>
                ) : (
                  purchasedAnimations.map((key) => {
                    const i = key.lastIndexOf(':');
                    const modelUrl = key.slice(0, i);
                    const index = parseInt(key.slice(i + 1), 10);
                    const char = ALL_CHARACTERS.find((c) => toDisplayModelUrl(c.modelUrl) === modelUrl);
                    const label = char ? `${char.name} - 애니메이션 ${index + 1}` : `애니메이션 ${index + 1}`;
                    return (
                      <div
                        key={key}
                        className="game-action-card"
                        style={{
                          background: "linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(200, 0, 255, 0.2))",
                          border: "3px solid rgba(255, 0, 255, 0.6)",
                          borderRadius: "16px",
                          padding: "1.5rem",
                          transition: "all 0.3s ease",
                          boxShadow: "0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 15px rgba(255, 0, 255, 0.1)",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px) scale(1.05)";
                          e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 0, 255, 0.5), inset 0 0 20px rgba(255, 0, 255, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(255, 0, 255, 0.9)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 15px rgba(255, 0, 255, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(255, 0, 255, 0.6)";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff00ff" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div
                            style={{
                              color: "#ffffff",
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              textShadow: "0 0 10px rgba(255, 0, 255, 0.6)",
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* 떠다니는 음표 애니메이션 */
        .floating-notes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .floating-note {
          position: absolute;
          color: rgba(0, 255, 255, 0.3);
          animation: floatNote 15s infinite ease-in-out;
        }
        .note-0 { left: 10%; animation-delay: 0s; }
        .note-1 { left: 20%; animation-delay: 2s; }
        .note-2 { left: 30%; animation-delay: 4s; }
        .note-3 { left: 40%; animation-delay: 1s; }
        .note-4 { left: 50%; animation-delay: 3s; }
        .note-5 { left: 60%; animation-delay: 5s; }
        .note-6 { left: 70%; animation-delay: 2.5s; }
        .note-7 { left: 80%; animation-delay: 4.5s; }
        @keyframes floatNote {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        /* 게임 파티클 효과 */
        .game-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
          animation: particleFloat 20s infinite ease-in-out;
        }
        .particle-0 { left: 5%; animation-delay: 0s; }
        .particle-1 { left: 15%; animation-delay: 2s; }
        .particle-2 { left: 25%; animation-delay: 4s; }
        .particle-3 { left: 35%; animation-delay: 1s; }
        .particle-4 { left: 45%; animation-delay: 3s; }
        .particle-5 { left: 55%; animation-delay: 5s; }
        .particle-6 { left: 65%; animation-delay: 2.5s; }
        .particle-7 { left: 75%; animation-delay: 4.5s; }
        .particle-8 { left: 85%; animation-delay: 1.5s; }
        .particle-9 { left: 95%; animation-delay: 3.5s; }
        .particle-10 { left: 10%; animation-delay: 6s; }
        .particle-11 { left: 20%; animation-delay: 7s; }
        .particle-12 { left: 30%; animation-delay: 8s; }
        .particle-13 { left: 40%; animation-delay: 6.5s; }
        .particle-14 { left: 50%; animation-delay: 7.5s; }
        .particle-15 { left: 60%; animation-delay: 8.5s; }
        .particle-16 { left: 70%; animation-delay: 9s; }
        .particle-17 { left: 80%; animation-delay: 9.5s; }
        .particle-18 { left: 90%; animation-delay: 10s; }
        .particle-19 { left: 95%; animation-delay: 10.5s; }
        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0;
          }
        }

        /* 카드 글로우 애니메이션 */
        @keyframes cardGlow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(20px, 20px) scale(1.1);
            opacity: 0.6;
          }
        }

        /* 패널 글로우 애니메이션 */
        @keyframes panelGlow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-20px, -20px) scale(1.1);
            opacity: 0.6;
          }
        }

        /* 게임 카드 호버 효과 */
        .game-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 40px rgba(0, 255, 255, 0.15) !important;
        }

        /* 게임 버튼 클릭 효과 */
        .game-button:active {
          transform: translateY(0) scale(0.98) !important;
        }

        /* 게임 아이템 카드 호버 효과 */
        .game-item-card:hover {
          z-index: 10;
        }

        /* 제목 애니메이션 */
        @keyframes titleShine {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        /* 게임 스타일 스크롤바 */
        .tab-content-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .tab-content-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          margin: 5px 0;
        }
        .tab-content-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.6), rgba(0, 200, 255, 0.6));
          border-radius: 10px;
          border: 2px solid rgba(0, 255, 255, 0.3);
        }
        .tab-content-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.8), rgba(0, 200, 255, 0.8));
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        /* Firefox 스크롤바 */
        .tab-content-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 255, 255, 0.6) rgba(0, 0, 0, 0.3);
        }
      `}</style>
      </div>
    </main>
  );
}
