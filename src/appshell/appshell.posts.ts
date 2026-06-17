import { useCallback, useEffect, useRef, useState } from "react";

import type {

  AppwriteAuthUser,

  AppwritePostReplyRecord,

  AppwriteProfileIndexRecord,

  AppwriteSocialInteractionRecord,

} from "../lib/appwrite";

import {

  APPWRITE_CONFIG,

  createAppwritePost,

  getAppwritePostsConfigurationError,

  hasAppwritePostsConfig,

  hasStoredAppwriteSession,

  listAppwritePosts,

  listAppwriteProfileIndexesByVarIds,

  listAppwriteXEngagementByTargetIds,

  listAppwriteXReposts,

  listAppwriteXRepliesByTargetIds,

  subscribeToAppwriteCollection,

  uploadAppwritePostImage,

} from "../lib/appwrite";

import type { Post, ProfileData } from "../app.types";

import {

  buildCurrentUserPostIdentity,

  buildProfileIndexPostIdentity,

  formatPostTime,

  hashFeedEntryId,

  mapAppwritePostRecordToPost,

  mapAppwriteReplyRecordToPostReply,

  normalizeAuthorId,

  type PostIdentityOverrides,

} from "./appshell.helpers";



const POSTS_POLL_INTERVAL_MS = 60_000;

export const POSTS_PAGE_SIZE = 20;



type UseAppwritePostsOptions = {

  isLoggedIn: boolean;

  appwriteUser: AppwriteAuthUser | null;

  profile: ProfileData;

  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;

  setFansPosts?: React.Dispatch<React.SetStateAction<Post[]>>;

  setNotice: (msg: string) => void;

};



function resolvePostEngagementTargetId(post: Post) {

  return post.sourceId?.trim() || String(post.id);

}



type SyncPostsOptions = {

  isLoggedIn: boolean;

  appwriteUser: AppwriteAuthUser | null;

  profile: ProfileData;

  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;

  setFansPosts?: React.Dispatch<React.SetStateAction<Post[]>>;

  setNotice: (msg: string) => void;

  quiet?: boolean;

  limit?: number;

  offset?: number;

  append?: boolean;

};



function splitPostsByFeedScope(

  records: Awaited<ReturnType<typeof listAppwritePosts>>["records"],

) {

  const xRecords = records.filter((record) => record.feedScope !== "fans");

  const fansRecords = records.filter((record) => record.feedScope === "fans");

  return { xRecords, fansRecords };

}



function mergeSyncedPosts(

  currentPosts: Post[],

  syncedPosts: Post[],

  append: boolean,

) {

  const syncedSourceIds = new Set(

    syncedPosts

      .map((post) => post.sourceId?.trim())

      .filter((value): value is string => Boolean(value)),

  );

  const syncedFeedKeys = new Set(

    syncedPosts

      .map((post) => post.feedKey?.trim())

      .filter((value): value is string => Boolean(value)),

  );

  const pendingLocalPosts = currentPosts.filter((post) => {

    const sourceId = post.sourceId?.trim();

    const feedKey = post.feedKey?.trim();



    if (feedKey) {

      return !syncedFeedKeys.has(feedKey);

    }



    return Boolean(sourceId && !syncedSourceIds.has(sourceId));

  });



  if (append) {

    const existingKeys = new Set(

      currentPosts.map((post) => post.feedKey?.trim() || String(post.id)),

    );

    const nextEntries = syncedPosts.filter((post) => {

      const entryKey = post.feedKey?.trim() || String(post.id);



      return !existingKeys.has(entryKey);

    });



    return [...currentPosts, ...nextEntries, ...pendingLocalPosts];

  }



  return [...syncedPosts, ...pendingLocalPosts];

}



type BuildSyncedPostsInput = {

  appwritePosts: Awaited<ReturnType<typeof listAppwritePosts>>["records"];

  appwriteReposts: AppwriteSocialInteractionRecord[];

  isLoggedIn: boolean;

  appwriteUser: AppwriteAuthUser | null;

  profile: ProfileData;

};



function buildRepostFeedEntry(

  repostRecord: AppwriteSocialInteractionRecord,

  originalPost: Post,

  reposterIdentity: PostIdentityOverrides,

): Post {

  const reposterVarId = normalizeAuthorId(repostRecord.varId);



  return {

    ...originalPost,

    id: hashFeedEntryId(`repost-${repostRecord.id}`),

    feedKey: `repost-${repostRecord.id}`,

    repostMeta: {

      interactionId: repostRecord.id,

      varId: reposterVarId,

      author: reposterIdentity.author?.trim() || reposterVarId,

      authorAvatarUri: reposterIdentity.authorAvatarUri?.trim() || undefined,

      authorVerified: reposterIdentity.authorVerified,

      handle:

        reposterIdentity.handle?.trim() ||

        originalPost.handle ||

        reposterVarId,

      time: formatPostTime(repostRecord.createdAt),

    },

  };

}



async function buildSyncedPostsFromRecords(

  input: BuildSyncedPostsInput,

): Promise<Post[]> {

  const { appwritePosts, appwriteReposts, isLoggedIn, appwriteUser, profile } =

    input;

  const currentUserVarId = isLoggedIn

    ? appwriteUser?.varId.trim() || profile.varId.trim()

    : "";

  const normalizedCurrentUserVarId = currentUserVarId

    ? normalizeAuthorId(currentUserVarId)

    : "";

  const basePosts = appwritePosts.map((record, index) =>

    mapAppwritePostRecordToPost(record, index),

  );

  const postBySourceId = new Map<string, Post>();



  for (const post of basePosts) {

    const sourceId = post.sourceId?.trim();



    if (sourceId) {

      postBySourceId.set(sourceId, post);

    }

  }



  const replyTargetIds = Array.from(

    new Set(

      basePosts.flatMap((post) =>

        [post.sourceId?.trim(), String(post.id)].filter(

          (value): value is string => Boolean(value),

        ),

      ),

    ),

  );

  const [appwriteReplies, engagementByTargetId] = await Promise.all([

    replyTargetIds.length

      ? listAppwriteXRepliesByTargetIds(replyTargetIds)

      : Promise.resolve([]),

    replyTargetIds.length

      ? listAppwriteXEngagementByTargetIds(

          replyTargetIds,

          normalizedCurrentUserVarId || undefined,

        )

      : Promise.resolve(new Map()),

  ]);

  const profileIndexes = await listAppwriteProfileIndexesByVarIds([

    ...appwritePosts.map((record) => record.varId || record.authorId),

    ...appwriteReplies.map((reply) => reply.varId),

    ...appwriteReposts.map((repost) => repost.varId),

  ]);



  const profileIndexMap = new Map<string, AppwriteProfileIndexRecord>();



  for (const profileIndex of profileIndexes) {

    const normalizedVarId = normalizeAuthorId(profileIndex.varId);



    if (normalizedVarId) {

      profileIndexMap.set(normalizedVarId, profileIndex);

    }

  }



  const repliesByTargetId = new Map<string, AppwritePostReplyRecord[]>();



  for (const replyRecord of appwriteReplies) {

    const normalizedTargetId = replyRecord.postTargetId.trim();



    if (!normalizedTargetId) {

      continue;

    }



    const currentReplies = repliesByTargetId.get(normalizedTargetId) ?? [];

    currentReplies.push(replyRecord);

    repliesByTargetId.set(normalizedTargetId, currentReplies);

  }



  const enrichPost = (record: (typeof appwritePosts)[number], index: number) => {

    const recordVarId = normalizeAuthorId(record.varId || record.authorId);

    const identityOverrides: PostIdentityOverrides =

      normalizedCurrentUserVarId && recordVarId === normalizedCurrentUserVarId

        ? buildCurrentUserPostIdentity({

            varId: currentUserVarId,

            profile,

            appwriteUser,

          })

        : buildProfileIndexPostIdentity(

            profileIndexMap.get(recordVarId),

            recordVarId,

          );

    const mappedPost = mapAppwritePostRecordToPost(

      record,

      index,

      identityOverrides,

    );

    const matchingReplyRecords = Array.from(

      new Map(

        [mappedPost.sourceId?.trim(), String(mappedPost.id)]

          .filter((value): value is string => Boolean(value))

          .flatMap((targetId) => repliesByTargetId.get(targetId) ?? [])

          .map((replyRecord) => [replyRecord.id, replyRecord]),

      ).values(),

    ).sort(

      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),

    );

    const replyItems = matchingReplyRecords.map((replyRecord, replyIndex) => {

      const replyVarId = normalizeAuthorId(replyRecord.varId);

      const replyIdentityOverrides: PostIdentityOverrides =

        normalizedCurrentUserVarId && replyVarId === normalizedCurrentUserVarId

          ? buildCurrentUserPostIdentity({

              varId: currentUserVarId,

              profile,

              appwriteUser,

            })

          : buildProfileIndexPostIdentity(

              profileIndexMap.get(replyVarId),

              replyVarId,

            );



      return mapAppwriteReplyRecordToPostReply(

        replyRecord,

        replyIndex,

        replyIdentityOverrides,

      );

    });

    const engagementTargetId = resolvePostEngagementTargetId(mappedPost);

    const engagement =

      engagementByTargetId.get(engagementTargetId) ??

      engagementByTargetId.get(mappedPost.sourceId?.trim() || "") ??

      engagementByTargetId.get(String(mappedPost.id));



    return {

      ...mappedPost,

      likes: engagement?.likes ?? 0,

      reposts: engagement?.reposts ?? 0,

      shares: engagement?.shares ?? 0,

      likedByMe: engagement?.likedByMe ?? false,

      repostedByMe: engagement?.repostedByMe ?? false,

      sharedByMe: engagement?.sharedByMe ?? false,

      replies: replyItems.length,

      replyItems,

    };

  };



  const syncedPosts = appwritePosts.map(enrichPost);



  for (const post of syncedPosts) {

    const sourceId = post.sourceId?.trim();



    if (sourceId) {

      postBySourceId.set(sourceId, post);

    }

  }



  const repostEntries = appwriteReposts

    .map((repostRecord) => {

      const originalPost = postBySourceId.get(repostRecord.targetId.trim());



      if (!originalPost) {

        return null;

      }



      const reposterVarId = normalizeAuthorId(repostRecord.varId);

      const reposterIdentity: PostIdentityOverrides =

        normalizedCurrentUserVarId && reposterVarId === normalizedCurrentUserVarId

          ? buildCurrentUserPostIdentity({

              varId: currentUserVarId,

              profile,

              appwriteUser,

            })

          : buildProfileIndexPostIdentity(

              profileIndexMap.get(reposterVarId),

              reposterVarId,

            );



      return {

        sortAt: Date.parse(repostRecord.createdAt),

        post: buildRepostFeedEntry(

          repostRecord,

          originalPost,

          reposterIdentity,

        ),

      };

    })

    .filter(

      (

        entry,

      ): entry is {

        sortAt: number;

        post: Post;

      } => Boolean(entry),

    );



  const feedEntries = [

    ...syncedPosts.map((post, index) => ({

      sortAt: Date.parse(appwritePosts[index]?.createdAt || ""),

      post,

    })),

    ...repostEntries,

  ];



  feedEntries.sort((left, right) => {

    const leftSortAt = Number.isNaN(left.sortAt) ? left.post.id : left.sortAt;

    const rightSortAt = Number.isNaN(right.sortAt)

      ? right.post.id

      : right.sortAt;



    return rightSortAt - leftSortAt;

  });



  return feedEntries.map((entry) => entry.post);

}



export async function syncAppwritePostsFromCloud(

  options: SyncPostsOptions,

): Promise<{ total: number; loadedCount: number }> {

  const {

    isLoggedIn,

    appwriteUser,

    profile,

    setPosts,

    setFansPosts,

    limit = POSTS_PAGE_SIZE,

    offset = 0,

    append = false,

  } = options;



  const postsPage = await listAppwritePosts({ limit, offset });

  const { xRecords, fansRecords } = splitPostsByFeedScope(postsPage.records);

  const appwriteReposts = await listAppwriteXReposts({

    limit: Math.max(limit, 50),

    offset: 0,

  });

  const syncedPosts = await buildSyncedPostsFromRecords({

    appwritePosts: xRecords,

    appwriteReposts,

    isLoggedIn,

    appwriteUser,

    profile,

  });



  setPosts((currentPosts) =>

    mergeSyncedPosts(

      currentPosts.filter((post) => post.feedScope !== "fans"),

      syncedPosts,

      append,

    ),

  );



  if (setFansPosts) {

    const syncedFansPosts = await buildSyncedPostsFromRecords({

      appwritePosts: fansRecords,

      appwriteReposts: [],

      isLoggedIn,

      appwriteUser,

      profile,

    });



    setFansPosts((currentPosts) =>

      mergeSyncedPosts(

        currentPosts.filter((post) => post.feedScope === "fans"),

        syncedFansPosts,

        false,

      ),

    );

  }



  return {

    total: postsPage.total,

    loadedCount: offset + postsPage.records.length,

  };

}



export function useAppwritePostsSync(options: UseAppwritePostsOptions) {

  const { isLoggedIn, appwriteUser, profile, setPosts, setFansPosts, setNotice } = options;

  const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);

  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  const [hasMorePosts, setHasMorePosts] = useState(true);

  const loadedCountRef = useRef(0);



  const runSync = useCallback(

    async (options?: {

      quiet?: boolean;

      append?: boolean;

      reset?: boolean;

    }) => {

      const quiet = options?.quiet ?? false;

      const append = options?.append ?? false;

      const reset = options?.reset ?? false;

      if (append) {

        setIsLoadingMorePosts(true);

      } else if (!quiet) {

        setIsRefreshingPosts(true);

      }



      try {

        if (!hasAppwritePostsConfig()) {

          return {

            total: 0,

            loadedCount: loadedCountRef.current,

          };

        }

        const offset = append ? loadedCountRef.current : 0;

        const limit = append

          ? POSTS_PAGE_SIZE

          : reset

            ? POSTS_PAGE_SIZE

            : Math.max(loadedCountRef.current, POSTS_PAGE_SIZE);

        const result = await syncAppwritePostsFromCloud({

          isLoggedIn,

          appwriteUser,

          profile,

          setPosts,

          setFansPosts,

          setNotice,

          quiet,

          limit,

          offset,

          append,

        });



        if (append) {

          loadedCountRef.current = result.loadedCount;

        } else if (reset) {

          loadedCountRef.current = result.loadedCount;

        } else {

          loadedCountRef.current = Math.max(

            loadedCountRef.current,

            result.loadedCount,

          );

        }



        setHasMorePosts(result.loadedCount < result.total);

      } catch (error) {

        setNotice(

          error instanceof Error

            ? `تعذر تحميل Posts من Appwrite: ${error.message}`

            : "تعذر تحميل Posts من Appwrite.",

        );

      } finally {

        if (append) {

          setIsLoadingMorePosts(false);

        } else if (!quiet) {

          setIsRefreshingPosts(false);

        }

      }

    },

    [

      appwriteUser,

      appwriteUser?.avatarUri,

      appwriteUser?.displayVarId,

      appwriteUser?.name,

      isLoggedIn,

      profile.avatarUri,

      profile.displayName,

      profile.displayVarId,

      profile.isVerified,

      profile.joinDate,

      profile.nationality,

      profile.username,

      profile.varId,

      setNotice,

      setPosts,

      setFansPosts,

    ],

  );



  useEffect(() => {

    if (!hasAppwritePostsConfig()) {

      return;

    }



    void runSync({ quiet: true });



    const pollTimer = setInterval(() => {

      void runSync({ quiet: true });

    }, POSTS_POLL_INTERVAL_MS);



    const unsubscribe = subscribeToAppwriteCollection(

      APPWRITE_CONFIG.databaseId,

      APPWRITE_CONFIG.postsCollectionId,

      (_payload, events) => {

        const shouldRefresh = events.some(

          (event) =>

            event.includes(".create") ||

            event.includes(".update") ||

            event.includes(".delete"),

        );



        if (shouldRefresh) {

          void runSync({ quiet: true });

        }

      },

    );



    return () => {

      clearInterval(pollTimer);

      unsubscribe?.();

    };

  }, [runSync]);



  return {

    refreshPosts: () => runSync({ quiet: false, reset: true }),

    syncPostsQuiet: () => runSync({ quiet: true, reset: true }),

    loadMorePosts: () => {

      if (!hasMorePosts || isLoadingMorePosts) {

        return;

      }



      void runSync({ quiet: true, append: true });

    },

    isRefreshingPosts,

    isLoadingMorePosts,

    hasMorePosts,

  };

}



export async function publishAppwritePost(options: {

  postTitle: string;

  postContent: string;

  postAuthorId: string;

  postMediaUri?: string;

  fromVarLibrary?: boolean;

  feedScope?: "x" | "fans";

  appwriteUser: AppwriteAuthUser | null;

  profile: ProfileData;

  onPublished: (post: Post) => void;

  setIsPublishingPost: (value: boolean) => void;

  setNotice: (msg: string) => void;

  onClose: () => void;

  trackVarInteraction: (input: {

    mode: "x" | "tiktok";

    action: "post" | "reply" | "comment" | "like" | "repost" | "share" | "save";

    targetId: string;

    value?: string;

  }) => void;

}) {

  const {

    postTitle,

    postContent,

    postAuthorId,

    postMediaUri,

    fromVarLibrary,

    feedScope = "x",

    appwriteUser,

    profile,

    onPublished,

    setIsPublishingPost,

    setNotice,

    onClose,

    trackVarInteraction,

  } = options;



  const trimmedTitle = postTitle.trim();

  const trimmedContent = postContent.trim();

  const trimmedMediaUri = postMediaUri?.trim() || "";

  const resolvedAuthorId = normalizeAuthorId(

    appwriteUser?.varId.trim() || postAuthorId.trim() || profile.varId,

  );



  if (!trimmedContent) {

    setNotice("اكتب محتوى المنشور قبل النشر.");

    return;

  }



  if (!appwriteUser?.varId?.trim()) {

    setNotice("سجل الدخول أولاً لنشر منشور على X.");

    return;

  }



  if (!resolvedAuthorId || resolvedAuthorId === "local-user") {

    setNotice("تعذر تحديد VAR ID للنشر. أعد تسجيل الدخول.");

    return;

  }



  const postsConfigurationError = getAppwritePostsConfigurationError();



  if (!hasAppwritePostsConfig() || postsConfigurationError) {

    setNotice(

      postsConfigurationError ||

        "ربط Appwrite غير مكتمل للمنشورات. راجع ملف .env.",

    );

    return;

  }



  if (!hasStoredAppwriteSession()) {

    setNotice(

      "جلسة Appwrite غير نشطة. سجّل الخروج ثم ادخل مرة أخرى قبل نشر المنشور.",

    );

    return;

  }



  setIsPublishingPost(true);



  try {

    let resolvedMediaUri = "";



    if (trimmedMediaUri) {

      try {

        resolvedMediaUri = await uploadAppwritePostImage(

          trimmedMediaUri,

          resolvedAuthorId,

        );

      } catch (error) {

        setNotice(

          error instanceof Error

            ? `تعذر رفع الصورة: ${error.message}`

            : "تعذر رفع الصورة المرفقة.",

        );

        return;

      }

    }



    const createdPost = await createAppwritePost({

      title: trimmedTitle,

      content: trimmedContent,

      varId: appwriteUser.varId.trim(),

      mediaUri: resolvedMediaUri || undefined,

      fromVarLibrary: fromVarLibrary || undefined,

      feedScope,

    });

    const createdPostIdentity = buildCurrentUserPostIdentity({

      varId: resolvedAuthorId,

      profile,

      appwriteUser,

    });



    onPublished(

      mapAppwritePostRecordToPost(createdPost, 0, createdPostIdentity),

    );

    trackVarInteraction({

      mode: "x",

      action: "post",

      targetId: createdPost.id,

      value: trimmedContent,

    });

    onClose();

    setNotice(

      feedScope === "fans"

        ? "تم نشر المنشور في الرابطة وحفظه في Appwrite."

        : "تم نشر المنشور على X وحفظه في Appwrite.",

    );

  } catch (error) {

    const rawMessage = error instanceof Error ? error.message : "";

    if (
      rawMessage.includes("fromVarLibrary")
    ) {
      setNotice(
        "مجموعة المنشورات تحتاج حقل fromVarLibrary (Boolean). شغّل: node scripts/ensure-posts-media-uri.cjs",
      );

      return;
    }

    if (
      rawMessage.includes("feedScope")
    ) {
      setNotice(
        "مجموعة المنشورات تحتاج حقل feedScope (String). شغّل: node scripts/ensure-posts-media-uri.cjs",
      );

      return;
    }

    if (
      rawMessage.includes("mediaUri") ||
      rawMessage.includes("Unknown attribute")
    ) {
      setNotice(
        "مجموعة المنشورات في Appwrite تحتاج حقل mediaUri (نوع URL أو String بطول كافٍ). أضفه من Console ثم أعد المحاولة.",
      );

      return;
    }

    setNotice(

      rawMessage

        ? `فشل نشر المنشور: ${rawMessage}`

        : "فشل نشر المنشور في Appwrite.",

    );

  } finally {

    setIsPublishingPost(false);

  }

}

