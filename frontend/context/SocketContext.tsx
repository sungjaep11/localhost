"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 백엔드 서버 URL (환경변수 또는 기본값)
    // AWS EC2의 경우 NEXT_PUBLIC_BACKEND_URL을 설정해야 함
    // 예: NEXT_PUBLIC_BACKEND_URL=http://your-ec2-ip:3001
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`);
    
    const socketInstance = io(backendUrl, {
      path: "/socket.io", // 기본 경로
      transports: ["websocket"], // 성능 위해 웹소켓 강제
    });

    socketInstance.on("connect", () => {
      console.log("✅ 소켓 연결 성공:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ 소켓 연결 끊김");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};