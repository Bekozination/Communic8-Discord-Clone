import { useEffect } from "react";
import { ServerSidebar } from "./ServerSidebar";
import { ChannelSidebar } from "./ChannelSidebar";
import { MainContent } from "./MainContent";
import { MemberList } from "./MemberList";
import { CreateServerModal } from "../server/CreateServerModal";
import { JoinServerModal } from "../server/JoinServerModal";
import { useServerStore } from "../../stores/server.store";
import { useUIStore } from "../../stores/ui.store";
import { useAuthStore } from "../../stores/auth.store";
import { useFriendStore } from "../../stores/friend.store";
import { getSocket, connectSocket } from "../../lib/socket";
import { DMSidebar } from "./DMSidebar";
import { FriendsPage } from "../friends/FriendsPage";
import { DMContent } from "./DMContent";
import { UserSettingsModal } from "./UserSettingsModal";
import { ServerSettingsModal } from "../server/ServerSettingsModal";
import { CreateChannelModal } from "../server/CreateChannelModal";
import { VoiceContent } from "./VoiceContent";

export function AppLayout() {
  const { activeServerId, activeChannelId, channels } = useServerStore();
  const { activeDMId } = useUIStore();
  const { accessToken } = useAuthStore();
  const { updateFriendStatus } = useFriendStore();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket() || connectSocket(accessToken);
    
    const handlePresence = ({ userId, status }: { userId: string, status: string }) => {
      updateFriendStatus(userId, status);
      // Sunucu üyeleri için UI store vs gerekiyorsa buraya eklenebilir
    };

    socket.on("presence:update", handlePresence);

    return () => {
      socket.off("presence:update", handlePresence);
    };
  }, [accessToken, updateFriendStatus]);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <>
      <div className="flex h-screen bg-surface-700 overflow-hidden">
        <ServerSidebar />
        {activeServerId ? (
          <>
            <ChannelSidebar />
            <div className="flex flex-1 overflow-hidden">
              {activeChannel?.type === "voice" ? <VoiceContent /> : <MainContent />}
              {activeChannel?.type !== "voice" && <MemberList />}
            </div>
          </>
        ) : (
          <>
            <DMSidebar />
            <div className="flex flex-1 overflow-hidden">
              {activeDMId ? <DMContent /> : <FriendsPage />}
            </div>
          </>
        )}
      </div>
      <CreateServerModal />
      <JoinServerModal />
      <UserSettingsModal />
      <ServerSettingsModal />
      <CreateChannelModal />
    </>
  );
}
