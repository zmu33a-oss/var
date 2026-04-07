export default function XPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        paddingTop: "70px",
        paddingBottom: "90px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          borderLeft: "1px solid #2f3336",
          borderRight: "1px solid #2f3336",
          minHeight: "100vh",
          background: "#000",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #2f3336",
            padding: "14px 16px",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          Home
        </div>

        <div
          style={{
            borderBottom: "1px solid #2f3336",
            padding: "16px",
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "999px",
              background: "#1d9bf0",
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700 }}>Mohannad</span>
              <span style={{ color: "#71767b" }}>@mohannad</span>
              <span style={{ color: "#71767b" }}>·</span>
              <span style={{ color: "#71767b" }}>2h</span>
            </div>

            <div
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                marginBottom: "12px",
              }}
            >
              This is a sample post for the X page design.
            </div>

            <div
              style={{
                borderRadius: "16px",
                border: "1px solid #2f3336",
                height: "260px",
                background: "#111",
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#71767b",
                fontSize: "14px",
              }}
            >
              <span>💬 24</span>
              <span>🔁 11</span>
              <span>❤️ 98</span>
              <span>📊 4.2K</span>
              <span>🔖</span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px solid #2f3336",
            padding: "16px",
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "999px",
              background: "#333",
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700 }}>Sports News</span>
              <span style={{ color: "#71767b" }}>@sportsnews</span>
              <span style={{ color: "#71767b" }}>·</span>
              <span style={{ color: "#71767b" }}>5h</span>
            </div>

            <div style={{ fontSize: "15px", lineHeight: 1.6 }}>
              Breaking updates, match analysis, and the latest fan reactions in
              one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
