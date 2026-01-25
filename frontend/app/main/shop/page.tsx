"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

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
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={3} position={[0, -1.5, 0]} />;
}

// 캐릭터 모델 뷰어 컴포넌트
function CharacterModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} />
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

export default function ShopPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(2000);
  const [activeTab, setActiveTab] = useState<'character' | 'action'>('character');

  // 코인 불러오기
  useEffect(() => {
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    } else {
      setCoins(2000);
      localStorage.setItem('userCoins', '2000');
    }
  }, []);

  // 캐릭터 데이터 (나중에 API나 데이터베이스에서 가져올 수 있음)
  const characters: Character[] = [
    { id: 'char1', name: '캐릭터 1', price: 1500, modelUrl: '/character1.glb' },
    { id: 'char2', name: '캐릭터 2', price: 1000, modelUrl: '/character1.glb' },
    { id: 'char3', name: '캐릭터 3', price: 850, modelUrl: '/character1.glb' },
    { id: 'char4', name: '캐릭터 4', price: 2000, modelUrl: '/character1.glb' },
    { id: 'char5', name: '캐릭터 5', price: 1200, modelUrl: '/character1.glb' },
  ];

  // 행동 데이터 (나중에 추가)
  const actions: Action[] = [
    // 조만간 추가 예정
  ];

  const handlePurchase = (item: Character | Action, type: 'character' | 'action') => {
    if (coins < item.price) {
      alert('코인이 부족합니다!');
      return;
    }

    // 구매 처리
    const newCoins = coins - item.price;
    setCoins(newCoins);
    localStorage.setItem('userCoins', newCoins.toString());

    // 구매한 아이템 저장 (나중에 사용)
    const purchasedKey = type === 'character' ? 'purchasedCharacters' : 'purchasedActions';
    const purchased = JSON.parse(localStorage.getItem(purchasedKey) || '[]');
    purchased.push(item.id);
    localStorage.setItem(purchasedKey, JSON.stringify(purchased));

    alert(`${item.name}을(를) 구매했습니다!`);
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

      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* 로고 */}
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
            <img
              src="/logo.png"
              alt="Localhost Logo"
              style={{
                height: "100px",
                width: "auto",
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* STORE 텍스트 */}
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#ffffff",
              textShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
            }}
          >
            STORE
          </h1>

          {/* 코인 표시 */}
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
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{
                filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))",
              }}
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
              <path 
                d="M12 6v12M8 10h8M8 14h8" 
                stroke="#000" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>
            <span>{coins.toLocaleString()}p</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setActiveTab('character')}
          style={{
            padding: "1rem 2rem",
            background: activeTab === 'character'
              ? "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))"
              : "rgba(0, 0, 0, 0.5)",
            border: activeTab === 'character'
              ? "3px solid rgba(255, 165, 0, 0.8)"
              : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'character') {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'character') {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }
          }}
        >
          캐릭터
        </button>
        <button
          onClick={() => setActiveTab('action')}
          style={{
            padding: "1rem 2rem",
            background: activeTab === 'action'
              ? "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))"
              : "rgba(0, 0, 0, 0.5)",
            border: activeTab === 'action'
              ? "3px solid rgba(255, 165, 0, 0.8)"
              : "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'action') {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'action') {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }
          }}
        >
          행동
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {activeTab === 'character' ? (
          /* 캐릭터 탭 */
          <div
            style={{
              position: "relative",
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* 왼쪽 화살표 */}
            <button
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) {
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }
              }}
              style={{
                position: "absolute",
                left: "1rem",
                zIndex: 20,
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(0, 255, 255, 0.6)",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 캐릭터 스크롤 컨테이너 */}
            <div
              id="character-scroll-container"
              style={{
                display: "flex",
                gap: "2rem",
                overflowX: "auto",
                overflowY: "hidden",
                padding: "1rem 4rem",
                height: "100%",
                width: "100%",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(0, 255, 255, 0.5) transparent",
                scrollBehavior: "smooth",
                alignItems: "flex-start",
                paddingTop: "2rem",
              }}
              onWheel={(e) => {
                e.preventDefault();
                const container = e.currentTarget;
                container.scrollLeft += e.deltaY;
              }}
            >
            {characters.map((character) => (
              <div
                key={character.id}
                style={{
                  minWidth: "250px",
                  width: "250px",
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(0, 255, 255, 0.5)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  position: "relative",
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* 3D 캐릭터 */}
                <div
                  style={{
                    width: "100%",
                    height: "300px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                  }}
                >
                  <CharacterModelViewer modelUrl={character.modelUrl} />
                </div>

                {/* 캐릭터 이름 */}
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {character.name}
                </div>

                {/* 가격 및 구매 버튼 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "auto",
                  }}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    style={{
                      color: "#ffd700",
                      filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))",
                    }}
                  >
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
                    <path 
                      d="M12 6v12M8 10h8M8 14h8" 
                      stroke="#000" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    style={{
                      color: "#ffd700",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  >
                    {character.price.toLocaleString()}p
                  </span>
                </div>

                <button
                  onClick={() => handlePurchase(character, 'character')}
                  disabled={coins < character.price}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: coins >= character.price
                      ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))"
                      : "rgba(0, 0, 0, 0.3)",
                    border: coins >= character.price
                      ? "2px solid rgba(0, 255, 255, 0.8)"
                      : "2px solid rgba(255, 0, 0, 0.5)",
                    borderRadius: "8px",
                    color: coins >= character.price ? "#00ffff" : "rgba(255, 0, 0, 0.8)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: coins >= character.price ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (coins >= character.price) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (coins >= character.price) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  구매하기
                </button>
              </div>
            ))}
            </div>

            {/* 오른쪽 화살표 */}
            <button
              onClick={() => {
                const container = document.getElementById('character-scroll-container');
                if (container) {
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }
              }}
              style={{
                position: "absolute",
                right: "1rem",
                zIndex: 20,
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(0, 255, 255, 0.6)",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.9)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.6)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          /* 행동 탭 */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "1.2rem",
            }}
          >
            조만간 캐릭터 행동을 구매할 수 있습니다!
          </div>
        )}
      </div>
    </main>
  );
}
