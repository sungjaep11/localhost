"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

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
  { id: 'char2', name: '캐릭터 2', modelUrl: '/character1.glb' },
  { id: 'char3', name: '캐릭터 3', modelUrl: '/character1.glb' },
  { id: 'char4', name: '캐릭터 4', modelUrl: '/character1.glb' },
  { id: 'char5', name: '캐릭터 5', modelUrl: '/character1.glb' },
];

// 행동 목록
const ALL_ACTIONS: Action[] = [
  { id: 'action1', name: '춤추기', description: '신나는 춤을 춥니다' },
  { id: 'action2', name: '인사하기', description: '손을 흔들어 인사합니다' },
  { id: 'action3', name: '점프', description: '높이 점프합니다' },
];

// 3D 모델 컴포넌트
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={3.5} position={[0, -2, 0]} />;
}

// 메인 캐릭터 뷰어
function MainCharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 2, 7], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={modelUrl} />
        <OrbitControls 
          autoRotate={true}
          autoRotateSpeed={2}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

// 작은 캐릭터 뷰어
function SmallModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
}

function SmallCharacterViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
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
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>([]);
  const [ownedActions, setOwnedActions] = useState<Action[]>([]);

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

    // localStorage에 저장
    localStorage.setItem('userName', newName);
    
    // users 목록에서도 업데이트
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
    alert('닉네임이 변경되었습니다!');
  };

  const handleEquipCharacter = (character: Character) => {
    localStorage.setItem(`equipped-character-${userId}`, character.modelUrl);
    setEquippedCharacter(character.modelUrl);
    alert(`${character.name}을(를) 장착했습니다!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    router.push('/auth/login');
  };

  return (
    <main
      style={{
        height: "100vh",
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto",
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
              height: "80px",
              width: "auto",
            }}
          />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#ffffff",
              textShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
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
              padding: "0.5rem 1rem",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 215, 0, 0.5)",
              borderRadius: "20px",
              color: "#ffd700",
              fontSize: "1rem",
              fontWeight: 700,
              textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
              boxShadow: "0 0 15px rgba(255, 215, 0, 0.3)",
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))" }}
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
              <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{coins.toLocaleString()}p</span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "0.75rem 1.5rem",
              background: "rgba(255, 0, 0, 0.2)",
              border: "2px solid rgba(255, 0, 0, 0.6)",
              borderRadius: "12px",
              color: "#ff4444",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 0, 0, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 0, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 0, 0, 0.2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
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
        {/* 왼쪽 - 메인 캐릭터 */}
        <div
          style={{
            width: "350px",
            minWidth: "350px",
            maxWidth: "350px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          {/* 닉네임 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(0, 0, 0, 0.6)",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              border: "2px solid rgba(0, 255, 255, 0.5)",
            }}
          >
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(0, 255, 255, 0.5)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#ffffff",
                    fontSize: "1.2rem",
                    outline: "none",
                    width: "150px",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    background: "rgba(0, 255, 0, 0.3)",
                    border: "1px solid rgba(0, 255, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#00ff00",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(userName);
                  }}
                  style={{
                    background: "rgba(255, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 0, 0, 0.6)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#ff4444",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                  }}
                >
                  {userName}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#00ffff",
                    padding: "0.25rem",
                  }}
                  title="닉네임 수정"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* 메인 캐릭터 표시 */}
          <div
            style={{
              width: "350px",
              height: "400px",
              minHeight: "400px",
              maxHeight: "400px",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              border: "3px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 0 40px rgba(0, 255, 255, 0.3)",
              position: "relative",
            }}
          >
            <MainCharacterViewer modelUrl={equippedCharacter} />
          </div>

          <div
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            현재 장착된 캐릭터
          </div>
        </div>

        {/* 오른쪽 - 보유 아이템 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            overflow: "auto",
          }}
        >
          {/* 보유 캐릭터 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(0, 255, 255, 0.5)",
              borderRadius: "16px",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                color: "#00ffff",
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              보유 캐릭터 ({ownedCharacters.length}개)
            </h2>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
              }}
            >
              {ownedCharacters.length === 0 ? (
                <div style={{ color: "rgba(255, 255, 255, 0.5)", padding: "1rem" }}>
                  보유한 캐릭터가 없습니다.
                </div>
              ) : (
                ownedCharacters.map((character) => {
                  const isEquipped = equippedCharacter === character.modelUrl;
                  return (
                    <div
                      key={character.id}
                      style={{
                        minWidth: "140px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "140px",
                          height: "160px",
                          background: "rgba(0, 0, 0, 0.4)",
                          border: isEquipped 
                            ? "3px solid rgba(0, 255, 0, 0.8)"
                            : "2px solid rgba(0, 255, 255, 0.4)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: isEquipped 
                            ? "0 0 20px rgba(0, 255, 0, 0.4)"
                            : "none",
                          position: "relative",
                        }}
                      >
                        <SmallCharacterViewer modelUrl={character.modelUrl} />
                      </div>
                      <div style={{ color: "#ffffff", fontSize: "0.9rem", fontWeight: 600 }}>
                        {character.name}
                      </div>
                      {isEquipped ? (
                        <div
                          style={{
                            background: "rgba(0, 255, 0, 0.3)",
                            border: "1px solid rgba(0, 255, 0, 0.6)",
                            borderRadius: "6px",
                            padding: "0.25rem 0.75rem",
                            color: "#00ff00",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          장착중
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipCharacter(character)}
                          style={{
                            background: "rgba(0, 255, 255, 0.2)",
                            border: "1px solid rgba(0, 255, 255, 0.6)",
                            borderRadius: "6px",
                            padding: "0.25rem 0.75rem",
                            color: "#00ffff",
                            fontSize: "0.75rem",
                            fontWeight: 600,
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
                          장착하기
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => router.push('/main/shop')}
              style={{
                marginTop: "1rem",
                background: "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))",
                border: "2px solid rgba(255, 165, 0, 0.6)",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                color: "#ffa500",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 165, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              상점에서 더 구매하기
            </button>
          </div>

          {/* 보유 행동 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 0, 255, 0.5)",
              borderRadius: "16px",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                color: "#ff00ff",
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              보유 행동 ({ownedActions.length}개)
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              {ownedActions.length === 0 ? (
                <div style={{ color: "rgba(255, 255, 255, 0.5)", padding: "1rem" }}>
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
                      padding: "1rem",
                      minWidth: "150px",
                    }}
                  >
                    <div style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      {action.name}
                    </div>
                    <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem" }}>
                      {action.description}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => router.push('/main/shop')}
              style={{
                marginTop: "1rem",
                background: "linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(200, 0, 255, 0.3))",
                border: "2px solid rgba(255, 0, 255, 0.6)",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                color: "#ff00ff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 0, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              상점에서 행동 구매하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
