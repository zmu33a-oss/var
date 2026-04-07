import "./LeaguesPage.css";

type Match = {
  team1: string;
  team2: string;
  score: string;
  time: string;
  comments: string[];
};

export default function LeaguesPage() {
  const matches: Match[] = [
    {
      team1: "الهلال",
      team2: "النصر",
      score: "1 : 0",
      time: "45:22",
      comments: ["🔥 الهلال مسيطر", "💛 الحكم ظالم", "😂 المباراة حماس"],
    },
    {
      team1: "الاتحاد",
      team2: "الأهلي",
      score: "2 : 2",
      time: "60:10",
      comments: ["🔥 مباراة نار", "😡 الدفاع سيء", "💛 هدف عالمي"],
    },
    {
      team1: "الشباب",
      team2: "التعاون",
      score: "0 : 0",
      time: "30:55",
      comments: ["😴 المباراة هادية", "🔥 فيه فرص", "😂 نبي هدف"],
    },
  ];

  return (
    <div className="leagues-page">
      {matches.map((match, i) => (
        <div key={i} className="match-card">
          {/* الفرق */}
          <div className="teams">
            <span>{match.team1}</span>
            <span className="score">{match.score}</span>
            <span>{match.team2}</span>
          </div>

          {/* الوقت */}
          <div className="time">LIVE • {match.time}</div>

          {/* الردود */}
          <div className="comments">
            {match.comments.map((c, idx) => (
              <p key={idx}>{c}</p>
            ))}
          </div>

          {/* رد سريع */}
          <div className="reply-box">
            <input placeholder="اكتب رد سريع..." />
            <button>إرسال</button>
          </div>

          {/* X */}
          <div className="go-x">↗ كمل النقاش في X</div>
        </div>
      ))}
    </div>
  );
}
