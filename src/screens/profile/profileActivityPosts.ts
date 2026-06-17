import type {
  Post,
  PostReply,
  ProfileData,
  SocialInteractionRecord,
} from "../../app.types";
import {
  buildComposerDisplayVarId,
  formatPostTime,
  normalizeAuthorId,
} from "../../appshell/appshell.helpers";

function normalizeProfileActivityToken(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function buildProfileHandleCandidates(profile: ProfileData) {
  return new Set(
    [
      profile.varId,
      profile.displayVarId,
      profile.username,
      buildComposerDisplayVarId(profile.displayVarId, profile.varId),
    ]
      .map(normalizeProfileActivityToken)
      .filter(Boolean),
  );
}

function isProfilePostAuthor(
  post: Post,
  profile: ProfileData,
  handleCandidates: Set<string>,
) {
  const normalizedProfileVarId = normalizeAuthorId(profile.varId);
  const normalizedPostAuthorId = normalizeAuthorId(post.authorId || "");

  if (
    normalizedProfileVarId !== "local-user" &&
    normalizedPostAuthorId === normalizedProfileVarId
  ) {
    return true;
  }

  const normalizedPostHandle = normalizeProfileActivityToken(post.handle);
  const normalizedPostAuthor = normalizeProfileActivityToken(post.author);
  const normalizedDisplayName = normalizeProfileActivityToken(
    profile.displayName,
  );

  return (
    handleCandidates.has(normalizedPostHandle) ||
    Boolean(normalizedDisplayName && normalizedPostAuthor === normalizedDisplayName)
  );
}

function isProfileReplyAuthor(
  reply: PostReply,
  profile: ProfileData,
  handleCandidates: Set<string>,
) {
  const normalizedReplyHandle = normalizeProfileActivityToken(reply.handle);
  const normalizedReplyAuthor = normalizeProfileActivityToken(reply.author);
  const normalizedDisplayName = normalizeProfileActivityToken(
    profile.displayName,
  );

  return (
    handleCandidates.has(normalizedReplyHandle) ||
    Boolean(normalizedDisplayName && normalizedReplyAuthor === normalizedDisplayName)
  );
}

function buildPostsById(posts: Post[]) {
  const postsById = new Map<string, Post>();

  posts.forEach((post) => {
    postsById.set(String(post.id), post);

    if (post.sourceId?.trim()) {
      postsById.set(post.sourceId.trim(), post);
    }
  });

  return postsById;
}

function dedupePosts(posts: Post[]) {
  const seen = new Set<string>();
  const result: Post[] = [];

  posts.forEach((post) => {
    const key = `${post.id}-${post.sourceId || ""}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(post);
  });

  return result;
}

function isNotificationPayload(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("{")) {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmedValue) as {
      title?: string;
      body?: string;
      timeLabel?: string;
    };

    return Boolean(parsed.title?.trim() || parsed.body?.trim());
  } catch {
    return false;
  }
}

export function isNotificationLikeInteraction(
  interaction: SocialInteractionRecord,
) {
  if (interaction.mode === "notification") {
    return true;
  }

  if (interaction.action === "notify" || interaction.action === "follow") {
    return true;
  }

  const value = interaction.value?.trim() || "";

  if (!value) {
    return false;
  }

  if (isNotificationPayload(value)) {
    return true;
  }

  const normalizedValue = value.toLowerCase();

  return (
    normalizedValue.includes("متابعة") ||
    normalizedValue.includes("الغاء المتابعة") ||
    normalizedValue.includes("إلغاء المتابعة") ||
    normalizedValue.includes("أضافك إلى المتابعين") ||
    normalizedValue.includes("follow")
  );
}

function isRealXReplyInteraction(interaction: SocialInteractionRecord) {
  if (!interaction.active || isNotificationLikeInteraction(interaction)) {
    return false;
  }

  if (interaction.mode !== "x") {
    return false;
  }

  if (interaction.action !== "reply" && interaction.action !== "comment") {
    return false;
  }

  const value = interaction.value?.trim() || "";

  return Boolean(value) && !isNotificationPayload(value);
}

function isRealXEngagementInteraction(
  interaction: SocialInteractionRecord,
  action: "like" | "repost" | "share",
) {
  if (!interaction.active || isNotificationLikeInteraction(interaction)) {
    return false;
  }

  if (interaction.mode !== "x") {
    return false;
  }

  return interaction.action === action;
}

export function filterProfileAuthoredPosts(
  posts: Post[],
  profile: ProfileData,
) {
  const handleCandidates = buildProfileHandleCandidates(profile);

  return posts.filter(
    (post) =>
      !post.repostMeta && isProfilePostAuthor(post, profile, handleCandidates),
  );
}

export function filterProfileReplyItems(posts: Post[], profile: ProfileData) {
  const handleCandidates = buildProfileHandleCandidates(profile);
  const replies: PostReply[] = [];

  posts.forEach((post) => {
    (post.replyItems ?? []).forEach((reply) => {
      if (!isProfileReplyAuthor(reply, profile, handleCandidates)) {
        return;
      }

      replies.push(reply);
    });
  });

  return replies;
}

export function filterProfileRepostPosts(posts: Post[], profile: ProfileData) {
  const normalizedProfileVarId = normalizeAuthorId(profile.varId);
  const postsById = buildPostsById(posts);
  const repostPosts: Post[] = [];

  posts.forEach((post) => {
    if (
      post.repostMeta &&
      normalizedProfileVarId !== "local-user" &&
      normalizeAuthorId(post.repostMeta.varId) === normalizedProfileVarId
    ) {
      repostPosts.push(post);
    }
  });

  return dedupePosts(repostPosts);
}

export function filterInteractionPosts(
  posts: Post[],
  socialInteractions: SocialInteractionRecord[] | undefined,
  action: "like" | "repost" | "share",
) {
  if (!socialInteractions?.length) {
    return [];
  }

  const postsById = buildPostsById(posts);
  const matchedPosts: Post[] = [];

  socialInteractions.forEach((interaction) => {
    if (!isRealXEngagementInteraction(interaction, action)) {
      return;
    }

    const post = postsById.get(interaction.targetId);

    if (post) {
      matchedPosts.push(post);
    }
  });

  return dedupePosts(matchedPosts);
}

export function mergeProfileRepostPosts(
  posts: Post[],
  profile: ProfileData,
  socialInteractions?: SocialInteractionRecord[],
) {
  return dedupePosts([
    ...filterProfileRepostPosts(posts, profile),
    ...filterInteractionPosts(posts, socialInteractions, "repost"),
  ]);
}

export function filterProfileInteractionReplies(
  posts: Post[],
  profile: ProfileData,
  socialInteractions?: SocialInteractionRecord[],
) {
  if (!socialInteractions?.length) {
    return [] as PostReply[];
  }

  const replies: PostReply[] = [];

  socialInteractions.forEach((interaction, index) => {
    if (!isRealXReplyInteraction(interaction)) {
      return;
    }

    replies.push({
      id:
        Number(String(interaction.id).replace(/\D/g, "").slice(-8)) ||
        index + 1,
      author: profile.displayName.trim() || "مستخدم",
      authorAvatarUri: profile.avatarUri?.trim() || undefined,
      authorVerified: profile.role === "admin",
      handle: "",
      time: formatPostTime(interaction.createdAt),
      content: interaction.value?.trim() || "بدون نص",
    });
  });

  return replies;
}

export function mergeProfileReplies(
  posts: Post[],
  profile: ProfileData,
  socialInteractions?: SocialInteractionRecord[],
) {
  const seen = new Set<number>();
  const merged: PostReply[] = [];

  [
    ...filterProfileReplyItems(posts, profile),
    ...filterProfileInteractionReplies(posts, profile, socialInteractions),
  ].forEach((reply) => {
    if (seen.has(reply.id)) {
      return;
    }

    seen.add(reply.id);
    merged.push(reply);
  });

  return merged;
}
