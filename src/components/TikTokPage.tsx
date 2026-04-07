import "./TikTokPage.css";
import video from "../assets/vedtik.mp4";

const TikTokPage = () => {
  return (
    <div className="tiktok-container">
      <div className="video-card">
        <video src={video} loop muted autoPlay playsInline />

        <div className="video-overlay">
          <h3>@SportPlus</h3>
          <p>أهداف الجولة الماضية ⚽🔥</p>
        </div>
      </div>
    </div>
  );
};

export default TikTokPage;
