import type { ReactNode } from "react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  HOME_PALETTES,
  INITIAL_PROFILE,
  INITIAL_SUPPORTERS,
  INITIAL_VIDEOS,
} from "./app.data";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "./lib/crossPlatformStyles";
import HomeScreen from "./screens/HomeScreen";
import FansScreen from "./screens/FansScreen";
import LeaguesScreen from "./screens/leagues";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/profile";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import VarExcellenceScreen from "./screens/VarExcellenceScreen";
import { fetchAppRuntimeSettings } from "./lib/app/app-runtime-settings";
import FloatingThemeSwitch from "./components/FloatingThemeSwitch";
import FloatingProfileArrow from "./components/FloatingProfileArrow";
import ProfileSheetModal from "./components/ProfileSheetModal";
import LogoutFarewellOverlay from "./components/LogoutFarewellOverlay";
import BottomNav from "./components/BottomNav";
import {
  client as appwriteClient,
  deleteAppwritePost,
  findAppwriteProfileIndexByDisplayVarId,
  hasAppwriteProjectConfig,
  listAppwriteFollowingVarIds,
  listAppwriteProfileIndexesByVarIds,
  listAppwriteVarSocialInteractions,
  normalizeAppwriteDisplayVarId,
  saveAppwriteNotification,
  syncAppwriteSocialInteraction,
  updateAppwritePost,
} from "./lib/appwrite";
import type {
  AuthMode,
  FanClubId,
  FollowingProfileCard,
  HomeMode,
  MainTab,
  PendingAuthIntent,
  Post,
  PostReply,
  SocialInteractionRecord,
} from "./app.types";
import type { XFeedTab } from "./screens/x-feed/x-feed.types";
import { styles, SHELL_WIDTH } from "./appshell/appshell.styles";
import {
  normalizeAuthorId,
  buildDefaultPostAuthorId,
  writeStoredGoogleAuthSnapshot,
  buildFollowingProfileCard,
  buildCurrentUserPostIdentity,
  createPostHandle,
  hashFeedEntryId,
  formatPostTime,
  resolveCanAccessAdminPanel,
  openAdminWebPanel,
} from "./appshell/appshell.helpers";
import { PostComposerModal } from "./appshell/PostComposerModal";
import { StudioModal } from "./appshell/StudioModal";
import { useAppwriteAuth } from "./appshell/appshell.auth";
import {
  useAppwritePostsSync,
  publishAppwritePost,
} from "./appshell/appshell.posts";
import {
  useAppwriteVarProfile,
  makeTrackVarInteraction,
} from "./appshell/appshell.profile";
import { lockMatchPrediction } from "./appshell/appshell.predictions";
import type { MatchPredictionLockInput } from "./lib/predictions/matchPrediction.utils";

const POST_COMPOSER_DEFAULT_TITLE = "";
const LOGOUT_FAREWELL_MS = 3000;
const INITIAL_NOTICE = hasAppwriteProjectConfig()
  ? "تم تجهيز الواجهة وربط Appwrite الأساسي."
  : "تم تجهيز الواجهة بالكامل داخل Expo.";

function readPendingAddDisplayVarIdFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const currentUrl = new URL(window.location.href);
    const addPathMatch = currentUrl.pathname.match(/^\/add\/([^/?#]+)/i);

    if (!addPathMatch?.[1]) {
      return "";
    }

    return normalizeAppwriteDisplayVarId(decodeURIComponent(addPathMatch[1]));
  } catch {
    return "";
  }
}

function clearHandledAddRouteFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentUrl = new URL(window.location.href);

    if (!/^\/add\//i.test(currentUrl.pathname)) {
      return;
    }

    window.history.replaceState(
      {},
      "",
      `/${currentUrl.search}${currentUrl.hash}`,
    );
  } catch {
    // Keep the current URL if history replacement is unavailable.
  }
}

const HOME_MODE_STORAGE_KEY = "var.homeMode";

function readStoredHomeMode(): HomeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(HOME_MODE_STORAGE_KEY)?.trim();
    return stored === "x" || stored === "tiktok" ? stored : null;
  } catch {
    return null;
  }
}

function persistHomeMode(mode: HomeMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HOME_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures and keep the in-memory choice.
  }
}

export default function AppShell() {
  const { height, width } = useWindowDimensions();
  const [currentTab, setCurrentTab] = useState<MainTab>("home");
  const [homeMode, setHomeModeState] = useState<HomeMode>(
    () => readStoredHomeMode() ?? "x",
  );
  const hasLockedHomeModeRef = useRef(Boolean(readStoredHomeMode()));
  const setHomeMode = useCallback((mode: HomeMode) => {
    persistHomeMode(mode);
    hasLockedHomeModeRef.current = true;
    // Use startTransition to avoid UI freeze during mode switch
    startTransition(() => {
      setHomeModeState(mode);
    });
  }, []);
  const [xFeedActiveTab, setXFeedActiveTab] = useState<XFeedTab>("timeline");
  const [appRuntimeSettings, setAppRuntimeSettings] = useState({
    richIconsEnabled: true,
    gpuAccelerationEnabled: true,
    updatedAt: "",
  });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isVarExcellencePanelOpen, setIsVarExcellencePanelOpen] = useState(false);
  const [notice, setNotice] = useState(INITIAL_NOTICE);
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [fansPosts, setFansPosts] = useState<Post[]>([]);
  const [supporters, setSupporters] = useState(INITIAL_SUPPORTERS);
  const [supportedTeams, setSupportedTeams] = useState<FanClubId[]>([]);
  const [followedAuthorIds, setFollowedAuthorIds] = useState<string[]>([]);
  const [followedProfiles, setFollowedProfiles] = useState<
    FollowingProfileCard[]
  >([]);
  const [socialInteractions, setSocialInteractions] = useState<
    import("./app.types").SocialInteractionRecord[]
  >([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioAssetName, setStudioAssetName] = useState("");
  const [studioAssetUri, setStudioAssetUri] = useState("");
  const [studioCaption, setStudioCaption] = useState("");
  const [studioTag, setStudioTag] = useState("Studio");
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [postComposerTarget, setPostComposerTarget] = useState<"x" | "fans">("x");
  const [postTitle, setPostTitle] = useState(POST_COMPOSER_DEFAULT_TITLE);
  const [postContent, setPostContent] = useState("");
  const [postMediaUri, setPostMediaUri] = useState("");
  const [postAuthorId, setPostAuthorId] = useState(
    buildDefaultPostAuthorId(INITIAL_PROFILE),
  );
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postComposerNotice, setPostComposerNotice] = useState("");
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const refreshInFlightRef = useRef(false);
  const [pendingAuthIntent, setPendingAuthIntent] =
    useState<PendingAuthIntent | null>(null);
  const [pendingAddDisplayVarId, setPendingAddDisplayVarId] = useState(
    readPendingAddDisplayVarIdFromUrl,
  );
  const [pendingAuthReturnTab, setPendingAuthReturnTab] =
    useState<MainTab | null>(null);
  const [shouldResumePendingAuth, setShouldResumePendingAuth] = useState(false);
  const [resumeReplyPostId, setResumeReplyPostId] = useState<number | null>(
    null,
  );
  const [isLogoutFarewellVisible, setIsLogoutFarewellVisible] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [fansProfileSheetRequest, setFansProfileSheetRequest] = useState<
    "posts" | "likes" | "reposts" | null
  >(null);
  const layoutWidth = Math.min(width, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const themeSwitchTopInset = Math.round(9.5 * chromeScale);
  const themeSwitchLeftInset = Math.round(17.5 * chromeScale);
  const bottomDockHorizontalInset = Math.round(8 * chromeScale);
  const bottomDockBottomInset = Math.round(6 * chromeScale);

  const {
    isLoggedIn,
    appwriteUser,
    completeAuthFlow,
    signOut,
    handleSaveProfile: persistAppwriteProfile,
  } = useAppwriteAuth({
    pendingAuthIntent,
    pendingAuthReturnTab,
    setPendingAuthIntent,
    setPendingAuthReturnTab,
    setShouldResumePendingAuth,
    setCurrentTab,
    setAuthMode,
    setProfile,
    setPostAuthorId,
    setNotice,
    onSignedOut: () => {
      setIsAdminDashboardOpen(false);
      setIsVideoFullscreen(false);
      setPendingAuthIntent(null);
      setPendingAuthReturnTab(null);
      setShouldResumePendingAuth(false);
      setResumeReplyPostId(null);
      setFollowedAuthorIds([]);
      setFollowedProfiles([]);
      setProfile(INITIAL_PROFILE);
      setPostAuthorId(buildDefaultPostAuthorId(INITIAL_PROFILE));
      setIsPostComposerOpen(false);
      setPostTitle(POST_COMPOSER_DEFAULT_TITLE);
      setPostContent("");
      setPostMediaUri("");
      setIsStudioOpen(false);
      setStudioAssetName("");
      setStudioAssetUri("");
      setStudioCaption("");
      setStudioTag("Studio");
      setCurrentTab("home");
    },
  });

  const getDefaultComposerAuthorId = () =>
    appwriteUser?.varId.trim() || buildDefaultPostAuthorId(profile);

  const { refreshVarProfile } = useAppwriteVarProfile({
    isLoggedIn,
    appwriteUser,
    setProfile,
    setNotice,
  });

  const trackVarInteraction = makeTrackVarInteraction(
    appwriteUser,
    refreshVarProfile,
  );

  const handleSignOutWithFarewell = async () => {
    if (isLogoutFarewellVisible) {
      return;
    }

    setIsLogoutFarewellVisible(true);
    setNotice("");
    const startedAt = Date.now();

    try {
      await signOut({ suppressNotice: true });
      setCurrentTab("account");
      setAuthMode("login");
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, LOGOUT_FAREWELL_MS - elapsed);

      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }

      setIsLogoutFarewellVisible(false);
    }
  };

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let isActive = true;
    const currentVarId = appwriteUser?.varId.trim();

    if (!isLoggedIn || !currentVarId) {
      setFollowedAuthorIds([]);
      setSocialInteractions([]);
      return;
    }

    const syncFollowingAuthors = async () => {
      try {
        const nextFollowedAuthorIds =
          await listAppwriteFollowingVarIds(currentVarId);

        if (!isActive) {
          return;
        }

        setFollowedAuthorIds(nextFollowedAuthorIds);
      } catch {
        // Keep the current follow list if Appwrite sync fails temporarily.
      }
    };

    const syncSocialInteractions = async () => {
      try {
        const summary = await listAppwriteVarSocialInteractions(currentVarId);

        if (!isActive) {
          return;
        }

        // تحويل AppwriteSocialInteractionRecord إلى SocialInteractionRecord
        const records: SocialInteractionRecord[] =
          summary.records?.map((record) => ({
            id: record.id,
            varId: record.varId,
            targetId: record.targetId,
            action: record.action as SocialInteractionRecord["action"],
            mode: record.mode as SocialInteractionRecord["mode"],
            active: record.active,
            createdAt: record.createdAt,
            updatedAt: record.createdAt, // Appwrite لا يرجع updatedAt منفصل
            value: record.value,
          })) || [];

        setSocialInteractions(records);
      } catch {
        // Keep empty if Appwrite sync fails temporarily.
        setSocialInteractions([]);
      }
    };

    void syncFollowingAuthors();
    void syncSocialInteractions();

    return () => {
      isActive = false;
    };
  }, [appwriteUser?.varId, isLoggedIn]);

  useEffect(() => {
    let isActive = true;

    if (!isLoggedIn || !followedAuthorIds.length) {
      setFollowedProfiles([]);
      return;
    }

    setFollowedProfiles((currentProfiles) => {
      const currentProfileMap = new Map(
        currentProfiles.map((profileCard) => [profileCard.varId, profileCard]),
      );

      return followedAuthorIds.map(
        (varId) =>
          currentProfileMap.get(normalizeAuthorId(varId)) ||
          buildFollowingProfileCard(null, varId),
      );
    });

    const syncFollowedProfiles = async () => {
      try {
        const profileIndexes =
          await listAppwriteProfileIndexesByVarIds(followedAuthorIds);

        if (!isActive) {
          return;
        }

        const profileIndexMap = new Map(
          profileIndexes.map((profileIndex) => [
            normalizeAuthorId(profileIndex.varId),
            profileIndex,
          ]),
        );

        setFollowedProfiles(
          followedAuthorIds.map((varId) =>
            buildFollowingProfileCard(
              profileIndexMap.get(normalizeAuthorId(varId)),
              varId,
            ),
          ),
        );
      } catch {
        if (!isActive) {
          return;
        }

        setFollowedProfiles(
          followedAuthorIds.map((varId) =>
            buildFollowingProfileCard(null, varId),
          ),
        );
      }
    };

    void syncFollowedProfiles();

    return () => {
      isActive = false;
    };
  }, [followedAuthorIds, isLoggedIn]);

  const {
    syncPostsQuiet,
    loadMorePosts,
    isLoadingMorePosts,
    hasMorePosts,
  } = useAppwritePostsSync({
    isLoggedIn,
    appwriteUser,
    profile,
    setPosts,
    setFansPosts,
    setNotice,
  });

  const syncAppRuntimeSettings = useCallback(async () => {
    const settings = await fetchAppRuntimeSettings();
    
    // Only update state if values actually changed to avoid re-renders
    setAppRuntimeSettings((prev) => {
      if (
        prev.richIconsEnabled === settings.richIconsEnabled &&
        prev.gpuAccelerationEnabled === settings.gpuAccelerationEnabled &&
        prev.updatedAt === settings.updatedAt
      ) {
        return prev; // Return same reference to prevent re-render
      }
      return {
        richIconsEnabled: settings.richIconsEnabled,
        gpuAccelerationEnabled: settings.gpuAccelerationEnabled,
        updatedAt: settings.updatedAt,
      };
    });

    if (!hasLockedHomeModeRef.current) {
      setHomeModeState(settings.uiMode);
      hasLockedHomeModeRef.current = true;
    }
  }, []);

  useEffect(() => {
    void syncAppRuntimeSettings();
    const intervalId = setInterval(() => {
      void syncAppRuntimeSettings();
    }, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [syncAppRuntimeSettings]);

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        return await Promise.race([
          promise,
          new Promise<T>((resolve) => {
            timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
          }),
        ]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    },
    [],
  );

  const refreshVisibleAppData = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsPullRefreshing(true);

    const finishRefresh = () => {
      refreshInFlightRef.current = false;
      setIsPullRefreshing(false);
    };

    const safetyTimer = setTimeout(finishRefresh, 4500);

    try {
      await Promise.allSettled([
        withTimeout(syncPostsQuiet(), 3500, undefined),
        withTimeout(syncAppRuntimeSettings(), 2500, undefined),
        appwriteUser?.varId
          ? withTimeout(
              refreshVarProfile(appwriteUser.varId, true),
              3500,
              undefined,
            )
          : Promise.resolve(),
      ]);
    } catch {
      // Pull refresh should never block the UI on partial failures.
    } finally {
      clearTimeout(safetyTimer);
      finishRefresh();
    }
  }, [
    appwriteUser?.varId,
    refreshVarProfile,
    syncAppRuntimeSettings,
    syncPostsQuiet,
    withTimeout,
  ]);

  const canAccessAdminPanel = useMemo(
    () => resolveCanAccessAdminPanel(appwriteUser, profile),
    [appwriteUser, profile, profile.role],
  );

  const handleLockMatchPrediction = (input: MatchPredictionLockInput) => {
    const varId = appwriteUser?.varId.trim() || profile.varId.trim();

    void lockMatchPrediction({
      varId,
      input,
      setProfile,
      setNotice,
    });
  };

  useEffect(() => {
    if (currentTab !== "home" || homeMode !== "tiktok") {
      setIsVideoFullscreen(false);
    }
  }, [homeMode, currentTab]);

  const requireAuth = (
    message = "سجل الدخول أولاً",
    intent?: PendingAuthIntent,
  ) => {
    setPendingAuthIntent(intent ?? null);
    setPendingAuthReturnTab(currentTab);
    setShouldResumePendingAuth(false);
    setAuthMode("login");
    setCurrentTab("account");
    setNotice(message);
  };

  const consumeReplyIntent = () => {
    setResumeReplyPostId(null);
  };

  const resetStudioDraft = () => {
    setStudioAssetName("");
    setStudioAssetUri("");
    setStudioCaption("");
    setStudioTag("Studio");
  };

  const closeStudio = () => {
    setIsStudioOpen(false);
    resetStudioDraft();
  };

  const resetPostComposerDraft = () => {
    setPostTitle(POST_COMPOSER_DEFAULT_TITLE);
    setPostContent("");
    setPostMediaUri("");
    setPostAuthorId(getDefaultComposerAuthorId());
  };

  const closePostComposer = () => {
    setIsPostComposerOpen(false);
    setPostComposerNotice("");
    setPostComposerTarget("x");
    resetPostComposerDraft();
  };

  const openPostComposer = () => {
    setPostComposerTarget("x");
    setIsVideoFullscreen(false);
    resetPostComposerDraft();

    const resolvedAuthorId =
      appwriteUser?.varId.trim() ||
      profile.varId.trim() ||
      buildDefaultPostAuthorId(profile);

    if (resolvedAuthorId) {
      setPostAuthorId(resolvedAuthorId);
    }

    setIsPostComposerOpen(true);
  };

  const openFansPostComposer = () => {
    setPostComposerTarget("fans");
    setIsVideoFullscreen(false);
    resetPostComposerDraft();

    const resolvedAuthorId =
      appwriteUser?.varId.trim() ||
      profile.varId.trim() ||
      buildDefaultPostAuthorId(profile);

    if (resolvedAuthorId) {
      setPostAuthorId(resolvedAuthorId);
    }

    setIsPostComposerOpen(true);
  };

  const openStudio = () => {
    setIsVideoFullscreen(false);
    setIsStudioOpen(true);
  };

  const selectMainTab = (tab: MainTab) => {
    setCurrentTab(tab);
  };

  const openFansAssociationFromProfile = useCallback(
    (options?: { sheetTab?: "posts" | "likes" | "reposts" }) => {
      if (options?.sheetTab) {
        setFansProfileSheetRequest(options.sheetTab);
      }
      setCurrentTab("fans");
    },
    [],
  );

  const resolvePostInteractionTargetId = (postId: number) => {
    const targetPost =
      posts.find((candidate) => candidate.id === postId) ??
      fansPosts.find((candidate) => candidate.id === postId);

    return targetPost?.sourceId?.trim() || String(postId);
  };

  const updatePostInFeeds = (
    postId: number,
    updater: (post: Post) => Post,
  ) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? updater(post) : post)),
    );
    setFansPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? updater(post) : post)),
    );
  };

  const prependPost = (post: Post) => {
    if (post.feedScope === "fans") {
      return;
    }

    setPosts((currentPosts) => [post, ...currentPosts]);
  };

  const prependFansPost = (post: Post) => {
    const fansScopedPost = { ...post, feedScope: "fans" as const };
    setFansPosts((currentPosts) => [fansScopedPost, ...currentPosts]);
  };

  const pickStudioVideo = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });

      if (pickerResult.canceled) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      const fileName =
        selectedAsset.fileName ??
        selectedAsset.uri.split("/").pop() ??
        "clip.mp4";

      setStudioAssetName(fileName);
      setStudioAssetUri(selectedAsset.uri);
      setStudioCaption((currentCaption) =>
        currentCaption.trim()
          ? currentCaption
          : `لقطة جديدة من استديو VAR: ${fileName.replace(/\.[^.]+$/, "")}`,
      );
    } catch {
      setNotice("تعذر فتح مكتبة الفيديو على هذا الجهاز.");
    }
  };

  const publishStudioVideo = () => {
    if (!studioAssetName.trim() || !studioAssetUri.trim()) {
      setNotice("اختر فيديو من الاستديو أولاً.");
      return;
    }

    const trimmedCaption =
      studioCaption.trim() ||
      `لقطة جديدة من استديو VAR: ${studioAssetName.replace(/\.[^.]+$/, "")}`;
    const normalizedHandle = profile.username.startsWith("@")
      ? profile.username
      : `@${profile.username}`;
    const nextTag = studioTag.trim() || "Studio";
    const creatorName = isLoggedIn ? profile.displayName : "VAR Studio";
    const creatorHandle = isLoggedIn ? normalizedHandle : "@varstudio";

    const nextVideoId = Date.now();

    setVideos((currentVideos) => [
      {
        id: nextVideoId,
        creatorName,
        creatorHandle,
        caption: trimmedCaption,
        mediaUri: studioAssetUri,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
        likedByMe: false,
        savedByMe: false,
        sharedByMe: false,
        theme: ["#0E4B87", "#030A15"],
        tag: nextTag.slice(0, 12),
      },
      ...currentVideos,
    ]);
    closeStudio();
    setCurrentTab("home");
    trackVarInteraction({
      mode: homeMode,
      action: "post",
      targetId: String(nextVideoId),
      value: trimmedCaption,
    });
    setNotice(`تمت إضافة ${studioAssetName} إلى الاستديو.`);
  };

  const reportPostComposerStatus = (message: string) => {
    setNotice(message);
    setPostComposerNotice(message);

    if (
      message.includes("فشل") ||
      message.includes("تعذر") ||
      message.includes("غير مكتمل")
    ) {
      console.warn("[WEBPLUS] Post publish blocked:", message);
    }
  };

  const handleAttachPostImage = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.82,
      });

      if (pickerResult.canceled) {
        return;
      }

      const nextMediaUri = pickerResult.assets[0]?.uri?.trim() || "";

      if (!nextMediaUri) {
        setNotice("تعذر قراءة الصورة المختارة.");
        return;
      }

      setPostMediaUri(nextMediaUri);
      setPostComposerNotice("تم إرفاق الصورة. يمكنك النشر الآن.");
    } catch {
      setNotice("تعذر فتح مكتبة الصور على هذا الجهاز.");
    }
  };

  const handlePublishAppwritePost = () => {
    const target = postComposerTarget;
    setPostComposerNotice("");

    void publishAppwritePost({
      postTitle,
      postContent,
      postAuthorId,
      postMediaUri,
      feedScope: target,
      appwriteUser,
      profile,
      onPublished: (post) => {
        if (target === "fans") {
          prependFansPost(post);
        } else {
          prependPost(post);
          setCurrentTab("home");
        }
      },
      setIsPublishingPost,
      setNotice: reportPostComposerStatus,
      onClose: closePostComposer,
      trackVarInteraction,
    });
  };

  const handleHomeAction = () => {
    // فتح لوحة فار للتميز بدلاً من البوست كومبوزر
    setIsVarExcellencePanelOpen(true);
  };

  const toggleVideoLike = (videoId: number) => {
    let nextLiked = false;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        nextLiked = !video.likedByMe;

        return {
          ...video,
          likedByMe: nextLiked,
          likes: Math.max(0, video.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );

    trackVarInteraction({
      mode: "tiktok",
      action: "like",
      targetId: String(videoId),
      active: nextLiked,
    });
  };

  const toggleVideoSave = (videoId: number) => {
    let nextSaved = false;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        nextSaved = !video.savedByMe;

        return {
          ...video,
          savedByMe: nextSaved,
          saves: Math.max(0, video.saves + (nextSaved ? 1 : -1)),
        };
      }),
    );
    setNotice(
      nextSaved ? "تم حفظ الفيديو." : "تمت إزالة الفيديو من المحفوظات.",
    );
    trackVarInteraction({
      mode: "tiktok",
      action: "save",
      targetId: String(videoId),
      active: nextSaved,
    });
  };

  const toggleVideoShare = (videoId: number) => {
    let nextShared = false;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        nextShared = !video.sharedByMe;

        return {
          ...video,
          sharedByMe: nextShared,
          shares: Math.max(0, video.shares + (nextShared ? 1 : -1)),
        };
      }),
    );
    setNotice(
      nextShared ? "تم تجهيز مشاركة الفيديو." : "تم إلغاء مشاركة الفيديو.",
    );
    trackVarInteraction({
      mode: "tiktok",
      action: "share",
      targetId: String(videoId),
      active: nextShared,
    });
  };

  const submitVideoComment = (videoId: number, comment: string) => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      return;
    }

    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId
          ? { ...video, comments: video.comments + 1 }
          : video,
      ),
    );
    trackVarInteraction({
      mode: "tiktok",
      action: "comment",
      targetId: String(videoId),
      value: trimmedComment,
    });
    setNotice("تم إرسال تعليقك على الفيديو.");
  };

  const toggleVideoFullscreen = () => {
    setIsVideoFullscreen((currentValue) => !currentValue);
  };

  const exitVideoFullscreen = () => {
    setIsVideoFullscreen(false);
  };

  const togglePostLike = (postId: number) => {
    let nextLiked = false;
    const interactionTargetId = resolvePostInteractionTargetId(postId);

    updatePostInFeeds(postId, (post) => {
      nextLiked = !post.likedByMe;

      return {
        ...post,
        likedByMe: nextLiked,
        likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
      };
    });
    trackVarInteraction({
      mode: "x",
      action: "like",
      targetId: interactionTargetId,
      active: nextLiked,
    });
  };

  const toggleAuthorFollow = (authorVarId: string) => {
    const currentVarId = appwriteUser?.varId.trim() || profile.varId.trim();
    const normalizedCurrentVarId = normalizeAuthorId(currentVarId);
    const normalizedAuthorVarId = normalizeAuthorId(authorVarId);

    if (
      !currentVarId ||
      !normalizedAuthorVarId ||
      normalizedAuthorVarId === normalizedCurrentVarId
    ) {
      return;
    }

    const alreadyFollowing = followedAuthorIds.includes(normalizedAuthorVarId);
    const nextFollowing = !alreadyFollowing;

    setFollowedAuthorIds((currentIds) =>
      nextFollowing
        ? Array.from(new Set([...currentIds, normalizedAuthorVarId]))
        : currentIds.filter((candidate) => candidate !== normalizedAuthorVarId),
    );
    setNotice(
      nextFollowing ? "تمت متابعة المستخدم." : "تم إلغاء متابعة المستخدم.",
    );

    void (async () => {
      try {
        await syncAppwriteSocialInteraction({
          varId: currentVarId,
          mode: "profile",
          action: "follow",
          targetId: normalizedAuthorVarId,
          active: nextFollowing,
        });

        if (nextFollowing) {
          void saveFollowNotification(normalizedAuthorVarId).catch(
            () => undefined,
          );
        }
      } catch {
        setFollowedAuthorIds((currentIds) =>
          nextFollowing
            ? currentIds.filter(
                (candidate) => candidate !== normalizedAuthorVarId,
              )
            : Array.from(new Set([...currentIds, normalizedAuthorVarId])),
        );
        setNotice(
          nextFollowing
            ? "تعذر حفظ المتابعة الآن."
            : "تعذر إلغاء المتابعة الآن.",
        );
      }
    })();
  };

  const saveFollowNotification = async (recipientVarId: string) => {
    const currentVarId = appwriteUser?.varId.trim() || profile.varId.trim();
    const normalizedCurrentVarId = normalizeAuthorId(currentVarId);
    const normalizedRecipientVarId = normalizeAuthorId(recipientVarId);

    if (!normalizedCurrentVarId || !normalizedRecipientVarId) {
      return;
    }

    const followerIdentity = buildCurrentUserPostIdentity({
      varId: currentVarId || normalizedCurrentVarId,
      profile,
      appwriteUser,
    });
    const followerName =
      followerIdentity.author?.trim() ||
      profile.displayName.trim() ||
      appwriteUser?.name.trim() ||
      "مستخدم VAR";

    await saveAppwriteNotification(normalizedRecipientVarId, {
      id: `follow-${normalizedCurrentVarId}-${normalizedRecipientVarId}`,
      title: "إضافة جديدة عبر بطاقة VAR",
      body: `${followerName} أضافك إلى المتابعين عبر الباركود.`,
      timeLabel: "الآن",
      iconName: "person-add-outline",
      accentColor: "#34D399",
      avatarUri: followerIdentity.authorAvatarUri || profile.avatarUri,
      verified: Boolean(followerIdentity.authorVerified),
      sortOrder: Date.now(),
    });
  };

  const handleAddUserByDisplayVarId = async (inputDisplayVarId: string) => {
    const normalizedDisplayVarId =
      normalizeAppwriteDisplayVarId(inputDisplayVarId);
    const currentVarId = appwriteUser?.varId.trim() || profile.varId.trim();
    const normalizedCurrentVarId = normalizeAuthorId(currentVarId);

    if (!normalizedDisplayVarId) {
      return {
        ok: false,
        message: "أدخل VAR ID صالحًا مثل VAR-1234567.",
      };
    }

    if (
      normalizedDisplayVarId ===
      normalizeAppwriteDisplayVarId(
        profile.displayVarId || appwriteUser?.displayVarId || "",
      )
    ) {
      return {
        ok: false,
        message: "لا يمكنك إضافة بطاقتك الشخصية.",
      };
    }

    const profileIndex = await findAppwriteProfileIndexByDisplayVarId(
      normalizedDisplayVarId,
    );

    if (!profileIndex?.varId.trim()) {
      return {
        ok: false,
        message: "لم يتم العثور على مستخدم بهذا المعرف.",
      };
    }

    const normalizedAuthorVarId = normalizeAuthorId(profileIndex.varId);

    if (
      !normalizedAuthorVarId ||
      normalizedAuthorVarId === normalizedCurrentVarId
    ) {
      return {
        ok: false,
        message: "لا يمكنك إضافة نفس الحساب.",
      };
    }

    if (followedAuthorIds.includes(normalizedAuthorVarId)) {
      return {
        ok: true,
        message: `أنت تتابع ${profileIndex.displayName || normalizedDisplayVarId} بالفعل.`,
      };
    }

    setFollowedAuthorIds((currentIds) =>
      Array.from(new Set([...currentIds, normalizedAuthorVarId])),
    );

    try {
      await syncAppwriteSocialInteraction({
        varId: currentVarId,
        mode: "profile",
        action: "follow",
        targetId: normalizedAuthorVarId,
        active: true,
      });

      void saveFollowNotification(normalizedAuthorVarId).catch(() => undefined);
    } catch {
      setFollowedAuthorIds((currentIds) =>
        currentIds.filter((candidate) => candidate !== normalizedAuthorVarId),
      );

      return {
        ok: false,
        message: "تعذر إضافة المستخدم الآن.",
      };
    }

    return {
      ok: true,
      message: `تمت إضافة ${profileIndex.displayName || normalizedDisplayVarId}.`,
    };
  };

  useEffect(() => {
    if (!pendingAddDisplayVarId) {
      return;
    }

    if (!isLoggedIn) {
      setCurrentTab("account");
      setNotice("سجل الدخول أولًا لإضافة صاحب بطاقة VAR.");
      return;
    }

    let isActive = true;

    void (async () => {
      const result = await handleAddUserByDisplayVarId(pendingAddDisplayVarId);

      if (!isActive) {
        return;
      }

      setNotice(result.message);
      setPendingAddDisplayVarId("");
      clearHandledAddRouteFromUrl();
      setCurrentTab("account");
    })();

    return () => {
      isActive = false;
    };
  }, [isLoggedIn, pendingAddDisplayVarId]);

  const applySupportToggle = (clubId: FanClubId) => {
    setSupportedTeams((currentTeams) => {
      const alreadySupported = currentTeams.includes(clubId);

      setSupporters((currentCounts) => ({
        ...currentCounts,
        [clubId]: Math.max(
          0,
          (currentCounts[clubId] ?? 0) + (alreadySupported ? -1 : 1),
        ),
      }));
      setNotice(
        alreadySupported
          ? "تمت إزالة الدعم من الرابطة."
          : "تم تسجيل دعمك للرابطة.",
      );

      if (alreadySupported) {
        return currentTeams.filter((teamId) => teamId !== clubId);
      }

      if (currentTeams.includes(clubId)) {
        return currentTeams;
      }

      return [...currentTeams, clubId];
    });
  };

  const submitPostReply = (postId: number, reply: string) => {
    const trimmedReply = reply.trim();
    const replyAuthorVarId =
      appwriteUser?.varId.trim() || profile.varId.trim() || postAuthorId.trim();
    const interactionTargetId = resolvePostInteractionTargetId(postId);

    if (!trimmedReply) {
      return;
    }

    const replyIdentity = buildCurrentUserPostIdentity({
      varId: replyAuthorVarId || "local-user",
      profile,
      appwriteUser,
    });
    const nextReply: PostReply = {
      id: Date.now(),
      author: replyIdentity.author || normalizeAuthorId(replyAuthorVarId),
      authorAvatarUri: replyIdentity.authorAvatarUri,
      authorVerified: replyIdentity.authorVerified,
      handle:
        replyIdentity.handle ||
        createPostHandle(replyAuthorVarId || "local-user"),
      time: "الآن",
      content: trimmedReply,
    };

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: post.replies + 1,
              replyItems: [nextReply, ...(post.replyItems ?? [])],
            }
          : post,
      ),
    );
    setFansPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: post.replies + 1,
              replyItems: [nextReply, ...(post.replyItems ?? [])],
            }
          : post,
      ),
    );
    trackVarInteraction({
      mode: "x",
      action: "reply",
      targetId: interactionTargetId,
      value: trimmedReply,
    });
    setNotice("تم إرسال الرد على المنشور.");
  };

  const togglePostRepost = (postId: number) => {
    let nextReposted = false;
    let didChange = false;
    const interactionTargetId = resolvePostInteractionTargetId(postId);
    const currentUserIdentity = buildCurrentUserPostIdentity({
      varId: profile.varId || appwriteUser?.varId || "",
      profile,
      appwriteUser,
    });
    const currentUserVarId = normalizeAuthorId(
      profile.varId || appwriteUser?.varId || "",
    );

    const applyRepostToggle = (currentPosts: Post[]) => {
      const targetPost = currentPosts.find((post) => post.id === postId);

      if (!targetPost) {
        return currentPosts;
      }

      didChange = true;
      nextReposted = !targetPost.repostedByMe;

      const updatedPosts = currentPosts
        .map((post) => {
          const postTargetId = post.sourceId?.trim() || String(post.id);

          if (postTargetId !== interactionTargetId) {
            return post;
          }

          return {
            ...post,
            repostedByMe: nextReposted,
            reposts: Math.max(0, post.reposts + (nextReposted ? 1 : -1)),
          };
        })
        .filter((post) => {
          if (nextReposted || post.repostMeta?.varId !== currentUserVarId) {
            return true;
          }

          const originalTargetId = post.sourceId?.trim() || String(postId);

          return !(
            originalTargetId === interactionTargetId &&
            post.feedKey?.startsWith("repost-local-")
          );
        });

      if (!nextReposted) {
        return updatedPosts;
      }

      const localFeedKey = `repost-local-${interactionTargetId}-${Date.now()}`;
      const basePost =
        currentPosts.find((post) => {
          const postTargetId = post.sourceId?.trim() || String(post.id);

          return postTargetId === interactionTargetId && !post.repostMeta;
        }) || targetPost;
      const { repostMeta: _repostMeta, ...postForRepost } = basePost;

      return [
        {
          ...postForRepost,
          id: hashFeedEntryId(localFeedKey),
          feedKey: localFeedKey,
          repostMeta: {
            varId: currentUserVarId,
            author:
              currentUserIdentity.author?.trim() ||
              profile.displayName.trim() ||
              currentUserVarId,
            authorAvatarUri:
              currentUserIdentity.authorAvatarUri?.trim() ||
              profile.avatarUri.trim() ||
              undefined,
            authorVerified: currentUserIdentity.authorVerified,
            handle:
              currentUserIdentity.handle?.trim() ||
              createPostHandle(profile.username.trim() || currentUserVarId),
            time: formatPostTime(new Date().toISOString()),
          },
        },
        ...updatedPosts,
      ];
    };

    setPosts(applyRepostToggle);
    setFansPosts(applyRepostToggle);

    if (!didChange) {
      return;
    }

    setNotice(
      nextReposted ? "تمت إعادة نشر المنشور." : "تم إلغاء إعادة النشر.",
    );
    trackVarInteraction({
      mode: "x",
      action: "repost",
      targetId: interactionTargetId,
      active: nextReposted,
    });
  };

  const sharePost = async (postId: number): Promise<boolean> => {
    const post =
      posts.find((candidate) => candidate.id === postId) ??
      fansPosts.find((candidate) => candidate.id === postId);

    if (!post) {
      return false;
    }

    const interactionTargetId = post.sourceId?.trim() || String(postId);
    const shareText = `${post.title ? `${post.title}\n` : ""}${post.content}\n${post.handle}`;

    const applyLocalShare = () => {
      let didUpdate = false;

      const updateFeed = (currentPosts: Post[]) =>
        currentPosts.map((candidate) => {
          const candidateTargetId =
            candidate.sourceId?.trim() || String(candidate.id);

          if (
            candidateTargetId !== interactionTargetId ||
            candidate.sharedByMe
          ) {
            return candidate;
          }

          didUpdate = true;

          return {
            ...candidate,
            sharedByMe: true,
            shares: candidate.shares + 1,
          };
        });

      setPosts(updateFeed);
      setFansPosts(updateFeed);

      return didUpdate;
    };

    if (Platform.OS === "web") {
      const webNavigator =
        typeof navigator === "undefined"
          ? null
          : (navigator as Navigator & {
              share?: (data: {
                title?: string;
                text?: string;
              }) => Promise<void>;
              clipboard?: { writeText?: (text: string) => Promise<void> };
            });

      try {
        if (webNavigator?.share) {
          await webNavigator.share({
            title: post.title || "VAR X",
            text: shareText,
          });

          const didUpdate = applyLocalShare();
          if (didUpdate) {
            trackVarInteraction({
              mode: "x",
              action: "share",
              targetId: interactionTargetId,
              active: true,
            });
          }
          setNotice(
            didUpdate
              ? "تم فتح نافذة مشاركة المنشور."
              : "هذا المنشور تمت مشاركته مسبقًا.",
          );
          return didUpdate;
        }

        if (webNavigator?.clipboard?.writeText) {
          await webNavigator.clipboard.writeText(shareText);

          const didUpdate = applyLocalShare();
          if (didUpdate) {
            trackVarInteraction({
              mode: "x",
              action: "share",
              targetId: interactionTargetId,
              active: true,
            });
          }
          setNotice(
            didUpdate
              ? "تم نسخ المنشور للمشاركة."
              : "تم نسخ المنشور، وهو مشارك مسبقًا.",
          );
          return didUpdate;
        }
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "";
        if (errorName === "AbortError") {
          setNotice("تم إغلاق نافذة المشاركة.");
          return false;
        }

        if (webNavigator?.clipboard?.writeText) {
          try {
            await webNavigator.clipboard.writeText(shareText);

            const didUpdate = applyLocalShare();
            if (didUpdate) {
              trackVarInteraction({
                mode: "x",
                action: "share",
                targetId: interactionTargetId,
                active: true,
              });
            }
            setNotice(
              didUpdate
                ? "تعذر فتح نافذة المشاركة، فتم نسخ المنشور."
                : "تم نسخ المنشور، وهو مشارك مسبقًا.",
            );
            return didUpdate;
          } catch {
            // Continue to React Native Share fallback below.
          }
        }
      }
    }

    try {
      const shareResult = await Share.share({
        message: shareText,
      });

      if (shareResult.action === Share.sharedAction) {
        const didUpdate = applyLocalShare();
        if (didUpdate) {
          trackVarInteraction({
            mode: "x",
            action: "share",
            targetId: interactionTargetId,
            active: true,
          });
        }
        setNotice(
          didUpdate
            ? "تم فتح نافذة مشاركة المنشور."
            : "هذا المنشور تمت مشاركته مسبقًا.",
        );
        return didUpdate;
      }

      setNotice("تم إغلاق نافذة المشاركة.");
      return false;
    } catch {
      const didUpdate = applyLocalShare();
      if (didUpdate) {
        trackVarInteraction({
          mode: "x",
          action: "share",
          targetId: interactionTargetId,
          active: true,
        });
      }
      setNotice(
        didUpdate
          ? "المشاركة غير مدعومة هنا، فتم حفظ التفاعل محليًا."
          : "تعذر فتح واجهة المشاركة على هذا الجهاز.",
      );
      return didUpdate;
    }
  };

  const deletePost = async (postId: number) => {
    const post = posts.find((candidate) => candidate.id === postId);

    if (!post?.sourceId?.trim()) {
      setNotice("تعذر حذف المنشور.");
      return;
    }

    const authorVarId = normalizeAuthorId(post.authorId || "");
    const currentVarId = normalizeAuthorId(
      appwriteUser?.varId.trim() || profile.varId.trim(),
    );

    if (!currentVarId || authorVarId !== currentVarId) {
      setNotice("لا يمكنك حذف منشور لا يخصك.");
      return;
    }

    try {
      await deleteAppwritePost(post.sourceId.trim());
      setPosts((currentPosts) =>
        currentPosts.filter((candidate) => candidate.id !== postId),
      );
      setNotice("تم حذف المنشور.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر حذف المنشور.");
    }
  };

  const updatePostContent = async (postId: number, content: string) => {
    const trimmedContent = content.trim();
    const post = posts.find((candidate) => candidate.id === postId);

    if (!trimmedContent || !post?.sourceId?.trim()) {
      setNotice("اكتب محتوى المنشور قبل الحفظ.");
      return;
    }

    const authorVarId = normalizeAuthorId(post.authorId || "");
    const currentVarId = normalizeAuthorId(
      appwriteUser?.varId.trim() || profile.varId.trim(),
    );

    if (!currentVarId || authorVarId !== currentVarId) {
      setNotice("لا يمكنك تعديل منشور لا يخصك.");
      return;
    }

    try {
      await updateAppwritePost(post.sourceId.trim(), {
        content: trimmedContent,
      });
      setPosts((currentPosts) =>
        currentPosts.map((candidate) =>
          candidate.id === postId
            ? { ...candidate, content: trimmedContent }
            : candidate,
        ),
      );
      setNotice("تم تحديث المنشور.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تحديث المنشور.");
    }
  };

  const reportPost = (postId: number) => {
    const targetPost = posts.find((candidate) => candidate.id === postId);
    const interactionTargetId = resolvePostInteractionTargetId(postId);

    trackVarInteraction({
      mode: "x",
      action: "comment",
      targetId: interactionTargetId,
      value: "[report]",
    });

    if (appwriteUser?.varId.trim() && targetPost) {
      void import("./lib/appwrite/appwrite.reports").then(({ submitAppwritePostReport }) =>
        submitAppwritePostReport({
          postId: targetPost.sourceId?.trim() || String(postId),
          postVarId: targetPost.authorId?.trim() || appwriteUser.varId,
          reporterVarId: appwriteUser.varId,
          contentPreview: targetPost.content,
          reason: "user_report",
        }),
      );
    }

    setNotice("تم إرسال الإبلاغ.");
  };

  const toggleSupport = (clubId: FanClubId) => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لدعم الرابطة.", {
        type: "toggle-support",
        clubId,
      });
      return;
    }

    applySupportToggle(clubId);
  };

  useEffect(() => {
    if (!isLoggedIn || !shouldResumePendingAuth || !pendingAuthIntent) {
      return;
    }

    if (pendingAuthReturnTab && currentTab !== pendingAuthReturnTab) {
      return;
    }

    switch (pendingAuthIntent.type) {
      case "open-x-post":
        openPostComposer();
        break;
      case "reply-post":
        setResumeReplyPostId(pendingAuthIntent.postId);
        break;
      case "toggle-post-like":
        togglePostLike(pendingAuthIntent.postId);
        break;
      case "toggle-post-repost":
        togglePostRepost(pendingAuthIntent.postId);
        break;
      case "share-post":
        void sharePost(pendingAuthIntent.postId);
        break;
      case "toggle-follow-author":
        toggleAuthorFollow(pendingAuthIntent.authorVarId);
        break;
      case "toggle-support":
        applySupportToggle(pendingAuthIntent.clubId);
        break;
    }

    setPendingAuthIntent(null);
    setPendingAuthReturnTab(null);
    setShouldResumePendingAuth(false);
  }, [
    currentTab,
    isLoggedIn,
    pendingAuthIntent,
    pendingAuthReturnTab,
    shouldResumePendingAuth,
    supportedTeams,
    toggleAuthorFollow,
  ]);

  const handleAppwritePing = async () => {
    if (!appwriteClient) {
      setNotice("إعداد Appwrite غير مكتمل داخل التطبيق.");
      return;
    }

    try {
      const response = (await appwriteClient.ping()).trim() || "pong";
      setNotice(`Appwrite ping: ${response}`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `فشل Appwrite ping: ${error.message}`
          : "فشل Appwrite ping.",
      );
    }
  };

  let screen: ReactNode;
  const visibleTab: MainTab = currentTab;
  const palette = HOME_PALETTES[homeMode];
  const showThemeSwitch = false; // مخفي مؤقتاً - كان: visibleTab === "home" && !isVideoFullscreen && (homeMode === "tiktok" || xFeedActiveTab === "timeline" || xFeedActiveTab === "profile")

  switch (visibleTab) {
    case "home":
      screen = (
        <HomeScreen
          homeMode={homeMode}
          gpuAccelerationEnabled={appRuntimeSettings.gpuAccelerationEnabled}
          isLoggedIn={isLoggedIn}
          palette={palette}
          posts={posts}
          videos={videos}
          windowHeight={height}
          onChangeMode={setHomeMode}
          onPingAppwrite={handleAppwritePing}
          onRequireAuth={requireAuth}
          onTogglePostLike={togglePostLike}
          onTogglePostRepost={togglePostRepost}
          onSharePost={sharePost}
          currentUserVarId={profile.varId || appwriteUser?.varId || ""}
          currentUserDisplayName={
            profile.displayName || appwriteUser?.name || ""
          }
          currentUserDisplayVarId={
            profile.displayVarId || appwriteUser?.displayVarId || ""
          }
          currentUserAvatarUri={
            profile.avatarUri || appwriteUser?.avatarUri || ""
          }
          currentUserJoinDate={profile.joinDate}
          currentUserNationality={profile.nationality}
          currentUserAssociation={profile.association}
          currentUserCardTier={profile.cardTier}
          currentUserUsername={profile.username || appwriteUser?.username || ""}
          currentUserRole={
            appwriteUser?.role === "admin" || profile.isVerified
              ? "admin"
              : "member"
          }
          currentUserIsVerified={profile.isVerified}
          followedAuthorIds={followedAuthorIds}
          followedProfiles={followedProfiles}
          onToggleAuthorFollow={toggleAuthorFollow}
          onSubmitPostReply={submitPostReply}
          resumeReplyPostId={resumeReplyPostId}
          onReplyIntentConsumed={consumeReplyIntent}
          onShowNotice={setNotice}
          onRefreshPosts={refreshVisibleAppData}
          onLoadMorePosts={loadMorePosts}
          isRefreshingPosts={isPullRefreshing}
          isLoadingMorePosts={isLoadingMorePosts}
          hasMorePosts={hasMorePosts}
          onDeletePost={deletePost}
          onUpdatePostContent={updatePostContent}
          onReportPost={reportPost}
          onCreatePost={openPostComposer}
          onXFeedTabChange={setXFeedActiveTab}
          onToggleVideoLike={toggleVideoLike}
          onToggleVideoSave={toggleVideoSave}
          onToggleVideoShare={toggleVideoShare}
          onSubmitVideoComment={submitVideoComment}
          onToggleVideoFullscreen={toggleVideoFullscreen}
          onExitVideoFullscreen={exitVideoFullscreen}
          isVideoFullscreen={isVideoFullscreen}
        />
      );
      break;
    case "fans":
      screen = (
        <FansScreen
          isLoggedIn={isLoggedIn}
          supporters={supporters}
          supportedTeams={supportedTeams}
          userLeagueClub={profile.leagueClub || ""}
          userDisplayName={profile.displayName}
          userVarId={profile.displayVarId}
          userAvatarUri={profile.avatarUri}
          userIsVerified={profile.isVerified}
          onRequireAuth={requireAuth}
          onToggleSupport={toggleSupport}
          onRefresh={refreshVisibleAppData}
          isRefreshing={isPullRefreshing}
          posts={fansPosts}
          onTogglePostLike={togglePostLike}
          onTogglePostRepost={togglePostRepost}
          onSharePost={sharePost}
          onSubmitPostReply={submitPostReply}
          onCreatePost={openFansPostComposer}
          currentUserVarId={profile.varId || appwriteUser?.varId || ""}
          currentUserDisplayName={profile.displayName || appwriteUser?.name || ""}
          currentUserAvatarUri={profile.avatarUri || appwriteUser?.avatarUri || ""}
          initialProfileSheetTab={fansProfileSheetRequest ?? undefined}
          onInitialProfileSheetHandled={() => setFansProfileSheetRequest(null)}
          resumeReplyPostId={resumeReplyPostId}
          onReplyIntentConsumed={consumeReplyIntent}
        />
      );
      break;
    case "leagues":
      screen = (
        <LeaguesScreen
          posts={posts}
          onRefresh={refreshVisibleAppData}
          isRefreshing={isPullRefreshing}
          onLockMatchPrediction={handleLockMatchPrediction}
        />
      );
      break;
    case "account":
      screen = isLoggedIn ? (
        <ProfileScreen
          canOpenAdmin={canAccessAdminPanel}
          onOpenAdmin={() => setIsAdminDashboardOpen(true)}
          onOpenAdminWeb={() => {
            void openAdminWebPanel({
              onMissingUrl: () =>
                setNotice(
                  "تعذر تحديد رابط لوحة الإدارة. اضبط EXPO_PUBLIC_ADMIN_PANEL_URL في .env.",
                ),
            });
          }}
          adminDisplayVarId={
            profile.displayVarId ||
            appwriteUser?.displayVarId ||
            profile.varId ||
            appwriteUser?.varId ||
            ""
          }
          adminRoleLabel={profile.role === "admin" ? "ADMIN" : "MEMBER"}
          posts={posts}
          fansPosts={fansPosts}
          profile={profile}
          followedProfiles={followedProfiles}
          socialInteractions={socialInteractions}
          onRefresh={refreshVisibleAppData}
          isRefreshing={isPullRefreshing}
          onOpenFansAssociation={openFansAssociationFromProfile}
          onSaveProfile={(nextProfile) => {
            void persistAppwriteProfile(nextProfile, appwriteUser).then(
              (savedUser) => {
                if (savedUser) {
                  void refreshVarProfile(savedUser.varId, true);
                }
              },
            );
          }}
          onSignOut={() => {
            void handleSignOutWithFarewell();
          }}
          onAddUserByDisplayVarId={handleAddUserByDisplayVarId}
        />
      ) : (
        <AuthScreen
          authMode={authMode}
          onChangeMode={setAuthMode}
          onStartGoogleLogin={writeStoredGoogleAuthSnapshot}
          onRefresh={refreshVisibleAppData}
          isRefreshing={isPullRefreshing}
          onSuccess={completeAuthFlow}
        />
      );
      break;
    case "excellence":
      screen = <VarExcellenceScreen />;
      break;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appRoot}>
        <View
          {...getNativePointerEventsProps("none")}
          style={[styles.backgroundLayer, getWebPointerEventsStyle("none")]}
        >
          <View
            style={[
              styles.blurOrb,
              styles.primaryOrb,
              { backgroundColor: palette.accent },
            ]}
          />
          <View style={styles.secondaryOrb} />
          <View style={styles.tertiaryOrb} />
        </View>

        <View style={styles.shell}>
          {notice && !isVideoFullscreen && !isLogoutFarewellVisible ? (
            <View style={styles.noticeWrap}>
              <View style={styles.noticePill}>
                <Ionicons name="sparkles-outline" size={16} color="#E8F6FF" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            </View>
          ) : null}

          {screen}

          {showThemeSwitch ? (
            <View
              style={[
                styles.themeSwitchLayer,
                {
                  top: themeSwitchTopInset,
                  left: themeSwitchLeftInset,
                },
              ]}
            >
              <FloatingThemeSwitch
                selection={homeMode}
                onChange={setHomeMode}
              />
            </View>
          ) : null}

          {showThemeSwitch ? (
            <View
              style={[
                styles.themeSwitchLayer,
                {
                  top: themeSwitchTopInset,
                  left: "50%",
                  marginLeft: -22,
                  width: 44,
                  alignItems: "center",
                },
              ]}
            >
              <FloatingProfileArrow onOpen={() => setIsProfileSheetOpen(true)} />
            </View>
          ) : null}
        </View>

        <ProfileSheetModal
          visible={isProfileSheetOpen}
          onClose={() => setIsProfileSheetOpen(false)}
          isLoggedIn={isLoggedIn}
          displayName={profile.displayName || appwriteUser?.name || ""}
          displayVarId={profile.displayVarId || appwriteUser?.displayVarId || ""}
          avatarUri={profile.avatarUri || appwriteUser?.avatarUri || ""}
          isVerified={profile.isVerified}
          role={
            appwriteUser?.role === "admin" || profile.isVerified ? "admin" : "member"
          }
          followedProfiles={followedProfiles}
          messageThreads={[]}
          unreadMessageCount={0}
          onRequireAuth={() => requireAuth("سجل الدخول لعرض ملفك.")}
          onOpenPublicProfile={() => setIsProfileSheetOpen(false)}
          onOpenThread={() => {}}
          onComposeLookup={async () => null}
          onOpenNewThread={() => {}}
        />

        {!isVideoFullscreen && !isLogoutFarewellVisible ? (
          <View
            style={[
              styles.bottomDock,
              {
                left: bottomDockHorizontalInset,
                right: bottomDockHorizontalInset,
                bottom: bottomDockBottomInset,
              },
            ]}
          >
            <BottomNav
              current={visibleTab}
              homeMode={homeMode}
              richIconsEnabled={appRuntimeSettings.richIconsEnabled}
              onHomeAction={handleHomeAction}
              onSelect={selectMainTab}
              onVarPress={() => selectMainTab("excellence")}
            />
          </View>
        ) : null}

        <PostComposerModal
          visible={isPostComposerOpen}
          title={postTitle}
          content={postContent}
          authorId={postAuthorId}
          authorName={appwriteUser?.name || profile.displayName}
          authorAvatarUri={appwriteUser?.avatarUri || profile.avatarUri}
          displayVarId={appwriteUser?.displayVarId || profile.displayVarId}
          authorIdLocked={Boolean(appwriteUser?.id)}
          isPublishing={isPublishingPost}
          statusMessage={postComposerNotice}
          onChangeTitle={setPostTitle}
          onChangeContent={setPostContent}
          onChangeAuthorId={setPostAuthorId}
          mediaUri={postMediaUri}
          onAttachImage={() => {
            void handleAttachPostImage();
          }}
          onRemoveImage={() => {
            setPostMediaUri("");
          }}
          onClose={closePostComposer}
          onPublish={handlePublishAppwritePost}
        />

        <StudioModal
          assetName={studioAssetName}
          assetUri={studioAssetUri}
          caption={studioCaption}
          tag={studioTag}
          visible={isStudioOpen}
          onChangeCaption={setStudioCaption}
          onChangeTag={setStudioTag}
          onChooseVideo={pickStudioVideo}
          onClose={closeStudio}
          onPublish={publishStudioVideo}
        />

        <Modal
          visible={Boolean(
            isAdminDashboardOpen && canAccessAdminPanel && appwriteUser,
          )}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsAdminDashboardOpen(false)}
        >
          {appwriteUser ? (
            <AdminDashboardScreen
              adminUser={appwriteUser}
              localPostsCount={posts.length}
              profile={profile}
              onRefreshAppData={refreshVisibleAppData}
              onClose={() => setIsAdminDashboardOpen(false)}
            />
          ) : null}
        </Modal>

        {/* لوحة فار للتميز */}
        <Modal
          visible={isVarExcellencePanelOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsVarExcellencePanelOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <LinearGradient
              colors={['#000000', '#0a0a0a']}
              style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => setIsVarExcellencePanelOpen(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{ color: '#F4C565', fontSize: 18, fontWeight: 'bold' }}>
                  لوحة فار للتميز
                </Text>
                <View style={{ width: 24 }} />
              </View>
              <ScrollView style={{ flex: 1, padding: 20 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginTop: 40 }}>
                  مرحباً بك في لوحة فار للتميز
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 16 }}>
                  قريباً ستتوفر المزيد من الميزات هنا
                </Text>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        <LogoutFarewellOverlay visible={isLogoutFarewellVisible} />
      </View>
    </SafeAreaView>
  );
}
