import { useEffect, useRef, useState } from "react";
import TikTokVideoCard from "../components/TikTokVideoCard";
import styles from "../pages-css/TikTokPage.module.css";
import { useAuth } from "../lib/AuthContext";
import { buildXHandle } from "../lib/xPosts";
import { supabase } from "./supabase";

type VideoItem = {
  id: number;
  video_url: string;
  caption: string;
};

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenVideoIds, setBrokenVideoIds] = useState<number[]>([]);

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

  const fetchVideos = async () => {
    setLoading(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("خطأ جلب الفيديوهات:", error);
      setLoadError("تعذر تحميل الفيديوهات الآن");
      setLoading(false);
      return;
    }

    setVideos(data || []);
    setBrokenVideoIds([]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchVideos();
  }, []);

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
      ) : visibleVideos.length === 0 ? (
        <div className={styles.statusState}>
          <p className={styles.statusMessage}>لا يوجد فيديوهات حالياً</p>
        </div>
      ) : (
        visibleVideos.map((vid, index) => (
          <TikTokVideoCard
            key={vid.id}
            video_url={vid.video_url}
            caption={vid.caption}
            creatorName={displayName}
            creatorHandle={handle}
            creatorAvatarUrl={avatarUrl}
            creatorAvatarFrameEnabled={avatarFrameEnabled}
            isActive={index === activeIndex}
            shouldLoad={Math.abs(index - activeIndex) <= 1}
            onVideoError={() => handleVideoError(vid.id)}
            onAddVideo={handleOpenFiles}
          />
        ))
      )}
    </div>
  );
}
