import React from "react";
import { useRouter } from "next/navigation";
import { generateUniqueRoomCode } from "@/lib/api";

interface SignInViewProps {
  onBack: () => void;
}

export function SignInView({ onBack }: SignInViewProps) {
  const router = useRouter();

  const handleStartInstant = () => {
    const code = generateUniqueRoomCode();
    router.push(`/meeting/${code}`);
  };

  return (
    <div className="total-main-content min-h-screen w-full bg-white flex flex-col relative text-[#2A2B2D]">
      {/* Top accessibility bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#FAFAFA]">
        <div id="accessibilityHome">
          <a
            aria-label="Accessibility overview"
            href="https://explore.zoom.us/en/accessibility"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors underline"
          >
            Accessibility Overview
          </a>
        </div>

        {/* Back navigation control */}
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13l-5-5 5-5" />
          </svg>
          Back to Zoom Workplace
        </button>
      </div>

      {/* Main content matching 03_sign_in semantics */}
      <div id="nested" className="zoom-newpd flex-1 flex flex-col items-center justify-center">
        <main
          className="mini-layout flex flex-col items-center justify-center p-8 max-w-md w-full text-center"
          role="main"
          aria-label="main content"
        >
          <div className="HiddenText">
            <a id="the-main-content" tabIndex={-1} aria-hidden="true" />
          </div>

          <div
            id="app"
            data-zm-app-build-version="7.0.3046"
            className="w-full flex flex-col items-center"
          >
            <div className="zmua-app-root login-page zmua-app-scope w-full">
              <div className="p-8 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-[#0D213F]">
                  Zoom Sign In
                </h1>
                <p className="text-sm text-gray-500">
                  Signed in as guest user. You can start instant video meetings or schedule new sessions.
                </p>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleStartInstant}
                    className="w-full py-2.5 px-4 bg-[#0D6BDE] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
                  >
                    Start Instant Meeting
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/schedule")}
                    className="w-full py-2.5 px-4 bg-gray-100 text-[#2A2B2D] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Schedule Meeting
                  </button>

                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-2 px-4 text-gray-500 hover:text-gray-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Return to Landing Screen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
