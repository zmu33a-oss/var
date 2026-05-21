import { useEffect } from "react";
import type {
  AppwriteAuthUser,
  AppwritePostReplyRecord,
  AppwriteProfileIndexRecord,
} from "../lib/appwrite";
import {
  createAppwritePost,
  getAppwritePostsConfigurationError,
  hasAppwritePostsConfig,
  hasStoredAppwriteSession,
  listAppwritePosts,
  listAppwriteProfileIndexesByVarIds,
  listAppwriteXRepliesByTargetIds,
} from "../lib/appwrite";
import { INITIAL_POSTS } from "../app.data";
import type { Post, ProfileData } from "../app.types";
import {
  buildCurrentUserPostIdentity,
  buildProfileIndexPostIdentity,
  mapAppwritePostRecordToPost,
  mapAppwriteReplyRecordToPostReply,
  normalizeAuthorId,
  type PostIdentityOverrides,
} from "./appshell.helpers";

const POST_COMPOSER_DEFAULT_TITLE = "رسالة عامة";

type UseAppwritePostsOptions = {
  isLoggedIn: boolean;
  appwriteUser: AppwriteAuthUser | null;
  profile: ProfileData;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setNotice: (msg: string) => void;
};

export function useAppwritePostsSync(options: UseAppwritePostsOptions) {
  const { isLoggedIn, appwriteUser, profile, setPosts, setNotice } = options;

  useEffect(() => {
    let isActive = true;

    if (!hasAppwritePostsConfig() || !isLoggedIn) {
      return;
    }

    const syncPostsFromAppwrite = async () => {
      try {
        const appwritePosts = await listAppwritePosts();
        const currentUserVarId =
          appwriteUser?.varId.trim() || profile.varId.trim();
        const normalizedCurrentUserVarId = currentUserVarId
          ? normalizeAuthorId(currentUserVarId)
          : "";
        const basePosts = appwritePosts.map((record, index) =>
          mapAppwritePostRecordToPost(record, index),
        );
        const replyTargetIds = Array.from(
          new Set(
            basePosts.flatMap((post) =>
              [post.sourceId?.trim(), String(post.id)].filter(
                (value): value is string => Boolean(value),
              ),
            ),
          ),
        );
        const appwriteReplies = replyTargetIds.length
          ? await listAppwriteXRepliesByTargetIds(replyTargetIds)
          : [];
        const profileIndexes = await listAppwriteProfileIndexesByVarIds([
          ...appwritePosts.map((record) => record.varId || record.authorId),
          ...appwriteReplies.map((reply) => reply.varId),
        ]);

        if (!isActive) {
          return;
        }

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

          const currentReplies =
            repliesByTargetId.get(normalizedTargetId) ?? [];
          currentReplies.push(replyRecord);
          repliesByTargetId.set(normalizedTargetId, currentReplies);
        }

        const syncedPosts = appwritePosts.map((record, index) => {
            const recordVarId = normalizeAuthorId(
              record.varId || record.authorId,
            );
            const identityOverrides: PostIdentityOverrides =
              normalizedCurrentUserVarId &&
              recordVarId === normalizedCurrentUserVarId
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
              (left, right) =>
                Date.parse(right.createdAt) - Date.parse(left.createdAt),
            );
            const replyItems = matchingReplyRecords.map(
              (replyRecord, replyIndex) => {
                const replyVarId = normalizeAuthorId(replyRecord.varId);
                const replyIdentityOverrides: PostIdentityOverrides =
                  normalizedCurrentUserVarId &&
                  replyVarId === normalizedCurrentUserVarId
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
              },
            );

            return {
              ...mappedPost,
              replies: replyItems.length,
              replyItems,
            };
          });
        setPosts((currentPosts) => {
          const syncedSourceIds = new Set(
            syncedPosts
              .map((post) => post.sourceId?.trim())
              .filter((value): value is string => Boolean(value)),
          );
          const pendingLocalPosts = currentPosts.filter((post) => {
            const sourceId = post.sourceId?.trim();

            return Boolean(sourceId && !syncedSourceIds.has(sourceId));
          });
          const seededPosts = INITIAL_POSTS.filter(
            (seedPost) =>
              !syncedPosts.some(
                (syncedPost) =>
                  syncedPost.sourceId &&
                  seedPost.sourceId &&
                  syncedPost.sourceId === seedPost.sourceId,
              ) &&
              !pendingLocalPosts.some(
                (localPost) => localPost.id === seedPost.id,
              ),
          );

          return [...syncedPosts, ...pendingLocalPosts, ...seededPosts];
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setNotice(
          error instanceof Error
            ? `تعذر تحميل Posts من Appwrite: ${error.message}`
            : "تعذر تحميل Posts من Appwrite.",
        );
      }
    };

    void syncPostsFromAppwrite();

    return () => {
      isActive = false;
    };
  }, [
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
    setPosts,
    setNotice,
  ]);
}

export async function publishAppwritePost(options: {
  postTitle: string;
  postContent: string;
  postAuthorId: string;
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
    appwriteUser,
    profile,
    onPublished,
    setIsPublishingPost,
    setNotice,
    onClose,
    trackVarInteraction,
  } = options;

  const trimmedTitle = postTitle.trim() || POST_COMPOSER_DEFAULT_TITLE;
  const trimmedContent = postContent.trim();
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
    const createdPost = await createAppwritePost({
      title: trimmedTitle,
      content: trimmedContent,
      varId: appwriteUser.varId.trim(),
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
    setNotice("تم نشر المنشور على X وحفظه في Appwrite.");
  } catch (error) {
    setNotice(
      error instanceof Error
        ? `فشل نشر المنشور: ${error.message}`
        : "فشل نشر المنشور في Appwrite.",
    );
  } finally {
    setIsPublishingPost(false);
  }
}
