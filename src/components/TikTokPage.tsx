import video from "../assets/vedtik.mp4";

function TikTokPage() {
  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[500px] rounded-xl overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-white text-lg">
          ⌄
        </div>

        <video
          src={video}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute bottom-4 left-3 z-50 text-white text-sm">
          <p>@user</p>
          <p>هذا فيديو تجريبي 🔥</p>
        </div>
      </div>
    </div>
  );
}

export default TikTokPage;
