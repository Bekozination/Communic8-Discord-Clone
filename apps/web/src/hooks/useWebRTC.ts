import { useEffect, useRef } from 'react';
import { useVoiceStore } from '../stores/voice.store';
import { useAuthStore } from '../stores/auth.store';
import { getSocket } from '../lib/socket';

export function useWebRTC(channelId: string | null) {
  const { user } = useAuthStore();
  const { 
    setLocalStream, 
    addRemoteStream, 
    removeRemoteStream, 
    addConnectedUser, 
    removeConnectedUser,
    clearVoice 
  } = useVoiceStore();

  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!channelId || !user) return;
    const socket = getSocket();
    if (!socket) return;

    let mounted = true;

    // 1. Get User Media
    const getMedia = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Tarayıcı mikrofon erişimini desteklemiyor (HTTPS gerekli). Sadece dinleyici olarak katılıyorsunuz.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err: any) {
        console.warn("Mikrofon alınamadı, sadece dinleyici modu:", err.message || err);
      } finally {
        if (mounted) {
          socket.emit("voice:join", channelId);
        }
      }
    };

    getMedia();

    // 2. Handle User Joined (We are the existing user, we create offer)
    const handleUserJoined = async ({ userId }: { userId: string }) => {
      addConnectedUser(userId);
      const peer = createPeerConnection(userId);
      peers.current[userId] = peer;

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("voice:signal", { to: userId, signal: peer.localDescription });
      } catch (err) {
        console.error("Offer oluşturma hatası:", err);
      }
    };

    // 3. Handle User Left
    const handleUserLeft = ({ userId }: { userId: string }) => {
      removeConnectedUser(userId);
      removeRemoteStream(userId);
      if (peers.current[userId]) {
        peers.current[userId].close();
        delete peers.current[userId];
      }
    };

    // 4. Handle Signals
    const handleSignal = async ({ from, signal }: { from: string, signal: any }) => {
      let peer = peers.current[from];

      if (!peer) {
        addConnectedUser(from);
        peer = createPeerConnection(from);
        peers.current[from] = peer;
      }

      try {
        if (signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("voice:signal", { to: from, signal: peer.localDescription });
        } else if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error("Signal işleme hatası:", err);
      }
    };

    // Create Peer Connection helper
    const createPeerConnection = (userId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ]
      });

      // Add local tracks to peer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      } else {
        // Dinleyici modu: sadece ses almak istediğimizi belirt
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice:signal", { to: userId, signal: event.candidate });
        }
      };

      // Handle remote streams
      pc.ontrack = (event) => {
        addRemoteStream(userId, event.streams[0]);
      };

      return pc;
    };

    socket.on("voice:user_joined", handleUserJoined);
    socket.on("voice:user_left", handleUserLeft);
    socket.on("voice:signal", handleSignal);

    // Cleanup
    return () => {
      mounted = false;
      socket.off("voice:user_joined", handleUserJoined);
      socket.off("voice:user_left", handleUserLeft);
      socket.off("voice:signal", handleSignal);
      
      socket.emit("voice:leave", channelId);
      
      // Close all peers
      Object.values(peers.current).forEach(peer => peer.close());
      peers.current = {};
      
      // Stop local microphone
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      clearVoice();
    };
  }, [channelId, user]);
}
