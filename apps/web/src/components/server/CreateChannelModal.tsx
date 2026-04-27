import { useState } from "react";
import { Hash, Volume2, X } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { useServerStore } from "../../stores/server.store";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

export function CreateChannelModal() {
  const { isCreateChannelOpen, setCreateChannelOpen } = useUIStore();
  const { activeServerId, channels, setChannels } = useServerStore();
  
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");

  if (!isCreateChannelOpen || !activeServerId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await api.post(`/api/servers/${activeServerId}/channels`, {
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type
      });
      setChannels([...channels, res.data]);
      setCreateChannelOpen(false);
      setName("");
      setType("text");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface-700 rounded-lg shadow-xl w-[460px] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-xl font-bold text-text-primary">Kanal Oluştur</h2>
          <button onClick={() => setCreateChannelOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6 space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Kanal Türü</h3>
            
            <label className={cn("flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors", type === "text" ? "bg-surface-600 border-brand-primary/50" : "bg-surface-800 border-surface-900 hover:bg-surface-600")}>
              <div className="w-10 h-10 rounded-full bg-surface-500 flex items-center justify-center">
                <Hash size={24} className="text-text-muted" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">Metin Kanalı</div>
                <div className="text-xs text-text-muted">Resim gönderin, görüş bildirin, şakalaşın.</div>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", type === "text" ? "border-brand-primary" : "border-text-muted")}>
                {type === "text" && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
              </div>
              <input type="radio" name="type" value="text" checked={type === "text"} onChange={() => setType("text")} className="hidden" />
            </label>

            <label className={cn("flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors", type === "voice" ? "bg-surface-600 border-brand-primary/50" : "bg-surface-800 border-surface-900 hover:bg-surface-600")}>
              <div className="w-10 h-10 rounded-full bg-surface-500 flex items-center justify-center">
                <Volume2 size={24} className="text-text-muted" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">Ses Kanalı</div>
                <div className="text-xs text-text-muted">Sesli, görüntülü ve ekran paylaşımı ile takılın.</div>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", type === "voice" ? "border-brand-primary" : "border-text-muted")}>
                {type === "voice" && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
              </div>
              <input type="radio" name="type" value="voice" checked={type === "voice"} onChange={() => setType("voice")} className="hidden" />
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Kanal Adı
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                {type === "text" ? <Hash size={16} /> : <Volume2 size={16} />}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="yeni-kanal"
                className="w-full bg-surface-900 border border-surface-900 rounded p-2 pl-9 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors"
                maxLength={32}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setCreateChannelOpen(false)}
              className="px-4 py-2 text-sm text-text-primary hover:underline"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-brand-primary text-white rounded text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              Kanal Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
