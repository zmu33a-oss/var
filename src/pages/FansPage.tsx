import { useState } from "react";
import {
  Award,
  Bell,
  ChevronDown,
  Flame,
  Heart,
  Megaphone,
  MessageCircle,
  Repeat2,
  Settings,
  Users,
} from "lucide-react";
import styles from "../pages-css/FansPage.module.css";

const topFans = [
  {
    id: 1,
    name: "سلطان العتيبي",
    points: "1,540",
    avatar: "👩🏻",
    accent: "blue",
  },
  {
    id: 2,
    name: "أحمد الهلالي",
    points: "1,210",
    avatar: "🧑🏾",
    accent: "default",
  },
];

const posts = [
  {
    id: 1,
    author: "سلمان الزهراني",
    handle: "@hilalvoice",
    text: "المدرج اليوم نار. نحتاج بداية ضغط عالية وأول ربع ساعة لازم يكون فيها حضور صوتي كامل.",
    likes: 284,
    replies: 46,
    reposts: 19,
  },
  {
    id: 2,
    author: "نوف",
    handle: "@bluepulse",
    text: "اقتراح اليوم: نثبت قائمة تشجيع موحدة ونرفع التفاعل داخل الرابطة قبل بداية المباراة بنصف ساعة.",
    likes: 192,
    replies: 31,
    reposts: 11,
  },
];

const sideActions = [
  {
    id: 1,
    icon: Users,
    label: "الجمهور",
    options: ["أعضاء الرابطة", "مجموعات التشجيع", "إدارة الفرق"],
  },
  {
    id: 2,
    icon: Bell,
    label: "التنبيهات",
    options: ["تنبيهات المباراة", "آخر الأخبار", "تخصيص الإشعارات"],
  },
  {
    id: 3,
    icon: Megaphone,
    label: "الحملات",
    options: ["حملة تشجيع جديدة", "جدولة منشور", "قائمة الحملات"],
  },
  {
    id: 4,
    icon: Settings,
    label: "الإعدادات",
    options: ["إعدادات الصفحة", "لغة العرض", "إدارة الصلاحيات"],
  },
];

const FansPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSideMenu, setActiveSideMenu] = useState<number | null>(null);

  return (
    <div className={styles.fansPage} dir="rtl">
      <div className={styles.backdropGlow} />

      {/* اللسان العلوي - عنصر مستقل ثابت دائمًا */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <Flame className={styles.triggerFlame} />
        <span className={styles.triggerLabel}>جمهور الهلال</span>
        <ChevronDown
          className={`${styles.triggerArrow} ${isOpen ? styles.triggerArrowOpen : ""}`}
        />
      </button>

      {/* البانل ينزل من فوق */}
      <div
        className={`${styles.topSheet} ${isOpen ? styles.topSheetOpen : ""}`}
      >
        <div className={styles.sheetContent}>
          <div className={styles.sheetHandle} />
          <div className={styles.sheetSectionHeader}>
            <p className={styles.sheetEyebrow}>القائمة المتحركة</p>
            <h3 className={styles.sheetTitle}>اختصارات الجمهور</h3>
          </div>

          <div className={styles.sheetMenu}>
            <button className={styles.menuBtn} type="button">
              ترتيب الأكثر تفاعلاً
            </button>
            <button className={styles.menuBtn} type="button">
              أبرز التغريدات
            </button>
            <button className={styles.menuBtn} type="button">
              محتوى روابط الجمهور
            </button>
          </div>
        </div>
      </div>

      {/* الأوفرلاي للإغلاق بالضغط خارج البانل */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <aside className={styles.sideRail} aria-label="الاختصارات الجانبية">
        {sideActions.map((item) => {
          const Icon = item.icon;
          const isActive = activeSideMenu === item.id;

          return (
            <div key={item.id} className={styles.railItemWrap}>
              <button
                className={`${styles.railButton} ${isActive ? styles.railButtonActive : ""}`}
                onClick={() =>
                  setActiveSideMenu((prev) =>
                    prev === item.id ? null : item.id,
                  )
                }
                type="button"
                title={item.label}
                aria-expanded={isActive}
              >
                <Icon className={styles.railIcon} />
              </button>

              {isActive && (
                <div className={styles.railDropdown}>
                  <p className={styles.railDropdownTitle}>{item.label}</p>
                  {item.options.map((option) => (
                    <button
                      key={option}
                      className={styles.railDropdownOption}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* المحتوى الرئيسي */}
      <div className={styles.contentShell}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>الأكثر تفاعلاً اليوم</h2>
          <Award className={styles.sectionIcon} />
        </div>

        <div className={styles.topFansGrid}>
          {topFans.map((fan) => (
            <article
              key={fan.id}
              className={`${styles.fanCard} ${fan.accent === "blue" ? styles.fanCardAccent : ""}`}
            >
              <div className={styles.avatarWrap}>{fan.avatar}</div>
              <h3 className={styles.fanName}>{fan.name}</h3>
              <p className={styles.fanPoints}>{fan.points} نقطة</p>
            </article>
          ))}
        </div>

        <div className={styles.feedList}>
          {posts.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postTopRow}>
                <div>
                  <h3 className={styles.postAuthor}>{post.author}</h3>
                  <p className={styles.postHandle}>{post.handle}</p>
                </div>
                <div className={styles.postBadge}>رأي الجماهير</div>
              </div>
              <p className={styles.postText}>{post.text}</p>
              <div className={styles.postMeta}>
                <span className={styles.metaItem}>
                  <Heart size={16} />
                  {post.likes}
                </span>
                <span className={styles.metaItem}>
                  <MessageCircle size={16} />
                  {post.replies}
                </span>
                <span className={styles.metaItem}>
                  <Repeat2 size={16} />
                  {post.reposts}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FansPage;
