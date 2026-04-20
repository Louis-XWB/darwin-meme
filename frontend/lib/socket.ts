import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      // Start with polling, upgrade to websocket when handshake finishes.
      // Some edge networks (Railway nginx, corporate proxies) don't allow raw
      // WebSocket handshakes — polling ensures the connection always succeeds.
      transports: ["polling", "websocket"],
      upgrade: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socket;
}
