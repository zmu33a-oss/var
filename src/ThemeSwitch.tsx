import { useState } from "react";

type ThemeSwitchProps = {
  currentTab: "home" | "x" | "fans" | "leagues" | "account";
  setTab: (tab: "home" | "x" | "fans" | "leagues" | "account") => void;
};

export default function ThemeSwitch({ currentTab, setTab }: ThemeSwitchProps) {
  const [open, setOpen] = useState(false);

  const label = currentTab === "home" ? "TikTok Mode" : "X Mode";
  const nextLabel = currentTab === "home" ? "X Mode" : "TikTok Mode";

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
              setOpen(false);
              setTab(currentTab === "home" ? "x" : "home");
            }}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              padding: "12px",
              cursor: "pointer",
            }}
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
