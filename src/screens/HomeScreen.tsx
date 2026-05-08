import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import XFeedScreen from "./XFeedScreen";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { HomeMode, IconName, Palette, Post, Video } from "../app.types";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const TIKTOK_HANDLE_WIDTH = 34;
const TIKTOK_HANDLE_HEIGHT = 156;
const TIKTOK_DOCK_GAP = 0;
const TIKTOK_DOCK_RAIL_WIDTH = 152;
const TIKTOK_DOCK_CONTENT_OFFSET = 12;
const TIKTOK_HANDLE_PEEK_OFFSET = 22;
const TIKTOK_HANDLE_OPEN_OFFSET = 34;
const TIKTOK_HANDLE_OVERHANG = 18;
const TIKTOK_HANDLE_OVERLAP = 4;
const TIKTOK_INFO_BOTTOM_OFFSET = 102;
const VAR_CHAT_ICON = require("../../assets/icons/varchat.png");

type HomeScreenProps = {
  homeMode: HomeMode;
  isLoggedIn: boolean;
  palette: Palette;
  posts: Post[];
  videos: Video[];
  windowHeight: number;
  onChangeMode: (mode: HomeMode) => void;
  onCreatePost: () => void;
  onOpenChat: () => void;
  onRequireAuth: (message?: string) => void;
  onTogglePostLike: (postId: number) => void;
  onToggleVideoLike: (videoId: number) => void;
  onToggleVideoSave: (videoId: number) => void;
  onToggleVideoShare: (videoId: number) => void;
  onSubmitVideoComment: (videoId: number, text: string) => void;
  onToggleVideoFullscreen: (videoId: number) => void;
  focusVideoId: number | null;
};

export default function HomeScreen(props: HomeScreenProps) {
  const {
    homeMode,
    isLoggedIn,
    posts,
    videos,
    windowHeight,
    onCreatePost,
    onOpenChat,
    onRequireAuth,
    onTogglePostLike,
    onToggleVideoLike,
    onToggleVideoSave,
    onToggleVideoShare,
    onSubmitVideoComment,
    onToggleVideoFullscreen,
    focusVideoId,
  } = props;

  const tiktokCardHeight = Math.max(windowHeight, 520);

  if (homeMode === "tiktok") {
    return (
      <ScrollView
        decelerationRate="fast"
        disableIntervalMomentum
        pagingEnabled
        snapToAlignment="start"
        snapToInterval={tiktokCardHeight}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tiktokScreenContent}
      >
        {videos.map((video) => (
          <TikTokVideoCard
            key={video.id}
            cardHeight={tiktokCardHeight}
            video={video}
            onOpenChat={onOpenChat}
            onToggleLike={() => onToggleVideoLike(video.id)}
            onToggleSave={() => onToggleVideoSave(video.id)}
            onToggleShare={() => onToggleVideoShare(video.id)}
            onSubmitComment={(comment) =>
              onSubmitVideoComment(video.id, comment)
            }
            onToggleFullscreen={() => onToggleVideoFullscreen(video.id)}
            isFullscreen={focusVideoId === video.id}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <XFeedScreen
      isLoggedIn={isLoggedIn}
      posts={posts}
      onCreatePost={onCreatePost}
      onOpenChat={onOpenChat}
      onRequireAuth={onRequireAuth}
      onTogglePostLike={onTogglePostLike}
    />
  );
}

function TikTokVideoCard(props: {
  cardHeight: number;
  video: Video;
  onOpenChat: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleShare: () => void;
  onSubmitComment: (comment: string) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const {
    cardHeight,
    video,
    onOpenChat,
    onToggleLike,
    onToggleSave,
    onToggleShare,
    onSubmitComment,
    onToggleFullscreen,
    isFullscreen,
  } = props;
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const dockProgress = useRef(new Animated.Value(0)).current;
  const infoProgress = useRef(new Animated.Value(0)).current;

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

  const submitComment = () => {
    const trimmedComment = commentDraft.trim();
    if (!trimmedComment) {
      return;
    }

    onSubmitComment(trimmedComment);
    setCommentDraft("");
    setIsCommentComposerOpen(false);
  };

  const openQuickChatMenu = () => {
    setIsDockOpen(false);
    onOpenChat();
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
          pointerEvents={isDockOpen ? "auto" : "none"}
          style={[styles.tiktokDockRailShell, { width: dockShellWidth }]}
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
            <TikTokDockMenuItem
              label="رسالة جديدة"
              onPress={openQuickChatMenu}
            />
            <TikTokDockMenuItem label="القروبات" onPress={openQuickChatMenu} />
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

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.86)"]}
        style={styles.tiktokBottomFade}
      />

      <Animated.View
        style={[
          styles.tiktokInfoBlock,
          {
            bottom: isFullscreen ? 28 : TIKTOK_INFO_BOTTOM_OFFSET,
            transform: [{ translateY: infoTranslateY }],
          },
        ]}
      >
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

        <View style={styles.tiktokCreatorRow}>
          <View style={styles.tiktokCreatorText}>
            <View style={styles.tiktokNameRow}>
              <Text style={styles.tiktokCreatorName}>{video.creatorName}</Text>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.tiktokHandle}>{video.creatorHandle}</Text>
          </View>

          <View style={styles.tiktokCreatorBadge}>
            <Text style={styles.tiktokCreatorBadgeText}>{video.tag}</Text>
          </View>
        </View>
      </Animated.View>

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

function TikTokDockMenuItem(props: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tiktokDockMenuItem} onPress={props.onPress}>
      <Image
        source={VAR_CHAT_ICON}
        resizeMode="contain"
        style={styles.tiktokDockMenuIcon}
      />
      <Text style={styles.tiktokDockMenuText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
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
    backgroundColor: "rgba(13,36,72,0.94)",
  },
  tiktokVarTabText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
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
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 10,
    paddingLeft: TIKTOK_DOCK_CONTENT_OFFSET,
    paddingRight: 10,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tiktokDockMenuItem: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  tiktokDockMenuIcon: {
    width: 18,
    height: 18,
    marginLeft: 8,
  },
  tiktokDockMenuText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
  },
  tiktokDockButton: {
    alignItems: "center",
    paddingVertical: 7,
  },
  tiktokDockValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
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
    alignItems: "center",
  },
  tiktokCreatorRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
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
    marginTop: 10,
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
