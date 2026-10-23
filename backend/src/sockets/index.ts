import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAuthToken } from "../utils/jwt";
import { env } from "../config/env";

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  // Authenticate socket connections with the same JWT used for the REST API
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyAuthToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    // Each driver gets a private room so alerts only reach their own dashboard
    socket.join(`driver:${userId}`);
    console.log(`[socket] Driver ${userId} connected (${socket.id})`);

    socket.on("disconnect", () => {
      console.log(`[socket] Driver ${userId} disconnected (${socket.id})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized — call initSocket() first");
  return io;
}

/** Emit a real-time event to a specific driver's dashboard session(s). */
export function emitToDriver(driverId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`driver:${driverId}`).emit(event, payload);
}
