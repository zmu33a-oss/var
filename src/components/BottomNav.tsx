import { CircleUserRound, Home, Trophy, User, Users } from "lucide-react";
import styles from "../pages-css/BottomNav.module.css";

export type TabType = "home" | "fans" | "leagues" | "profile" | "account";

type BottomNavProps = {
  current: TabType;
  setTab: (tab: TabType) => void;
};

export default function BottomNav({ current, setTab }: BottomNavProps) {
  return (
    <nav className={styles["bottom-nav"]}>
      <button
        type="button"
        onClick={() => setTab("home")}
        className={`${styles["bottom-nav-item"]} ${current === "home" ? styles.active : ""}`}
      >
        <Home className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الرئيسية</span>
      </button>

      <button
        type="button"
        onClick={() => setTab("fans")}
        className={`${styles["bottom-nav-item"]} ${current === "fans" ? styles.active : ""}`}
      >
        <Users className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الرابطة</span>
      </button>

      <button
        type="button"
        onClick={() => setTab("leagues")}
        className={`${styles["bottom-nav-item"]} ${current === "leagues" ? styles.active : ""}`}
      >
        <Trophy className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الدوريات</span>
      </button>

      <button
        type="button"
        onClick={() => setTab("profile")}
        className={`${styles["bottom-nav-item"]} ${current === "profile" ? styles.active : ""}`}
      >
        <CircleUserRound className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الملف</span>
      </button>

      <button
        type="button"
        onClick={() => setTab("account")}
        className={`${styles["bottom-nav-item"]} ${current === "account" ? styles.active : ""}`}
      >
        <User className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الحساب</span>
      </button>
    </nav>
  );
}
