import { useState } from "react";
import { X, Camera, Save, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useUIStore } from "../../stores/ui.store";
import { getSocket } from "../../lib/socket";
import api from "../../lib/api";

export function UserSettingsModal() {
  const { user, logout } = useAuthStore();
  const { isUserSettingsOpen, toggleUserSettings } = useUIStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");

  if (!isUserSettingsOpen || !user) return null;

  const handleSave = async () => {
    try {
      const res = await api.patch("/api/users/me", { displayName });
      // update user in store
      useAuthStore.setState({ user: { ...user, displayName: res.data.displayName } });
      toggleUserSettings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    const socket = getSocket();
    if (socket) socket.disconnect();
    logout();
    toggleUserSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface-600 rounded-lg shadow-xl w-[500px] overflow-hidden flex animate-scale-in">
        {/* Sol Menü */}
        <div className="w-48 bg-surface-700 p-4 border-r border-surface-800">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Kullanıcı Ayarları</h3>
          <button className="w-full text-left px-3 py-2 rounded bg-surface-500 text-text-primary text-sm font-medium">
            Hesabım
          </button>
          
          <div className="h-px bg-surface-500 my-4" />
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-brand-red hover:bg-surface-500/50 text-sm font-medium flex items-center gap-2"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
        
        {/* Sağ İçerik */}
        <div className="flex-1 p-6 relative">
          <button 
            onClick={toggleUserSettings}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-text-primary mb-6">Hesabım</h2>
          
          <div className="bg-surface-900 rounded-lg p-4 relative mb-6">
            <div className="h-20 bg-brand-primary rounded-t-lg -mx-4 -mt-4 mb-10" />
            
            <div className="absolute top-10 left-4 group cursor-pointer">
              <div className="w-20 h-20 rounded-full border-4 border-surface-900 bg-surface-500 flex items-center justify-center relative overflow-hidden">
                <span className="text-2xl font-bold text-white group-hover:hidden">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </span>
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-surface-700 rounded p-3 mt-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold mb-1">GÖRÜNEN AD</p>
                <input 
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="bg-transparent border-none text-text-primary text-sm focus:outline-none w-full"
                />
              </div>
            </div>
            
            <div className="bg-surface-700 rounded p-3 mt-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold mb-1">KULLANICI ADI</p>
                <p className="text-text-primary text-sm">{user.username}</p>
              </div>
            </div>
            
            <div className="bg-surface-700 rounded p-3 mt-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold mb-1">E-POSTA</p>
                <p className="text-text-primary text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={toggleUserSettings}
              className="px-4 py-2 text-sm text-text-primary hover:underline"
            >
              İptal
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded text-sm font-medium transition-colors"
            >
              <Save size={16} /> Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
