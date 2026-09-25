"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export default function SchedulePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide a meeting title");
      return;
    }
    if (!date || !time) {
      setError("Please select both a date and time");
      return;
    }

    try {
      setIsLoading(true);
      const scheduledDateTime = new Date(`${date}T${time}`);
      if (isNaN(scheduledDateTime.getTime())) {
        setError("Invalid date/time provided");
        return;
      }

      await api.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledDateTime.toISOString(),
        duration: parseInt(duration, 10),
      });

      showToast("success", "Meeting scheduled successfully!");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full p-8 sm:p-10 border-white/10 shadow-2xl space-y-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Schedule a Meeting
                </h1>
                <p className="text-xs text-slate-400">
                  Plan ahead and send invitation links to team members
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSchedule} className="space-y-5">
            <Input
              label="Meeting Title"
              placeholder="e.g. Q4 Strategy Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                Description (Optional)
              </label>
              <textarea
                className="w-full bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 min-h-[90px]"
                placeholder="Topics, agenda, preparation notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <Input
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                Estimated Duration
              </label>
              <select
                className="w-full bg-slate-900/80 border border-slate-800 text-slate-100 text-sm rounded-xl p-3 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Schedule & Create Link
              </Button>
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
