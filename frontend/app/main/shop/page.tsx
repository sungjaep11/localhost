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
  price: number;
  modelUrl: string;
}

interface Action {
  id: string;
  name: string;
  price: number;
  description: string;
}

// GLB 로드 시 lib의 toGlbLoadUrl 사용 (공백·+ 인코딩)
const toGlbUrl = toGlbLoadUrl;

// Model 컴포넌트 (정적) — 상점 카드용, 250×300 박스에 맞춤. url은 논리 경로 → 실제 로드는 default_characters/
function Model({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbUrl(toDefaultCharacterPath(url));
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  const isCharacter1 = url.includes('character1');
  const isPrincess = url.includes('princess');
  const positionY = isCharacter1 ? -0.4 : 0;
  const scale = isPrincess ? 1.0 : (isCharacter1 ? 0.95 : 1.5);
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

// 애니메이션 재생 가능 Model — animated_characters/ GLB. scaleModal=true면 모달용, loop=true면 무한 재생
function AnimatedModel({ url, playingName, onNames, scaleModal, loop = false }: { url: string; playingName: string | null; onNames: (names: string[]) => void; scaleModal?: boolean; loop?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = toGlbUrl(url);
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    if (animations?.length) {
      const names = animations.map((c) => c.name);
      onNames(names);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GLB 애니메이션] ${url}: ${names.length}개 →`, names);
      }
    } else {
      onNames([]);
      if (process.env.NODE_ENV === 'development' && url.includes('(1)')) {
        console.warn(`[GLB 애니메이션] ${url}: animations 배열이 비어 있음.`);
      }
    }
  }, [animations, onNames, url]);
  
  useEffect(() => {
    const acts = Object.values(actions);
    acts.forEach(a => a?.stop());
    if (playingName && actions[playingName]) {
      const act = actions[playingName];
      if (loop) act.setLoop(THREE.LoopRepeat, Infinity);
      act.reset().fadeIn(0.2).play();
      return () => { act.stop(); };
    }
  }, [playingName, actions, loop]);
  
  const isCharacter1 = url.includes('character1');
  const isPrincess = url.includes('princess');
  const positionY = isCharacter1 ? (scaleModal ? -0.6 : -0.4) : (scaleModal ? 0 : 0);
  const scale = scaleModal
    ? (isPrincess ? 2.0 : (isCharacter1 ? 1.4 : 2.2))
    : (isPrincess ? 1.0 : (isCharacter1 ? 0.95 : 1.5));
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

// 캐릭터 모델 뷰어 (카드용) — default_characters/ 에서 로드
function CharacterModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0.2, 1.8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} />
        <OrbitControls autoRotate={false} enableZoom={false} enablePan={false} enableRotate={true} />
      </Canvas>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [coins, setCoins] = useState(3000);
  const [activeTab, setActiveTab] = useState<'character' | 'action'>('character');
  const [purchasedCharacters, setPurchasedCharacters] = useState<string[]>([]);
  const [purchasedActions, setPurchasedActions] = useState<string[]>([]);
  const [equippedCharacter, setEquippedCharacter] = useState<string>('/character1.glb');
  const characterScrollRef = useRef<HTMLDivElement>(null);
  const [previewCharacter, setPreviewCharacter] = useState<Character | null>(null);
  const [previewAnimationNames, setPreviewAnimationNames] = useState<string[]>([]);
  const [previewPlayingName, setPreviewPlayingName] = useState<string | null>(null);
  const [purchaseSuccessModal, setPurchaseSuccessModal] = useState<{ message: string; isError?: boolean } | null>(null);

  // Horizontal wheel scroll: use non-passive listener so preventDefault is allowed
  useEffect(() => {
    const el = characterScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // 코인 및 구매 정보 불러오기
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/auth/login');
      return;
    }
    setUserId(storedUserId);

    // 코인 불러오기 (사용자별, 이전 기본 1000이면 3000으로 올림)
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
      localStorage.setItem(`userCoins-${storedUserId}`, '3000');
    }

    // 구매한 캐릭터 불러오기 (사용자별)
    const purchased = JSON.parse(localStorage.getItem(`purchasedCharacters-${storedUserId}`) || '["char1"]');
    setPurchasedCharacters(purchased);

    // 구매한 행동 불러오기 (사용자별)
    const purchasedActs = JSON.parse(localStorage.getItem(`purchasedActions-${storedUserId}`) || '[]');
    setPurchasedActions(purchasedActs);

    // 장착한 캐릭터 불러오기 (기존 (1) 경로는 표시용 비(1)로 정규화)
    const equipped = localStorage.getItem(`equipped-character-${storedUserId}`);
    setEquippedCharacter(toDisplayModelUrl(equipped || '') || '/character1.glb');
  }, [router]);

  // 캐릭터 데이터 — (1) 없는 GLB로 표시, 애니 필요 시 getAnimationModelUrl 사용
  const characters: Character[] = [
    { id: 'char1', name: '기본 캐릭터', price: 0, modelUrl: '/character1.glb' },
    { id: 'char2', name: '소년', price: 600, modelUrl: '/boy.glb' },
    { id: 'char3', name: '토끼', price: 900, modelUrl: '/bunny.glb' },
    { id: 'char4', name: '귀여운 소녀', price: 1200, modelUrl: '/cute+girl.glb' },
    { id: 'char5', name: '헬스왕', price: 1800, modelUrl: '/gym+rat.glb' },
    { id: 'char6', name: '햄스터', price: 1100, modelUrl: '/hamster.glb' },
    { id: 'char7', name: '펭귄', price: 1300, modelUrl: '/penguin.glb' },
    { id: 'char8', name: '공주', price: 2000, modelUrl: '/princess.glb' },
    { id: 'char9', name: '스타일리시 소녀', price: 1600, modelUrl: '/stylized+girl.glb' },
    { id: 'char10', name: '마법사', price: 2200, modelUrl: '/wizard.glb' },
  ];

  // 행동 데이터
  const actions: Action[] = [
    { id: 'action1', name: '춤추기', price: 500, description: '신나는 춤을 춥니다' },
    { id: 'action2', name: '인사하기', price: 300, description: '손을 흔들어 인사합니다' },
    { id: 'action3', name: '점프', price: 400, description: '높이 점프합니다' },
  ];

  const handlePurchaseCharacter = (item: Character) => {
    if (coins < item.price) {
      setPurchaseSuccessModal({ message: '코인이 부족합니다!', isError: true });
      return;
    }

    // 구매 처리
    const newCoins = coins - item.price;
    setCoins(newCoins);
    localStorage.setItem(`userCoins-${userId}`, newCoins.toString());

    // 구매한 아이템 저장 (사용자별)
    const newPurchased = [...purchasedCharacters, item.id];
    setPurchasedCharacters(newPurchased);
    localStorage.setItem(`purchasedCharacters-${userId}`, JSON.stringify(newPurchased));

    setPurchaseSuccessModal({ message: `${item.name}을(를) 구매했습니다!` });
  };

  const handlePurchaseAction = (item: Action) => {
    if (coins < item.price) {
      setPurchaseSuccessModal({ message: '코인이 부족합니다!', isError: true });
      return;
    }

    // 구매 처리
    const newCoins = coins - item.price;
    setCoins(newCoins);
    localStorage.setItem(`userCoins-${userId}`, newCoins.toString());

    // 구매한 아이템 저장 (사용자별)
    const newPurchased = [...purchasedActions, item.id];
    setPurchasedActions(newPurchased);
    localStorage.setItem(`purchasedActions-${userId}`, JSON.stringify(newPurchased));

    setPurchaseSuccessModal({ message: `${item.name}을(를) 구매했습니다!` });
  };

  const handleEquip = (character: Character) => {
    localStorage.setItem(`equipped-character-${userId}`, character.modelUrl);
    setEquippedCharacter(character.modelUrl);
    setPurchaseSuccessModal({ message: `${character.name}을(를) 장착했습니다!` });
  };

  const isCharacterOwned = (characterId: string) => {
    return purchasedCharacters.includes(characterId);
  };

  const isActionOwned = (actionId: string) => {
    return purchasedActions.includes(actionId);
  };

  const isEquipped = (character: Character) => {
    return equippedCharacter === character.modelUrl;
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
          padding: '1rem 0.75rem',
          overflowX: 'hidden',
          width: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
        }}
      >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            onClick={() => router.push("/main/lobby")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.filter = "drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "none";
            }}
          >
            <img src="/logo2.png" alt="LOCAL HOST" style={{ height: "70px", width: "auto" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", textShadow: "0 0 20px rgba(0, 255, 255, 0.8)" }}>
            상점
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 215, 0, 0.5)",
              borderRadius: "20px",
              color: "#ffd700",
              fontSize: "0.9rem",
              fontWeight: 700,
              textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
              boxShadow: "0 0 15px rgba(255, 215, 0, 0.3)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))" }}>
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
            </svg>
            <span>{coins.toLocaleString()}p</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", zIndex: 10 }}>
        <button
          onClick={() => setActiveTab('character')}
          style={{
            padding: "1rem 2rem",
            background: activeTab === 'character' ? "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))" : "rgba(0, 0, 0, 0.5)",
            border: activeTab === 'character' ? "3px solid rgba(255, 165, 0, 0.8)" : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          캐릭터
        </button>
        <button
          onClick={() => setActiveTab('action')}
          style={{
            padding: "1rem 2rem",
            background: activeTab === 'action' ? "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))" : "rgba(0, 0, 0, 0.5)",
            border: activeTab === 'action' ? "3px solid rgba(255, 165, 0, 0.8)" : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          행동
        </button>
      </div>

      {/* 콘텐츠 영역 — minHeight 0으로 flex 스크롤 영역 확보 */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        {activeTab === 'character' ? (
          <div style={{ position: "relative", height: "100%", minHeight: "320px", display: "flex", alignItems: "stretch" }}>
            {/* 왼쪽 스크롤 버튼 */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              style={{
                position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)",
                zIndex: 30, width: "48px", height: "48px", flexShrink: 0,
                borderRadius: "50%", background: "rgba(0, 0, 0, 0.8)",
                border: "2px solid rgba(0, 255, 255, 0.6)", color: "#00ffff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", backdropFilter: "blur(10px)",
                boxShadow: "0 0 16px rgba(0, 255, 255, 0.3)",
              }}
              aria-label="왼쪽으로 넘기기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={characterScrollRef}
              id="character-scroll-container"
              style={{
                display: "flex", gap: "2rem", overflowX: "auto", overflowY: "hidden",
                padding: "1rem 3.5rem", height: "100%", width: "100%", minWidth: 0,
                scrollbarWidth: "thin", scrollbarColor: "rgba(0, 255, 255, 0.5) transparent",
                scrollBehavior: "smooth", alignItems: "flex-start", paddingTop: "2rem",
              }}
            >
              {characters.map((character) => {
                const owned = isCharacterOwned(character.id);
                const equipped = isEquipped(character);
                
                return (
                  <div
                    key={character.id}
                    style={{
                      minWidth: "250px", width: "250px", background: "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(10px)",
                      border: equipped ? "3px solid rgba(0, 255, 0, 0.8)" : "2px solid rgba(0, 255, 255, 0.5)",
                      borderRadius: "16px", padding: "1.5rem",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
                      position: "relative", transition: "all 0.3s ease", flexShrink: 0,
                      boxShadow: equipped ? "0 0 30px rgba(0, 255, 0, 0.4)" : "none",
                    }}
                  >
                    {equipped && (
                      <div style={{
                        position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #00ff00, #00cc00)",
                        padding: "0.25rem 1rem", borderRadius: "20px", color: "#000",
                        fontSize: "0.75rem", fontWeight: 700, boxShadow: "0 0 15px rgba(0, 255, 0, 0.5)",
                      }}>
                        장착중
                      </div>
                    )}

                    {owned && !equipped && (
                      <div style={{
                        position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #00ffff, #00cccc)",
                        padding: "0.25rem 1rem", borderRadius: "20px", color: "#000",
                        fontSize: "0.75rem", fontWeight: 700, boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
                      }}>
                        보유중
                      </div>
                    )}

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setPreviewCharacter(character);
                        setPreviewPlayingName(null);
                        setPreviewAnimationNames([]);
                        // 애니 로드 후 첫 애니메이션 자동 선택은 onNames 콜백에서 처리
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (setPreviewCharacter(character), setPreviewPlayingName(null), setPreviewAnimationNames([]))}
                      style={{
                        width: "100%", height: "300px", background: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0, 255, 255, 0.3)",
                        cursor: "pointer", position: "relative",
                      }}
                    >
                      <CharacterModelViewer modelUrl={character.modelUrl} />
                      <div style={{
                        position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)",
                        background: "rgba(0,0,0,0.7)", color: "#00ffff", fontSize: "0.8rem", padding: "4px 10px", borderRadius: "8px",
                      }}>
                        애니메이션 미리보기
                      </div>
                    </div>

                    <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 600 }}>
                      {character.name}
                    </div>

                    {!owned && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#ffd700", filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))" }}>
                          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
                          <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span style={{ color: "#ffd700", fontSize: "1.1rem", fontWeight: 700 }}>
                          {character.price.toLocaleString()}p
                        </span>
                      </div>
                    )}

                    {owned ? (
                      <button
                        onClick={() => handleEquip(character)}
                        disabled={equipped}
                        style={{
                          width: "100%", padding: "0.75rem",
                          background: equipped ? "rgba(0, 255, 0, 0.2)" : "linear-gradient(135deg, rgba(0, 255, 0, 0.3), rgba(0, 200, 0, 0.3))",
                          border: equipped ? "2px solid rgba(0, 255, 0, 0.5)" : "2px solid rgba(0, 255, 0, 0.8)",
                          borderRadius: "8px", color: equipped ? "rgba(0, 255, 0, 0.6)" : "#00ff00",
                          fontSize: "1rem", fontWeight: 600, cursor: equipped ? "default" : "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {equipped ? '장착됨' : '장착하기'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchaseCharacter(character)}
                        disabled={coins < character.price}
                        style={{
                          width: "100%", padding: "0.75rem",
                          background: coins >= character.price ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))" : "rgba(0, 0, 0, 0.3)",
                          border: coins >= character.price ? "2px solid rgba(0, 255, 255, 0.8)" : "2px solid rgba(255, 0, 0, 0.5)",
                          borderRadius: "8px", color: coins >= character.price ? "#00ffff" : "rgba(255, 0, 0, 0.8)",
                          fontSize: "1rem", fontWeight: 600, cursor: coins >= character.price ? "pointer" : "not-allowed",
                          transition: "all 0.3s ease",
                        }}
                      >
                        구매하기
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 오른쪽 스크롤 버튼 */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              style={{
                position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)",
                zIndex: 30, width: "48px", height: "48px", flexShrink: 0,
                borderRadius: "50%", background: "rgba(0, 0, 0, 0.8)",
                border: "2px solid rgba(0, 255, 255, 0.6)", color: "#00ffff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", backdropFilter: "blur(10px)",
                boxShadow: "0 0 16px rgba(0, 255, 255, 0.3)",
              }}
              aria-label="오른쪽으로 넘기기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          /* 행동 탭 */
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", padding: "1rem" }}>
            {actions.map((action) => {
              const owned = isActionOwned(action.id);
              return (
                <div
                  key={action.id}
                  style={{
                    minWidth: "250px", background: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: owned ? "3px solid rgba(0, 255, 0, 0.8)" : "2px solid rgba(255, 0, 255, 0.5)",
                    borderRadius: "16px", padding: "1.5rem",
                    display: "flex", flexDirection: "column", gap: "1rem",
                    position: "relative",
                    boxShadow: owned ? "0 0 20px rgba(0, 255, 0, 0.4)" : "none",
                  }}
                >
                  {owned && (
                    <div style={{
                      position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #00ff00, #00cc00)",
                      padding: "0.25rem 1rem", borderRadius: "20px", color: "#000",
                      fontSize: "0.75rem", fontWeight: 700,
                    }}>
                      보유중
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: "60px", height: "60px", background: "rgba(255, 0, 255, 0.2)",
                      borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid rgba(255, 0, 255, 0.5)",
                    }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff00ff" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: "#ffffff", fontSize: "1.2rem", fontWeight: 600 }}>
                        {action.name}
                      </div>
                      <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.9rem" }}>
                        {action.description}
                      </div>
                    </div>
                  </div>

                  {!owned && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#ffd700" }}>
                        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
                        <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ color: "#ffd700", fontSize: "1rem", fontWeight: 700 }}>
                        {action.price.toLocaleString()}p
                      </span>
                    </div>
                  )}

                  {owned ? (
                    <div style={{
                      padding: "0.75rem", background: "rgba(0, 255, 0, 0.2)",
                      border: "2px solid rgba(0, 255, 0, 0.5)", borderRadius: "8px",
                      color: "rgba(0, 255, 0, 0.8)", fontSize: "1rem", fontWeight: 600,
                      textAlign: "center",
                    }}>
                      보유 중
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchaseAction(action)}
                      disabled={coins < action.price}
                      style={{
                        padding: "0.75rem",
                        background: coins >= action.price ? "linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(200, 0, 255, 0.3))" : "rgba(0, 0, 0, 0.3)",
                        border: coins >= action.price ? "2px solid rgba(255, 0, 255, 0.8)" : "2px solid rgba(255, 0, 0, 0.5)",
                        borderRadius: "8px", color: coins >= action.price ? "#ff00ff" : "rgba(255, 0, 0, 0.8)",
                        fontSize: "1rem", fontWeight: 600, cursor: coins >= action.price ? "pointer" : "not-allowed",
                        transition: "all 0.3s ease",
                      }}
                    >
                      구매하기
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 구매/장착/에러 알림 모달 — 테마 스타일 */}
      {purchaseSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-modal-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setPurchaseSuccessModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "420px",
              width: "100%",
              padding: "2rem 2.5rem",
              textAlign: "center",
              animation: "holoModalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: purchaseSuccessModal.isError
                ? "linear-gradient(160deg, rgba(255, 80, 80, 0.08) 0%, rgba(8, 12, 28, 0.92) 35%, rgba(4, 8, 20, 0.96) 100%)"
                : "linear-gradient(160deg, rgba(0, 255, 255, 0.06) 0%, rgba(8, 12, 28, 0.92) 35%, rgba(4, 8, 20, 0.96) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: purchaseSuccessModal.isError
                ? "1px solid rgba(255, 100, 100, 0.5)"
                : "1px solid rgba(0, 255, 255, 0.45)",
              borderRadius: "20px",
              boxShadow: purchaseSuccessModal.isError
                ? "0 0 0 1px rgba(255, 80, 80, 0.2), 0 0 48px rgba(255, 100, 100, 0.15), inset 0 0 60px rgba(255, 80, 80, 0.03)"
                : "0 0 0 1px rgba(100, 80, 255, 0.2), 0 0 48px rgba(0, 255, 255, 0.18), inset 0 0 60px rgba(0, 255, 255, 0.04)",
            }}
          >
            <div
              id="purchase-modal-title"
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                lineHeight: 1,
              }}
            >
              {purchaseSuccessModal.isError ? "⚠️" : "🎉"}
            </div>
            <p
              style={{
                color: purchaseSuccessModal.isError ? "rgba(255, 180, 180, 0.95)" : "rgba(255, 255, 255, 0.95)",
                fontSize: "1.15rem",
                fontWeight: 600,
                margin: "0 0 1.5rem 0",
                lineHeight: 1.5,
              }}
            >
              {purchaseSuccessModal.message}
            </p>
            <button
              type="button"
              onClick={() => setPurchaseSuccessModal(null)}
              style={{
                padding: "0.75rem 2rem",
                background: purchaseSuccessModal.isError
                  ? "linear-gradient(135deg, rgba(255, 100, 100, 0.25), rgba(200, 60, 60, 0.2))"
                  : "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 200, 220, 0.15))",
                border: purchaseSuccessModal.isError
                  ? "1px solid rgba(255, 100, 100, 0.6)"
                  : "1px solid rgba(0, 255, 255, 0.6)",
                borderRadius: "12px",
                color: purchaseSuccessModal.isError ? "#ff8888" : "#00ffff",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: purchaseSuccessModal.isError
                  ? "0 0 16px rgba(255, 100, 100, 0.2)"
                  : "0 0 20px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = purchaseSuccessModal.isError
                  ? "0 0 24px rgba(255, 100, 100, 0.35)"
                  : "0 0 28px rgba(0, 255, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = purchaseSuccessModal.isError
                  ? "0 0 16px rgba(255, 100, 100, 0.2)"
                  : "0 0 20px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 캐릭터 애니메이션 미리보기 모달 */}
      {previewCharacter && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setPreviewCharacter(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, rgba(20,20,40,0.98), rgba(30,30,50,0.98))",
              backdropFilter: "blur(20px)", border: "3px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "20px", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column",
              overflow: "hidden", boxShadow: "0 0 60px rgba(0, 255, 255, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "2px solid rgba(0,255,255,0.3)" }}>
              <div>
                <h2 style={{ color: "#fff", margin: 0, fontSize: "1.5rem" }}>{previewCharacter.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <span style={{ color: "#ffd700", fontWeight: 700 }}>{previewCharacter.price.toLocaleString()}p</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewCharacter(null)}
                style={{
                  background: "rgba(255,0,0,0.3)", border: "2px solid rgba(255,0,0,0.8)", borderRadius: "10px",
                  color: "#ff6666", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem",
                }}
              >
                닫기
              </button>
            </div>
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
              <div style={{ width: "400px", height: "400px", flexShrink: 0 }} key={toAnimatedCharacterPath(previewCharacter.modelUrl)}>
                <Canvas camera={{ position: [0, 0.3, 2.2], fov: 52 }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Environment preset="city" />
                  <Suspense fallback={null}>
                    <AnimatedModel
                      url={toAnimatedCharacterPath(previewCharacter.modelUrl)}
                      playingName={previewPlayingName}
                      onNames={(names) => {
                        setPreviewAnimationNames(names);
                        if (names.length > 0) setPreviewPlayingName(prev => prev ?? names[0]);
                      }}
                      scaleModal
                      loop
                    />
                  </Suspense>
                  <OrbitControls autoRotate={false} enableZoom={false} enablePan={false} enableRotate={true} />
                </Canvas>
              </div>
              <div style={{ padding: "1rem 1.5rem", overflowY: "auto", minWidth: "200px" }}>
                <div style={{ color: "#00ffff", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  재생할 동작 선택
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  아래 버튼을 누르면 미리보기에서 해당 애니메이션이 재생됩니다. (1) 붙은 파일에만 행동이 있습니다.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {previewAnimationNames.length ? previewAnimationNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => setPreviewPlayingName(name === previewPlayingName ? null : name)}
                      style={{
                        padding: "0.6rem 1rem", background: previewPlayingName === name ? "rgba(0,255,255,0.3)" : "rgba(0,255,255,0.1)",
                        border: `2px solid ${previewPlayingName === name ? "rgba(0,255,255,0.8)" : "rgba(0,255,255,0.4)"}`,
                        borderRadius: "8px", color: "#00ffff", cursor: "pointer", textAlign: "left", fontSize: "0.9rem",
                      }}
                    >
                      {previewPlayingName === name ? "■ " : "▶ "}{name}
                    </button>
                  )) : (
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                      캐릭터 (1) 버전 로딩 중… 이 캐릭터에 애니가 없으면 목록이 비어 있을 수 있습니다.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      <style jsx>{`
        @keyframes holoModalPop {
          from {
            opacity: 0;
            transform: scale(0.88) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
