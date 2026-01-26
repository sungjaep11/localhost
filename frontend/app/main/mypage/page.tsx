"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
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

// 3D 모델 컴포넌트 (메인용)
function Model({ url, scale = 3.5 }: { url: string; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // 모든 애니메이션 정지
  useEffect(() => {
    Object.values(actions).forEach(action => {
      action?.stop();
    });
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const modelScale = isCharacter1 ? 2.5 : 2.8;
  const positionY = isCharacter1 ? -1.3 : -0.2;
  
  return <primitive ref={group} object={clonedScene} scale={modelScale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

// 3D 모델 컴포넌트 (작은 박스용)
function SmallModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => {
      action?.stop();
    });
  }, [actions]);
  
  const isCharacter1 = url.includes('character1');
  const modelScale = isCharacter1 ? 1.5 : 1.6;
  const positionY = isCharacter1 ? -0.9 : 0.05;
  
  return <primitive ref={group} object={clonedScene} scale={modelScale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

// 메인 캐릭터 뷰어
function MainCharacterViewer({ modelUrl }: { modelUrl: string }) {
  const isCharacter1 = modelUrl.includes('character1');
  const cameraY = isCharacter1 ? 0.1 : 0.6;
  const cameraZ = isCharacter1 ? 4.2 : 4.8;
  
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, cameraY, cameraZ], fov: 40 }}>
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
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`floating-note note-${i}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        ))}
      </div>

      {/* 게임 스타일 파티클 효과 */}
      <div className="game-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
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
          className="game-button back-button"
          onClick={() => router.push("/main/lobby")}
          style={{
            background: "linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 30, 50, 0.6))",
            border: "3px solid rgba(0, 255, 255, 0.7)",
            borderRadius: "16px",
            padding: "0.875rem 1.25rem",
            color: "#00ffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.1)",
            textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 1)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.15)";
            e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.7)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          뒤로
        </button>

        <h1
          className="game-title"
          style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #00ffff, #ff00ff, #00ffff)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.5)",
            animation: "titleShine 3s ease-in-out infinite",
            letterSpacing: "0.1em",
          }}
        >
          MYHOME
        </h1>

        {/* 코인 표시 - 게임 스타일 */}
        <div
          className="game-coin-display"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.5rem",
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 200, 0, 0.2))",
            backdropFilter: "blur(15px)",
            border: "3px solid rgba(255, 215, 0, 0.7)",
            borderRadius: "16px",
            color: "#ffd700",
            fontSize: "1.1rem",
            fontWeight: 700,
            boxShadow: "0 0 25px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.6)",
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
          {/* 프로필 카드 - 게임 스타일 */}
          <div
            className="game-card"
            style={{
              background: "linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 60, 0.9))",
              backdropFilter: "blur(20px)",
              border: "3px solid rgba(0, 255, 255, 0.6)",
              borderRadius: "20px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              boxShadow: "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 카드 내부 글로우 효과 */}
            <div
              style={{
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)",
                animation: "cardGlow 3s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
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
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    textShadow: "0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.4)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {userName}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    background: "rgba(0, 255, 255, 0.2)",
                    border: "2px solid rgba(0, 255, 255, 0.6)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    color: "#00ffff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
                    e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.3)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}

            {/* 캐릭터 미리보기 - 게임 스타일 */}
            <div
              style={{
                width: "100%",
                height: "280px",
                background: "linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 30, 50, 0.6))",
                border: "3px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "16px",
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 0 25px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.1)",
              }}
            >
              <MainCharacterViewer modelUrl={equippedCharacter} />
              {/* 캐릭터 프레임 효과 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: "2px solid rgba(0, 255, 255, 0.3)",
                  borderRadius: "16px",
                  pointerEvents: "none",
                  boxShadow: "inset 0 0 30px rgba(0, 255, 255, 0.2)",
                }}
              />
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

          {/* 상점 바로가기 - 게임 스타일 버튼 */}
          <button
            className="game-button shop-button"
            onClick={() => router.push('/main/shop')}
            style={{
              width: "100%",
              padding: "1.25rem",
              background: "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))",
              border: "3px solid rgba(255, 165, 0, 0.8)",
              borderRadius: "16px",
              color: "#ffa500",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              boxShadow: "0 0 20px rgba(255, 165, 0, 0.4), inset 0 0 15px rgba(255, 165, 0, 0.1)",
              textShadow: "0 0 10px rgba(255, 165, 0, 0.5)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 165, 0, 0.5), rgba(255, 200, 0, 0.5))";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 165, 0, 0.6), inset 0 0 20px rgba(255, 165, 0, 0.2)";
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 200, 0, 0.3))";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 165, 0, 0.4), inset 0 0 15px rgba(255, 165, 0, 0.1)";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            상점 가기
          </button>
        </div>

        {/* 오른쪽 - 보유 아이템 - 게임 스타일 */}
        <div
          className="game-panel"
          style={{
            flex: 1,
            minHeight: 0,
            maxHeight: "calc(100% - 1rem)",
            marginBottom: "1rem",
            background: "linear-gradient(135deg, rgba(40, 40, 50, 0.95), rgba(50, 50, 60, 0.95))",
            backdropFilter: "blur(20px)",
            border: "3px solid rgba(0, 255, 255, 0.6)",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0, 255, 255, 0.1)",
            position: "relative",
          }}
        >
          {/* 패널 내부 글로우 효과 */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(100, 100, 120, 0.15) 0%, transparent 70%)",
              animation: "panelGlow 4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          {/* 탭 헤더 */}
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid rgba(0, 255, 255, 0.3)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setActiveTab('characters')}
              className="game-tab"
              style={{
                flex: 1,
                padding: "1.25rem",
                background: activeTab === 'characters' 
                  ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(0, 200, 255, 0.3))" 
                  : "transparent",
                border: "none",
                borderBottom: activeTab === 'characters' 
                  ? "4px solid #00ffff" 
                  : "4px solid transparent",
                color: activeTab === 'characters' ? "#00ffff" : "rgba(255, 255, 255, 0.6)",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                textShadow: activeTab === 'characters' ? "0 0 10px rgba(0, 255, 255, 0.8)" : "none",
                boxShadow: activeTab === 'characters' ? "inset 0 0 20px rgba(0, 255, 255, 0.1)" : "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              캐릭터 ({ownedCharacters.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className="game-tab"
              style={{
                flex: 1,
                padding: "1.25rem",
                background: activeTab === 'actions' 
                  ? "linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(200, 0, 255, 0.3))" 
                  : "transparent",
                border: "none",
                borderBottom: activeTab === 'actions' 
                  ? "4px solid #ff00ff" 
                  : "4px solid transparent",
                color: activeTab === 'actions' ? "#ff00ff" : "rgba(255, 255, 255, 0.6)",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                textShadow: activeTab === 'actions' ? "0 0 10px rgba(255, 0, 255, 0.8)" : "none",
                boxShadow: activeTab === 'actions' ? "inset 0 0 20px rgba(255, 0, 255, 0.1)" : "none",
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
                          {action.name}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          fontSize: "0.9rem",
                          marginTop: "0.5rem",
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
    </main>
  );
}
