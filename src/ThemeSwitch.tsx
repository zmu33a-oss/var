import { useState } from "react";

type ThemeSwitchProps = {
  setTab: (tab: "home" | "x") => void;
};

export default function ThemeSwitch({ setTab }: ThemeSwitchProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"tiktok" | "x">("tiktok");

  const label = mode === "tiktok" ? "TikTok Mode" : "X Mode";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "#000000b0",
          color: "#fff",
          border: "1px solid #e7dada",
          borderRadius: "999px",
          padding: "8px 12px",
          cursor: "pointer",
          minWidth: "100px",
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: "8px",
            background: "#00000080",
            border: "1px solid #ffffff80",
            borderRadius: "14px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={() => {
              setMode("tiktok");
              setOpen(false);
              setTab("home");
            }}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              padding: "12px",
              cursor: "pointer",
            }}
          >
            TikTok Mode
          </button>

          <button
            onClick={() => {
              setMode("x");
              setOpen(false);
              setTab("x");
            }}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              padding: "12px",
              cursor: "pointer",
            }}
          >
            X Mode
          </button>
        </div>
      )}
    </div>
  );
}
