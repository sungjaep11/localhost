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
 * 로그인 (유저 생성/조회)
 * POST /api/auth/login
 * Body: { nickname?: string }
 * Returns: { userId, nickname }
 */
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body as { nickname?: string };
    const name = (typeof nickname === "string" && nickname.trim()) || "Guest";

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

    res.json({ userId: user.id, nickname: user.nickname });
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
      const myResult = history.results.find((r) => r.userId === userId);

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

// 소켓 연결 이벤트 핸들링
io.on("connection", (socket) => {
  console.log(`[Socket] 유저 접속됨: ${socket.id}`);

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

  socket.on("disconnect", () => {
    console.log(`[Socket] 유저 접속 해제: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`> 🚀 Backend Server ready at http://localhost:${port}`);
});