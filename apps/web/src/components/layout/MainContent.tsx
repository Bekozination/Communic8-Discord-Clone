import { useEffect, useState, useRef, useCallback } from "react";
import { Hash, Users, Send, Paperclip, Smile, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { useServerStore } from "../../stores/server.store";
import { useAuthStore } from "../../stores/auth.store";
import { useUIStore } from "../../stores/ui.store";
import { getSocket, connectSocket } from "../../lib/socket";
import api from "../../lib/api";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

interface MessageData {
  id: string;
  channelId: string;
  authorId: string;
  content: string | null;
  editedAt: string | null;
  isDeleted: boolean;
  replyToId: string | null;
  attachments: Array<{ url: string; name: string; contentType: string; size: number }>;
  createdAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

function formatTime(date: Date): string {
  if (isToday(date)) return `Bugün ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Dün ${format(date, "HH:mm")}`;
  return format(date, "dd MMM yyyy HH:mm", { locale: tr });
}

export function MainContent() {
  const { activeChannelId, channels } = useServerStore();
  const { user, accessToken } = useAuthStore();
  const { toggleMemberList, isMemberListOpen } = useUIStore();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const prevChannelRef = useRef<string | null>(null);

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  // Mesajları yükle
  useEffect(() => {
    if (!activeChannelId) return;
    api
      .get(`/api/channels/${activeChannelId}/messages`)
      .then((res) => {
        setMessages(res.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .catch(console.error);
  }, [activeChannelId]);

  // Socket events
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket() || connectSocket(accessToken);

    // Kanal değişikliğinde oda yönetimi
    if (prevChannelRef.current) {
      socket.emit("channel:leave", prevChannelRef.current);
    }
    if (activeChannelId) {
      socket.emit("channel:join", activeChannelId);
    }
    prevChannelRef.current = activeChannelId;

    const handleNewMessage = (msg: Record<string, unknown>) => {
      const message = msg as unknown as MessageData;
      if (message.channelId === activeChannelId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };

    const handleTyping = (payload: Record<string, unknown>) => {
      const data = payload as { channelId: string; userId: string; username: string; isTyping: boolean };
      if (data.channelId !== activeChannelId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (data.isTyping) next.set(data.userId, data.username);
        else next.delete(data.userId);
        return next;
      });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:update", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:update", handleTyping);
    };
  }, [activeChannelId, accessToken]);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || !activeChannelId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("message:send", {
      channelId: activeChannelId,
      content: trimmed,
      nonce: crypto.randomUUID(),
    });
    setContent("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [content, activeChannelId]);

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.delete(`/api/channels/${activeChannelId}/messages/${msgId}`);
      // UI will update if we handle message update socket event or refresh.
      // Wait, let's update local state immediately for better UX
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, content: null } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const submitEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.patch(`/api/channels/${activeChannelId}/messages/${msgId}`, { content: editContent.trim() });
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

  const handleTypingStart = () => {
    const socket = getSocket();
    if (socket && activeChannelId) socket.emit("typing:start", activeChannelId);
  };

  if (!activeChannelId || !activeChannel) {
    return (
      <div className="flex-1 bg-surface-700 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center mx-auto mb-4">
            <Hash size={40} className="text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Bir kanal seçin</h3>
          <p className="text-text-muted text-sm">Sohbete başlamak için sol taraftan bir kanal seçin</p>
        </div>
      </div>
    );
  }

  // Mesajları grupla (aynı yazarın ardışık mesajları)
  const groupedMessages: Array<{ message: MessageData; isGrouped: boolean }> = [];
  messages.forEach((msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const isGrouped =
      !!prev &&
      prev.authorId === msg.authorId &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
    groupedMessages.push({ message: msg, isGrouped });
  });

  const typingNames = Array.from(typingUsers.values()).filter((name) => name !== user?.username);

  return (
    <div className="flex-1 bg-surface-700 flex flex-col min-w-0">
      {/* Kanal başlığı */}
      <div className="h-12 border-b border-surface-800/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Hash size={20} className="text-text-muted" />
          <span className="text-text-primary font-semibold">{activeChannel.name}</span>
          {activeChannel.topic && (
            <>
              <div className="w-px h-5 bg-surface-400 mx-2" />
              <span className="text-text-muted text-sm truncate max-w-[300px]">{activeChannel.topic}</span>
            </>
          )}
        </div>
        <button
          onClick={toggleMemberList}
          className={cn("p-1.5 rounded-md transition-colors", isMemberListOpen ? "text-text-primary bg-surface-500/50" : "text-text-muted hover:text-text-primary")}
        >
          <Users size={20} />
        </button>
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-0 py-4">
        {/* Kanal başlangıcı */}
        <div className="px-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-surface-500 flex items-center justify-center mb-3">
            <Hash size={36} className="text-text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">#{activeChannel.name} kanalına hoş geldiniz!</h2>
          <p className="text-text-muted text-sm">Bu kanalın başlangıcı.</p>
        </div>

        {groupedMessages.map(({ message, isGrouped }) => (
          <div
            key={message.id}
            className={cn("relative group flex gap-4 px-4 hover:bg-surface-600/30 transition-colors", isGrouped ? "py-0.5" : "pt-4 pb-1")}
          >
            <div className="w-10 flex-shrink-0 mt-0.5">
              {!isGrouped ? (
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity">
                  {message.author.displayName.slice(0, 2).toUpperCase()}
                </div>
              ) : (
                <span className="text-[11px] text-text-muted text-right block leading-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {format(new Date(message.createdAt), "HH:mm")}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {!isGrouped && (
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-semibold text-text-primary hover:underline cursor-pointer text-sm">
                    {message.author.displayName}
                  </span>
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
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((att, i) =>
                    att.contentType.startsWith("image/") ? (
                      <img key={i} src={att.url} alt={att.name} className="max-w-sm max-h-64 rounded-md object-cover" />
                    ) : (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-surface-600 rounded-md p-3 text-sm text-text-primary hover:bg-surface-500">
                        📎 {att.name}
                        <span className="text-text-muted text-xs">({Math.round(att.size / 1024)} KB)</span>
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

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-4 py-1 text-xs text-text-muted flex items-center gap-1">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot" style={{ animationDelay: "200ms" }} />
            <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot" style={{ animationDelay: "400ms" }} />
          </span>
          <span>{typingNames.join(", ")} yazıyor...</span>
        </div>
      )}

      {/* Mesaj giriş alanı */}
      <div className="px-4 pb-6">
        <div className="flex items-end gap-2 bg-surface-400 rounded-lg px-4 py-2">
          <button className="text-text-muted hover:text-text-primary transition-colors mb-2 flex-shrink-0">
            <Paperclip size={20} />
          </button>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTypingStart();
              const ta = e.target;
              ta.style.height = "auto";
              ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={`#${activeChannel.name} kanalına mesaj gönder`}
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-sm resize-none placeholder:text-text-muted focus:outline-none leading-6 max-h-[200px] overflow-y-auto scrollbar-thin"
          />
          <button className="text-text-muted hover:text-text-primary transition-colors mb-2 flex-shrink-0">
            <Smile size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={!content.trim()}
            className={cn("mb-2 flex-shrink-0 transition-colors", content.trim() ? "text-brand-primary hover:text-brand-primary/80" : "text-text-muted cursor-not-allowed")}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
