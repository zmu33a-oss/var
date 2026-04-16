import styles from "../pages-css/XPage.module.css";

export default function XPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.switch}>
          X Feed
        </button>
        <h2>Home</h2>
      </div>

      <p className={styles.postText}>
        ملخص سريع للنقاشات الرياضية والتفاعل الجماهيري داخل وضع X.
      </p>

      <div className={styles.postCard}></div>

      <div className={styles.actions}>
        <span>💬 24</span>
        <span>🔁 11</span>
        <span>❤️ 98</span>
        <span>📊 4.2K</span>
      </div>
    </div>
  );
}
