import { useEffect, useRef, useState } from "react";
import styles from "../pages-css/TikTokPage.module.css";

type TikTokVideoCardProps = {
  video_url: string;
  caption: string;
  isActive: boolean;
};

export default function TikTokVideoCard({
  video_url,
  isActive,
}: TikTokVideoCardProps) {
  const [videoError, setVideoError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = true;
      video.currentTime = 0;
      video.play().catch((err) => {
        setVideoError("تعذر تشغيل الفيديو تلقائيا.");
        console.log("play error:", err);
      });
      return;
    }

    video.pause();
  }, [isActive, video_url]);

  return (
    <div className={styles.videoCard}>
      <video
        ref={videoRef}
        src={video_url}
        loop
        muted
        playsInline
        autoPlay
        controls
        preload="metadata"
        className={styles.video}
        onLoadedData={(e) => {
          e.currentTarget.muted = true;
          e.currentTarget.play().catch((err) => {
            setVideoError("تعذر تشغيل الفيديو تلقائياً.");
            console.log("play error:", err);
          });
        }}
        onError={(e) => {
          setVideoError("حدث خطأ أثناء تحميل الفيديو أو أن الصيغة غير مدعومة.");
          console.log("video error:", e.currentTarget.error);
          console.log("video src:", video_url);
        }}
      />
      {videoError && <div className={styles.videoError}>{videoError}</div>}
      <div className={styles.overlay}>
        <div className={styles.text}>
          <h3>@SportPlus</h3>
        </div>
      </div>
    </div>
  );
}
