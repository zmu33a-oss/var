import { supabase } from "../pages/supabase";
import type { XComment, XPost } from "./xPosts";

type XPostRow = {
  id: number;
  author_id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type XPostCommentRow = {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  author_handle: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type XPostReactionRow = {
  post_id: number;
  user_id: string;
};

type XPostShareRow = XPostReactionRow & {
  share_mode: "system" | "copy-link" | "copy-post" | "other";
};

type PersistedProfilePrefsRow = {
  background_image: string;
  layout_order: unknown;
};

export type StoredProfilePrefs = {
  backgroundImage: string;
  layoutOrder: unknown;
};

type SyncXPostsInput = {
  previousPosts: XPost[];
  nextPosts: XPost[];
  currentUserId: string;
};

type CreateXPostInput = {
  authorId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  imageUrl?: string;
};

type XIdentityUpdateInput = {
  userId: string;
  displayName: string;
  handle: string;
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "الآن";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y`;
}

function toCommentId(value: string | number) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function normalizePostKeySet(rows: Array<{ post_id: number }>) {
  const counts = new Map<number, number>();

  rows.forEach((row) => {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  });

  return counts;
}

function normalizeCommentRows(
  rows: XPostCommentRow[],
): Map<number, XComment[]> {
  const commentsByPostId = new Map<number, XComment[]>();

  [...rows]
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime(),
    )
    .forEach((row) => {
      const nextComment: XComment = {
        id: String(row.id),
        authorId: row.user_id,
        authorName: row.author_name,
        authorHandle: row.author_handle,
        text: row.body,
      };

      const currentComments = commentsByPostId.get(row.post_id) ?? [];
      commentsByPostId.set(row.post_id, [...currentComments, nextComment]);
    });

  return commentsByPostId;
}

function buildComparableComment(comment: XComment) {
  return {
    id: comment.id,
    authorId: comment.authorId ?? null,
    authorName: comment.authorName,
    authorHandle: comment.authorHandle,
    text: comment.text,
  };
}

function arePostsEquivalent(left: XPost, right: XPost) {
  return (
    JSON.stringify({
      id: left.id,
      user: left.user,
      handle: left.handle,
      authorId: left.authorId ?? null,
      content: left.content,
      image: left.image ?? null,
      likedByMe: Boolean(left.likedByMe),
      repostedByMe: Boolean(left.repostedByMe),
      sharedByMe: Boolean(left.sharedByMe),
      comments: (left.comments ?? []).map(buildComparableComment),
    }) ===
    JSON.stringify({
      id: right.id,
      user: right.user,
      handle: right.handle,
      authorId: right.authorId ?? null,
      content: right.content,
      image: right.image ?? null,
      likedByMe: Boolean(right.likedByMe),
      repostedByMe: Boolean(right.repostedByMe),
      sharedByMe: Boolean(right.sharedByMe),
      comments: (right.comments ?? []).map(buildComparableComment),
    })
  );
}

async function fetchXPostDependencies(postIds: number[]) {
  if (postIds.length === 0) {
    return {
      comments: [] as XPostCommentRow[],
      likes: [] as XPostReactionRow[],
      reposts: [] as XPostReactionRow[],
      shares: [] as XPostShareRow[],
    };
  }

  const [commentsRes, likesRes, repostsRes, sharesRes] = await Promise.all([
    supabase
      .from("x_post_comments")
      .select(
        "id, post_id, user_id, author_name, author_handle, body, created_at, updated_at",
      )
      .in("post_id", postIds),
    supabase
      .from("x_post_likes")
      .select("post_id, user_id")
      .in("post_id", postIds),
    supabase
      .from("x_post_reposts")
      .select("post_id, user_id")
      .in("post_id", postIds),
    supabase
      .from("x_post_shares")
      .select("post_id, user_id, share_mode")
      .in("post_id", postIds),
  ]);

  const firstError =
    commentsRes.error ?? likesRes.error ?? repostsRes.error ?? sharesRes.error;

  if (firstError) {
    throw firstError;
  }

  return {
    comments: (commentsRes.data ?? []) as XPostCommentRow[],
    likes: (likesRes.data ?? []) as XPostReactionRow[],
    reposts: (repostsRes.data ?? []) as XPostReactionRow[],
    shares: (sharesRes.data ?? []) as XPostShareRow[],
  };
}

async function syncPostDelta(
  previousPost: XPost,
  nextPost: XPost,
  currentUserId: string,
) {
  if (
    previousPost.content !== nextPost.content ||
    (previousPost.image ?? null) !== (nextPost.image ?? null)
  ) {
    await supabase
      .from("x_posts")
      .update({
        content: nextPost.content,
        image_url: nextPost.image ?? null,
      })
      .eq("id", nextPost.id)
      .eq("author_id", currentUserId);
  }

  if (Boolean(previousPost.likedByMe) !== Boolean(nextPost.likedByMe)) {
    if (nextPost.likedByMe) {
      await supabase.from("x_post_likes").upsert(
        {
          post_id: nextPost.id,
          user_id: currentUserId,
        },
        { onConflict: "post_id,user_id" },
      );
    } else {
      await supabase
        .from("x_post_likes")
        .delete()
        .eq("post_id", nextPost.id)
        .eq("user_id", currentUserId);
    }
  }

  if (Boolean(previousPost.repostedByMe) !== Boolean(nextPost.repostedByMe)) {
    if (nextPost.repostedByMe) {
      await supabase.from("x_post_reposts").upsert(
        {
          post_id: nextPost.id,
          user_id: currentUserId,
        },
        { onConflict: "post_id,user_id" },
      );
    } else {
      await supabase
        .from("x_post_reposts")
        .delete()
        .eq("post_id", nextPost.id)
        .eq("user_id", currentUserId);
    }
  }

  if (Boolean(previousPost.sharedByMe) !== Boolean(nextPost.sharedByMe)) {
    if (nextPost.sharedByMe) {
      await supabase.from("x_post_shares").upsert(
        {
          post_id: nextPost.id,
          user_id: currentUserId,
          share_mode: "other",
        },
        { onConflict: "post_id,user_id" },
      );
    } else {
      await supabase
        .from("x_post_shares")
        .delete()
        .eq("post_id", nextPost.id)
        .eq("user_id", currentUserId);
    }
  }

  const previousComments = previousPost.comments ?? [];
  const nextComments = nextPost.comments ?? [];
  const previousCommentsById = new Map(
    previousComments.map((comment) => [comment.id, comment]),
  );
  const nextCommentsById = new Map(
    nextComments.map((comment) => [comment.id, comment]),
  );

  for (const comment of nextComments) {
    const previousComment = previousCommentsById.get(comment.id);

    if (!previousComment) {
      await supabase.from("x_post_comments").insert({
        post_id: nextPost.id,
        user_id: comment.authorId ?? currentUserId,
        author_name: comment.authorName,
        author_handle: comment.authorHandle,
        body: comment.text,
      });
      continue;
    }

    if (previousComment.text !== comment.text) {
      const commentId = toCommentId(comment.id);
      if (!commentId) continue;

      await supabase
        .from("x_post_comments")
        .update({ body: comment.text })
        .eq("id", commentId)
        .eq("user_id", currentUserId);
    }
  }

  for (const comment of previousComments) {
    if (nextCommentsById.has(comment.id)) continue;

    const commentId = toCommentId(comment.id);
    if (!commentId) continue;

    await supabase
      .from("x_post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUserId);
  }
}

export async function fetchXPostsFromDatabase(currentUserId?: string | null) {
  const postsRes = await supabase
    .from("x_posts")
    .select(
      "id, author_id, author_name, author_handle, content, image_url, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (postsRes.error) {
    throw postsRes.error;
  }

  const postRows = (postsRes.data ?? []) as XPostRow[];
  const postIds = postRows.map((post) => post.id);
  const dependencies = await fetchXPostDependencies(postIds);
  const commentsByPostId = normalizeCommentRows(dependencies.comments);
  const likesByPostId = normalizePostKeySet(dependencies.likes);
  const repostsByPostId = normalizePostKeySet(dependencies.reposts);
  const sharesByPostId = normalizePostKeySet(dependencies.shares);

  return postRows.map(
    (row) =>
      ({
        id: row.id,
        user: row.author_name,
        handle: row.author_handle,
        authorId: row.author_id,
        time: formatRelativeTime(row.created_at),
        content: row.content,
        image: row.image_url ?? undefined,
        comments: commentsByPostId.get(row.id),
        likedByMe: dependencies.likes.some(
          (entry) =>
            entry.post_id === row.id && entry.user_id === currentUserId,
        ),
        repostedByMe: dependencies.reposts.some(
          (entry) =>
            entry.post_id === row.id && entry.user_id === currentUserId,
        ),
        sharedByMe: dependencies.shares.some(
          (entry) =>
            entry.post_id === row.id && entry.user_id === currentUserId,
        ),
        stats: {
          replies: commentsByPostId.get(row.id)?.length ?? 0,
          retweets: repostsByPostId.get(row.id) ?? 0,
          likes: likesByPostId.get(row.id) ?? 0,
          shares: sharesByPostId.get(row.id) ?? 0,
        },
      }) satisfies XPost,
  );
}

export async function syncXPostsChange({
  previousPosts,
  nextPosts,
  currentUserId,
}: SyncXPostsInput) {
  const previousPostsById = new Map(
    previousPosts.map((post) => [post.id, post]),
  );
  const nextPostsById = new Map(nextPosts.map((post) => [post.id, post]));

  const addedPost = nextPosts.find((post) => !previousPostsById.has(post.id));
  if (addedPost) {
    await createXPostInDatabase({
      authorId: currentUserId,
      authorName: addedPost.user,
      authorHandle: addedPost.handle,
      content: addedPost.content,
      imageUrl: addedPost.image,
    });

    return fetchXPostsFromDatabase(currentUserId);
  }

  const removedPost = previousPosts.find((post) => !nextPostsById.has(post.id));
  if (removedPost) {
    await supabase.from("x_posts").delete().eq("id", removedPost.id);
    return fetchXPostsFromDatabase(currentUserId);
  }

  const changedPost = nextPosts.find((post) => {
    const previousPost = previousPostsById.get(post.id);
    return previousPost ? !arePostsEquivalent(previousPost, post) : false;
  });

  if (changedPost) {
    const previousPost = previousPostsById.get(changedPost.id);
    if (previousPost) {
      await syncPostDelta(previousPost, changedPost, currentUserId);
    }

    return fetchXPostsFromDatabase(currentUserId);
  }

  return fetchXPostsFromDatabase(currentUserId);
}

export async function createXPostInDatabase({
  authorId,
  authorName,
  authorHandle,
  content,
  imageUrl,
}: CreateXPostInput) {
  const { data, error } = await supabase
    .from("x_posts")
    .insert({
      author_id: authorId,
      author_name: authorName,
      author_handle: authorHandle,
      content,
      image_url: imageUrl ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function loadProfilePrefsFromDatabase(userId: string) {
  const { data, error } = await supabase
    .from("user_profile_preferences")
    .select("background_image, layout_order")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const row = data as PersistedProfilePrefsRow;
  return {
    backgroundImage: row.background_image,
    layoutOrder: row.layout_order,
  } satisfies StoredProfilePrefs;
}

export async function saveProfilePrefsToDatabase(
  userId: string,
  prefs: StoredProfilePrefs,
) {
  const { error } = await supabase.from("user_profile_preferences").upsert(
    {
      user_id: userId,
      background_image: prefs.backgroundImage,
      layout_order: prefs.layoutOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function loadFollowCountsFromDatabase(userId: string) {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  const firstError = followersRes.error ?? followingRes.error;
  if (firstError) {
    throw firstError;
  }

  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

export async function replaceUserAliasesInDatabase(
  userId: string,
  displayNames: string[],
  handles: string[],
) {
  const { error: deleteError } = await supabase
    .from("user_aliases")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  const nextRows = [
    ...displayNames.map((value) => ({
      user_id: userId,
      alias_type: "display_name",
      alias_value: value,
    })),
    ...handles.map((value) => ({
      user_id: userId,
      alias_type: "handle",
      alias_value: value,
    })),
  ];

  if (nextRows.length === 0) return;

  const { error: insertError } = await supabase
    .from("user_aliases")
    .insert(nextRows);

  if (insertError) {
    throw insertError;
  }
}

export async function updateXIdentityInDatabase({
  userId,
  displayName,
  handle,
}: XIdentityUpdateInput) {
  const [postsRes, commentsRes] = await Promise.all([
    supabase
      .from("x_posts")
      .update({ author_name: displayName, author_handle: handle })
      .eq("author_id", userId),
    supabase
      .from("x_post_comments")
      .update({ author_name: displayName, author_handle: handle })
      .eq("user_id", userId),
  ]);

  const firstError = postsRes.error ?? commentsRes.error;
  if (firstError) {
    throw firstError;
  }
}
