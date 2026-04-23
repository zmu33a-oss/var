import React, { useState } from "react";
import { Heart, Share2, MessageSquare } from "lucide-react";
import styles from "../pages-css/ProfileX.module.css";
import { useAuth } from "../lib/AuthContext";
import { buildXHandle } from "../lib/xPosts";
import VerificationBadge from "../components/VerificationBadge";
import { useVerificationRegistry } from "../lib/verification";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: (target?: "dm" | "group" | "post" | null) => void;
}

const ProfileX: React.FC<Props> = ({ isOpen, onClose, onOpenChat }) => {
  const { profile, user } = useAuth();
  const { getVerification } = useVerificationRegistry();
  const [showGroupDrop, setShowGroupDrop] = useState(false);
  const rawEmail = profile?.email ?? user?.email ?? "";

  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    rawEmail.split("@")[0] ??
    "زميع";
  const username = profile?.username?.trim()
    ? profile.username.trim().startsWith("@")
      ? profile.username.trim()
      : `@${profile.username.trim()}`
    : buildXHandle(displayName);
  const bio = profile?.bio?.trim() ?? "";
  const location = profile?.location?.trim() ?? "";

  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const avatarFrameEnabled = Boolean(
    profile?.avatar_frame_enabled ?? user?.user_metadata?.avatar_frame_enabled,
  );
  const currentUserVerificationBadge = getVerification(user?.id)?.badge ?? null;

  const animClass = (i: number) =>
    `${styles["menu-item"]} ${isOpen ? styles["item-show"] : styles["item-hide"]} ${styles[`delay-${i}`]}`;

  return (
    <>
      <div
        className={`${styles["overlay"]} ${isOpen ? styles["overlay-open"] : ""}`}
        onClick={onClose}
      />

      <div className={`${styles["profile-x"]} ${isOpen ? styles["open"] : ""}`}>
        {/* ── بطاقة المستخدم ── */}
        <div className={`${styles["user-card"]} ${animClass(0)}`}>
          <div className={styles["user-info"]}>
            <div className={styles["user-name-row"]}>
              <span className={styles["user-name"]}>{displayName}</span>
              {currentUserVerificationBadge && (
                <VerificationBadge
                  size="sm"
                  variant={currentUserVerificationBadge}
                />
              )}
            </div>
            <span className={styles["user-handle"]}>{username}</span>
            {bio && <p className={styles["user-bio"]}>{bio}</p>}
            <div className={styles["user-meta"]}>
              <span className={styles["user-badge"]}>
                {location || "متحمس"}
              </span>
            </div>
          </div>
          <div className={styles["avatar-wrap"]}>
            {avatarFrameEnabled && (
              <img
                src="/profile-frame-rsl.svg"
                alt=""
                aria-hidden="true"
                className={styles["avatar-frame"]}
              />
            )}
            <div className={styles["avatar-face"]}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className={styles["avatar-img"]}
                />
              ) : (
                <div className={styles["avatar-fallback"]}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {currentUserVerificationBadge && (
              <VerificationBadge
                size="sm"
                variant={currentUserVerificationBadge}
                className={styles["avatar-badge"]}
              />
            )}
          </div>
        </div>

        {/* ── عناصر مع زر أزرق ── */}
        <div className={styles["menu-list"]}>
          <div className={animClass(1)}>
            <span className={styles["item-label"]}>رسالة جديدة</span>
            <button
              className={styles["action-btn"]}
              onClick={() => {
                onOpenChat?.("post");
                onClose();
              }}
            >
              اضافة
            </button>
          </div>

          <div className={animClass(2)}>
            <span className={styles["item-label"]}>الدردشات</span>
            <button
              className={styles["action-btn"]}
              onClick={() => {
                onOpenChat?.(null);
                onClose();
              }}
            >
              فتح
            </button>
          </div>

          <div
            className={animClass(3)}
            style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span className={styles["item-label"]}>القروبات</span>
              <button
                className={styles["action-btn"]}
                onClick={() => setShowGroupDrop((p) => !p)}
              >
                قروب ▾
              </button>
            </div>
            {showGroupDrop && (
              <div className={styles["group-drop"]}>
                <button
                  className={styles["group-drop-item"]}
                  onClick={() => {
                    setShowGroupDrop(false);
                    onOpenChat?.("group");
                    onClose();
                  }}
                >
                  إنشاء قروب
                </button>
                <button
                  className={styles["group-drop-item"]}
                  onClick={() => {
                    setShowGroupDrop(false);
                    onOpenChat?.(null);
                    onClose();
                  }}
                >
                  القروبات
                </button>
              </div>
            )}
          </div>

          {/* ── عناصر بدون زر ── */}
          <div className={`${animClass(4)} ${styles["plain-item"]}`}>
            <span className={styles["item-label"]}>لايك</span>
            <Heart size={18} className={styles["plain-icon"]} />
          </div>

          <div className={`${animClass(5)} ${styles["plain-item"]}`}>
            <span className={styles["item-label"]}>شير</span>
            <Share2 size={18} className={styles["plain-icon"]} />
          </div>

          <div className={`${animClass(6)} ${styles["plain-item"]}`}>
            <span className={styles["item-label"]}>تعليقات</span>
            <MessageSquare size={18} className={styles["plain-icon"]} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileX;
