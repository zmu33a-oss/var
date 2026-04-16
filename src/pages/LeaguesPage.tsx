import styles from "../pages-css/LeaguesPage.module.css";
export default function LeagueCard() {
  return (
    
    <div className={styles["league-card-wrapper"]} dir="rtl">
      <div className={styles["league-card"]}>
        <div className={styles["league-header"]}>
          <div className={styles["league-title-row"]}>
            <div className={styles["league-badge"]}>RSL</div>
            <h2>دوري روشن السعودي</h2>
          </div>
          <p>الجولة 28</p>
        </div>

        <div className={styles["live-badge"]}>● مباشر</div>

        <div className={styles["match-main"]}>
          <div className={styles["team-block"]}>
            <img
              src="/teams/alhilal.png"
              alt="الهلال"
              className={styles["team-logo"]}
            />
            <h3>الهلال</h3>
          </div>

          <div className={styles["score-block"]}>
            <h1>2 - 1</h1>
            <div className={styles["time-pill"]}>78:24</div>
          </div>

          <div className={styles["team-block"]}>
            <img
              src="/teams/alnassr.png"
              alt="النصر"
              className={styles["team-logo"]}
            />
            <h3>النصر</h3>
          </div>
        </div>

        <div className={styles["stadium-line"]}></div>

        <div className={styles["match-meta"]}>
          <div className={styles["meta-item"]}>25,000 متفرج</div>
          <div className={styles["meta-divider"]}></div>
          <div className={styles["meta-item"]}>الأول بارك</div>
          <div className={styles["meta-divider"]}></div>
          <div className={styles["meta-item"]}>الجمعة 23 مايو 2025</div>
        </div>

        <div className={styles["tweet-box"]}>
          <div className={styles["tweet-top"]}>
            <div className={styles["tweet-user"]}>
              <div className={styles["tweet-avatar"]}>
                <span>ل</span>
              </div>

              <div className={styles["tweet-user-info"]}>
                <div className={styles["tweet-name-row"]}>
                  <strong>اليقا</strong>
                  <span className={styles["verify-badge"]}>✓</span>
                  <span className={styles["tweet-handle"]}>@LigaApp_</span>
                  <span className={styles["tweet-time"]}>· 2m</span>
                </div>
              </div>
            </div>

            <div className={styles["tweet-menu"]}>•••</div>
          </div>

          <div className={styles["tweet-content"]}>
            <p>أخبار رائعة عن اللقاء! 📊</p>
            <p>النصر يتفوق على الهلال واللقاء مليء بالإثارة.</p>
            <p>تتوقع النتيجة النهائية؟</p>
            <a href="#match-thread">#النصر_الهلال</a>
          </div>

          <div className={styles["tweet-actions"]}>
            <span>💬 8</span>
            <span>🔁 24</span>
            <span>💗 117</span>
            <span>📊 5.2K</span>
            <span>↗</span>
          </div>

          <div className={styles["quick-reply-row"]}>
            <input type="text" placeholder="رد سريع.." />
            <button type="button">إرسال</button>
          </div>
        </div>
      </div>
      <div className="leagues-dropdown">
        <div className="leagues-tab">المركز الأول</div>

        <div className="leagues-menu">
          <div className="league-card">
            <span className="league-icon">⚽</span>
            <p className="league-name">الهلال</p>
          </div>

          <div className="league-card">
            <span className="league-icon">⚽</span>
            <p className="league-name">النصر</p>
          </div>

          <div className="league-card">
            <span className="league-icon">⚽</span>
            <p className="league-name">الاتحاد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
