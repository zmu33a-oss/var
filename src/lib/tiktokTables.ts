import { supabase } from "../pages/supabase";
import { deleteOwnVideoApi, shouldFallbackAdminApi } from "./adminApi";

export type TikTokComment = {
  id: number;
  userId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: string;
};

export type TikTokVideo = {
  id: number;
  video_url: string;
  caption: string;
  user_id: string | null;
  creator_name: string | null;
  creator_handle: string | null;
  creator_avatar_url: string | null;
  creator_avatar_frame_enabled: boolean;
  created_at: string | null;
  likedByMe: boolean;
  savedByMe: boolean;
  sharedByMe: boolean;
  comments: TikTokComment[];
  stats: {
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  };
};

type VideoRow = {
  id: number;
  video_url: string;
  caption: string;
  user_id?: string | null;
  creator_name?: string | null;
  creator_handle?: string | null;
  creator_avatar_url?: string | null;
  creator_avatar_frame_enabled?: boolean | null;
  created_at?: string | null;
};

type ReactionRow = {
  video_id: number;
  user_id: string;
};

type CommentRow = {
  id: number;
  video_id: number;
  user_id: string;
  author_name: string;
  author_handle: string;
  body: string;
  created_at: string;
};

type ShareMode = "system" | "copy-link" | "copy-video" | "other";

type CreateTikTokVideoInput = {
  userId: string | null;
  videoUrl: string;
  caption: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl?: string | null;
  creatorAvatarFrameEnabled?: boolean;
};

type CreateTikTokCommentInput = {
  videoId: number;
  userId: string;
  authorName: string;
  authorHandle: string;
  body: string;
};

function normalizeVideoRow(row: VideoRow): TikTokVideo {
  return {
    id: row.id,
    video_url: row.video_url,
    caption: row.caption,
    user_id: row.user_id ?? null,
    creator_name: row.creator_name ?? null,
    creator_handle: row.creator_handle ?? null,
    creator_avatar_url: row.creator_avatar_url ?? null,
    creator_avatar_frame_enabled: Boolean(row.creator_avatar_frame_enabled),
    created_at: row.created_at ?? null,
    likedByMe: false,
    savedByMe: false,
    sharedByMe: false,
    comments: [],
    stats: {
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
    },
  };
}

function groupCounts(rows: Array<{ video_id: number }>) {
  const counts = new Map<number, number>();

  rows.forEach((row) => {
    counts.set(row.video_id, (counts.get(row.video_id) ?? 0) + 1);
  });

  return counts;
}

function groupComments(rows: CommentRow[]) {
  const commentsByVideoId = new Map<number, TikTokComment[]>();

  [...rows]
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime(),
    )
    .forEach((row) => {
      const currentComments = commentsByVideoId.get(row.video_id) ?? [];

      commentsByVideoId.set(row.video_id, [
        ...currentComments,
        {
          id: row.id,
          userId: row.user_id,
          authorName: row.author_name,
          authorHandle: row.author_handle,
          body: row.body,
          createdAt: row.created_at,
        },
      ]);
    });

  return commentsByVideoId;
}

async function selectVideoRows() {
  const primary = await supabase
    .from("videos")
    .select(
      "id, video_url, caption, user_id, creator_name, creator_handle, creator_avatar_url, creator_avatar_frame_enabled, created_at",
    )
    .order("created_at", { ascending: false });

  if (!primary.error) {
    return (primary.data ?? []) as VideoRow[];
  }

  const fallback = await supabase
    .from("videos")
    .select("id, video_url, caption")
    .order("id", { ascending: false });

  if (fallback.error) {
    throw fallback.error;
  }

  return ((fallback.data ?? []) as VideoRow[]).map((row) => ({
    ...row,
    user_id: null,
    creator_name: null,
    creator_handle: null,
    creator_avatar_url: null,
    creator_avatar_frame_enabled: false,
    created_at: null,
  }));
}

async function fetchDependencies(videoIds: number[]) {
  if (videoIds.length === 0) {
    return {
      comments: [] as CommentRow[],
      likes: [] as ReactionRow[],
      saves: [] as ReactionRow[],
      shares: [] as ReactionRow[],
    };
  }

  const [commentsRes, likesRes, savesRes, sharesRes] = await Promise.allSettled(
    [
      supabase
        .from("video_comments")
        .select(
          "id, video_id, user_id, author_name, author_handle, body, created_at",
        )
        .in("video_id", videoIds),
      supabase
        .from("video_likes")
        .select("video_id, user_id")
        .in("video_id", videoIds),
      supabase
        .from("video_saves")
        .select("video_id, user_id")
        .in("video_id", videoIds),
      supabase
        .from("video_shares")
        .select("video_id, user_id")
        .in("video_id", videoIds),
    ],
  );

  const resolveDependencyRows = <TRow>(
    result: PromiseSettledResult<{
      data: TRow[] | null;
      error: {
        message?: string;
        code?: string;
      } | null;
    }>,
    label: string,
  ) => {
    if (result.status === "rejected") {
      console.warn(`Failed to load TikTok ${label}`, result.reason);
      return [] as TRow[];
    }

    if (result.value.error) {
      console.warn(`Failed to load TikTok ${label}`, result.value.error);
      return [] as TRow[];
    }

    return (result.value.data ?? []) as TRow[];
  };

  return {
    comments: resolveDependencyRows<CommentRow>(commentsRes, "comments"),
    likes: resolveDependencyRows<ReactionRow>(likesRes, "likes"),
    saves: resolveDependencyRows<ReactionRow>(savesRes, "saves"),
    shares: resolveDependencyRows<ReactionRow>(sharesRes, "shares"),
  };
}

export async function fetchTikTokVideosFromDatabase(
  currentUserId?: string | null,
) {
  const videoRows = await selectVideoRows();
  const videoIds = videoRows.map((row) => row.id);
  const dependencies = await fetchDependencies(videoIds);
  const commentsByVideoId = groupComments(dependencies.comments);
  const likesByVideoId = groupCounts(dependencies.likes);
  const savesByVideoId = groupCounts(dependencies.saves);
  const sharesByVideoId = groupCounts(dependencies.shares);

  return videoRows.map((row) => ({
    ...normalizeVideoRow(row),
    comments: commentsByVideoId.get(row.id) ?? [],
    likedByMe: dependencies.likes.some(
      (entry) => entry.video_id === row.id && entry.user_id === currentUserId,
    ),
    savedByMe: dependencies.saves.some(
      (entry) => entry.video_id === row.id && entry.user_id === currentUserId,
    ),
    sharedByMe: dependencies.shares.some(
      (entry) => entry.video_id === row.id && entry.user_id === currentUserId,
    ),
    stats: {
      likes: likesByVideoId.get(row.id) ?? 0,
      comments: commentsByVideoId.get(row.id)?.length ?? 0,
      saves: savesByVideoId.get(row.id) ?? 0,
      shares: sharesByVideoId.get(row.id) ?? 0,
    },
  }));
}

export async function createTikTokVideoInDatabase({
  userId,
  videoUrl,
  caption,
  creatorName,
  creatorHandle,
  creatorAvatarUrl,
  creatorAvatarFrameEnabled = false,
}: CreateTikTokVideoInput) {
  const primary = await supabase
    .from("videos")
    .insert({
      video_url: videoUrl,
      caption,
      user_id: userId,
      creator_name: creatorName,
      creator_handle: creatorHandle,
      creator_avatar_url: creatorAvatarUrl ?? null,
      creator_avatar_frame_enabled: creatorAvatarFrameEnabled,
    })
    .select(
      "id, video_url, caption, user_id, creator_name, creator_handle, creator_avatar_url, creator_avatar_frame_enabled, created_at",
    )
    .single();

  if (!primary.error && primary.data) {
    return normalizeVideoRow(primary.data as VideoRow);
  }

  const fallback = await supabase
    .from("videos")
    .insert({
      video_url: videoUrl,
      caption,
    })
    .select("id, video_url, caption")
    .single();

  if (fallback.error) {
    throw fallback.error;
  }

  return normalizeVideoRow(fallback.data as VideoRow);
}

export async function toggleTikTokVideoLike(
  videoId: number,
  userId: string,
  liked: boolean,
) {
  if (liked) {
    const { error } = await supabase.from("video_likes").upsert(
      {
        video_id: videoId,
        user_id: userId,
      },
      { onConflict: "video_id,user_id" },
    );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("video_likes")
    .delete()
    .eq("video_id", videoId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function toggleTikTokVideoSave(
  videoId: number,
  userId: string,
  saved: boolean,
) {
  if (saved) {
    const { error } = await supabase.from("video_saves").upsert(
      {
        video_id: videoId,
        user_id: userId,
      },
      { onConflict: "video_id,user_id" },
    );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("video_saves")
    .delete()
    .eq("video_id", videoId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function recordTikTokVideoShare(
  videoId: number,
  userId: string,
  shareMode: ShareMode,
) {
  const { error } = await supabase.from("video_shares").upsert(
    {
      video_id: videoId,
      user_id: userId,
      share_mode: shareMode,
    },
    { onConflict: "video_id,user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function addTikTokVideoComment({
  videoId,
  userId,
  authorName,
  authorHandle,
  body,
}: CreateTikTokCommentInput) {
  const { error } = await supabase.from("video_comments").insert({
    video_id: videoId,
    user_id: userId,
    author_name: authorName,
    author_handle: authorHandle,
    body,
  });

  if (error) {
    throw error;
  }
}

export async function deleteTikTokVideoFromDatabase(
  videoId: number,
  userId: string,
) {
  try {
    await deleteOwnVideoApi(videoId);
    return;
  } catch (error) {
    if (!shouldFallbackAdminApi(error)) {
      throw error;
    }
  }

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function updateTikTokIdentityInDatabase({
  userId,
  creatorName,
  creatorHandle,
  creatorAvatarUrl,
  creatorAvatarFrameEnabled,
}: {
  userId: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl?: string | null;
  creatorAvatarFrameEnabled: boolean;
}) {
  const { error } = await supabase
    .from("videos")
    .update({
      creator_name: creatorName,
      creator_handle: creatorHandle,
      creator_avatar_url: creatorAvatarUrl ?? null,
      creator_avatar_frame_enabled: creatorAvatarFrameEnabled,
    })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
