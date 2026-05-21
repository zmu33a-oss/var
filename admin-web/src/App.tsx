import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./components/LoginPage";
import {
  logoutAdmin,
  restoreAdminSession,
  type AdminSessionUser,
} from "./lib/appwrite-auth";
import { AuditPage } from "./pages/AuditPage";
import { ContentPage } from "./pages/ContentPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";
import type { AdminSectionId } from "./types";

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);
  const [activeSection, setActiveSection] =
    useState<AdminSectionId>("overview");
  const [toast, setToast] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    void (async () => {
      const restored = await restoreAdminSession();
      setAdminUser(restored);
      setIsBooting(false);
    })();
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const handleLogout = () => {
    void logoutAdmin();
    setAdminUser(null);
    setActiveSection("overview");
  };

  if (isBooting) {
    return (
      <div className="login-page">
        <p className="login-subtitle">جاري تحميل لوحة الأدمن...</p>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <>
        <LoginPage
          onLogin={() => {
            void (async () => {
              const restored = await restoreAdminSession();
              setAdminUser(restored);
              setLoginError("");
            })();
          }}
          onError={setLoginError}
        />
        {loginError ? <div className="toast">{loginError}</div> : null}
      </>
    );
  }

  let sectionContent;
  switch (activeSection) {
    case "users":
      sectionContent = <UsersPage onToast={showToast} />;
      break;
    case "content":
      sectionContent = <ContentPage onToast={showToast} />;
      break;
    case "predictions":
      sectionContent = <PredictionsPage onToast={showToast} />;
      break;
    case "audit":
      sectionContent = <AuditPage />;
      break;
    case "settings":
      sectionContent = <SettingsPage />;
      break;
    case "overview":
    default:
      sectionContent = <OverviewPage />;
      break;
  }

  return (
    <>
      <AdminLayout
        admin={{
          displayName: adminUser.name,
          email: adminUser.email,
          roleLabel: adminUser.role === "admin" ? "أدمن رئيسي" : "مشرف",
          varId: adminUser.displayVarId || adminUser.varId || "VAR-ADMIN",
        }}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      >
        {sectionContent}
      </AdminLayout>
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}
