import React, { useState } from "react";

type Platform = "tiktok" | "x";

type Post = {
  id: number;
  username: string;
  handle: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
};

const tiktokPosts: Post[] = [
  {
    id: 1,
    username: "Sarah Vision",
    handle: "@sarahvision",
    content: "لقطة سريعة من يومي ✨🔥",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    likes: 1240,
    comments: 95,
    shares: 41,
  },
  {
    id: 2,
    username: "Mazen Clips",
    handle: "@mazenclips",
    content: "أقوى ترند اليوم، مين جربه؟ 🎵",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    likes: 2190,
    comments: 148,
    shares: 86,
  },
  {
    id: 3,
    username: "Noor Studio",
    handle: "@noorstudio",
    content: "وراء الكواليس من التصوير اليوم 🎬",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    likes: 980,
    comments: 63,
    shares: 24,
  },
];

const xPosts: Post[] = [
  {
    id: 1,
    username: "Tech World",
    handle: "@techworld",
    content: "مستقبل المنصات الاجتماعية يتجه نحو الدمج بين المحتوى السريع والمحادثات الفورية.",
    likes: 860,
    comments: 102,
    shares: 57,
  },
  {
    id: 2,
    username: "Startup Lens",
    handle: "@startuplens",
    content: "وجود زر switch بين أكثر من تجربة داخل نفس التطبيق يعطي المستخدم مرونة أعلى وتجربة أسرع.",
    likes: 530,
    comments: 44,
    shares: 31,
  },
  {
    id: 3,
    username: "UI Daily",
    handle: "@uidaily",
    content: "التصميم الناجح هو الذي يجعل المستخدم يفهم الفرق بين الأقسام بدون شرح طويل.",
    likes: 710,
    comments: 66,
    shares: 28,
  },
];

const App: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>("tiktok");

  const posts = platform === "tiktok" ? tiktokPosts : xPosts;

  const togglePlatform = () => {
    setPlatform((prev) => (prev === "tiktok" ? "x" : "tiktok"));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f14",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 700 }}>
              Social Switch
            </h1>
            <p style={{ margin: "8px 0 0", color: "#a1a1aa" }}>
              منصة تجمع بين TikTok و X مع التبديل السريع بينهما
            </p>
          </div>

          <button
            onClick={togglePlatform}
            style={{
              background: platform === "tiktok" ? "#111827" : "#1d9bf0",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "12px 20px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              transition: "0.3s",
            }}
          >
            Switch to {platform === "tiktok" ? "X" : "TikTok"}
          </button>
        </div>

        {/* Platform Badge */}
        <div
          style={{
            marginBottom: "20px",
            display: "inline-block",
            background: platform === "tiktok" ? "#fe2c55" : "#1d9bf0",
            padding: "8px 16px",
            borderRadius: "999px",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          Current Platform: {platform === "tiktok" ? "TikTok" : "X"}
        </div>

        {/* Feed */}
        <div style={{ display: "grid", gap: "18px" }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#18181f",
                border: "1px solid #27272a",
                borderRadius: "18px",
                padding: "18px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "17px" }}>
                    {post.username}
                  </div>
                  <div style={{ color: "#a1a1aa", fontSize: "14px" }}>
                    {post.handle}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: platform === "tiktok" ? "#fe2c55" : "#1d9bf0",
                  }}
                >
                  {platform === "tiktok" ? "TikTok Post" : "X Post"}
                </div>
              </div>

              <p
                style={{
                  margin: "0 0 14px",
                  lineHeight: 1.7,
                  color: "#f4f4f5",
                  fontSize: "15px",
                }}
              >
                {post.content}
              </p>

              {post.image && (
                <img
                  src={post.image}
                  alt={post.username}
                  style={{
                    width: "100%",
                    height: "280px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    marginBottom: "14px",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  color: "#a1a1aa",
                  fontSize: "14px",
                  flexWrap: "wrap",
                }}
              >
                <span>❤️ {post.likes}</span>
                <span>💬 {post.comments}</span>
                <span>🔁 {post.shares}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
