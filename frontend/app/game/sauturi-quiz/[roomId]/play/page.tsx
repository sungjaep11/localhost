"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from 'three';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  joinedAt?: number;
  character?: string;
  characterUrl?: string;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface BubbleMessage {
  id: string;
  playerId: string;
  message: string;
  expiresAt: number;
}

interface Room {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  isLocked: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  rounds: number;
  songsPerRound: number;
  genres: string[];
  createdAt: number;
}

// 3D 모델 컴포넌트
function Model({ url, scale = 2.5 }: { url: string; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -2.0 : -0.8;
  
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
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

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSong, setCurrentSong] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [songsPerRound, setSongsPerRound] = useState(5);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bubbleMessages, setBubbleMessages] = useState<BubbleMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 가사 및 TTS 관련 state
  const [lyrics, setLyrics] = useState<string>(''); // 현재 가사
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 현재 사용자 정보 및 방 정보 불러오기
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId) setCurrentUserId(userId);
    if (userName) setCurrentUserName(userName);

    // 방 정보 불러오기
    const STORAGE_KEY = 'sauturi-quiz-rooms';
    const storedRooms = localStorage.getItem(STORAGE_KEY);
    if (storedRooms) {
      try {
        const rooms: Room[] = JSON.parse(storedRooms);
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom) {
          setTotalRounds(currentRoom.rounds);
          setSongsPerRound(currentRoom.songsPerRound);
        }
      } catch (e) {
        console.error('Failed to load room info', e);
      }
    }
  }, [roomId]);

  // 참가자 목록 불러오기
  useEffect(() => {
    const loadPlayers = () => {
      const playersKey = `sauturi-quiz-room-${roomId}-players`;
      const storedPlayers = localStorage.getItem(playersKey);
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers);
          const playersWithScore = parsedPlayers.map((p: Player) => ({
            ...p,
            score: p.score || 0,
            character: p.character || p.characterUrl || '/character1.glb',
          }));
          setPlayers(playersWithScore);
        } catch (e) {
          console.error('Failed to parse players', e);
        }
      }
    };

    loadPlayers();
    const interval = setInterval(loadPlayers, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  // 말풍선 자동 삭제 (3초 후)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBubbleMessages(prev => prev.filter(msg => msg.expiresAt > now));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const host = players.find(p => p.isHost);
  const otherPlayers = players.filter(p => !p.isHost);

  // 채팅 전송
  const sendChat = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentUserId,
      playerName: currentUserName || '익명',
      message: chatInput.trim(),
      timestamp: Date.now(),
    };

    // 채팅 메시지 추가
    setChatMessages(prev => [...prev, newMessage]);

    // 말풍선 추가 (3초 후 만료)
    const newBubble: BubbleMessage = {
      id: Date.now().toString(),
      playerId: currentUserId,
      message: chatInput.trim(),
      expiresAt: Date.now() + 3000,
    };
    setBubbleMessages(prev => [...prev, newBubble]);

    setChatInput('');
  };

  // 특정 플레이어의 말풍선 가져오기
  const getPlayerBubble = (playerId: string) => {
    return bubbleMessages.find(msg => msg.playerId === playerId);
  };

  // TTS 재생 시간 업데이트
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', () => {
      setTotalDuration(audio.duration);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
    };
  }, [ttsAudio]);

  // 가사 색상 계산 (노래방 스타일)
  const getLyricsWithColors = () => {
    if (!lyrics || !totalDuration) return null;

    const words = lyrics.split('');
    const timePerChar = totalDuration / words.length;
    const currentCharIndex = Math.floor(currentTime / timePerChar);

    return words.map((char, index) => {
      const progress = index / words.length;
      const isPast = index <= currentCharIndex;
      const isCurrent = index === currentCharIndex;
      
      // 현재 글자는 파란색, 지나간 글자는 파란색, 아직 안 읽은 글자는 흰색
      let color = '#ffffff'; // 기본 흰색
      if (isPast) {
        color = '#00ffff'; // 파란색
      }
      if (isCurrent) {
        color = '#00aaff'; // 더 밝은 파란색 (현재 읽는 글자)
      }

      return { char, color, isCurrent };
    });
  };

  // TTS 재생 시작
  // 사용법: startTTS('가사 텍스트', 'TTS 오디오 URL')
  // 예시: startTTS('안녕하세요 반갑습니다', '/tts/example.mp3')
  const startTTS = (lyricsText: string, audioUrl: string) => {
    setLyrics(lyricsText);
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setTtsAudio(audio);
    
    audio.play();
    setIsPlaying(true);
    
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      console.error('TTS 재생 오류');
    };
  };

  // 테스트용: 방장이 재생 버튼을 누르면 예시 가사 재생 (나중에 실제 API로 교체)
  const handlePlayButton = () => {
    // 예시 가사와 TTS (실제로는 API에서 가져올 것)
    const exampleLyrics = '안녕하세요 오늘도 좋은 하루 되세요';
    const exampleTTS = ''; // TTS URL이 있으면 여기에 입력
    
    if (exampleTTS) {
      startTTS(exampleLyrics, exampleTTS);
    } else {
      // TTS가 없을 때는 가사만 표시 (테스트용)
      setLyrics(exampleLyrics);
      // 실제 구현 시에는 TTS가 필수이므로 이 부분은 제거
    }
  };

  // TTS 일시정지/재개
  const toggleTTS = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
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
        padding: "1.5rem",
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

      {/* 나가기 확인 모달 */}
      {showExitModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowExitModal(false)}
        >
          <div
            style={{
              background: "rgba(20, 20, 40, 0.95)",
              border: "2px solid rgba(0, 255, 255, 0.5)",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "400px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#ffffff",
                fontSize: "1.3rem",
                marginBottom: "1.5rem",
              }}
            >
              게임을 중단하고 돌아가시겠습니까?
            </h3>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgba(100, 100, 100, 0.5)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={() => router.push('/main/lobby')}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgba(255, 100, 100, 0.5)",
                  border: "2px solid rgba(255, 100, 100, 0.8)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div
          onClick={() => setShowExitModal(true)}
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#00ffff";
            e.currentTarget.style.textShadow = "0 0 20px rgba(0, 255, 255, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.textShadow = "0 0 10px rgba(0, 255, 255, 0.8)";
          }}
        >
          Localhost
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: 700,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
          }}
        >
          Round {currentRound} {currentSong}/{songsPerRound}
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "1rem",
        }}
      >
        {/* 왼쪽 - 방장 캐릭터 (크게) */}
        {host && (
          <div
            style={{
              width: "280px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >

            {/* 방장 표시 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 215, 0, 0.9)",
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                color: "#000",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              방장
            </div>

            {/* 방장 캐릭터 + 말풍선 */}
            <div style={{ position: "relative" }}>
              {/* 방장 말풍선 (오른쪽) */}
              {getPlayerBubble(host.id) && (
                <div
                  style={{
                    position: "absolute",
                    top: "60px",
                    left: "calc(100% - 30px)",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "0.75rem 1rem",
                    borderRadius: "16px",
                    borderBottomLeftRadius: "4px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                    zIndex: 20,
                    animation: "fadeInRight 0.3s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <p style={{ color: "#000", fontSize: "0.9rem", margin: 0 }}>
                    {getPlayerBubble(host.id)?.message}
                  </p>
                </div>
              )}
              <div
                style={{
                  width: "220px",
                  height: "220px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CharacterViewer characterUrl={host.character || '/character1.glb'} size={220} />
              </div>
            </div>

            {/* 방장 이름 */}
            <div
              style={{
                color: "#ffffff",
                fontSize: "1.2rem",
                fontWeight: 700,
                textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
              }}
            >
              {host.name}
            </div>

            {/* 재생 컨트롤 */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={() => {
                  if (!lyrics) {
                    handlePlayButton();
                  } else {
                    toggleTTS();
                  }
                }}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: isPlaying 
                    ? "rgba(0, 255, 0, 0.2)" 
                    : "rgba(0, 255, 255, 0.2)",
                  border: `2px solid ${isPlaying ? "rgba(0, 255, 0, 0.6)" : "rgba(0, 255, 255, 0.6)"}`,
                  color: isPlaying ? "#00ff00" : "#00ffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              {totalDuration > 0 && (
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    minWidth: "80px",
                    textAlign: "center",
                  }}
                >
                  {Math.floor(currentTime)}s / {Math.floor(totalDuration)}s
                </div>
              )}
            </div>
          </div>
        )}

        {/* 중앙 - 가사 표시 영역 + 다른 플레이어들 캐릭터 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* 가사 표시 영역 (노래방 스타일) */}
          {lyrics && (
            <div
              style={{
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(15px)",
                border: "2px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "16px",
                padding: "2rem",
                minHeight: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  lineHeight: "1.6",
                  textAlign: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "0.2rem",
                }}
              >
                {getLyricsWithColors()?.map((item, index) => (
                  <span
                    key={index}
                    style={{
                      color: item.color,
                      textShadow: item.isCurrent 
                        ? "0 0 15px rgba(0, 170, 255, 0.8), 0 0 25px rgba(0, 170, 255, 0.5)"
                        : "0 0 5px rgba(0, 255, 255, 0.3)",
                      transition: "all 0.2s ease",
                      display: "inline-block",
                    }}
                  >
                    {item.char === ' ' ? '\u00A0' : item.char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 다른 플레이어들 캐릭터 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "flex-start",
              alignContent: "flex-start",
              gap: "2rem",
              padding: "1rem",
            }}
          >
          {otherPlayers.map((player) => (
            <div
              key={player.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* 말풍선 (오른쪽) */}
              {getPlayerBubble(player.id) && (
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "100%",
                    marginLeft: "10px",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "12px",
                    borderBottomLeftRadius: "4px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                    zIndex: 20,
                    animation: "fadeInRight 0.3s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <p style={{ color: "#000", fontSize: "0.8rem", margin: 0 }}>
                    {getPlayerBubble(player.id)?.message}
                  </p>
                </div>
              )}

              {/* 캐릭터 */}
              <div
                style={{
                  width: "130px",
                  height: "130px",
                }}
              >
                <CharacterViewer characterUrl={player.character || '/character1.glb'} size={130} />
              </div>

              {/* 이름과 점수 */}
              <div
                style={{
                  marginTop: "0.3rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textShadow: "0 0 5px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    color: "#00ffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {player.score || 0}P
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* 오른쪽 - 채팅 패널 */}
        <div
          style={{
            width: "280px",
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 120px)",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(0, 255, 255, 0.3)",
              color: "#00ffff",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            채팅
          </div>
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
            }}
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#00ffff", fontWeight: 600 }}>{msg.playerName}:</span>{" "}
                {msg.message}
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid rgba(0, 255, 255, 0.3)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendChat();
              }}
              placeholder="메시지 입력..."
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              onClick={sendChat}
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(0, 255, 255, 0.2)",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </main>
  );
}
