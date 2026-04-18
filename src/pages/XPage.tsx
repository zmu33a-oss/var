import React, { useState } from "react";
import {
  Home,
  Search,
  Bell,
  Mail,
  MessageSquare,
  Repeat2,
  Heart,
  Share,
  Feather,
} from "lucide-react";

import TopTab from "./TopTab";
import ProfileX from "./ProfileX";
import styles from "../pages-css/XPage.module.css";

const XPage: React.FC = () => {
  const [isTabOpen, setIsTabOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const groupChats = [
    {
      id: 1,
      name: "المطورين",
      lastMsg: " انتهيت من الكود؟",
      time: "2د",
      unread: 3,
    },
    {
      id: 2,
      name: "عائلة البرمجة",
      lastMsg: "صباح الخير جميعاً",
      time: "15د",
      unread: 1,
    },
    {
      id: 3,
      name: "مشروع X-New",
      lastMsg: "التصميم الجديد رائع",
      time: "1س",
      unread: 5,
    },
  ];

  const posts = [
    {
      id: 1,
      user: "Gemini AI",
      handle: "@gemini_tech",
      time: "5m",
      content:
        "لقد قمت بإصلاح مشكلة الملفات ودمجتها في ملف واحد لتعمل المعاينة بشكل صحيح. التصميم الآن جاهز!",
      stats: { replies: 12, retweets: 45, likes: 230 },
    },
    {
      id: 2,
      user: "برمجة وتصميم",
      handle: "@dev_designer",
      time: "20m",
      content:
        "واجهة إكس مع إضافة لسان الإشعارات العلوي تجعل الوصول للمجموعات أسرع بكثير.",
      stats: { replies: 5, retweets: 12, likes: 88 },
    },
  ];

  return (
    <div className={styles["app-container"]}>
      <TopTab
        groupChats={groupChats}
        isTabOpen={isTabOpen}
        setIsTabOpen={setIsTabOpen}
      />

      <div
        className={styles["timeline"]}
        style={{ paddingTop: isTabOpen ? "395px" : "45px" }}
      >
        <header className={styles["main-header"]}>
          <span className={styles["header-title"]}>Xtik</span>

          <div className={styles["header-subtitle"]}>
            <span>#الهلال x النصر المباراه مولعه بوستافو يطقع على اوهايو</span>
          </div>
        </header>

        {posts.map((post) => (
          <article key={post.id} className={styles["post"]}>
            <div className={styles["post-content"]}>
              <div className={styles["post-user-info"]}>
                <b>{post.user}</b>
                <span>{post.handle}</span>
                <span>• {post.time}</span>
              </div>

              <div className={styles["post-text"]}>{post.content}</div>

              <div className={styles["post-actions"]}>
                <div className={styles["action-item"]}>
                  <MessageSquare />
                  {post.stats.replies}
                </div>

                <div className={styles["action-item"]}>
                  <Repeat2 />
                  {post.stats.retweets}
                </div>

                <div className={styles["action-item"]}>
                  <Heart />
                  {post.stats.likes}
                </div>

                <div className={styles["action-item"]}>
                  <Share />
                </div>
              </div>
            </div>

            <div className={styles["post-avatar"]}>{post.user[0]}</div>
          </article>
        ))}
      </div>

      <nav className={styles["bottom-nav"]}>
        <Mail className={styles["nav-icon"]} />
        <Bell className={styles["nav-icon"]} />
        <Search className={styles["nav-icon"]} />
        <Home className={`${styles["nav-icon"]} ${styles["active"]}`} />
      </nav>

      <button
        className={styles["fab"]}
        onClick={() => setIsProfileOpen(true)}
      >
        <Feather />
      </button>

      <ProfileX
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default XPage;