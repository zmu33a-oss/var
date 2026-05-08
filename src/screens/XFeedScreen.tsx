import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { IconName, Post } from "../app.types";

const VAR_WORDMARK_ICON = require("../../assets/icons/var.png");
const VAR_CHAT_ICON = require("../../assets/icons/varchat.png");

type XFeedScreenProps = {
  isLoggedIn: boolean;
  posts: Post[];
  onCreatePost: () => void;
  onOpenChat: () => void;
  onRequireAuth: (message?: string) => void;
  onTogglePostLike: (postId: number) => void;
};

export default function XFeedScreen(props: XFeedScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const {
    isLoggedIn,
    posts,
    onCreatePost,
    onOpenChat,
    onRequireAuth,
    onTogglePostLike,
  } = props;

  const layoutWidth = Math.min(windowWidth, 430);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / 430));
  const xTopBarPaddingTop = Math.round(44 * chromeScale);
  const xTopBarPaddingHorizontal = Math.round(12 * chromeScale);
  const xTopBarPaddingBottom = Math.max(8, Math.round(8 * chromeScale));
  const xTopBarItemSize = Math.round(36 * chromeScale);
  const xTopBarIconSize = Math.round(22 * chromeScale);
  const xHeaderLogoFrameWidth = Math.round(118 * chromeScale);
  const xHeaderLogoFrameHeight = Math.round(28 * chromeScale);
  const xHeaderLogoImageWidth = Math.round(132 * chromeScale);
  const xHeaderLogoImageHeight = Math.round(82 * chromeScale);
  const xComposerAvatarSize = Math.round(38 * chromeScale);
  const xComposerAvatarTextSize = Math.round(15 * chromeScale);
  const xComposerPlaceholderSize = Math.round(19 * chromeScale);
  const xComposerPaddingHorizontal = Math.round(14 * chromeScale);
  const xComposerContentGap = Math.round(10 * chromeScale);
  const xPostButtonMinWidth = Math.round(80 * chromeScale);
  const xPostButtonPaddingHorizontal = Math.round(16 * chromeScale);
  const xPostButtonPaddingVertical = Math.max(8, Math.round(8 * chromeScale));
  const xScreenBottomPadding = Math.round(104 * chromeScale);

  const xComposerAction = isLoggedIn
    ? onCreatePost
    : () => onRequireAuth("سجل الدخول للنشر داخل صفحة X.");
  const xToolAction = (
    messageWhenLoggedIn: string,
    messageWhenLoggedOut: string,
  ) => onRequireAuth(isLoggedIn ? messageWhenLoggedIn : messageWhenLoggedOut);

  return (
    <View style={styles.xScreen}>
      <View
        style={[
          styles.xTopBar,
          {
            paddingTop: xTopBarPaddingTop,
            paddingHorizontal: xTopBarPaddingHorizontal,
            paddingBottom: xTopBarPaddingBottom,
          },
        ]}
      >
        <Pressable
          style={[
            styles.xTopBarAvatarButton,
            {
              width: xTopBarItemSize,
              height: xTopBarItemSize,
              borderRadius: xTopBarItemSize / 2,
            },
          ]}
          onPress={onOpenChat}
        >
          <View
            style={[
              styles.xTopBarAvatar,
              { borderRadius: xTopBarItemSize / 2 },
            ]}
          >
            <Image
              source={VAR_CHAT_ICON}
              resizeMode="contain"
              style={[
                styles.xTopBarAvatarIcon,
                { width: xTopBarIconSize, height: xTopBarIconSize },
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.xTopBarCenter}>
          <View
            style={[
              styles.xHeaderLogoFrame,
              {
                width: xHeaderLogoFrameWidth,
                height: xHeaderLogoFrameHeight,
              },
            ]}
          >
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={[
                styles.xHeaderLogoImage,
                {
                  width: xHeaderLogoImageWidth,
                  height: xHeaderLogoImageHeight,
                },
              ]}
            />
          </View>
        </View>

        <View
          style={[
            styles.xTopBarSpacer,
            { width: xTopBarItemSize, height: xTopBarItemSize },
          ]}
        />
      </View>

      <View style={styles.xTabsBar}>
        <View style={styles.xTabsInner}>
          <XHomeTab label="المتابَعون" />
          <XHomeTab active label="لأجلك" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.xScrollArea}
        contentContainerStyle={[
          styles.xScreenContent,
          { paddingBottom: xScreenBottomPadding },
        ]}
      >
        <View
          style={[
            styles.xComposerCard,
            { paddingHorizontal: xComposerPaddingHorizontal },
          ]}
        >
          <View style={styles.xComposerRow}>
            <View
              style={[
                styles.xComposerAvatar,
                {
                  width: xComposerAvatarSize,
                  height: xComposerAvatarSize,
                  borderRadius: xComposerAvatarSize / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.xComposerAvatarText,
                  { fontSize: xComposerAvatarTextSize },
                ]}
              >
                V
              </Text>
            </View>

            <View
              style={[
                styles.xComposerContent,
                { marginRight: xComposerContentGap },
              ]}
            >
              <Pressable
                style={styles.xComposerInputGhost}
                onPress={xComposerAction}
              >
                <Text
                  style={[
                    styles.xComposerPlaceholder,
                    { fontSize: xComposerPlaceholderSize },
                  ]}
                >
                  ماذا يحدث الآن؟
                </Text>
              </Pressable>

              <View style={styles.xReplyBadge}>
                <Ionicons name="globe-outline" size={12} color="#1D9BF0" />
                <Text style={styles.xReplyBadgeText}>يمكن للجميع الرد</Text>
              </View>

              <View style={styles.xComposerDivider} />

              <View style={styles.xComposerFooter}>
                <View style={styles.xComposerTools}>
                  <XComposerTool
                    icon="image-outline"
                    onPress={() =>
                      xToolAction(
                        "إرفاق الوسائط سيأتي في الخطوة التالية.",
                        "سجل الدخول لإرفاق وسائط.",
                      )
                    }
                  />
                  <XComposerTool
                    icon="bar-chart-outline"
                    onPress={() =>
                      xToolAction(
                        "إضافة تصويت سريع تأتي في خطوة لاحقة.",
                        "سجل الدخول لإضافة تصويت.",
                      )
                    }
                  />
                  <XComposerTool
                    icon="happy-outline"
                    onPress={() =>
                      xToolAction(
                        "الملصقات والتفاعلات ستُضاف لاحقًا.",
                        "سجل الدخول لإضافة تفاعل.",
                      )
                    }
                  />
                  <XComposerTool
                    icon="location-outline"
                    onPress={() =>
                      xToolAction(
                        "الموقع الجغرافي سيأتي في خطوة لاحقة.",
                        "سجل الدخول لإضافة موقع.",
                      )
                    }
                  />
                </View>

                <Pressable
                  style={[
                    styles.xPostButton,
                    {
                      minWidth: xPostButtonMinWidth,
                      paddingHorizontal: xPostButtonPaddingHorizontal,
                      paddingVertical: xPostButtonPaddingVertical,
                    },
                    !isLoggedIn ? styles.xPostButtonDisabled : null,
                  ]}
                  onPress={xComposerAction}
                >
                  <Text style={styles.xPostButtonText}>نشر</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {posts.map((post) => (
          <XPostCard
            key={post.id}
            post={post}
            onLike={() => {
              if (!isLoggedIn) {
                onRequireAuth("سجل الدخول للتفاعل مع منشورات X.");
                return;
              }

              onTogglePostLike(post.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function XHomeTab(props: { label: string; active?: boolean }) {
  return (
    <Pressable style={styles.xHomeTab}>
      <Text
        style={[
          styles.xHomeTabText,
          props.active ? styles.xHomeTabTextActive : null,
        ]}
      >
        {props.label}
      </Text>
      <View
        style={[
          styles.xHomeTabUnderline,
          props.active ? styles.xHomeTabUnderlineActive : null,
        ]}
      />
    </Pressable>
  );
}

function XComposerTool(props: { icon: IconName; onPress: () => void }) {
  return (
    <Pressable style={styles.xComposerTool} onPress={props.onPress}>
      <Ionicons name={props.icon} size={18} color="#1D9BF0" />
    </Pressable>
  );
}

function XPostCard(props: { post: Post; onLike: () => void }) {
  const { post, onLike } = props;
  const verified =
    post.handle.includes("var") || post.handle.includes("webplus");
  const showMedia = post.id % 2 === 1 || post.content.length > 60;

  return (
    <View style={styles.xPostCard}>
      <View style={styles.xPostRow}>
        <View style={styles.xAvatarTiny}>
          <Text style={styles.xAvatarTinyText}>{post.author.slice(0, 1)}</Text>
        </View>

        <View style={styles.xPostContent}>
          <View style={styles.xPostHead}>
            <View style={styles.xPostMetaBlock}>
              <View style={styles.xPostMetaLine}>
                <Text style={styles.xPostAuthor}>{post.author}</Text>
                {verified ? (
                  <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" />
                ) : null}
                <Text style={styles.xPostHandle}>{post.handle}</Text>
                <Text style={styles.xPostDot}>·</Text>
                <Text style={styles.xPostTime}>{post.time}</Text>
              </View>
            </View>

            <Pressable style={styles.xEllipsisButton}>
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color="rgba(255,255,255,0.56)"
              />
            </Pressable>
          </View>

          <Text style={styles.xPostBody}>{post.content}</Text>

          {showMedia ? (
            <View style={styles.xMediaCard}>
              <LinearGradient
                colors={["#15202B", "#0B1017"]}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.xMediaTopLabel}>
                <Text style={styles.xMediaTopLabelText}>VAR Replay</Text>
              </View>

              <View style={styles.xMediaOverlay}>
                <Text style={styles.xMediaTitle}>لقطة مرفقة بالمنشور</Text>
                <Text style={styles.xMediaSubtitle}>
                  لوحة تحليل سريعة داخل feed أقرب لواجهة X.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.xActionRow}>
            <XActionPill
              icon="chatbubble"
              value={post.replies}
              activeColor="#65D884"
              onPress={() => undefined}
            />
            <XActionPill
              icon="repeat"
              value={post.reposts}
              activeColor="#6DE5AA"
              onPress={() => undefined}
            />
            <XActionPill
              icon="heart"
              value={post.likes}
              activeColor="#FF607B"
              onPress={onLike}
              active={post.likedByMe}
            />
            <XActionPill
              icon="paper-plane"
              value={post.shares}
              activeColor="#68CBFF"
              onPress={() => undefined}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function XActionPill(props: {
  icon: IconName;
  value: number;
  activeColor: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable style={styles.xActionPill} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={14}
        color={props.active ? props.activeColor : "rgba(255,255,255,0.72)"}
      />
      <Text
        style={[
          styles.xActionPillText,
          {
            color: props.active ? props.activeColor : "rgba(255,255,255,0.72)",
          },
        ]}
      >
        {props.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  xScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  xScreenContent: {
    paddingBottom: 120,
    backgroundColor: "#000000",
  },
  xScrollArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  xTopBar: {
    backgroundColor: "rgba(0,0,0,0.96)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    paddingTop: 74,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xTopBarAvatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  xTopBarAvatar: {
    flex: 1,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  xTopBarAvatarIcon: {
    width: 26,
    height: 26,
  },
  xTopBarCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  xHeaderLogoFrame: {
    width: 146,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  xHeaderLogoImage: {
    width: 158,
    height: 104,
  },
  xTopBarSpacer: {
    width: 42,
    height: 42,
  },
  xTabsBar: {
    backgroundColor: "rgba(0,0,0,0.98)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  xTabsInner: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
  },
  xHomeTab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  xHomeTabText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 15,
    fontWeight: "700",
  },
  xHomeTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  xHomeTabUnderline: {
    width: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#1D9BF0",
    marginTop: 10,
    marginBottom: -1,
  },
  xHomeTabUnderlineActive: {
    width: 56,
  },
  xComposerCard: {
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  xComposerRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xComposerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1A8CD8",
    alignItems: "center",
    justifyContent: "center",
  },
  xComposerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  xComposerContent: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xComposerInputGhost: {
    minHeight: 50,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  xComposerPlaceholder: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 22,
    textAlign: "right",
  },
  xReplyBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(29,155,240,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  xReplyBadgeText: {
    color: "#1D9BF0",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 6,
  },
  xComposerDivider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginTop: 12,
  },
  xComposerFooter: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  xComposerTools: {
    flexDirection: "row-reverse",
  },
  xComposerTool: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  xPostButton: {
    minWidth: 84,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D9BF0",
  },
  xPostButtonDisabled: {
    opacity: 0.5,
  },
  xPostButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  xPostCard: {
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  xPostRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xAvatarTiny: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  xAvatarTinyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  xPostContent: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xPostHead: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  xEllipsisButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  xPostMetaBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 10,
  },
  xPostMetaLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
  },
  xPostAuthor: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },
  xPostHandle: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  xPostTime: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
  },
  xPostDot: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 14,
    marginLeft: 6,
  },
  xPostBody: {
    color: "#E7EEF5",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "right",
    alignSelf: "stretch",
    marginTop: 4,
  },
  xMediaCard: {
    alignSelf: "stretch",
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "space-between",
    backgroundColor: "#15202B",
  },
  xMediaTopLabel: {
    alignSelf: "flex-end",
    marginTop: 12,
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  xMediaTopLabelText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  xMediaOverlay: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    alignItems: "flex-end",
  },
  xMediaTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  xMediaSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  xActionRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  xActionPill: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  xActionPillText: {
    fontSize: 12,
    fontWeight: "700",
    marginRight: 6,
  },
});
