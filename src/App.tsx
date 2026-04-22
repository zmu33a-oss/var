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
import { supabase } from "./pages/supabase";
import {
  loadXPosts,
  normalizeXPosts,
  saveXPosts,
  type XPost,
} from "./lib/xPosts";

type HomeMode = "tiktok" | "x";
type ChatComposer = "dm" | "group" | "post" | null;
type AuthMode = "login" | "signup";

// ─── الجزء الداخلي للتطبيق — يستطيع استخدام useAuth ─────────────────────────
function AppContent() {
  const [tab, setTab] = useState<TabType>("home");
  const [chatBaseTab, setChatBaseTab] = useState<TabType>("home");
  const [mode, setMode] = useState<HomeMode>("tiktok");
  const [chatComposer, setChatComposer] = useState<ChatComposer>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [xPosts, setXPosts] = useState<XPost[]>(() => loadXPosts());
  const { user, isRecovery, clearRecovery, loading } = useAuth();
  const syncedXPostsRef = useRef("");
  const xPostsRef = useRef<XPost[]>(xPosts);

  const persistXPosts = (nextPosts: XPost[]) => {
    saveXPosts(nextPosts);

    if (!loading && user) {
      const serializedPosts = JSON.stringify(nextPosts);
      syncedXPostsRef.current = serializedPosts;

      void supabase.auth
        .updateUser({
          data: {
            ...user.user_metadata,
            x_posts: nextPosts,
          },
        })
        .catch(() => {
          syncedXPostsRef.current = "";
        });
      return;
    }

    syncedXPostsRef.current = JSON.stringify(nextPosts);
  };

  const updateXPosts = (updater: (currentPosts: XPost[]) => XPost[]) => {
    const nextPosts = updater(xPostsRef.current);
    xPostsRef.current = nextPosts;
    setXPosts(nextPosts);
    persistXPosts(nextPosts);
  };

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

  useEffect(() => {
    xPostsRef.current = xPosts;
  }, [xPosts]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const localPosts = loadXPosts();
      xPostsRef.current = localPosts;
      syncedXPostsRef.current = JSON.stringify(localPosts);
      setXPosts(localPosts);
      return;
    }

    const remotePosts = normalizeXPosts(user.user_metadata?.x_posts);
    if (remotePosts?.length) {
      xPostsRef.current = remotePosts;
      syncedXPostsRef.current = JSON.stringify(remotePosts);
      setXPosts(remotePosts);
      saveXPosts(remotePosts);
      return;
    }

    const localPosts = loadXPosts();
    xPostsRef.current = localPosts;
    syncedXPostsRef.current = "";
    setXPosts(localPosts);
  }, [user?.id, loading]);

  const openChat = (composer: ChatComposer = null) => {
    if (!user) {
      setTab("account");
      return;
    }

    setChatBaseTab(tab === "chat" ? chatBaseTab : tab);
    setChatComposer(composer);

    // Opening a new X post should stay above the current surface instead of
    // routing the whole app into the chat page.
    if (composer === "post") {
      return;
    }

    setTab("chat");
  };

  const visibleTab = tab === "chat" ? chatBaseTab : tab;

  // شاشة تحميل خفيفة ريثما يُحدد وضع الجلسة
  if (loading) {
    return (
      <div
        style={{
          background: "#000",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        جاري تحميل التطبيق...
      </div>
    );
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
          <XPage
            posts={xPosts}
            onOpenChat={openChat}
            onUpdatePost={(postId, updatePost) => {
              updateXPosts((prev) =>
                prev.map((post) =>
                  post.id === postId ? updatePost(post) : post,
                ),
              );
            }}
          />
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
      {(tab === "chat" || chatComposer === "post") && (
        <ChatPage
          initialComposer={chatComposer}
          onCreatePost={(post) => {
            updateXPosts((prev) => [post, ...prev]);
            setChatComposer(null);
            setTab(chatBaseTab);
          }}
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
