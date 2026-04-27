import { useEffect, useState, useRef, useCallback } from "react";
import { Users, Send, Paperclip, Smile, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { useUIStore } from "../../stores/ui.store";
import { useAuthStore } from "../../stores/auth.store";
import { getSocket, connectSocket } from "../../lib/socket";
import api from "../../lib/api";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

interface MessageData {
  id: string;
  dmChannelId: string;
  authorId: string;
  content: string | null;
  editedAt: string | null;
  isDeleted: boolean;
  attachments: Array<{ url: string; name: string; contentType: string; size: number }>;
  createdAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

function formatTime(date: Date): string {
  if (isToday(date)) return `Bugün ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Dün ${format(date, "HH:mm")}`;
  return format(date, "dd MMM yyyy HH:mm", { locale: tr });
}

export function DMContent() {
  const { activeDMId } = useUIStore();
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [content, setContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevChannelRef = useRef<string | null>(null);

  // Mesajları yükle
  useEffect(() => {
    if (!activeDMId) return;
    api
      .get(`/api/dms/${activeDMId}/messages`)
      .then((res) => {
        setMessages(res.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .catch(console.error);
  }, [activeDMId]);

  // Socket events
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket() || connectSocket(accessToken);

    if (prevChannelRef.current) {
      socket.emit("channel:leave", prevChannelRef.current);
    }
    if (activeDMId) {
      socket.emit("channel:join", activeDMId);
    }
    prevChannelRef.current = activeDMId;

    const handleNewMessage = (msg: Record<string, unknown>) => {
      const message = msg as unknown as MessageData;
      if (message.dmChannelId === activeDMId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [activeDMId, accessToken]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || !activeDMId) return;
    
    // Geçici bir çözüm: DM için HTTP endpointine atıyoruz, soket serverda dm:send olmadığı için.
    // Sokete çevirsek daha iyi ama şimdilik HTTP.
    try {
      await api.post(`/api/dms/${activeDMId}/messages`, { content: trimmed });
      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch(err) {
      console.error(err);
    }
  }, [content, activeDMId]);

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.delete(`/api/channels/${activeDMId}/messages/${msgId}`);
      // Fallback for UI if socket event isn't handling deletes for DMs right now
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, content: null } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const submitEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.patch(`/api/channels/${activeDMId}/messages/${msgId}`, { content: editContent.trim() });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: res.data.content, editedAt: res.data.editedAt } : m));
      setEditingMessageId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDMId) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const attachment = res.data;
      await api.post(`/api/dms/${activeDMId}/messages`, { 
        content: "", 
        attachments: [attachment] 
      });

    } catch (err) {
      console.error("Yükleme başarısız", err);
      alert("Dosya yüklenemedi. R2 ayarlarınızı veya limitleri kontrol edin.");
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!activeDMId) return null;

  const groupedMessages: Array<{ message: MessageData; isGrouped: boolean }> = [];
  messages.forEach((msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const isGrouped =
      !!prev &&
      prev.authorId === msg.authorId &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
    groupedMessages.push({ message: msg, isGrouped });
  });

  return (
    <div className="flex-1 bg-surface-700 flex flex-col min-w-0">
      <div className="h-12 border-b border-surface-800/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-text-muted" />
          <span className="text-text-primary font-semibold">Direkt Mesaj</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-0 py-4">
        {groupedMessages.map(({ message, isGrouped }) => (
          <div key={message.id} className={cn("relative group flex gap-4 px-4 hover:bg-surface-600/30 transition-colors", isGrouped ? "py-0.5" : "pt-4 pb-1")}>
            <div className="w-10 flex-shrink-0 mt-0.5">
              {!isGrouped && (
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-bold">
                  {message.author?.displayName?.slice(0, 2).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {!isGrouped && (
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-semibold text-text-primary text-sm">{message.author?.displayName}</span>
                  <span className="text-[11px] text-text-muted">{formatTime(new Date(message.createdAt))}</span>
                </div>
              )}
              {editingMessageId === message.id ? (
                <div className="mt-1 flex items-end gap-2 bg-surface-500 rounded p-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitEdit(message.id);
                      } else if (e.key === "Escape") {
                        setEditingMessageId(null);
                      }
                    }}
                    className="flex-1 bg-transparent text-text-primary text-sm resize-none focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => setEditingMessageId(null)} className="text-brand-red hover:bg-surface-400 p-1.5 rounded transition">
                    <X size={16} />
                  </button>
                  <button onClick={() => submitEdit(message.id)} className="text-brand-green hover:bg-surface-400 p-1.5 rounded transition">
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <p className={cn("text-text-secondary text-sm leading-relaxed break-words", message.isDeleted && "italic text-text-muted")}>
                  {message.isDeleted ? "[Bu mesaj silindi]" : message.content}
                  {message.editedAt && !message.isDeleted && <span className="text-[11px] text-text-muted ml-1">(düzenlendi)</span>}
                </p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((att, i) =>
                    att.contentType.startsWith("image/") ? (
                      <img key={i} src={`http://localhost:3001${att.url}`} alt={att.name} className="max-w-sm max-h-64 rounded-md object-cover" />
                    ) : (
                      <a key={i} href={`http://localhost:3001${att.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-surface-600 rounded-md p-3 text-sm text-text-primary">
                        📎 {att.name}
                      </a>
                    ),
                  )}
                </div>
              )}
              
              {!message.isDeleted && message.authorId === user?.id && editingMessageId !== message.id && (
                <div className="absolute right-4 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-600 border border-surface-500 rounded flex items-center shadow-sm">
                  <button onClick={() => { setEditingMessageId(message.id); setEditContent(message.content || ""); setTimeout(() => editTextareaRef.current?.focus(), 10); }} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-500 rounded-l transition-colors" title="Düzenle">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteMessage(message.id)} className="p-1.5 text-text-muted hover:text-brand-red hover:bg-surface-500 rounded-r transition-colors" title="Sil">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-6">
        <div className="flex items-end gap-2 bg-surface-400 rounded-lg px-4 py-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="text-text-muted hover:text-text-primary transition-colors mb-2 flex-shrink-0">
            <Paperclip size={20} />
          </button>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              const ta = e.target;
              ta.style.height = "auto";
              ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj gönder"
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-sm resize-none placeholder:text-text-muted focus:outline-none leading-6 max-h-[200px] overflow-y-auto scrollbar-thin"
          />
          <button onClick={handleSend} disabled={!content.trim()} className={cn("mb-2 flex-shrink-0 transition-colors", content.trim() ? "text-brand-primary" : "text-text-muted")}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
