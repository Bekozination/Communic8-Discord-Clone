import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useUIStore } from "../../stores/ui.store";
import { useServerStore } from "../../stores/server.store";
import api from "../../lib/api";

export function CreateServerModal() {
  const { isCreateServerOpen, setCreateServerOpen } = useUIStore();
  const { addServer, setActiveServer } = useServerStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateServerOpen) return null;

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/servers", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      addServer(res.data);
      setActiveServer(res.data.id);
      setCreateServerOpen(false);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Sunucu oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setCreateServerOpen(false)}
      />
      <div className="relative bg-surface-600 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in border border-surface-400/20">
        <button
          onClick={() => setCreateServerOpen(false)}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Sunucu Oluştur</h2>
          <p className="text-text-muted text-sm mt-1">
            Arkadaşlarınla sohbet etmek için yeni bir sunucu oluştur
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Sunucu Adı
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-text-muted"
              placeholder="Sunucu adını girin"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-text-muted resize-none"
              placeholder="Sunucu hakkında kısa bir açıklama"
              rows={3}
              maxLength={500}
            />
          </div>

          {error && (
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-3 text-sm text-brand-red">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className={cn(
              "w-full py-3 rounded-lg font-semibold text-sm text-white transition-all",
              "bg-gradient-to-r from-brand-primary to-brand-primary/80",
              "hover:from-brand-primary/90 hover:to-brand-primary/70",
              "active:scale-[0.98] shadow-lg shadow-brand-primary/25",
              (loading || !name.trim()) && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? "Oluşturuluyor..." : "Sunucu Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
