import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CourseMind - AI revision notes and personalised study guides for students";
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
          alignItems: "center",
          background: "#fbfaf7",
          color: "#171713",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            border: "1px solid #e4ded3",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            padding: 56,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#21745f",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            CourseMind
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 760,
              letterSpacing: 0,
              lineHeight: 1.03,
              maxWidth: 900,
            }}
          >
            AI revision notes for your whole course.
          </div>
          <div
            style={{
              color: "#5f5a50",
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 880,
            }}
          >
            Upload lectures, slides, screenshots and notes. Generate a personalised textbook that
            grows with the module.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
