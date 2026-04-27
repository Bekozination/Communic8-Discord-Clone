import type { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@comunic8/shared";
import { verifyAccessToken } from "../lib/jwt";
import { UserPresence } from "../lib/redis";
import { db } from "../db/index";
import { messages, channels, serverMembers, users } from "../db/schema/index";
import { eq } from "drizzle-orm";

const TYPING_TIMEOUT = 5000;
const typingTimers = new Map<string, NodeJS.Timeout>();

let globalIo: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function getIO() {
  if (!globalIo) throw new Error("Socket.io henüz başlatılmadı");
  return globalIo;
}

export function initSocketHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
): void {
  globalIo = io as unknown as SocketIOServer<any, any>;

  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Token gerekli"));

    try {
      const payload = await verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error("Geçersiz token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, username } = socket.data;
    console.log(`[Socket] Kullanıcı bağlandı: ${username} (${socket.id})`);

    await socket.join(`user:${userId}`);
    await UserPresence.setOnline(userId, socket.id);
    await db.update(users).set({ status: "online" }).where(eq(users.id, userId));
    await broadcastPresenceUpdate(io, userId, "online");

    // KANAL OLAYLARI
    socket.on("channel:join", (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on("channel:leave", (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // MESAJ OLAYLARI
    socket.on(
      "message:send",
      async ({ channelId, content, replyToId, nonce }) => {
        const channel = await db.query.channels.findFirst({
          where: eq(channels.id, channelId),
          with: {
            server: {
              with: {
                members: { where: eq(serverMembers.userId, userId) },
              },
            },
          },
        });

        if (!channel || channel.server.members.length === 0) {
          socket.emit("error", {
            code: "FORBIDDEN",
            message: "Bu kanala mesaj gönderme yetkiniz yok",
          });
          return;
        }

        const [message] = await db
          .insert(messages)
          .values({
            channelId,
            authorId: userId,
            content: content.slice(0, 4000),
            replyToId,
          })
          .returning();

        const author = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        });

        io.to(`channel:${channelId}`).emit("message:new", {
          ...message,
          author: author!,
          nonce,
        });
      },
    );

    // YAZMA GÖSTERGESİ
    socket.on("typing:start", (channelId) => {
      const key = `${channelId}:${userId}`;
      const existing = typingTimers.get(key);
      if (existing) clearTimeout(existing);

      socket.to(`channel:${channelId}`).emit("typing:update", {
        channelId,
        userId,
        username,
        isTyping: true,
      });

      const timer = setTimeout(() => {
        socket.to(`channel:${channelId}`).emit("typing:update", {
          channelId,
          userId,
          username,
          isTyping: false,
        });
        typingTimers.delete(key);
      }, TYPING_TIMEOUT);

      typingTimers.set(key, timer);
    });

    socket.on("typing:stop", (channelId) => {
      const key = `${channelId}:${userId}`;
      const existing = typingTimers.get(key);
      if (existing) {
        clearTimeout(existing);
        typingTimers.delete(key);
      }

      socket.to(`channel:${channelId}`).emit("typing:update", {
        channelId,
        userId,
        username,
        isTyping: false,
      });
    });

    // SES KANALI SİNYALLEŞME
    socket.on("voice:join", (channelId) => {
      socket.join(`voice:${channelId}`);
      socket
        .to(`voice:${channelId}`)
        .emit("voice:user_joined", { userId, channelId });
    });

    socket.on("voice:leave", (channelId) => {
      socket.leave(`voice:${channelId}`);
      socket
        .to(`voice:${channelId}`)
        .emit("voice:user_left", { userId, channelId });
    });

    socket.on("voice:signal", ({ to, signal }) => {
      io.to(`user:${to}`).emit("voice:signal", { from: userId, signal });
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] Kullanıcı ayrıldı: ${username}`);
      await UserPresence.setOffline(userId);
      await db.update(users).set({ status: "offline" }).where(eq(users.id, userId));
      await broadcastPresenceUpdate(io, userId, "offline");
    });
  });
}

async function broadcastPresenceUpdate(
  io: SocketIOServer,
  userId: string,
  status: string,
): Promise<void> {
  const memberships = await db.query.serverMembers.findMany({
    where: eq(serverMembers.userId, userId),
    columns: { serverId: true },
  });

  for (const { serverId } of memberships) {
    io.to(`server:${serverId}`).emit("presence:update", { userId, status });
  }

  // Arkadaşlara da gönder
  const userFriends = await db.query.friends.findMany({
    where: (f, { eq, or }) => or(eq(f.user1Id, userId), eq(f.user2Id, userId)),
  });

  for (const f of userFriends) {
    if (f.status === "accepted") {
      const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
      io.to(`user:${friendId}`).emit("presence:update", { userId, status });
    }
  }
}
