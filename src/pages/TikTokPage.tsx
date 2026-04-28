import { useEffect, useRef, useState } from "react";
import TikTokVideoCard from "../components/TikTokVideoCard";
import styles from "../pages-css/TikTokPage.module.css";
import { useAuth } from "../lib/AuthContext";
import { createAdminReport } from "../lib/adminStore";
import {
  addTikTokVideoComment,
  createTikTokVideoInDatabase,
  deleteTikTokVideoFromDatabase,
  fetchTikTokVideosFromDatabase,
  recordTikTokVideoShare,
  toggleTikTokVideoLike,
  toggleTikTokVideoSave,
  type TikTokComment,
  type TikTokVideo,
} from "../lib/tiktokTables";
import { buildXHandle } from "../lib/xPosts";
import { useVerificationRegistry } from "../lib/verification";
import { supabase } from "./supabase";

type VideoItem = TikTokVideo;

const TIKTOK_VIDEOS_CACHE_KEY = "webplus:tiktok-videos";
const FETCH_VIDEOS_TIMEOUT_MS = 10000;

function isTikTokComment(value: unknown): value is TikTokComment {
  if (!value || typeof value !== "object") return false;

  const comment = value as Partial<TikTokComment>;
  return (
    typeof comment.id === "number" &&
    typeof comment.userId === "string" &&
    typeof comment.authorName === "string" &&
    typeof comment.authorHandle === "string" &&
    typeof comment.body === "string" &&
    typeof comment.createdAt === "string"
  );
}

function isVideoItem(value: unknown): value is Partial<VideoItem> & {
  id: number;
  video_url: string;
  caption: string;
} {
  if (!value || typeof value !== "object") return false;

  const video = value as Partial<VideoItem>;
  return (
    typeof video.id === "number" &&
    typeof video.video_url === "string" &&
    typeof video.caption === "string"
  );
}

function normalizeVideoItem(
  video: Partial<VideoItem> & {
    id: number;
    video_url: string;
    caption: string;
  },
): VideoItem {
  return {
    id: video.id,
    video_url: video.video_url,
    caption: video.caption,
    user_id: typeof video.user_id === "string" ? video.user_id : null,
    creator_name:
      typeof video.creator_name === "string" ? video.creator_name : null,
    creator_handle:
      typeof video.creator_handle === "string" ? video.creator_handle : null,
    creator_avatar_url:
      typeof video.creator_avatar_url === "string"
        ? video.creator_avatar_url
        : null,
    creator_avatar_frame_enabled: Boolean(video.creator_avatar_frame_enabled),
    created_at: typeof video.created_at === "string" ? video.created_at : null,
    likedByMe: Boolean(video.likedByMe),
    savedByMe: Boolean(video.savedByMe),
    sharedByMe: Boolean(video.sharedByMe),
    comments: Array.isArray(video.comments)
      ? video.comments.filter(isTikTokComment)
      : [],
    stats: {
      likes:
        typeof video.stats?.likes === "number"
          ? Math.max(0, video.stats.likes)
          : 0,
      comments:
        typeof video.stats?.comments === "number"
          ? Math.max(0, video.stats.comments)
          : 0,
      saves:
        typeof video.stats?.saves === "number"
          ? Math.max(0, video.stats.saves)
          : 0,
      shares:
        typeof video.stats?.shares === "number"
          ? Math.max(0, video.stats.shares)
          : 0,
    },
  };
}

function mergeTikTokComments(
  remoteComments: TikTokComment[],
  localComments: TikTokComment[],
) {
  const commentsByKey = new Map<string, TikTokComment>();

  [...localComments, ...remoteComments].forEach((comment) => {
    const commentKey = `${comment.id}:${comment.userId}:${comment.createdAt}`;

    if (!commentsByKey.has(commentKey)) {
      commentsByKey.set(commentKey, comment);
    }
  });

  return [...commentsByKey.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function mergeVideoCollections(
  remoteVideos: VideoItem[],
  localVideos: VideoItem[],
) {
  const localVideosById = new Map(
    localVideos.map((video) => [video.id, video]),
  );
  const mergedVideos = remoteVideos.map((remoteVideo) => {
    const localVideo = localVideosById.get(remoteVideo.id);

    if (!localVideo) {
      return remoteVideo;
    }

    const mergedComments = mergeTikTokComments(
      remoteVideo.comments,
      localVideo.comments,
    );

    return normalizeVideoItem({
      ...localVideo,
      ...remoteVideo,
      likedByMe: remoteVideo.likedByMe || localVideo.likedByMe,
      savedByMe: remoteVideo.savedByMe || localVideo.savedByMe,
      sharedByMe: remoteVideo.sharedByMe || localVideo.sharedByMe,
      comments: mergedComments,
      stats: {
        likes: Math.max(remoteVideo.stats.likes, localVideo.stats.likes),
        comments: Math.max(
          remoteVideo.stats.comments,
          localVideo.stats.comments,
          mergedComments.length,
        ),
        saves: Math.max(remoteVideo.stats.saves, localVideo.stats.saves),
        shares: Math.max(remoteVideo.stats.shares, localVideo.stats.shares),
      },
    });
  });

  const remoteVideoIds = new Set(remoteVideos.map((video) => video.id));
  const localOnlyVideos = localVideos.filter(
    (video) => !remoteVideoIds.has(video.id),
  );

  return [...mergedVideos, ...localOnlyVideos];
}

function loadCachedVideos(): VideoItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(TIKTOK_VIDEOS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isVideoItem).map((video) => normalizeVideoItem(video))
      : [];
  } catch {
    return [];
  }
}

function saveCachedVideos(videos: VideoItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      TIKTOK_VIDEOS_CACHE_KEY,
      JSON.stringify(videos),
    );
  } catch {
    // Ignore cache write failures.
  }
}

const normalizeVideoUrl = (rawUrl: string) => {
  const cleaned = rawUrl.trim().replace(/^[^a-zA-Z]+/, "");
  if (!cleaned) return "";

  const withScheme = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : cleaned.startsWith("//")
      ? `https:${cleaned}`
      : `https://${cleaned}`;

  try {
    const parsed = new URL(withScheme);
    if (!parsed.hostname.includes(".")) return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

type TikTokPageProps = {
  cameraRequestKey?: number;
};

export default function TikTokPage({ cameraRequestKey = 0 }: TikTokPageProps) {
  const { profile, user } = useAuth();
  const { getVerification } = useVerificationRegistry();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastHandledCameraRequestKey = useRef(cameraRequestKey);
  const [videos, setVideos] = useState<VideoItem[]>(() => loadCachedVideos());
  const [loading, setLoading] = useState(() => loadCachedVideos().length === 0);
  const [loadError, setLoadError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenVideoIds, setBrokenVideoIds] = useState<number[]>([]);
  const [commentSheetVideoId, setCommentSheetVideoId] = useState<number | null>(
    null,
  );
  const [commentDraft, setCommentDraft] = useState("");
  const fetchRequestIdRef = useRef(0);
  const videosRef = useRef(videos);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const rawEmail = profile?.email ?? user?.email ?? "";
  const displayName =
    profile?.full_name?.trim() ??
    user?.user_metadata?.full_name?.trim() ??
    user?.user_metadata?.name?.trim() ??
    rawEmail.split("@")[0]?.trim() ??
    "Xtik";
  const handle = profile?.username?.trim()
    ? profile.username.trim().startsWith("@")
      ? profile.username.trim()
      : `@${profile.username.trim()}`
    : buildXHandle(displayName);
  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const avatarFrameEnabled = Boolean(
    profile?.avatar_frame_enabled ?? user?.user_metadata?.avatar_frame_enabled,
  );

  const visibleVideos = videos
    .map((vid) => ({
      ...vid,
      video_url: normalizeVideoUrl(vid.video_url || ""),
    }))
    .filter((vid) => Boolean(vid.video_url))
    .filter((vid) => !brokenVideoIds.includes(vid.id));

  const hasPlayableVideos = visibleVideos.length > 0;
  const activeCommentVideo =
    commentSheetVideoId === null
      ? null
      : (videos.find((video) => video.id === commentSheetVideoId) ?? null);
  const activeCommentVideoUrl = activeCommentVideo
    ? normalizeVideoUrl(activeCommentVideo.video_url || "")
    : "";
  const activeCommentCreatorName = activeCommentVideo
    ? activeCommentVideo.creator_name?.trim() ||
      (user?.id && activeCommentVideo.user_id === user.id
        ? displayName
        : "Xtik")
    : "Xtik";
  const activeCommentCreatorHandle = activeCommentVideo
    ? activeCommentVideo.creator_handle?.trim() ||
      (user?.id && activeCommentVideo.user_id === user.id ? handle : "@xtik")
    : "@xtik";
  const statusMessage = loadError
    ? loadError
    : videos.length > 0
      ? "تعذر تشغيل الفيديوهات الحالية"
      : "لا يوجد فيديوهات حالياً";

  const fetchVideos = async () => {
    const requestId = ++fetchRequestIdRef.current;
    const fallbackVideos = videosRef.current;
    const hasExistingVideos = fallbackVideos.length > 0;
    const cachedVideos = hasExistingVideos
      ? fallbackVideos
      : loadCachedVideos();

    if (!hasExistingVideos) {
      setLoading(true);
    }
    setLoadError("");

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error("FETCH_VIDEOS_TIMEOUT"));
        }, FETCH_VIDEOS_TIMEOUT_MS);
      });

      const nextVideos = (await Promise.race([
        fetchTikTokVideosFromDatabase(user?.id),
        timeoutPromise,
      ])) as VideoItem[];

      if (requestId !== fetchRequestIdRef.current) return;

      const normalizedVideos = nextVideos.map((video) =>
        normalizeVideoItem(video),
      );
      const mergedVideos = mergeVideoCollections(
        normalizedVideos,
        cachedVideos,
      );

      setVideos(mergedVideos);
      saveCachedVideos(mergedVideos);
      setBrokenVideoIds([]);
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) return;

      console.log("فشل جلب فيديوهات تيك توك:", error);

      if (cachedVideos.length > 0) {
        setVideos(cachedVideos);
        saveCachedVideos(cachedVideos);
        return;
      }

      setLoadError("تعذر تحميل الفيديوهات الآن");
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchVideos();
  }, [user?.id]);

  useEffect(() => {
    if (!loading) return;

    const timeoutId = window.setTimeout(() => {
      setLoadError("تعذر تحميل الفيديوهات الآن");
      setLoading(false);
    }, FETCH_VIDEOS_TIMEOUT_MS + 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loading]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (visibleVideos.length === 0) return 0;
      return Math.min(current, visibleVideos.length - 1);
    });
  }, [visibleVideos.length]);

  useEffect(() => {
    if (
      commentSheetVideoId !== null &&
      !videos.some((video) => video.id === commentSheetVideoId)
    ) {
      setCommentSheetVideoId(null);
      setCommentDraft("");
    }
  }, [commentSheetVideoId, videos]);

  const updateVideoLocally = (
    videoId: number,
    updater: (video: VideoItem) => VideoItem,
  ) => {
    setVideos((currentVideos) => {
      const nextVideos = currentVideos.map((video) =>
        video.id === videoId ? normalizeVideoItem(updater(video)) : video,
      );

      saveCachedVideos(nextVideos);
      return nextVideos;
    });
  };

  const restoreVideosFromDatabase = async (message?: string) => {
    await fetchVideos();
    if (message) {
      window.alert(message);
    }
  };

  const handleVideoError = (videoId: number) => {
    setBrokenVideoIds((prev) =>
      prev.includes(videoId) ? prev : [...prev, videoId],
    );
  };

  const handleOpenFiles = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (cameraRequestKey === lastHandledCameraRequestKey.current) {
      return;
    }

    lastHandledCameraRequestKey.current = cameraRequestKey;
    handleOpenFiles();
  }, [cameraRequestKey]);

  const handleReportVideo = async (video: VideoItem) => {
    try {
      await createAdminReport({
        targetType: "video",
        targetId: String(video.id),
        source: "tiktok",
        summary: video.caption || `Video #${video.id}`,
        reason: "بلاغ من واجهة TikTok",
        reporterLabel: handle,
      });
      window.alert("تم إرسال البلاغ على الفيديو");
    } catch {
      window.alert("تعذر إرسال البلاغ الآن");
    }
  };

  const handleDeleteVideo = async (video: VideoItem) => {
    if (!user?.id) {
      window.alert("يجب تسجيل الدخول لحذف الفيديو");
      return;
    }

    if (video.user_id !== user.id) {
      window.alert("يمكنك حذف فيديوهاتك فقط");
      return;
    }

    const confirmed = window.confirm("هل تريد حذف هذا الفيديو نهائيا؟");
    if (!confirmed) {
      return;
    }

    const previousVideos = videos;
    const previousBrokenVideoIds = brokenVideoIds;

    setVideos((currentVideos) => {
      const nextVideos = currentVideos.filter(
        (currentVideo) => currentVideo.id !== video.id,
      );
      saveCachedVideos(nextVideos);
      return nextVideos;
    });
    setBrokenVideoIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== video.id),
    );

    try {
      await deleteTikTokVideoFromDatabase(video.id, user.id);
    } catch {
      setVideos(previousVideos);
      setBrokenVideoIds(previousBrokenVideoIds);
      saveCachedVideos(previousVideos);
      window.alert("تعذر حذف الفيديو الآن");
      return;
    }

    window.alert("تم حذف الفيديو");
  };

  const handleToggleLike = (video: VideoItem) => {
    if (!user?.id) {
      window.alert("يجب تسجيل الدخول لتنفيذ الإعجاب");
      return;
    }

    const nextLiked = !video.likedByMe;

    updateVideoLocally(video.id, (currentVideo) => ({
      ...currentVideo,
      likedByMe: nextLiked,
      stats: {
        ...currentVideo.stats,
        likes: Math.max(0, currentVideo.stats.likes + (nextLiked ? 1 : -1)),
      },
    }));

    void toggleTikTokVideoLike(video.id, user.id, nextLiked)
      .then(() => fetchVideos())
      .catch(() =>
        restoreVideosFromDatabase(
          "تعذر مزامنة الإعجاب الآن، وسيبقى محليًا مؤقتًا",
        ),
      );
  };

  const handleToggleSave = (video: VideoItem) => {
    if (!user?.id) {
      window.alert("يجب تسجيل الدخول لحفظ الفيديو");
      return;
    }

    const nextSaved = !video.savedByMe;

    updateVideoLocally(video.id, (currentVideo) => ({
      ...currentVideo,
      savedByMe: nextSaved,
      stats: {
        ...currentVideo.stats,
        saves: Math.max(0, currentVideo.stats.saves + (nextSaved ? 1 : -1)),
      },
    }));

    void toggleTikTokVideoSave(video.id, user.id, nextSaved)
      .then(() => fetchVideos())
      .catch(() =>
        restoreVideosFromDatabase(
          "تعذر مزامنة الحفظ الآن، وسيبقى محليًا مؤقتًا",
        ),
      );
  };

  const handleCommentVideo = (video: VideoItem) => {
    if (!user?.id) {
      window.alert("يجب تسجيل الدخول لكتابة تعليق");
      return;
    }

    setCommentSheetVideoId(video.id);
    setCommentDraft("");
  };

  const submitCommentForVideo = async () => {
    if (!activeCommentVideo || !user?.id) {
      return;
    }

    const nextComment = commentDraft.trim();

    if (!nextComment) {
      return;
    }

    const optimisticComment: TikTokComment = {
      id: Date.now(),
      userId: user.id,
      authorName: displayName,
      authorHandle: handle,
      body: nextComment,
      createdAt: new Date().toISOString(),
    };

    updateVideoLocally(activeCommentVideo.id, (currentVideo) => ({
      ...currentVideo,
      comments: [...currentVideo.comments, optimisticComment],
      stats: {
        ...currentVideo.stats,
        comments: currentVideo.stats.comments + 1,
      },
    }));

    setCommentDraft("");

    void addTikTokVideoComment({
      videoId: activeCommentVideo.id,
      userId: user.id,
      authorName: displayName,
      authorHandle: handle,
      body: nextComment,
    })
      .then(() => fetchVideos())
      .catch(() =>
        restoreVideosFromDatabase(
          "تعذر مزامنة التعليق الآن، وسيبقى محليًا مؤقتًا",
        ),
      );
  };

  const handleShareVideo = async (video: VideoItem) => {
    let shareMode: "system" | "copy-link" | "other" = "other";

    try {
      if (navigator.share) {
        await navigator.share({
          title: video.caption || "Xtik",
          text: "شاهد هذا الفيديو على Xtik",
          url: video.video_url || window.location.href,
        });
        shareMode = "system";
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          video.video_url || window.location.href,
        );
        shareMode = "copy-link";
        window.alert("تم نسخ رابط الفيديو");
      } else {
        return;
      }
    } catch {
      return;
    }

    if (!user?.id || video.sharedByMe) {
      return;
    }

    updateVideoLocally(video.id, (currentVideo) => ({
      ...currentVideo,
      sharedByMe: true,
      stats: {
        ...currentVideo.stats,
        shares: currentVideo.stats.shares + 1,
      },
    }));

    void recordTikTokVideoShare(video.id, user.id, shareMode)
      .then(() => fetchVideos())
      .catch(() =>
        restoreVideosFromDatabase(
          "تعذر مزامنة المشاركة الآن، وستبقى محليًا مؤقتًا",
        ),
      );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      window.alert("يجب تسجيل الدخول لرفع فيديو جديد");
      e.target.value = "";
      return;
    }

    console.log("1- تم اختيار الملف:", file.name);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      });

    if (uploadError) {
      console.log("2- خطأ الرفع كامل:", JSON.stringify(uploadError, null, 2));
      window.alert(uploadError.message);
      return;
    }

    console.log("3- تم رفع الفيديو إلى Storage");

    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    try {
      await createTikTokVideoInDatabase({
        userId: user.id,
        videoUrl: publicUrl,
        caption: "",
        creatorName: displayName,
        creatorHandle: handle,
        creatorAvatarUrl: avatarUrl,
        creatorAvatarFrameEnabled: avatarFrameEnabled,
      });
    } catch (insertError) {
      console.log("4- خطأ حفظ الجدول:", insertError);
      window.alert("تم رفع الفيديو لكن فشل حفظه في الجدول");
      return;
    }

    console.log("5- تم رفع الفيديو وحفظه");
    window.alert("تم رفع الفيديو بنجاح");

    await fetchVideos();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onScroll={(e) => {
        const target = e.currentTarget;
        const height = target.clientHeight || 1;
        const index = Math.round(target.scrollTop / height);
        if (index !== activeIndex) {
          setActiveIndex(index);
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {loading ? (
        <div className={styles.statusState}>
          <span className={styles.statusSpinner} />
          <p className={styles.statusMessage}>جاري تحميل الفيديوهات...</p>
        </div>
      ) : loadError ? (
        <div className={styles.statusState}>
          <p className={styles.statusMessage}>{loadError}</p>
          <button
            type="button"
            className={styles.statusRetryBtn}
            onClick={() => {
              void fetchVideos();
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : !hasPlayableVideos ? (
        <div className={styles.statusState}>
          <p className={styles.statusMessage}>{statusMessage}</p>
          <button
            type="button"
            className={styles.statusRetryBtn}
            onClick={() => {
              setBrokenVideoIds([]);
              void fetchVideos();
            }}
          >
            تحديث الصفحة
          </button>
        </div>
      ) : (
        visibleVideos.map((vid, index) => {
          const isCurrentUsersVideo = Boolean(
            user?.id && vid.user_id === user.id,
          );

          return (
            <TikTokVideoCard
              key={vid.id}
              videoId={vid.id}
              video_url={vid.video_url}
              caption={vid.caption}
              creatorName={
                vid.creator_name?.trim() ||
                (isCurrentUsersVideo ? displayName : "Xtik")
              }
              creatorHandle={
                vid.creator_handle?.trim() ||
                (isCurrentUsersVideo ? handle : "@xtik")
              }
              creatorAvatarUrl={
                vid.creator_avatar_url ??
                (isCurrentUsersVideo ? avatarUrl : null)
              }
              creatorAvatarFrameEnabled={
                vid.creator_avatar_frame_enabled ||
                (isCurrentUsersVideo ? avatarFrameEnabled : false)
              }
              creatorVerificationBadge={
                getVerification(vid.user_id)?.badge ?? null
              }
              stats={vid.stats}
              likedByMe={vid.likedByMe}
              savedByMe={vid.savedByMe}
              sharedByMe={vid.sharedByMe}
              isActive={index === activeIndex}
              shouldLoad={Math.abs(index - activeIndex) <= 1}
              onVideoError={() => handleVideoError(vid.id)}
              onToggleLike={() => handleToggleLike(vid)}
              onToggleSave={() => handleToggleSave(vid)}
              onComment={() => handleCommentVideo(vid)}
              onShare={() => void handleShareVideo(vid)}
              onReport={() => void handleReportVideo(vid)}
              onDeleteVideo={() => void handleDeleteVideo(vid)}
              isOwnVideo={isCurrentUsersVideo}
            />
          );
        })
      )}

      {activeCommentVideo && (
        <div
          className={styles.commentSheetBackdrop}
          onClick={() => {
            setCommentSheetVideoId(null);
            setCommentDraft("");
          }}
        >
          <section
            className={styles.commentSheet}
            dir="rtl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className={styles.commentSheetPreview}>
              {activeCommentVideoUrl ? (
                <video
                  className={styles.commentSheetPreviewVideo}
                  src={activeCommentVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className={styles.commentSheetPreviewFallback}>
                  الفيديو غير متاح للمعاينة الآن
                </div>
              )}

              <div className={styles.commentSheetPreviewScrim} />

              <button
                type="button"
                className={styles.commentSheetClose}
                onClick={() => {
                  setCommentSheetVideoId(null);
                  setCommentDraft("");
                }}
              >
                إغلاق
              </button>

              <div className={styles.commentSheetPreviewMeta}>
                <strong className={styles.commentSheetPreviewHandle}>
                  {activeCommentCreatorHandle}
                </strong>
                <span className={styles.commentSheetPreviewName}>
                  {activeCommentCreatorName}
                </span>
                {activeCommentVideo.caption ? (
                  <p className={styles.commentSheetPreviewCaption}>
                    {activeCommentVideo.caption}
                  </p>
                ) : null}
              </div>
            </div>

            <div className={styles.commentSheetBody}>
              <header className={styles.commentSheetHeader}>
                <strong className={styles.commentSheetTitle}>التعليقات</strong>
                <p className={styles.commentSheetSubtitle}>
                  {activeCommentVideo.comments.length > 0
                    ? `${activeCommentVideo.comments.length} تعليق`
                    : "لا توجد تعليقات بعد"}
                </p>
              </header>

              <div className={styles.commentSheetList}>
                {activeCommentVideo.comments.length > 0 ? (
                  [...activeCommentVideo.comments].reverse().map((comment) => (
                    <article
                      key={`${comment.id}-${comment.createdAt}`}
                      className={styles.commentSheetItem}
                    >
                      <div className={styles.commentSheetAuthorRow}>
                        <strong className={styles.commentSheetAuthor}>
                          {comment.authorHandle}
                        </strong>
                        <span className={styles.commentSheetTime}>
                          {new Date(comment.createdAt).toLocaleDateString(
                            "ar-SA",
                          )}
                        </span>
                      </div>
                      <p className={styles.commentSheetBodyText}>
                        {comment.body}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className={styles.commentSheetEmpty}>
                    كن أول من يكتب تعليقًا على هذا الفيديو.
                  </p>
                )}
              </div>

              <form
                className={styles.commentComposer}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitCommentForVideo();
                }}
              >
                <input
                  type="text"
                  className={styles.commentInput}
                  placeholder="اكتب تعليقك هنا"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />
                <button
                  type="submit"
                  className={styles.commentSubmit}
                  disabled={!commentDraft.trim()}
                >
                  إرسال
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
