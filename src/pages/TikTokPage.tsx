import { useEffect, useRef, useState } from "react";
import TikTokVideoCard from "../components/TikTokVideoCard";
import styles from "../pages-css/TikTokPage.module.css";
import { useAuth } from "../lib/AuthContext";
import { createAdminReport } from "../lib/adminStore";
import { buildXHandle } from "../lib/xPosts";
import { useVerificationRegistry } from "../lib/verification";
import { supabase } from "./supabase";

type VideoItem = {
  id: number;
  video_url: string;
  caption: string;
};

const TIKTOK_VIDEOS_CACHE_KEY = "webplus:tiktok-videos";
const FETCH_VIDEOS_TIMEOUT_MS = 10000;

function isVideoItem(value: unknown): value is VideoItem {
  if (!value || typeof value !== "object") return false;

  const video = value as Partial<VideoItem>;
  return (
    typeof video.id === "number" &&
    typeof video.video_url === "string" &&
    typeof video.caption === "string"
  );
}

function loadCachedVideos(): VideoItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(TIKTOK_VIDEOS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isVideoItem) : [];
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

export default function TikTokPage() {
  const { profile, user } = useAuth();
  const { getVerification } = useVerificationRegistry();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>(() => loadCachedVideos());
  const [loading, setLoading] = useState(() => loadCachedVideos().length === 0);
  const [loadError, setLoadError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenVideoIds, setBrokenVideoIds] = useState<number[]>([]);
  const fetchRequestIdRef = useRef(0);

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
  const currentUserVerificationBadge = getVerification(user?.id)?.badge ?? null;

  const visibleVideos = videos
    .map((vid) => ({
      ...vid,
      video_url: normalizeVideoUrl(vid.video_url || ""),
    }))
    .filter((vid) => Boolean(vid.video_url))
    .filter((vid) => !brokenVideoIds.includes(vid.id));

  const hasPlayableVideos = visibleVideos.length > 0;
  const statusMessage = loadError
    ? loadError
    : videos.length > 0
      ? "تعذر تشغيل الفيديوهات الحالية"
      : "لا يوجد فيديوهات حالياً";

  const fetchVideos = async () => {
    const requestId = ++fetchRequestIdRef.current;
    const hasExistingVideos = videos.length > 0;

    if (!hasExistingVideos) {
      setLoading(true);
    }
    setLoadError("");

    try {
      const queryPromise = supabase
        .from("videos")
        .select("*")
        .order("id", { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error("FETCH_VIDEOS_TIMEOUT"));
        }, FETCH_VIDEOS_TIMEOUT_MS);
      });

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]);

      if (requestId !== fetchRequestIdRef.current) return;

      if (error) {
        console.log("خطأ جلب الفيديوهات:", error);
        setLoadError("تعذر تحميل الفيديوهات الآن");
        return;
      }

      const nextVideos = (data ?? []).filter(isVideoItem);
      setVideos(nextVideos);
      saveCachedVideos(nextVideos);
      setBrokenVideoIds([]);
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) return;

      console.log("فشل جلب فيديوهات تيك توك:", error);
      setLoadError("تعذر تحميل الفيديوهات الآن");
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchVideos();
  }, []);

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

  const handleVideoError = (videoId: number) => {
    setBrokenVideoIds((prev) =>
      prev.includes(videoId) ? prev : [...prev, videoId],
    );
  };

  const handleOpenFiles = () => {
    fileInputRef.current?.click();
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      alert(uploadError.message);
      return;
    }

    console.log("3- تم رفع الفيديو إلى Storage");

    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("videos").insert([
      {
        video_url: publicUrl,
        caption: "",
      },
    ]);

    if (insertError) {
      console.log("4- خطأ حفظ الجدول:", insertError);
      alert("تم رفع الفيديو لكن فشل حفظه في الجدول");
      return;
    }

    console.log("5- تم رفع الفيديو وحفظه");
    alert("تم رفع الفيديو بنجاح");

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
        visibleVideos.map((vid, index) => (
          <TikTokVideoCard
            key={vid.id}
            videoId={vid.id}
            video_url={vid.video_url}
            caption={vid.caption}
            creatorName={displayName}
            creatorHandle={handle}
            creatorAvatarUrl={avatarUrl}
            creatorAvatarFrameEnabled={avatarFrameEnabled}
            creatorVerificationBadge={currentUserVerificationBadge}
            isActive={index === activeIndex}
            shouldLoad={Math.abs(index - activeIndex) <= 1}
            onVideoError={() => handleVideoError(vid.id)}
            onAddVideo={handleOpenFiles}
            onReport={() => void handleReportVideo(vid)}
          />
        ))
      )}
    </div>
  );
}
