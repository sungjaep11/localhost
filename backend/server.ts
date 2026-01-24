// backend/server.ts
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend API Server" });
});

// HTTP 서버 생성
const httpServer = createServer(app);

// Socket.io 서버 생성 및 설정
const io = new Server(httpServer, {
  cors: {
    origin: "*", // 개발 중에는 모든 출처 허용
    methods: ["GET", "POST"],
  },
});

// 소켓 연결 이벤트 핸들링
io.on("connection", (socket) => {
  console.log(`[Socket] 유저 접속됨: ${socket.id}`);

  // 접속한 유저에게 환영 메시지 전송 (테스트용)
  socket.emit("welcome", { message: "소켓 서버에 오신 것을 환영합니다!" });

  socket.on("disconnect", () => {
    console.log(`[Socket] 유저 접속 해제: ${socket.id}`);
  });

  // 여기에 게임 로직을 추가할 예정입니다.
});

httpServer.listen(port, () => {
  console.log(`> 🚀 Backend Server ready at http://localhost:${port}`);
});