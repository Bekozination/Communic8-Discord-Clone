import type { MessageWithAuthor } from "./models.types";

// Client → Server events
export interface ClientToServerEvents {
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

// Server → Client events
export interface ServerToClientEvents {
  "message:new": (message: MessageWithAuthor & { nonce?: string }) => void;
  "message:update": (payload: {
    id: string;
    content: string;
    editedAt: string;
  }) => void;
  "message:delete": (payload: { id: string; channelId: string }) => void;
  "typing:update": (payload: {
    channelId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  }) => void;
  "presence:update": (payload: { userId: string; status: string }) => void;
  "voice:signal": (payload: {
    from: string;
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  }) => void;
  "voice:user_joined": (payload: {
    userId: string;
    channelId: string;
  }) => void;
  "voice:user_left": (payload: {
    userId: string;
    channelId: string;
  }) => void;
  error: (payload: { code: string; message: string }) => void;
}
