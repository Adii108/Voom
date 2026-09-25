"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, ArrowRight, ArrowLeft, Link2 } from "lucide-react";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;

    let cleanCode = meetingCode.trim();
    if (cleanCode.includes("/meeting/")) {
      cleanCode = cleanCode.split("/meeting/")[1];
    }

    try {
      setIsLoading(true);
      const meeting = await api.getMeetingByCode(cleanCode);
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch {
      showToast("error", `Meeting '${cleanCode}' not found. Please check the code.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full p-8 border-white/10 shadow-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Video className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Join a Meeting
            </h1>
            <p className="text-xs text-slate-400">
              Enter the code or meeting URL shared by the host
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Meeting Code or Link"
              placeholder="e.g. VOM-123-456"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              leftIcon={<Link2 className="w-4 h-4" />}
              autoFocus
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-between"
              disabled={!meetingCode.trim() || isLoading}
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Join Room
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </Link>
            </div>
          </form>
        </Card>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600">
        Voom Video Collaboration Platform
      </footer>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
