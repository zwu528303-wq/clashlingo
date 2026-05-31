import { ImageResponse } from "next/og";

export const alt = "ClashLingo scenario-based language practice";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#fbf5f0",
          color: "#302e2b",
          fontFamily: "Arial, sans-serif",
          padding: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "52%",
            paddingRight: "44px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: "#953f4d",
                fontSize: 34,
                fontWeight: 800,
              }}
            >
              ClashLingo
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "34px",
                fontSize: 70,
                lineHeight: 0.95,
                fontWeight: 900,
              }}
            >
              Real situations. Timed stages. Durable progress.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "#5e5b57",
            }}
          >
            Scenario-based language practice with optional friend rivalries.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            borderRadius: "42px",
            border: "3px solid rgba(255,255,255,0.9)",
            backgroundColor: "#ffffff",
            padding: "34px",
            boxShadow: "0 28px 70px rgba(48,46,43,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#953f4d",
                }}
              >
                Scenario Map
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: "8px",
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                Cafe Stage 1
              </div>
            </div>
            <div
              style={{
                display: "flex",
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: "#953f4d",
                color: "#ffefef",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              80
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>
            {[1, 2, 3, 4].map((stage) => (
              <div
                key={stage}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  width: 112,
                  height: 112,
                  borderRadius: 28,
                  backgroundColor: stage === 1 ? "#ff94a2" : "#f6f0ea",
                  border:
                    stage === 1 ? "3px solid #953f4d" : "3px solid #ede7e2",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#5e5b57",
                  }}
                >
                  Stage
                </div>
                <div style={{ display: "flex", fontSize: 42, fontWeight: 900 }}>
                  {stage}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Scope ready", "Timed clash", "Standard answers"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  borderRadius: 24,
                  backgroundColor: "#f6f0ea",
                  padding: "18px 20px",
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    backgroundColor: "#0c693d",
                  }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
