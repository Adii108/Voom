"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Calendar,
  Link2,
  ArrowRight,
  Clock,
  Users,
  Copy,
  Check,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api, Meeting } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  // State
  const [joinCode, setJoinCode] = useState("");
  const [isInstantLoading, setIsInstantLoading] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  // Schedule Modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("30");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Lists
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  // Fetch Dashboard feeds
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoadingLists(true);
      const [upcoming, recent] = await Promise.all([
        api.getUpcomingMeetings().catch(() => []),
        api.getRecentMeetings().catch(() => []),
      ]);
      setUpcomingMeetings(upcoming);
      setRecentMeetings(recent);
    } catch {
      // Backend might be warming up or offline
    } finally {
      setIsLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handlers
  const handleStartInstant = async () => {
    try {
      setIsInstantLoading(true);
      const meeting = await api.createInstantMeeting();
      showToast("success", `Instant meeting created: ${meeting.meeting_code}`);
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create meeting"
      );
    } finally {
      setIsInstantLoading(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    // Clean code if full URL pasted
    let cleanCode = joinCode.trim();
    if (cleanCode.includes("/meeting/")) {
      cleanCode = cleanCode.split("/meeting/")[1];
    }

    try {
      setIsJoinLoading(true);
      const meeting = await api.getMeetingByCode(cleanCode);
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch {
      showToast("error", `Meeting '${cleanCode}' not found or invalid.`);
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError("");

    if (!scheduleTitle.trim()) {
      setScheduleError("Title is required");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      setScheduleError("Please select date and time");
      return;
    }

    try {
      setIsScheduling(true);
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledDateTime.getTime())) {
        setScheduleError("Invalid date/time selected");
        return;
      }

      await api.scheduleMeeting({
        title: scheduleTitle.trim(),
        description: scheduleDesc.trim() || undefined,
        scheduled_at: scheduledDateTime.toISOString(),
        duration: parseInt(scheduleDuration, 10),
      });

      showToast("success", "Meeting scheduled successfully!");
      setIsScheduleOpen(false);
      setScheduleTitle("");
      setScheduleDesc("");
      setScheduleDate("");
      setScheduleTime("");
      loadDashboardData();
    } catch (err) {
      setScheduleError(
        err instanceof Error ? err.message : "Failed to schedule meeting"
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCopyLink = (code: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    showToast("info", "Meeting link copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Banner / Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Video Collaboration</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Connect & collaborate <br />
              <span className="text-gradient">with zero friction.</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Create instant video meetings, schedule sessions with your team, or
              join with a single code. Designed for high performance and clarity.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={handleStartInstant}
                isLoading={isInstantLoading}
              >
                New Meeting
              </Button>

              <Button
                variant="outline"
                size="lg"
                icon={<Calendar className="w-5 h-5 text-indigo-400" />}
                onClick={() => setIsScheduleOpen(true)}
              >
                Schedule
              </Button>
            </div>
          </div>

          {/* Join Box Card */}
          <div className="lg:col-span-6">
            <Card className="p-8 border-indigo-500/20 bg-slate-900/60 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Join a Meeting
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter a meeting code or link to join instantly
                    </p>
                  </div>
                </div>

                <form onSubmit={handleJoinWithCode} className="space-y-4">
                  <Input
                    placeholder="e.g. VOM-482-917 or meeting link"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    leftIcon={<Link2 className="w-4 h-4" />}
                  />

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full justify-between"
                    disabled={!joinCode.trim() || isJoinLoading}
                    isLoading={isJoinLoading}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Join Session
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </section>

        {/* Feeds Section: Upcoming & Recent */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upcoming Meetings */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Upcoming Meetings
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {upcomingMeetings.length} Scheduled
              </span>
            </div>

            {isLoadingLists ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <Card className="p-8 text-center space-y-3 border-dashed border-white/10">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-400">
                  No upcoming meetings scheduled
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleOpen(true)}
                >
                  Schedule One Now
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <Card
                    key={m.id}
                    hoverable
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-indigo-500/10"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                          {m.meeting_code}
                        </span>
                        <h4 className="text-base font-semibold text-white">
                          {m.title || "Untitled Meeting"}
                        </h4>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {m.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {m.scheduled_at
                            ? new Date(m.scheduled_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Instant"}
                        </span>
                        {m.duration && (
                          <span>{m.duration} mins</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleCopyLink(m.meeting_code, m.meeting_link)}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl hover:bg-slate-700 transition-colors"
                        title="Copy meeting link"
                      >
                        {copiedCode === m.meeting_code ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => router.push(`/meeting/${m.meeting_code}`)}
                      >
                        Start
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Recent Meetings
                </h2>
              </div>
            </div>

            {isLoadingLists ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : recentMeetings.length === 0 ? (
              <Card className="p-8 text-center space-y-2 border-white/5">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-400">
                  No recent meeting history
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((m) => (
                  <Card key={m.id} className="p-4 space-y-2 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-indigo-300 font-medium">
                        {m.meeting_code}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200">
                      {m.title || "Instant Meeting"}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        {new Date(m.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => handleCopyLink(m.meeting_code, m.meeting_link)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule a Meeting"
        subtitle="Set up a meeting for a future date and share the link with participants."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Meeting Title"
            placeholder="e.g. Weekly Product Sync"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
              Description (Optional)
            </label>
            <textarea
              className="w-full bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 min-h-[80px]"
              placeholder="Add agenda or notes..."
              value={scheduleDesc}
              onChange={(e) => setScheduleDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
              Duration
            </label>
            <select
              className="w-full bg-slate-900/80 border border-slate-800 text-slate-100 text-sm rounded-xl p-3 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              value={scheduleDuration}
              onChange={(e) => setScheduleDuration(e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>

          {scheduleError && (
            <p className="text-xs text-red-400 font-medium">{scheduleError}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isScheduling}
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
