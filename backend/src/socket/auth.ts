import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devboard-secret";

export function socketAuth(socket: Socket, next: (err?: any) => void) {
  const token =
    socket.handshake.auth?.token ||
    (typeof socket.handshake.headers.authorization === "string"
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined);

  if (!token) return next(new Error("missing token"));

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    (socket.data as any).user = { id: payload.id, email: payload.email };
    return next();
  } catch {
    return next(new Error("invalid token"));
  }
}
