import DigitalCounter from "../components/DigitalCounter";
import styles from "../pages-css/FansPage.module.css";
import BotonFans from "./botonfans";

type ClubCard = {
  name: string;
  logo: string;
  votes: number;
  percentage: number;
};

const clubs: ClubCard[] = [
  {
    name: "الهلال",
    logo: "/teams/alhilal.png",
    votes: 6850,
    percentage: 32,
  },
  {
    name: "النصر",
    logo: "/teams/alnassr.png",
    votes: 5720,
    percentage: 28,
  },
];

export default function FansPage() {
  return (
    <div className={styles["fans-page"]}>
      <BotonFans />

      <h1 className={styles["fans-title"]}>رابطة المشجعين</h1>
      <p className={styles["fans-subtitle"]}>
        قياس التفاعل المحلي للأندية المتاحة داخل المشروع
      </p>

      <div className={styles["clubs-grid"]}>
        {clubs.map((club) => (
          <article className={styles["club-card"]} key={club.name}>
            <div className={styles["club-top"]}>
              <img
                src={club.logo}
                alt={club.name}
                className={styles["club-logo"]}
              />
            </div>

            <h2 className={styles["club-name"]}>{club.name}</h2>

            <div className={styles["club-actions"]}>
              <div className={styles["club-votes"]}>
                <DigitalCounter value={club.votes} />
              </div>
              <button type="button" className={styles["club-button"]}>
                شجّع
              </button>
            </div>

            <div className={styles["club-stats"]}>
              <span className={styles.fire}>🔥</span>
              <span>نسبة التفاعل {club.percentage}%</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}