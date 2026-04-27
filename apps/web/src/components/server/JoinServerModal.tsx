import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useUIStore } from "../../stores/ui.store";
import { useServerStore } from "../../stores/server.store";
import api from "../../lib/api";

export function JoinServerModal() {
  const { isJoinServerOpen, setJoinServerOpen } = useUIStore();
  const { addServer, setActiveServer } = useServerStore();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isJoinServerOpen) return null;

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/servers/join/${inviteCode.trim()}`);
      addServer(res.data);
      setActiveServer(res.data.id);
      setJoinServerOpen(false);
      setInviteCode("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Sunucuya katılınamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setJoinServerOpen(false)}
      />
      <div className="relative bg-surface-600 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in border border-surface-400/20">
        <button
          onClick={() => setJoinServerOpen(false)}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Sunucuya Katıl</h2>
          <p className="text-text-muted text-sm mt-1">
            Davet kodu ile bir sunucuya katıl
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Davet Kodu
            </label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-text-muted"
              placeholder="Davet kodunu girin"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>

          {error && (
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-3 text-sm text-brand-red">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || !inviteCode.trim()}
            className={cn(
              "w-full py-3 rounded-lg font-semibold text-sm text-white transition-all",
              "bg-gradient-to-r from-brand-green to-brand-green/80",
              "hover:from-brand-green/90 hover:to-brand-green/70",
              "active:scale-[0.98] shadow-lg shadow-brand-green/25",
              (loading || !inviteCode.trim()) && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? "Katılınıyor..." : "Sunucuya Katıl"}
          </button>
        </div>
      </div>
    </div>
  );
}
