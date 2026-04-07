import "./BottomNav.css";
import { Home, Users, Trophy, User } from "lucide-react";

export type TabType = "home" | "fans" | "leagues" | "account" | "x";

type BottomNavProps = {
  current: TabType;
  setTab: (tab: TabType) => void;
};

export default function BottomNav({ current, setTab }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => setTab("home")}
        className={`bottom-nav-item ${current === "home" ? "active" : ""}`}
      >
        <Home className="nav-icon" strokeWidth={2.2} />
        <span>الرئيسية</span>
      </button>

      <button
        onClick={() => setTab("fans")}
        className={`bottom-nav-item ${current === "fans" ? "active" : ""}`}
      >
        <Users className="nav-icon" strokeWidth={2.2} />
        <span>الرابطة</span>
      </button>

      <button
        onClick={() => setTab("leagues")}
        className={`bottom-nav-item ${current === "leagues" ? "active" : ""}`}
      >
        <Trophy className="nav-icon" strokeWidth={2.2} />
        <span>دوريات</span>
      </button>

      <button
        onClick={() => setTab("account")}
        className={`bottom-nav-item ${current === "account" ? "active" : ""}`}
      >
        <User className="nav-icon" strokeWidth={2.2} />
        <span>الحساب</span>
      </button>
    </nav>
  );
}
