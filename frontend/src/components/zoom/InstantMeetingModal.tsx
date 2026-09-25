"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Copy, ArrowRight, Video, ShieldCheck } from "lucide-react";
import { Meeting } from "@/lib/api";

interface InstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

export function InstantMeetingModal({
  isOpen,
  onClose,
  meeting,
}: InstantMeetingModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !meeting) return null;

  const meetingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/meeting/${meeting.meeting_code}`
      : meeting.meeting_link;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(meetingUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = meetingUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = () => {
    router.push(`/meeting/${meeting.meeting_code.toLowerCase()}`);
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E1E4EA]"
        style={{
          fontFamily:
            'system-ui, Roboto, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", Arial, sans-serif',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4EA] bg-[#F7F9FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F26D21]/15 flex items-center justify-center text-[#F26D21]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#131619]">
                Instant Meeting Ready
              </h2>
              <p className="text-xs text-[#667085]">
                Your unique meeting room has been generated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#667085] hover:text-[#131619] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl space-y-2">
            <div className="text-[11px] font-semibold text-[#475467] uppercase tracking-wider">
              Meeting ID
            </div>
            <div className="text-lg font-mono font-bold text-[#0E71EB]">
              {meeting.meeting_code}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#344054]">
              Shareable Invitation Link
            </label>
            <div className="flex items-center gap-2 bg-[#F2F4F7] border border-[#D0D5DD] rounded-xl p-2.5">
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="bg-transparent text-xs text-[#131619] font-mono flex-1 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#667085]">
              Anyone with this link can join directly from any modern browser.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E4EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#475467] hover:text-[#131619] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleJoin}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0E71EB] hover:bg-[#005CE6] active:bg-[#004BB8] rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Join Meeting Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
