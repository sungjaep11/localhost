"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useSocket } from '@/context/SocketContext';
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
  const { socket } = useSocket();
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
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 사용자 정보 및 방 정보 불러오기
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId) setCurrentUserId(userId);
    if (userName) setCurrentUserName(userName);

    // 방 정보 불러오기 (API에서 가져오기)
    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`/api/games/rooms?page=1&pageSize=100`, {
          headers: {
            'x-user-id': userId || '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const currentRoom = data.rooms?.find((r: any) => r.id === roomId);
          if (currentRoom) {
            setTotalRounds((currentRoom.options as any)?.rounds || 4);
            setSongsPerRound((currentRoom.options as any)?.songsPerRound || 5);
          }
        }
      } catch (e) {
        console.error('Failed to load room info', e);
        // 폴백: localStorage에서 가져오기
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
          } catch (err) {
            console.error('Failed to parse stored rooms', err);
          }
        }
      }
    };

    if (userId) {
      fetchRoomInfo();
    }

    // 플레이어 목록 불러오기 (localStorage에서)
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
            characterUrl: p.characterUrl || p.character || '/character1.glb',
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

  // -------------------------------------------------------------
  // [수정된 부분] 소켓 연결 로직 (무한 루프 방지 버전)
  // -------------------------------------------------------------

  // 중복 조인 방지용 ref
  const hasJoinedRef = useRef(false);

  // 1. 소켓 이벤트 리스너 등록
  useEffect(() => {
    if (!socket || !roomId) return;

    // 플레이어 목록 업데이트 리스너
    const handlePlayersUpdate = (data: { 
      roomId: string; 
      players: Array<{ id: string; name: string; isHost: boolean; joinedAt: number }>;
      sessionStatus: string;
    }) => {
      if (data.roomId === roomId) {
        const playersWithCharacters = data.players.map((player) => {
          const equippedCharacter = typeof window !== 'undefined' 
            ? localStorage.getItem(`equipped-character-${player.id}`) 
            : null;
          
          return {
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            score: 0,
            character: equippedCharacter || '/character1.glb',
            characterUrl: equippedCharacter || '/character1.glb',
            joinedAt: player.joinedAt,
          };
        });
        
        // 중요: 무한 렌더링 방지를 위해 값이 실제로 다를 때만 setPlayers 호출
        setPlayers(prev => {
          if (JSON.stringify(prev) === JSON.stringify(playersWithCharacters)) return prev;
          return playersWithCharacters;
        });
      }
    };

    // 채팅 메시지 수신 리스너
    const handleChatMessage = (data: {
      roomId: string;
      playerId: string;
      playerName: string;
      message: string;
      timestamp: number;
    }) => {
      if (data.roomId === roomId) {
        const newMessage: ChatMessage = {
          id: `${data.playerId}-${data.timestamp}`,
          playerId: data.playerId,
          playerName: data.playerName,
          message: data.message,
          timestamp: data.timestamp,
        };

        setChatMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        const newBubble: BubbleMessage = {
          id: `${data.playerId}-${data.timestamp}`,
          playerId: data.playerId,
          message: data.message,
          expiresAt: Date.now() + 3000,
        };
        setBubbleMessages(prev => {
          if (prev.some(msg => msg.id === newBubble.id)) return prev;
          return [...prev, newBubble];
        });
      }
    };

    socket.on('game_players_update', handlePlayersUpdate);
    socket.on('game_chat', handleChatMessage);

    // Cleanup: 리스너만 제거 (game_leave 절대 하지 않음!)
    return () => {
      socket.off('game_players_update', handlePlayersUpdate);
      socket.off('game_chat', handleChatMessage);
    };
  }, [socket, roomId]);

  // 2. 방 입장 처리 (퇴장 로직 완전 제거)
  useEffect(() => {
    if (socket && roomId && currentUserId && !hasJoinedRef.current) {
      console.log('[Play] Joining game room:', roomId);
      socket.emit('game_join', { roomId, userId: currentUserId });
      hasJoinedRef.current = true;
    }
    
    // 중요: 여기서 return () => { socket.emit('game_leave') } 를 절대 하지 마세요!
    // React Strict Mode 때문에 마운트/언마운트가 반복되면서 무한 루프가 생깁니다.
  }, [socket, roomId, currentUserId]);

  // -------------------------------------------------------------

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
    if (!chatInput.trim() || !socket || !roomId || !currentUserId) return;

    const message = chatInput.trim();
    const timestamp = Date.now();

    // 소켓을 통해 채팅 메시지 전송
    socket.emit('game_chat', {
      roomId,
      playerId: currentUserId,
      playerName: currentUserName || '익명',
      message,
      timestamp,
    });

    // 로컬에서도 즉시 표시 (소켓 응답을 기다리지 않음)
    const newMessage: ChatMessage = {
      id: `${currentUserId}-${timestamp}`,
      playerId: currentUserId,
      playerName: currentUserName || '익명',
      message,
      timestamp,
    };

    setChatMessages(prev => {
      // 중복 방지
      if (prev.some(msg => msg.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    // 말풍선 추가 (3초 후 만료)
    const newBubble: BubbleMessage = {
      id: `${currentUserId}-${timestamp}`,
      playerId: currentUserId,
      message,
      expiresAt: Date.now() + 3000,
    };
    setBubbleMessages(prev => {
      // 중복 방지
      if (prev.some(msg => msg.id === newBubble.id)) {
        return prev;
      }
      return [...prev, newBubble];
    });

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


  // 가사 색상 계산 (노래방 스타일) - 문장 단위로 나누기
  const getLyricsWithColors = () => {
    if (!lyrics) return null;
    
    // totalDuration이 없으면 기본값 사용 (가사 길이 기반 추정)
    const effectiveDuration = totalDuration || (lyrics.length * 0.1); // 글자당 0.1초 추정

    // 문장 단위로 나누기 (마침표, 느낌표, 물음표, 줄바꿈을 기준으로)
    // 정규식으로 문장 끝을 찾아서 분리
    const sentencePattern = /[^.!?。！？\n]+[.!?。！？\n]*/g;
    const matches = lyrics.match(sentencePattern);
    const sentences: string[] = [];
    
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        const trimmed = match.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
      });
    }
    
    // 문장이 없으면 전체를 하나의 문장으로 처리
    if (sentences.length === 0) {
      sentences.push(lyrics.trim());
    }
    
    const allChars = lyrics.split('');
    const timePerChar = effectiveDuration / allChars.length;
    const currentCharIndex = Math.floor(currentTime / timePerChar);

    let charIndex = 0;
    return sentences.map((sentence, sentenceIndex) => {
      const sentenceChars = sentence.split('').map((char, charInSentenceIndex) => {
        const globalIndex = charIndex++;
        const isPast = globalIndex <= currentCharIndex;
        const isCurrent = globalIndex === currentCharIndex;
        
        // 현재 글자는 파란색, 지나간 글자는 파란색, 아직 안 읽은 글자는 흰색
        let color = '#ffffff'; // 기본 흰색
        if (isPast) {
          color = '#00ffff'; // 파란색
        }
        if (isCurrent) {
          color = '#00aaff'; // 더 밝은 파란색 (현재 읽는 글자)
        }

        return { char, color, isCurrent, globalIndex };
      });

      return { sentence, chars: sentenceChars, index: sentenceIndex };
    });
  };

  // TTS 재생 시작
  // 사용법: startTTS('가사 텍스트', 'TTS 오디오 URL')
  // 예시: startTTS('안녕하세요 반갑습니다', '/tts/example.mp3')
  const startTTS = (lyricsText: string, audioUrl: string) => {
    // 기존 오디오가 있으면 정리
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setLyrics(lyricsText);
    setCurrentTime(0);
    
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

  // 테스트용: 방장이 재생 버튼을 누르면 예시 가사 재생 (나중에 실제 TTS API로 교체)
  const handlePlayButton = () => {
    // 기존 시뮬레이션 interval 정리
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    // 예시 가사와 TTS (실제로는 API에서 가져올 것)
    const exampleLyrics = '안녕하세요 오늘도 좋은 하루 되세요. 반갑습니다 즐거운 시간 되세요.';
    const exampleTTS = ''; // TTS URL이 있으면 여기에 입력
    
    if (exampleTTS) {
      startTTS(exampleLyrics, exampleTTS);
    } else {
      // TTS가 없을 때는 가사만 표시하고 시뮬레이션으로 색상 변화 (테스트용)
      setLyrics(exampleLyrics);
      setTotalDuration(5); // 5초로 설정
      setCurrentTime(0);
      setIsPlaying(true);
      
      // 시뮬레이션: 5초 동안 시간이 흐르도록
      let simTime = 0;
      const interval = setInterval(() => {
        simTime += 0.1;
        setCurrentTime(simTime);
        
        if (simTime >= 5) {
          clearInterval(interval);
          simulationIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, 100);
      
      simulationIntervalRef.current = interval;
    }
  };

  // TTS 일시정지/재개
  const toggleTTS = () => {
    // 실제 오디오가 있는 경우
    if (audioRef.current) {
      // 오디오 제어 (TTS)
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } 
    // 시뮬레이션 중인 경우
    else if (simulationIntervalRef.current) {
      if (isPlaying) {
        // 시뮬레이션 일시정지 (interval 정리)
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsPlaying(false);
      } else {
        // 시뮬레이션 재개 (다시 시작)
        handlePlayButton();
      }
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
            position: "relative",
          }}
        >
          {/* 중앙 음악 아이콘 (동적) - 항상 표시 */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "300px",
              height: "300px",
            }}
          >
              {/* 펄스하는 원들 - 재생 중일 때만 애니메이션 */}
              {isPlaying && [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`sound-wave-circle circle-${i}`}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: `3px solid rgba(100, 200, 255, ${0.8 - i * 0.12})`,
                    boxShadow: `0 0 ${20 + i * 10}px rgba(100, 200, 255, ${0.5 - i * 0.08})`,
                    animation: `soundPulse ${1.0 + i * 0.2}s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
              
              {/* 고정된 음표 아이콘 - 항상 표시, 클릭 시 TTS 시작 */}
              <div
                className="music-note-icon"
                onClick={() => {
                  if (!isPlaying) {
                    handlePlayButton();
                  } else {
                    toggleTTS();
                  }
                }}
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: "120px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isPlaying ? "#64c8ff" : "#8bb3d9",
                  filter: isPlaying 
                    ? "drop-shadow(0 0 30px rgba(100, 200, 255, 0.8)) drop-shadow(0 0 60px rgba(100, 200, 255, 0.4))"
                    : "drop-shadow(0 0 20px rgba(139, 179, 217, 0.5)) drop-shadow(0 0 40px rgba(139, 179, 217, 0.3))",
                  animation: isPlaying ? "notePulse 1.2s ease-in-out infinite" : "none",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isPlaying) {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.filter = "drop-shadow(0 0 30px rgba(139, 179, 217, 0.8)) drop-shadow(0 0 60px rgba(139, 179, 217, 0.5))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPlaying) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.filter = "drop-shadow(0 0 20px rgba(139, 179, 217, 0.5)) drop-shadow(0 0 40px rgba(139, 179, 217, 0.3))";
                  }
                }}
              >
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>

          {/* 가사 표시 영역 (노래방 스타일) - 화면 하단에 위치 */}
          {lyrics && (
            <div
              style={{
                position: "absolute",
                bottom: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0",
                zIndex: 10,
              }}
            >
              {/* 노래 정보 표시 */}
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  lineHeight: "2.2",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0",
                  letterSpacing: "0.05em",
                }}
              >
                {getLyricsWithColors()?.map((sentenceData, sentenceIndex) => (
                  <div
                    key={sentenceIndex}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      gap: "0.15rem",
                      width: "100%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sentenceData.chars.map((item, charIndex) => (
                      <span
                        key={`${sentenceIndex}-${charIndex}`}
                        style={{
                          color: item.color,
                          textShadow: item.isCurrent 
                            ? "2px 2px 8px rgba(0, 0, 0, 0.9), 4px 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 170, 255, 1), 0 0 30px rgba(0, 170, 255, 0.6), 0 0 40px rgba(0, 170, 255, 0.3)"
                            : item.color === '#00ffff'
                              ? "2px 2px 8px rgba(0, 0, 0, 0.9), 4px 4px 12px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 255, 255, 0.5)"
                              : "2px 2px 8px rgba(0, 0, 0, 0.9), 4px 4px 12px rgba(0, 0, 0, 0.7), 0 0 5px rgba(255, 255, 255, 0.2)",
                          transition: "all 0.3s ease",
                          display: "inline-block",
                          transform: item.isCurrent ? "scale(1.15)" : "scale(1)",
                        }}
                      >
                        {item.char === ' ' ? '\u00A0' : item.char}
                      </span>
                    ))}
                  </div>
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
        @keyframes soundPulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          50% {
            transform: scale(1.8);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.6);
            opacity: 1;
          }
        }
        @keyframes notePulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(100, 200, 255, 0.8)) drop-shadow(0 0 60px rgba(100, 200, 255, 0.4));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 0 40px rgba(100, 200, 255, 1)) drop-shadow(0 0 80px rgba(100, 200, 255, 0.6));
          }
        }
      `}</style>
    </main>
  );
}
