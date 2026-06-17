import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import type {
  FollowingProfileCard,
  Post,
  PostReply,
  ProfileData,
} from "../../../app.types";
import { normalizeAuthorId } from "../../../appshell/appshell.helpers";
import { XPostCard } from "../../x-feed/XPostCard";
import { resolveProfileAvatarUri } from "../profile.helpers";

const noop = () => undefined;

const LIKED_CONTENT_MAX_LENGTH = 110;

function truncateCompactContent(value: string) {
  const trimmedValue = value.replace(/\s+/g, " ").trim();

  if (!trimmedValue) {
    return "بدون نص";
  }

  if (trimmedValue.length <= LIKED_CONTENT_MAX_LENGTH) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, LIKED_CONTENT_MAX_LENGTH - 1)}…`;
}

function ProfileXCompactMessageCard(props: {
  profile: ProfileData;
  badgeLabel: string;
  accentColor: string;
  time: string;
  content: string;
  contextLine?: string;
}) {
  const avatarUri = resolveProfileAvatarUri(props.profile.avatarUri);
  const authorName = props.profile.displayName.trim() || "مستخدم";

  return (
    <View style={styles.likedCard}>
      <Text style={[styles.compactBadgeText, { color: props.accentColor }]}>
        {props.badgeLabel}
      </Text>

      <View style={styles.likedRow}>
        <View style={styles.likedAvatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.likedAvatarImage}
            />
          ) : (
            <Text style={styles.likedAvatarFallback}>
              {authorName.slice(0, 1)}
            </Text>
          )}
        </View>

        <View style={styles.likedCopy}>
          <View style={styles.likedMetaRow}>
            <Text style={styles.likedAuthor} numberOfLines={1}>
              {authorName}
            </Text>
            {props.time ? (
              <>
                <Text style={styles.likedDot}>·</Text>
                <Text style={styles.likedTime} numberOfLines={1}>
                  {props.time}
                </Text>
              </>
            ) : null}
          </View>

          {props.contextLine ? (
            <Text style={styles.compactContextLine} numberOfLines={1}>
              {props.contextLine}
            </Text>
          ) : null}

          <Text style={styles.likedContent} numberOfLines={3}>
            {props.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

function looksLikeTechnicalAuthorLabel(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    normalized === "user" ||
    normalized === "local-user" ||
    normalized.startsWith("var-") ||
    normalized.startsWith("@var") ||
    /^[a-f0-9-]{12,}$/i.test(normalized)
  );
}

function resolveLikedPostPresentation(
  post: Post,
  followedProfiles: FollowingProfileCard[],
) {
  const authorId = normalizeAuthorId(post.authorId || "");
  const matchedProfile = followedProfiles.find(
    (profile) => normalizeAuthorId(profile.varId) === authorId,
  );
  const authorName =
    matchedProfile?.displayName?.trim() ||
    (!looksLikeTechnicalAuthorLabel(post.author) ? post.author.trim() : "") ||
    matchedProfile?.displayVarId?.trim() ||
    "مستخدم";
  const avatarUri =
    post.authorAvatarUri?.trim() || matchedProfile?.avatarUri?.trim() || "";

  return {
    authorName,
    avatarUri,
    content: truncateCompactContent(post.content),
    time: post.time?.trim() || "",
  };
}

function ProfileXLikedPostCard(props: {
  post: Post;
  followedProfiles: FollowingProfileCard[];
}) {
  const presentation = resolveLikedPostPresentation(
    props.post,
    props.followedProfiles,
  );

  return (
    <View style={styles.likedCard}>
      <View style={styles.likedBadgeRow}>
        <Ionicons name="heart" size={13} color="#FB7185" />
        <Text style={styles.likedBadgeText}>إعجاب</Text>
      </View>

      <View style={styles.likedRow}>
        <View style={styles.likedAvatar}>
          {presentation.avatarUri ? (
            <Image
              source={{ uri: presentation.avatarUri }}
              style={styles.likedAvatarImage}
            />
          ) : (
            <Text style={styles.likedAvatarFallback}>
              {presentation.authorName.slice(0, 1)}
            </Text>
          )}
        </View>

        <View style={styles.likedCopy}>
          <View style={styles.likedMetaRow}>
            <Text style={styles.likedAuthor} numberOfLines={1}>
              {presentation.authorName}
            </Text>
            {presentation.time ? (
              <>
                <Text style={styles.likedDot}>·</Text>
                <Text style={styles.likedTime} numberOfLines={1}>
                  {presentation.time}
                </Text>
              </>
            ) : null}
          </View>

          <Text style={styles.likedContent} numberOfLines={3}>
            {presentation.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileXLikedPostFeed(props: {
  posts: Post[];
  followedProfiles: FollowingProfileCard[];
  emptyText: string;
}) {
  if (props.posts.length === 0) {
    return <ProfileXEmptyState message={props.emptyText} />;
  }

  return (
    <View style={styles.feed}>
      {props.posts.map((post) => (
        <ProfileXLikedPostCard
          key={`${post.id}-${post.sourceId || "local"}`}
          post={post}
          followedProfiles={props.followedProfiles}
        />
      ))}
    </View>
  );
}

function withProfileAuthor(post: Post, profile: ProfileData): Post {
  const username = profile.username?.trim();
  const handle = username ? `@${username}` : post.handle;

  return {
    ...post,
    author: profile.displayName.trim() || post.author,
    authorAvatarUri:
      resolveProfileAvatarUri(profile.avatarUri) || post.authorAvatarUri,
    authorVerified: profile.role === "admin" || post.authorVerified,
    handle,
  };
}

function ProfileXEmptyState(props: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{props.message}</Text>
    </View>
  );
}

export function ProfileXPostFeed(props: {
  posts: Post[];
  profile: ProfileData;
  emptyText: string;
  useProfileAuthor?: boolean;
}) {
  const useProfileAuthor = props.useProfileAuthor ?? true;

  if (props.posts.length === 0) {
    return <ProfileXEmptyState message={props.emptyText} />;
  }

  return (
    <View style={styles.feed}>
      {props.posts.map((post) => (
        <XPostCard
          key={`${post.id}-${post.sourceId || "local"}`}
          post={
            useProfileAuthor
              ? withProfileAuthor(post, props.profile)
              : post
          }
          interactive={false}
          showActionRow={false}
          onOpen={noop}
          onReply={noop}
          onRepost={noop}
          onLike={noop}
          onShare={noop}
        />
      ))}
    </View>
  );
}

export function ProfileXReplyFeed(props: {
  replies: PostReply[];
  profile: ProfileData;
  emptyText: string;
}) {
  if (props.replies.length === 0) {
    return <ProfileXEmptyState message={props.emptyText} />;
  }

  return (
    <View style={styles.feed}>
      {props.replies.map((reply) => (
        <ProfileXCompactMessageCard
          key={reply.id}
          profile={props.profile}
          badgeLabel="رد"
          accentColor="#8BD6FF"
          time={reply.time?.trim() || ""}
          content={truncateCompactContent(reply.content)}
        />
      ))}
    </View>
  );
}

export function ProfileXFanCommentFeed(props: {
  comments: {
    id: string;
    content: string;
    createdAt: string;
    clubId: string;
    clubLabel: string;
    timeLabel: string;
  }[];
  profile: ProfileData;
  emptyText: string;
}) {
  if (props.comments.length === 0) {
    return <ProfileXEmptyState message={props.emptyText} />;
  }

  return (
    <View style={styles.feed}>
      {props.comments.map((comment) => (
        <ProfileXCompactMessageCard
          key={comment.id}
          profile={props.profile}
          badgeLabel="تعليق"
          accentColor="#F4C565"
          time={comment.timeLabel}
          contextLine={comment.clubLabel}
          content={truncateCompactContent(comment.content)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    marginHorizontal: 0,
  },
  emptyState: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  likedCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  likedBadgeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  likedBadgeText: {
    color: "#FB7185",
    fontSize: 12,
    fontWeight: "800",
  },
  compactBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 10,
    alignSelf: "flex-end",
  },
  compactContextLine: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 4,
  },
  likedRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  likedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  likedAvatarImage: {
    width: "100%",
    height: "100%",
  },
  likedAvatarFallback: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  likedCopy: {
    flex: 1,
    alignItems: "flex-end",
  },
  likedMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  likedAuthor: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  likedDot: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 13,
    marginHorizontal: 5,
  },
  likedTime: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 12,
    fontWeight: "600",
  },
  likedContent: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "right",
  },
});
