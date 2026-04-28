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
import AdminPage from "./pages/AdminPage";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { canAccessAdmin, getAdminRole } from "./lib/admin";
import { fetchXPostsFromDatabase, syncXPostsChange } from "./lib/socialTables";
import {
  mergeXPosts,
  loadXPosts,
  loadStoredXPosts,
  normalizeXPosts,
  saveXPosts,
  type XPost,
} from "./lib/xPosts";

type HomeMode = "tiktok" | "x";
type ChatComposer = "dm" | "group" | "post" | null;
type AuthMode = "login" | "signup";
type AppTab = TabType | "admin";

// ─── الجزء الداخلي للتطبيق — يستطيع استخدام useAuth ─────────────────────────
function AppContent() {
  const [tab, setTab] = useState<AppTab>("home");
  const [chatBaseTab, setChatBaseTab] = useState<AppTab>("home");
  const [mode, setMode] = useState<HomeMode>("tiktok");
  const [chatComposer, setChatComposer] = useState<ChatComposer>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [tiktokCameraRequestKey, setTiktokCameraRequestKey] = useState(0);
  const [pendingTikTokOpen, setPendingTikTokOpen] = useState(false);
  const [xPosts, setXPosts] = useState<XPost[]>(() => loadXPosts());
  const { user, isRecovery, clearRecovery, loading } = useAuth();
  const adminRole = getAdminRole(user);
  const isAdminAllowed = canAccessAdmin(user);
  const xPostsRef = useRef<XPost[]>(xPosts);
  const xSyncRequestIdRef = useRef(0);

  const resolveSynchronizedPosts = ({
    previousPosts,
    optimisticPosts,
    persistedPosts,
  }: {
    previousPosts: XPost[];
    optimisticPosts: XPost[];
    persistedPosts: XPost[];
  }) => {
    const hasStructuralChange =
      previousPosts.length !== optimisticPosts.length ||
      previousPosts.some(
        (post, index) => post.id !== optimisticPosts[index]?.id,
      );

    if (!hasStructuralChange) {
      return mergeXPosts(persistedPosts, optimisticPosts);
    }

    if (persistedPosts.length === 0 && optimisticPosts.length > 0) {
      return optimisticPosts;
    }

    const previousPostIds = new Set(previousPosts.map((post) => post.id));
    const persistedPostIds = new Set(persistedPosts.map((post) => post.id));
    const stableLocalOnlyPosts = optimisticPosts.filter(
      (post) => previousPostIds.has(post.id) && !persistedPostIds.has(post.id),
    );

    return mergeXPosts(persistedPosts, stableLocalOnlyPosts);
  };

  const updateXPosts = (updater: (currentPosts: XPost[]) => XPost[]) => {
    const previousPosts = xPostsRef.current;
    const optimisticPosts = updater(previousPosts);

    xPostsRef.current = optimisticPosts;
    setXPosts(optimisticPosts);
    saveXPosts(optimisticPosts);

    if (loading || !user) {
      return;
    }

    const requestId = ++xSyncRequestIdRef.current;

    void syncXPostsChange({
      previousPosts,
      nextPosts: optimisticPosts,
      currentUserId: user.id,
    })
      .then((persistedPosts) => {
        if (requestId !== xSyncRequestIdRef.current) return;

        const resolvedPosts = resolveSynchronizedPosts({
          previousPosts,
          optimisticPosts,
          persistedPosts,
        });

        xPostsRef.current = resolvedPosts;
        setXPosts(resolvedPosts);
        saveXPosts(resolvedPosts);
      })
      .catch(() => {
        // Keep the optimistic snapshot and local fallback if DB sync fails.
      });
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
    if (!user && (tab === "chat" || tab === "profile" || tab === "admin")) {
      setTab("account");
    }
  }, [user, tab]);

  useEffect(() => {
    if (tab === "admin" && !isAdminAllowed) {
      setTab(user ? "profile" : "account");
    }
  }, [isAdminAllowed, tab, user]);

  useEffect(() => {
    xPostsRef.current = xPosts;
  }, [xPosts]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const localPosts = loadXPosts();
      xPostsRef.current = localPosts;
      setXPosts(localPosts);
      return;
    }

    let cancelled = false;

    const hydratePosts = async () => {
      let databasePosts: XPost[] = [];

      try {
        databasePosts = await fetchXPostsFromDatabase(user.id);

        if (cancelled) return;
      } catch {
        // Fall back to legacy sources below.
      }

      const legacyPosts = normalizeXPosts(user.user_metadata?.x_posts);
      const localPosts = loadStoredXPosts();
      const mergedPosts = mergeXPosts(databasePosts, legacyPosts, localPosts);
      const nextPosts = mergedPosts.length ? mergedPosts : loadXPosts();

      if (cancelled) return;

      xPostsRef.current = nextPosts;
      setXPosts(nextPosts);
      saveXPosts(nextPosts);
    };

    void hydratePosts();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.user_metadata?.x_posts, loading]);

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

  useEffect(() => {
    if (!pendingTikTokOpen || mode !== "tiktok" || visibleTab !== "home") {
      return;
    }

    setPendingTikTokOpen(false);
    setTiktokCameraRequestKey((currentKey) => currentKey + 1);
  }, [pendingTikTokOpen, mode, visibleTab]);

  const handleBottomNavHomeAction = () => {
    if (mode === "x") {
      openChat("post");
      return;
    }

    if (!user) {
      setTab("account");
      return;
    }

    if (visibleTab !== "home" || tab === "chat" || chatComposer === "post") {
      setPendingTikTokOpen(true);
      setChatComposer(null);
      setChatBaseTab("home");
      setTab("home");
      return;
    }

    setTiktokCameraRequestKey((currentKey) => currentKey + 1);
  };

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
          <TikTokPage cameraRequestKey={tiktokCameraRequestKey} />
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

      {visibleTab === "fans" && (
        <FansPage
          onRequireAuth={() => {
            setAuthMode("login");
            setTab("account");
          }}
        />
      )}
      {visibleTab === "leagues" && <LeaguesPage />}
      {visibleTab === "profile" && (
        <ProfilePage
          onSignOut={() => setTab("home")}
          onOpenAdmin={() => setTab("admin")}
          canOpenAdmin={isAdminAllowed}
          xPosts={xPosts}
        />
      )}
      {visibleTab === "admin" && adminRole && (
        <AdminPage
          role={adminRole}
          posts={xPosts}
          onDeletePost={(postId) => {
            updateXPosts((prev) => prev.filter((post) => post.id !== postId));
          }}
          actorLabel={
            user?.user_metadata?.full_name?.trim() ||
            user?.user_metadata?.name?.trim() ||
            user?.email ||
            "admin"
          }
          onClose={() => setTab("profile")}
        />
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
        current={
          visibleTab === "profile" || visibleTab === "admin"
            ? "account"
            : visibleTab
        }
        homeMode={mode}
        onHomeAction={handleBottomNavHomeAction}
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
