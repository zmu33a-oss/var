import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "../pages-css/TikTokPage.module.css";
import {
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Scan,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { VerificationBadgeVariant } from "../lib/adminApi";
import VerificationBadge from "./VerificationBadge";

type TikTokVideoCardProps = {
  videoId: number;
  video_url: string;
  caption: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl: string | null;
  creatorAvatarFrameEnabled?: boolean;
  creatorVerificationBadge?: VerificationBadgeVariant | null;
  isActive: boolean;
  shouldLoad?: boolean;
  onVideoError?: () => void;
  onAddVideo?: () => void;
  onReport?: () => void;
};

const DOCK_TOP_STORAGE_KEY = "webplus:tiktok-dock-top";
const DOCK_TOP_SYNC_EVENT = "webplus:tiktok-dock-top-change";
const DEFAULT_DOCK_TOP_PERCENT = 34;
const DOCK_EDGE_PADDING_PX = 14;

function clampDockTopPercent(value: number) {
  return Math.min(86, Math.max(14, value));
}

function readStoredDockTopPercent() {
  if (typeof window === "undefined") return DEFAULT_DOCK_TOP_PERCENT;

  const rawValue = window.localStorage.getItem(DOCK_TOP_STORAGE_KEY);
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_DOCK_TOP_PERCENT;
  }

  return clampDockTopPercent(parsedValue);
}

export default function TikTokVideoCard({
  videoId,
  video_url,
  caption,
  creatorName,
  creatorHandle,
  creatorAvatarUrl,
  creatorAvatarFrameEnabled = false,
  creatorVerificationBadge = null,
  isActive,
  shouldLoad = true,
  onVideoError,
  onAddVideo,
  onReport,
}: TikTokVideoCardProps) {
  const [videoError, setVideoError] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dockTopPercent, setDockTopPercent] = useState(() =>
    readStoredDockTopPercent(),
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dockWrapRef = useRef<HTMLDivElement | null>(null);
  const dockDragRef = useRef<{
    pointerId: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safeCreatorName = creatorName?.trim() || "Xtik";
  const safeCreatorHandle = creatorHandle?.trim() || "@xtik";
  const creatorInitial = safeCreatorName.charAt(0).toUpperCase() || "X";

  const updateDockTopPercent = (nextValue: number) => {
    const clampedValue = clampDockTopPercent(nextValue);
    setDockTopPercent(clampedValue);

    if (typeof window === "undefined") return;

    window.localStorage.setItem(DOCK_TOP_STORAGE_KEY, String(clampedValue));
    window.dispatchEvent(
      new CustomEvent(DOCK_TOP_SYNC_EVENT, {
        detail: clampedValue,
      }),
    );
  };

  const updateDockPositionFromClientY = (clientY: number) => {
    const cardElement = cardRef.current;
    const dockWrapElement = dockWrapRef.current;
    if (!cardElement) return;

    const cardRect = cardElement.getBoundingClientRect();
    const dockRect = dockWrapElement?.getBoundingClientRect();
    const dockHeight = dockRect?.height ?? 286;

    if (cardRect.height <= 0) return;

    const minCenter = dockHeight / 2 + DOCK_EDGE_PADDING_PX;
    const maxCenter = cardRect.height - dockHeight / 2 - DOCK_EDGE_PADDING_PX;
    const nextCenter = Math.min(
      maxCenter,
      Math.max(minCenter, clientY - cardRect.top),
    );

    updateDockTopPercent((nextCenter / cardRect.height) * 100);
  };

  const handleVideoLoadError = (videoElement: HTMLVideoElement) => {
    const mediaError = videoElement.error;

    // Navigation, unmounts, and source swaps can abort the request even when
    // the video URL itself is valid. Do not mark those videos as broken.
    if (!mediaError || mediaError.code === 1) {
      setVideoError("");
      return;
    }

    setVideoError("حدث خطأ أثناء تحميل الفيديو أو أن الصيغة غير مدعومة.");
    onVideoError?.();
    console.log("video error:", mediaError);
    console.log("video src:", video_url);
  };

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
    if (typeof window === "undefined") return;

    const handleDockTopSync = (event: Event) => {
      const nextValue = Number((event as CustomEvent<number>).detail);
      if (!Number.isFinite(nextValue)) return;
      setDockTopPercent(clampDockTopPercent(nextValue));
    };

    window.addEventListener(DOCK_TOP_SYNC_EVENT, handleDockTopSync);
    return () => {
      window.removeEventListener(DOCK_TOP_SYNC_EVENT, handleDockTopSync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dockDragRef.current;
      if (!dragState) return;

      if (!dragState.moved && Math.abs(event.clientY - dragState.startY) < 6) {
        return;
      }

      dragState.moved = true;
      updateDockPositionFromClientY(event.clientY);
    };

    const handlePointerFinish = () => {
      const dragState = dockDragRef.current;
      if (!dragState) return;

      if (!dragState.moved) {
        setIsDockOpen((prev) => !prev);
      }

      dockDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerFinish);
    window.addEventListener("pointercancel", handlePointerFinish);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerFinish);
      window.removeEventListener("pointercancel", handlePointerFinish);
    };
  }, [updateDockPositionFromClientY]);

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

  const handleDockPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dockDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      moved: false,
    };
  };

  return (
    <div ref={cardRef} className={styles.videoCard}>
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
        onAbort={() => {
          setVideoError("");
        }}
        onError={(e) => {
          handleVideoLoadError(e.currentTarget);
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
        ref={dockWrapRef}
        className={`${styles.leftDockWrap} ${isDockOpen ? styles.leftDockWrapOpen : ""}`}
        style={{ top: `${dockTopPercent}%` }}
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
            <Heart size={18} />
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
            className={styles.dockActionBtn}
            onClick={onReport}
            aria-label={`تبليغ على الفيديو ${videoId}`}
          >
            <Flag size={18} />
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
          onPointerDown={handleDockPointerDown}
          aria-label={isDockOpen ? "إخفاء الأدوات" : "إظهار الأدوات"}
        >
          <span className={styles.dockTongueLabel}>PULL</span>
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
              <div className={styles.creatorHeading}>
                <h3>{safeCreatorHandle}</h3>
                {creatorVerificationBadge && (
                  <VerificationBadge
                    size="sm"
                    variant={creatorVerificationBadge}
                  />
                )}
              </div>
              <span className={styles.creatorName}>{safeCreatorName}</span>
            </div>
          </div>
          {caption && <p>{caption}</p>}
        </div>
      </div>
    </div>
  );
}
