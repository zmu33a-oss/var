import { useEffect, useRef, useState } from "react";
import styles from "../pages-css/TikTokPage.module.css";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Send,
  Scan,
  Volume2,
  VolumeX,
} from "lucide-react";

type TikTokVideoCardProps = {
  video_url: string;
  caption: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl: string | null;
  creatorAvatarFrameEnabled?: boolean;
  isActive: boolean;
  shouldLoad?: boolean;
  onVideoError?: () => void;
  onAddVideo?: () => void;
};

export default function TikTokVideoCard({
  video_url,
  caption,
  creatorName,
  creatorHandle,
  creatorAvatarUrl,
  creatorAvatarFrameEnabled = false,
  isActive,
  shouldLoad = true,
  onVideoError,
  onAddVideo,
}: TikTokVideoCardProps) {
  const [videoError, setVideoError] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safeCreatorName = creatorName?.trim() || "Xtik";
  const safeCreatorHandle = creatorHandle?.trim() || "@xtik";
  const creatorInitial = safeCreatorName.charAt(0).toUpperCase() || "X";

  const playActiveVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = 1;

    try {
      await video.play();
      setIsPaused(false);
      setVideoError("");
    } catch {
      // If unmuted autoplay is blocked, fallback to muted autoplay.
      if (!video.muted) {
        video.muted = true;
        setIsMuted(true);
        await video.play().catch(() => {
          setVideoError("تعذر تشغيل الفيديو تلقائيا.");
        });
      } else {
        setVideoError("تعذر تشغيل الفيديو تلقائيا.");
      }
    }
  };

  useEffect(() => {
    setVideoError("");
  }, [video_url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!shouldLoad) {
      video.pause();
      setIsPaused(true);
      return;
    }

    if (isActive) {
      video.currentTime = 0;
      void playActiveVideo();
      return;
    }

    video.pause();
    setIsPaused(true);
    setIsDockOpen(false);
  }, [isActive, video_url, shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!isActive) return;
    const unlockAudio = () => {
      const video = videoRef.current;
      if (!video) return;
      if (!isMuted) {
        video.muted = false;
        video.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, [isActive, isMuted]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
      return;
    }

    video.pause();
    setIsPaused(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
    if (!next && video.paused && isActive) {
      video.play().catch(() => {});
      setIsPaused(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Xtik",
          text: "شاهد هذا الفيديو على Xtik",
          url: window.location.href,
        });
      }
    } catch {
      // Ignore abort/cancel from native share sheet
    }
  };

  const handleComment = () => {
    // Placeholder until comments backend is wired.
    alert("ميزة التعليقات جاهزة للتوصيل بالباكند");
  };

  const handleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement && video.requestFullscreen) {
      await video.requestFullscreen().catch(() => {});
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className={styles.videoCard}>
      <video
        ref={videoRef}
        src={shouldLoad ? video_url : undefined}
        loop
        muted={isMuted}
        playsInline
        autoPlay
        preload={shouldLoad ? "metadata" : "none"}
        className={styles.video}
        onLoadedData={() => {
          if (isActive) {
            void playActiveVideo();
          }
        }}
        onError={(e) => {
          setVideoError("حدث خطأ أثناء تحميل الفيديو أو أن الصيغة غير مدعومة.");
          onVideoError?.();
          console.log("video error:", e.currentTarget.error);
          console.log("video src:", video_url);
        }}
      />

      <button
        type="button"
        className={styles.muteBtn}
        onClick={toggleMute}
        aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <button
        type="button"
        className={styles.tapLayer}
        onClick={togglePlayPause}
        aria-label={isPaused ? "تشغيل الفيديو" : "إيقاف الفيديو"}
      />

      {isPaused && <div className={styles.pauseBadge}>Paused</div>}
      {videoError && <div className={styles.videoError}>{videoError}</div>}

      <div
        className={`${styles.leftDockWrap} ${isDockOpen ? styles.leftDockWrapOpen : ""}`}
      >
        <div className={styles.leftDockPanel}>
          <button
            type="button"
            className={styles.dockAddBtn}
            onClick={onAddVideo}
            aria-label="إضافة فيديو"
          >
            <Plus size={20} />
          </button>

          <button
            type="button"
            className={`${styles.dockActionBtn} ${liked ? styles.dockActionActive : ""}`}
            onClick={() => setLiked((prev) => !prev)}
            aria-label="إعجاب"
          >
            <Plus size={20} />
          </button>

          <button
            type="button"
            className={styles.dockActionBtn}
            onClick={handleComment}
            aria-label="تعليق"
          >
            <MessageCircle size={20} />
          </button>

          <button
            type="button"
            className={styles.dockActionBtn}
            onClick={handleShare}
            aria-label="مشاركة"
          >
            <Send size={20} />
          </button>

          <button
            type="button"
            className={`${styles.dockActionBtn} ${saved ? styles.dockActionActive : ""}`}
            onClick={() => setSaved((prev) => !prev)}
            aria-label="حفظ"
          >
            <Bookmark size={20} />
          </button>

          <button
            type="button"
            className={styles.dockActionBtn}
            onClick={handleFullscreen}
            aria-label="ملء الشاشة"
          >
            <Scan size={20} />
          </button>
        </div>

        <button
          type="button"
          className={styles.dockTongue}
          onClick={() => setIsDockOpen((prev) => !prev)}
          aria-label={isDockOpen ? "إخفاء الأدوات" : "إظهار الأدوات"}
        >
          {isDockOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className={styles.overlay}>
        <div className={styles.text}>
          <div className={styles.creatorRow}>
            <div className={styles.creatorAvatarWrap}>
              {creatorAvatarFrameEnabled && (
                <img
                  src="/profile-frame-rsl.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.creatorAvatarFrame}
                />
              )}
              <div className={styles.creatorAvatarFace}>
                {creatorAvatarUrl ? (
                  <img
                    src={creatorAvatarUrl}
                    alt={`${safeCreatorName} avatar`}
                    className={styles.creatorAvatarImg}
                  />
                ) : (
                  <div className={styles.creatorAvatarFallback}>
                    {creatorInitial}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.creatorMeta}>
              <h3>{safeCreatorHandle}</h3>
              <span className={styles.creatorName}>{safeCreatorName}</span>
            </div>
          </div>
          <div className={styles.transparentHeader}></div>
          {caption && <p>{caption}</p>}
        </div>
      </div>
    </div>
  );
}
