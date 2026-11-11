import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { WhatsAppSessionManager, InboundMessageEvent } from "@giniespace/whatsapp-engine";
import { IDatabase } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

export function setupSocketServer(
  httpServer: HttpServer,
  jwtSecret: string,
  corsOrigin: string,
  waManager: WhatsAppSessionManager,
  db: IDatabase
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user: AuthenticatedUser = socket.data.user;
    const room = `user:${user.id}`;
    socket.join(room);

    // Send immediate WhatsApp connection state upon connecting
    const waState = waManager.getSessionState(user.id);
    socket.emit("whatsapp:status", waState);

    socket.on("disconnect", () => {
      socket.leave(room);
    });
  });

  // Relay WhatsApp Events to User Room in Real-Time
  waManager.on("qr", ({ userId, qrCode }) => {
    io.to(`user:${userId}`).emit("whatsapp:qr", { qrCode });
  });

  waManager.on("status", (data) => {
    io.to(`user:${data.userId}`).emit("whatsapp:status", data);
  });

  waManager.on("message", async (event: InboundMessageEvent) => {
    io.to(`user:${event.userId}`).emit("whatsapp:message", event);

    // Auto-discover or log customer
    try {
      const cleanPhone = event.senderJid.replace(/[^0-9]/g, "");
      const existing = await db.customers.findOne({
        userId: event.userId,
        phone: cleanPhone,
      });

      if (!existing && event.senderName) {
        await db.customers.create({
          userId: event.userId,
          name: event.senderName,
          phone: cleanPhone,
          notes: "First contacted via WhatsApp",
          tags: "WhatsApp",
        });
      }
    } catch {
      // Background logging failsafe
    }
  });

  return io;
}