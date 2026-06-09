import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { MembershipCardTier } from "../lib/membershipCardTier";
import XFeedScreen from "./XFeedScreen";
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";
import type {
  FollowingProfileCard,
  HomeMode,
  IconName,
  Palette,
  PendingAuthIntent,
  Post,
  Video,
} from "../app.types";
import type { VarLibraryPublishInput } from "./x-feed/varPlayerLibrary.constants";
import type { XFeedTab } from "./x-feed/x-feed.types";

const TIKTOK_HANDLE_WIDTH = 30;
const TIKTOK_HANDLE_HEIGHT = 136;
const TIKTOK_DOCK_GAP = 0;
const TIKTOK_DOCK_RAIL_WIDTH = 92;
const TIKTOK_DOCK_CONTENT_OFFSET = 6;
const TIKTOK_HANDLE_PEEK_OFFSET = 0;
const TIKTOK_HANDLE_OPEN_OFFSET = 14;
const TIKTOK_HANDLE_OVERHANG = 8;
const TIKTOK_HANDLE_OVERLAP = 4;
const TIKTOK_INFO_BOTTOM_OFFSET = 102;
const FULLSCREEN_DOUBLE_TAP_DELAY = 260;

type HomeScreenProps = {
  homeMode: HomeMode;
  gpuAccelerationEnabled?: boolean;
  isLoggedIn: boolean;
  palette: Palette;
  posts: Post[];
  videos: Video[];
  windowHeight: number;
  onChangeMode: (mode: HomeMode) => void;
  onCreatePost: () => void;
  onPingAppwrite: () => void;
  onRequireAuth: (message?: string, pendingIntent?: PendingAuthIntent) => void;
  onTogglePostLike: (postId: number) => void;
  onTogglePostRepost: (postId: number) => void;
  onSharePost: (postId: number) => Promise<boolean>;
  currentUserVarId: string;
  currentUserDisplayName: string;
  currentUserDisplayVarId: string;
  currentUserAvatarUri: string;
  currentUserJoinDate: string;
  currentUserNationality: string;
  currentUserAssociation: string;
  currentUserCardTier: MembershipCardTier;
  currentUserUsername: string;
  currentUserRole: "admin" | "member";
  currentUserIsVerified: boolean;
  followedAuthorIds: string[];
  followedProfiles: FollowingProfileCard[];
  onToggleAuthorFollow: (authorVarId: string) => void;
  onSubmitPostReply: (postId: number, text: string) => void;
  resumeReplyPostId: number | null;
  onReplyIntentConsumed: () => void;
  onShowNotice?: (message: string) => void;
  onRefreshPosts: () => void;
  onLoadMorePosts: () => void;
  isRefreshingPosts: boolean;
  isLoadingMorePosts: boolean;
  hasMorePosts: boolean;
  onDeletePost: (postId: number) => void;
  onUpdatePostContent: (postId: number, content: string) => void;
  onReportPost: (postId: number) => void;
  onPublishLibraryPost: (input: VarLibraryPublishInput) => Promise<boolean>;
  isPublishingLibraryPost: boolean;
  canManageVarLibrary?: boolean;
  onXFeedTabChange?: (tab: XFeedTab) => void;
  onToggleVideoLike: (videoId: number) => void;
  onToggleVideoSave: (videoId: number) => void;
  onToggleVideoShare: (videoId: number) => void;
  onSubmitVideoComment: (videoId: number, text: string) => void;
  onToggleVideoFullscreen: () => void;
  onExitVideoFullscreen: () => void;
  isVideoFullscreen: boolean;
};

export default function HomeScreen(props: HomeScreenProps) {
  const {
    homeMode,
    gpuAccelerationEnabled = true,
    isLoggedIn,
    posts,
    videos,
    windowHeight,
    onCreatePost,
    onPingAppwrite,
    onRequireAuth,
    onTogglePostLike,
    onTogglePostRepost,
    onSharePost,
    currentUserVarId,
    currentUserDisplayName,
    currentUserDisplayVarId,
    currentUserAvatarUri,
    currentUserJoinDate,
    currentUserNationality,
    currentUserAssociation,
    currentUserCardTier,
    currentUserUsername,
    currentUserRole,
    currentUserIsVerified,
    followedAuthorIds,
    followedProfiles,
    onToggleAuthorFollow,
    onSubmitPostReply,
    resumeReplyPostId,
    onReplyIntentConsumed,
    onShowNotice,
    onRefreshPosts,
    onLoadMorePosts,
    isRefreshingPosts,
    isLoadingMorePosts,
    hasMorePosts,
    onDeletePost,
    onUpdatePostContent,
    onReportPost,
    onPublishLibraryPost,
    isPublishingLibraryPost,
    canManageVarLibrary,
    onXFeedTabChange,
    onToggleVideoLike,
    onToggleVideoSave,
    onToggleVideoShare,
    onSubmitVideoComment,
    onToggleVideoFullscreen,
    onExitVideoFullscreen,
    isVideoFullscreen,
  } = props;

  const tiktokCardHeight = Math.max(windowHeight, 520);
  const showHomePingButton = homeMode !== "tiktok" || !isVideoFullscreen;

  if (homeMode === "tiktok") {
    return (
      <View style={styles.homeScreenRoot}>
        {showHomePingButton ? (
          <HomePingButton onPress={onPingAppwrite} mode="tiktok" />
        ) : null}
        <ScrollView
          decelerationRate={gpuAccelerationEnabled ? "fast" : "normal"}
          disableIntervalMomentum={gpuAccelerationEnabled}
          pagingEnabled={gpuAccelerationEnabled}
          snapToAlignment="start"
          snapToInterval={gpuAccelerationEnabled ? tiktokCardHeight : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tiktokScreenContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingPosts}
              onRefresh={onRefreshPosts}
              tintColor="#FFFFFF"
              colors={["#1D9BF0"]}
            />
          }
        >
          {videos.map((video) => (
            <TikTokVideoCard
              key={video.id}
              cardHeight={tiktokCardHeight}
              video={video}
              onToggleLike={() => onToggleVideoLike(video.id)}
              onToggleSave={() => onToggleVideoSave(video.id)}
              onToggleShare={() => onToggleVideoShare(video.id)}
              onSubmitComment={(comment) =>
                onSubmitVideoComment(video.id, comment)
              }
              onToggleFullscreen={onToggleVideoFullscreen}
              onExitFullscreen={onExitVideoFullscreen}
              isFullscreen={isVideoFullscreen}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.homeScreenRoot}>
      {showHomePingButton ? (
        <HomePingButton onPress={onPingAppwrite} mode="default" />
      ) : null}
      <XFeedScreen
        isLoggedIn={isLoggedIn}
        posts={posts}
        onCreatePost={onCreatePost}
        onRequireAuth={onRequireAuth}
        onTogglePostLike={onTogglePostLike}
        onTogglePostRepost={onTogglePostRepost}
        onSharePost={onSharePost}
        currentUserVarId={currentUserVarId}
        currentUserDisplayName={currentUserDisplayName}
        currentUserDisplayVarId={currentUserDisplayVarId}
        currentUserAvatarUri={currentUserAvatarUri}
        currentUserJoinDate={currentUserJoinDate}
        currentUserNationality={currentUserNationality}
        currentUserAssociation={currentUserAssociation}
        currentUserCardTier={currentUserCardTier}
        currentUserUsername={currentUserUsername}
        currentUserRole={currentUserRole}
        currentUserIsVerified={currentUserIsVerified}
        followedAuthorIds={followedAuthorIds}
        followedProfiles={followedProfiles}
        onToggleAuthorFollow={onToggleAuthorFollow}
        onSubmitPostReply={onSubmitPostReply}
        resumeReplyPostId={resumeReplyPostId}
        onReplyIntentConsumed={onReplyIntentConsumed}
        onShowNotice={onShowNotice}
        onRefreshPosts={onRefreshPosts}
        onLoadMorePosts={onLoadMorePosts}
        isRefreshingPosts={isRefreshingPosts}
        isLoadingMorePosts={isLoadingMorePosts}
        hasMorePosts={hasMorePosts}
        onDeletePost={onDeletePost}
        onUpdatePostContent={onUpdatePostContent}
        onReportPost={onReportPost}
        onPublishLibraryPost={onPublishLibraryPost}
        isPublishingLibraryPost={isPublishingLibraryPost}
        canManageVarLibrary={canManageVarLibrary}
        onActiveTabChange={onXFeedTabChange}
      />
    </View>
  );
}

function HomePingButton(props: {
  onPress: () => void;
  mode: "default" | "tiktok";
}) {
  return (
    <View
      style={[
        styles.pingButtonWrap,
        props.mode === "tiktok" ? styles.pingButtonWrapTikTok : null,
      ]}
    >
      <Pressable style={styles.pingButton} onPress={props.onPress}>
        <Ionicons name="pulse-outline" size={16} color="#DFF7FF" />
        <Text style={styles.pingButtonText}>Send a ping</Text>
      </Pressable>
    </View>
  );
}

function TikTokVideoCard(props: {
  cardHeight: number;
  video: Video;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleShare: () => void;
  onSubmitComment: (comment: string) => void;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const {
    cardHeight,
    video,
    onToggleLike,
    onToggleSave,
    onToggleShare,
    onSubmitComment,
    onToggleFullscreen,
    onExitFullscreen,
    isFullscreen,
  } = props;
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const dockProgress = useRef(new Animated.Value(0)).current;
  const infoProgress = useRef(new Animated.Value(0)).current;
  const lastFullscreenTapAt = useRef(0);

  useEffect(() => {
    Animated.spring(dockProgress, {
      toValue: isDockOpen ? 1 : 0,
      friction: 14,
      tension: 150,
      useNativeDriver: false,
    }).start();
  }, [dockProgress, isDockOpen]);

  useEffect(() => {
    Animated.spring(infoProgress, {
      toValue: isCaptionExpanded ? 1 : 0,
      friction: 12,
      tension: 140,
      useNativeDriver: false,
    }).start();
  }, [infoProgress, isCaptionExpanded]);

  useEffect(() => {
    if (!isFullscreen) {
      lastFullscreenTapAt.current = 0;
    }
  }, [isFullscreen]);

  const handleTranslateX = dockProgress.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0, TIKTOK_HANDLE_OPEN_OFFSET, TIKTOK_HANDLE_OPEN_OFFSET],
  });
  const dockShellWidth = dockProgress.interpolate({
    inputRange: [0, 0.74, 1],
    outputRange: [0, 0, TIKTOK_DOCK_RAIL_WIDTH + TIKTOK_DOCK_GAP],
  });
  const dockRailTranslateX = dockProgress.interpolate({
    inputRange: [0, 0.74, 1],
    outputRange: [-18, -18, 0],
  });
  const dockRailOpacity = dockProgress.interpolate({
    inputRange: [0, 0.76, 0.92, 1],
    outputRange: [0, 0, 0.6, 1],
  });
  const infoTranslateY = infoProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const showVideoChrome = !isFullscreen;

  const submitComment = () => {
    const trimmedComment = commentDraft.trim();
    if (!trimmedComment) {
      return;
    }

    onSubmitComment(trimmedComment);
    setCommentDraft("");
    setIsCommentComposerOpen(false);
  };

  const exitFullscreenOnDoubleTap = () => {
    const now = Date.now();

    if (now - lastFullscreenTapAt.current <= FULLSCREEN_DOUBLE_TAP_DELAY) {
      lastFullscreenTapAt.current = 0;
      onExitFullscreen();
      return;
    }

    lastFullscreenTapAt.current = now;
  };

  return (
    <View style={[styles.tiktokCard, { height: cardHeight }]}>
      {video.mediaUri ? (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000" }]}
        />
      ) : (
        <LinearGradient
          colors={video.theme}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {isFullscreen && !showVideoChrome ? (
        <View
          style={styles.tiktokFullscreenTapLayer}
          onStartShouldSetResponder={() => true}
          onResponderRelease={exitFullscreenOnDoubleTap}
        />
      ) : null}

      {showVideoChrome ? (
        <>
          <View style={styles.tiktokTopRow}>
            <Pressable style={styles.tiktokSoundButton}>
              <Ionicons name="volume-medium" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.tiktokDockWrap}>
            <Animated.View
              style={[
                styles.tiktokVarTabWrap,
                { transform: [{ translateX: handleTranslateX }] },
              ]}
            >
              <Pressable
                style={[
                  styles.tiktokVarTab,
                  isDockOpen ? styles.tiktokVarTabOpen : null,
                ]}
                hitSlop={8}
                onPress={() => setIsDockOpen((currentValue) => !currentValue)}
              >
                <Text style={styles.tiktokVarTabText}>VAR</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              {...getNativePointerEventsProps(isDockOpen ? "auto" : "none")}
              style={[
                styles.tiktokDockRailShell,
                { width: dockShellWidth },
                getWebPointerEventsStyle(isDockOpen ? "auto" : "none"),
              ]}
            >
              <Animated.View
                style={[
                  styles.tiktokDockRail,
                  {
                    opacity: dockRailOpacity,
                    transform: [{ translateX: dockRailTranslateX }],
                  },
                ]}
              >
                <TikTokDockStat
                  icon="heart"
                  value={video.likes}
                  active={video.likedByMe}
                  onPress={onToggleLike}
                />
                <TikTokDockStat
                  icon="chatbubble"
                  value={video.comments}
                  active={isCommentComposerOpen}
                  onPress={() =>
                    setIsCommentComposerOpen((currentValue) => !currentValue)
                  }
                />
                <TikTokDockStat
                  icon="paper-plane"
                  value={video.shares}
                  active={video.sharedByMe}
                  onPress={onToggleShare}
                />
                <TikTokDockStat
                  icon="bookmark"
                  value={video.saves}
                  active={video.savedByMe}
                  onPress={onToggleSave}
                />
                <TikTokDockStat
                  icon={isFullscreen ? "contract-outline" : "expand-outline"}
                  value={isFullscreen ? "رجوع" : "ملء"}
                  active={isFullscreen}
                  onPress={onToggleFullscreen}
                />
              </Animated.View>
            </Animated.View>
          </View>
        </>
      ) : null}

      {showVideoChrome ? (
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.86)"]}
          style={styles.tiktokBottomFade}
        />
      ) : null}

      {showVideoChrome ? (
        <Animated.View
          style={[
            styles.tiktokInfoBlock,
            {
              bottom: isFullscreen ? 28 : TIKTOK_INFO_BOTTOM_OFFSET,
              transform: [{ translateY: infoTranslateY }],
            },
          ]}
        >
          <View style={styles.tiktokCreatorRow}>
            <View style={styles.tiktokCreatorText}>
              <View style={styles.tiktokNameRow}>
                <Text style={styles.tiktokCreatorName}>
                  {video.creatorName}
                </Text>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.tiktokHandle}>{video.creatorHandle}</Text>
            </View>

            <View style={styles.tiktokCreatorBadge}>
              <Text style={styles.tiktokCreatorBadgeText}>{video.tag}</Text>
            </View>
          </View>

          <View style={styles.tiktokCaptionRow}>
            <Text
              numberOfLines={isCaptionExpanded ? 3 : 1}
              style={styles.tiktokCaption}
            >
              {video.caption}
            </Text>

            <Pressable
              onPress={() =>
                setIsCaptionExpanded((currentValue) => !currentValue)
              }
            >
              <Text style={styles.tiktokCaptionToggle}>
                {isCaptionExpanded ? "إخفاء" : "المزيد"}
              </Text>
            </Pressable>
          </View>

          {isCaptionExpanded ? (
            <View style={styles.tiktokTagRow}>
              <Tag label="#VAR" />
              <Tag label="#WEBPLUS" />
              <Tag label="#Expo" />
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      <Modal
        transparent
        animationType="fade"
        visible={isCommentComposerOpen}
        onRequestClose={() => setIsCommentComposerOpen(false)}
      >
        <View style={styles.tiktokCommentModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsCommentComposerOpen(false)}
          />

          <View style={styles.tiktokCommentModalCard}>
            <Text style={styles.tiktokCommentModalTitle}>تعليق سريع</Text>

            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder="اكتب تعليقك هنا"
              placeholderTextColor="rgba(255,255,255,0.36)"
              style={styles.tiktokCommentInput}
              textAlign="right"
            />

            <View style={styles.tiktokCommentActions}>
              <Pressable
                style={styles.tiktokCommentSecondaryButton}
                onPress={() => setIsCommentComposerOpen(false)}
              >
                <Text style={styles.tiktokCommentSecondaryText}>إغلاق</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tiktokCommentPrimaryButton,
                  !commentDraft.trim()
                    ? styles.tiktokCommentPrimaryButtonDisabled
                    : null,
                ]}
                disabled={!commentDraft.trim()}
                onPress={submitComment}
              >
                <Text style={styles.tiktokCommentPrimaryText}>إرسال</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Tag(props: { label: string }) {
  return (
    <View style={styles.tagWrap}>
      <Text style={styles.tagText}>{props.label}</Text>
    </View>
  );
}

function TikTokDockStat(props: {
  icon: IconName;
  value: number | string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tiktokDockButton} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={18}
        color={props.active ? "#FFFFFF" : "rgba(255,255,255,0.88)"}
      />
      <Text style={styles.tiktokDockValue}>{String(props.value)}</Text>
    </Pressable>
  );
}

const styles = createCompatStyleSheet({
  homeScreenRoot: {
    flex: 1,
  },
  pingButtonWrap: {
    position: "absolute",
    top: 74,
    left: 16,
    zIndex: 40,
  },
  pingButtonWrapTikTok: {
    left: "auto",
    right: 18,
    top: 128,
  },
  pingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(8, 24, 35, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(122,223,255,0.28)",
  },
  pingButtonText: {
    color: "#DFF7FF",
    fontSize: 12,
    fontWeight: "800",
  },
  tiktokScreenContent: {
    paddingBottom: 0,
  },
  tiktokCard: {
    marginBottom: 0,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
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
    left: -TIKTOK_HANDLE_PEEK_OFFSET,
    top: "30%",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 4,
  },
  tiktokVarTabWrap: {
    zIndex: 6,
    width:
      TIKTOK_HANDLE_OPEN_OFFSET + TIKTOK_HANDLE_WIDTH - TIKTOK_HANDLE_OVERLAP,
    marginVertical: -TIKTOK_HANDLE_OVERHANG,
  },
  tiktokVarTab: {
    width: TIKTOK_HANDLE_WIDTH,
    height: TIKTOK_HANDLE_HEIGHT,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "rgba(0,0,0,0.84)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  tiktokVarTabOpen: {
    backgroundColor: "rgba(14,44,88,0.96)",
  },
  tiktokVarTabText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    transform: [{ rotate: "90deg" }],
    textShadowColor: "rgba(111,214,255,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tiktokDockRailShell: {
    marginLeft: TIKTOK_DOCK_GAP,
    overflow: "hidden",
    zIndex: 2,
  },
  tiktokDockRail: {
    width: TIKTOK_DOCK_RAIL_WIDTH,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 9,
    paddingLeft: TIKTOK_DOCK_CONTENT_OFFSET,
    paddingRight: 5,
    backgroundColor: "rgba(5,10,18,0.88)",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tiktokDockButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  tiktokDockValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  tiktokFullscreenTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  tiktokBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  tiktokInfoBlock: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  tiktokCaptionRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginTop: 10,
  },
  tiktokCreatorRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
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
    marginTop: 4,
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
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
    marginLeft: 10,
  },
  tiktokCaptionToggle: {
    color: "#8FD6FF",
    fontSize: 13,
    fontWeight: "900",
  },
  tiktokTagRow: {
    flexDirection: "row-reverse",
    marginTop: 12,
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
  tiktokCommentModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  tiktokCommentModalCard: {
    backgroundColor: "rgba(7,17,28,0.96)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
  },
  tiktokCommentModalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
  },
  tiktokCommentInput: {
    minHeight: 50,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
  },
  tiktokCommentActions: {
    flexDirection: "row-reverse",
    marginTop: 14,
  },
  tiktokCommentSecondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  tiktokCommentSecondaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  tiktokCommentPrimaryButton: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#82D6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokCommentPrimaryButtonDisabled: {
    opacity: 0.42,
  },
  tiktokCommentPrimaryText: {
    color: "#04111B",
    fontSize: 13,
    fontWeight: "900",
  },
});
