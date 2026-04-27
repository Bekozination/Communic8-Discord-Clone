import { useEffect } from "react";
import { useState } from "react";
import { Hash, Volume2, ChevronDown, UserPlus, Copy, Check, Settings, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { useServerStore } from "../../stores/server.store";
import { useAuthStore } from "../../stores/auth.store";
import api from "../../lib/api";
import { useUIStore } from "../../stores/ui.store";

export function ChannelSidebar() {
  const {
    activeServerId,
    activeChannelId,
    setActiveChannel,
    channels,
    categories,
    setChannels,
    setCategories,
    setMembers,
    servers,
  } = useServerStore();
  const { user } = useAuthStore();

  const activeServer = servers.find((s) => s.id === activeServerId);

  useEffect(() => {
    if (!activeServerId) return;
    api
      .get(`/api/servers/${activeServerId}`)
      .then((res) => {
        if (res.data) {
          setChannels(res.data.channels || []);
          setCategories(res.data.categories || []);
          setMembers(res.data.members || []);
          if (!activeChannelId && res.data.channels?.length > 0) {
            const firstText = res.data.channels.find(
              (ch: { type: string }) => ch.type === "text",
            );
            if (firstText) setActiveChannel(firstText.id);
          }
        }
      })
      .catch(console.error);
  }, [activeServerId]);

  if (!activeServerId) {
    return (
      <div className="w-60 bg-surface-600 flex flex-col">
        <div className="h-12 border-b border-surface-800 flex items-center px-4">
          <span className="text-text-primary font-semibold">Comunic8</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-text-muted text-sm text-center">
            Bir sunucu seçin veya yeni bir sunucu oluşturun
          </p>
        </div>
        <UserPanel />
      </div>
    );
  }

  const uncategorized = channels.filter((ch) => !ch.categoryId);
  const categorized = categories.map((cat) => ({
    ...cat,
    channels: channels.filter((ch) => ch.categoryId === cat.id),
  }));

  return (
    <div className="w-60 bg-surface-600 flex flex-col">
      <ServerHeader server={activeServer} />

      <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {uncategorized.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isActive={activeChannelId === channel.id}
            onClick={() => setActiveChannel(channel.id)}
          />
        ))}

        {categorized.map((cat) => (
          <div key={cat.id} className="mt-4 first:mt-0">
            <div className="flex items-center justify-between px-1 mb-1 group/cat">
              <button className="flex items-center gap-1 group flex-1">
                <ChevronDown size={10} className="text-text-muted group-hover:text-text-secondary transition-colors" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">
                  {cat.name}
                </span>
              </button>
              {activeServer?.ownerId === useAuthStore.getState().user?.id && (
                <button 
                  onClick={() => useUIStore.getState().setCreateChannelOpen(true)}
                  className="text-text-muted hover:text-text-primary opacity-0 group-hover/cat:opacity-100 transition-all p-0.5"
                  title="Kanal Oluştur"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            {cat.channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => setActiveChannel(channel.id)}
              />
            ))}
          </div>
        ))}
      </div>

      <UserPanel />
    </div>
  );
}

function ServerHeader({ server }: { server: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(server?.inviteCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 border-b border-surface-800/50 flex items-center justify-between px-4 hover:bg-surface-500/50 cursor-pointer transition-colors"
      >
        <span className="text-text-primary font-semibold text-[15px] truncate">
          {server?.name}
        </span>
        <ChevronDown size={18} className={cn("text-text-muted flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-14 left-2 right-2 bg-surface-800 border border-surface-900 rounded-md shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1.5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Davet Kodu</span>
            <div className="flex items-center gap-2 bg-surface-900 p-2 rounded text-sm text-text-primary font-mono">
              <span className="flex-1 select-all">{server?.inviteCode || "Kod yok"}</span>
              <button 
                onClick={handleCopy}
                className="text-text-muted hover:text-white transition-colors"
                title="Kodu Kopyala"
              >
                {copied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
              </button>
            </div>
            
            <p className="text-[10px] text-text-muted mt-1 leading-tight">
              Arkadaşlarınızı davet etmek için bu kodu paylaşın.
            </p>
            
            {server?.ownerId === useAuthStore.getState().user?.id && (
              <>
                <div className="h-px bg-surface-900 my-1" />
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    useUIStore.getState().setServerSettingsOpen(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-brand-primary text-text-primary text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Settings size={14} /> Sunucu Ayarları
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: { id: string; name: string; type: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 w-full rounded-md text-sm transition-all duration-100",
        isActive
          ? "bg-surface-400/70 text-text-primary"
          : "text-text-muted hover:text-text-secondary hover:bg-surface-500/50",
      )}
    >
      {channel.type === "voice" ? (
        <Volume2 size={18} className="flex-shrink-0 opacity-60" />
      ) : (
        <Hash size={18} className="flex-shrink-0 opacity-60" />
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  );
}

function UserPanel() {
  const { user } = useAuthStore();
  const { toggleUserSettings } = useUIStore();

  return (
    <div className="h-[52px] bg-surface-800/50 px-2 flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
          {user?.displayName?.slice(0, 2).toUpperCase() || "?"}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-green rounded-full border-[3px] border-surface-800" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">
          {user?.displayName}
        </p>
        <p className="text-[11px] text-text-muted truncate leading-tight">
          Çevrimiçi
        </p>
      </div>
      <button 
        onClick={toggleUserSettings}
        className="p-2 rounded-md hover:bg-surface-600 text-text-muted hover:text-text-primary transition-colors"
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
