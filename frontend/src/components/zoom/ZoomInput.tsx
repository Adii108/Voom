import React from "react";

interface ZoomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
}

export function ZoomInput({
  label,
  id = "join-meeting-modal-meeting-id",
  value,
  onChange,
  className = "",
  style,
  ...props
}: ZoomInputProps) {
  return (
    <div className="join-meeting-modal__meeting-id flex flex-col text-left">
      {label && (
        <label
          htmlFor={id}
          className="join-meeting-modal__label block mb-2 select-none"
          style={{
            fontSize: "14px",
            color: "rgb(42, 43, 45)",
            fontFamily: "Arial, system-ui, sans-serif",
            fontWeight: 400,
            lineHeight: "18px",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        className={`join-meeting-modal__input transition-all duration-150 focus:outline-none focus:border-[#0D6BDE] ${className}`}
        style={{
          width: "384px",
          height: "40px",
          backgroundColor: "rgb(255, 255, 255)",
          color: "rgb(34, 35, 37)",
          fontSize: "14px",
          fontFamily: "Arial, system-ui, sans-serif",
          fontWeight: 400,
          lineHeight: "18px",
          border: "1px solid rgb(193, 198, 206)",
          borderRadius: "12px",
          padding: "6px 16px",
          boxSizing: "border-box",
          cursor: "text",
          ...style,
        }}
        {...props}
      />
    </div>
  );
}
