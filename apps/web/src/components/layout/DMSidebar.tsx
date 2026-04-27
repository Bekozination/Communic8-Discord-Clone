import { useEffect, useState } from "react";
import { Users, Search, X, Settings } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useUIStore } from "../../stores/ui.store";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

interface DMChannel {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
}

export function DMSidebar() {
  const { user } = useAuthStore();
  const { activeDMId, setActiveDMId, toggleUserSettings } = useUIStore();
  const [dms, setDms] = useState<DMChannel[]>([]);

  useEffect(() => {
    api.get("/api/dms")
      .then(res => setDms(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="w-60 bg-surface-600 flex flex-col">
      <div className="h-12 border-b border-surface-800/50 flex items-center px-4">
        <div className="w-full bg-surface-900 rounded text-sm flex items-center px-2 py-1">
          <Search size={14} className="text-text-muted mr-2" />
          <input 
            type="text" 
            placeholder="Bul veya sohbet başlat" 
            className="bg-transparent border-none outline-none text-text-primary text-xs w-full placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        <button 
          onClick={() => setActiveDMId(null)}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm transition-all duration-100 bg-surface-500/50 text-text-primary hover:bg-surface-400"
        >
          <Users size={20} />
          <span className="font-medium">Arkadaşlar</span>
        </button>

        <div className="mt-4 px-2 flex items-center justify-between group cursor-pointer hover:text-text-primary">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">
            DİREKT MESAJLAR
          </span>
        </div>
        
        {dms.length === 0 ? (
          <div className="mt-2 text-center py-4">
            <span className="text-xs text-text-muted">Henüz mesaj yok</span>
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {dms.map(dm => (
              <button 
                key={dm.id}
                onClick={() => setActiveDMId(dm.id)}
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 w-full rounded-md text-sm transition-all duration-100 group",
                  activeDMId === dm.id ? "bg-surface-500/70 text-text-primary" : "text-text-muted hover:bg-surface-500/50 hover:text-text-primary"
                )}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
                    {dm.otherUser.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-surface-600", dm.otherUser.status === "online" ? "bg-brand-green" : "bg-text-muted")} />
                </div>
                <div className="flex-1 text-left truncate">
                  <span className="font-medium">{dm.otherUser.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Panel */}
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
    </div>
  );
}
