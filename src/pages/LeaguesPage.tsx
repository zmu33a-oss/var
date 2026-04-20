import { useEffect, useState } from "react";
import styles from "../pages-css/LeaguesPage.module.css";

type UpdateItem = {
  id: number;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  hashtag: string;
  engagement: string;
};

type TeamData = {
  name: string;
  logoSrc?: string;
  logoText?: string;
};

type MatchCardData = {
  id: number;
  title: string;
  round: string;
  score: [number, number];
  time: string;
  stadium: string;
  attendance: string;
  date: string;
  leftTeam: TeamData;
  rightTeam: TeamData;
  updates: UpdateItem[];
};

const alHilalVsAlNassrUpdates: UpdateItem[] = [
  {
    id: 1,
    author: "اليقا",
    handle: "@LigaApp_",
    avatar: "ل",
    time: "2m",
    text: "المباراة شعلت المنصة والنصر عاد بقوة في آخر 10 دقائق والكل ينتظر هدف التعادل.",
    hashtag: "#النصر_الهلال",
    engagement: "92%",
  },
  {
    id: 2,
    author: "الدوري السعودي",
    handle: "@SPL",
    avatar: "ك",
    time: "3m",
    text: "الهلال محافظ على التقدم لكن الرتم ارتفع بشكل واضح والجماهير تطالب بتبديلات هجومية فورية.",
    hashtag: "#دوري_روشن",
    engagement: "88%",
  },
  {
    id: 3,
    author: "نبض المدرج",
    handle: "@bluepulse",
    avatar: "ن",
    time: "4m",
    text: "تفاعل خرافي في هاشتاق المباراة وآخر الإحصائيات تؤكد أن الاستحواذ متقارب بين الطرفين.",
    hashtag: "#الهلال_النصر",
    engagement: "95%",
  },
  {
    id: 4,
    author: "معلق المباراة",
    handle: "@CommentatorXYZ",
    avatar: "م",
    time: "5m",
    text: "أفضل فترات اللقاء الآن، الهجمات متبادلة بشكل سريع وكل تمريرة صارت تصنع خطورة مباشرة.",
    hashtag: "#الهلال_النصر",
    engagement: "90%",
  },
  {
    id: 5,
    author: "هلالي حقيقي",
    handle: "@HilaliTrue",
    avatar: "ه",
    time: "6m",
    text: "المباراة ما تنفوت، أي هدف جديد ممكن يقلب كل شيء في الدقائق الأخيرة المشتعلة.",
    hashtag: "#الهلال_أولاً",
    engagement: "86%",
  },
];

const alIttihadVsAlAhliUpdates: UpdateItem[] = [
  {
    id: 1,
    author: "رادار جدة",
    handle: "@JeddahRadar",
    avatar: "ج",
    time: "1m",
    text: "ديربي مشتعل بين الاتحاد والأهلي وسط تفاعل جماهيري ضخم وحضور هجومي واضح من الطرفين.",
    hashtag: "#الاتحاد_الأهلي",
    engagement: "91%",
  },
  {
    id: 2,
    author: "دوري روشن",
    handle: "@SPL",
    avatar: "ر",
    time: "3m",
    text: "آخر التحديثات تشير إلى ضغط عالي في وسط الملعب وتغييرات تكتيكية متوقعة خلال الدقائق القادمة.",
    hashtag: "#ديربي_جدة",
    engagement: "89%",
  },
  {
    id: 3,
    author: "مدرج الأهلي",
    handle: "@AhlawiZone",
    avatar: "أ",
    time: "4m",
    text: "جماهير الأهلي تصنع أجواء استثنائية واللاعبون يردّون بأداء سريع وتحولات هجومية متتالية.",
    hashtag: "#الأهلي",
    engagement: "87%",
  },
  {
    id: 4,
    author: "صوت الاتحاد",
    handle: "@IttihadVoice",
    avatar: "ت",
    time: "6m",
    text: "الاتحاد قريب من تسجيل هدف ثانٍ بعد سلسلة فرص خطيرة داخل منطقة الجزاء في آخر دقائق الشوط.",
    hashtag: "#الاتحاد",
    engagement: "93%",
  },
];

const matches: MatchCardData[] = [
  {
    id: 1,
    title: "دوري روشن",
    round: "الجولة 28",
    score: [2, 1],
    time: "78:24",
    stadium: "الأول بارك",
    attendance: "25,000 متفرج",
    date: "الجمعة 23 مايو 2025",
    leftTeam: {
      name: "الهلال",
      logoSrc: "/teams/alhilal.png",
    },
    rightTeam: {
      name: "النصر",
      logoSrc: "/teams/alnassr.png",
    },
    updates: alHilalVsAlNassrUpdates,
  },
  {
    id: 2,
    title: "دوري روشن",
    round: "الجولة 28",
    score: [1, 1],
    time: "64:11",
    stadium: "الإنماء",
    attendance: "31,400 متفرج",
    date: "السبت 24 مايو 2025",
    leftTeam: {
      name: "الأهلي",
      logoText: "أ",
    },
    rightTeam: {
      name: "الاتحاد",
      logoText: "ا",
    },
    updates: alIttihadVsAlAhliUpdates,
  },
];

function TeamBlock({ team }: { team: TeamData }) {
  return (
    <div className={styles["team-block"]}>
      {team.logoSrc ? (
        <img
          src={team.logoSrc}
          alt={team.name}
          className={styles["team-logo"]}
        />
      ) : (
        <div className={styles["team-logo-fallback"]}>
          {team.logoText ?? team.name[0]}
        </div>
      )}
      <h3>{team.name}</h3>
    </div>
  );
}

function MatchCard({ match }: { match: MatchCardData }) {
  const [currentUpdate, setCurrentUpdate] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);

  useEffect(() => {
    if (selectedUpdate) {
      return;
    }

    const interval = setInterval(() => {
      setIsExiting(true);

      const timeout = window.setTimeout(() => {
        setCurrentUpdate((prev) => (prev + 1) % match.updates.length);
        setIsExiting(false);
      }, 320);

      return () => window.clearTimeout(timeout);
    }, 4200);

    return () => clearInterval(interval);
  }, [match.updates.length, selectedUpdate]);

  const update = match.updates[currentUpdate];

  if (selectedUpdate) {
    return (
      <div className={styles["detail-shell"]}>
        <button
          type="button"
          className={styles["back-btn"]}
          onClick={() => setSelectedUpdate(null)}
        >
          رجوع للمباراة
        </button>

        <article className={styles["detail-card"]}>
          <div className={styles["tweet-top"]}>
            <div className={styles["tweet-user"]}>
              <div className={styles["tweet-avatar"]}>
                {selectedUpdate.avatar}
              </div>
              <div className={styles["tweet-user-info"]}>
                <div className={styles["tweet-name-row"]}>
                  <strong>{selectedUpdate.author}</strong>
                  <span className={styles["verify-badge"]}>✓</span>
                  <span className={styles["tweet-handle"]}>
                    {selectedUpdate.handle}
                  </span>
                  <span className={styles["tweet-time"]}>
                    · {selectedUpdate.time}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className={styles["detail-text"]}>{selectedUpdate.text}</p>
          <a href="#match-thread" className={styles["detail-hashtag"]}>
            {selectedUpdate.hashtag}
          </a>

          <button type="button" className={styles["hashtag-btn"]}>
            ادخل الهاشتاق
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className={styles["league-card"]}>
      <div className={styles["league-header"]}>
        <div className={styles["league-title-row"]}>
          <div className={styles["league-badge"]}>RSL</div>
          <h2>{match.title}</h2>
        </div>
        <p>{match.round}</p>
      </div>

      <div className={styles["live-badge"]}>● مباشر</div>

      <div className={styles["match-main"]}>
        <TeamBlock team={match.leftTeam} />

        <div className={styles["score-block"]}>
          <div className={styles["score-line"]} dir="ltr">
            <span>{match.score[0]}</span>
            <span className={styles["score-dash"]}>-</span>
            <span>{match.score[1]}</span>
          </div>
          <div className={styles["time-pill"]}>{match.time}</div>
        </div>

        <TeamBlock team={match.rightTeam} />
      </div>

      <div className={styles["stadium-line"]}></div>

      <div className={styles["match-meta"]}>
        <div className={styles["meta-item"]}>{match.attendance}</div>
        <div className={styles["meta-divider"]}></div>
        <div className={styles["meta-item"]}>{match.stadium}</div>
        <div className={styles["meta-divider"]}></div>
        <div className={styles["meta-item"]}>{match.date}</div>
      </div>

      <div className={styles["tweet-box"]}>
        <div className={styles["tweet-top"]}>
          <div className={styles["tweet-user"]}>
            <div className={styles["tweet-avatar"]}>{update.avatar}</div>

            <div className={styles["tweet-user-info"]}>
              <div className={styles["tweet-name-row"]}>
                <strong>{update.author}</strong>
                <span className={styles["verify-badge"]}>✓</span>
                <span className={styles["tweet-handle"]}>{update.handle}</span>
                <span className={styles["tweet-time"]}>· {update.time}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["ticker-row"]}>
          <p
            key={update.id}
            className={`${styles["ticker-text"]} ${isExiting ? styles["ticker-out"] : styles["ticker-in"]}`}
          >
            {update.text}
          </p>

          <button
            type="button"
            className={styles["more-btn"]}
            onClick={() => setSelectedUpdate(update)}
          >
            المزيد
          </button>
        </div>

        <div className={styles["tweet-footer"]}>
          <a href="#match-thread" className={styles["live-hashtag"]}>
            {update.hashtag}
          </a>

          <span className={styles["engagement-rate"]}>
            نسبة التفاعل {update.engagement}
          </span>
        </div>

        <div className={styles["hashtag-btn-wrap"]}>
          <button type="button" className={styles["hashtag-btn"]}>
            ادخل الهاشتاق
          </button>
        </div>
      </div>

      <div className={styles["tweet-indicator"]}>
        {match.updates.map((item, idx) => (
          <span
            key={`${item.id}-${idx}`}
            className={`${styles["indicator-dot"]} ${idx === currentUpdate ? styles["active"] : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LeagueCard() {
  return (
    <div className={styles["league-card-wrapper"]} dir="rtl">
      <div className={styles["cards-stack"]}>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
