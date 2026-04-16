import styles from "../pages-css/TikTokPage.module.css";
import video from "../assets/vedtik.mp4";

const TikTokPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.videoCard}>
        <video
          loop
          muted
          autoPlay
          playsInline
          className={styles.video}
        >
          <source src={video} type="video/mp4" />
        </video>

        <div className={styles.overlay}>
          <div className={styles.text}>
            <h3>@SportPlus</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokPage;