import { create } from "zustand";

interface VoiceState {
  activeVoiceChannelId: string | null;
  connectedUsers: string[];
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isMuted: boolean;
  isDeafened: boolean;

  setActiveVoiceChannel: (id: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  addConnectedUser: (userId: string) => void;
  removeConnectedUser: (userId: string) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  clearVoice: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  activeVoiceChannelId: null,
  connectedUsers: [],
  localStream: null,
  remoteStreams: {},
  isMuted: false,
  isDeafened: false,

  setActiveVoiceChannel: (id) => set({ activeVoiceChannelId: id }),
  setLocalStream: (stream) => set({ localStream: stream }),
  
  addRemoteStream: (userId, stream) => 
    set((state) => ({ 
      remoteStreams: { ...state.remoteStreams, [userId]: stream } 
    })),
    
  removeRemoteStream: (userId) => 
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      delete newStreams[userId];
      return { remoteStreams: newStreams };
    }),

  addConnectedUser: (userId) =>
    set((state) => ({
      connectedUsers: state.connectedUsers.includes(userId) 
        ? state.connectedUsers 
        : [...state.connectedUsers, userId]
    })),

  removeConnectedUser: (userId) =>
    set((state) => ({
      connectedUsers: state.connectedUsers.filter(id => id !== userId)
    })),

  toggleMute: () => set((state) => {
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = state.isMuted; // if it was muted, we enable it
      });
    }
    return { isMuted: !state.isMuted };
  }),

  toggleDeafen: () => set((state) => ({ isDeafened: !state.isDeafened })),

  clearVoice: () => set({
    activeVoiceChannelId: null,
    connectedUsers: [],
    localStream: null,
    remoteStreams: {},
  })
}));
