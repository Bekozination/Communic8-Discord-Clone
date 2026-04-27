import { useState, useEffect } from "react";
import { X, Shield, Plus, Trash2, Save, Users } from "lucide-react";
import { useServerStore } from "../../stores/server.store";
import { useUIStore } from "../../stores/ui.store";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string;
}

export function ServerSettingsModal() {
  const { activeServerId, servers, members } = useServerStore();
  const { isServerSettingsOpen, setServerSettingsOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<"overview" | "roles" | "members">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const activeServer = servers.find(s => s.id === activeServerId);

  useEffect(() => {
    if (isServerSettingsOpen && activeServerId) {
      // In a real app, we'd fetch from a specific roles endpoint, 
      // but for now we get it from the main server payload in the store if it has it
      api.get(`/api/servers/${activeServerId}`).then(res => {
        if (res.data.roles) setRoles(res.data.roles);
      });
    }
  }, [isServerSettingsOpen, activeServerId]);

  if (!isServerSettingsOpen || !activeServer) return null;

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await api.post(`/api/servers/${activeServerId}/roles`, { name: newRoleName });
      setRoles([...roles, res.data]);
      setNewRoleName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await api.delete(`/api/servers/${activeServerId}/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRole = async (memberId: string) => {
    if (!selectedRole) return;
    try {
      await api.post(`/api/servers/${activeServerId}/members/${memberId}/roles`, { roleId: selectedRole });
      alert("Rol başarıyla atandı!");
    } catch (err) {
      console.error(err);
      alert("Rol atanamadı.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface-600 rounded-lg shadow-xl w-[700px] h-[500px] flex overflow-hidden animate-scale-in relative">
        <button 
          onClick={() => setServerSettingsOpen(false)}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Sidebar */}
        <div className="w-48 bg-surface-700 p-4 border-r border-surface-800">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 truncate">
            {activeServer.name}
          </h3>
          <button 
            onClick={() => setActiveTab("overview")}
            className={cn("w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-colors", activeTab === "overview" ? "bg-surface-500 text-text-primary" : "text-text-muted hover:bg-surface-500/50 hover:text-text-primary")}
          >
            Genel Görünüm
          </button>
          <button 
            onClick={() => setActiveTab("roles")}
            className={cn("w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between mb-1", activeTab === "roles" ? "bg-surface-500 text-text-primary" : "text-text-muted hover:bg-surface-500/50 hover:text-text-primary")}
          >
            Roller <Shield size={14} />
          </button>
          <button 
            onClick={() => setActiveTab("members")}
            className={cn("w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between", activeTab === "members" ? "bg-surface-500 text-text-primary" : "text-text-muted hover:bg-surface-500/50 hover:text-text-primary")}
          >
            Üyeler <Users size={14} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-6">Sunucu Genel Görünümü</h2>
              <p className="text-text-muted text-sm">Sunucu resmi ve adı değiştirme özellikleri yakında eklenecektir.</p>
            </div>
          )}

          {activeTab === "roles" && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                Roller <span className="text-sm font-normal text-text-muted bg-surface-700 px-2 py-0.5 rounded-full">{roles.length}</span>
              </h2>
              
              <div className="bg-surface-800 p-4 rounded-lg border border-surface-900 mb-6 flex gap-2">
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="Yeni rol adı..." 
                  className="flex-1 bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button 
                  onClick={handleAddRole}
                  disabled={!newRoleName.trim()}
                  className="bg-brand-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Rol Ekle
                </button>
              </div>

              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="bg-surface-700 p-3 rounded flex items-center justify-between border border-surface-600">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-sm font-medium text-text-primary">{role.name}</span>
                    </div>
                    {role.name !== "@everyone" && (
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-text-muted hover:text-brand-red p-1 rounded hover:bg-surface-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {roles.length === 0 && <p className="text-text-muted text-sm text-center py-4">Bu sunucuda henüz özel rol yok.</p>}
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                Üyeler <span className="text-sm font-normal text-text-muted bg-surface-700 px-2 py-0.5 rounded-full">{members.length}</span>
              </h2>

              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="bg-surface-700 p-3 rounded flex items-center justify-between border border-surface-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
                        {member.user?.displayName?.slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{member.user?.displayName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-surface-900 border border-surface-600 rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none"
                      >
                        <option value="">Rol Seç</option>
                        {roles.filter(r => r.name !== "@everyone").map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssignRole(member.id)}
                        className="bg-brand-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                      >
                        Ata
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
