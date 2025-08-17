import { io, Socket } from "socket.io-client";

export function connectSocket(token: string) {
  const url = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const s: Socket = io(url, {
    auth: { token },
    autoConnect: true,
    transports: ["websocket"],
  });
  return s;
}
