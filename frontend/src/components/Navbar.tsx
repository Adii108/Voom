"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Video, User, Clock } from "lucide-react";

export const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) +
          " • " +
          now.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Voom
            </span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Pro
            </span>
          </div>
        </Link>

        {/* Right side: Clock & User Info */}
        <div className="flex items-center gap-5">
          {/* Time display */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-white/5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTime || "Loading..."}</span>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-300" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0B0F19] rounded-full"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                Default User
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                user@voom.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
