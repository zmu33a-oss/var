import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { IconName, Post, PostReply } from "../../app.types";

function PostMediaPreview(props: { mediaUri: string }) {
  return (
    <View style={styles.xMediaCard}>
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
  const body = (
    <>
      {post.title ? <Text style={styles.xPostTitle}>{post.title}</Text> : null}
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

export function XPostCard(props: {
  post: Post;
  onOpenAuthor?: () => void;
  onOpen: () => void;
  onReply: () => void;
  onRepost: () => void;
  onLike: () => void;
  onShare: () => void;
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
    onLike,
    onShare,
    onOpenActions,
    interactive = true,
    showActionRow = true,
  } = props;
  const repostMeta = post.repostMeta;
  const headerAuthor = repostMeta?.author || post.author;
  const headerHandle = repostMeta?.handle || post.handle;
  const headerTime = repostMeta?.time || post.time;
  const headerAvatarUri = repostMeta?.authorAvatarUri || post.authorAvatarUri;
  const verified = Boolean(repostMeta?.authorVerified ?? post.authorVerified);
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
                <Ionicons name="repeat" size={13} color="#6DE5AA" />
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
              <Ionicons name="repeat" size={13} color="#6DE5AA" />
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

  return (
    <View style={styles.xPostCard}>
      <View style={styles.xPostRow}>
        {onOpenAuthor ? (
          <Pressable style={styles.xAvatarTiny} onPress={onOpenAuthor}>
            {headerAvatarUri?.trim() ? (
              <Image
                source={{ uri: headerAvatarUri }}
                style={styles.xAvatarTinyImage}
              />
            ) : (
              <Text style={styles.xAvatarTinyText}>
                {headerAuthor.slice(0, 1)}
              </Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.xAvatarTiny}>
            {headerAvatarUri?.trim() ? (
              <Image
                source={{ uri: headerAvatarUri }}
                style={styles.xAvatarTinyImage}
              />
            ) : (
              <Text style={styles.xAvatarTinyText}>
                {headerAuthor.slice(0, 1)}
              </Text>
            )}
          </View>
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

          {showActionRow ? (
            <View style={styles.xActionRow}>
              <XActionPill
                icon="chatbubble"
                value={post.replies}
                activeColor="#65D884"
                onPress={onReply}
              />
              <XActionPill
                icon="repeat"
                value={post.reposts}
                activeColor="#6DE5AA"
                onPress={onRepost}
                active={post.repostedByMe}
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
                onPress={onShare}
                active={post.sharedByMe}
              />
            </View>
          ) : null}
        </View>
      </View>
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
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
    marginLeft: 10,
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
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#15202B",
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
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
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
  xReplyThreadCard: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    marginTop: 6,
  },
});
