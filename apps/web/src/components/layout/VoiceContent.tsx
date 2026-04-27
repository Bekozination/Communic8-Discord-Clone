import { useEffect, useRef } from "react";
import { Hash, Volume2, Mic, MicOff, PhoneOff, Headphones, User } from "lucide-react";
import { useServerStore } from "../../stores/server.store";
import { useVoiceStore } from "../../stores/voice.store";
import { useWebRTC } from "../../hooks/useWebRTC";
import { cn } from "../../lib/utils";

export function VoiceContent() {
  const { activeChannelId, channels, members, setActiveChannel } = useServerStore();
  const { connectedUsers, remoteStreams, isMuted, toggleMute, clearVoice } = useVoiceStore();
  
  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  // Join the voice channel
  useWebRTC(activeChannelId);

  const handleDisconnect = () => {
    setActiveChannel(null as unknown as string);
    clearVoice();
  };

  if (!activeChannelId || !activeChannel) return null;

  return (
    <div className="flex-1 bg-surface-700 flex flex-col min-w-0">
      {/* Kanal başlığı */}
      <div className="h-12 border-b border-surface-800/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-text-muted" />
          <span className="text-text-primary font-semibold">{activeChannel.name}</span>
        </div>
      </div>

      {/* Video/Voice Grid */}
      <div className="flex-1 p-6 flex items-center justify-center bg-surface-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full max-h-[800px]">
          
          {/* Kendimiz */}
          <div className="bg-surface-700 rounded-xl border-2 border-brand-primary flex flex-col items-center justify-center relative overflow-hidden shadow-lg min-h-[200px]">
            <div className="w-24 h-24 rounded-full bg-surface-500 flex items-center justify-center mb-4">
               <User size={40} className="text-text-muted" />
            </div>
            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium absolute bottom-4 left-4">
              Siz (Bağlı)
            </span>
            {isMuted && (
              <div className="absolute top-4 right-4 bg-brand-red rounded-full p-2 text-white">
                <MicOff size={16} />
              </div>
            )}
          </div>

          {/* Diğer Kullanıcılar */}
          {connectedUsers.map(userId => {
            const member = members.find(m => m.userId === userId);
            const stream = remoteStreams[userId];
            
            return (
              <div key={userId} className="bg-surface-700 rounded-xl border border-surface-600 flex flex-col items-center justify-center relative overflow-hidden shadow-lg min-h-[200px]">
                <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center mb-4 text-white text-3xl font-bold">
                  {member?.user?.displayName?.slice(0,2).toUpperCase() || "?"}
                </div>
                <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium absolute bottom-4 left-4">
                  {member?.user?.displayName || "Kullanıcı"}
                </span>
                
                {/* Görünmez Audio elementi */}
                {stream && <AudioPlayer stream={stream} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Kontroller */}
      <div className="h-20 bg-surface-900 border-t border-surface-800 flex items-center justify-center gap-4 px-6">
        <button 
          onClick={toggleMute}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", isMuted ? "bg-brand-red hover:bg-brand-red/80 text-white" : "bg-surface-600 hover:bg-surface-500 text-text-primary")}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={handleDisconnect}
          className="w-14 h-14 rounded-full bg-brand-red hover:bg-brand-red/80 text-white flex items-center justify-center transition-colors shadow-lg"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}

// React'te media streamleri otomatik oynatmak için yardımcı component
function AudioPlayer({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}
