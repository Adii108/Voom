import React, { useState, useEffect, useRef } from "react";
import { ZoomInput } from "./ZoomInput";
import { PrismButton } from "./PrismButton";
import { generateUniqueRoomCode } from "@/lib/api";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (meetingId: string) => void;
  onStartInstant?: () => void;
}

export function JoinMeetingModal({
  isOpen,
  onClose,
  onJoin,
  onStartInstant,
}: JoinMeetingModalProps) {
  const [meetingId, setMeetingId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setMeetingId("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isJoinEnabled = meetingId.trim().length > 0;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoinEnabled && onJoin) {
      onJoin(meetingId.trim());
    }
  };

  const handleInstantMeeting = () => {
    if (onStartInstant) {
      onStartInstant();
    } else if (onJoin) {
      const newCode = generateUniqueRoomCode();
      onJoin(newCode);
    }
  };

  return (
    <div id="pwaModalRoot">
      <div className="ReactModalPortal">
        {/* Overlay backdrop */}
        <div
          className="ReactModal__Overlay ReactModal__Overlay--after-open join-meeting-modal__overlay pwa-modal__overlay pwa-modal__overlay--on fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1001,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal Content */}
          <div
            className="ReactModal__Content ReactModal__Content--after-open undefined pwa-modal__content pwa-modal__content--centered"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-meeting-title"
          >
            <div
              className="react-draggable"
              style={{ display: "inline-block", transform: "translate(0px, 0px)" }}
            >
              <div
                className="join-meeting-modal bg-white shadow-2xl"
                style={{
                  width: "448px",
                  borderRadius: "16px",
                  padding: "32px",
                  boxSizing: "border-box",
                }}
              >
                <div className="join-meeting-modal__content flex flex-col">
                  {/* Dialog Heading */}
                  <h2
                    id="join-meeting-title"
                    className="join-meeting-modal__title text-left font-bold"
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "rgb(34, 35, 37)",
                      marginBottom: "20px",
                      lineHeight: "26px",
                    }}
                  >
                    Join Meeting
                  </h2>

                  {/* Form */}
                  <form
                    id="joinMeeting"
                    onSubmit={handleJoin}
                    className="join-meeting-modal__form flex flex-col"
                  >
                    <ZoomInput
                      id="join-meeting-modal-meeting-id"
                      label="Meeting ID or Personal Link Name"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      placeholder=""
                      autoFocus
                    />

                    {/* Instant Meeting Helper */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Don&apos;t have a code?</span>
                      <button
                        type="button"
                        onClick={handleInstantMeeting}
                        className="text-[#0D6BDE] hover:underline font-medium cursor-pointer"
                      >
                        Start an instant meeting
                      </button>
                    </div>

                    {/* Footer Actions */}
                    <footer
                      className="join-meeting-modal__footer flex justify-end items-center gap-3 mt-6"
                      role="contentinfo"
                    >
                      <PrismButton
                        variant="secondary-medium"
                        type="button"
                        aria-label="Cancel"
                        onClick={onClose}
                      >
                        Cancel
                      </PrismButton>

                      <PrismButton
                        variant="primary-medium"
                        type="submit"
                        disabled={!isJoinEnabled}
                        aria-label="Join"
                      >
                        Join
                      </PrismButton>
                    </footer>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
