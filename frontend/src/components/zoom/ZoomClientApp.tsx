"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ZoomWorkplaceLogo } from "./ZoomWorkplaceLogo";
import { DownloadMobileCTA } from "./DownloadMobileCTA";
import { PrismButton } from "./PrismButton";
import { JoinMeetingModal } from "./JoinMeetingModal";
import { AboutZoomModal } from "./AboutZoomModal";
import { LanguageDropdown } from "./LanguageDropdown";
import { SignInView } from "./SignInView";

export type CapturedState =
  | "01_landing"
  | "02_join_meeting"
  | "03_sign_in"
  | "04_sign_up"
  | "05_about_zoom"
  | "06_language";

export interface ZoomClientAppProps {
  onGoToWorkplace?: () => void;
}

export function ZoomClientApp({ onGoToWorkplace }: ZoomClientAppProps = {}) {
  const router = useRouter();


  // Active state management
  const [activeState, setActiveState] = useState<CapturedState>("01_landing");
  const [currentLanguage, setCurrentLanguage] = useState("English");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal & dropdown visibility derived from activeState
  const isJoinModalOpen = activeState === "02_join_meeting";
  const isAboutModalOpen = activeState === "05_about_zoom";
  const isLanguageOpen = activeState === "06_language";
  const isSignUpActive = activeState === "04_sign_up";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div
      className="prism-light relative w-full min-h-screen bg-white text-[#2A2B2D] flex flex-col justify-between select-none overflow-x-hidden"
      style={{
        fontFamily:
          'system-ui, Roboto, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", Arial, sans-serif',
      }}
    >
      {/* Toast Notification Container matching #zm_ToastContainerID */}
      <div id="zm_ToastContainerID" className="Toastify fixed top-5 right-5 z-[9999]">
        {toastMessage && (
          <div className="bg-[#0D213F] text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </div>

      {activeState === "03_sign_in" ? (
        <SignInView onBack={() => setActiveState("01_landing")} />
      ) : (
        <>
          {/* Top Banner: Download the Zoom app CTA (Positioned top right) */}
          <header className="w-full flex justify-end p-4 lg:p-6 z-10">
            <DownloadMobileCTA />
          </header>

          {/* Main Hero & Action Section (Centered at 1440 × 900) */}
          <main className="flex-1 flex flex-col items-center justify-center -mt-10 px-4">
            {/* Zoom Workplace Brand Logo */}
            <div className="index-logo mb-10">
              <ZoomWorkplaceLogo width={300} height={116} />
            </div>

            {/* 3 Main Action Buttons Stack */}
            <div
              className="btns-index flex flex-col items-center"
              style={{ width: "240px" }}
            >
              {/* Sign In Button */}
              <PrismButton
                variant="primary-large"
                aria-label="Sign In"
                onClick={() => setActiveState("03_sign_in")}
              >
                Sign In
              </PrismButton>

              {/* Sign Up Button (margin-top 20px) */}
              <PrismButton
                variant="secondary-large"
                aria-label="Sign Up"
                isActive={isSignUpActive}
                className="mt-5"
                onClick={() => {
                  setActiveState("04_sign_up");
                  triggerToast("Sign Up state active (State 04)");
                }}
              >
                Sign Up
              </PrismButton>

              {/* Join Meeting Button (margin-top 20px) */}
              <PrismButton
                variant="secondary-large"
                aria-label="Join Meeting"
                className="mt-5"
                onClick={() => setActiveState("02_join_meeting")}
              >
                Join Meeting
              </PrismButton>
            </div>
          </main>

          {/* Footer Area: About Zoom | English (Positioned at bottom center, y ~ 840) */}
          <footer className="index__footer w-full flex items-center justify-center pb-8 pt-4 z-20">
            <div className="flex items-center gap-2">
              {/* About Zoom Button */}
              <PrismButton
                variant="footer-about"
                onClick={() => setActiveState("05_about_zoom")}
              >
                About Zoom
              </PrismButton>

              {/* Divider */}
              <div
                className="index__footer-divider select-none"
                style={{
                  width: "1px",
                  height: "14px",
                  backgroundColor: "rgb(209, 213, 219)",
                  margin: "0 4px",
                }}
                aria-hidden="true"
              />

              {/* Language Selector Dropdown */}
              <LanguageDropdown
                isOpen={isLanguageOpen}
                onToggle={() =>
                  setActiveState(
                    isLanguageOpen ? "01_landing" : "06_language"
                  )
                }
                onClose={() => {
                  if (activeState === "06_language") {
                    setActiveState("01_landing");
                  }
                }}
                currentLanguage={currentLanguage}
                onSelectLanguage={(lang) => {
                  setCurrentLanguage(lang);
                  setActiveState("01_landing");
                  triggerToast(`Language switched to ${lang}`);
                }}
              />
            </div>
          </footer>

          {/* State 02: Join Meeting Dialog Modal */}
          <JoinMeetingModal
            isOpen={isJoinModalOpen}
            onClose={() => setActiveState("01_landing")}
            onJoin={(id) => {
              triggerToast(`Joining meeting: ${id}`);
              setActiveState("01_landing");
              if (id) {
                router.push(`/meeting/${encodeURIComponent(id)}`);
              }
            }}
          />

          {/* State 05: About Zoom Modal */}
          <AboutZoomModal
            isOpen={isAboutModalOpen}
            onClose={() => setActiveState("01_landing")}
          />
        </>
      )}
    </div>
  );
}
