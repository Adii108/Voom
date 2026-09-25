import React from "react";

interface DownloadMobileCTAProps {
  className?: string;
  href?: string;
}

export function DownloadMobileCTA({
  className = "",
  href = "https://zoom.us/download",
}: DownloadMobileCTAProps) {
  return (
    <div className={`DownloadMobileCTAForIndex_wrapper__2gQyG ${className}`}>
      <div className="DownloadMobileCTAForIndex_container__3HsWH">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="DownloadMobileCTAForIndex_cta__39AbW group block select-none transition-colors hover:bg-[#EBF3FC]"
          style={{
            width: "391px",
            minHeight: "72px",
            backgroundColor: "rgb(242, 248, 255)",
            color: "rgb(42, 43, 45)",
            borderRadius: "10px",
            padding: "16px",
            boxSizing: "border-box",
            textDecoration: "none",
          }}
          aria-label="Download the Zoom app Download Zoom to access Chat, Phone, Docs, and more!"
        >
          <div className="DownloadMobileCTAForIndex_text__3Nfy9 flex flex-col justify-center">
            <span
              className="DownloadMobileCTAForIndex_title__3voax leading-snug font-medium"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "rgb(42, 43, 45)",
                lineHeight: "22px",
              }}
            >
              Download the Zoom app
            </span>
            <span
              className="DownloadMobileCTAForIndex_description__1ezPG mt-1 text-sm leading-normal opacity-90"
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "rgb(42, 43, 45)",
                lineHeight: "18px",
              }}
            >
              Download Zoom to access Chat, Phone, Docs, and more!
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
