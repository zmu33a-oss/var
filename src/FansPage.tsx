import "./FansPage.css";
import DigitalCounter from "./DigitalCounter";

type ClubCard = {
  name: string;
  logo: string;
  votes: number;
  percentage: number;
  buttonText: string;
  fanImage?: string;
};

export default function FansPage() {
  const clubs: ClubCard[] = [
    {
      name: "الهلال",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/55/Al_Hilal_SFC_Logo.svg/200px-Al_Hilal_SFC_Logo.svg.png",
      fanImage: "/alhelalfans.png",
      votes: 6850,
      percentage: 32,
      buttonText: "شجّع",
    },
    {
      name: "النصر",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Al_Nassr_FC_logo.svg/200px-Al_Nassr_FC_logo.svg.png",
      votes: 5720,
      percentage: 28,
      buttonText: "شجّع",
    },
    {
      name: "الاتحاد",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Al-Ittihad_Club_logo.svg/200px-Al-Ittihad_Club_logo.svg.png",
      fanImage: "/athadfans.png",
      votes: 5280,
      percentage: 24,
      buttonText: "شجّع",
    },
  ];

  return (
    <div className="fans-page">
      <h1 className="fans-title">رابطة المشجعين</h1>
      <p className="fans-subtitle">أقوى جماهير اليوم من النادي الأكثر تفاعل؟</p>

      <div className="clubs-grid">
        {clubs.map((club, index) => (
          <div className="club-card" key={index}>
            <div className="club-top">
              <img src={club.logo} alt={club.name} className="club-logo" />
            </div>

            <h3 className="club-name">{club.name}</h3>

            <div className="club-actions">
              {club.fanImage && (
                <img
                  src={club.fanImage}
                  alt={`${club.name} fans`}
                  className="club-image"
                />
              )}

              <DigitalCounter value={club.votes} />
              <button className="club-button">{club.buttonText}</button>
            </div>

            <div className="club-stats">
              <span className="fire">🔥</span>
              <span>نسبة التفاعل {club.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
