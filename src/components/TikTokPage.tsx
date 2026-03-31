import "./TikTokPage.scss"; // تأكد أن الاسم هنا يطابق اسم الملف تماماً

const TikTokPage = () => {
  return (
    <div className="tiktok-container">
      <div className="video-card">
        <video src="/src/assets/vedtik.mp4" loop muted autoPlay playsInline />
        <div className="video-overlay">
          <h3>@SportPlus</h3>
          <p>أهداف الجولة الماضية ⚽🔥</p>
        </div>
      </div>
    </div>
  );
};

export default TikTokPage;
