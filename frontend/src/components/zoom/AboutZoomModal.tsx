import React, { useEffect } from "react";
import { ZoomLogo } from "./ZoomLogo";

interface AboutZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutZoomModal({ isOpen, onClose }: AboutZoomModalProps) {
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

  return (
    <div id="pwaModalRoot">
      <div className="ReactModalPortal">
        {/* Overlay backdrop */}
        <div
          className="ReactModal__Overlay ReactModal__Overlay--after-open undefined pwa-modal__overlay pwa-modal__overlay--on fixed inset-0 flex items-center justify-center"
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
          {/* Modal Dialog Content */}
          <div
            className="ReactModal__Content ReactModal__Content--after-open undefined pwa-modal__content pwa-modal__content--centered"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="zm-about-version"
          >
            <div
              className="react-draggable"
              style={{ display: "inline-block", transform: "translate(0px, 0px)" }}
            >
              <div
                className="modal-about relative bg-white shadow-2xl flex flex-col items-center justify-center text-center"
                style={{
                  width: "480px",
                  borderRadius: "16px",
                  padding: "48px 36px 40px 36px",
                  boxSizing: "border-box",
                }}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="about-close absolute top-4 right-4 p-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                  style={{
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <i
                    className="zmicon zmicon-acc-no-outline about-close-icon flex items-center justify-center"
                    role="img"
                    aria-label="Close"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.5761 3.57613C11.8104 3.34181 12.1895 3.34181 12.4238 3.57613C12.658 3.81045 12.6581 4.18949 12.4238 4.42378L8.84761 7.99995L12.4238 11.5761C12.658 11.8104 12.6581 12.1895 12.4238 12.4238C12.1895 12.6581 11.8104 12.658 11.5761 12.4238L7.99995 8.84761L4.42378 12.4238C4.18949 12.6581 3.81045 12.658 3.57613 12.4238C3.34181 12.1895 3.34181 11.8104 3.57613 11.5761L7.1523 7.99995L3.57613 4.42378C3.34181 4.18947 3.34181 3.81044 3.57613 3.57613C3.81044 3.34181 4.18947 3.34181 4.42378 3.57613L7.99995 7.1523L11.5761 3.57613Z"
                        fill="currentColor"
                      />
                    </svg>
                  </i>
                </button>

                {/* Centered Zoom Blue Logo */}
                <div className="mb-4">
                  <ZoomLogo width={110} height={26} />
                </div>

                {/* Version */}
                <p
                  className="about-version"
                  id="zm-about-version"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "rgb(42, 43, 45)",
                    fontFamily:
                      'system-ui, "SF Pro", "Segoe UI", "Almaden Sans", Roboto, Arial',
                    margin: "0 0 10px 0",
                  }}
                >
                  Version: 7.2.0.3239 (0924)
                </p>

                {/* Copyright */}
                <p
                  id="zm-about-copyright"
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "rgb(110, 118, 128)",
                    fontFamily:
                      'system-ui, "SF Pro", "Segoe UI", "Almaden Sans", Roboto, Arial',
                    margin: "0 0 36px 0",
                    lineHeight: "20px",
                  }}
                >
                  Copyright ©2012-2026 Zoom Communications, Inc. All rights reserved.
                </p>

                {/* Open Source Software Link */}
                <a
                  className="about__open-source inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  href="https://zoom.us/opensource?product=pwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgb(14, 114, 237)",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "24px",
                    textDecoration: "none",
                  }}
                >
                  <span className="about__open-source-text">
                    Open Source Software
                  </span>
                  <i
                    className="about__open-source-link-icon flex items-center"
                    aria-hidden="true"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V8.5C14 8.22386 13.7761 8 13.5 8C13.2239 8 13 8.22386 13 8.5V13H3V3H7.5C7.77614 3 8 2.77614 8 2.5C8 2.22386 7.77614 2 7.5 2H3ZM9.5 2C9.22386 2 9 2.22386 9 2.5C9 2.77614 9.22386 3 9.5 3H12.2929L6.14645 9.14645C5.95118 9.34171 5.95118 9.65829 6.14645 9.85355C6.34171 10.0488 6.65829 10.0488 6.85355 9.85355L13 3.70711V6.5C13 6.77614 13.2239 7 13.5 7C13.7761 7 14 6.77614 14 6.5V2.5C14 2.22386 13.7761 2 13.5 2H9.5Z"
                      />
                    </svg>
                  </i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
