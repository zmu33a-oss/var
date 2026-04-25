import { Home, Trophy, User, Users } from "lucide-react";
import styles from "../pages-css/BottomNav.module.css";

export type TabType =
  | "home"
  | "fans"
  | "leagues"
  | "profile"
  | "account"
  | "chat";
type BottomNavProps = {
  current: TabType;
  homeMode?: "tiktok" | "x";
  onHomeAction?: () => void;
  setTab: (tab: TabType) => void;
};

export default function BottomNav({
  current,
  homeMode,
  onHomeAction,
  setTab,
}: BottomNavProps) {
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

      {homeMode && onHomeAction && (
        <button
          type="button"
          onClick={onHomeAction}
          className={`${styles["bottom-nav-item"]} ${styles["bottom-nav-action"]} ${homeMode === "tiktok" ? styles["bottom-nav-action-tiktok"] : styles["bottom-nav-action-x"]}`}
          aria-label={homeMode === "x" ? "رسالة جديدة" : "إضافة فيديو"}
        >
          <span className={styles["bottom-nav-action-wordmark-wrap"]}>
            <span className={styles["bottom-nav-action-wordmark"]}>Xtik</span>
          </span>
        </button>
      )}

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
        onClick={() => setTab("account")}
        className={`${styles["bottom-nav-item"]} ${current === "account" ? styles.active : ""}`}
      >
        <User className={styles["nav-icon"]} strokeWidth={2.2} />
        <span>الحساب</span>
      </button>
    </nav>
  );
}
