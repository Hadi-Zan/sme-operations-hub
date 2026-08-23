import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f172a",
          color: "#6ee7b7",
          display: "flex",
          fontSize: 12,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.04em",
          width: "100%",
        }}
      >
        SO
      </div>
    ),
    size,
  );
}
