import { io, type Socket } from "socket.io-client";

interface ServerToClientEvents {
  "message:new": (message: Record<string, unknown>) => void;
  "message:update": (payload: Record<string, unknown>) => void;
  "message:delete": (payload: Record<string, unknown>) => void;
  "typing:update": (payload: Record<string, unknown>) => void;
  "presence:update": (payload: Record<string, unknown>) => void;
  "voice:signal": (payload: Record<string, unknown>) => void;
  "voice:user_joined": (payload: Record<string, unknown>) => void;
  "voice:user_left": (payload: Record<string, unknown>) => void;
  error: (payload: { code: string; message: string }) => void;
}

interface ClientToServerEvents {
  "channel:join": (channelId: string) => void;
  "channel:leave": (channelId: string) => void;
  "message:send": (payload: {
    channelId: string;
    content: string;
    replyToId?: string;
    nonce: string;
  }) => void;
  "typing:start": (channelId: string) => void;
  "typing:stop": (channelId: string) => void;
  "voice:join": (channelId: string) => void;
  "voice:leave": (channelId: string) => void;
  "voice:signal": (payload: {
    to: string;
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  }) => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function connectSocket(
  token: string,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_WS_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("[Socket] Bağlandı:", socket?.id));
  socket.on("disconnect", (reason) =>
    console.log("[Socket] Bağlantı kesildi:", reason),
  );
  socket.on("connect_error", (err) =>
    console.error("[Socket] Bağlantı hatası:", err),
  );

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null {
  return socket;
}
