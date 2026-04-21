import { useEffect, useRef, useState } from "react";
import BottomNav, { type TabType } from "./components/BottomNav";
import ThemeSwitch from "./ThemeSwitch";
import FansPage from "./pages/FansPage";
import LeaguesPage from "./pages/LeaguesPage";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import TikTokPage from "./pages/TikTokPage";
import XPage from "./pages/XPage";
import ChatPage from "./pages/ChatPage";
import { AuthProvider, useAuth } from "./lib/AuthContext";

type HomeMode = "tiktok" | "x";
type ChatComposer = "dm" | "group" | null;
type AuthMode = "login" | "signup";

// ─── الجزء الداخلي للتطبيق — يستطيع استخدام useAuth ─────────────────────────
function AppContent() {
  const [tab, setTab] = useState<TabType>("home");
  const [chatBaseTab, setChatBaseTab] = useState<TabType>("home");
  const [mode, setMode] = useState<HomeMode>("tiktok");
  const [chatComposer, setChatComposer] = useState<ChatComposer>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const { user, isRecovery, clearRecovery, loading } = useAuth();

  // كشف OAuth redirect — نقرأ URL قبل أن يُنظّفه Supabase
  const isOAuthRedirect = useRef(
    window.location.search.includes("code=") ||
      window.location.hash.includes("access_token"),
  );

  // بعد نجاح تسجيل الدخول عبر جوجل → انتقل لصفحة الحساب
  useEffect(() => {
    if (!loading && user && isOAuthRedirect.current) {
      isOAuthRedirect.current = false;
      setTab("profile");
    }
  }, [user, loading]);

  // توجيه إلى صفحة الحساب عند وصول رابط إعادة تعيين كلمة المرور
  useEffect(() => {
    if (isRecovery) setTab("account");
  }, [isRecovery]);

  // طرد المستخدم غير المسجل من الصفحات المحمية
  useEffect(() => {
    if (!user && (tab === "chat" || tab === "profile")) {
      setTab("account");
    }
  }, [user, tab]);

  const openChat = (composer: ChatComposer = null) => {
    if (!user) {
      setTab("account");
      return;
    }
    setChatBaseTab(tab === "chat" ? chatBaseTab : tab);
    setChatComposer(composer);
    setTab("chat");
  };

  const visibleTab = tab === "chat" ? chatBaseTab : tab;

  // شاشة تحميل خفيفة ريثما يُحدد وضع الجلسة
  if (loading) {
    return <div style={{ background: "#000", minHeight: "100vh" }} />;
  }

  return (
    <div
      style={{ paddingBottom: "90px", background: "#000", minHeight: "100vh" }}
    >
      {visibleTab === "home" && (
        <ThemeSwitch
          currentTab={mode === "tiktok" ? "home" : "x"}
          setTab={(value) => {
            if (value === "home" || value === "x") {
              setMode(value === "x" ? "x" : "tiktok");
            }
          }}
        />
      )}

      {visibleTab === "home" && mode === "tiktok" && (
        <div style={{ width: "100%", minHeight: "100vh", background: "#000" }}>
          <TikTokPage />
        </div>
      )}

      {visibleTab === "home" && mode === "x" && (
        <div
          style={{
            width: "100%",
            minHeight: "100vh",
            background: "#000",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <XPage onOpenChat={openChat} />
        </div>
      )}

      {visibleTab === "fans" && <FansPage />}
      {visibleTab === "leagues" && <LeaguesPage />}
      {visibleTab === "profile" && (
        <ProfilePage onSignOut={() => setTab("home")} />
      )}
      {visibleTab === "account" && authMode === "login" && (
        <LoginPage
          isRecovery={isRecovery}
          onSuccess={() => {
            clearRecovery();
            setTab("profile");
          }}
          onRecoveryDone={() => {
            clearRecovery();
            setTab("home");
          }}
          onGoToSignup={() => setAuthMode("signup")}
        />
      )}
      {visibleTab === "account" && authMode === "signup" && (
        <SignUpPage
          onGoToLogin={() => setAuthMode("login")}
          onSuccess={() => {
            setAuthMode("login");
          }}
        />
      )}
      {tab === "chat" && (
        <ChatPage
          initialComposer={chatComposer}
          onClose={() => {
            setChatComposer(null);
            setTab(chatBaseTab);
          }}
        />
      )}

      <BottomNav
        current={visibleTab === "profile" ? "account" : visibleTab}
        setTab={(nextTab) => {
          // لو مسجّل دخول وضغط الحساب → روّح للبروفايل مباشرة
          if (nextTab === "account" && user) {
            setTab("profile");
            return;
          }
          // حماية الصفحات المقيدة
          if ((nextTab === "chat" || nextTab === "profile") && !user) {
            setTab("account");
            return;
          }
          if (nextTab !== "chat") setChatComposer(null);
          if (nextTab !== "chat") setChatBaseTab(nextTab);
          setTab(nextTab);
        }}
      />
    </div>
  );
}

// ─── الغلاف الخارجي — يوفر AuthProvider للشجرة كلها ────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
