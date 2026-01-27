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

// 표시용만 사용 — (1) 붙은 저장값을 비(1) 경로로
const toDisplayModelUrl = (u: string) => (u || '').replace(/\s*\(1\)\s*\.glb$/i, '.glb') || '/character1.glb';

// 3D 모델 컴포넌트 — (1) 없는 GLB, 박스 크기에 맞춤
function Model({ url, scale = 2 }: { url: string; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const loadUrl = (url || '').replace(/ /g, '%20');
  const { scene, animations } = useGLTF(loadUrl);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    Object.values(actions).forEach(action => action?.stop());
  }, [actions]);
  
  const isCharacter1 = url.includes('character1');
  const positionY = isCharacter1 ? -1.2 : -0.6;
  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];
  return <primitive ref={group} object={clonedScene} scale={scale} position={[0, positionY, 0]} rotation={rotation} />;
}

// 캐릭터 뷰어 — 박스(size×size)에 맞게. character1은 프레임 안에 들어오도록 더 작게 (frameloop="always"로 캐릭터가 보이게)
function CharacterViewer({ characterUrl, size = 200 }: { characterUrl: string; size?: number }) {
  const displayUrl = toDisplayModelUrl(characterUrl);
  const isChar1 = displayUrl.includes('character1');
  const scale = isChar1 ? (size > 250 ? 1.6 : 1.2) : (size > 250 ? 2.4 : 1.8);
  const camZ = size > 250 ? 4 : 3.5;
  return (
    <div style={{ width: size, height: size, overflow: "hidden" }}>
      <Canvas camera={{ position: [0, 0.2, camZ], fov: 50 }} frameloop="always">
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <Model url={displayUrl} scale={scale} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
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
  const [roomGenres, setRoomGenres] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bubbleMessages, setBubbleMessages] = useState<BubbleMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 가사 및 TTS 관련 state
  const [lyrics, setLyrics] = useState<string>(''); // 현재 가사 (사투리 문장)
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 사투리 퀴즈 정답/턴 state (가사는 모두에게 동기화, 정답 맞추면 모달 후 다음 턴)
  const [currentRoundAnswer, setCurrentRoundAnswer] = useState<string>(''); // 원문 가사(정답)
  const [currentRoundTitle, setCurrentRoundTitle] = useState<string>('');
  const [currentRoundArtist, setCurrentRoundArtist] = useState<string>('');
  const [sauturiCorrectPlayers, setSauturiCorrectPlayers] = useState<string[]>([]);
  const [showSauturiAnswerModal, setShowSauturiAnswerModal] = useState(false);
  const [showSauturiRoundEndModal, setShowSauturiRoundEndModal] = useState(false);
  const [sauturiNobodyGotIt, setSauturiNobodyGotIt] = useState(false);
  const sauturiGotCorrectRef = useRef(false);
  const sauturiStateRef = useRef({ currentRoundAnswer: '', currentRoundTitle: '', sauturiCorrectPlayers: [] as string[] });
  sauturiStateRef.current = { currentRoundAnswer, currentRoundTitle, sauturiCorrectPlayers };
  const goToNextSauturiTurnRef = useRef<() => void>(() => {});

  const handlePlayButtonRef = useRef<() => void>(() => {});
  const roundSongRef = useRef({ currentRound: 1, currentSong: 1, songsPerRound: 5, totalRounds: 1 });
  roundSongRef.current = { currentRound, currentSong, songsPerRound, totalRounds };

  // 다음 곡/라운드로 이동 — 노래 맞추기와 동일: 정답 모달에서 사용자가 버튼으로 진행
  const goToNextSauturiTurn = () => {
    setShowSauturiAnswerModal(false);
    setLyrics('');
    setSauturiCorrectPlayers([]);
    setCurrentRoundAnswer('');
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(0);
    const { currentRound: r, currentSong: s, songsPerRound: spr, totalRounds: tr } = roundSongRef.current;
    if (s >= spr) {
      if (r >= tr) {
        router.push('/main/lobby');
      } else {
        setShowSauturiRoundEndModal(true);
      }
    } else {
      setCurrentSong(s + 1);
    }
  };
  goToNextSauturiTurnRef.current = goToNextSauturiTurn;

  // 다음 라운드 시작 — 라운드 종료 모달에서 "Round N+1 시작!" 클릭 시
  const startNextSauturiRound = () => {
    setShowSauturiRoundEndModal(false);
    setLyrics('');
    setSauturiCorrectPlayers([]);
    setCurrentRoundAnswer('');
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(0);
    setCurrentRound((prev) => prev + 1);
    setCurrentSong(1);
  };

  // 현재 사용자 정보 및 방 정보 불러오기 (미리보기 시 API 스킵)
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId) setCurrentUserId(userId);
    if (userName) setCurrentUserName(userName);

    if (roomId === 'preview-room') {
      setTotalRounds(4);
      setSongsPerRound(1);
    } else {
      // 방 정보 불러오기 (API에서 가져오기)
      const fetchRoomInfo = async () => {
        try {
          const res = await fetch(`/api/games/rooms?page=1&pageSize=100`, {
            headers: { 'x-user-id': userId || '' },
          });
          if (res.ok) {
            const data = await res.json();
            const currentRoom = data.rooms?.find((r: any) => r.id === roomId);
            if (currentRoom) {
              const opts = currentRoom.options as any;
              setTotalRounds(opts?.rounds ?? 4);
              setSongsPerRound(opts?.songsPerRound ?? 5);
              setRoomGenres(Array.isArray(opts?.genres) ? opts.genres : []);
            }
          }
        } catch (e) {
          console.error('Failed to load room info', e);
          const STORAGE_KEY = 'sauturi-quiz-rooms';
          const storedRooms = localStorage.getItem(STORAGE_KEY);
          if (storedRooms) {
            try {
              const rooms: Room[] = JSON.parse(storedRooms);
              const currentRoom = rooms.find(r => r.id === roomId);
              if (currentRoom) {
                setTotalRounds(currentRoom.rounds);
                setSongsPerRound(currentRoom.songsPerRound);
                setRoomGenres(Array.isArray(currentRoom.genres) ? currentRoom.genres : []);
              }
            } catch (err) {
              console.error('Failed to parse stored rooms', err);
            }
          }
        }
      };
      if (userId) fetchRoomInfo();
    }

    // 플레이어 목록 불러오기 (localStorage) — 재입장/게임 시작 시 캐릭터·UI 복구
    const loadPlayers = () => {
      const playersKey = `sauturi-quiz-room-${roomId}-players`;
      const storedPlayers = localStorage.getItem(playersKey);
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers);
          const playersWithScore = parsedPlayers.map((p: Player) => {
            const url = toDisplayModelUrl(p.character || p.characterUrl || '/character1.glb');
            return { ...p, score: p.score ?? 0, character: url, characterUrl: url };
          });
          setPlayers((prev) => (prev.length > 0 ? prev : playersWithScore));
        } catch (e) {
          console.error('Failed to parse players', e);
        }
      }
    };

    loadPlayers();
    const t = setTimeout(loadPlayers, 150); // countdown→play 직후 방금 쓴 데이터 반영
    const interval = setInterval(loadPlayers, 500);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [roomId]);

  // -------------------------------------------------------------
  // [수정된 부분] 소켓 연결 로직 (무한 루프 방지 버전)
  // -------------------------------------------------------------

  // 중복 조인 방지용 ref
  const hasJoinedRef = useRef(false);

  // 1. 소켓 이벤트 리스너 등록 (미리보기 시 스킵)
  useEffect(() => {
    if (roomId === 'preview-room' || !socket || !roomId) return;

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
          const displayUrl = toDisplayModelUrl(equippedCharacter || '/character1.glb');
          return {
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            score: 0,
            character: displayUrl,
            characterUrl: displayUrl,
            joinedAt: player.joinedAt,
          };
        });
        
        // 재입장 시 복구용: 받은 목록을 localStorage에 저장 (캐릭터/UI가 다시 뜨도록)
        if (typeof window !== 'undefined' && playersWithCharacters.length > 0) {
          try {
            localStorage.setItem(`sauturi-quiz-room-${roomId}-players`, JSON.stringify(playersWithCharacters));
          } catch (_) {}
        }
        
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

        // 사투리 정답 체크: 원문 가사(표준어) 또는 제목 맞춰도 인정 — 대소문자·쉼표·하이픈 무시
        const state = sauturiStateRef.current;
        const norm = (s: string) =>
          (s || '').toLowerCase().replace(/,/g, '').replace(/-/g, '').replace(/\s+/g, ' ').trim();
        const origNorm = norm(state.currentRoundAnswer || '');
        const titleNorm = norm(state.currentRoundTitle || '');
        const msgNorm = norm(data.message || '');
        const accepted = [origNorm, titleNorm].filter(Boolean);
        const isCorrect = accepted.length > 0 && msgNorm && accepted.some(a => a === msgNorm) && !state.sauturiCorrectPlayers.includes(data.playerId);
        if (isCorrect) {
          setSauturiCorrectPlayers(prev => [...prev, data.playerId]);
          if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
          }
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          setIsPlaying(false);
          setCurrentTime(0);
          setShowSauturiAnswerModal(true);
          setSauturiNobodyGotIt(false);
          sauturiGotCorrectRef.current = true;
        }
      }
    };

    // 가사/정답 동기화: 방장이 재생 시 전체에 가사·정답 전파 → 가사만 표시, 재생은 각자 재생 버튼으로
    const handleSauturiLyricSync = (payload: { roomId: string; dialect: string; original?: string; title?: string; artist?: string }) => {
      if (payload.roomId !== roomId) return;
      const text = payload.dialect || '';
      setLyrics(text);
      setCurrentRoundAnswer(payload.original ?? '');
      setCurrentRoundTitle(payload.title ?? '');
      setCurrentRoundArtist(payload.artist ?? '');
      setSauturiCorrectPlayers([]);
      sauturiGotCorrectRef.current = false;
      // 자동 재생 제거: 매번 재생 버튼을 눌러야 음성이 나오도록 함
    };

    // 턴 종료(아무도 못 맞춤): 방 전체에 알림 → 모두 "아무도 못 맞췄다" 모달 후 다음 턴
    const handleSauturiTurnEnd = (payload: { roomId: string; nobodyGotIt: boolean; answer?: string; title?: string; artist?: string }) => {
      if (payload.roomId !== roomId || !payload.nobodyGotIt) return;
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentRoundAnswer(payload.answer ?? '');
      setCurrentRoundTitle(payload.title ?? '');
      setCurrentRoundArtist(payload.artist ?? '');
      setShowSauturiAnswerModal(true);
      setSauturiNobodyGotIt(true);
    };

    socket.on('game_players_update', handlePlayersUpdate);
    socket.on('game_chat', handleChatMessage);
    socket.on('sauturi_lyric_sync', handleSauturiLyricSync);
    socket.on('sauturi_turn_end', handleSauturiTurnEnd);

    // Cleanup: 리스너만 제거 (game_leave 절대 하지 않음!)
    return () => {
      socket.off('game_players_update', handlePlayersUpdate);
      socket.off('game_chat', handleChatMessage);
      socket.off('sauturi_lyric_sync', handleSauturiLyricSync);
      socket.off('sauturi_turn_end', handleSauturiTurnEnd);
    };
  }, [socket, roomId]);

  // 2. 방 입장 처리 (퇴장 로직 완전 제거, 미리보기 시 스킵)
  useEffect(() => {
    if (roomId === 'preview-room') return;
    if (socket && roomId && currentUserId && !hasJoinedRef.current) {
      console.log('[Play] Joining game room:', roomId);
      socket.emit('game_join', { roomId, userId: currentUserId });
      hasJoinedRef.current = true;
    }
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
  const isCurrentUserHost = host?.id === currentUserId;

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

  // 가사 TTS 재생 (ElevenLabs API 사용)
  const startPlayWithData = async (text: string, duration: number, orig: string, title: string, artist: string) => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (!text) return;

    const doTurnEnd = () => {
      const isHost = players.find(p => p.isHost)?.id === currentUserId;
      if (isHost && !sauturiGotCorrectRef.current && orig && socket && roomId) {
        socket.emit("sauturi_turn_end", { roomId, nobodyGotIt: true, answer: orig, title, artist });
      }
    };

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const fallback = async () => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ko-KR";
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
          }
          setIsPlaying(true);
          setCurrentTime(0);
          let simTime = 0;
          const interval = setInterval(() => {
            simTime += 0.1;
            setCurrentTime(simTime);
            if (simTime >= duration) {
              clearInterval(interval);
              simulationIntervalRef.current = null;
              setIsPlaying(false);
              setCurrentTime(0);
              doTurnEnd();
            }
          }, 100);
          simulationIntervalRef.current = interval;
        };
        await fallback();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      const cleanup = () => {
        URL.revokeObjectURL(url);
        simulationIntervalRef.current = null;
        setIsPlaying(false);
        setCurrentTime(0);
        doTurnEnd();
      };

      audio.addEventListener("loadedmetadata", () => setTotalDuration(audio.duration));
      audio.addEventListener("ended", cleanup);
      audio.addEventListener("error", () => {
        cleanup();
        console.error("TTS 오디오 재생 오류");
      });

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = audio;
      setTtsAudio(audio);
      setIsPlaying(true);
      setCurrentTime(0);
      await audio.play();
    } catch (e) {
      console.error("TTS 요청 실패:", e);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
      setIsPlaying(true);
      setCurrentTime(0);
      let simTime = 0;
      const interval = setInterval(() => {
        simTime += 0.1;
        setCurrentTime(simTime);
        if (simTime >= duration) {
          clearInterval(interval);
          simulationIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentTime(0);
          doTurnEnd();
        }
      }, 100);
      simulationIntervalRef.current = interval;
    }
  };

  // 현재 라운드 장르에 맞는 랜덤 사투리 가사 1개 로드 후 바로 재생 (방장만, 한 번에 재생)
  const handlePlayButton = async () => {
    if (players.find(p => p.isHost)?.id !== currentUserId) return;
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    const genre = roomGenres[currentRound - 1] ?? roomGenres[0] ?? "발라드";
    try {
      const res = await fetch(
        `/api/dialect-lyrics/random?genre=${encodeURIComponent(genre)}`
      );
      if (!res.ok) {
        setLyrics("이 장르의 가사를 불러오지 못했어요.");
        setTotalDuration(15);
        setCurrentTime(0);
        setIsPlaying(true);
        let simTime = 0;
        const interval = setInterval(() => {
          simTime += 0.1;
          setCurrentTime(simTime);
          if (simTime >= 15) {
            clearInterval(interval);
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }, 100);
        simulationIntervalRef.current = interval;
        return;
      }
      const data = (await res.json()) as {
        dialect: string;
        original?: string;
        title?: string;
        artist?: string;
      };
      const text = data.dialect || "";
      const orig = (data.original ?? "").trim();
      const title = data.title ?? "";
      const artist = data.artist ?? "";
      setLyrics(text);
      setCurrentRoundAnswer(orig);
      setCurrentRoundTitle(title);
      setCurrentRoundArtist(artist);
      setSauturiCorrectPlayers([]);
      sauturiGotCorrectRef.current = false;
      if (socket && roomId) {
        socket.emit("sauturi_lyric_sync", { roomId, dialect: text, original: orig, title, artist });
      }
      const duration = Math.max(15, Math.ceil((text.length || 10) * 0.15));
      setTotalDuration(duration);
      setCurrentTime(0);
      startPlayWithData(text, duration, orig, title, artist);
    } catch (e) {
      console.error("Failed to load dialect lyric", e);
      setLyrics("가사를 불러오는 중 오류가 났어요.");
      setTotalDuration(15);
      setCurrentTime(0);
      setIsPlaying(true);
      let simTime = 0;
      const interval = setInterval(() => {
        simTime += 0.1;
        setCurrentTime(simTime);
        if (simTime >= 15) {
          clearInterval(interval);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, 100);
      simulationIntervalRef.current = interval;
    }
  };
  handlePlayButtonRef.current = handlePlayButton;

  // 현재 가사 TTS 재생 (이미 로드된 가사로 재생 — 동기화 받은 사람이 재생 버튼 눌렀을 때)
  const playCurrentTTS = () => {
    if (!lyrics || !totalDuration) return;
    startPlayWithData(lyrics, totalDuration, currentRoundAnswer, currentRoundTitle, currentRoundArtist);
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
    // 시뮬레이션 중인 경우 (사투리 TTS)
    else if (simulationIntervalRef.current || (lyrics && !audioRef.current)) {
      if (isPlaying) {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      } else {
        // 재개: 현재 가사 다시 재생
        if (lyrics && totalDuration > 0) playCurrentTTS();
      }
    }
  };

  return (
    <main className="lobby-premium-root">
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
            <div key={i} className={`lobby-particle ${isPurple ? 'lobby-particle-purple' : ''} ${size}`} style={{ left: `${8 + (i % 10) * 8}%`, top: `${8 + (Math.floor(i / 10) % 4) * 22}%`, animationDelay: `${(i * 0.4) % 8}s`, animationDuration: `${10 + (i % 5)}s` }} />
          );
        })}
      </div>
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 0.75rem', width: '100%', boxSizing: 'border-box' }}>
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

      {/* 사투리 정답 모달: 맞췄다 / 아무도 못 맞췄다 → 사용자가 다음 버튼으로 진행 (노래 맞추기와 동일) */}
      {showSauturiAnswerModal && (
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
                color: sauturiNobodyGotIt ? "#ffd700" : "#00ff00",
                fontSize: "1.8rem",
                marginBottom: "0.5rem",
              }}
            >
              {sauturiNobodyGotIt ? "아무도 못 맞췄다" : "맞췄다!"}
            </h2>
            {sauturiNobodyGotIt ? (
              <>
                <p style={{ color: "#ffffff", fontSize: "1.2rem", marginBottom: "0.5rem" }}>정답 (원문)</p>
                <p style={{ color: "#00ffff", fontSize: "1.1rem", marginBottom: "0.5rem", wordBreak: "keep-all" }}>{currentRoundAnswer}</p>
                {(currentRoundTitle || currentRoundArtist) && (
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                    {[currentRoundTitle, currentRoundArtist].filter(Boolean).join(" · ")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ color: "#ffffff", fontSize: "1.1rem", marginBottom: "0.5rem" }}>정답 (원문)</p>
                <p style={{ color: "#00ffff", fontSize: "1rem", marginBottom: "0.5rem", wordBreak: "keep-all" }}>{currentRoundAnswer}</p>
                <p style={{ color: "#00ffff", marginBottom: "0.5rem" }}>정답자</p>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  {sauturiCorrectPlayers.map((playerId, idx) => {
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
                        {player?.name ?? playerId}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            <button
              onClick={goToNextSauturiTurn}
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
                : "다음 곡"}
            </button>
          </div>
        </div>
      )}

      {/* 라운드 종료 모달 — 노래 맞추기와 동일 형식 */}
      {showSauturiRoundEndModal && (
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
              onClick={startNextSauturiRound}
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
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          aria-label="홈으로"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            lineHeight: 0,
            transition: "transform 0.2s ease, filter 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.filter = "drop-shadow(0 0 12px rgba(0, 255, 255, 0.5))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter = "none";
          }}
        >
          <img src="/logo2.png" alt="LOCAL HOST" style={{ height: "96px", width: "auto" }} />
        </button>
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
        {/* 왼쪽 - 방장 캐릭터 (크게, 조금 왼쪽으로) */}
        {host && (
          <div
            style={{
              width: "320px",
              marginLeft: "-20px",
              flexShrink: 0,
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
              {/* 방장 말풍선 (캐릭터 오른쪽에 배치) */}
              {getPlayerBubble(host.id) && (
                <div
                  style={{
                    position: "absolute",
                    left: "calc(100% - 44px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "0.75rem 1rem",
                    borderRadius: "16px",
                    borderBottomLeftRadius: "4px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                    zIndex: 20,
                    animation: "bubbleAppear 0.3s ease",
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
                  width: "280px",
                  height: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible",
                }}
              >
                <CharacterViewer characterUrl={host.character || '/character1.glb'} size={280} />
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

            {/* 재생 버튼 하나만: 방장은 가사 없을 때 누르면 다음 가사 로드, 가사 있으면 재생/일시정지 */}
            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              {((isCurrentUserHost && !showSauturiAnswerModal) || lyrics) && (
                <button
                  onClick={() => {
                    if (isCurrentUserHost && !lyrics) {
                      handlePlayButton();
                    } else if (lyrics) {
                      isPlaying ? toggleTTS() : playCurrentTTS();
                    }
                  }}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: isPlaying ? "rgba(0, 255, 0, 0.2)" : "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(0, 200, 200, 0.3))",
                    border: `2px solid ${isPlaying ? "rgba(0, 255, 0, 0.8)" : "rgba(0, 255, 255, 0.8)"}`,
                    color: isPlaying ? "#00ff00" : "#00ffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isPlaying ? "0 0 15px rgba(0, 255, 0, 0.4)" : "0 0 15px rgba(0, 255, 255, 0.4)",
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
              )}
              {totalDuration > 0 && isPlaying && (
                <div style={{ color: "#ffffff", fontSize: "0.85rem", textAlign: "center" }}>
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
              
              {/* 음표 아이콘 - 자동으로 게임 진행 */}
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
                  color: isPlaying ? "#64c8ff" : "#8bb3d9",
                  filter: isPlaying 
                    ? "drop-shadow(0 0 30px rgba(100, 200, 255, 0.8)) drop-shadow(0 0 60px rgba(100, 200, 255, 0.4))"
                    : "drop-shadow(0 0 20px rgba(139, 179, 217, 0.5)) drop-shadow(0 0 40px rgba(139, 179, 217, 0.3))",
                  animation: isPlaying ? "notePulse 1.2s ease-in-out infinite" : "none",
                  transition: "all 0.3s ease",
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
              {/* 말풍선 (캐릭터 오른쪽에 배치) */}
              {getPlayerBubble(player.id) && (
                <div
                  style={{
                    position: "absolute",
                    left: "calc(100% - 34px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "12px",
                    borderBottomLeftRadius: "4px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                    zIndex: 20,
                    animation: "bubbleAppear 0.3s ease",
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
                  width: "200px",
                  height: "200px",
                }}
              >
                <CharacterViewer characterUrl={player.character || '/character1.glb'} size={200} />
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

        {/* 오른쪽 - 채팅 패널 (조금 왼쪽으로) */}
        <div style={{ flexShrink: 0, marginLeft: "auto", marginRight: "20px", alignSelf: "stretch", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              width: "280px",
              flex: 1,
              minHeight: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(0, 255, 255, 0.5)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
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
              minHeight: 0,
              padding: "1rem",
              overflowY: "auto",
              overflowX: "hidden",
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
      </div>

      <style jsx>{`
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
        @keyframes bubbleAppear {
          from {
            opacity: 0;
            transform: translate(-10px, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
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
      </div>
    </main>
  );
}
