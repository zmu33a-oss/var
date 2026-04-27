import { useState, useRef, useEffect } from "react";

type ThemeSwitchProps = {
  currentTab: "home" | "x" | "fans" | "leagues" | "account";
  setTab: (tab: "home" | "x" | "fans" | "leagues" | "account") => void;
};

export default function ThemeSwitch({ currentTab, setTab }: ThemeSwitchProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 50, y: 20 });

  const dragging = useRef(false);

  const isXMode = currentTab === "x";
  const label = isXMode ? "X Mode" : "TikTok Mode";
  const nextLabel = isXMode ? "TikTok Mode" : "X Mode";
  const currentWordmarkSrc = isXMode ? "/VAR%20X.png" : "/VAR%20TIK.png";
  const nextWordmarkSrc = isXMode ? "/VAR%20TIK.png" : "/VAR%20X.png";

  const renderWordmark = (
    src: string,
    width: string,
    height: string,
    scale: number,
  ) => (
    <span
      style={{
        display: "block",
        width,
        height,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      />
    </span>
  );

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
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "#000000b0",
          color: "#fff",
          border: "1px solid #fff",
          borderRadius: "999px",
          padding: "7px 10px",
          cursor: "pointer",
        }}
      >
        {renderWordmark(currentWordmarkSrc, "68px", "18px", 2.7)}
        <span
          style={{
            transition: "0.3s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: "12px",
            lineHeight: 1,
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
            aria-label={nextLabel}
            onClick={() => {
              setOpen(false);
              setTab(currentTab === "home" ? "x" : "home");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: "#fff",
              border: "none",
              padding: "9px 12px",
              cursor: "pointer",
            }}
          >
            {renderWordmark(nextWordmarkSrc, "64px", "17px", 2.55)}
          </button>
        </div>
      )}
    </div>
  );
}
