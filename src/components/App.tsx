import ThemeSwitch from "../ThemeSwitch";
import { useState } from "react";
import TikTokPage from "./TikTokPage";
import LoginPage from "../login";
import BottomNav, { type TabType } from "../BottomNav";
import XPage from "./XPage";
import FansPage from "../FansPage";
import LeaguesPage from "../LeaguesPage";
export default function App() {
  const [tab, setTab] = useState<TabType>("home");
  const [mode, setMode] = useState<"tiktok" | "x">("tiktok");

  return (
    <div style={{ paddingBottom: "90px" }}>
      {tab === "home" && (
        <ThemeSwitch
          currentTab={mode === "tiktok" ? "home" : "x"}
          setTab={(value) => {
            setMode(value === "x" ? "x" : "tiktok");
          }}
        />
      )}

      {tab === "home" && mode === "tiktok" && <TikTokPage />}
      {tab === "home" && mode === "x" && <XPage />}
      {tab === "fans" && <FansPage />}
      {tab === "leagues" && <LeaguesPage />}
      {tab === "account" && <LoginPage />}

      <BottomNav current={tab} setTab={setTab} />
    </div>
  );
}
