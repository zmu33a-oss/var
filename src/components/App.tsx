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

  return (
    <div style={{ paddingBottom: "90px" }}>
      <ThemeSwitch setTab={setTab} />

      {tab === "x" && <XPage />}
      {tab === "home" && <TikTokPage />}
      {tab === "fans" && <FansPage />}
      {tab === "leagues" && <LeaguesPage />}
      {tab === "account" && <LoginPage />}

      <BottomNav current={tab} setTab={setTab} />
    </div>
  );
}
