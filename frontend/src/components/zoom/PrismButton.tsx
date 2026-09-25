import React from "react";

export type ButtonVariant =
  | "primary-large"
  | "secondary-large"
  | "primary-medium"
  | "secondary-medium"
  | "footer-about"
  | "footer-language";

interface PrismButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isActive?: boolean;
  isExpanded?: boolean;
  children: React.ReactNode;
}

export function PrismButton({
  variant = "primary-large",
  isActive = false,
  isExpanded = false,
  disabled = false,
  className = "",
  children,
  style,
  ...props
}: PrismButtonProps) {
  // Base classes and variant styles
  let variantStyle: React.CSSProperties = {};
  let variantClasses = "";

  switch (variant) {
    case "primary-large":
      variantClasses =
        "prism-Button-root prism-light btn-index prism-Button-default prism-Button-primary prism-Button-large MuiBox-root css-0 transition-colors";
      variantStyle = {
        width: "240px",
        height: "40px",
        backgroundColor: "rgb(13, 107, 222)",
        color: "rgb(255, 255, 255)",
        fontSize: "16px",
        fontWeight: 500,
        lineHeight: "20px",
        border: "1px solid rgb(13, 107, 222)",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      };
      break;

    case "secondary-large":
      variantClasses =
        "prism-Button-root prism-light btn-index prism-Button-default prism-Button-secondary prism-Button-large MuiBox-root css-0 transition-colors";
      variantStyle = {
        width: "240px",
        height: "40px",
        backgroundColor: isActive
          ? "rgba(110, 118, 128, 0.12)"
          : "rgb(255, 255, 255)",
        color: "rgb(42, 43, 45)",
        fontSize: "16px",
        fontWeight: 500,
        lineHeight: "20px",
        border: "1px solid rgb(147, 155, 164)",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      };
      break;

    case "primary-medium":
      // Join button
      variantClasses = `prism-Button-root prism-light join-meeting-modal__button prism-Button-default prism-Button-primary prism-Button-medium ${
        disabled ? "prism-Button-disabled" : ""
      } MuiBox-root css-0 transition-colors`;
      variantStyle = {
        width: "55px",
        height: "32px",
        backgroundColor: disabled
          ? "rgba(173, 177, 184, 0.25)"
          : "rgb(13, 107, 222)",
        color: disabled ? "rgb(173, 177, 184)" : "rgb(255, 255, 255)",
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: "18px",
        border: "0px none rgb(173, 177, 184)",
        borderRadius: "12px",
        padding: "6px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      };
      break;

    case "secondary-medium":
      // Cancel button
      variantClasses =
        "prism-Button-root prism-light join-meeting-modal__button prism-Button-default prism-Button-secondary prism-Button-medium MuiBox-root css-0 transition-colors";
      variantStyle = {
        width: "71px",
        height: "32px",
        backgroundColor: "rgb(241, 244, 246)",
        color: "rgb(13, 107, 222)",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "18px",
        border: "0px none rgb(13, 107, 222)",
        borderRadius: "12px",
        padding: "6px 14px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      };
      break;

    case "footer-about":
      variantClasses = "index__footer-about transition-colors";
      variantStyle = {
        minWidth: "92px",
        height: "28px",
        backgroundColor: "rgba(0, 0, 0, 0)",
        color: "rgb(110, 118, 128)",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "24px",
        border: "0px none rgb(110, 118, 128)",
        borderRadius: "6px",
        padding: "2px 8px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      };
      break;

    case "footer-language":
      variantClasses = "language-dropdown-box__toggle transition-colors";
      variantStyle = {
        minWidth: "99px",
        height: "28px",
        backgroundColor:
          isExpanded || isActive
            ? "rgb(247, 249, 250)"
            : "rgba(0, 0, 0, 0)",
        color: "rgb(0, 0, 0)",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "24px",
        border: "0px none rgb(0, 0, 0)",
        borderRadius: isExpanded || isActive ? "6px" : "0px",
        padding: "2px 8px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      };
      break;
  }

  return (
    <button
      type={props.type || "button"}
      disabled={disabled}
      className={`${variantClasses} ${className}`}
      style={{ ...variantStyle, ...style }}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      <span className="prism-Button-label inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}
