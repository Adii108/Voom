"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Settings, Mic, Video, Volume2, Shield, Bell, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "video" | "audio">("video");
  const [cameraActive, setCameraActive] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(65);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === "video") {
      let isMounted = true;
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then((stream) => {
          if (isMounted) {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
          }
        })
        .catch(() => {
          setCameraActive(false);
        });

      return () => {
        isMounted = false;
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setCameraActive(false);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] border border-[#E1E4EA]"
        style={{
          fontFamily:
            'system-ui, Roboto, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", Arial, sans-serif',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E1E4EA] bg-[#F7F9FC]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#0E71EB]" />
            <span className="text-sm font-semibold text-[#131619]">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#667085] hover:text-[#131619] hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-[#E1E4EA] bg-[#F9FAFB] p-3 space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "general"
                  ? "bg-[#0E71EB]/10 text-[#0E71EB] font-semibold"
                  : "text-[#475467] hover:bg-black/5"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "video"
                  ? "bg-[#0E71EB]/10 text-[#0E71EB] font-semibold"
                  : "text-[#475467] hover:bg-black/5"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setActiveTab("audio")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "audio"
                  ? "bg-[#0E71EB]/10 text-[#0E71EB] font-semibold"
                  : "text-[#475467] hover:bg-black/5"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
          </div>

          {/* Tab Pane */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#131619]">General Options</h3>
                <div className="space-y-3 text-xs text-[#344054]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Start Zoom Workplace when I start Windows</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Automatically copy invite link once the meeting starts</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Ask me to confirm when I leave a meeting</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Show my meeting connected time</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#131619]">Camera Preview</h3>
                <div className="w-full h-48 bg-[#131619] rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                  />
                  {!cameraActive && (
                    <div className="text-center text-slate-400 space-y-1">
                      <Video className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs">Camera preview unavailable or disabled</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-xs text-[#344054]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>HD video quality</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Mirror my video</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Touch up my appearance</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-[#131619]">Speaker & Microphone</h3>

                {/* Speaker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#344054]">Speaker</span>
                    <button
                      type="button"
                      onClick={() => {
                        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                        audio.play().catch(() => {});
                      }}
                      className="px-2.5 py-1 text-xs border border-[#D0D5DD] rounded-lg hover:bg-slate-50 text-[#0E71EB] font-medium"
                    >
                      Test Speaker
                    </button>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0E71EB] w-4/5" />
                  </div>
                </div>

                {/* Microphone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#344054]">Microphone</span>
                    <button
                      type="button"
                      onClick={() => setMicTesting(!micTesting)}
                      className={`px-2.5 py-1 text-xs border rounded-lg font-medium transition-colors ${
                        micTesting
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "border-[#D0D5DD] hover:bg-slate-50 text-[#0E71EB]"
                      }`}
                    >
                      {micTesting ? "Recording..." : "Test Mic"}
                    </button>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: micTesting ? "85%" : `${micVolume}%` }}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-[#344054]">
                    <input type="checkbox" defaultChecked className="rounded text-[#0E71EB]" />
                    <span>Automatically adjust microphone volume</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E1E4EA] bg-[#F7F9FC] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#0E71EB] hover:bg-[#005CE6] rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
