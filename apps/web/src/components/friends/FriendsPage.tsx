import { useEffect, useState } from "react";
import { Users, Check, X, MessageSquare } from "lucide-react";
import { useFriendStore } from "../../stores/friend.store";
import { useUIStore } from "../../stores/ui.store";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

type Tab = "online" | "all" | "pending" | "add";

export function FriendsPage() {
  const { friends, fetchFriends, sendRequest, acceptRequest, removeFriend, loading } = useFriendStore();
  const { setActiveDMId } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>("online");
  const [addUsername, setAddUsername] = useState("");

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    await sendRequest(addUsername.trim());
    setAddUsername("");
    setActiveTab("pending");
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const res = await api.post(`/api/dms/${targetUserId}`);
      setActiveDMId(res.data.id);
    } catch (err) {
      console.error("DM başlatılamadı", err);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (activeTab === "online") return f.type === "friend" && f.friend.status === "online";
    if (activeTab === "all") return f.type === "friend";
    if (activeTab === "pending") return f.type === "incoming_request" || f.type === "outgoing_request";
    return false;
  });

  return (
    <div className="flex-1 bg-surface-700 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-12 border-b border-surface-800/50 flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-text-primary border-r border-surface-500 pr-4">
          <Users size={20} className="text-text-muted" />
          <span className="font-semibold">Arkadaşlar</span>
        </div>
        
        <div className="flex gap-4">
          <TabButton active={activeTab === "online"} onClick={() => setActiveTab("online")}>Çevrimiçi</TabButton>
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>Tümü</TabButton>
          <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>Bekleyen</TabButton>
          <button 
            onClick={() => setActiveTab("add")}
            className={cn("px-2 py-0.5 text-sm rounded transition-colors", activeTab === "add" ? "bg-transparent text-brand-green" : "bg-brand-green text-white hover:bg-brand-green/80")}
          >
            Arkadaş Ekle
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === "add" ? (
          <div className="max-w-2xl">
            <h2 className="text-text-primary font-bold mb-2 uppercase text-sm">Arkadaş Ekle</h2>
            <p className="text-text-muted text-sm mb-4">Arkadaşınızı kullanıcı adıyla (örn: bekoz) ekleyebilirsiniz.</p>
            
            <form onSubmit={handleAddFriend} className="flex gap-4 bg-surface-900 border border-surface-500/30 p-2 rounded-lg items-center focus-within:border-brand-primary">
              <input 
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="Arkadaşlık isteği göndermek için kullanıcı adı girin"
                className="flex-1 bg-transparent text-text-primary text-sm outline-none px-2"
              />
              <button 
                type="submit"
                disabled={!addUsername.trim() || loading}
                className="bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded transition-all hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İstek Gönder
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-4xl">
            <h3 className="text-text-muted font-bold text-xs uppercase mb-4">
              {activeTab === "online" ? `Çevrimiçi — ${filteredFriends.length}` : 
               activeTab === "all" ? `Tüm Arkadaşlar — ${filteredFriends.length}` : 
               `Bekleyen İstekler — ${filteredFriends.length}`}
            </h3>

            {filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 text-center">
                <div className="w-40 h-40 bg-surface-600 rounded-full mb-4 flex items-center justify-center">
                  <Users size={64} className="text-surface-400" />
                </div>
                <p className="text-text-muted">Burada kimse yok. Sessiz ve sakin.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 border-t border-surface-600 hover:bg-surface-600/50 rounded transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
                          {f.friend.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-surface-700", f.friend.status === "online" ? "bg-brand-green" : "bg-text-muted")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">{f.friend.displayName}</span>
                          <span className="text-text-muted text-sm hidden group-hover:block">{f.friend.username}</span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {f.type === "incoming_request" ? "Gelen Arkadaşlık İsteği" : 
                           f.type === "outgoing_request" ? "Gönderilen Arkadaşlık İsteği" : 
                           f.friend.status === "online" ? "Çevrimiçi" : "Çevrimdışı"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {f.type === "friend" && (
                        <>
                          <ActionBtn icon={<MessageSquare size={18} />} onClick={() => handleStartDM(f.friend.id)} title="Mesaj Gönder" />
                          <ActionBtn icon={<X size={18} />} onClick={() => removeFriend(f.id)} title="Arkadaşlıktan Çıkar" danger />
                        </>
                      )}
                      {f.type === "incoming_request" && (
                        <>
                          <ActionBtn icon={<Check size={18} />} onClick={() => acceptRequest(f.id)} title="Kabul Et" success />
                          <ActionBtn icon={<X size={18} />} onClick={() => removeFriend(f.id)} title="Reddet" danger />
                        </>
                      )}
                      {f.type === "outgoing_request" && (
                        <ActionBtn icon={<X size={18} />} onClick={() => removeFriend(f.id)} title="İsteği İptal Et" danger />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 text-sm font-medium rounded transition-colors",
        active ? "bg-surface-500 text-text-primary" : "text-text-muted hover:text-text-primary hover:bg-surface-500/50"
      )}
    >
      {children}
    </button>
  );
}

function ActionBtn({ icon, onClick, title, danger, success }: { icon: React.ReactNode; onClick: () => void; title: string; danger?: boolean; success?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-text-muted transition-colors",
        danger ? "hover:text-brand-red" : success ? "hover:text-brand-green" : "hover:text-text-primary"
      )}
    >
      {icon}
    </button>
  );
}
