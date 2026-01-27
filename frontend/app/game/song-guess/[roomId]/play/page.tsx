"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei";
import { useSocket } from '@/context/SocketContext';
import * as THREE from 'three';
import type { RefObject } from 'react';


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
  isCorrect?: boolean;
  isSystem?: boolean;
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

// 백엔드 노래 형식 (seed-songs.ts)
interface BackendSong {
  id: string;
  genre: string;
  title: string;
  artist: string;
  youtubeUrl: string;
}

// 게임용 노래 (answer는 정답 체크용 변형 목록)
type GameSong = { id: string; title: string; artist: string; answer: string[]; youtubeUrl?: string };

function toGameSong(s: BackendSong): GameSong {
  const norms = [s.title, s.title.replace(/\s/g, '')];
  return { id: s.id, title: s.title, artist: s.artist, answer: [...new Set(norms)], youtubeUrl: s.youtubeUrl };
}

// 선착순 점수 (1등부터)
const RANKING_POINTS = [100, 80, 60, 40, 30];

// 3D 모델 컴포넌트 - React.memo로 감싸서 불필요한 리렌더링 방지
const Model = memo(({ url, scale = 2.5 }: { url: string; scale?: number }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
    
    // Cleanup: 애니메이션 정리
    return () => {
      Object.values(actions).forEach(action => {
        if (action) {
          action.stop();
          action.reset();
        }
      });
    };
  }, [actions]);
  
  // character1은 축이 달라서 다른 position 적용
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -2.0 : -0.8;
  
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={[0, -Math.PI * 0.55, 0]} />;
}, (prevProps, nextProps) => {
  // Props 비교: url과 scale이 같으면 리렌더링 방지
  return prevProps.url === nextProps.url && prevProps.scale === nextProps.scale;
});

Model.displayName = 'Model';

// 캐릭터 뷰어 컴포넌트 - React.memo로 감싸서 불필요한 리렌더링 방지
const CharacterViewer = memo(({ characterUrl, size = 150 }: { characterUrl: string; size?: number }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas 
        camera={{ position: [0, 1, 4], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        frameloop="demand"
      >
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
}, (prevProps, nextProps) => {
  // Props 비교: characterUrl과 size가 같으면 리렌더링 방지
  return prevProps.characterUrl === nextProps.characterUrl && prevProps.size === nextProps.size;
});

CharacterViewer.displayName = 'CharacterViewer';

// 플레이어 캐릭터 컴포넌트 - React.memo로 감싸서 불필요한 리렌더링 방지
const PlayerCharacter = memo(({ 
  player, 
  bubbleMessage, 
  isCorrect 
}: { 
  player: Player; 
  bubbleMessage?: BubbleMessage;
  isCorrect?: boolean;
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* 말풍선 (오른쪽) */}
      {bubbleMessage && (
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
            {bubbleMessage.message}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
          }}
        >
          {/* 정답 맞춤 표시 */}
          {isCorrect && (
            <span style={{ color: "#00ff00", fontSize: "0.9rem" }}>✓</span>
          )}
          <span
            style={{
              color: isCorrect ? "#00ff00" : "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 600,
              textShadow: "0 0 5px rgba(0, 0, 0, 0.8)",
            }}
          >
            {player.name}
          </span>
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
  );
}, (prevProps, nextProps) => {
  // Props 비교: player.id, bubbleMessage, isCorrect가 같으면 리렌더링 방지
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.character === nextProps.player.character &&
    prevProps.player.score === nextProps.player.score &&
    prevProps.bubbleMessage?.id === nextProps.bubbleMessage?.id &&
    prevProps.isCorrect === nextProps.isCorrect
  );
});

PlayerCharacter.displayName = 'PlayerCharacter';

// 방장 캐릭터 컴포넌트 - React.memo로 감싸서 불필요한 리렌더링 방지
const HostCharacter = memo(({ 
  host, 
  bubbleMessage,
  isPlaying,
  gamePhase,
  lyrics,
  isAudioPlaying,
  totalDuration,
  currentTime,
  onPlayClick,
  onSkipClick,
  isCurrentUserHost
}: { 
  host: Player;
  bubbleMessage?: BubbleMessage;
  isPlaying: boolean;
  gamePhase: string;
  lyrics: string;
  isAudioPlaying: boolean;
  totalDuration: number;
  currentTime: number;
  onPlayClick: () => void;
  onSkipClick: () => void;
  isCurrentUserHost: boolean;
}) => {
  return (
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
        {bubbleMessage && (
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
              {bubbleMessage.message}
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

      {/* 재생 컨트롤 & 게임 상태 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "0.5rem",
        }}
      >
        {/* 게임 상태 표시 */}
        <div
          style={{
            padding: "0.4rem 1rem",
            background: isPlaying 
              ? "rgba(0, 255, 0, 0.2)" 
              : gamePhase === 'waiting' 
                ? "rgba(255, 165, 0, 0.2)"
                : "rgba(100, 100, 100, 0.3)",
            border: `2px solid ${isPlaying 
              ? "rgba(0, 255, 0, 0.6)" 
              : gamePhase === 'waiting'
                ? "rgba(255, 165, 0, 0.6)"
                : "rgba(100, 100, 100, 0.5)"}`,
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: isPlaying ? "#00ff00" : gamePhase === 'waiting' ? "#ffa500" : "#999",
          }}
        >
          {isPlaying ? "🎵 재생 중..." : gamePhase === 'waiting' ? "대기 중" : "정답 공개"}
        </div>

        {/* 재생 버튼 */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={onPlayClick}
            disabled={isPlaying && !lyrics && gamePhase === 'playing'}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: isAudioPlaying 
                ? "rgba(0, 255, 0, 0.2)" 
                : isPlaying && !lyrics && gamePhase === 'playing'
                  ? "rgba(100, 100, 100, 0.3)" 
                  : "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(0, 200, 200, 0.3))",
              border: `3px solid ${isAudioPlaying 
                ? "rgba(0, 255, 0, 0.8)" 
                : isPlaying && !lyrics && gamePhase === 'playing'
                  ? "rgba(100, 100, 100, 0.5)" 
                  : "rgba(0, 255, 255, 0.8)"}`,
              color: isAudioPlaying ? "#00ff00" : (isPlaying && !lyrics && gamePhase === 'playing' ? "#666" : "#00ffff"),
              cursor: (isPlaying && !lyrics && gamePhase === 'playing') ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: isAudioPlaying ? "0 0 20px rgba(0, 255, 0, 0.4)" : (isPlaying && !lyrics && gamePhase === 'playing' ? "none" : "0 0 20px rgba(0, 255, 255, 0.4)"),
            }}
          >
            {isAudioPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* 재생 시간 표시 */}
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

          {/* 스킵 버튼 (방장만) */}
          {isCurrentUserHost && isPlaying && (
            <button
              onClick={onSkipClick}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(255, 165, 0, 0.2)",
                border: "2px solid rgba(255, 165, 0, 0.6)",
                color: "#ffa500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              title="스킵 (정답 공개)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Props 비교: 중요한 값들이 같으면 리렌더링 방지
  return (
    prevProps.host.id === nextProps.host.id &&
    prevProps.host.character === nextProps.host.character &&
    prevProps.bubbleMessage?.id === nextProps.bubbleMessage?.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.gamePhase === nextProps.gamePhase &&
    prevProps.lyrics === nextProps.lyrics &&
    prevProps.isAudioPlaying === nextProps.isAudioPlaying &&
    Math.floor(prevProps.currentTime) === Math.floor(nextProps.currentTime) &&
    Math.floor(prevProps.totalDuration) === Math.floor(nextProps.totalDuration)
  );
});

HostCharacter.displayName = 'HostCharacter';

// 채팅 패널 컴포넌트 - 별도 컴포넌트로 분리하여 메인 컴포넌트 리렌더링 최소화
const ChatPanel = memo(({ 
  messages, 
  input, 
  onInputChange, 
  onSend,
  chatContainerRef 
}: { 
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  chatContainerRef: RefObject<HTMLDivElement>;
}) => {
  return (
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
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              padding: msg.isCorrect || msg.isSystem ? "0.4rem 0.6rem" : "0",
              background: msg.isCorrect 
                ? "rgba(0, 255, 0, 0.15)" 
                : msg.isSystem 
                  ? "rgba(255, 215, 0, 0.1)"
                  : "transparent",
              borderRadius: msg.isCorrect || msg.isSystem ? "6px" : "0",
              borderLeft: msg.isCorrect 
                ? "3px solid #00ff00" 
                : msg.isSystem 
                  ? "3px solid #ffd700"
                  : "none",
            }}
          >
            {msg.isSystem ? (
              <span style={{ color: "#ffd700" }}>{msg.message}</span>
            ) : (
              <>
                <span style={{ 
                  color: msg.isCorrect ? "#00ff00" : "#00ffff", 
                  fontWeight: 600 
                }}>
                  {msg.playerName}:
                </span>{" "}
                <span style={{ color: msg.isCorrect ? "#00ff00" : "rgba(255, 255, 255, 0.9)" }}>
                  {msg.isCorrect ? "정답!" : msg.message}
                </span>
              </>
            )}
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
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) onSend();
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
          onClick={onSend}
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
  );
}, (prevProps, nextProps) => {
  // Props 비교: messages 길이와 input이 같으면 리렌더링 방지
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.messages[prevProps.messages.length - 1]?.id === nextProps.messages[nextProps.messages.length - 1]?.id &&
    prevProps.input === nextProps.input
  );
});

ChatPanel.displayName = 'ChatPanel';

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

  // TTS 및 오디오 관련 state
  const [lyrics, setLyrics] = useState<string>('');
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 게임 상태
  const [gamePhase, setGamePhase] = useState<'waiting' | 'playing' | 'answer_revealed' | 'round_end' | 'game_end'>('waiting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongData, setCurrentSongData] = useState<GameSong | null>(null);
  const [correctPlayers, setCorrectPlayers] = useState<string[]>([]);
  const [gameSongs, setGameSongs] = useState<GameSong[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showRoundEndModal, setShowRoundEndModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const youtubePlayerRef = useRef<{ loadPlaylist: (opts: { listType: string; list: string }) => void; playVideo: () => void; stopVideo: () => void } | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const [ytReady, setYtReady] = useState(false);

  // 소켓 핸들러에서 최신 상태를 읽기 위한 ref (의존성 배열 확대·무한 리렌더 방지)
  const gameStateRef = useRef({ isPlaying, currentSongData, correctPlayers, players });
  gameStateRef.current = { isPlaying, currentSongData, correctPlayers, players };

  // 게임 설정값 ref (useEffect 내부에서 최신 값 참조용)
  const gameConfigRef = useRef({ totalRounds, songsPerRound });
  gameConfigRef.current = { totalRounds, songsPerRound };

  // 게임 초기화 함수 (불러온 노래 풀에서 랜덤 선택) - ref로 최신 값 참조
  const initializeGame = useCallback((songPool: GameSong[]) => {
    if (songPool.length === 0) return;
    const { totalRounds: rounds, songsPerRound: songs } = gameConfigRef.current;
    const shuffled = [...songPool].sort(() => Math.random() - 0.5);
    const totalSongsNeeded = rounds * songs;
    const selectedSongs = shuffled.slice(0, Math.min(totalSongsNeeded, shuffled.length));
    setGameSongs(selectedSongs);
    setCurrentSongData(selectedSongs[0]);
    setGamePhase('waiting');
    setCurrentRound(1);
    setCurrentSong(1);
    setCorrectPlayers([]);
  }, []); // 의존성 제거하여 함수 재생성 방지

  // 현재 사용자 정보 및 방 정보 불러오기
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId) setCurrentUserId(userId);
    if (userName) setCurrentUserName(userName);

    const STORAGE_KEY = 'song-guess-rooms';
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

  // 노래 로드 완료 여부 추적 (중복 호출 방지)
  const songsLoadedRef = useRef(false);

  // 백엔드(seed-songs)에서 노래 목록 로드 후 게임 초기화
  useEffect(() => {
    // 이미 로드했으면 스킵
    if (songsLoadedRef.current) return;
    if (totalRounds <= 0 || songsPerRound <= 0) return;

    let cancelled = false;
    setSongsLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/songs');
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSongsLoading(false);
          return;
        }
        const list = Array.isArray(data) ? data : (data.songs ?? data.data ?? []);
        const gameSongsList = (list as BackendSong[]).map(toGameSong);
        setSongsLoading(false);
        if (gameSongsList.length > 0) {
          songsLoadedRef.current = true; // 로드 완료 표시
          initializeGame(gameSongsList);
        }
      } catch (e) {
        if (!cancelled) setSongsLoading(false);
        console.error('Failed to fetch songs', e);
      }
    })();

    return () => { cancelled = true; };
  }, [totalRounds, songsPerRound, initializeGame]);

  // 시간 초과 처리 - useCallback으로 안정화
  const handleTimeUp = useCallback(() => {
    setIsPlaying(false);
    setGamePhase('answer_revealed');
    setShowAnswerModal(true);
    
    // 시스템 메시지 추가 (currentSongData는 ref로 최신 값 참조)
    const songData = gameStateRef.current.currentSongData;
    const systemMsg: ChatMessage = {
      id: Date.now().toString(),
      playerId: 'system',
      playerName: '시스템',
      message: `⏰ 시간 초과! 정답은 "${songData?.title}" - ${songData?.artist} 입니다!`,
      timestamp: Date.now(),
      isSystem: true,
    };
    setChatMessages(prev => [...prev, systemMsg]);
  }, []);

  // 타이머 로직
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // 시간 초과 - 정답 공개
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, timeLeft, handleTimeUp]);

  // 노래 재생 시작
  const startPlaying = () => {
    if (gamePhase === 'waiting' || gamePhase === 'answer_revealed') {
      setIsPlaying(true);
      setTimeLeft(30);
      setCorrectPlayers([]);
      setGamePhase('playing');
      
      // 시스템 메시지
      const systemMsg: ChatMessage = {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '시스템',
        message: `🎵 ${currentRound}라운드 ${currentSong}번째 노래가 시작됩니다!`,
        timestamp: Date.now(),
        isSystem: true,
      };
      setChatMessages(prev => [...prev, systemMsg]);
    }
  };

  // 정답 체크
  const checkAnswer = (message: string): boolean => {
    if (!currentSongData || !isPlaying) return false;
    
    const normalizedMsg = message.toLowerCase().trim();
    return currentSongData.answer.some(ans => normalizedMsg.includes(ans.toLowerCase()));
  };

  // 점수 부여 (rankOverride: 소켓 콜백 등에서 최신 correctPlayers.length를 넘길 때 사용)
  const awardPoints = (playerId: string, rankOverride?: number) => {
    const rank = rankOverride !== undefined ? rankOverride : correctPlayers.length; // 0-based (이미 정답 맞춘 사람 수)
    const points = RANKING_POINTS[rank] || 20; // 기본 20점
    
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, score: (p.score || 0) + points };
      }
      return p;
    }));

    // localStorage에도 점수 업데이트
    const playersKey = `song-guess-room-${roomId}-players`;
    const storedPlayers = localStorage.getItem(playersKey);
    if (storedPlayers) {
      const parsedPlayers = JSON.parse(storedPlayers);
      const updated = parsedPlayers.map((p: Player) => {
        if (p.id === playerId) {
          return { ...p, score: (p.score || 0) + points };
        }
        return p;
      });
      localStorage.setItem(playersKey, JSON.stringify(updated));
    }

    return points;
  };

  // 다음 곡으로 이동
  const goToNextSong = () => {
    setShowAnswerModal(false);
    
    const songIndex = (currentRound - 1) * songsPerRound + currentSong;
    
    if (currentSong >= songsPerRound) {
      // 라운드 종료
      if (currentRound >= totalRounds) {
        // 게임 종료
        endGame();
      } else {
        // 다음 라운드
        setShowRoundEndModal(true);
        setGamePhase('round_end');
      }
    } else {
      // 다음 곡
      setCurrentSong(prev => prev + 1);
      if (gameSongs[songIndex]) {
        setCurrentSongData(gameSongs[songIndex]);
      }
      setCorrectPlayers([]);
      setGamePhase('waiting');
      setTimeLeft(30);
    }
  };

  // 다음 라운드 시작
  const startNextRound = () => {
    setShowRoundEndModal(false);
    setCurrentRound(prev => prev + 1);
    setCurrentSong(1);
    
    const songIndex = currentRound * songsPerRound; // 다음 라운드 첫 곡
    if (gameSongs[songIndex]) {
      setCurrentSongData(gameSongs[songIndex]);
    }
    setCorrectPlayers([]);
    setGamePhase('waiting');
    setTimeLeft(30);
  };

  // 게임 종료
  const endGame = () => {
    setGamePhase('game_end');
    
    // 결과 저장
    const resultsKey = `song-guess-room-${roomId}-results`;
    const results = players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      character: p.character || '/character1.glb',
      coinEarned: 0,
      rank: 0,
    }));
    localStorage.setItem(resultsKey, JSON.stringify(results));
    
    // 백엔드에 게임 종료 알림 → 방 즉시 삭제
    if (socket && roomId) {
      socket.emit('game_end_request', { roomId });
    }
    
    // 결과 페이지로 이동
    setTimeout(() => {
      router.push(`/game/song-guess/${roomId}/result`);
    }, 1500);
  };

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
      if (data.roomId !== roomId) return;

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

      // 정답 체크 로직 (gameStateRef 사용)
      const state = gameStateRef.current;
      if (!state.isPlaying || !state.currentSongData) return;

      const normalizedMsg = data.message.toLowerCase().trim();
      const isCorrectAnswer = state.currentSongData.answer.some((ans: string) =>
        normalizedMsg.includes(ans.toLowerCase())
      );
      const alreadyCorrect = state.correctPlayers.includes(data.playerId);

      if (!isCorrectAnswer || alreadyCorrect) return;

      const rank0 = state.correctPlayers.length;
      const rank = rank0 + 1;
      const points = awardPoints(data.playerId, rank0);

      setCorrectPlayers(prev => [...prev, data.playerId]);

      const correctMsg: ChatMessage = {
        id: `${Date.now()}-correct`,
        playerId: 'system',
        playerName: '시스템',
        message: `🎉 ${data.playerName}님이 ${rank}등으로 정답! (+${points}점)`,
        timestamp: Date.now(),
        isSystem: true,
      };
      setChatMessages(prev => [...prev, correctMsg]);

      const currentPlayers =
        state.players.length > 0
          ? state.players
          : JSON.parse(localStorage.getItem(`song-guess-room-${roomId}-players`) || '[]');
      if (state.correctPlayers.length + 1 >= currentPlayers.length) {
        setTimeout(() => {
          setIsPlaying(false);
          setGamePhase('answer_revealed');
          setShowAnswerModal(true);
        }, 1000);
      }
    };

    socket.on('game_players_update', handlePlayersUpdate);
    socket.on('game_chat', handleChatMessage);

    // Cleanup: 리스너만 제거하고 Leave는 하지 않음 (중요!)
    return () => {
      socket.off('game_players_update', handlePlayersUpdate);
      socket.off('game_chat', handleChatMessage);
    };
  }, [socket, roomId]); // 의존성: socket과 roomId만

  // 2. 방 입장 처리 (퇴장 로직 완전 제거)
  useEffect(() => {
    if (socket && roomId && currentUserId && !hasJoinedRef.current) {
      console.log('[Play] Joining game room:', roomId);
      socket.emit('game_join', { roomId, userId: currentUserId });
      hasJoinedRef.current = true;
    }
    
    // 중요: 여기서 return () => { socket.emit('game_leave') } 를 절대 하지 마세요!
    // React Strict Mode 때문에 마운트/언마운트가 반복되면서 무한 루프가 생깁니다.
    // 방 퇴장은 유저가 '나가기' 버튼을 눌렀을 때만 명시적으로 실행합니다.
  }, [socket, roomId, currentUserId]);

  // -------------------------------------------------------------

  // 참가자 목록 불러오기 (localStorage 백업) — players.length를 의존성에 넣지 않음 (무한 렌더 방지)
  useEffect(() => {
    const loadPlayers = () => {
      const playersKey = `song-guess-room-${roomId}-players`;
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
          // 함수형 업데이트: 소켓에서 이미 받은 플레이어가 있으면 덮어쓰지 않음
          setPlayers((prev) => (prev.length > 0 ? prev : playersWithScore));
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

  // YouTube iframe API 로드 및 플레이어 생성 (youtubeContainerRef 마운트 후)
  useEffect(() => {
    const id = 'youtube-player-host';
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!document.getElementById(id) || !(window as any).YT?.Player) return;
      try {
        const p = new (window as any).YT.Player(id, {
          width: 320,
          height: 180,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
          events: {},
        });
        youtubePlayerRef.current = p;
        setYtReady(true);
      } catch (e) {
        console.error('YouTube player init failed', e);
      }
    };
    if ((window as any).YT?.Player) (window as any).onYouTubeIframeAPIReady();
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
    return () => {
      delete (window as any).onYouTubeIframeAPIReady;
      youtubePlayerRef.current = null;
      setYtReady(false);
    };
  }, []);

  // 특정 플레이어의 말풍선 가져오기
  const getPlayerBubble = (playerId: string) => {
    return bubbleMessages.find(msg => msg.playerId === playerId);
  };

  const host = players.find(p => p.isHost);
  const otherPlayers = players.filter(p => !p.isHost);

  if (songsLoading) {
    return (
      <main style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,30,0.95)' }}>
        <div style={{ color: '#00ffff', fontSize: '1.2rem' }}>노래 목록 불러오는 중...</div>
      </main>
    );
  }
  if (!songsLoading && gameSongs.length === 0 && totalRounds > 0) {
    return (
      <main style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,30,0.95)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ color: '#ff6b6b', fontSize: '1.1rem' }}>노래를 불러올 수 없습니다. 시드 데이터를 먼저 넣어 주세요.</div>
        <button onClick={() => router.push('/game/song-guess')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(0,255,255,0.3)', border: '2px solid #00ffff', borderRadius: 8, color: '#00ffff', cursor: 'pointer' }}>방 목록으로</button>
      </main>
    );
  }

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
      message: message,
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
      message: message,
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

  // TTS 재생 시작
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
    setIsAudioPlaying(true);
    
    audio.onended = () => {
      setIsAudioPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsAudioPlaying(false);
      console.error('TTS 재생 오류');
    };
  };

  // TTS 일시정지/재개
  const toggleTTS = () => {
    // 실제 오디오가 있는 경우
    if (audioRef.current) {
      // 오디오 제어 (TTS)
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } 
    // 시뮬레이션 중인 경우
    else if (simulationIntervalRef.current) {
      if (isAudioPlaying) {
        // 시뮬레이션 일시정지 (interval 정리)
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsAudioPlaying(false);
      } else {
        // 시뮬레이션 재개 (다시 시작)
        handlePlayButton();
      }
    }
  };

  // YouTube 검색어 추출 (seed의 youtubeUrl이 search_query인 경우)
  const getYoutubeSearchQuery = useCallback((song: GameSong | null): string => {
    if (!song) return '';
    if (song.youtubeUrl && song.youtubeUrl.includes('search_query=')) {
      try {
        const m = song.youtubeUrl.match(/search_query=([^&]+)/);
        if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '));
      } catch (_) {}
    }
    return `${song.title} ${song.artist}`;
  }, []);

  // 재생 버튼 클릭 핸들러 (방장만) — YouTube iframe API로 실제 노래 재생
  const handlePlayButton = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    const player = youtubePlayerRef.current;
    const searchQuery = getYoutubeSearchQuery(currentSongData);

    if (ytReady && player && searchQuery && (gamePhase === 'waiting' || gamePhase === 'answer_revealed')) {
      try {
        player.loadPlaylist({ listType: 'search', list: searchQuery });
        player.playVideo();
        setLyrics(currentSongData ? `${currentSongData.title} - ${currentSongData.artist}` : '');
        setIsAudioPlaying(true);
        startPlaying();
      } catch (e) {
        console.error('YouTube play failed', e);
        fallbackSimulatePlay();
      }
    } else {
      fallbackSimulatePlay();
    }
  };

  function fallbackSimulatePlay() {
    const exampleLyrics = currentSongData ? `${currentSongData.title} - ${currentSongData.artist}` : '노래를 재생합니다';
    setLyrics(exampleLyrics);
    setTotalDuration(5);
    setCurrentTime(0);
    setIsAudioPlaying(true);
    let simTime = 0;
    const interval = setInterval(() => {
      simTime += 0.1;
      setCurrentTime(simTime);
      if (simTime >= 5) {
        clearInterval(interval);
        simulationIntervalRef.current = null;
        setIsAudioPlaying(false);
        setCurrentTime(0);
      }
    }, 100);
    simulationIntervalRef.current = interval;
    startPlaying();
  }

  // 가사 색상 계산 (노래방 스타일)
  const getLyricsWithColors = () => {
    if (!lyrics) return null;
    
    // totalDuration이 없으면 기본값 사용 (가사 길이 기반 추정)
    const effectiveDuration = totalDuration || (lyrics.length * 0.1);
    const allChars = lyrics.split('');
    const timePerChar = effectiveDuration / allChars.length;
    const currentCharIndex = Math.floor(currentTime / timePerChar);

    return allChars.map((char, index) => {
      const isPast = index <= currentCharIndex;
      const isCurrent = index === currentCharIndex;
      
      let color = '#ffffff'; // 기본 흰색
      if (isPast) {
        color = '#00ffff'; // 파란색
      }
      if (isCurrent) {
        color = '#00aaff'; // 더 밝은 파란색 (현재 읽는 글자)
      }

      return { char, color, isCurrent, index };
    });
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
      {/* YouTube iframe API용 플레이어 컨테이너 (화면 밖에 배치해 재생만 사용) */}
      <div
        id="youtube-player-host"
        ref={youtubeContainerRef}
        style={{ position: 'absolute', left: -9999, top: 0, width: 320, height: 180, overflow: 'hidden' }}
      />
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

      {/* 정답 공개 모달 */}
      {showAnswerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "rgba(20, 20, 40, 0.95)",
              border: "3px solid rgba(255, 215, 0, 0.8)",
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "500px",
              textAlign: "center",
              animation: "modalPop 0.3s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</div>
            <h2
              style={{
                color: "#ffd700",
                fontSize: "1.8rem",
                marginBottom: "0.5rem",
              }}
            >
              정답은...
            </h2>
            <h1
              style={{
                color: "#ffffff",
                fontSize: "2rem",
                marginBottom: "0.5rem",
              }}
            >
              {currentSongData?.title}
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
              }}
            >
              {currentSongData?.artist}
            </p>
            
            {/* 이번 곡 정답자 */}
            {correctPlayers.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "#00ffff", marginBottom: "0.5rem" }}>정답자:</p>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {correctPlayers.map((playerId, idx) => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <span
                        key={playerId}
                        style={{
                          background: idx === 0 ? "rgba(255, 215, 0, 0.3)" : "rgba(0, 255, 255, 0.2)",
                          border: `1px solid ${idx === 0 ? "rgba(255, 215, 0, 0.8)" : "rgba(0, 255, 255, 0.5)"}`,
                          borderRadius: "20px",
                          padding: "0.3rem 0.8rem",
                          color: idx === 0 ? "#ffd700" : "#00ffff",
                          fontSize: "0.9rem",
                        }}
                      >
                        {idx + 1}등 {player?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={goToNextSong}
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
              }}
            >
              {currentSong >= songsPerRound 
                ? (currentRound >= totalRounds ? "결과 보기" : "다음 라운드")
                : "다음 곡"
              }
            </button>
          </div>
        </div>
      )}

      {/* 라운드 종료 모달 */}
      {showRoundEndModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "rgba(20, 20, 40, 0.95)",
              border: "3px solid rgba(0, 255, 255, 0.8)",
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "500px",
              textAlign: "center",
              animation: "modalPop 0.3s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏆</div>
            <h2
              style={{
                color: "#00ffff",
                fontSize: "1.8rem",
                marginBottom: "1rem",
              }}
            >
              Round {currentRound} 종료!
            </h2>
            
            {/* 현재 순위 */}
            <div style={{ marginBottom: "1.5rem" }}>
              {[...players]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 3)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 1rem",
                      marginBottom: "0.5rem",
                      background: idx === 0 ? "rgba(255, 215, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ color: idx === 0 ? "#ffd700" : "#ffffff" }}>
                      {idx + 1}등 {player.name}
                    </span>
                    <span style={{ color: "#00ffff", fontWeight: 700 }}>
                      {player.score || 0}P
                    </span>
                  </div>
                ))}
            </div>

            <button
              onClick={startNextRound}
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
              }}
            >
              Round {currentRound + 1} 시작!
            </button>
          </div>
        </div>
      )}

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
                onClick={() => {
                  if (socket && roomId && currentUserId) {
                    socket.emit('game_leave', { roomId, userId: currentUserId });
                  }
                  router.push('/main/lobby');
                }}
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

        {/* 타이머 + 라운드 정보 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* 타이머 */}
          {isPlaying && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: timeLeft <= 10 ? "rgba(255, 100, 100, 0.3)" : "rgba(0, 255, 255, 0.2)",
                border: `2px solid ${timeLeft <= 10 ? "rgba(255, 100, 100, 0.8)" : "rgba(0, 255, 255, 0.5)"}`,
                borderRadius: "20px",
                animation: timeLeft <= 5 ? "pulse 0.5s infinite" : "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={timeLeft <= 10 ? "#ff6b6b" : "#00ffff"} strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span
                style={{
                  color: timeLeft <= 10 ? "#ff6b6b" : "#00ffff",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  minWidth: "2rem",
                  textAlign: "center",
                }}
              >
                {timeLeft}
              </span>
            </div>
          )}

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
          <HostCharacter
            host={host}
            bubbleMessage={getPlayerBubble(host.id)}
            isPlaying={isPlaying}
            gamePhase={gamePhase}
            lyrics={lyrics}
            isAudioPlaying={isAudioPlaying}
            totalDuration={totalDuration}
            currentTime={currentTime}
            onPlayClick={() => {
              if (lyrics && isAudioPlaying) {
                toggleTTS();
              } else if (lyrics && !isAudioPlaying) {
                toggleTTS();
              } else if (gamePhase === 'waiting' || gamePhase === 'answer_revealed') {
                startPlaying();
              }
            }}
            onSkipClick={() => {
              setIsPlaying(false);
              setGamePhase('answer_revealed');
              setShowAnswerModal(true);
            }}
            isCurrentUserHost={host?.id === currentUserId}
          />
        )}

        {/* 중앙 - 다른 플레이어들 캐릭터 + 가사 표시 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
          }}
        >
          {/* 중앙 음악 아이콘 (동적) - 재생 중일 때만 표시 */}
          {isAudioPlaying && (
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
              {[...Array(5)].map((_, i) => (
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
              
              {/* 고정된 음표 아이콘 */}
              <div
                className="music-note-icon"
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: "120px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64c8ff",
                  filter: "drop-shadow(0 0 30px rgba(100, 200, 255, 0.8)) drop-shadow(0 0 60px rgba(100, 200, 255, 0.4))",
                  animation: "notePulse 1.2s ease-in-out infinite",
                }}
              >
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>
          )}

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
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.15rem",
                  letterSpacing: "0.05em",
                }}
              >
                {getLyricsWithColors()?.map((item, index) => (
                  <span
                    key={index}
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
            <PlayerCharacter
              key={player.id}
              player={player}
              bubbleMessage={getPlayerBubble(player.id)}
              isCorrect={correctPlayers.includes(player.id)}
            />
          ))}
          </div>
        </div>

        {/* 오른쪽 - 채팅 패널 */}
        <ChatPanel
          messages={chatMessages}
          input={chatInput}
          onInputChange={setChatInput}
          onSend={sendChat}
          chatContainerRef={chatContainerRef as RefObject<HTMLDivElement>}
        />
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
        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
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