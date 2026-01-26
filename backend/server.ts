// backend/server.ts
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "./lib/prisma";

interface AuthedRequest extends Request {
  userId: string;
}

const app = express();
const port = process.env.PORT || 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 간단 인증 미들웨어
// - 실제 서비스에서는 OAuth / JWT 등으로 대체해야 함
// - 헤더 `x-user-id`가 있으면 해당 유저를 사용
// - 없으면 demo 유저를 자동 생성/사용
const ensureUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const headerUserId = req.header("x-user-id");

    if (headerUserId) {
      const user = await prisma.user.findUnique({
        where: { id: headerUserId },
      });
      if (!user) {
        return res.status(401).json({ message: "Invalid user id" });
      }

      (req as any).userId = user.id;
      return next();
    }

    // 데모 / 로컬 개발용 기본 유저
    let user = await prisma.user.findFirst({
      where: { snsId: "demo-sns", provider: "demo" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          snsId: "demo-sns",
          provider: "demo",
          nickname: "Demo User",
        },
      });
    }

    (req as any).userId = user.id;
    next();
  } catch (err) {
    console.error("[auth] ensureUser error", err);
    res.status(500).json({ message: "Failed to resolve user" });
  }
};

// HTTP 서버 생성
const httpServer = createServer(app);

// Socket.io 서버 생성 및 설정
const io = new Server(httpServer, {
  cors: {
    origin: "*", // 개발 중에는 모든 출처 허용
    methods: ["GET", "POST"],
  },
});

// 기본 라우트
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend API Server" });
});

/**
 * 회원가입
 * POST /api/auth/signup
 * Body: { email, password, nickname }
 * Returns: { userId, nickname, email }
 */
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body as {
      email?: string;
      password?: string;
      nickname?: string;
    };

    if (!email || !password || !nickname) {
      return res
        .status(400)
        .json({ message: "이메일, 비밀번호, 닉네임은 필수입니다." });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }

    // 닉네임 중복 확인
    const existingNickname = await prisma.user.findFirst({
      where: { nickname },
    });

    if (existingNickname) {
      return res.status(409).json({ message: "이미 존재하는 닉네임입니다." });
    }

    // TODO: 실제 프로덕션에서는 bcrypt로 비밀번호 해시 필요
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // 임시: 나중에 bcrypt로 교체 필요

    // 유저 생성
    const user = await prisma.user.create({
      data: {
        snsId: email, // 이메일을 snsId로 사용
        provider: "email",
        email,
        password: hashedPassword,
        nickname,
      },
    });

    res.status(201).json({
      userId: user.id,
      nickname: user.nickname,
      email: user.email,
    });
  } catch (error) {
    console.error("[POST /api/auth/signup] error", error);
    res.status(500).json({ message: "회원가입에 실패했습니다." });
  }
});

/**
 * 로그인 (이메일/비밀번호 또는 닉네임)
 * POST /api/auth/login
 * Body: { email?, password?, nickname? }
 * Returns: { userId, nickname, email? }
 */
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body as {
      email?: string;
      password?: string;
      nickname?: string;
    };

    // 이메일/비밀번호 로그인
    if (email && password) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      // TODO: 실제 프로덕션에서는 bcrypt로 비밀번호 검증 필요
      // const isValid = await bcrypt.compare(password, user.password);
      const isValid = password === user.password; // 임시: 나중에 bcrypt로 교체 필요

      if (!isValid) {
        return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      return res.json({
        userId: user.id,
        nickname: user.nickname,
        email: user.email,
      });
    }

    // 닉네임 기반 로그인 (기존 호환성 유지)
    if (nickname) {
      const name = nickname.trim() || "Guest";

      // 먼저 같은 닉네임을 가진 유저가 있는지 확인
      let user = await prisma.user.findFirst({
        where: {
          nickname: name,
          provider: "demo",
        },
      });

      // 유저가 없으면 새로 생성
      if (!user) {
        user = await prisma.user.create({
          data: {
            snsId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            provider: "demo",
            nickname: name,
          },
        });
      }

      return res.json({ userId: user.id, nickname: user.nickname });
    }

    return res.status(400).json({
      message: "이메일/비밀번호 또는 닉네임을 제공해주세요.",
    });
  } catch (error) {
    console.error("[POST /api/auth/login] error", error);
    res.status(500).json({ message: "로그인에 실패했습니다." });
  }
});

// /api 이하에는 유저 정보 필요
app.use("/api", ensureUser);

/**
 * 홈 화면
 * GET /api/home
 *  - 프로필 요약
 *  - 인기/대기중 방 목록
 */
app.get("/api/home", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        beats: true,
        level: true,
        equippedSkinId: true,
        equippedEffectId: true,
      },
    });

    const [gameRooms, playlistRooms, totalRooms] = await Promise.all([
      prisma.room.findMany({
        where: {
          type: { in: ["MUSIC_QUIZ", "DIALECT_QUIZ"] },
          status: "WAITING",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.room.findMany({
        where: { type: "PLAYLIST", status: "WAITING" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.room.count(),
    ]);

    res.json({
      profileSummary: user,
      stats: {
        totalRooms,
        // 실 서비스에서 접속자 수는 별도 세션/캐시 사용
        onlineUsers: 0,
      },
      featuredGameRooms: gameRooms,
      featuredPlaylistRooms: playlistRooms,
    });
  } catch (err) {
    console.error("[GET /api/home] error", err);
    res.status(500).json({ message: "Failed to load home data" });
  }
});

/**
 * 유저 프로필 요약
 * GET /api/users/me/summary
 */
app.get(
  "/api/users/me/summary",
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          beats: true,
          level: true,
          equippedSkinId: true,
          equippedEffectId: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      console.error("[GET /api/users/me/summary] error", err);
      res.status(500).json({ message: "Failed to load user summary" });
    }
  }
);

/**
 * 전체 방 목록 (홈/게임 공용)
 * GET /api/rooms
 * query:
 *  - page, pageSize
 *  - type (MUSIC_QUIZ, DIALECT_QUIZ, PLAYLIST)
 *  - status (WAITING, PLAYING)
 */
app.get("/api/rooms", async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) || "20", 10);
    const type = req.query.type as string | undefined;
    const status = (req.query.status as string | undefined) || "WAITING";

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      rooms,
    });
  } catch (err) {
    console.error("[GET /api/rooms] error", err);
    res.status(500).json({ message: "Failed to load rooms" });
  }
});

/**
 * 게임 방 생성
 * POST /api/games/rooms
 * body: { title, isPrivate, password?, gameType: "MUSIC" | "DIALECT", options? }
 */
app.post("/api/games/rooms", async (req: Request, res: Response) => {
  try {
    const { title, isPrivate, password, gameType, options } = req.body;

    if (!title || !gameType) {
      return res.status(400).json({ message: "title, gameType is required" });
    }

    const roomType =
      gameType === "DIALECT" ? "DIALECT_QUIZ" : "MUSIC_QUIZ";

    const room = await prisma.room.create({
      data: {
        title,
        isPrivate: !!isPrivate,
        password: isPrivate ? password || null : null,
        type: roomType,
        status: "WAITING",
        options: options ?? {},
        hostId: (req as any).userId,
      },
    });

    // Broadcast room creation to all connected clients
    io.emit("room_created", { room });

    res.status(201).json(room);
  } catch (err) {
    console.error("[POST /api/games/rooms] error", err);
    res.status(500).json({ message: "Failed to create game room" });
  }
});

/**
 * 게임 방 목록
 * GET /api/games/rooms
 */
app.get("/api/games/rooms", async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) || "20", 10);
    const where = {
      type: { in: ["MUSIC_QUIZ", "DIALECT_QUIZ"] as any },
      status: "WAITING" as const,
    };

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ page, pageSize, total, rooms });
  } catch (err) {
    console.error("[GET /api/games/rooms] error", err);
    res.status(500).json({ message: "Failed to load game rooms" });
  }
});

/**
 * 게임 방 입장 (비밀번호 검증)
 * POST /api/games/rooms/join
 * body: { roomId, password? }
 */
app.post(
  "/api/games/rooms/join",
  async (req: Request, res: Response) => {
    try {
      const { roomId, password } = req.body;

      if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
      }

      const room = await prisma.room.findUnique({ where: { id: roomId } });

      if (!room || !["MUSIC_QUIZ", "DIALECT_QUIZ"].includes(room.type)) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.isPrivate && room.password !== password) {
        return res.status(403).json({ message: "Invalid room password" });
      }

      res.json({
        room,
        socketRoomId: room.id,
      });
    } catch (err) {
      console.error("[POST /api/games/rooms/join] error", err);
      res.status(500).json({ message: "Failed to join room" });
    }
  }
);

/**
 * 게임 최종 결과 조회
 * GET /api/games/matches/:id/result
 */
app.get(
  "/api/games/matches/:id/result",
  async (req: Request, res: Response) => {
    try {
      const historyId = req.params.id;

      const history = await prisma.gameHistory.findUnique({
        where: { id: historyId },
        include: {
          results: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  level: true,
                },
              },
            },
            orderBy: { rank: "asc" },
          },
        },
      });

      if (!history) {
        return res.status(404).json({ message: "Match not found" });
      }

      const userId = (req as any).userId as string;
      const myResult = history.results.find((r: any) => r.userId === userId);

      res.json({
        match: {
          id: history.id,
          roomId: history.roomId,
          playedAt: history.playedAt,
          gameType: history.gameType,
        },
        top3: history.results.slice(0, 3),
        myResult: myResult ?? null,
      });
    } catch (err) {
      console.error("[GET /api/games/matches/:id/result] error", err);
      res.status(500).json({ message: "Failed to load match result" });
    }
  }
);

/**
 * 플리 방 생성
 * POST /api/playlists/rooms
 */
app.post(
  "/api/playlists/rooms",
  async (req: Request, res: Response) => {
    try {
      const { title, isPrivate, password, options } = req.body;

      if (!title) {
        return res.status(400).json({ message: "title is required" });
      }

      const userId = (req as any).userId as string;

      const room = await prisma.room.create({
        data: {
          title,
          isPrivate: !!isPrivate,
          password: isPrivate ? password || null : null,
          type: "PLAYLIST",
          status: "WAITING",
          options: options ?? {},
          hostId: userId,
        },
      });

      // Broadcast room creation to all connected clients
      io.emit("room_created", { room });

      res.status(201).json(room);
    } catch (err) {
      console.error("[POST /api/playlists/rooms] error", err);
      res.status(500).json({ message: "Failed to create playlist room" });
    }
  }
);

/**
 * 플리 방 목록
 * GET /api/playlists/rooms
 */
app.get(
  "/api/playlists/rooms",
  async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) || "1", 10);
      const pageSize = parseInt(
        (req.query.pageSize as string) || "20",
        10
      );

      const where = {
        type: "PLAYLIST" as const,
        status: "WAITING" as const,
      };

      const [total, rooms] = await Promise.all([
        prisma.room.count({ where }),
        prisma.room.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      res.json({ page, pageSize, total, rooms });
    } catch (err) {
      console.error("[GET /api/playlists/rooms] error", err);
      res.status(500).json({ message: "Failed to load playlist rooms" });
    }
  }
);

/**
 * 플리 방 입장
 * POST /api/playlists/rooms/join
 */
app.post(
  "/api/playlists/rooms/join",
  async (req: Request, res: Response) => {
    try {
      const { roomId, password } = req.body;

      if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
      }

      const room = await prisma.room.findUnique({ where: { id: roomId } });

      if (!room || room.type !== "PLAYLIST") {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.isPrivate && room.password !== password) {
        return res.status(403).json({ message: "Invalid room password" });
      }

      res.json({
        room,
        socketRoomId: room.id,
      });
    } catch (err) {
      console.error("[POST /api/playlists/rooms/join] error", err);
      res.status(500).json({ message: "Failed to join playlist room" });
    }
  }
);

/**
 * 방 삭제 (방 생성자만 가능)
 * DELETE /api/rooms/:roomId
 */
app.delete("/api/rooms/:roomId", async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const userId = (req as any).userId as string;

    if (!roomId) {
      return res.status(400).json({ message: "방 ID가 필요합니다." });
    }

    if (!userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 방 정보 조회
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }

    // 방 생성자 확인
    if (room.hostId !== userId) {
      return res
        .status(403)
        .json({ message: "방장만 방을 삭제할 수 있습니다." });
    }

    // 게임 세션이 있으면 정리
    if (gameSessions.has(roomId)) {
      const session = gameSessions.get(roomId);
      if (session) {
        // 모든 플레이어에게 방 삭제 알림
        io.to(roomId).emit("room_deleted", {
          roomId,
          message: "Room has been deleted by the host",
        });
      }
      gameSessions.delete(roomId);
    }

    // 관련 데이터 삭제 (트랜잭션으로 처리)
    try {
      await prisma.$transaction(async (tx: any) => {
        // 플레이리스트 트랙 삭제 (플레이리스트 방인 경우에만 존재)
        // deleteMany는 레코드가 없어도 에러를 발생시키지 않음
        await tx.playlistTrack.deleteMany({
          where: { roomId },
        });

        // GameHistory와 관련된 GameResult 삭제 (기록을 유지하려면 이 부분을 주석 처리)
        // 기록을 유지하려면 스키마에서 roomId를 nullable로 만들고 onDelete: SetNull 설정 필요
        await tx.gameResult.deleteMany({
          where: {
            history: {
              roomId: roomId,
            },
          },
        });

        // GameHistory 삭제
        await tx.gameHistory.deleteMany({
          where: { roomId },
        });

        // 방 삭제
        await tx.room.delete({
          where: { id: roomId },
        });
      });
    } catch (transactionErr: any) {
      console.error("[DELETE /api/rooms/:roomId] Transaction error:", transactionErr);
      throw transactionErr; // Re-throw to be caught by outer catch
    }

    // 모든 클라이언트에게 방 삭제 알림
    try {
      io.emit("room_deleted", { roomId });
    } catch (socketErr: any) {
      console.warn("[DELETE /api/rooms/:roomId] Failed to emit socket event:", socketErr.message);
      // Socket 에러는 무시하고 계속 진행
    }

    // 응답이 이미 전송되었는지 확인
    if (!res.headersSent) {
      res.status(200).json({
        message: "Room deleted successfully",
        roomId,
      });
    }
  } catch (err: any) {
    console.error("[DELETE /api/rooms/:roomId] error", err);
    console.error("[DELETE /api/rooms/:roomId] error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack,
    });
    
    // 응답이 이미 전송되었는지 확인
    if (res.headersSent) {
      console.error("[DELETE /api/rooms/:roomId] Response already sent, cannot send error response");
      return;
    }
    
    // Prisma 에러인 경우 더 구체적인 메시지 제공
    let errorMessage = "방 삭제에 실패했습니다.";
    if (err.code === 'P2003') {
      errorMessage = "방과 연결된 데이터가 있어 삭제할 수 없습니다.";
    } else if (err.code === 'P2025') {
      errorMessage = "방을 찾을 수 없습니다.";
    } else if (err.code === 'P2014') {
      errorMessage = "방과 연결된 관계가 있어 삭제할 수 없습니다.";
    } else if (err.message) {
      errorMessage = `방 삭제에 실패했습니다: ${err.message}`;
    }
    
    res.status(500).json({ message: errorMessage, error: err.message || "Internal server error" });
  }
});

/**
 * 플레이리스트 곡 신청
 * POST /api/playlists/request
 * body: { roomId, youtubeUrl, title, duration }
 */
app.post(
  "/api/playlists/request",
  async (req: Request, res: Response) => {
    try {
      const { roomId, youtubeUrl, title, duration } = req.body;

      if (!roomId || !youtubeUrl || !title || !duration) {
        return res.status(400).json({
          message: "roomId, youtubeUrl, title, duration are required",
        });
      }

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room || room.type !== "PLAYLIST") {
        return res.status(404).json({ message: "Playlist room not found" });
      }

      const userId = (req as any).userId as string;

      const lastTrack = await prisma.playlistTrack.findFirst({
        where: { roomId },
        orderBy: { orderIndex: "desc" },
      });

      const nextOrder = (lastTrack?.orderIndex ?? 0) + 1;

      const track = await prisma.playlistTrack.create({
        data: {
          roomId,
          userId,
          youtubeUrl,
          title,
          duration,
          status: "WAITING",
          orderIndex: nextOrder,
        },
      });

      // 대기열 변경 브로드캐스트 (필요 시 프론트에서 수신)
      io.to(roomId).emit("track_change", {
        roomId,
        track,
      });

      res.status(201).json(track);
    } catch (err) {
      console.error("[POST /api/playlists/request] error", err);
      res.status(500).json({ message: "Failed to request track" });
    }
  }
);

/**
 * 신청곡 목록 조회
 * GET /api/playlists/:roomId/queue
 */
app.get(
  "/api/playlists/:roomId/queue",
  async (req: Request, res: Response) => {
    try {
      const roomId = req.params.roomId;

      const tracks = await prisma.playlistTrack.findMany({
        where: { roomId },
        orderBy: { orderIndex: "asc" },
        include: {
          requester: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });

      res.json({ roomId, tracks });
    } catch (err) {
      console.error("[GET /api/playlists/:roomId/queue] error", err);
      res.status(500).json({ message: "Failed to load playlist queue" });
    }
  }
);

/**
 * 상점 아이템 조회
 * GET /api/shop/items?category=SKIN|EFFECT|EMOJI
 */
app.get("/api/shop/items", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { price: "asc" },
    });

    res.json(items);
  } catch (err) {
    console.error("[GET /api/shop/items] error", err);
    res.status(500).json({ message: "Failed to load shop items" });
  }
});

/**
 * 아이템 구매
 * POST /api/shop/buy
 * body: { itemId }
 */
app.post("/api/shop/buy", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ message: "itemId is required" });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const userId = (req as any).userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventory: {
          where: { itemId },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.inventory.length > 0) {
      return res
        .status(400)
        .json({ message: "Item already owned", code: "ALREADY_OWNED" });
    }

    if (user.beats < item.price) {
      return res
        .status(400)
        .json({ message: "Not enough beats", code: "INSUFFICIENT_BEATS" });
    }

    const [updatedUser, inventory] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { beats: { decrement: item.price } },
      }),
      prisma.inventory.create({
        data: {
          userId: user.id,
          itemId: item.id,
        },
      }),
    ]);

    res.json({
      user: {
        id: updatedUser.id,
        beats: updatedUser.beats,
      },
      inventoryItem: inventory,
    });
  } catch (err) {
    console.error("[POST /api/shop/buy] error", err);
    res.status(500).json({ message: "Failed to buy item" });
  }
});

/**
 * 내 정보 / 인벤토리 조회
 * GET /api/users/me
 */
app.get("/api/users/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventory: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[GET /api/users/me] error", err);
    res.status(500).json({ message: "Failed to load user profile" });
  }
});

/**
 * 스킨 / 효과 장착 변경
 * PATCH /api/users/me/equip
 * body: { skinItemId?, effectItemId? }
 */
app.patch(
  "/api/users/me/equip",
  async (req: Request, res: Response) => {
    try {
      const { skinItemId, effectItemId } = req.body;

      const userId = (req as any).userId as string;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data: any = {};

      if (skinItemId) {
        const skin = await prisma.item.findUnique({
          where: { id: skinItemId },
        });
        if (!skin || skin.category !== "SKIN") {
          return res
            .status(400)
            .json({ message: "Invalid skin item", code: "INVALID_SKIN" });
        }

        const owns = await prisma.inventory.findFirst({
          where: { userId: user.id, itemId: skinItemId },
        });
        if (!owns) {
          return res
            .status(400)
            .json({ message: "Skin not owned", code: "NOT_OWNED" });
        }

        data.equippedSkinId = skinItemId;
      }

      if (effectItemId) {
        const effect = await prisma.item.findUnique({
          where: { id: effectItemId },
        });
        if (!effect || effect.category !== "EFFECT") {
          return res.status(400).json({
            message: "Invalid effect item",
            code: "INVALID_EFFECT",
          });
        }

        const owns = await prisma.inventory.findFirst({
          where: { userId: user.id, itemId: effectItemId },
        });
        if (!owns) {
          return res
            .status(400)
            .json({ message: "Effect not owned", code: "NOT_OWNED" });
        }

        data.equippedEffectId = effectItemId;
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data,
        select: {
          id: true,
          nickname: true,
          beats: true,
          level: true,
          equippedSkinId: true,
          equippedEffectId: true,
        },
      });

      res.json(updated);
    } catch (err) {
      console.error("[PATCH /api/users/me/equip] error", err);
      res.status(500).json({ message: "Failed to update equipped items" });
    }
  }
);

/**
 * 로그아웃
 * POST /api/auth/logout
 *  - 현재는 서버 세션이 없으므로 단순 성공 응답만 반환
 */
app.post("/api/auth/logout", (req: Request, res: Response) => {
  res.status(204).send();
});

// ============================================
// 게임 세션 관리 시스템
// ============================================

interface GamePlayer {
  userId: string;
  socketId: string;
  nickname: string;
  score: number;
  joinedAt: Date;
  isHost: boolean;
}

interface GameSession {
  roomId: string;
  gameType: "MUSIC_QUIZ" | "DIALECT_QUIZ";
  players: Map<string, GamePlayer>; // userId -> GamePlayer
  status: "WAITING" | "COUNTDOWN" | "PLAYING" | "ROUND_RESULT" | "FINISHED";
  currentRound: number;
  totalRounds: number;
  roundStartTime?: Date;
  roundTimeLimit?: number; // seconds
  currentQuestion?: {
    questionId: string;
    correctAnswer: string;
    startedAt: Date;
  };
  answers: Map<string, { answer: string; submittedAt: Date; isCorrect: boolean }>; // userId -> answer
}

const gameSessions = new Map<string, GameSession>(); // roomId -> GameSession

// 게임 세션 가져오기 또는 생성
function getOrCreateGameSession(
  roomId: string,
  gameType: "MUSIC_QUIZ" | "DIALECT_QUIZ"
): GameSession {
  if (!gameSessions.has(roomId)) {
    const room = gameSessions.set(roomId, {
      roomId,
      gameType,
      players: new Map(),
      status: "WAITING",
      currentRound: 0,
      totalRounds: 10, // 기본값, options에서 가져올 수 있음
      answers: new Map(),
    });
  }
  return gameSessions.get(roomId)!;
}

// 플레이어 목록을 배열로 변환
function getPlayersArray(session: GameSession) {
  return Array.from(session.players.values()).map((p) => ({
    id: p.userId,
    name: p.nickname,
    isHost: p.isHost,
    score: p.score,
    joinedAt: p.joinedAt.getTime(),
  }));
}

// ============================================
// 소켓 연결 이벤트 핸들링
// ============================================

io.on("connection", (socket) => {
  console.log(`[Socket] 유저 접속됨: ${socket.id}`);

  // 소켓에 연결된 userId 저장 (인증 후 설정)
  let socketUserId: string | null = null;
  let socketRoomId: string | null = null;

  // 기본 방 입장/퇴장
  socket.on("join_room", ({ roomId }) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`[Socket] ${socket.id} joined room ${roomId}`);
  });

  socket.on("leave_room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    console.log(`[Socket] ${socket.id} left room ${roomId}`);
  });

  // 게임 방 입장 (인증 필요)
  socket.on("game_join", async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) {
        socket.emit("game_error", { message: "roomId and userId are required" });
        return;
      }

      // 유저 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true },
      });

      if (!user) {
        socket.emit("game_error", { message: "User not found" });
        return;
      }

      // 방 정보 조회
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room || !["MUSIC_QUIZ", "DIALECT_QUIZ"].includes(room.type)) {
        socket.emit("game_error", { message: "Game room not found" });
        return;
      }

      if (room.status === "PLAYING") {
        socket.emit("game_error", { message: "Game is already in progress" });
        return;
      }

      socketUserId = userId;
      socketRoomId = roomId;
      socket.join(roomId);

      const gameType = room.type as "MUSIC_QUIZ" | "DIALECT_QUIZ";
      const session = getOrCreateGameSession(roomId, gameType);

      // 이미 참가한 플레이어인지 확인
      if (session.players.has(userId)) {
        // 재접속: 소켓 ID만 업데이트
        session.players.get(userId)!.socketId = socket.id;
      } else {
        // 새 플레이어 추가
        const isHost = room.hostId === userId;
        const player: GamePlayer = {
          userId: user.id,
          socketId: socket.id,
          nickname: user.nickname,
          score: 0,
          joinedAt: new Date(),
          isHost,
        };
        session.players.set(userId, player);
      }

      // 방 상태 업데이트
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "WAITING" },
      });

      // 모든 플레이어에게 업데이트된 플레이어 목록 전송
      io.to(roomId).emit("game_players_update", {
        roomId,
        players: getPlayersArray(session),
        sessionStatus: session.status,
      });

      console.log(`[Game] ${user.nickname} joined game room ${roomId}`);
    } catch (error) {
      console.error("[game_join] error", error);
      socket.emit("game_error", { message: "Failed to join game" });
    }
  });

  // 게임 방 퇴장
  socket.on("game_leave", async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;

      const session = gameSessions.get(roomId);
      if (session && session.players.has(userId)) {
        session.players.delete(userId);

        // 방장이 나간 경우 방 상태 업데이트
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (room && room.hostId === userId && session.players.size > 0) {
          // 새 방장 지정 (첫 번째 플레이어)
          const newHost = Array.from(session.players.values())[0];
          await prisma.room.update({
            where: { id: roomId },
            data: { hostId: newHost.userId },
          });
          newHost.isHost = true;
        }

        // 플레이어가 없으면 세션 삭제
        if (session.players.size === 0) {
          gameSessions.delete(roomId);
          await prisma.room.update({
            where: { id: roomId },
            data: { status: "WAITING" },
          });
        } else {
          // 남은 플레이어들에게 업데이트 전송
          io.to(roomId).emit("game_players_update", {
            roomId,
            players: getPlayersArray(session),
            sessionStatus: session.status,
          });
        }

        socket.leave(roomId);
        console.log(`[Game] User ${userId} left game room ${roomId}`);
      }
    } catch (error) {
      console.error("[game_leave] error", error);
    }
  });

  // 게임 시작 (방장만 가능)
  socket.on("game_start", async ({ roomId, userId, options }) => {
    try {
      if (!roomId || !userId) {
        socket.emit("game_error", { message: "roomId and userId are required" });
        return;
      }

      const session = gameSessions.get(roomId);
      if (!session) {
        socket.emit("game_error", { message: "Game session not found" });
        return;
      }

      const player = session.players.get(userId);
      if (!player || !player.isHost) {
        socket.emit("game_error", { message: "Only host can start the game" });
        return;
      }

      if (session.players.size < 1) {
        socket.emit("game_error", { message: "Need at least 1 player" });
        return;
      }

      // 게임 설정 적용
      if (options) {
        if (options.totalRounds) session.totalRounds = options.totalRounds;
        if (options.roundTimeLimit) session.roundTimeLimit = options.roundTimeLimit;
      }

      // 방 상태 업데이트
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "PLAYING" },
      });

      session.status = "COUNTDOWN";
      session.currentRound = 0;

      // 카운트다운 시작
      io.to(roomId).emit("game_countdown_start", {
        roomId,
        countdown: 3,
      });

      // 3초 후 게임 시작
      setTimeout(() => {
        if (gameSessions.has(roomId)) {
          startNextRound(roomId);
        }
      }, 3000);

      console.log(`[Game] Game started in room ${roomId}`);
    } catch (error) {
      console.error("[game_start] error", error);
      socket.emit("game_error", { message: "Failed to start game" });
    }
  });

  // 정답 제출
  socket.on("game_submit_answer", async ({ roomId, userId, answer }) => {
    try {
      if (!roomId || !userId || !answer) {
        socket.emit("game_error", { message: "roomId, userId, and answer are required" });
        return;
      }

      const session = gameSessions.get(roomId);
      if (!session) {
        socket.emit("game_error", { message: "Game session not found" });
        return;
      }

      if (session.status !== "PLAYING") {
        socket.emit("game_error", { message: "Game is not in progress" });
        return;
      }

      if (!session.currentQuestion) {
        socket.emit("game_error", { message: "No active question" });
        return;
      }

      // 이미 답변을 제출했는지 확인
      if (session.answers.has(userId)) {
        socket.emit("game_error", { message: "Answer already submitted" });
        return;
      }

      // 정답 확인 (간단한 문자열 비교, 나중에 정규화/유사도 검사 추가 가능)
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedCorrect = session.currentQuestion.correctAnswer.trim().toLowerCase();
      const isCorrect = normalizedAnswer === normalizedCorrect;

      // 답변 저장
      session.answers.set(userId, {
        answer,
        submittedAt: new Date(),
        isCorrect,
      });

      // 점수 업데이트 (정답이면 점수 추가)
      if (isCorrect) {
        const player = session.players.get(userId);
        if (player) {
          // 빠르게 답변할수록 더 많은 점수 (예: 10초 내면 100점, 그 이후는 감소)
          const timeElapsed =
            (new Date().getTime() - session.currentQuestion.startedAt.getTime()) / 1000;
          const baseScore = 100;
          const timeBonus = Math.max(0, Math.floor((30 - timeElapsed) * 2)); // 최대 60점 보너스
          const scoreGained = baseScore + timeBonus;

          player.score += scoreGained;

          // 정답자에게 즉시 알림
          socket.emit("game_answer_correct", {
            roomId,
            scoreGained,
            totalScore: player.score,
          });
        }
      }

      // 모든 플레이어에게 답변 제출 상태 업데이트
      const submittedCount = session.answers.size;
      const totalPlayers = session.players.size;

      io.to(roomId).emit("game_answer_update", {
        roomId,
        submittedCount,
        totalPlayers,
        userId,
        hasAnswered: true,
      });

      // 모든 플레이어가 답변했거나 시간이 지나면 라운드 종료
      if (submittedCount >= totalPlayers) {
        setTimeout(() => {
          endRound(roomId);
        }, 1000);
      }

      console.log(`[Game] Answer submitted by ${userId} in room ${roomId}: ${isCorrect ? "CORRECT" : "WRONG"}`);
    } catch (error) {
      console.error("[game_submit_answer] error", error);
      socket.emit("game_error", { message: "Failed to submit answer" });
    }
  });

  // 게임 상태 요청
  socket.on("game_get_state", ({ roomId }) => {
    const session = gameSessions.get(roomId);
    if (session) {
      socket.emit("game_state", {
        roomId,
        players: getPlayersArray(session),
        status: session.status,
        currentRound: session.currentRound,
        totalRounds: session.totalRounds,
        currentQuestion: session.currentQuestion,
      });
    }
  });

  // (공통) 채팅 보내기
  socket.on("send_chat", ({ roomId, userId, message }) => {
    if (!roomId || !message) return;

    const payload = {
      roomId,
      userId: userId ?? null,
      message,
      createdAt: new Date().toISOString(),
    };

    io.to(roomId).emit("receive_chat", payload);
  });

  // 연결 해제 처리
  socket.on("disconnect", async () => {
    console.log(`[Socket] 유저 접속 해제: ${socket.id}`);

    // 게임 방에서 플레이어 제거
    if (socketUserId && socketRoomId) {
      const session = gameSessions.get(socketRoomId);
      if (session && session.players.has(socketUserId)) {
        session.players.delete(socketUserId);

        // 플레이어가 없으면 세션 삭제
        if (session.players.size === 0) {
          gameSessions.delete(socketRoomId);
          await prisma.room.update({
            where: { id: socketRoomId },
            data: { status: "WAITING" },
          });
        } else {
          // 남은 플레이어들에게 업데이트 전송
          io.to(socketRoomId).emit("game_players_update", {
            roomId: socketRoomId,
            players: getPlayersArray(session),
            sessionStatus: session.status,
          });
        }
      }
    }
  });
});

// ============================================
// 게임 로직 헬퍼 함수
// ============================================

// 다음 라운드 시작
async function startNextRound(roomId: string) {
  const session = gameSessions.get(roomId);
  if (!session) return;

  session.currentRound++;
  session.answers.clear();

  // 게임 종료 확인
  if (session.currentRound > session.totalRounds) {
    await endGame(roomId);
    return;
  }

  session.status = "PLAYING";

  // TODO: 실제 게임에서는 여기서 문제를 가져와야 함
  // 현재는 더미 데이터 사용
  const dummyQuestions = {
    MUSIC_QUIZ: [
      { questionId: "q1", correctAnswer: "아틀란티스 소녀" },
      { questionId: "q2", correctAnswer: "Gee" },
      { questionId: "q3", correctAnswer: "벚꽃 엔딩" },
    ],
    DIALECT_QUIZ: [
      { questionId: "q1", correctAnswer: "고맙습니다" },
      { questionId: "q2", correctAnswer: "안녕하세요" },
      { questionId: "q3", correctAnswer: "사랑해" },
    ],
  };

  const questions = dummyQuestions[session.gameType];
  const questionIndex = (session.currentRound - 1) % questions.length;
  const question = questions[questionIndex];

  session.currentQuestion = {
    questionId: question.questionId,
    correctAnswer: question.correctAnswer,
    startedAt: new Date(),
  };

  // 라운드 시작 알림
  io.to(roomId).emit("game_round_start", {
    roomId,
    round: session.currentRound,
    totalRounds: session.totalRounds,
    question: {
      questionId: question.questionId,
      // 실제 구현에서는 음악 URL이나 문제 텍스트를 포함
    },
    timeLimit: session.roundTimeLimit || 30,
  });

  // 시간 제한이 있으면 타이머 시작
  if (session.roundTimeLimit) {
    setTimeout(() => {
      if (gameSessions.has(roomId)) {
        const currentSession = gameSessions.get(roomId)!;
        if (
          currentSession.currentRound === session.currentRound &&
          currentSession.status === "PLAYING"
        ) {
          endRound(roomId);
        }
      }
    }, session.roundTimeLimit * 1000);
  }

  console.log(`[Game] Round ${session.currentRound} started in room ${roomId}`);
}

// 라운드 종료
async function endRound(roomId: string) {
  const session = gameSessions.get(roomId);
  if (!session) return;

  session.status = "ROUND_RESULT";

  // 결과 정리
  const results: Array<{
    userId: string;
    nickname: string;
    answer: string | null;
    isCorrect: boolean;
    score: number;
  }> = Array.from(session.answers.entries()).map(([userId, answerData]) => {
    const player = session.players.get(userId);
    return {
      userId,
      nickname: player?.nickname || "Unknown",
      answer: answerData.answer,
      isCorrect: answerData.isCorrect,
      score: player?.score || 0,
    };
  });

  // 정답을 맞추지 못한 플레이어들도 결과에 포함
  for (const [userId, player] of session.players.entries()) {
    if (!session.answers.has(userId)) {
      results.push({
        userId,
        nickname: player.nickname,
        answer: null,
        isCorrect: false,
        score: player.score,
      });
    }
  }

  // 점수 순으로 정렬
  results.sort((a, b) => b.score - a.score);

  // 라운드 결과 전송
  io.to(roomId).emit("game_round_result", {
    roomId,
    round: session.currentRound,
    correctAnswer: session.currentQuestion?.correctAnswer,
    results,
    leaderboard: results.map((r, idx) => ({
      rank: idx + 1,
      userId: r.userId,
      nickname: r.nickname,
      score: r.score,
    })),
  });

  // 3초 후 다음 라운드 시작
  setTimeout(() => {
    if (gameSessions.has(roomId)) {
      startNextRound(roomId);
    }
  }, 3000);

  console.log(`[Game] Round ${session.currentRound} ended in room ${roomId}`);
}

// 게임 종료
async function endGame(roomId: string) {
  const session = gameSessions.get(roomId);
  if (!session) return;

  session.status = "FINISHED";

  // 최종 결과 정리
  const finalResults = Array.from(session.players.values())
    .map((player) => ({
      userId: player.userId,
      nickname: player.nickname,
      score: player.score,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, idx) => ({
      ...r,
      rank: idx + 1,
    }));

  // 게임 히스토리 저장
  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (room) {
      const gameHistory = await prisma.gameHistory.create({
        data: {
          roomId,
          gameType: session.gameType,
        },
      });

      // 각 플레이어의 결과 저장
      await Promise.all(
        finalResults.map((result, index) =>
          prisma.gameResult.create({
            data: {
              gameHistoryId: gameHistory.id,
              userId: result.userId,
              rank: result.rank,
              score: result.score,
              rewardBeats: Math.floor(result.score / 10), // 점수의 10%를 비트로 보상
            },
          })
        )
      );

      // 플레이어들에게 비트 지급
      for (const result of finalResults) {
        const rewardBeats = Math.floor(result.score / 10);
        await prisma.user.update({
          where: { id: result.userId },
          data: { beats: { increment: rewardBeats } },
        });
      }
    }
  } catch (error) {
    console.error("[endGame] Failed to save game history", error);
  }

  // 최종 결과 전송
  io.to(roomId).emit("game_finished", {
    roomId,
    results: finalResults,
  });

  // 방 상태 업데이트
  await prisma.room.update({
    where: { id: roomId },
    data: { status: "WAITING" },
  });

  // 세션 정리 (선택사항: 결과 확인을 위해 잠시 유지할 수도 있음)
  setTimeout(() => {
    gameSessions.delete(roomId);
  }, 60000); // 1분 후 세션 삭제

  console.log(`[Game] Game finished in room ${roomId}`);
}

httpServer.listen(port, () => {
  console.log(`> 🚀 Backend Server ready at http://localhost:${port}`);
});