import { create } from "zustand";

interface Server {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  isPublic: boolean;
  inviteCode: string | null;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Channel {
  id: string;
  serverId: string;
  categoryId: string | null;
  name: string;
  type: string;
  topic: string | null;
  position: number;
}

interface Category {
  id: string;
  serverId: string;
  name: string;
  position: number;
}

interface Member {
  id: string;
  serverId: string;
  userId: string;
  nickname: string | null;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
}

interface ServerState {
  servers: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;
  channels: Channel[];
  categories: Category[];
  members: Member[];

  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  setActiveServer: (serverId: string) => void;
  setActiveChannel: (channelId: string) => void;
  setChannels: (channels: Channel[]) => void;
  setCategories: (categories: Category[]) => void;
  setMembers: (members: Member[]) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  activeChannelId: null,
  channels: [],
  categories: [],
  members: [],

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((s) => ({ servers: [...s.servers, server] })),
  setActiveServer: (serverId) => set({ activeServerId: serverId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  setChannels: (channels) => set({ channels }),
  setCategories: (categories) => set({ categories }),
  setMembers: (members) => set({ members }),
}));
