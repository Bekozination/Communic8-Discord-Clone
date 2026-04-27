import { create } from "zustand";
import api from "../lib/api";

export interface Friend {
  id: string;
  friend: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
  type: "friend" | "incoming_request" | "outgoing_request";
  createdAt: string;
}

interface FriendState {
  friends: Friend[];
  loading: boolean;
  fetchFriends: () => Promise<void>;
  sendRequest: (username: string) => Promise<void>;
  acceptRequest: (id: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  updateFriendStatus: (userId: string, status: string) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  loading: false,
  
  fetchFriends: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/api/friends");
      set({ friends: res.data });
    } catch (err) {
      console.error("Arkadaş listesi alınamadı", err);
    } finally {
      set({ loading: false });
    }
  },

  sendRequest: async (username: string) => {
    await api.post("/api/friends/request", { username });
    await get().fetchFriends();
  },

  acceptRequest: async (id: string) => {
    await api.post(`/api/friends/accept/${id}`);
    await get().fetchFriends();
  },

  removeFriend: async (id: string) => {
    await api.delete(`/api/friends/${id}`);
    await get().fetchFriends();
  },

  updateFriendStatus: (userId: string, status: string) => {
    set((state) => ({
      friends: state.friends.map((f) => {
        if (f.friend.id === userId) {
          return { ...f, friend: { ...f.friend, status } };
        }
        return f;
      })
    }));
  }
}));
