import React, { useState, useRef, useEffect } from "react";

export const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Español" },
  { code: "de-DE", name: "Deutsch" },
  { code: "zh-CN", name: "简体中文" },
  { code: "zh-TW", name: "繁體中文" },
  { code: "fr-FR", name: "Français" },
  { code: "pt-PT", name: "Português" },
  { code: "jp-JP", name: "日本語" },
  { code: "ru-RU", name: "Русский" },
  { code: "ko-KO", name: "한국어" },
  { code: "it-IT", name: "Italiano" },
  { code: "vi-VN", name: "Tiếng Việt" },
  { code: "pl-PL", name: "Polski" },
  { code: "tr-TR", name: "Türkçe" },
  { code: "id-ID", name: "Bahasa Indonesia" },
  { code: "nl-NL", name: "Nederlands" },
  { code: "sv-SE", name: "Svenska" },
];

interface LanguageDropdownProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  currentLanguage?: string;
  onSelectLanguage?: (lang: string) => void;
}

export function LanguageDropdown({
  isOpen = false,
  onToggle,
  onClose,
  currentLanguage = "English",
  onSelectLanguage,
}: LanguageDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={containerRef}
      className="language-dropdown-box relative inline-block text-left"
    >
      {/* Language Trigger Button */}
      <button
        type="button"
        id="language-dropdown-button"
        className={`language-dropdown-box__toggle inline-flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors select-none ${
          isOpen ? "bg-[#F7F9FA]" : "hover:bg-[#F7F9FA]"
        }`}
        style={{
          height: "28px",
          color: "rgb(0, 0, 0)",
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          fontWeight: 400,
          lineHeight: "24px",
          border: "none",
          backgroundColor: isOpen ? "rgb(247, 249, 250)" : "transparent",
          borderRadius: isOpen ? "6px" : "4px",
          cursor: "pointer",
        }}
        aria-haspopup="true"
        aria-expanded={isOpen ? "true" : "false"}
        onClick={onToggle}
      >
        {/* Globe icon */}
        <i
          className="icon-interpretation flex items-center justify-center text-gray-700"
          aria-hidden="true"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M1.5 8h13" />
            <path d="M8 1.5c2 2 3 4.5 3 6.5s-1 4.5-3 6.5c-2-2-3-4.5-3-6.5s1-4.5 3-6.5z" />
          </svg>
        </i>

        {/* Current Language Name */}
        <span className="language-dropdown-box__title">{currentLanguage}</span>

        {/* Arrow chevron icon pointing up (as captured in state 01 and 06) */}
        <i
          className="icon-arrow-up flex items-center justify-center text-gray-600"
          aria-hidden="true"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path d="M3 10l5-5 5 5" />
          </svg>
        </i>
      </button>

      {/* Floating Menu Popover (opens upward above button) */}
      {isOpen && (
        <div
          className="prism-Popper-root prism-light prism-Dropdown-root absolute bottom-full mb-2 right-0 z-50 bg-white border border-gray-200/80 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            width: "170px",
            maxHeight: "232px",
            boxShadow:
              "0 4px 20px -2px rgba(0, 0, 0, 0.16), 0 2px 6px -1px rgba(0, 0, 0, 0.08)",
          }}
          tabIndex={-1}
          dir="ltr"
        >
          <div
            className="prism-ScrollView-scroller overflow-y-auto"
            style={{ maxHeight: "232px" }}
          >
            <ul
              className="prism-Listbox-root prism-Dropdown-list py-1 m-0 list-none"
              role="menu"
              tabIndex={-1}
            >
              {SUPPORTED_LANGUAGES.map((item, index) => {
                const isSelected = item.name === currentLanguage;
                return (
                  <li
                    key={item.code}
                    className={`prism-ListItem-root prism-Dropdown-item flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm select-none transition-colors ${
                      isSelected
                        ? "prism-Dropdown-selected font-medium text-black bg-[#F2F8FF]"
                        : "text-[#2A2B2D] hover:bg-[#F2F8FF]"
                    }`}
                    role="menuitemradio"
                    aria-checked={isSelected ? "true" : "false"}
                    tabIndex={0}
                    onClick={() => {
                      onSelectLanguage?.(item.name);
                      onClose?.();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectLanguage?.(item.name);
                        onClose?.();
                      }
                    }}
                  >
                    <div className="prism-Dropdown-label truncate">
                      {item.name}
                    </div>

                    {isSelected && (
                      <div className="prism-ListItem-suffix text-[#0D6BDE] flex items-center ml-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.3481 3.32203C13.411 3.36973 13.4638 3.42936 13.5035 3.49749C13.5433 3.56563 13.5692 3.64094 13.5799 3.71911C13.5905 3.79728 13.5856 3.87678 13.5655 3.95305C13.5453 4.02933 13.5104 4.10089 13.4625 4.16363L7.06254 12.5636C7.01062 12.6317 6.94475 12.6878 6.86935 12.7283C6.79395 12.7688 6.71076 12.7927 6.62536 12.7984C6.53996 12.804 6.45434 12.7914 6.37424 12.7613C6.29414 12.7311 6.22141 12.6842 6.16094 12.6236L2.56094 9.02363C2.45495 8.90989 2.39725 8.75946 2.4 8.60401C2.40274 8.44857 2.46571 8.30027 2.57564 8.19034C2.68557 8.08041 2.83388 8.01744 2.98932 8.01469C3.14476 8.01195 3.2952 8.06965 3.40894 8.17563L6.52414 11.29L12.5081 3.43643C12.6044 3.30999 12.747 3.22694 12.9045 3.20549C13.062 3.18404 13.2215 3.22595 13.3481 3.32203Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
