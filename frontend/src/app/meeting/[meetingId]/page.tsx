"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ScreenShare,
  MessageSquare,
  Users,
  Copy,
  Check,
  Send,
  ArrowLeft,
  ShieldCheck,
  X,
  Radio,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api, Meeting, Participant } from "@/lib/api";
import { createPeerConnection } from "@/lib/webrtc";

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

  // Unique, session-stable participant ID for this browser tab in this meeting
  const participantIdRef = useRef<string>("");
  if (!participantIdRef.current) {
    if (typeof window !== "undefined") {
      const storageKey = `voom_pid_${meetingCode || "default"}`;
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

  // Meeting data state
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-join vs In-call state
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("Guest");
  const [isJoining, setIsJoining] = useState(false);

  // Media streams & tracks
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("waiting");

  // Media control toggles
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);

  // UI state
  const [activeSidePanel, setActiveSidePanel] = useState<"none" | "participants" | "chat">("none");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      sender: "System",
      text: "Welcome to Voom! Video and chat are live and encrypted.",
      time: "Just now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const isInitiatorRef = useRef<boolean>(false);

  // Video element refs
  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const localCallVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  // Compute public shareable URL using current window origin
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
        setError(null);
        const data = await api.getMeetingByCode(meetingCode);
        setMeeting(data);
        setParticipants(data.participants || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Meeting not found or invalid code.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingCode]);

  // 2. Request local camera/mic stream on mount (for lobby preview)
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
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch {
            // If mic or camera individually failed, attempt video only
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        streamInstance = stream;
        setLocalStream(stream);

        if (localPreviewRef.current) {
          localPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Media devices not accessible or permission denied:", err);
        showToast("error", "Camera or microphone permission required. Please allow device access.");
      }
    }

    initMedia();

    return () => {
      // Stop media tracks when leaving the component completely
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Bind local stream to in-call video element when joined
  useEffect(() => {
    if (hasJoined && localCallVideoRef.current && localStream) {
      localCallVideoRef.current.srcObject = localStream;
    }
  }, [hasJoined, localStream]);

  // Bind remote stream to remote video element
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

  // Drain queued ICE candidates once remote description is set
  const drainIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }
    }
  }, []);

  // WebRTC negotiation lock
  const isNegotiatingRef = useRef<boolean>(false);

  // Initialize or get RTCPeerConnection
  const getOrCreatePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = createPeerConnection({
      onTrack: (remoteMediaStream) => {
        setRemoteStream(remoteMediaStream);
        setConnectionState("connected");
      },
      onIceCandidate: (candidate) => {
        sendSignalMessage("ice-candidate", candidate.toJSON());
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        if (state === "disconnected" || state === "failed" || state === "closed") {
          setRemoteStream(null);
        }
      },
    });

    // Add local tracks to peer connection
    let hasTracks = false;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
        hasTracks = true;
      });
    }

    // If localStream is empty/in-use by another tab, add receive-only transceivers
    // so this session can still negotiate and receive video/audio!
    if (!hasTracks) {
      try {
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
      } catch (e) {
        console.warn("Transceiver fallback:", e);
      }
    }

    pcRef.current = pc;
    return pc;
  }, [localStream, sendSignalMessage]);

  // Start WebRTC offer as initiator
  const startCallAsInitiator = useCallback(async (targetId?: string | null) => {
    if (isNegotiatingRef.current) return;
    isNegotiatingRef.current = true;
    isInitiatorRef.current = true;
    const pc = getOrCreatePeerConnection();

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignalMessage("offer", offer, targetId);
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
    } finally {
      isNegotiatingRef.current = false;
    }
  }, [getOrCreatePeerConnection, sendSignalMessage]);

  // 5. Signaling Polling Loop (Active only when joined)
  useEffect(() => {
    if (!hasJoined || !meetingCode) return;

    let isPolling = true;

    // Send initial join announcement
    sendSignalMessage("join", { name: displayName });

    const pollSignals = async () => {
      if (!isPolling) return;
      try {
        const response = await api.getSignals(meetingCode, participantId, displayName);
        if (!isPolling) return;

        for (const msg of response.messages) {
          if (msg.sender_id === participantId) continue;

          switch (msg.type) {
            case "peer-joined": {
              setRemotePeerName(msg.sender_name || "Remote Participant");
              showToast("info", `${msg.sender_name || "A participant"} entered the room`);
              // Host / earlier participant initiates the WebRTC offer
              await startCallAsInitiator(msg.sender_id);
              break;
            }

            case "offer": {
              setRemotePeerName(msg.sender_name || "Remote Participant");
              const pc = getOrCreatePeerConnection();
              // Glare resolution via perfect negotiation tie-breaker:
              const isPolite = participantId < msg.sender_id;
              if (pc.signalingState !== "stable") {
                if (!isPolite) {
                  // Impolite peer ignores colliding offer; polite peer will handle ours
                  break;
                }
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
              showToast("info", `${msg.sender_name || "Remote participant"} left the call`);
              setRemoteStream(null);
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

    // Fast-poll on tab visibility change (recovering from background throttling)
    const handleVisibilityChange = () => {
      if (!document.hidden && isPolling) {
        pollSignals();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isPolling = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Do NOT call leaveRoom here; only call it on actual page departure
    };
  }, [hasJoined, meetingCode, participantId, displayName, sendSignalMessage, startCallAsInitiator, getOrCreatePeerConnection, drainIceCandidates]);

  // Gracefully leave room when tab closes or unmounts
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
      const res = await api.joinMeeting(meetingCode, displayName.trim());
      setMeeting(res.meeting);
      setParticipants((prev) => [...prev, res.participant]);
      setHasJoined(true);
      showToast("success", `Joined meeting as ${displayName}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to join meeting");
    } finally {
      setIsJoining(false);
    }
  };

  // Toggle Audio (Mute / Unmute)
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

  // Toggle Video (Camera on / off)
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
      // Revert back to camera track
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

        // Preview shared screen on local video element
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
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };


  // Copy shareable public link with reliable fallback
  const handleCopyLink = async () => {
    const link = getShareableLink();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        console.warn("Fallback copy failed:", e);
      }
      textArea.remove();
    }
    setIsCopied(true);
    showToast("info", "Public meeting link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Send in-meeting chat message
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

  // Leave Meeting
  const handleLeaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto animate-pulse">
            <VideoIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-400">Connecting to meeting room...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-5 border border-red-500/20">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Meeting Unavailable</h2>
            <p className="text-sm text-slate-400 mt-2">{error || `Could not find meeting code: ${meetingCode}`}</p>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. PRE-JOIN / LOBBY SCREEN
  // ─────────────────────────────────────────────────────────────
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-between p-4 sm:p-8">
        {/* Top bar */}
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">
              {meeting.meeting_code}
            </span>
          </div>
        </div>

        {/* Center Lobby Content */}
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
          {/* Left: Device preview tile */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center group">
              {/* Actual Camera Video Stream */}
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
                <div className="space-y-3 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-500">Camera preview is off</p>
                </div>
              )}

              {/* In-preview Media Toggles */}
              <div className="absolute bottom-4 flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isAudioEnabled ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                  title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isVideoEnabled ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                  title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                  {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Meeting info & Join form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Ready to join?</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{meeting.title || "Meeting Session"}</h1>
              {meeting.description && <p className="text-sm text-slate-400">{meeting.description}</p>}
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Your Display Name"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <div className="space-y-3 pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isJoining}>
                  Join Meeting Now
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={handleCopyLink}
                  icon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                >
                  {isCopied ? "Link Copied!" : "Copy Shareable Link"}
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
              <span>{participants.length} participants registered</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live WebRTC Room
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600">Voom WebRTC Platform • Direct Peer-to-Peer Encryption</div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. IN-CALL MEETING ROOM (LIVE WEBRTC)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-[#0B0F19] flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-16 px-6 border-b border-white/5 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {meeting.title || "Meeting Session"}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {meeting.meeting_code}
              </span>
            </h2>
          </div>
        </div>

        {/* Call Timer & Center Info */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/5 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{formatTimer(elapsedSeconds)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 capitalize">{connectionState}</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer border border-white/5"
            title="Copy public invite link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Invite Link</span>
          </button>
        </div>
      </header>

      {/* Main Video View & Side Drawer Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid Area */}
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-6xl max-h-[780px] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* 1. Local Participant Video Tile */}
            <div className="relative w-full h-full min-h-[240px] rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden flex items-center justify-center group">
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
                <div className="space-y-2 text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-3xl font-bold text-white shadow-2xl mx-auto">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs text-slate-500">Camera turned off</p>
                </div>
              )}

              {/* Local Participant Overlay Tag */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs text-white">
                <span>{displayName} (You)</span>
                {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>

            {/* 2. Remote Participant Video Tile */}
            <div className="relative w-full h-full min-h-[240px] rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
              {remoteStream ? (
                <>
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${!remoteVideoMuted ? "block" : "hidden"}`}
                  />

                  {remoteVideoMuted && (
                    <div className="space-y-2 text-center">
                      <div className="w-20 h-20 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-3xl font-bold text-purple-200 mx-auto">
                        {(remotePeerName || "G").charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-500">Camera is off</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs text-white">
                    <span>{remotePeerName || "Remote Peer"}</span>
                    {remoteAudioMuted && <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 animate-pulse">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Waiting for others to join...</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Share the invite link with your friend to connect instantly over WebRTC.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleCopyLink} icon={<Copy className="w-3.5 h-3.5" />}>
                    Copy Invite Link
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Side Panel: Chat or Participants */}
        {activeSidePanel !== "none" && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-slate-900/95 backdrop-blur-xl flex flex-col z-20 shrink-0">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeSidePanel === "chat" ? "Meeting Chat" : "Participants"}
              </h3>
              <button
                onClick={() => setActiveSidePanel("none")}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Content */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`space-y-1 flex flex-col ${msg.sender === displayName ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`text-xs p-3 rounded-2xl max-w-[85%] break-words ${
                          msg.sender === displayName
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-800 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Send a message to everyone..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={!newMessage.trim()}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            )}

            {/* Participants Content */}
            {activeSidePanel === "participants" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  Active in Call ({remotePeerName ? 2 : 1})
                </div>

                {/* Local Participant */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-white">{displayName} (You)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {isAudioEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>

                {/* Remote Participant */}
                {remotePeerName && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-600/40 flex items-center justify-center text-xs font-bold text-purple-200">
                        {remotePeerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-300">{remotePeerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {remoteAudioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Action Controls Bar */}
      <footer className="h-20 border-t border-white/5 bg-[#0B0F19]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
        {/* Left: Meeting info */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">{meeting.title || "Meeting"}</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-mono text-slate-400">{meeting.meeting_code}</span>
        </div>

        {/* Center: Essential Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isAudioEnabled ? "bg-slate-800/90 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
            }`}
            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isVideoEnabled ? "bg-slate-800/90 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
            }`}
            title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isScreenSharing
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white"
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveMeeting}
            className="p-3.5 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-bold hidden md:inline">Leave</span>
          </button>
        </div>

        {/* Right: Drawer toggles */}
        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <button
            onClick={() => setActiveSidePanel((prev) => (prev === "chat" ? "none" : "chat"))}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSidePanel === "chat" ? "bg-indigo-600 text-white" : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
            title="Toggle Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setActiveSidePanel((prev) => (prev === "participants" ? "none" : "participants"))}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSidePanel === "participants" ? "bg-indigo-600 text-white" : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
            title="Toggle Participants"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
