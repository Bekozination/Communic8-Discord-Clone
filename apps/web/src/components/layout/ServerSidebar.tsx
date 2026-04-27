import { useEffect } from "react";
import { Plus, Compass, LogOut, Settings, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useServerStore } from "../../stores/server.store";
import { useUIStore } from "../../stores/ui.store";
import { useAuthStore } from "../../stores/auth.store";
import { disconnectSocket } from "../../lib/socket";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

export function ServerSidebar() {
  const { servers, activeServerId, setActiveServer, setServers } =
    useServerStore();
  const { setCreateServerOpen, setJoinServerOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/servers")
      .then((res) => setServers(res.data))
      .catch(console.error);
  }, [setServers]);

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate("/auth");
  }

  return (
    <div className="flex flex-col items-center w-[72px] bg-surface-800 py-3 gap-2 overflow-y-auto scrollbar-hide">
      {/* DM butonu */}
      <button
        onClick={() => setActiveServer(null as unknown as string)}
        className={cn(
          "w-12 h-12 transition-all duration-200 group relative",
          !activeServerId 
            ? "rounded-[16px] bg-brand-primary text-white" 
            : "rounded-[24px] bg-surface-600 text-text-muted hover:bg-brand-primary hover:text-white hover:rounded-[16px]"
        )}
        title="Direkt Mesajlar"
      >
        <div className="w-full h-full flex items-center justify-center">
          <MessageCircle size={24} />
        </div>
        {!activeServerId && (
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 bg-text-primary rounded-r-full transition-all duration-200" />
        )}
        {/* Tooltip */}
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-surface-900 text-text-primary text-sm font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
          Direkt Mesajlar
        </span>
      </button>

      <div className="w-8 h-[2px] bg-surface-300 rounded-full my-1" />

      {/* Sunucu listesi */}
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => setActiveServer(server.id)}
          className={cn(
            "relative w-12 h-12 transition-all duration-200 group",
            activeServerId === server.id
              ? "rounded-[16px]"
              : "rounded-[24px] hover:rounded-[16px]",
          )}
          title={server.name}
        >
          {/* Aktif göstergesi */}
          <span
            className={cn(
              "absolute -left-1 top-1/2 -translate-y-1/2",
              "w-1 bg-text-primary rounded-r-full transition-all duration-200",
              activeServerId === server.id
                ? "h-10"
                : "h-0 group-hover:h-5",
            )}
          />
          {server.iconUrl ? (
            <img
              src={server.iconUrl}
              alt={server.name}
              className={cn(
                "w-full h-full object-cover",
                activeServerId === server.id
                  ? "rounded-[16px]"
                  : "rounded-[24px] group-hover:rounded-[16px]",
                "transition-all duration-200",
              )}
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center",
                "bg-surface-600 text-text-primary text-sm font-semibold",
                activeServerId === server.id
                  ? "rounded-[16px] bg-brand-primary text-white"
                  : "rounded-[24px] group-hover:rounded-[16px] group-hover:bg-brand-primary group-hover:text-white",
                "transition-all duration-200",
              )}
            >
              {server.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          {/* Tooltip */}
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-surface-900 text-text-primary text-sm font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
            {server.name}
          </span>
        </button>
      ))}

      {/* Sunucu ekle */}
      <button
        onClick={() => setCreateServerOpen(true)}
        className={cn(
          "w-12 h-12 rounded-[24px] bg-surface-600 hover:bg-brand-green",
          "flex items-center justify-center transition-all duration-200",
          "hover:rounded-[16px] text-brand-green hover:text-white",
          "group relative",
        )}
      >
        <Plus size={24} />
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-surface-900 text-text-primary text-sm font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
          Sunucu Oluştur
        </span>
      </button>

      {/* Sunucuya katıl */}
      <button
        onClick={() => setJoinServerOpen(true)}
        className={cn(
          "w-12 h-12 rounded-[24px] bg-surface-600 hover:bg-brand-green",
          "flex items-center justify-center transition-all duration-200",
          "hover:rounded-[16px] text-brand-green hover:text-white",
          "group relative",
        )}
      >
        <Compass size={24} />
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-surface-900 text-text-primary text-sm font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
          Sunucuya Katıl
        </span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="w-8 h-[2px] bg-surface-300 rounded-full my-1" />

      {/* Kullanıcı avatarı */}
      <button
        onClick={handleLogout}
        className={cn(
          "w-12 h-12 rounded-[24px] bg-surface-600 hover:bg-brand-red",
          "flex items-center justify-center transition-all duration-200",
          "hover:rounded-[16px] text-text-muted hover:text-white",
          "group relative",
        )}
      >
        <LogOut size={20} />
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-surface-900 text-text-primary text-sm font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
          Çıkış Yap
        </span>
      </button>
    </div>
  );
}
