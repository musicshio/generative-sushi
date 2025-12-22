import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const title = "これはもう寿司ってことになりませんかね？";
const description = "寿司判定AIとチャットしながら、あなただけの寿司を作ろう！";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background:
            "linear-gradient(135deg, rgba(248, 231, 193, 1) 0%, rgba(244, 177, 131, 1) 48%, rgba(217, 104, 73, 1) 100%)",
          color: "#1b1b1b",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            alignSelf: "flex-start",
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.65)",
            border: "2px solid rgba(27, 27, 27, 0.15)",
            fontSize: 24,
            letterSpacing: "0.08em",
          }}
        >
          GENERATIVE SUSHI
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 920,
            fontSize: 32,
            lineHeight: 1.4,
            color: "rgba(27, 27, 27, 0.78)",
          }}
        >
          {description}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Sushi Judge AI
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#1b1b1b",
            }}
          />
          Chat & Create
        </div>
      </div>
    ),
    size
  );
}
