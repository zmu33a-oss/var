import { Calendar, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import ProfileHeader from "../components/ProfileHeader";
import styles from "../pages-css/ProfilePage.module.css";

const profileData = {
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
  displayName: "Ahmed Al-Xtik",
  username: "@xtik",
  bio: "Athlete · Football analyst · Passionate about the beautiful game and the numbers behind it.",
  email: "xtik@webplus.app",
  phone: "+966 5X XXX XXXX",
  location: "Riyadh, Saudi Arabia",
  joinDate: "April 2024",
  stats: {
    followers: "24.5K",
    following: "312",
    likes: "1.2M",
  },
};

const galleryImages = [
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=400&q=80",
];

const savedItems = [
  {
    id: "s1",
    icon: "⚽",
    title: "الهلال vs النصر",
    subtitle: "Saved Match",
    tag: "Riyadh Derby",
  },
  {
    id: "s2",
    icon: "🏆",
    title: "دوري روشن السعودي",
    subtitle: "League",
    tag: "Standings",
  },
  {
    id: "s3",
    icon: "📊",
    title: "تحليل الجولة 28",
    subtitle: "Analysis",
    tag: "Stats",
  },
  {
    id: "s4",
    icon: "🎬",
    title: "أفضل لحظات الموسم",
    subtitle: "Highlights",
    tag: "Video",
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"gallery" | "saved">("gallery");

  return (
    <main className={styles.page}>
      <ProfileHeader
        avatarUrl={profileData.avatarUrl}
        displayName={profileData.displayName}
        username={profileData.username}
        bio={profileData.bio}
      />

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <strong>{profileData.stats.followers}</strong>
          <span>Followers</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>{profileData.stats.following}</strong>
          <span>Following</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <strong>{profileData.stats.likes}</strong>
          <span>Likes</span>
        </div>
      </div>

      {/* Info Section */}
      <section className={styles.infoSection}>
        <div className={styles.infoRow}>
          <Mail size={15} className={styles.infoIcon} />
          <span>{profileData.email}</span>
        </div>
        <div className={styles.infoRow}>
          <Phone size={15} className={styles.infoIcon} />
          <span>{profileData.phone}</span>
        </div>
        <div className={styles.infoRow}>
          <MapPin size={15} className={styles.infoIcon} />
          <span>{profileData.location}</span>
        </div>
        <div className={styles.infoRow}>
          <Calendar size={15} className={styles.infoIcon} />
          <span>Joined {profileData.joinDate}</span>
        </div>
      </section>

      {/* Content Section */}
      <section className={styles.contentSection}>
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "gallery" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            Gallery
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "saved" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            Saved
          </button>
        </div>

        {activeTab === "gallery" && (
          <div className={styles.galleryGrid}>
            {galleryImages.map((url, i) => (
              <div key={url} className={styles.galleryCell}>
                <img src={url} alt={`gallery-${i + 1}`} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <ul className={styles.savedList}>
            {savedItems.map((item) => (
              <li key={item.id} className={styles.savedItem}>
                <span className={styles.savedIcon}>{item.icon}</span>
                <div className={styles.savedMeta}>
                  <p>{item.title}</p>
                  <span>{item.subtitle}</span>
                </div>
                <span className={styles.savedTag}>{item.tag}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
