import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { IconName, Post, PostReply } from "../../app.types";

export function XPostCard(props: {
  post: Post;
  canToggleFollow?: boolean;
  isFollowingAuthor?: boolean;
  onToggleFollow?: () => void;
  onOpenAuthor?: () => void;
  onOpen: () => void;
  onReply: () => void;
  onRepost: () => void;
  onLike: () => void;
  onShare: () => void;
  interactive?: boolean;
  showActionRow?: boolean;
  showSyntheticMedia?: boolean;
}) {
  const {
    post,
    onOpenAuthor,
    onOpen,
    onReply,
    onRepost,
    onLike,
    onShare,
    interactive = true,
    showActionRow = true,
    showSyntheticMedia = true,
  } = props;
  const verified = Boolean(post.authorVerified);
  const showMedia =
    showSyntheticMedia && (post.id % 2 === 1 || post.content.length > 60);
  const headerActions = (
    <View style={styles.xPostHeadActions}>
      <Pressable style={styles.xEllipsisButton}>
        <Ionicons
          name="ellipsis-horizontal"
          size={18}
          color="rgba(255,255,255,0.56)"
        />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.xPostCard}>
      <View style={styles.xPostRow}>
        {onOpenAuthor ? (
          <Pressable style={styles.xAvatarTiny} onPress={onOpenAuthor}>
            {post.authorAvatarUri?.trim() ? (
              <Image
                source={{ uri: post.authorAvatarUri }}
                style={styles.xAvatarTinyImage}
              />
            ) : (
              <Text style={styles.xAvatarTinyText}>
                {post.author.slice(0, 1)}
              </Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.xAvatarTiny}>
            {post.authorAvatarUri?.trim() ? (
              <Image
                source={{ uri: post.authorAvatarUri }}
                style={styles.xAvatarTinyImage}
              />
            ) : (
              <Text style={styles.xAvatarTinyText}>
                {post.author.slice(0, 1)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.xPostContent}>
          {interactive ? (
            <Pressable style={styles.xPostOpenArea} onPress={onOpen}>
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
                      <View style={styles.xPostMetaLine}>
                        <Text style={styles.xPostAuthor}>{post.author}</Text>
                        {verified ? (
                          <SealCheckIcon
                            size={14}
                            style={styles.xVerifiedIcon}
                          />
                        ) : null}
                        <Text style={styles.xPostHandle}>{post.handle}</Text>
                        <Text style={styles.xPostDot}>·</Text>
                        <Text style={styles.xPostTime}>{post.time}</Text>
                      </View>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.xPostMetaBlock}>
                    <View style={styles.xPostMetaLine}>
                      <Text style={styles.xPostAuthor}>{post.author}</Text>
                      {verified ? (
                        <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
                      ) : null}
                      <Text style={styles.xPostHandle}>{post.handle}</Text>
                      <Text style={styles.xPostDot}>·</Text>
                      <Text style={styles.xPostTime}>{post.time}</Text>
                    </View>
                  </View>
                )}

                {headerActions}
              </View>

              {post.title ? (
                <Text style={styles.xPostTitle}>{post.title}</Text>
              ) : null}

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
            </Pressable>
          ) : (
            <View style={styles.xPostOpenArea}>
              <View style={styles.xPostHead}>
                {onOpenAuthor ? (
                  <Pressable
                    style={styles.xPostMetaBlockPressable}
                    onPress={onOpenAuthor}
                  >
                    <View style={styles.xPostMetaBlock}>
                      <View style={styles.xPostMetaLine}>
                        <Text style={styles.xPostAuthor}>{post.author}</Text>
                        {verified ? (
                          <SealCheckIcon
                            size={14}
                            style={styles.xVerifiedIcon}
                          />
                        ) : null}
                        <Text style={styles.xPostHandle}>{post.handle}</Text>
                        <Text style={styles.xPostDot}>·</Text>
                        <Text style={styles.xPostTime}>{post.time}</Text>
                      </View>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.xPostMetaBlock}>
                    <View style={styles.xPostMetaLine}>
                      <Text style={styles.xPostAuthor}>{post.author}</Text>
                      {verified ? (
                        <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
                      ) : null}
                      <Text style={styles.xPostHandle}>{post.handle}</Text>
                      <Text style={styles.xPostDot}>·</Text>
                      <Text style={styles.xPostTime}>{post.time}</Text>
                    </View>
                  </View>
                )}

                {headerActions}
              </View>

              {post.title ? (
                <Text style={styles.xPostTitle}>{post.title}</Text>
              ) : null}

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
