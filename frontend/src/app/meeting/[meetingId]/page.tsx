"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  Copy,
  Check,
  Send,
  Shield,
  ShieldCheck,
  X,
  ChevronUp,
  Smile,
  CircleDot,
  Maximize2,
  Minimize2,
  Grid,
} from "lucide-react";

import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api, Meeting, Participant } from "@/lib/api";
import { createPeerConnection } from "@/lib/webrtc";
import { ZoomLogo } from "@/components/zoom/ZoomLogo";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawMeetingId = (params?.meetingId as string) || "";
  const meetingCode = rawMeetingId.trim().toLowerCase();

  // Unique session-stable participant ID
  const participantIdRef = useRef<string>("");
  if (!participantIdRef.current) {
    if (typeof window !== "undefined") {
      const storageKey = `zoom_pid_${meetingCode || "default"}`;
      let saved = sessionStorage.getItem(storageKey);
      if (!saved) {
        saved = `user-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(storageKey, saved);
      }
      participantIdRef.current = saved;
    } else {
      participantIdRef.current = `user-${Math.random().toString(36).substring(2, 9)}`;
    }
  }
  const participantId = participantIdRef.current;

  // State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("Aditya (Host)");
  const [isJoining, setIsJoining] = useState(false);

  // Media streams & tracks
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("waiting");

  // Media toggles
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);

  // UI state
  const [activeSidePanel, setActiveSidePanel] = useState<"none" | "participants" | "chat">("none");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      sender: "Zoom Workplace",
      text: "Meeting is end-to-end encrypted. Messages are visible to everyone in the room.",
      time: "Just now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const isInitiatorRef = useRef<boolean>(false);
  const isNegotiatingRef = useRef<boolean>(false);

  // Video element refs
  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const localCallVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const getShareableLink = useCallback(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/meeting/${meetingCode}`;
    }
    return meeting?.meeting_link || "";
  }, [meetingCode, meeting]);

  // 1. Fetch meeting info
  useEffect(() => {
    if (!meetingCode) return;
    const fetchMeeting = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMeetingByCode(meetingCode);
        setMeeting(data);
        setParticipants(data.participants || []);
      } catch {
        const fallbackMeeting: Meeting = {
          id: 0,
          meeting_code: meetingCode,
          title: "Zoom Workplace Meeting",
          description: null,
          meeting_type: "instant",
          status: "active",
          scheduled_at: null,
          duration: null,
          meeting_link: typeof window !== "undefined" ? `${window.location.origin}/meeting/${meetingCode}` : "",
          created_at: new Date().toISOString(),
          participants: [],
        };
        setMeeting(fallbackMeeting);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingCode]);

  // 2. Request local camera/mic stream on mount
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    async function initMedia() {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamInstance = stream;
        setLocalStream(stream);

        if (localPreviewRef.current) {
          localPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Media devices not accessible or permission denied:", err);
      }
    }

    initMedia();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Bind local stream to video elements
  useEffect(() => {
    if (hasJoined && localCallVideoRef.current && localStream) {
      localCallVideoRef.current.srcObject = localStream;
    }
  }, [hasJoined, localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 3. Call timer
  useEffect(() => {
    if (!hasJoined) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasJoined]);

  // 4. Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeSidePanel]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper to send signaling messages
  const sendSignalMessage = useCallback(
    async (type: string, data?: any, targetId?: string | null) => {
      try {
        await api.sendSignal(meetingCode, {
          sender_id: participantId,
          sender_name: displayName,
          target_id: targetId || null,
          type,
          data,
        });
      } catch (err) {
        console.warn("Failed to send signaling message:", err);
      }
    },
    [meetingCode, participantId, displayName]
  );

  const remoteStreamAccumulatorRef = useRef<MediaStream>(new MediaStream());

  const drainIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      if (candidate && (candidate.candidate || candidate.sdpMid !== undefined)) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }
    }
  }, []);

  const getOrCreatePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = createPeerConnection({
      onTrack: (incomingStream) => {
        // Collect tracks into our persistent accumulator
        incomingStream.getTracks().forEach((track) => {
          const currentTracks = remoteStreamAccumulatorRef.current.getTracks();
          if (!currentTracks.some((t) => t.id === track.id)) {
            remoteStreamAccumulatorRef.current.addTrack(track);
          }
        });

        const activeTracks = remoteStreamAccumulatorRef.current.getTracks();
        const freshStream = new MediaStream(activeTracks);
        setRemoteStream(freshStream);
        setConnectionState("connected");

        // Force playback on remote video element (vital for mobile/iOS Safari autoplay policies)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = freshStream;
          remoteVideoRef.current.play().catch((err) => {
            console.warn("Remote video auto-play prevented:", err);
          });
        }
      },
      onIceCandidate: (candidate) => {
        if (candidate && candidate.candidate) {
          sendSignalMessage("ice-candidate", candidate.toJSON());
        }
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        if (state === "connected") {
          showToast("success", "Connected to peer");
        } else if (state === "disconnected" || state === "failed" || state === "closed") {
          // Keep stream unless closed
          if (state === "closed") {
            setRemoteStream(null);
            remoteStreamAccumulatorRef.current = new MediaStream();
          }
        }
      },
    });

    // Ensure audio & video transceivers exist with sendrecv so offers/answers negotiate both ways cleanly
    try {
      const transceivers = pc.getTransceivers();
      if (!transceivers.some((t) => t.receiver.track.kind === "video")) {
        pc.addTransceiver("video", { direction: "sendrecv" });
      }
      if (!transceivers.some((t) => t.receiver.track.kind === "audio")) {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      }
    } catch (e) {
      console.warn("Transceiver initialization:", e);
    }

    // Attach local tracks if available
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStream);
        } catch (e) {
          console.warn("Add initial track error:", e);
        }
      });
    }

    pcRef.current = pc;
    return pc;
  }, [localStream, sendSignalMessage]);

  // Synchronize local tracks whenever localStream updates (e.g. mic/cam permission granted after mount)
  useEffect(() => {
    if (!pcRef.current || !localStream) return;
    const pc = pcRef.current;
    const senders = pc.getSenders();

    localStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track).catch(() => {});
      } else {
        try {
          pc.addTrack(track, localStream);
        } catch (e) {
          console.warn("Error adding local track:", e);
        }
      }
    });
  }, [localStream]);

  const startCallAsInitiator = useCallback(async (targetId?: string | null) => {
    if (isNegotiatingRef.current) return;
    isNegotiatingRef.current = true;
    isInitiatorRef.current = true;
    const pc = getOrCreatePeerConnection();

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      await sendSignalMessage("offer", offer, targetId);
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
    } finally {
      isNegotiatingRef.current = false;
    }
  }, [getOrCreatePeerConnection, sendSignalMessage]);

  // Signaling polling loop
  useEffect(() => {
    if (!hasJoined || !meetingCode) return;
    let isPolling = true;

    sendSignalMessage("join", { name: displayName });

    const pollSignals = async () => {
      if (!isPolling) return;
      try {
        const response = await api.getSignals(meetingCode, participantId, displayName);
        if (!isPolling) return;

        // Auto-negotiate with active peers if not connected yet!
        if (response.active_peers && response.active_peers.length > 0) {
          const peer = response.active_peers[0];
          setRemotePeerName(peer.name || "Participant");

          const isInitiator = participantId < peer.id;
          const pc = pcRef.current;

          // If we have an active peer and WebRTC is not connected yet, initiate!
          if (
            isInitiator &&
            (!pc || (pc.connectionState !== "connected" && pc.signalingState === "stable")) &&
            !remoteStream &&
            !isNegotiatingRef.current
          ) {
            await startCallAsInitiator(peer.id);
          }
        }

        for (const msg of response.messages) {
          if (msg.sender_id === participantId) continue;

          switch (msg.type) {
            case "peer-joined": {
              setRemotePeerName(msg.sender_name || "Participant");
              showToast("info", `${msg.sender_name || "A participant"} entered the room`);
              await startCallAsInitiator(msg.sender_id);
              break;
            }

            case "offer": {
              setRemotePeerName(msg.sender_name || "Participant");
              const pc = getOrCreatePeerConnection();
              const isPolite = participantId < msg.sender_id;
              if (pc.signalingState !== "stable") {
                if (!isPolite) break;
                await pc.setLocalDescription({ type: "rollback" } as any);
              }
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await drainIceCandidates(pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignalMessage("answer", answer, msg.sender_id);
              break;
            }

            case "answer": {
              const pc = getOrCreatePeerConnection();
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
                await drainIceCandidates(pc);
              }
              break;
            }

            case "ice-candidate": {
              if (!msg.data) break;
              const pc = getOrCreatePeerConnection();
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(msg.data));
                } catch (e) {
                  console.warn("Error adding ICE candidate:", e);
                }
              } else {
                pendingIceCandidatesRef.current.push(msg.data);
              }
              break;
            }

            case "chat": {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: msg.sender_name,
                  text: msg.data.text,
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]);
              break;
            }

            case "media-state": {
              if (msg.data.type === "audio") setRemoteAudioMuted(!msg.data.enabled);
              if (msg.data.type === "video") setRemoteVideoMuted(!msg.data.enabled);
              break;
            }

            case "leave": {
              showToast("info", `${msg.sender_name || "Participant"} left the meeting`);
              setRemoteStream(null);
              remoteStreamAccumulatorRef.current = new MediaStream();
              setRemotePeerName(null);
              setConnectionState("waiting");
              if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
              }
              break;
            }
          }
        }
      } catch (err) {
        // Polling retry
      } finally {
        if (isPolling) {
          setTimeout(pollSignals, 1000);
        }
      }
    };

    pollSignals();

    return () => {
      isPolling = false;
    };
  }, [hasJoined, meetingCode, participantId, displayName, sendSignalMessage, startCallAsInitiator, getOrCreatePeerConnection, drainIceCandidates, remoteStream]);


  // Gracefully leave room on tab close
  useEffect(() => {
    if (!meetingCode || !participantId) return;

    const handleBeforeUnload = () => {
      api.leaveRoom(meetingCode, participantId).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      api.leaveRoom(meetingCode, participantId).catch(() => {});
    };
  }, [meetingCode, participantId]);

  // Join handler
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      setIsJoining(true);
      const res = await api.joinMeeting(meetingCode, displayName.trim()).catch(() => null);
      if (res) {
        setMeeting(res.meeting);
        setParticipants((prev) => [...prev, res.participant]);
      }
      setHasJoined(true);
    } catch {
      setHasJoined(true);
    } finally {
      setIsJoining(false);
    }
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        sendSignalMessage("media-state", { type: "audio", enabled: audioTrack.enabled });
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        sendSignalMessage("media-state", { type: "video", enabled: videoTrack.enabled });
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      if (pcRef.current && localStream) {
        const cameraTrack = localStream.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && cameraTrack) {
          videoSender.replaceTrack(cameraTrack);
        }
      }
      if (localCallVideoRef.current && localStream) {
        localCallVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (localCallVideoRef.current) {
          localCallVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localCallVideoRef.current && localStream) {
            localCallVideoRef.current.srcObject = localStream;
          }
          if (pcRef.current && localStream) {
            const cameraTrack = localStream.getVideoTracks()[0];
            const senders = pcRef.current.getSenders();
            const videoSender = senders.find((s) => s.track && s.track.kind === "video");
            if (videoSender && cameraTrack) {
              videoSender.replaceTrack(cameraTrack);
            }
          }
        };

        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    const link = getShareableLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setIsCopied(true);
    showToast("info", "Meeting invite link copied to clipboard");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage.trim();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: displayName,
        text: msgText,
        time: timeStr,
      },
    ]);

    sendSignalMessage("chat", { text: msgText });
    setNewMessage("");
  };

  // Leave meeting
  const handleLeaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    api.leaveRoom(meetingCode, participantId).catch(() => {});
    setHasJoined(false);
    router.push("/");
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#2A2B2D]">
        <ZoomLogo width={120} height={28} className="mb-4" />
        <p className="text-sm text-gray-500 font-medium">Connecting to Zoom Workplace...</p>
      </div>
    );
  }

  const activeMeeting: Meeting = meeting || {
    id: 0,
    meeting_code: meetingCode,
    title: "Zoom Workplace Meeting",
    description: null,
    meeting_type: "instant",
    status: "active",
    scheduled_at: null,
    duration: null,
    meeting_link: typeof window !== "undefined" ? `${window.location.origin}/meeting/${meetingCode}` : "",
    created_at: new Date().toISOString(),
    participants: [],
  };

  // ─────────────────────────────────────────────────────────────
  // 1. ZOOM WORKPLACE PRE-JOIN LOBBY SCREEN (Pure Zoom Aesthetics)
  // ─────────────────────────────────────────────────────────────
  if (!hasJoined) {
    return (
      <div
        className="min-h-screen bg-[#F7F9FA] text-[#2A2B2D] flex flex-col justify-between"
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        {/* Top Header */}
        <header className="h-16 px-6 bg-white border-b border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZoomLogo width={100} height={24} />
            <span className="text-xs text-gray-400 font-medium border-l border-gray-300 pl-3">
              Web Client
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>Meeting ID: <strong className="text-black font-mono">{activeMeeting.meeting_code}</strong></span>
          </div>
        </header>

        {/* Center Container */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Device Video Preview */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="relative w-full aspect-video rounded-xl bg-[#1A1A1A] overflow-hidden flex items-center justify-center shadow-inner">
                <video
                  ref={(el) => {
                    localPreviewRef.current = el;
                    if (el && localStream && el.srcObject !== localStream) {
                      el.srcObject = localStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoEnabled ? "block" : "hidden"}`}
                />

                {!isVideoEnabled && (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-20 h-20 rounded-full bg-[#2D3748] flex items-center justify-center text-white text-3xl font-semibold mb-2 shadow-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400">Video is off</span>
                  </div>
                )}

                {/* In-preview Media Toggles (Zoom-style pills) */}
                <div className="absolute bottom-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`p-2 rounded-full transition-colors ${
                      isAudioEnabled ? "text-white hover:bg-white/20" : "bg-[#E02828] text-white"
                    }`}
                    title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`p-2 rounded-full transition-colors ${
                      isVideoEnabled ? "text-white hover:bg-white/20" : "bg-[#E02828] text-white"
                    }`}
                    title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                  >
                    {isVideoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Join Form */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-5 text-left">
              <div>
                <h1 className="text-2xl font-bold text-[#0D213F]">
                  Ready to join?
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your audio and video settings before joining.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="flex flex-col">
                  <label
                    htmlFor="zoom-display-name"
                    className="text-xs font-semibold text-gray-700 mb-1.5"
                  >
                    Your Display Name
                  </label>
                  <input
                    id="zoom-display-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-10 px-3.5 text-sm bg-white border border-[#C1C6CE] rounded-xl text-[#2A2B2D] focus:outline-none focus:border-[#0D6BDE]"
                  />
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!isAudioEnabled}
                      onChange={(e) => setIsAudioEnabled(!e.target.checked)}
                      className="rounded border-gray-300 text-[#0D6BDE] focus:ring-0 cursor-pointer"
                    />
                    <span>Don&apos;t connect to audio</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!isVideoEnabled}
                      onChange={(e) => setIsVideoEnabled(!e.target.checked)}
                      className="rounded border-gray-300 text-[#0D6BDE] focus:ring-0 cursor-pointer"
                    />
                    <span>Turn off my video</span>
                  </label>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={!displayName.trim() || isJoining}
                    className="w-full h-10 bg-[#0D6BDE] hover:bg-[#0b5ecc] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    {isJoining ? "Joining..." : "Join"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Link Copied" : "Copy Invite Link"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-gray-500">
          Zoom Workplace • End-to-End Encrypted Web Client
        </footer>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ZOOM WORKPLACE LIVE MEETING ROOM (Classic Zoom Meeting UI)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen w-screen bg-[#1A1A1A] text-white flex flex-col overflow-hidden select-none"
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      {/* Top Zoom Workplace Header */}
      <header className="h-12 px-4 bg-[#1A1A1A] flex items-center justify-between shrink-0 z-20 border-b border-white/5">
        {/* Left: Green Shield Lock & Title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSecurityModal(!showSecurityModal)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-emerald-400 text-xs transition-colors cursor-pointer"
            title="Meeting Information"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Zoom Workplace</span>
          </button>
          <span className="text-xs text-gray-400 font-mono">
            {activeMeeting.meeting_code}
          </span>
        </div>

        {/* Center: Meeting Duration Timer */}
        <div className="text-xs font-mono text-gray-400">
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Right: View Toggle & Invite Link */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 rounded-md text-xs text-gray-200 transition-colors cursor-pointer"
            title="Copy Meeting Invite Link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
            title="Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Security Info Popup Modal */}
      {showSecurityModal && (
        <div className="absolute top-12 left-4 z-50 bg-[#2D2D2D] border border-white/10 rounded-xl p-4 shadow-2xl w-80 text-xs text-gray-300 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-bold text-white flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Enhanced Encryption
            </span>
            <button
              onClick={() => setShowSecurityModal(false)}
              className="text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400 block">Meeting ID:</span>
              <span className="text-white font-mono">{activeMeeting.meeting_code}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Host:</span>
              <span className="text-white">{displayName}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Invite Link:</span>
              <button
                onClick={handleCopyLink}
                className="text-[#0E72ED] hover:underline flex items-center gap-1 mt-0.5"
              >
                Copy Link <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Video View & Side Drawer Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid Area */}
        <main className="flex-1 p-3 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* 1. Local Video Tile */}
            <div className="relative w-full h-full min-h-[220px] rounded-lg bg-[#242424] border border-black shadow-lg overflow-hidden flex items-center justify-center">
              <video
                ref={(el) => {
                  localCallVideoRef.current = el;
                  const activeStream = isScreenSharing && screenTrackRef.current
                    ? new MediaStream([screenTrackRef.current])
                    : localStream;
                  if (el && activeStream && el.srcObject !== activeStream) {
                    el.srcObject = activeStream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoEnabled || isScreenSharing ? "block" : "hidden"}`}
              />

              {!isVideoEnabled && (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#0D6BDE] text-white flex items-center justify-center text-4xl font-semibold shadow-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Zoom-style Name Tag (Bottom Left Pill) */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                {!isAudioEnabled && <MicOff className="w-3 h-3 text-[#E02828]" />}
                <span>{displayName} (Me)</span>
              </div>
            </div>

            {/* 2. Remote Video Tile */}
            <div className="relative w-full h-full min-h-[220px] rounded-lg bg-[#242424] border border-black shadow-lg overflow-hidden flex items-center justify-center">
              {remoteStream ? (
                <>
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                        el.play().catch((err) => console.warn("Video play error:", err));
                      }
                    }}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${!remoteVideoMuted ? "block" : "hidden"}`}
                  />

                  {remoteVideoMuted && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#6B46C1] text-white flex items-center justify-center text-4xl font-semibold shadow-2xl">
                        {(remotePeerName || "P").charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                    {remoteAudioMuted && <MicOff className="w-3 h-3 text-[#E02828]" />}
                    <span>{remotePeerName || "Participant"}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-500">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Waiting for others to join...</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Share the meeting ID or invite link with other participants.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-1.5 bg-[#0D6BDE] hover:bg-[#0b5ecc] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Invite Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Side Panel: Chat or Participants (Zoom Workplace styling) */}
        {activeSidePanel !== "none" && (
          <aside className="w-80 border-l border-black bg-[#242424] flex flex-col z-20 shrink-0">
            {/* Header */}
            <div className="h-12 px-4 border-b border-black/40 flex items-center justify-between text-xs font-semibold text-gray-200">
              <span>{activeSidePanel === "chat" ? "Meeting Chat" : `Participants (${remotePeerName ? 2 : 1})`}</span>
              <button
                onClick={() => setActiveSidePanel("none")}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Content */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === displayName ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5">
                        <span className="font-semibold text-gray-300">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-lg max-w-[85%] break-words ${
                          msg.sender === displayName
                            ? "bg-[#0D6BDE] text-white"
                            : "bg-[#333333] text-gray-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-black/40 flex items-center gap-2 bg-[#1A1A1A]">
                  <input
                    type="text"
                    placeholder="Type message here..."
                    className="flex-1 bg-[#2D2D2D] border border-gray-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-[#0D6BDE]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-[#0D6BDE] hover:bg-[#0b5ecc] disabled:opacity-40 text-white rounded-lg cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Participants Content */}
            {activeSidePanel === "participants" && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {/* Local Participant */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#2D2D2D]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0D6BDE] flex items-center justify-center font-bold text-[10px]">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{displayName} (Host, me)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    {isAudioEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-[#E02828]" />}
                    {isVideoEnabled ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-[#E02828]" />}
                  </div>
                </div>

                {/* Remote Participant */}
                {remotePeerName && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#2D2D2D]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#6B46C1] flex items-center justify-center font-bold text-[10px]">
                        {remotePeerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{remotePeerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {remoteAudioMuted ? <MicOff className="w-3.5 h-3.5 text-[#E02828]" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                      {remoteVideoMuted ? <VideoOff className="w-3.5 h-3.5 text-[#E02828]" /> : <VideoIcon className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. THE ICONIC ZOOM WORKPLACE BOTTOM TOOLBAR                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="h-[72px] bg-[#242424] border-t border-black/40 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Audio & Video Controls */}
        <div className="flex items-center gap-1">
          {/* Mute Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleAudio}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                !isAudioEnabled ? "text-[#E02828]" : "text-gray-200"
              }`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5 text-gray-200" /> : <MicOff className="w-5 h-5 text-[#E02828]" />}
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {isAudioEnabled ? "Mute" : "Unmute"}
              </span>
            </button>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              title="Audio Settings"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Video Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                !isVideoEnabled ? "text-[#E02828]" : "text-gray-200"
              }`}
            >
              {isVideoEnabled ? <VideoIcon className="w-5 h-5 text-gray-200" /> : <VideoOff className="w-5 h-5 text-[#E02828]" />}
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {isVideoEnabled ? "Stop Video" : "Start Video"}
              </span>
            </button>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              title="Video Settings"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center: Main Zoom Controls (Security, Participants, Chat, Share, Record, Reactions) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Security */}
          <button
            type="button"
            onClick={() => setShowSecurityModal(!showSecurityModal)}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Security</span>
          </button>

          {/* Participants */}
          <button
            type="button"
            onClick={() => setActiveSidePanel((prev) => (prev === "participants" ? "none" : "participants"))}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded transition-colors cursor-pointer relative ${
              activeSidePanel === "participants" ? "bg-white/15 text-white" : "hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 bg-gray-600 text-white text-[9px] px-1 rounded-full font-bold">
                {remotePeerName ? 2 : 1}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Participants</span>
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={() => setActiveSidePanel((prev) => (prev === "chat" ? "none" : "chat"))}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeSidePanel === "chat" ? "bg-white/15 text-white" : "hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Chat</span>
          </button>

          {/* Share Screen (The iconic Zoom green button) */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded transition-colors cursor-pointer ${
              isScreenSharing ? "bg-[#E02828] text-white" : "hover:bg-white/10 text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <ScreenShare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </span>
          </button>

          {/* Record */}
          <button
            type="button"
            onClick={() => showToast("info", "Cloud recording is managed by host")}
            className="hidden md:flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <CircleDot className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Record</span>
          </button>

          {/* Reactions */}
          <button
            type="button"
            onClick={() => showToast("info", "👏 Reaction sent")}
            className="hidden sm:flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <Smile className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Reactions</span>
          </button>
        </div>

        {/* Right: End / Leave Button */}
        <div>
          <button
            type="button"
            onClick={handleLeaveMeeting}
            className="px-4 py-1.5 rounded-lg bg-[#E02828] hover:bg-[#C92020] text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
          >
            Leave
          </button>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
