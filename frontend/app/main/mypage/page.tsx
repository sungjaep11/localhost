"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from 'three';

interface Character {
  id: string;
  name: string;
  modelUrl: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
}

// 캐릭터 목록 (상점과 동일)
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

// 행동 목록
const ALL_ACTIONS: Action[] = [
  { id: 'action1', name: '춤추기', description: '신나는 춤을 춥니다' },
  { id: 'action2', name: '인사하기', description: '손을 흔들어 인사합니다' },
  { id: 'action3', name: '점프', description: '높이 점프합니다' },
];

// 3D 모델 컴포넌트
function Model({ url, scale = 3.5 }: { url: string; scale?: number }) {
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
  const positionY = isCharacter1 ? -1.8 : 0;
  
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

// 메인 캐릭터 뷰어
function MainCharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0.5, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} scale={3} />
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

// 작은 캐릭터 뷰어
function SmallCharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0.3, 3.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} scale={1.8} />
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

export default function MyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [coins, setCoins] = useState(0);
  const [equippedCharacter, setEquippedCharacter] = useState('/character1.glb');
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>([]);
  const [ownedActions, setOwnedActions] = useState<Action[]>([]);
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

    // 코인 불러오기
    const savedCoins = localStorage.getItem(`userCoins-${storedUserId}`);
    setCoins(savedCoins ? parseInt(savedCoins, 10) : 1000);

    // 장착된 캐릭터 불러오기
    const equipped = localStorage.getItem(`equipped-character-${storedUserId}`);
    setEquippedCharacter(equipped || '/character1.glb');

    // 보유한 캐릭터 불러오기
    const purchasedCharacterIds = JSON.parse(
      localStorage.getItem(`purchasedCharacters-${storedUserId}`) || '["char1"]'
    );
    const owned = ALL_CHARACTERS.filter(c => purchasedCharacterIds.includes(c.id));
    setOwnedCharacters(owned);

    // 보유한 행동 불러오기
    const purchasedActionIds = JSON.parse(
      localStorage.getItem(`purchasedActions-${storedUserId}`) || '[]'
    );
    const ownedActs = ALL_ACTIONS.filter(a => purchasedActionIds.includes(a.id));
    setOwnedActions(ownedActs);
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
          marginBottom: "1.5rem",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push("/main/lobby")}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            color: "#00ffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          뒤로
        </button>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
          }}
        >
          MYHOME
        </h1>

        {/* 코인 표시 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 215, 0, 0.5)",
            borderRadius: "12px",
            color: "#ffd700",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
            <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
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
          {/* 프로필 카드 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(0, 255, 255, 0.5)",
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
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
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "2px solid rgba(0, 255, 255, 0.5)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#ffffff",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    background: "rgba(0, 255, 0, 0.3)",
                    border: "2px solid rgba(0, 255, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#00ff00",
                    cursor: "pointer",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(userName);
                  }}
                  style={{
                    background: "rgba(255, 0, 0, 0.3)",
                    border: "2px solid rgba(255, 0, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#ff4444",
                    cursor: "pointer",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
                    textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
                  }}
                >
                  {userName}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    background: "rgba(0, 255, 255, 0.2)",
                    border: "1px solid rgba(0, 255, 255, 0.5)",
                    borderRadius: "6px",
                    padding: "0.4rem",
                    color: "#00ffff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}

            {/* 캐릭터 미리보기 */}
            <div
              style={{
                width: "100%",
                height: "280px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "2px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <MainCharacterViewer modelUrl={equippedCharacter} />
            </div>

            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.85rem",
              }}
            >
              현재 장착 중인 캐릭터
            </div>
          </div>

          {/* 상점 바로가기 */}
          <button
            onClick={() => router.push('/main/shop')}
            style={{
              width: "100%",
              padding: "1rem",
              background: "linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 200, 0, 0.2))",
              border: "2px solid rgba(255, 165, 0, 0.6)",
              borderRadius: "12px",
              color: "#ffa500",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 165, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 200, 0, 0.2))";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            상점 가기
          </button>
        </div>

        {/* 오른쪽 - 보유 아이템 */}
        <div
          style={{
            flex: 1,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 탭 헤더 */}
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid rgba(0, 255, 255, 0.3)",
            }}
          >
            <button
              onClick={() => setActiveTab('characters')}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === 'characters' 
                  ? "rgba(0, 255, 255, 0.2)" 
                  : "transparent",
                border: "none",
                borderBottom: activeTab === 'characters' 
                  ? "3px solid #00ffff" 
                  : "3px solid transparent",
                color: activeTab === 'characters' ? "#00ffff" : "rgba(255, 255, 255, 0.6)",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              캐릭터 ({ownedCharacters.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === 'actions' 
                  ? "rgba(255, 0, 255, 0.2)" 
                  : "transparent",
                border: "none",
                borderBottom: activeTab === 'actions' 
                  ? "3px solid #ff00ff" 
                  : "3px solid transparent",
                color: activeTab === 'actions' ? "#ff00ff" : "rgba(255, 255, 255, 0.6)",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              행동 ({ownedActions.length})
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div
            style={{
              flex: 1,
              padding: "1.5rem",
              overflowY: "auto",
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
                        onClick={() => !isEquipped && handleEquipCharacter(character)}
                        style={{
                          background: isEquipped 
                            ? "rgba(0, 255, 0, 0.1)" 
                            : "rgba(0, 0, 0, 0.4)",
                          border: isEquipped 
                            ? "3px solid rgba(0, 255, 0, 0.8)" 
                            : "2px solid rgba(0, 255, 255, 0.4)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          cursor: isEquipped ? "default" : "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: isEquipped 
                            ? "0 0 20px rgba(0, 255, 0, 0.3)" 
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isEquipped) {
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isEquipped) {
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                {ownedActions.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "3rem",
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    보유한 행동이 없습니다. 상점에서 구매해보세요!
                  </div>
                ) : (
                  ownedActions.map((action) => (
                    <div
                      key={action.id}
                      style={{
                        background: "rgba(255, 0, 255, 0.1)",
                        border: "2px solid rgba(255, 0, 255, 0.4)",
                        borderRadius: "12px",
                        padding: "1.25rem",
                        transition: "all 0.3s ease",
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
                            fontSize: "1rem",
                            fontWeight: 600,
                          }}
                        >
                          {action.name}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {action.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
