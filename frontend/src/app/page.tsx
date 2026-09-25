"use client";

import React, { useState } from "react";
import { ZoomWorkplaceDashboard } from "@/components/zoom/ZoomWorkplaceDashboard";
import { ZoomClientApp } from "@/components/zoom/ZoomClientApp";

export default function HomePage() {
  const [viewMode, setViewMode] = useState<"workplace" | "public">("workplace");

  if (viewMode === "public") {
    return <ZoomClientApp onGoToWorkplace={() => setViewMode("workplace")} />;
  }

  return (
    <ZoomWorkplaceDashboard onSwitchToPublic={() => setViewMode("public")} />
  );
}
