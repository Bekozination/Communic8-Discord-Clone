import { create } from "zustand";

interface UIState {
  isMemberListOpen: boolean;
  isCreateServerOpen: boolean;
  isJoinServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isServerSettingsOpen: boolean;
  isUserSettingsOpen: boolean;
  activeDMId: string | null;

  toggleMemberList: () => void;
  setCreateServerOpen: (open: boolean) => void;
  setJoinServerOpen: (open: boolean) => void;
  setCreateChannelOpen: (open: boolean) => void;
  setServerSettingsOpen: (open: boolean) => void;
  toggleUserSettings: () => void;
  setActiveDMId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMemberListOpen: true,
  isCreateServerOpen: false,
  isJoinServerOpen: false,
  isCreateChannelOpen: false,
  isServerSettingsOpen: false,
  isUserSettingsOpen: false,
  activeDMId: null,

  toggleMemberList: () =>
    set((s) => ({ isMemberListOpen: !s.isMemberListOpen })),
  setCreateServerOpen: (open) => set({ isCreateServerOpen: open }),
  setJoinServerOpen: (open) => set({ isJoinServerOpen: open }),
  setCreateChannelOpen: (open) => set({ isCreateChannelOpen: open }),
  setServerSettingsOpen: (open) => set({ isServerSettingsOpen: open }),
  toggleUserSettings: () => set((s) => ({ isUserSettingsOpen: !s.isUserSettingsOpen })),
  setActiveDMId: (id) => set({ activeDMId: id }),
}));
