import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Pressable,
  SafeAreaView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import FloatingThemeSwitch from "./components/FloatingThemeSwitch";
import BottomNav from "./components/BottomNav";
import SealCheckIcon from "./components/SealCheckIcon";
import {
  client as appwriteClient,
  deleteAppwritePost,
  hasAppwriteProjectConfig,
  listAppwriteFollowingVarIds,
  listAppwriteProfileIndexesByVarIds,
  syncAppwriteSocialInteraction,
  updateAppwritePost,
  type AppwriteAuthUser,
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
  ProfileData,
} from "./app.types";
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
import { useAppwritePostsSync, publishAppwritePost } from "./appshell/appshell.posts";
import {
  useAppwriteVarProfile,
  makeTrackVarInteraction,
} from "./appshell/appshell.profile";


const POST_COMPOSER_DEFAULT_TITLE = "رسالة عامة";
const INITIAL_NOTICE = hasAppwriteProjectConfig()
  ? "تم تجهيز الواجهة وربط Appwrite الأساسي."
  : "تم تجهيز الواجهة بالكامل داخل Expo.";

export default function AppShell(){
  const { height, width } = useWindowDimensions();
  const [currentTab, setCurrentTab] = useState<MainTab>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("tiktok");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [notice, setNotice] = useState(INITIAL_NOTICE);
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [supporters, setSupporters] = useState(INITIAL_SUPPORTERS);
  const [supportedTeams, setSupportedTeams] = useState<FanClubId[]>([]);
  const [followedAuthorIds, setFollowedAuthorIds] = useState<string[]>([]);
  const [followedProfiles, setFollowedProfiles] = useState<
    FollowingProfileCard[]
  >([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioAssetName, setStudioAssetName] = useState("");
  const [studioAssetUri, setStudioAssetUri] = useState("");
  const [studioCaption, setStudioCaption] = useState("");
  const [studioTag, setStudioTag] = useState("Studio");
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState(POST_COMPOSER_DEFAULT_TITLE);
  const [postContent, setPostContent] = useState("");
  const [postMediaUri, setPostMediaUri] = useState("");
  const [postAuthorId, setPostAuthorId] = useState(
    buildDefaultPostAuthorId(INITIAL_PROFILE),
  );
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postComposerNotice, setPostComposerNotice] = useState("");
  const [pendingAuthIntent, setPendingAuthIntent] =
    useState<PendingAuthIntent | null>(null);
  const [pendingAuthReturnTab, setPendingAuthReturnTab] =
    useState<MainTab | null>(null);
  const [shouldResumePendingAuth, setShouldResumePendingAuth] = useState(false);
  const [resumeReplyPostId, setResumeReplyPostId] = useState<number | null>(
    null,
  );
  const layoutWidth = Math.min(width, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const themeSwitchTopInset = Math.round(8 * chromeScale);
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

  const trackVarInteraction = makeTrackVarInteraction(appwriteUser, refreshVarProfile);

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

    void syncFollowingAuthors();

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

  const { refreshPosts, loadMorePosts, isRefreshingPosts, isLoadingMorePosts, hasMorePosts } = useAppwritePostsSync({
    isLoggedIn,
    appwriteUser,
    profile,
    setPosts,
    setNotice,
  });

  const canAccessAdminPanel = useMemo(
    () => resolveCanAccessAdminPanel(appwriteUser, profile),
    [appwriteUser, profile, profile.role],
  );

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
    resetPostComposerDraft();
  };

  const openPostComposer = () => {
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

  const resolvePostInteractionTargetId = (postId: number) => {
    const targetPost = posts.find((candidate) => candidate.id === postId);

    return targetPost?.sourceId?.trim() || String(postId);
  };

  const prependPost = (post: Post) => {
    setPosts((currentPosts) => [post, ...currentPosts]);
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
    setHomeMode("tiktok");
    setCurrentTab("home");
    trackVarInteraction({
      mode: "tiktok",
      action: "post",
      targetId: String(nextVideoId),
      value: trimmedCaption,
    });
    setNotice(`تمت إضافة ${studioAssetName} إلى الاستديو.`);
  };

  const reportPostComposerStatus = (message: string) => {
    setNotice(message);
    setPostComposerNotice(message);

    if (message.includes("فشل") || message.includes("تعذر") || message.includes("غير مكتمل")) {
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
    setPostComposerNotice("");

    void publishAppwritePost({
      postTitle,
      postContent,
      postAuthorId,
      postMediaUri,
      appwriteUser,
      profile,
      onPublished: (post) => {
        prependPost(post);
        setHomeMode("x");
        setCurrentTab("home");
      },
      setIsPublishingPost,
      setNotice: reportPostComposerStatus,
      onClose: closePostComposer,
      trackVarInteraction,
    });
  };

  const handleHomeAction = () => {
    if (homeMode === "tiktok") {
      openStudio();
      return;
    }

    if (!isLoggedIn) {
      requireAuth(
        homeMode === "x"
          ? "سجل الدخول لإنشاء منشور X."
          : "سجل الدخول لإضافة فيديو جديد.",
      );
      return;
    }

    if (homeMode === "x") {
      openPostComposer();
      return;
    }

    setVideos((currentVideos) => [
      {
        id: Date.now(),
        creatorName: "WEBPLUS Expo",
        creatorHandle: "@expo",
        caption:
          "فيديو تجريبي جديد من زر VAR المركزي، بنفس الروح الداكنة للواجهة الأصلية.",
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
        likedByMe: false,
        savedByMe: false,
        sharedByMe: false,
        theme: ["#6647FF", "#160B2E"],
        tag: "Night",
      },
      ...currentVideos,
    ]);
    setNotice("تمت إضافة فيديو تجريبي جديد.");
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

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        nextLiked = !post.likedByMe;

        return {
          ...post,
          likedByMe: nextLiked,
          likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
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

  const applySupportToggle = (clubId: FanClubId) => {
    const alreadySupported = supportedTeams.includes(clubId);

    setSupportedTeams((currentTeams) =>
      alreadySupported
        ? currentTeams.filter((teamId) => teamId !== clubId)
        : [...currentTeams, clubId],
    );
    setSupporters((currentCounts) => ({
      ...currentCounts,
      [clubId]: Math.max(
        0,
        currentCounts[clubId] + (alreadySupported ? -1 : 1),
      ),
    }));
    setNotice(
      alreadySupported
        ? "تمت إزالة الدعم من الرابطة."
        : "تم تسجيل دعمك للرابطة.",
    );
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
    let targetPost: Post | undefined;
    const interactionTargetId = resolvePostInteractionTargetId(postId);
    const currentUserIdentity = buildCurrentUserPostIdentity({
      varId: profile.varId || appwriteUser?.varId || "",
      profile,
      appwriteUser,
    });
    const currentUserVarId = normalizeAuthorId(
      profile.varId || appwriteUser?.varId || "",
    );

    setPosts((currentPosts) => {
      targetPost = currentPosts.find((post) => post.id === postId);

      if (!targetPost) {
        return currentPosts;
      }

      nextReposted = !targetPost.repostedByMe;

      const updatedPosts = currentPosts
        .map((post) => {
          if (post.id !== postId) {
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

      return [
        {
          ...targetPost,
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
              createPostHandle(profile.username, currentUserVarId),
            time: formatPostTime(new Date().toISOString()),
          },
        },
        ...updatedPosts,
      ];
    });
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

  const sharePost = async (postId: number) => {
    const post = posts.find((candidate) => candidate.id === postId);

    if (!post) {
      return;
    }

    const interactionTargetId = post.sourceId?.trim() || String(postId);

    const applyLocalShare = () => {
      let didUpdate = false;

      setPosts((currentPosts) =>
        currentPosts.map((candidate) => {
          if (candidate.id !== postId || candidate.sharedByMe) {
            return candidate;
          }

          didUpdate = true;

          return {
            ...candidate,
            sharedByMe: true,
            shares: candidate.shares + 1,
          };
        }),
      );

      return didUpdate;
    };

    try {
      const shareResult = await Share.share({
        message: `${post.title ? `${post.title}\n` : ""}${post.content}\n${post.handle}`,
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
        return;
      }

      setNotice("تم إغلاق نافذة المشاركة.");
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
      setNotice(
        error instanceof Error ? error.message : "تعذر حذف المنشور.",
      );
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
      setNotice(
        error instanceof Error ? error.message : "تعذر تحديث المنشور.",
      );
    }
  };

  const reportPost = (postId: number) => {
    const interactionTargetId = resolvePostInteractionTargetId(postId);

    trackVarInteraction({
      mode: "x",
      action: "comment",
      targetId: interactionTargetId,
      value: "[report]",
    });
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
        setHomeMode("x");
        openPostComposer();
        break;
      case "reply-post":
        setHomeMode("x");
        setResumeReplyPostId(pendingAuthIntent.postId);
        break;
      case "toggle-post-like":
        setHomeMode("x");
        togglePostLike(pendingAuthIntent.postId);
        break;
      case "toggle-post-repost":
        setHomeMode("x");
        togglePostRepost(pendingAuthIntent.postId);
        break;
      case "share-post":
        setHomeMode("x");
        void sharePost(pendingAuthIntent.postId);
        break;
      case "toggle-follow-author":
        setHomeMode("x");
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
    openPostComposer,
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

  switch (visibleTab) {
    case "home":
      screen = (
        <HomeScreen
          homeMode={homeMode}
          isLoggedIn={isLoggedIn}
          palette={palette}
          posts={posts}
          videos={videos}
          windowHeight={height}
          onChangeMode={setHomeMode}
          onCreatePost={handleHomeAction}
          onPingAppwrite={handleAppwritePing}
          onRequireAuth={requireAuth}
          onTogglePostLike={togglePostLike}
          onTogglePostRepost={togglePostRepost}
          onSharePost={sharePost}
          currentUserVarId={profile.varId || appwriteUser?.varId || ""}
          currentUserDisplayName={profile.displayName || appwriteUser?.name || ""}
          currentUserDisplayVarId={
            profile.displayVarId || appwriteUser?.displayVarId || ""
          }
          currentUserAvatarUri={profile.avatarUri || appwriteUser?.avatarUri || ""}
          currentUserJoinDate={profile.joinDate}
          currentUserNationality={profile.nationality}
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
          onRefreshPosts={refreshPosts}
          onLoadMorePosts={loadMorePosts}
          isRefreshingPosts={isRefreshingPosts}
          isLoadingMorePosts={isLoadingMorePosts}
          hasMorePosts={hasMorePosts}
          onDeletePost={deletePost}
          onUpdatePostContent={updatePostContent}
          onReportPost={reportPost}
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
          onRequireAuth={requireAuth}
          onToggleSupport={toggleSupport}
        />
      );
      break;
    case "leagues":
      screen = <LeaguesScreen posts={posts} />;
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
          profile={profile}
          onSaveProfile={(nextProfile) => {
            void persistAppwriteProfile(nextProfile, appwriteUser).then((savedUser) => {
              if (savedUser) {
                void refreshVarProfile(savedUser.varId, true);
              }
            });
          }}
          onSignOut={signOut}
        />
      ) : (
        <AuthScreen
          authMode={authMode}
          onChangeMode={setAuthMode}
          onStartGoogleLogin={writeStoredGoogleAuthSnapshot}
          onSuccess={completeAuthFlow}
        />
      );
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
          {notice && !isVideoFullscreen ? (
            <View style={styles.noticeWrap}>
              <View style={styles.noticePill}>
                <Ionicons name="sparkles-outline" size={16} color="#E8F6FF" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            </View>
          ) : null}

          {screen}

          {visibleTab === "home" && !isVideoFullscreen ? (
            <View
              style={[styles.themeSwitchLayer, { top: themeSwitchTopInset }]}
            >
              <FloatingThemeSwitch
                selection={homeMode}
                onChange={setHomeMode}
              />
            </View>
          ) : null}
        </View>

        {!isVideoFullscreen ? (
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
              onHomeAction={handleHomeAction}
              onSelect={selectMainTab}
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
              onClose={() => setIsAdminDashboardOpen(false)}
            />
          ) : null}
        </Modal>
      </View>
    </SafeAreaView>
  );
}




