import type { ReactNode } from "react";
import type { AdminNavItem, AdminSectionId, MockAdminUser } from "../types";

const NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    label: "نظرة عامة",
    hint: "إحصائيات وجاهزية",
    icon: "◉",
  },
  {
    id: "users",
    label: "المستخدمون",
    hint: "بحث وتوثيق وحسابات",
    icon: "◎",
  },
  {
    id: "content",
    label: "المحتوى",
    hint: "منشورات X",
    icon: "✦",
  },
  {
    id: "predictions",
    label: "التوقعات",
    hint: "نقاط ومقفلة",
    icon: "⚑",
  },
  {
    id: "audit",
    label: "سجل العمليات",
    hint: "من فعل ماذا",
    icon: "☰",
  },
  {
    id: "settings",
    label: "الإعدادات",
    hint: "ربط Appwrite",
    icon: "⚙",
  },
];

type AdminLayoutProps = {
  admin: MockAdminUser;
  activeSection: AdminSectionId;
  onSectionChange: (section: AdminSectionId) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AdminLayout(props: AdminLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-eyebrow">VAR ADMIN</div>
          <div className="brand-title">لوحة التحكم</div>
          <div className="brand-meta">الصفحة الأم — ويب</div>
        </div>

        <nav className="nav-list" aria-label="أقسام الأدمن">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === props.activeSection
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => props.onSectionChange(item.id)}
            >
              <span className="nav-icon" aria-hidden>
                {item.icon}
              </span>
              <span className="nav-copy">
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-chip">
            <span>
              {props.admin.displayName}
              <br />
              <small style={{ color: "var(--text-muted)" }}>
                {props.admin.varId}
              </small>
            </span>
            <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>
              VAR
            </span>
          </div>
          <button type="button" className="btn-ghost" onClick={props.onLogout}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="main-panel">{props.children}</main>
    </div>
  );
}
