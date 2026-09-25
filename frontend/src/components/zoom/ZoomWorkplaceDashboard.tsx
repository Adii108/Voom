"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Calendar,
  Share2,
  Clock,
  Settings as SettingsIcon,
  Search,
  Copy,
  Check,
  Play,
  Users,
  ChevronDown,
  MonitorUp,
  MessageSquare,
  CalendarDays,
  PenTool,
  Home,
  LogOut,
  Info,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";

import { api, Meeting, generateUniqueRoomCode } from "@/lib/api";
import { ScheduleMeetingModal } from "./ScheduleMeetingModal";
import { InstantMeetingModal } from "./InstantMeetingModal";
import { SettingsModal } from "./SettingsModal";
import { AboutZoomModal } from "./AboutZoomModal";
import { LanguageDropdown } from "./LanguageDropdown";
import { ZoomWorkplaceLogo } from "./ZoomWorkplaceLogo";

interface ZoomWorkplaceDashboardProps {
  onSwitchToPublic?: () => void;
}

export function ZoomWorkplaceDashboard({
  onSwitchToPublic,
}: ZoomWorkplaceDashboardProps) {
  const router = useRouter();

  // Meetings state
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isInstantOpen, setIsInstantOpen] = useState(false);
  const [instantMeetingData, setInstantMeetingData] = useState<Meeting | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("Aditya Umre");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("English");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch upcoming and recent meetings
  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const [upcoming, recent] = await Promise.allSettled([
        api.getUpcomingMeetings(),
        api.getRecentMeetings(),
      ]);

      if (upcoming.status === "fulfilled") {
        setUpcomingMeetings(upcoming.value);
      }
      if (recent.status === "fulfilled") {
        setRecentMeetings(recent.value);
      }
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyLink = (code: string, link: string) => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/meeting/${code}`
        : link;

    try {
      navigator.clipboard.writeText(fullUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedCode(code);
    showToast(`Copied meeting invite link for ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Instant meeting handler
  const handleStartInstantMeeting = async () => {
    try {
      const meeting = await api.createInstantMeeting();
      setInstantMeetingData(meeting);
      setIsInstantOpen(true);
      fetchMeetings();
    } catch (err) {
      // Fallback: client generated code
      const newCode = generateUniqueRoomCode();
      const fallbackMeeting: Meeting = {
        id: Date.now(),
        meeting_code: newCode,
        title: "Instant Meeting",
        description: null,
        meeting_type: "instant",
        status: "waiting",
        scheduled_at: null,
        duration: null,
        meeting_link: `${window.location.origin}/meeting/${newCode}`,
        created_at: new Date().toISOString(),
        participants: [],
      };
      setInstantMeetingData(fallbackMeeting);
      setIsInstantOpen(true);
    }
  };

  // Join meeting handler
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    let clean = joinCodeInput.trim();
    if (clean.includes("/meeting/")) {
      clean = clean.split("/meeting/")[1];
    }
    clean = clean.split("?")[0].split("#")[0].trim().toLowerCase();

    try {
      setIsJoining(true);
      setJoinError(null);

      // Validate existence
      await api.getMeetingByCode(clean);
      setIsJoinOpen(false);
      router.push(`/meeting/${clean}`);
    } catch (err: any) {
      // Even if unlisted in DB, allow joining room directly to ensure zero friction
      setIsJoinOpen(false);
      router.push(`/meeting/${clean}`);
    } finally {
      setIsJoining(false);
    }
  };

  // Format date helper
  const formatMeetingDate = (dateStr: string | null) => {
    if (!dateStr) return "Flexible time";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F4F6F9] text-[#131619] flex flex-col justify-between select-none"
      style={{
        fontFamily:
          'system-ui, Roboto, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", Arial, sans-serif',
      }}
    >
      {/* Toast Notification */}
      <div className="fixed top-5 right-5 z-[9999]">
        {toastMessage && (
          <div className="bg-[#0D213F] text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700/50 flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00A859]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* TOP NAVBAR (Zoom Workplace Navbar) */}
      <header className="sticky top-0 z-40 w-full h-14 bg-white border-b border-[#E1E4EA] px-4 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand Logo & Global Search */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => router.push("/")}
            className="cursor-pointer flex items-center"
            title="Zoom Workplace Home"
          >
            <ZoomWorkplaceLogo width={160} height={32} />
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 bg-[#F2F4F7] hover:bg-[#EAECF0] transition-colors rounded-xl px-3.5 py-1.5 w-72 text-[#667085] text-xs">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search meetings, contacts, chats (Ctrl+K)"
              className="bg-transparent text-xs text-[#131619] placeholder-[#98A2B3] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
          <button className="flex items-center gap-1.5 px-3 py-2 text-[#0E71EB] border-b-2 border-[#0E71EB]">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[#475467] hover:text-[#131619] hover:bg-black/5 rounded-lg transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Team Chat</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[#475467] hover:text-[#131619] hover:bg-black/5 rounded-lg transition-colors">
            <Video className="w-4 h-4" />
            <span>Meetings</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[#475467] hover:text-[#131619] hover:bg-black/5 rounded-lg transition-colors">
            <CalendarDays className="w-4 h-4" />
            <span>Calendar</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[#475467] hover:text-[#131619] hover:bg-black/5 rounded-lg transition-colors">
            <PenTool className="w-4 h-4" />
            <span>Whiteboard</span>
          </button>
        </nav>

        {/* Right: Actions, Settings Cog & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Refresh Data */}
          <button
            onClick={fetchMeetings}
            title="Refresh Meetings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#131619] hover:bg-black/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {/* Settings cog */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#0E71EB] hover:bg-[#0E71EB]/10 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* User Profile Avatar with Online Dot */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-black/5 transition-all focus:outline-none"
            >
              <div className="relative w-8 h-8 rounded-full bg-[#0E71EB] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <span>AU</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00A859] border-2 border-white rounded-full" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E1E4EA] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2.5 border-b border-[#F0F2F5]">
                  <div className="text-xs font-semibold text-[#131619]">Aditya Umre</div>
                  <div className="text-[11px] text-[#667085]">aditya.umre@zoom.us</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Licensed Account</span>
                  </div>
                </div>

                <div className="py-1 text-xs text-[#344054]">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <SettingsIcon className="w-4 h-4 text-[#667085]" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsAboutOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <Info className="w-4 h-4 text-[#667085]" />
                    <span>About Zoom</span>
                  </button>

                  {onSwitchToPublic && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSwitchToPublic();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left border-t border-[#F0F2F5] mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Switch to Public View / Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HERO SECTION: The 4 Iconic Zoom Action Tiles + Digital Clock Card */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT 7 COLS: The 4 Iconic Zoom Workplace Quick-Action Buttons */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E1E4EA] shadow-xs flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-md mx-auto sm:max-w-none">
              {/* 1. NEW MEETING (Orange) */}
              <div className="flex flex-col items-center gap-2.5 group">
                <button
                  onClick={handleStartInstantMeeting}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#F26D21] hover:bg-[#E05C10] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg shadow-[#F26D21]/25 transition-all cursor-pointer group-hover:-translate-y-1"
                  aria-label="New Meeting"
                >
                  <Video className="w-9 h-9 sm:w-10 sm:h-10" />
                </button>
                <span className="text-xs sm:text-sm font-semibold text-[#131619] tracking-tight">
                  New Meeting
                </span>
              </div>

              {/* 2. JOIN MEETING (Blue) */}
              <div className="flex flex-col items-center gap-2.5 group">
                <button
                  onClick={() => setIsJoinOpen(true)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#0E71EB] hover:bg-[#005CE6] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg shadow-[#0E71EB]/25 transition-all cursor-pointer group-hover:-translate-y-1"
                  aria-label="Join Meeting"
                >
                  <Plus className="w-10 h-10 sm:w-11 sm:h-11" />
                </button>
                <span className="text-xs sm:text-sm font-semibold text-[#131619] tracking-tight">
                  Join
                </span>
              </div>

              {/* 3. SCHEDULE MEETING (Blue) */}
              <div className="flex flex-col items-center gap-2.5 group">
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#0E71EB] hover:bg-[#005CE6] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg shadow-[#0E71EB]/25 transition-all cursor-pointer group-hover:-translate-y-1"
                  aria-label="Schedule Meeting"
                >
                  <Calendar className="w-8 h-8 sm:w-9 sm:h-9" />
                </button>
                <span className="text-xs sm:text-sm font-semibold text-[#131619] tracking-tight">
                  Schedule
                </span>
              </div>

              {/* 4. SHARE SCREEN (Blue) */}
              <div className="flex flex-col items-center gap-2.5 group">
                <button
                  onClick={() => {
                    setIsJoinOpen(true);
                    showToast("Enter meeting ID to share your screen");
                  }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#0E71EB] hover:bg-[#005CE6] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg shadow-[#0E71EB]/25 transition-all cursor-pointer group-hover:-translate-y-1"
                  aria-label="Share Screen"
                >
                  <MonitorUp className="w-8 h-8 sm:w-9 sm:h-9" />
                </button>
                <span className="text-xs sm:text-sm font-semibold text-[#131619] tracking-tight">
                  Share Screen
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Live Clock & Next Meeting Summary Widget */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0D213F] via-[#11294F] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background glow circle */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#0E71EB]/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                {currentTime
                  ? currentTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "00:00:00"}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300">
                {currentTime
                  ? currentTime.toLocaleDateString([], {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </div>
            </div>

            {/* Next upcoming meeting spotlight */}
            <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
              {upcomingMeetings.length > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 truncate">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0E71EB] bg-blue-900/60 px-2 py-0.5 rounded-md">
                      Next Up
                    </span>
                    <p className="text-xs font-semibold text-white truncate mt-1">
                      {upcomingMeetings[0].title || "Scheduled Meeting"}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {formatMeetingDate(upcomingMeetings[0].scheduled_at)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/meeting/${upcomingMeetings[0].meeting_code.toLowerCase()}`
                      )
                    }
                    className="px-4 py-2 bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>No upcoming meetings right now</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION: UPCOMING MEETINGS (Must Have Requirement) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E1E4EA] shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0E71EB]/10 flex items-center justify-center text-[#0E71EB]">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#131619]">
                Upcoming Meetings
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#475467]">
                {upcomingMeetings.length}
              </span>
            </div>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="text-xs font-semibold text-[#0E71EB] hover:text-[#005CE6] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-[#D0D5DD] rounded-2xl">
              <Calendar className="w-8 h-8 text-[#98A2B3] mx-auto" />
              <p className="text-sm font-semibold text-[#344054]">
                No upcoming meetings scheduled
              </p>
              <p className="text-xs text-[#667085]">
                Plan ahead by clicking Schedule to book your next session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0E71EB]">
                        {formatMeetingDate(m.scheduled_at)}
                      </span>
                      {m.duration && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EEF4FF] text-[#0E71EB]">
                          {m.duration} min
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#667085] bg-white px-2 py-0.5 rounded-md border border-[#E1E4EA]">
                        ID: {m.meeting_code}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#131619] truncate">
                      {m.title || "Zoom Meeting"}
                    </h3>

                    {m.description && (
                      <p className="text-xs text-[#667085] line-clamp-1">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleCopyLink(m.meeting_code, m.meeting_link)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-[#344054] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCode === m.meeting_code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#667085]" />
                          <span>Copy Invitation</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/meeting/${m.meeting_code.toLowerCase()}`)
                      }
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0E71EB] hover:bg-[#005CE6] text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: RECENT MEETINGS (Must Have Requirement) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E1E4EA] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#475467]/10 flex items-center justify-center text-[#475467]">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#131619]">
              Recent Meetings
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#475467]">
              {recentMeetings.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-[#D0D5DD] rounded-2xl">
              <Users className="w-8 h-8 text-[#98A2B3] mx-auto" />
              <p className="text-sm font-semibold text-[#344054]">
                No recent meeting history
              </p>
              <p className="text-xs text-[#667085]">
                Meetings you host or complete will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] hover:border-[#D0D5DD] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#0E71EB]">
                      {m.meeting_code}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {m.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#131619] truncate">
                    {m.title || "Instant Meeting"}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-[#667085] pt-1">
                    <span>
                      {new Date(m.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(m.meeting_code, m.meeting_link)}
                        className="text-[#0E71EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/meeting/${m.meeting_code.toLowerCase()}`)
                        }
                        className="text-xs font-semibold text-white bg-[#0E71EB] hover:bg-[#005CE6] px-3 py-1 rounded-lg"
                      >
                        Rejoin
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-[#E1E4EA] py-6 px-4 text-center text-xs text-[#667085] z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-[#0E71EB] transition-colors cursor-pointer"
            >
              About Zoom
            </button>
            <span className="text-slate-300">|</span>
            <div className="relative inline-block">
              <LanguageDropdown
                isOpen={isLanguageOpen}
                onToggle={() => setIsLanguageOpen(!isLanguageOpen)}
                onClose={() => setIsLanguageOpen(false)}
                currentLanguage={currentLanguage}
                onSelectLanguage={(lang) => {
                  setCurrentLanguage(lang);
                  setIsLanguageOpen(false);
                  showToast(`Language set to ${lang}`);
                }}
              />
            </div>
            {onSwitchToPublic && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={onSwitchToPublic}
                  className="hover:text-[#0E71EB] transition-colors cursor-pointer"
                >
                  Public Client View
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-[#98A2B3]">
            Copyright © 2026 Zoom Video Communications, Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onMeetingScheduled={(newMeeting) => {
          showToast(`Meeting "${newMeeting.title}" scheduled successfully!`);
          fetchMeetings();
        }}
      />

      {/* 2. Instant Meeting Created Modal */}
      <InstantMeetingModal
        isOpen={isInstantOpen}
        onClose={() => setIsInstantOpen(false)}
        meeting={instantMeetingData}
      />

      {/* 3. Join Meeting Modal */}
      {isJoinOpen && (
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsJoinOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-[#E1E4EA] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E1E4EA] pb-3">
              <h3 className="text-base font-bold text-[#131619]">Join a Meeting</h3>
              <button
                onClick={() => setIsJoinOpen(false)}
                className="text-[#667085] hover:text-[#131619]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#344054]">
                  Meeting ID or Personal Link Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. vom-842-910-sync or link"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] placeholder-[#98A2B3] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#344054]">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={joinDisplayName}
                  onChange={(e) => setJoinDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs text-[#344054]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                  <span>Remember my name for future meetings</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded text-[#0E71EB]" />
                  <span>Do not connect to audio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded text-[#0E71EB]" />
                  <span>Turn off my video</span>
                </label>
              </div>

              {joinError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {joinError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E4EA]">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim() || isJoining}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#0E71EB] hover:bg-[#005CE6] rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isJoining ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 5. About Zoom Modal */}
      <AboutZoomModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
