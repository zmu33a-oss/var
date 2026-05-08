import React, { ReactNode, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  HOME_PALETTES,
  INITIAL_POSTS,
  INITIAL_PROFILE,
  INITIAL_SUPPORTERS,
  INITIAL_VIDEOS,
} from "./app.data";
import HomeScreen from "./screens/HomeScreen";
import FansScreen from "./screens/FansScreen";
import LeaguesScreen from "./screens/LeaguesScreen";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChatOverlay from "./screens/ChatOverlay";
import FloatingThemeSwitch from "./components/FloatingThemeSwitch";
import BottomNav from "./components/BottomNav";
import type { AuthMode, FanClubId, HomeMode, MainTab, Tab } from "./app.types";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const SHELL_WIDTH = 430;

export default function AppShell() {
  const { height, width } = useWindowDimensions();
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [chatBaseTab, setChatBaseTab] = useState<MainTab>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("tiktok");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canOpenAdmin, setCanOpenAdmin] = useState(false);
  const [notice, setNotice] = useState("تم تجهيز الواجهة بالكامل داخل Expo.");
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [supporters, setSupporters] = useState(INITIAL_SUPPORTERS);
  const [supportedTeams, setSupportedTeams] = useState<FanClubId[]>([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [focusVideoId, setFocusVideoId] = useState<number | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioAssetName, setStudioAssetName] = useState("");
  const [studioAssetUri, setStudioAssetUri] = useState("");
  const [studioCaption, setStudioCaption] = useState("");
  const [studioTag, setStudioTag] = useState("Studio");
  const layoutWidth = Math.min(width, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const themeSwitchTopInset = Math.round(8 * chromeScale);
  const bottomDockHorizontalInset = Math.round(8 * chromeScale);
  const bottomDockBottomInset = Math.round(6 * chromeScale);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => clearTimeout(timeout);
  }, [notice]);

  const visibleTab: MainTab = currentTab === "chat" ? chatBaseTab : currentTab;
  const palette = HOME_PALETTES[homeMode];

  useEffect(() => {
    if (visibleTab !== "home" || homeMode !== "tiktok") {
      setFocusVideoId(null);
    }
  }, [homeMode, visibleTab]);

  const requireAuth = (message = "سجل الدخول أولاً") => {
    setAuthMode("login");
    setCurrentTab("account");
    setNotice(message);
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

  const openStudio = () => {
    setFocusVideoId(null);
    setIsStudioOpen(true);
  };

  const selectMainTab = (tab: MainTab) => {
    setChatBaseTab(tab);
    setCurrentTab(tab);
  };

  const openChat = () => {
    setChatBaseTab(visibleTab);
    setCurrentTab("chat");

    if (!isLoggedIn) {
      setNotice("تم فتح القروبات والرسائل داخل النسخة المحلية.");
    }
  };

  const prependPost = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setPosts((currentPosts) => [
      {
        id: Date.now(),
        author: "VAR X",
        handle: "@varx",
        time: "الآن",
        content: trimmedContent,
        likes: 0,
        replies: 0,
        reposts: 0,
        shares: 0,
        likedByMe: false,
      },
      ...currentPosts,
    ]);
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

    setVideos((currentVideos) => [
      {
        id: Date.now(),
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
    setChatBaseTab("home");
    setCurrentTab("home");
    setNotice(`تمت إضافة ${studioAssetName} إلى الاستديو.`);
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
      prependPost(
        "تم إنشاء منشور جديد من زر VAR المركزي بعد نقل التصميم إلى Expo.",
      );
      setNotice("تمت إضافة منشور X جديد.");
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
    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        const nextLiked = !video.likedByMe;

        return {
          ...video,
          likedByMe: nextLiked,
          likes: Math.max(0, video.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
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
    setNotice("تم إرسال تعليقك على الفيديو.");
  };

  const toggleVideoFullscreen = (videoId: number) => {
    setFocusVideoId((currentValue) =>
      currentValue === videoId ? null : videoId,
    );
  };

  const togglePostLike = (postId: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const nextLiked = !post.likedByMe;

        return {
          ...post,
          likedByMe: nextLiked,
          likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
  };

  const toggleSupport = (clubId: FanClubId) => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لدعم الرابطة.");
      return;
    }

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

  const completeAuthFlow = () => {
    setIsLoggedIn(true);
    setCanOpenAdmin(true);
    setCurrentTab("account");
    setNotice("تم تسجيل الدخول إلى نسخة Expo.");
  };

  const shareVarXBoard = (content: string) => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لمشاركة لوحة VAR X.");
      return;
    }

    prependPost(content);
    setHomeMode("x");
    setChatBaseTab("home");
    setCurrentTab("home");
    setNotice("تمت مشاركة لوحة VAR X داخل صفحة X.");
  };

  const signOut = () => {
    setIsLoggedIn(false);
    setCanOpenAdmin(false);
    setFocusVideoId(null);
    closeStudio();
    setCurrentTab("home");
    setNotice("تم تسجيل الخروج من النسخة الحالية.");
  };

  let screen: ReactNode;

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
          onOpenChat={openChat}
          onRequireAuth={requireAuth}
          onTogglePostLike={togglePostLike}
          onToggleVideoLike={toggleVideoLike}
          onToggleVideoSave={toggleVideoSave}
          onToggleVideoShare={toggleVideoShare}
          onSubmitVideoComment={submitVideoComment}
          onToggleVideoFullscreen={toggleVideoFullscreen}
          focusVideoId={focusVideoId}
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
      screen = <LeaguesScreen onShareVarXBoard={shareVarXBoard} />;
      break;
    case "account":
      screen = isLoggedIn ? (
        <ProfileScreen
          canOpenAdmin={canOpenAdmin}
          posts={posts}
          profile={profile}
          onSaveProfile={setProfile}
          onSignOut={signOut}
        />
      ) : (
        <AuthScreen
          authMode={authMode}
          onChangeMode={setAuthMode}
          onSuccess={completeAuthFlow}
        />
      );
      break;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appRoot}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
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
          {notice && focusVideoId === null ? (
            <View style={styles.noticeWrap}>
              <View style={styles.noticePill}>
                <Ionicons name="sparkles-outline" size={16} color="#E8F6FF" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            </View>
          ) : null}

          {screen}

          {visibleTab === "home" && focusVideoId === null ? (
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

        {focusVideoId === null ? (
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

        {currentTab === "chat" ? (
          <ChatOverlay onClose={() => setCurrentTab(chatBaseTab)} />
        ) : null}

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
      </View>
    </SafeAreaView>
  );
}

function StudioModal(props: {
  visible: boolean;
  assetName: string;
  assetUri: string;
  caption: string;
  tag: string;
  onChangeCaption: (value: string) => void;
  onChangeTag: (value: string) => void;
  onChooseVideo: () => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <View style={styles.studioModalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={props.onClose}
        />

        <View style={styles.studioModalCard}>
          <View style={styles.studioModalHeader}>
            <Pressable
              style={styles.studioModalIconButton}
              onPress={props.onClose}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.studioModalHeaderCopy}>
              <Text style={styles.studioModalEyebrow}>VAR STUDIO</Text>
              <Text style={styles.studioModalTitle}>
                ارفع فيديو جديد من الجهاز
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.studioPickerButton}
            onPress={props.onChooseVideo}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#9DDAFF" />
            <Text style={styles.studioPickerButtonText}>
              اختيار فيديو من الاستديو
            </Text>
          </Pressable>

          <View style={styles.studioPreviewCard}>
            {props.assetUri ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "#000" },
                ]}
              />
            ) : (
              <View style={styles.studioPreviewPlaceholder}>
                <Ionicons
                  name="videocam-outline"
                  size={28}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.studioPreviewPlaceholderText}>
                  اختر فيديو لعرض المعاينة هنا
                </Text>
              </View>
            )}

            <LinearGradient
              colors={
                props.assetUri
                  ? ["rgba(2,8,14,0.08)", "rgba(2,8,14,0.52)"]
                  : ["rgba(8,19,31,0.18)", "rgba(8,19,31,0.62)"]
              }
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.studioPreviewCopy}>
              <Text style={styles.studioPreviewEyebrow}>LIVE PREVIEW</Text>
              <Text style={styles.studioPreviewTitle}>
                {props.assetName || "المعاينة جاهزة بعد اختيار الملف"}
              </Text>
            </View>
          </View>

          <View style={styles.studioAssetBadge}>
            <Text style={styles.studioAssetBadgeText}>
              {props.assetName || "لم يتم اختيار ملف بعد"}
            </Text>
          </View>

          <View style={styles.studioFieldBlock}>
            <Text style={styles.studioFieldLabel}>الوصف</Text>
            <TextInput
              value={props.caption}
              onChangeText={props.onChangeCaption}
              placeholder="اكتب وصف الفيديو"
              placeholderTextColor="rgba(255,255,255,0.34)"
              style={styles.studioInput}
              textAlign="right"
            />
          </View>

          <View style={styles.studioFieldBlock}>
            <Text style={styles.studioFieldLabel}>التصنيف</Text>
            <TextInput
              value={props.tag}
              onChangeText={props.onChangeTag}
              placeholder="Studio"
              placeholderTextColor="rgba(255,255,255,0.34)"
              style={styles.studioInput}
              textAlign="right"
            />
          </View>

          <View style={styles.studioFooter}>
            <Pressable
              style={styles.studioSecondaryButton}
              onPress={props.onClose}
            >
              <Text style={styles.studioSecondaryButtonText}>إلغاء</Text>
            </Pressable>
            <Pressable
              style={[
                styles.studioPrimaryButton,
                !props.assetUri ? styles.studioPrimaryButtonDisabled : null,
              ]}
              disabled={!props.assetUri}
              onPress={props.onPublish}
            >
              <Text style={styles.studioPrimaryButtonText}>نشر الفيديو</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#04070D",
  },
  appRoot: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.16,
  },
  primaryOrb: {
    width: 260,
    height: 260,
    top: -70,
    right: -40,
  },
  secondaryOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    left: -90,
    bottom: 160,
    borderRadius: 999,
    backgroundColor: "#17325E",
    opacity: 0.12,
  },
  tertiaryOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    right: 30,
    bottom: 260,
    borderRadius: 999,
    backgroundColor: "#421A33",
    opacity: 0.1,
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
  },
  noticeWrap: {
    position: "absolute",
    top: 64,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  noticePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(22, 57, 83, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(148,216,255,0.18)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  noticeText: {
    flex: 1,
    marginRight: 8,
    color: "#E8F6FF",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  themeSwitchLayer: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    zIndex: 24,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 82,
    paddingBottom: 128,
  },
  glassCard: {
    backgroundColor: "rgba(9, 14, 24, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "#64B9F8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "right",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 8,
  },
  sectionDescription: {
    color: "#8BA0B5",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 8,
  },
  tiktokCard: {
    marginBottom: 18,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tiktokTopRow: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
  },
  tiktokSoundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  tiktokDockWrap: {
    position: "absolute",
    left: 0,
    top: "33%",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  tiktokVarTab: {
    width: 32,
    height: 108,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(0,0,0,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokVarTabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    transform: [{ rotate: "90deg" }],
  },
  tiktokDockRail: {
    width: 72,
    marginLeft: 8,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tiktokDockButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  tiktokDockValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  tiktokBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  tiktokInfoBlock: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  tiktokCreatorRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tiktokCreatorText: {
    alignItems: "flex-end",
  },
  tiktokNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  tiktokCreatorName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 8,
  },
  tiktokHandle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  tiktokCreatorBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tiktokCreatorBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  tiktokCaption: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    marginTop: 12,
  },
  tiktokTagRow: {
    flexDirection: "row-reverse",
    marginTop: 14,
  },
  tagWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  xDrawerCard: {
    padding: 18,
  },
  drawerTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  drawerChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  drawerTitleBlock: {
    alignItems: "flex-end",
  },
  drawerKicker: {
    color: "#7CAFD2",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  drawerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  drawerChipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginTop: 14,
    marginHorizontal: -4,
  },
  xSpaceChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  xSpaceChipText: {
    color: "#D8E8F5",
    fontSize: 12,
    fontWeight: "700",
  },
  xHeaderCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  xHeaderGradient: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  xHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xHeaderTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  xHeaderBrand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 1.8,
  },
  xHeaderSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: MONO_FONT,
    marginTop: 4,
    textAlign: "right",
  },
  xAvatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  xAvatarCircle: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  xAvatarLetter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  xComposerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  xComposerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  modeStrip: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 6,
    marginBottom: 16,
  },
  xPostCard: {
    padding: 14,
  },
  xPostRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xAvatarTiny: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102844",
  },
  xAvatarTinyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  lineupSummaryCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  lineupSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  lineupSummaryText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  pitchCard: {
    height: 320,
    borderRadius: 24,
    backgroundColor: "#0C3A1F",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    position: "relative",
  },
  pitchCenterLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pitchCenterCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    transform: [{ translateX: -42 }, { translateY: -42 }],
  },
  pitchTopBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    top: 0,
    height: 64,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchBottomBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    bottom: 0,
    height: 64,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchPlayerWrap: {
    position: "absolute",
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  pitchPlayerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  pitchPlayerNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  benchWrap: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
  },
  benchTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 12,
  },
  benchGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  benchPill: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: "1%",
    marginVertical: 4,
  },
  benchPillNumber: {
    color: "#63C6FF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  benchPillName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  pollSummaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 18,
  },
  pollMetaBlock: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "flex-end",
  },
  pollMetaValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  pollMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  pollRail: {
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 18,
  },
  pollFillHome: {
    backgroundColor: "#63C6FF",
  },
  pollFillAway: {
    backgroundColor: "#FFB85C",
  },
  pollLabelsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
  },
  pollSideLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  shareBoardButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  shareBoardButtonText: {
    color: "#07101A",
    fontSize: 14,
    fontWeight: "900",
  },
  bottomDock: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
  },
  studioModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(1,4,8,0.78)",
  },
  studioModalCard: {
    backgroundColor: "#08131F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  studioModalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  studioModalIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  studioModalHeaderCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  studioModalEyebrow: {
    color: "#8FD6FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  studioModalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
  },
  studioPickerButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "rgba(24,94,145,0.28)",
    borderWidth: 1,
    borderColor: "rgba(157,218,255,0.22)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  studioPickerButtonText: {
    color: "#EAF8FF",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 8,
  },
  studioPreviewCard: {
    marginTop: 14,
    height: 176,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(157,218,255,0.14)",
    justifyContent: "flex-end",
  },
  studioPreviewPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  studioPreviewPlaceholderText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  studioPreviewCopy: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    alignItems: "flex-end",
  },
  studioPreviewEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  studioPreviewTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 5,
  },
  studioAssetBadge: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  studioAssetBadgeText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  studioFieldBlock: {
    marginTop: 16,
  },
  studioFieldLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 8,
  },
  studioInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
  },
  studioFooter: {
    flexDirection: "row-reverse",
    marginTop: 20,
  },
  studioSecondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  studioSecondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  studioPrimaryButton: {
    flex: 1.3,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#81D4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  studioPrimaryButtonDisabled: {
    opacity: 0.42,
  },
  studioPrimaryButtonText: {
    color: "#04111B",
    fontSize: 14,
    fontWeight: "900",
  },
});
