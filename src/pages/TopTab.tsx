import React, { useState } from "react";
import { Send, ChevronDown, ChevronUp, Users } from "lucide-react";
import styles from "../pages-css/TopTab.module.css";

interface Chat {
  id: number;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
}

interface Props {
  groupChats: Chat[];
  isTabOpen: boolean;
  setIsTabOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TopTab: React.FC<Props> = ({ groupChats, isTabOpen, setIsTabOpen }) => {
  const [replyText, setReplyText] = useState("");
  const [activeChat, setActiveChat] = useState(0);
  const latestChat = groupChats[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      setReplyText("");
    }
  };
  const BBMIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <rect x="2" y="3" width="20" height="14" rx="4" />
      <path d="M6 17l-4 4V17z" />
    </svg>
  );

  return (
    <div
      className={`${styles["top-tab"]} ${
        isTabOpen ? styles["open"] : styles["closed"]
      }`}
    >
      {!isTabOpen ? (
        <div
          className={styles["top-tab-trigger"]}
          onClick={() => setIsTabOpen(true)}
        >
          <div className={styles["top-tab-trigger-inner"]}>
            <BBMIcon />
            <div className={styles["top-tab-notification"]}>
              <span className={styles["top-tab-chat-name"]}>
                {latestChat.name}
              </span>
              <span className={styles["top-tab-last-msg"]}>
                {latestChat.lastMsg}
              </span>
            </div>
            
          </div>
        </div>
      ) : (
        <div className={styles["top-tab-body"]}>
          <div className={styles["tab-header"]}>
            <button
              onClick={() => setIsTabOpen(false)}
              className={styles["tab-close-btn"]}
            >
              <ChevronUp />
            </button>

            <h3 className={styles["tab-title"]}>
              دردشات المجموعات <Users />
            </h3>
          </div>

          <div className={styles["tab-content"]}>
            <div className={styles["groups-list"]}>
              {groupChats.map((chat, idx) => (
                <div
                  key={chat.id}
                  className={`${styles["group-item"]} ${
                    activeChat === idx ? styles["active"] : ""
                  }`}
                  onClick={() => setActiveChat(idx)}
                >
                  <div className={styles["group-name"]}>{chat.name}</div>

                  <div className={styles["group-meta"]}>
                    {chat.unread > 0 && (
                      <span className={styles["group-unread"]}>
                        {chat.unread}
                      </span>
                    )}
                    <span>{chat.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles["chat-area"]}>
              <div className={styles["last-message-box"]}>
                <div className={styles["last-message-title"]}>
                  آخر رسالة في {groupChats[activeChat].name}
                </div>
                <i className={styles["last-message-text"]}>
                  "{groupChats[activeChat].lastMsg}"
                </i>
              </div>

              <form
                className={styles["quick-reply-form"]}
                onSubmit={handleSendReply}
              >
                <input
                  type="text"
                  className={styles["quick-reply-input"]}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="رد سريع..."
                />
                <button type="submit" className={styles["send-btn"]}>
                  <Send />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopTab;
