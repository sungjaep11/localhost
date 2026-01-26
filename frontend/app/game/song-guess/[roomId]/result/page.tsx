"use client";

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from 'three';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  character?: string;
  coinEarned: number;
  rank: number;
}

// 3D 모델 컴포넌트
function Model({ url, scale = 2.5 }: { url: string; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -2.0 : -0.8;
  
  return <primitive ref={group} object={scene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}

// 캐릭터 뷰어 컴포넌트
function CharacterViewer({ characterUrl, size = 150 }: { characterUrl: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={characterUrl} scale={size > 150 ? 3 : 2} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}

// 순위별 색상
const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return { bg: 'rgba(255, 215, 0, 0.3)', border: 'rgba(255, 215, 0, 0.8)', text: '#ffd700' };
    case 2: return { bg: 'rgba(192, 192, 192, 0.3)', border: 'rgba(192, 192, 192, 0.8)', text: '#c0c0c0' };
    case 3: return { bg: 'rgba(205, 127, 50, 0.3)', border: 'rgba(205, 127, 50, 0.8)', text: '#cd7f32' };
    default: return { bg: 'rgba(0, 255, 255, 0.1)', border: 'rgba(0, 255, 255, 0.5)', text: '#00ffff' };
  }
};

// 순위별 코인 계산
const calculateCoins = (rank: number, totalPlayers: number): number => {
  if (rank === 1) return 300;
  if (rank === 2) return 200;
  if (rank === 3) return 100;
  return 50; // 참가 보상
};

export default function GameResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [myResult, setMyResult] = useState<PlayerResult | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) setCurrentUserId(userId);

    // 게임 결과 불러오기
    const resultsKey = `song-guess-room-${roomId}-results`;
    const storedResults = localStorage.getItem(resultsKey);
    
    if (storedResults) {
      try {
        const parsedResults: PlayerResult[] = JSON.parse(storedResults);
        // 점수 순으로 정렬하고 순위 부여
        const sortedResults = parsedResults
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            ...player,
            rank: index + 1,
            coinEarned: calculateCoins(index + 1, parsedResults.length),
          }));
        
        setResults(sortedResults);
        
        // 내 결과 찾기
        const myRes = sortedResults.find(r => r.id === userId);
        if (myRes) {
          setMyResult(myRes);
          
          // 코인 지급
          const currentCoins = parseInt(localStorage.getItem(`userCoins-${userId}`) || '1000', 10);
          const newCoins = currentCoins + myRes.coinEarned;
          localStorage.setItem(`userCoins-${userId}`, newCoins.toString());
        }
        
        // 코인 애니메이션 표시
        setTimeout(() => setShowCoinAnimation(true), 500);
      } catch (e) {
        console.error('Failed to parse results', e);
      }
    }
  }, [roomId]);

  const handleGoToLobby = () => {
    // 게임 데이터 정리
    localStorage.removeItem(`song-guess-room-${roomId}-results`);
    router.push('/main/lobby');
  };

  const handlePlayAgain = () => {
    // 게임 데이터 정리
    localStorage.removeItem(`song-guess-room-${roomId}-results`);
    router.push(`/game/song-guess/${roomId}/waiting`);
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
        alignItems: "center",
        padding: "2rem",
        position: "relative",
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

      <p
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "1.1rem",
          marginBottom: "2rem",
        }}
      >
        최종 결과입니다
      </p>

      {/* 코인 획득 애니메이션 */}
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
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
            }}
          >
            🎉
          </div>
          <div
            style={{
              color: "#ffd700",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            {myResult.rank}등!
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              color: "#ffd700",
              fontSize: "2rem",
              fontWeight: 800,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
              <path d="M12 6v12M8 10h8M8 14h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            +{myResult.coinEarned}
          </div>
          <button
            onClick={() => setShowCoinAnimation(false)}
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

      {/* 결과 리스트 */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          flex: 1,
          overflowY: "auto",
          marginBottom: "1.5rem",
        }}
      >
        {/* 상위 3명 (트로피 영역) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "1.5rem",
            marginBottom: "2rem",
            padding: "1rem",
          }}
        >
          {/* 2등 */}
          {results[1] && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: "translateY(30px)",
              }}
            >
              <div
                style={{
                  background: getRankColor(2).bg,
                  border: `3px solid ${getRankColor(2).border}`,
                  borderRadius: "16px",
                  padding: "1rem",
                  textAlign: "center",
                  minWidth: "160px",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  🥈
                </div>
                <div style={{ width: "100px", height: "100px", margin: "0 auto" }}>
                  <CharacterViewer characterUrl={results[1].character || '/character1.glb'} size={100} />
                </div>
                <div style={{ color: "#ffffff", fontWeight: 700, marginTop: "0.5rem" }}>
                  {results[1].name}
                </div>
                <div style={{ color: getRankColor(2).text, fontWeight: 800, fontSize: "1.3rem" }}>
                  {results[1].score}P
                </div>
                <div style={{ color: "#ffd700", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  +{results[1].coinEarned} 코인
                </div>
              </div>
            </div>
          )}

          {/* 1등 */}
          {results[0] && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: getRankColor(1).bg,
                  border: `3px solid ${getRankColor(1).border}`,
                  borderRadius: "20px",
                  padding: "1.5rem",
                  textAlign: "center",
                  minWidth: "180px",
                  boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  👑
                </div>
                <div style={{ width: "120px", height: "120px", margin: "0 auto" }}>
                  <CharacterViewer characterUrl={results[0].character || '/character1.glb'} size={120} />
                </div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.2rem", marginTop: "0.5rem" }}>
                  {results[0].name}
                </div>
                <div style={{ color: getRankColor(1).text, fontWeight: 800, fontSize: "1.5rem" }}>
                  {results[0].score}P
                </div>
                <div style={{ color: "#ffd700", fontSize: "1rem", marginTop: "0.5rem" }}>
                  +{results[0].coinEarned} 코인
                </div>
              </div>
            </div>
          )}

          {/* 3등 */}
          {results[2] && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: "translateY(50px)",
              }}
            >
              <div
                style={{
                  background: getRankColor(3).bg,
                  border: `3px solid ${getRankColor(3).border}`,
                  borderRadius: "16px",
                  padding: "1rem",
                  textAlign: "center",
                  minWidth: "150px",
                }}
              >
                <div
                  style={{
                    fontSize: "1.8rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  🥉
                </div>
                <div style={{ width: "90px", height: "90px", margin: "0 auto" }}>
                  <CharacterViewer characterUrl={results[2].character || '/character1.glb'} size={90} />
                </div>
                <div style={{ color: "#ffffff", fontWeight: 700, marginTop: "0.5rem" }}>
                  {results[2].name}
                </div>
                <div style={{ color: getRankColor(3).text, fontWeight: 800, fontSize: "1.2rem" }}>
                  {results[2].score}P
                </div>
                <div style={{ color: "#ffd700", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  +{results[2].coinEarned} 코인
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4등 이하 */}
        {results.slice(3).length > 0 && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(0, 255, 255, 0.3)",
              borderRadius: "16px",
              padding: "1rem",
            }}
          >
            {results.slice(3).map((player) => (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {player.rank}
                </div>
                <div style={{ width: "50px", height: "50px" }}>
                  <CharacterViewer characterUrl={player.character || '/character1.glb'} size={50} />
                </div>
                <div style={{ flex: 1, color: "#ffffff", fontWeight: 600 }}>
                  {player.name}
                </div>
                <div style={{ color: "#00ffff", fontWeight: 700 }}>
                  {player.score}P
                </div>
                <div style={{ color: "#ffd700", fontSize: "0.9rem" }}>
                  +{player.coinEarned}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 버튼들 */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(100, 100, 100, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(100, 100, 100, 0.3)";
          }}
        >
          로비로 돌아가기
        </button>
        <button
          onClick={handlePlayAgain}
          style={{
            padding: "1rem 2.5rem",
            background: "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(0, 200, 200, 0.3))",
            border: "2px solid rgba(0, 255, 255, 0.8)",
            borderRadius: "12px",
            color: "#00ffff",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
          }}
        >
          한판 더!
        </button>
      </div>

      <style jsx>{`
        @keyframes coinPopup {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
