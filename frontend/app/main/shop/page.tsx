"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from 'three';

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

// Model 컴포넌트
function Model({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  
  // 모든 애니메이션 정지
  useEffect(() => {
    Object.values(actions).forEach(action => {
      action?.stop();
    });
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -1.0 : 0;
  const scale = isCharacter1 ? 2.5 : 2.5;
  
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

// 캐릭터 모델 뷰어 컴포넌트
function CharacterModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0.5, 4.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} />
        <OrbitControls 
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [coins, setCoins] = useState(2000);
  const [activeTab, setActiveTab] = useState<'character' | 'action'>('character');
  const [purchasedCharacters, setPurchasedCharacters] = useState<string[]>([]);
  const [purchasedActions, setPurchasedActions] = useState<string[]>([]);
  const [equippedCharacter, setEquippedCharacter] = useState<string>('');

  // 코인 및 구매 정보 불러오기
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/auth/login');
      return;
    }
    setUserId(storedUserId);

    // 코인 불러오기 (사용자별)
    const savedCoins = localStorage.getItem(`userCoins-${storedUserId}`);
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    } else {
      setCoins(1000);
      localStorage.setItem(`userCoins-${storedUserId}`, '1000');
    }

    // 구매한 캐릭터 불러오기 (사용자별)
    const purchased = JSON.parse(localStorage.getItem(`purchasedCharacters-${storedUserId}`) || '["char1"]');
    setPurchasedCharacters(purchased);

    // 구매한 행동 불러오기 (사용자별)
    const purchasedActs = JSON.parse(localStorage.getItem(`purchasedActions-${storedUserId}`) || '[]');
    setPurchasedActions(purchasedActs);

    // 장착한 캐릭터 불러오기
    const equipped = localStorage.getItem(`equipped-character-${storedUserId}`);
    setEquippedCharacter(equipped || '/character1.glb');
  }, [router]);

  // 캐릭터 데이터
  const characters: Character[] = [
    { id: 'char1', name: '기본 캐릭터', price: 0, modelUrl: '/character1.glb' },
    { id: 'char2', name: '소년', price: 500, modelUrl: '/boy.glb' },
    { id: 'char3', name: '토끼', price: 800, modelUrl: '/bunny.glb' },
    { id: 'char4', name: '귀여운 소녀', price: 1000, modelUrl: '/cute+girl.glb' },
    { id: 'char5', name: '헬스왕', price: 1500, modelUrl: '/gym+rat.glb' },
    { id: 'char6', name: '햄스터', price: 1200, modelUrl: '/hamster.glb' },
    { id: 'char7', name: '펭귄', price: 1000, modelUrl: '/penguin.glb' },
    { id: 'char8', name: '공주', price: 2000, modelUrl: '/princess.glb' },
    { id: 'char9', name: '스타일리시 소녀', price: 1800, modelUrl: '/stylized+girl.glb' },
    { id: 'char10', name: '마법사', price: 2500, modelUrl: '/wizard.glb' },
  ];

  // 행동 데이터
  const actions: Action[] = [
    { id: 'action1', name: '춤추기', price: 500, description: '신나는 춤을 춥니다' },
    { id: 'action2', name: '인사하기', price: 300, description: '손을 흔들어 인사합니다' },
    { id: 'action3', name: '점프', price: 400, description: '높이 점프합니다' },
  ];

  const handlePurchaseCharacter = (item: Character) => {
    if (coins < item.price) {
      alert('코인이 부족합니다!');
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

    alert(`${item.name}을(를) 구매했습니다!`);
  };

  const handlePurchaseAction = (item: Action) => {
    if (coins < item.price) {
      alert('코인이 부족합니다!');
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

    alert(`${item.name}을(를) 구매했습니다!`);
  };

  const handleEquip = (character: Character) => {
    localStorage.setItem(`equipped-character-${userId}`, character.modelUrl);
    setEquippedCharacter(character.modelUrl);
    alert(`${character.name}을(를) 장착했습니다!`);
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
        position: "relative",
        padding: "1rem 2rem",
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
            <img src="/logo.png" alt="Localhost Logo" style={{ height: "70px", width: "auto" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", textShadow: "0 0 20px rgba(0, 255, 255, 0.8)" }}>
            STORE
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
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
              <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
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

      {/* 콘텐츠 영역 */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {activeTab === 'character' ? (
          <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
            {/* 왼쪽 화살표 */}
            <button
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              style={{
                position: "absolute", left: "1rem", zIndex: 20, width: "50px", height: "50px",
                borderRadius: "50%", background: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(0, 255, 255, 0.6)", color: "#00ffff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s ease", backdropFilter: "blur(10px)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              id="character-scroll-container"
              style={{
                display: "flex", gap: "2rem", overflowX: "auto", overflowY: "hidden",
                padding: "1rem 4rem", height: "100%", width: "100%",
                scrollbarWidth: "thin", scrollbarColor: "rgba(0, 255, 255, 0.5) transparent",
                scrollBehavior: "smooth", alignItems: "flex-start", paddingTop: "2rem",
              }}
              onWheel={(e) => { e.preventDefault(); e.currentTarget.scrollLeft += e.deltaY; }}
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

                    <div style={{
                      width: "100%", height: "300px", background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0, 255, 255, 0.3)",
                    }}>
                      <CharacterModelViewer modelUrl={character.modelUrl} />
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

            {/* 오른쪽 화살표 */}
            <button
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              style={{
                position: "absolute", right: "1rem", zIndex: 20, width: "50px", height: "50px",
                borderRadius: "50%", background: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(0, 255, 255, 0.6)", color: "#00ffff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s ease", backdropFilter: "blur(10px)",
              }}
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
    </main>
  );
}
