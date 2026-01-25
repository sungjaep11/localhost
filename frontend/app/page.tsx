export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        backgroundImage: "url('/images/background.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <button type="button" className="cyberpunk-btn">
          노래 맞추기
        </button>
        <button type="button" className="cyberpunk-btn cyberpunk-btn-pink">
          사투리 가사 맞추기
        </button>
      </div>
    </main>
  );
}
