import { Edit2, Settings } from "lucide-react";
import styles from "../pages-css/ProfilePage.module.css";

type ProfileHeaderProps = {
  avatarUrl: string;
  displayName: string;
  username: string;
  bio: string;
};

export default function ProfileHeader({
  avatarUrl,
  displayName,
  username,
  bio,
}: ProfileHeaderProps) {
  return (
    <section className={styles.profileHeader}>
      <div className={styles.headerActions}>
        <button type="button" className={styles.iconBtn} aria-label="Settings">
          <Settings size={20} />
        </button>
        <button
          type="button"
          className={styles.editBtn}
          aria-label="Edit profile"
        >
          <Edit2 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className={styles.avatarWrap}>
        <img src={avatarUrl} alt={displayName} className={styles.avatar} />
        <div className={styles.avatarRing} />
      </div>

      <h1 className={styles.displayName}>{displayName}</h1>
      <p className={styles.username}>{username}</p>
      <p className={styles.bio}>{bio}</p>
    </section>
  );
}
