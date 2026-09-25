"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Sparkles,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Maximize2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api, Meeting, Participant } from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingCode = (params?.meetingId as string) || "";

  // Data state
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-join vs In-meeting state
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("Aditya");
  const [isJoining, setIsJoining] = useState(false);

  // In-call controls
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<
    "none" | "participants" | "chat"
  >("none");

  // Call timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "System",
      text: "Welcome to the meeting! Chat messages sent here will be visible to everyone.",
      time: "Just now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  // Fetch meeting details
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
        setError(
          err instanceof Error
            ? err.message
            : "Meeting not found or invalid code."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingCode]);

  // Call timer effect
  useEffect(() => {
    if (!hasJoined) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasJoined]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeSidePanel]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to join meeting"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyLink = () => {
    if (!meeting) return;
    navigator.clipboard.writeText(meeting.meeting_link);
    setIsCopied(true);
    showToast("info", "Meeting link copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: displayName,
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const handleLeaveMeeting = () => {
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
          <p className="text-sm font-medium text-slate-400">
            Connecting to meeting room...
          </p>
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
            <p className="text-sm text-slate-400 mt-2">
              {error || "Could not find meeting with code: " + meetingCode}
            </p>
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
              {isVideoEnabled ? (
                <div className="relative w-full h-full bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-slate-900 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20">
                    {displayName.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="absolute bottom-4 left-4 text-xs font-medium text-slate-300 bg-slate-950/70 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                    Camera preview on
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-500">Camera is turned off</p>
                </div>
              )}

              {/* In-preview Media Toggles */}
              <div className="absolute bottom-4 flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isAudioEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-red-600/90 hover:bg-red-600 text-white"
                  }`}
                  title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isVideoEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-red-600/90 hover:bg-red-600 text-white"
                  }`}
                  title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                  {isVideoEnabled ? (
                    <VideoIcon className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Meeting info & Join form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                Ready to join?
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {meeting.title || "Instant Meeting"}
              </h1>
              {meeting.description && (
                <p className="text-sm text-slate-400">{meeting.description}</p>
              )}
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
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isJoining}
                >
                  Join Meeting Now
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={handleCopyLink}
                  icon={
                    isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  Copy Shareable Link
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
              <span>{participants.length} participants already joined</span>
              <span>Encrypted Room</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600">
          Voom Video Platform • End-to-End Encrypted Session
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. IN-CALL MEETING ROOM
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
        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-white/5 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer border border-white/5"
            title="Copy invite link"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Invite Link</span>
          </button>
        </div>
      </header>

      {/* Main Video View & Side Drawer Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid Area */}
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-6xl max-h-[780px] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* 1. Local Participant Tile */}
            <div className="relative w-full h-full min-h-[240px] rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden flex items-center justify-center group">
              {isVideoEnabled ? (
                <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <VideoOff className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500">Video paused</p>
                </div>
              )}

              {/* Tile Overlay Tags */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs text-white">
                <span>{displayName} (You)</span>
                {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>

            {/* 2. Mock Participant / Screen Share Tile */}
            <div className="relative w-full h-full min-h-[240px] rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
              {isScreenSharing ? (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <ScreenShare className="w-12 h-12 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-semibold text-white">
                    You are sharing your screen
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Participants can see your application window or entire desktop.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950/30 flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-3xl font-bold text-purple-200">
                    S
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs text-white">
                    <span>Scaler AI Evaluator</span>
                  </div>
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
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
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
                      className={`space-y-1 ${
                        msg.sender === displayName ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {msg.sender}
                        </span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`text-xs p-3 rounded-2xl ${
                          msg.sender === displayName
                            ? "bg-indigo-600 text-white rounded-tr-none ml-6"
                            : "bg-slate-800 text-slate-200 rounded-tl-none mr-6"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/5 flex items-center gap-2"
                >
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
                  In this meeting ({participants.length + 1})
                </div>

                {/* You */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {displayName} (Host, You)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {isAudioEnabled ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Other participants */}
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-600/40 flex items-center justify-center text-xs font-bold text-purple-200">
                        {p.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-300">
                        {p.display_name}
                      </span>
                    </div>
                    <Mic className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Action Controls Bar */}
      <footer className="h-20 border-t border-white/5 bg-[#0B0F19]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
        {/* Left: Meeting info */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">
            {meeting.title || "Meeting"}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-mono text-slate-400">
            {meeting.meeting_code}
          </span>
        </div>

        {/* Center: Essential Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Mic */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isAudioEnabled
                ? "bg-slate-800/90 hover:bg-slate-700 text-white"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
            }`}
            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isVideoEnabled
                ? "bg-slate-800/90 hover:bg-slate-700 text-white"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
            }`}
            title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoEnabled ? (
              <VideoIcon className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
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
            onClick={() =>
              setActiveSidePanel((prev) => (prev === "chat" ? "none" : "chat"))
            }
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSidePanel === "chat"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
            title="Toggle Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() =>
              setActiveSidePanel((prev) =>
                prev === "participants" ? "none" : "participants"
              )
            }
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeSidePanel === "participants"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
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
