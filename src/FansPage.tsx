import "./FansPage.css";

type IconItem = {
  title: string;
  icon: string;
};

type Fan = {
  name: string;
  club: string;
  score: string;
  avatar: string;
};

type Post = {
  user: string;
  time: string;
  text: string;
};

export default function FansPage() {
  const topIcons: IconItem[] = [
    { title: "الهلال", icon: "⚽" },
    { title: "النصر", icon: "🔥" },
    { title: "الاتحاد", icon: "⭐" },
  ];

  const bottomIcons: IconItem[] = [
    { title: "الأهلي", icon: "🏆" },
    { title: "الشباب", icon: "⚡" },
    { title: "التعاون", icon: "🎯" },
  ];

  const topFans: Fan[] = [
    {
      name: "فهد",
      club: "الهلال",
      score: "2.1K",
      avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
      name: "سالم",
      club: "النصر",
      score: "1.8K",
      avatar: "https://i.pravatar.cc/100?img=2",
    },
    {
      name: "راكان",
      club: "الاتحاد",
      score: "1.5K",
      avatar: "https://i.pravatar.cc/100?img=3",
    },
  ];

  const posts: Post[] = [
    { user: "فهد", time: "قبل 5 دقائق", text: "الهلال راجع بقوة اليوم 🔥" },
    { user: "سالم", time: "قبل 8 دقائق", text: "النصر لازم يفوز اليوم 💛" },
    { user: "راكان", time: "قبل 10 دقائق", text: "الاتحاد فوق الجميع 🖤" },
  ];

  return (
    <div className="page">
      {/* الايقونات */}
      <div className="icons-section">
        <div className="icons-row">
          {topIcons.map((item, i) => (
            <div key={i} className="icon-card">
              <div className="icon">{item.icon}</div>
              <span>{item.title}</span>
            </div>
          ))}
        </div>

        <div className="icons-row">
          {bottomIcons.map((item, i) => (
            <div key={i} className="icon-card">
              <div className="icon">{item.icon}</div>
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* اكثر المشجعين */}
      <div className="top-fans">
        <h2>أكثر المشجعين تفاعل</h2>

        <div className="fans-row">
          {topFans.map((fan, i) => (
            <div key={i} className="fan-card">
              <img src={fan.avatar} />
              <h3>{fan.name}</h3>
              <p>{fan.club}</p>
              <span>{fan.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الترند */}
      <div className="posts">
        <h2>الترند الآن</h2>

        {posts.map((post, i) => (
          <div key={i} className="post-card">
            <div className="post-header">
              <strong>{post.user}</strong>
              <span>{post.time}</span>
            </div>
            <p>{post.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
