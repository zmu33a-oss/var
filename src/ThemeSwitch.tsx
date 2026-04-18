import { useState, useRef, useEffect } from "react";

type ThemeSwitchProps = {
  currentTab: "home" | "x" | "fans" | "leagues" | "account";
  setTab: (tab: "home" | "x" | "fans" | "leagues" | "account") => void;
};

export default function ThemeSwitch({ currentTab, setTab }: ThemeSwitchProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 50, y: 20 });

  const dragging = useRef(false);

  const label = currentTab === "home" ? "TikTok Mode" : "X Mode";
  const nextLabel = currentTab === "home" ? "X Mode" : "TikTok Mode";

  const handleMouseDown = () => {
    dragging.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - 50, y: e.clientY - 20 });
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  const handleTouchStart = () => {
    dragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging.current) return;
    const touch = e.touches[0];
    setPos({ x: touch.clientX - 50, y: touch.clientY - 20 });
  };

  const handleTouchEnd = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 2000,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "flex",
          gap: "8px",
          background: "#000000b0",
          color: "#fff",
          border: "1px solid #fff",
          borderRadius: "999px",
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        {label}
        <span
          style={{
            transition: "0.3s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: "8px",
            background: "#00000080",
            borderRadius: "12px",
            overflow: "hidden",
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
              padding: "10px",
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