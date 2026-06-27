import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import RetweetIcon from "../../components/RetweetIcon";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { IconName, Post, PostReply } from "../../app.types";
import { LEAGUE_POLL_AVATAR_GRADIENTS } from "../leagues/leagues.constants";
import { X_POST_MEDIA_BACKGROUND } from "./x-feed.media.constants";
import { useRemoteImageAspectRatio } from "./x-feed.media.utils";
import { XRepostConfirmModal } from "./XRepostConfirmModal";
import {
  createPostAvatarLabel,
  estimatePostViews,
} from "./x-feed.utils";

const ACTION_MUTED = "rgba(255,255,255,0.56)";
const ACTION_ICON_SIZE = 18;

function PostMediaPreview(props: { mediaUri: string }) {
  const mediaAspectRatio = useRemoteImageAspectRatio(props.mediaUri, false);

  return (
    <View
      style={[
        styles.xMediaCard,
        {
          aspectRatio: mediaAspectRatio,
        },
      ]}
    >
      <Image
        source={{ uri: props.mediaUri }}
        style={styles.xMediaImage}
        resizeMode="cover"
      />
    </View>
  );
}

function PostBodyBlock(props: {
  post: Post;
  showQuotedShell?: boolean;
}) {
  const { post, showQuotedShell = false } = props;
  const mediaUri = post.mediaUri?.trim() || "";
  const displayTitle = post.title?.trim();
  const shouldShowTitle =
    Boolean(displayTitle) && displayTitle !== "رسالة عامة";
  const body = (
    <>
      {shouldShowTitle ? (
        <Text style={styles.xPostTitle}>{displayTitle}</Text>
      ) : null}
      <Text style={styles.xPostBody}>{post.content}</Text>
      {mediaUri ? <PostMediaPreview mediaUri={mediaUri} /> : null}
    </>
  );

  if (!showQuotedShell) {
    return body;
  }

  return (
    <View style={styles.xQuotedPostCard}>
      <View style={styles.xPostMetaLine}>
        <Text style={styles.xPostAuthor}>{post.author}</Text>
        {post.authorVerified ? (
          <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
        ) : null}
        <Text style={styles.xPostHandle}>{post.handle}</Text>
      </View>
      {body}
    </View>
  );
}

function XPostActionItem(props: {
  icon?: IconName;
  customIcon?: ReactNode;
  value?: number;
  color?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      {props.customIcon ?? (
        <Ionicons
          name={props.icon!}
          size={ACTION_ICON_SIZE}
          color={props.color ?? ACTION_MUTED}
        />
      )}
      {typeof props.value === "number" ? (
        <Text style={[styles.xPostActionCount, props.color ? { color: props.color } : null]}>
          {props.value}
        </Text>
      ) : null}
    </>
  );

  if (!props.onPress) {
    return <View style={styles.xPostActionSlot}>{content}</View>;
  }

  return (
    <Pressable style={styles.xPostActionSlot} onPress={props.onPress}>
      {content}
    </Pressable>
  );
}

export function XPostCard(props: {
  post: Post;
  onOpenAuthor?: () => void;
  onOpen: () => void;
  onReply: () => void;
  onRepost: () => void;
  beforeRepost?: () => boolean;
  confirmRepost?: boolean;
  onLike: () => void;
  onShare: () => void;
  onSave?: () => void;
  onOpenActions?: () => void;
  interactive?: boolean;
  showActionRow?: boolean;
}) {
  const {
    post,
    onOpenAuthor,
    onOpen,
    onReply,
    onRepost,
    beforeRepost,
    confirmRepost = true,
    onLike,
    onShare,
    onSave,
    onOpenActions,
    interactive = true,
    showActionRow = true,
  } = props;
  const [showRepostConfirm, setShowRepostConfirm] = useState(false);
  const repostMeta = post.repostMeta;
  const headerAuthor = repostMeta?.author || post.author;
  const headerHandle = repostMeta?.handle || post.handle;
  const headerTime = repostMeta?.time || post.time;
  const headerAvatarUri = repostMeta?.authorAvatarUri || post.authorAvatarUri;
  const verified = Boolean(repostMeta?.authorVerified ?? post.authorVerified);
  const avatarGradient =
    LEAGUE_POLL_AVATAR_GRADIENTS[
      Math.abs(post.id) % LEAGUE_POLL_AVATAR_GRADIENTS.length
    ];
  const viewCount = estimatePostViews(post);

  const handleRepostPress = () => {
    if (beforeRepost && !beforeRepost()) {
      return;
    }

    if (post.repostedByMe || !confirmRepost) {
      onRepost();
      return;
    }

    setShowRepostConfirm(true);
  };

  const confirmRepostAction = () => {
    setShowRepostConfirm(false);
    onRepost();
  };

  const cancelRepostAction = () => {
    setShowRepostConfirm(false);
  };

  const avatarNode = headerAvatarUri?.trim() ? (
    <Image source={{ uri: headerAvatarUri }} style={styles.xAvatarTinyImage} />
  ) : (
    <LinearGradient
      colors={avatarGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.xAvatarTinyGradient}
    >
      <Text style={styles.xAvatarTinyText}>
        {createPostAvatarLabel(headerAuthor)}
      </Text>
    </LinearGradient>
  );

  const headerActions = onOpenActions ? (
    <View style={styles.xPostHeadActions}>
      <Pressable style={styles.xEllipsisButton} onPress={onOpenActions}>
        <Ionicons
          name="ellipsis-horizontal"
          size={18}
          color="rgba(255,255,255,0.56)"
        />
      </Pressable>
    </View>
  ) : null;

  const headerBlock = (
    <View style={styles.xPostHead}>
      {onOpenAuthor ? (
        <Pressable
          style={styles.xPostMetaBlockPressable}
          onPress={(event) => {
            event.stopPropagation?.();
            onOpenAuthor();
          }}
        >
          <View style={styles.xPostMetaBlock}>
            {repostMeta ? (
              <View style={styles.xRepostBanner}>
                <RetweetIcon size={13} color="#6DE5AA" />
                <Text style={styles.xRepostBannerText}>
                  {headerAuthor} أعاد النشر
                </Text>
                <Text style={styles.xPostDot}>·</Text>
                <Text style={styles.xPostTime}>{headerTime}</Text>
              </View>
            ) : null}
            <View style={styles.xPostMetaLine}>
              <Text style={styles.xPostAuthor}>{headerAuthor}</Text>
              {verified ? (
                <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
              ) : null}
              {!repostMeta ? (
                <>
                  <Text style={styles.xPostHandle}>{headerHandle}</Text>
                  <Text style={styles.xPostDot}>·</Text>
                  <Text style={styles.xPostTime}>{headerTime}</Text>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.xPostMetaBlock}>
          {repostMeta ? (
            <View style={styles.xRepostBanner}>
              <RetweetIcon size={13} color="#6DE5AA" />
              <Text style={styles.xRepostBannerText}>
                {headerAuthor} أعاد النشر
              </Text>
              <Text style={styles.xPostDot}>·</Text>
              <Text style={styles.xPostTime}>{headerTime}</Text>
            </View>
          ) : null}
          <View style={styles.xPostMetaLine}>
            <Text style={styles.xPostAuthor}>{headerAuthor}</Text>
            {verified ? (
              <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
            ) : null}
            {!repostMeta ? (
              <>
                <Text style={styles.xPostHandle}>{headerHandle}</Text>
                <Text style={styles.xPostDot}>·</Text>
                <Text style={styles.xPostTime}>{headerTime}</Text>
              </>
            ) : null}
          </View>
        </View>
      )}

      {headerActions}
    </View>
  );

  const contentBlock = repostMeta ? (
    <PostBodyBlock post={post} showQuotedShell />
  ) : (
    <PostBodyBlock post={post} />
  );

  const actionsBlock = showActionRow ? (
    <View style={styles.xPostActionsRow}>
      <XPostActionItem
        icon="chatbubble-outline"
        value={post.replies}
        onPress={onReply}
      />
      <XPostActionItem
        customIcon={
          <RetweetIcon
            size={ACTION_ICON_SIZE}
            color={post.repostedByMe ? "#6DE5AA" : ACTION_MUTED}
            active={post.repostedByMe}
          />
        }
        value={post.reposts}
        color={post.repostedByMe ? "#6DE5AA" : ACTION_MUTED}
        onPress={handleRepostPress}
      />
      <XPostActionItem
        icon={post.likedByMe ? "heart" : "heart-outline"}
        value={post.likes}
        color={post.likedByMe ? "#F87171" : ACTION_MUTED}
        onPress={onLike}
      />
      <XPostActionItem icon="stats-chart-outline" value={viewCount} />
      <XPostActionItem
        icon={post.savedByMe ? "bookmark" : "bookmark-outline"}
        color={post.savedByMe ? "#FBBF24" : ACTION_MUTED}
        onPress={onSave}
      />
      <XPostActionItem
        icon="share-social-outline"
        color={post.sharedByMe ? "#68CBFF" : ACTION_MUTED}
        onPress={onShare}
      />
    </View>
  ) : null;

  return (
    <View style={styles.xPostCard}>
      <View style={styles.xPostRow}>
        {onOpenAuthor ? (
          <Pressable style={styles.xAvatarTiny} onPress={onOpenAuthor}>
            {avatarNode}
          </Pressable>
        ) : (
          <View style={styles.xAvatarTiny}>{avatarNode}</View>
        )}

        <View style={styles.xPostContent}>
          {interactive ? (
            <Pressable style={styles.xPostOpenArea} onPress={onOpen}>
              {headerBlock}
              {contentBlock}
            </Pressable>
          ) : (
            <View style={styles.xPostOpenArea}>
              {headerBlock}
              {contentBlock}
            </View>
          )}
          {actionsBlock}
        </View>
      </View>

      {showRepostConfirm ? (
        <XRepostConfirmModal
          post={post}
          onConfirm={confirmRepostAction}
          onCancel={cancelRepostAction}
        />
      ) : null}
    </View>
  );
}

export function XActionPill(props: {
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

export function XReplyCard(props: { reply: PostReply }) {
  const { reply } = props;

  return (
    <View style={styles.xReplyThreadCard}>
      <View style={styles.xReplyThreadRow}>
        <View style={styles.xAvatarTiny}>
          {reply.authorAvatarUri?.trim() ? (
            <Image
              source={{ uri: reply.authorAvatarUri }}
              style={styles.xAvatarTinyImage}
            />
          ) : (
            <Text style={styles.xAvatarTinyText}>
              {reply.author.slice(0, 1)}
            </Text>
          )}
        </View>

        <View style={styles.xReplyThreadContent}>
          <View style={styles.xPostMetaLine}>
            <Text style={styles.xPostAuthor}>{reply.author}</Text>
            {reply.authorVerified ? (
              <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
            ) : null}
            <Text style={styles.xPostHandle}>{reply.handle}</Text>
            <Text style={styles.xPostDot}>·</Text>
            <Text style={styles.xPostTime}>{reply.time}</Text>
          </View>

          <Text style={styles.xReplyThreadBody}>{reply.content}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xPostCard: {
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 12,
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  xAvatarTinyGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  xAvatarTinyImage: {
    width: "100%",
    height: "100%",
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
  xPostOpenArea: {
    alignSelf: "stretch",
  },
  xPostHead: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  xPostMetaBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 10,
  },
  xPostMetaBlockPressable: {
    flex: 1,
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
    marginLeft: 3,
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
  xPostHeadActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xEllipsisButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  xVerifiedIcon: {
    marginLeft: 4,
    marginRight: 0,
  },
  xPostTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    alignSelf: "stretch",
    marginTop: 2,
    marginBottom: 6,
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
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: X_POST_MEDIA_BACKGROUND,
  },
  xMediaImage: {
    width: "100%",
    height: "100%",
  },
  xRepostBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 4,
  },
  xRepostBannerText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  xQuotedPostCard: {
    alignSelf: "stretch",
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  xPostActionsRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
    maxWidth: "100%",
  },
  xPostActionSlot: {
    flex: 1,
    minHeight: 34,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  xPostActionCount: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 12,
    fontWeight: "700",
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
  xReplyThreadCard: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#000000",
  },
  xReplyThreadRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xReplyThreadContent: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xReplyThreadBody: {
    color: "#E7EEF5",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "right",
    marginTop: 4,
  },
});
