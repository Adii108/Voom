"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, Video, ShieldCheck, Lock } from "lucide-react";
import { api, Meeting, SchedulePayload } from "@/lib/api";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingScheduled: (meeting: Meeting) => void;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  onMeetingScheduled,
}: ScheduleMeetingModalProps) {
  const [topic, setTopic] = useState("Aditya Umre's Zoom Meeting");
  const [description, setDescription] = useState("");
  
  // Format today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  
  // Default time: next upcoming half-hour
  const nextHour = new Date(Date.now() + 30 * 60 * 1000);
  const timeStr = `${String(nextHour.getHours()).padStart(2, "0")}:${String(
    Math.floor(nextHour.getMinutes() / 15) * 15
  ).padStart(2, "0")}`;
  const [time, setTime] = useState(timeStr);
  
  const [duration, setDuration] = useState("30");
  const [passcode, setPasscode] = useState("654321");
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please provide a meeting topic.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build scheduled_at ISO timestamp
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      const payload: SchedulePayload = {
        title: topic.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledDateTime.toISOString(),
        duration: parseInt(duration, 10),
      };

      const meeting = await api.scheduleMeeting(payload);
      onMeetingScheduled(meeting);
      onClose();
    } catch (err: any) {
      console.error("Failed to schedule meeting:", err);
      setError(err?.message || "Failed to schedule meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#E1E4EA]"
        style={{
          fontFamily:
            'system-ui, Roboto, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", Arial, sans-serif',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4EA] bg-[#F7F9FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E71EB]/10 flex items-center justify-center text-[#0E71EB]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#131619]">
                Schedule Meeting
              </h2>
              <p className="text-xs text-[#667085]">
                Plan ahead and send invitations to participants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#667085] hover:text-[#131619] hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Weekly Product Sync"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] placeholder-[#98A2B3] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda, goals, and preparation notes..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] placeholder-[#98A2B3] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all resize-none"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#344054]">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#344054]">
                Start Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D0D5DD] rounded-xl text-[#131619] focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-[#0E71EB]/20 transition-all cursor-pointer"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1 hour 30 minutes</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Meeting ID Section */}
          <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] space-y-2">
            <div className="text-xs font-semibold text-[#344054]">Meeting ID</div>
            <div className="flex items-center gap-2 text-xs text-[#475467]">
              <input
                type="radio"
                name="meetingIdType"
                id="generateAuto"
                defaultChecked
                className="text-[#0E71EB] focus:ring-[#0E71EB]"
              />
              <label htmlFor="generateAuto" className="font-medium cursor-pointer">
                Generate Automatically (Unique high-entropy meeting link)
              </label>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-3 p-3.5 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#344054]">
              <ShieldCheck className="w-4 h-4 text-[#0E71EB]" />
              <span>Security</span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#344054]">
              <label htmlFor="waitingRoomToggle" className="cursor-pointer">
                Waiting Room
              </label>
              <input
                type="checkbox"
                id="waitingRoomToggle"
                checked={waitingRoom}
                onChange={(e) => setWaitingRoom(e.target.checked)}
                className="w-4 h-4 text-[#0E71EB] rounded focus:ring-[#0E71EB]"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#344054]">
              <label htmlFor="passcodeToggle" className="cursor-pointer">
                Passcode
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-28 px-2 py-1 text-xs border border-[#D0D5DD] rounded-lg text-center font-mono focus:outline-none focus:border-[#0E71EB]"
              />
            </div>
          </div>

          {/* Video Options */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] space-y-1.5">
              <span className="font-semibold text-[#344054]">Host Video</span>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="hostVideo"
                    checked={hostVideo}
                    onChange={() => setHostVideo(true)}
                  />
                  <span>On</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="hostVideo"
                    checked={!hostVideo}
                    onChange={() => setHostVideo(false)}
                  />
                  <span>Off</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] space-y-1.5">
              <span className="font-semibold text-[#344054]">Participant Video</span>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="partVideo"
                    checked={participantVideo}
                    onChange={() => setParticipantVideo(true)}
                  />
                  <span>On</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="partVideo"
                    checked={!participantVideo}
                    onChange={() => setParticipantVideo(false)}
                  />
                  <span>Off</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E4EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-[#475467] hover:text-[#131619] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0E71EB] hover:bg-[#005CE6] active:bg-[#004BB8] rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Scheduling..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
