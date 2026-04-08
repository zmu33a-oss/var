import "./LeaguesPage.css";

export default function LeagueCard() {
  return (
    <div className="league-card-wrapper" dir="rtl">
      <div className="league-card">
        <div className="league-header">
          <div className="league-title-row">
            <div className="league-badge">RSL</div>
            <h2>دوري روشن السعودي</h2>
          </div>
          <p>الجولة 28</p>
        </div>

        <div className="live-badge">● مباشر</div>

        <div className="match-main">
          <div className="team-block">
            <img src="/teams/alhilal.png" alt="الهلال" className="team-logo" />
            <h3>الهلال</h3>
          </div>

          <div className="score-block">
            <h1>2 - 1</h1>
            <div className="time-pill">78:24</div>
          </div>

          <div className="team-block">
            <img src="/teams/alnassr.png" alt="النصر" className="team-logo" />
            <h3>النصر</h3>
          </div>
        </div>

        <div className="stadium-line"></div>

        <div className="match-meta">
          <div className="meta-item">25,000 متفرج</div>
          <div className="meta-divider"></div>
          <div className="meta-item">الأول بارك</div>
          <div className="meta-divider"></div>
          <div className="meta-item">الجمعة 23 مايو 2025</div>
        </div>

        <div className="tweet-box">
          <div className="tweet-top">
            <div className="tweet-user">
              <div className="tweet-avatar">
                <span>ل</span>
              </div>

              <div className="tweet-user-info">
                <div className="tweet-name-row">
                  <strong>اليقا</strong>
                  <span className="verify-badge">✓</span>
                  <span className="tweet-handle">@LigaApp_</span>
                  <span className="tweet-time">· 2m</span>
                </div>
              </div>
            </div>

            <div className="tweet-menu">•••</div>
          </div>

          <div className="tweet-content">
            <p>أخبار رائعة عن اللقاء! 📊</p>
            <p>النصر يتفوق على الهلال واللقاء ملي بالإثارة!</p>
            <p>تتوقع النتيجة النهائية؟ 🤔</p>
            <a href="#">#النصر_الهلال</a>
          </div>

          <div className="tweet-actions">
            <span>💬 8</span>
            <span>🔁 24</span>
            <span>💗 117</span>
            <span>📊 5.2K</span>
            <span>↗</span>
          </div>

          <div className="quick-reply-row">
            <input type="text" placeholder="رد سريع.." />
            <button type="button">إرسال</button>
          </div>
        </div>
      </div>
    </div>
  );
}
