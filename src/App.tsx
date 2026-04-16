import { useState } from "react";
import BottomNav, { type TabType } from "./components/BottomNav";
import ThemeSwitch from "./ThemeSwitch";
import FansPage from "./pages/FansPage";
import LeaguesPage from "./pages/LeaguesPage";
import LoginPage from "./pages/login";
import ProfilePage from "./pages/ProfilePage";
import TikTokPage from "./pages/TikTokPage";
import XPage from "./pages/XPage";

type HomeMode = "tiktok" | "x";

export default function App() {
  const [tab, setTab] = useState<TabType>("home");
  const [mode, setMode] = useState<HomeMode>("tiktok");

  return (
    <div style={{ paddingBottom: "90px" }}>
      {tab === "home" && (
        <ThemeSwitch
          currentTab={mode === "tiktok" ? "home" : "x"}
          setTab={(value) => {
            if (value === "home" || value === "x") {
              setMode(value === "x" ? "x" : "tiktok");
            }
          }}
        />
      )}

      {tab === "home" && mode === "tiktok" && <TikTokPage />}
      {tab === "home" && mode === "x" && <XPage />}
      {tab === "fans" && <FansPage />}
      {tab === "leagues" && <LeaguesPage />}
      {tab === "profile" && <ProfilePage />}
      {tab === "account" && <LoginPage />}

      <BottomNav current={tab} setTab={setTab} />
    </div>
  );
}