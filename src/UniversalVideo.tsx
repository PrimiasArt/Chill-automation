import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { whoosh, whip } from "@remotion/sfx";
import { noise2D } from "@remotion/noise";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { ThreeCanvas } from "@remotion/three";
import { z } from "zod";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800", "900"],
});

export const SceneItemSchema = z.object({
  tieuDeCanh: z.string(),
  noiDungCanh: z.string(),
  nhanPhu: z.string().optional(),
  conSoNoiBat: z.string().optional(),
  hinhAnhCanh: z.string().optional(),
  moTaHinhAnhEn: z.string().optional(),
  loaiMinhHoa2D: z
    .enum([
      "illustration",
      "terminal",
      "flowchart",
      "checklist",
      "progress",
      "cards",
    ])
    .optional(),
  duLieuMinhHoa: z.array(z.string()).optional(),
});

export const UniversalVideoSchema = z.object({
  theLoai: z
    .enum(["kien-thuc", "ke-chuyen", "quang-cao", "cong-nghe"])
    .describe("Thể loại nội dung video"),
  kieuBoCuc: z
    .enum([
      "hoat-hinh-2d",
      "dien-anh-full",
      "quang-cao-reels",
      "cong-nghe-step",
      "chill-lofi",
    ])
    .optional()
    .describe("Kiểu bố cục hình ảnh & chuyển động toàn màn hình"),
  tieuDeChinh: z.string().describe("Tiêu đề chính của Video"),
  tenKenh: z.string().describe("Tên kênh / Thương hiệu"),
  loiThoai: z.string().describe("Toàn bộ kịch bản lời thoại AI Tiếng Việt"),
  batGiongDoc: z
    .boolean()
    .describe("Bật giọng đọc AI Tiếng Việt (Độc lập với phụ đề)"),
  batPhuDe: z
    .boolean()
    .optional()
    .describe("Bật phụ đề chữ Karaoke trên màn hình (Độc lập với giọng đọc)"),
  kieuNhacNen: z
    .enum(["chill", "energetic", "off"])
    .optional()
    .describe("Kiểu nhạc nền (Nhẹ vui tai / Sôi động / Tắt)"),
  batNhacNen: z.boolean().describe("Bật nhạc nền tự động lặp"),
  thoiLuongGiay: z
    .number()
    .min(4)
    .max(600)
    .describe("Thời lượng video (Giây — hỗ trợ tới 600s / 10 phút)"),
  mauChuDao: z.string().describe("Màu chủ đạo (HEX)"),
  mauPhu: z.string().describe("Màu điểm nhấn phụ (HEX)"),
  mauNen: z.string().describe("Màu nền (HEX)"),
  hienThi3D: z
    .boolean()
    .describe("True = Khối 3D, False = Hoạt hình 2D & Minh họa động"),
  cacPhanCanh: z.array(SceneItemSchema).describe("Danh sách các phân cảnh"),
});

export type UniversalVideoProps = z.infer<typeof UniversalVideoSchema>;

export const calculateUniversalMetadata: CalculateMetadataFunction<
  UniversalVideoProps
> = ({ props }) => {
  const fps = 30;
  const safeSeconds = Math.max(4, Math.min(600, props.thoiLuongGiay || 15));
  return {
    durationInFrames: Math.round(safeSeconds * fps),
    fps,
    width: 1080,
    height: 1920,
  };
};

export const UniversalVideo: React.FC<UniversalVideoProps> = ({
  theLoai = "kien-thuc",
  kieuBoCuc,
  tieuDeChinh = "Dự Án Video Sáng Tạo Mới",
  tenKenh = "CHILL ARGON STUDIO",
  loiThoai = "",
  batGiongDoc = true,
  batPhuDe = true,
  kieuNhacNen = "chill",
  batNhacNen = true,
  mauChuDao = "#38bdf8",
  mauPhu = "#fbbf24",
  mauNen = "#0f172a",
  hienThi3D = false,
  cacPhanCanh = [],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();

  // Resolve layout style based on kieuBoCuc or fallback from theLoai
  const activeLayout: NonNullable<UniversalVideoProps["kieuBoCuc"]> =
    kieuBoCuc ||
    (theLoai === "ke-chuyen"
      ? "dien-anh-full"
      : theLoai === "quang-cao"
        ? "quang-cao-reels"
        : theLoai === "cong-nghe"
          ? "hoat-hinh-2d"
          : "hoat-hinh-2d");

  const scenes =
    cacPhanCanh.length > 0
      ? cacPhanCanh
      : [
          {
            tieuDeCanh: tieuDeChinh,
            noiDungCanh:
              loiThoai || "Nội dung sáng tạo tự động bởi Chill Argon Studio",
            nhanPhu: "CẢNH 01",
            conSoNoiBat: "01",
            loaiMinhHoa2D: "illustration" as const,
            duLieuMinhHoa: ["Ý tưởng sáng tạo", "Hình ảnh trực quan", "Hoạt hình mượt mà"],
          },
        ];

  const sceneCount = scenes.length;
  const framesPerScene = Math.max(
    30,
    Math.floor(durationInFrames / sceneCount),
  );
  const currentSceneIndex = Math.min(
    sceneCount - 1,
    Math.floor(frame / framesPerScene),
  );
  const frameInScene = frame - currentSceneIndex * framesPerScene;
  const activeScene = scenes[currentSceneIndex];

  // Entrance & internal progress animations
  const cardEnter = interpolate(frameInScene, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const popScale = interpolate(frameInScene, [0, 14, 22], [0.84, 1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sceneProgress = interpolate(
    frameInScene,
    [4, Math.max(25, framesPerScene - 10)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Ambient procedural motion
  const floatX = noise2D("ux", frame * 0.012, currentSceneIndex) * 20;
  const floatY = noise2D("uy", currentSceneIndex, frame * 0.012) * 20;

  // Word-by-word Karaoke across the entire video duration
  const allWords = loiThoai.trim().split(/\s+/).filter(Boolean);
  const activeWordGlobalIdx = Math.floor(
    interpolate(
      frame,
      [6, Math.max(12, durationInFrames - 12)],
      [0, allWords.length],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );

  const windowSize = 13;
  const windowIndex = Math.floor(activeWordGlobalIdx / windowSize);
  const windowStart = windowIndex * windowSize;
  const visibleWords = allWords.slice(windowStart, windowStart + windowSize);

  const progressPct = Math.min(
    100,
    Math.round((frame / Math.max(1, durationInFrames - 1)) * 100),
  );

  const visualItems =
    activeScene.duLieuMinhHoa && activeScene.duLieuMinhHoa.length > 0
      ? activeScene.duLieuMinhHoa
      : [activeScene.noiDungCanh];

  const bgmFile =
    kieuNhacNen === "energetic" ? "mecha-cat-beat.mp3" : "chill-bgm.mp3";

  // Shared Karaoke Subtitle Overlay (Independent of Voiceover)
  const renderSubtitles = () => {
    if (batPhuDe === false || visibleWords.length === 0) return null;
    return (
      <div
        style={{
          backgroundColor: "rgba(8, 12, 24, 0.88)",
          border: `3px solid ${mauChuDao}`,
          borderRadius: 26,
          padding: "18px 28px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 12px",
          boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
        }}
      >
        {visibleWords.map((word, idx) => {
          const globalIdx = windowStart + idx;
          const isCurrent = globalIdx === activeWordGlobalIdx;
          const isSpoken = globalIdx < activeWordGlobalIdx;
          return (
            <span
              key={globalIdx}
              style={{
                fontSize: 34,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 10,
                backgroundColor: isCurrent ? mauChuDao : "transparent",
                color: isCurrent
                  ? "#050811"
                  : isSpoken
                    ? mauPhu
                    : "#ffffff",
                transform: isCurrent ? "scale(1.08)" : "scale(1)",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: mauNen,
        color: "#f8fafc",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Looping Background Music */}
      {batNhacNen && kieuNhacNen !== "off" && (
        <Audio
          src={staticFile(bgmFile)}
          loop
          volume={batGiongDoc ? 0.24 : 0.85}
        />
      )}

      {/* Vietnamese AI Voiceover */}
      {batGiongDoc && (
        <Audio from={4} src={staticFile("voiceover.mp3")} volume={1.0} />
      )}

      {/* Scene Transition Sound Effects */}
      {scenes.map((_, idx) => (
        <Sequence
          key={idx}
          from={idx * framesPerScene}
          durationInFrames={30}
          layout="none"
        >
          <Audio src={idx === 0 ? whip : whoosh} volume={0.28} />
        </Sequence>
      ))}

      {/* =====================================================================
          LAYOUT 1: HOẠT HÌNH 2D ĐỘNG & MINH HỌA TRỰC QUAN (hoat-hinh-2d)
          Playful 2D Cartoon Canvas, Giant Illustration Stage, Bouncing Bubbles
         ===================================================================== */}
      {activeLayout === "hoat-hinh-2d" && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${50 + floatX}% ${25 + floatY}%, ${mauChuDao}33 0%, ${mauPhu}22 45%, ${mauNen} 90%)`,
            padding: "56px 54px 52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Floating 2D Cartoon Decorative Orbs & Clouds */}
          <div
            style={{
              position: "absolute",
              top: 120 + floatY * 1.4,
              left: -60 + floatX,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `${mauChuDao}22`,
              filter: "blur(20px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 260 - floatY,
              right: -50 - floatX,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `${mauPhu}26`,
              filter: "blur(24px)",
            }}
          />

          {/* Top Cartoon Header Pill & Scene Dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 2,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                padding: "12px 26px",
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 24,
                boxShadow: `0 8px 0px ${mauChuDao}`,
                border: "3px solid #0f172a",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>🎨</span>
              <span>{tieuDeChinh.slice(0, 42)}</span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {scenes.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentSceneIndex ? 48 : 18,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor:
                      idx === currentSceneIndex
                        ? mauChuDao
                        : idx < currentSceneIndex
                          ? mauPhu
                          : "rgba(255,255,255,0.25)",
                    border: "2px solid #0f172a",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center Giant 2D Cartoon Illustration Stage + Story Bubble */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              zIndex: 2,
              opacity: cardEnter,
              transform: `scale(${popScale})`,
            }}
          >
            {/* Giant 2D Cartoon Artwork Frame */}
            <div
              style={{
                width: "100%",
                height: 690,
                borderRadius: 38,
                backgroundColor: "#ffffff",
                border: "6px solid #0f172a",
                boxShadow: `14px 14px 0px ${mauChuDao}`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {activeScene.hinhAnhCanh ? (
                <Img
                  src={staticFile(activeScene.hinhAnhCanh)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${1.02 + sceneProgress * 0.1}) translate(${Math.sin(frame * 0.05) * 8}px, ${Math.cos(frame * 0.04) * 6}px)`,
                  }}
                />
              ) : null}

              {/* Pop-in Cartoon Scene Badge Sticker */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  backgroundColor: mauChuDao,
                  color: "#050811",
                  padding: "10px 24px",
                  borderRadius: 999,
                  fontSize: 25,
                  fontWeight: 900,
                  border: "4px solid #0f172a",
                  boxShadow: "6px 6px 0px #0f172a",
                  transform: `rotate(${Math.sin(frame * 0.08) * 2.5}deg)`,
                }}
              >
                {activeScene.nhanPhu || `CẢNH 0${currentSceneIndex + 1}`}
              </div>
            </div>

            {/* Cartoon Story Dialog Box */}
            <div
              style={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                borderRadius: 34,
                padding: "28px 36px",
                border: "5px solid #0f172a",
                boxShadow: `12px 12px 0px ${mauPhu}`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: "#0f172a",
                }}
              >
                {activeScene.tieuDeCanh}
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.38,
                  color: "#334155",
                }}
              >
                {activeScene.noiDungCanh}
              </div>

              {/* Animated Bouncing 2D Action Pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {visualItems.slice(0, 3).map((item, i) => {
                  const pillEnter = interpolate(
                    frameInScene,
                    [8 + i * 8, 22 + i * 8],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? mauChuDao : mauPhu,
                        color: "#050811",
                        border: "3px solid #0f172a",
                        borderRadius: 18,
                        padding: "10px 20px",
                        fontSize: 25,
                        fontWeight: 900,
                        opacity: pillEnter,
                        transform: `translateY(${(1 - pillEnter) * 20}px)`,
                      }}
                    >
                      {`✦ ${item}`}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Subtitles */}
          <div style={{ zIndex: 3 }}>{renderSubtitles()}</div>
        </AbsoluteFill>
      )}

      {/* =====================================================================
          LAYOUT 2: ĐIỆN ẢNH TOÀN MÀN HÌNH (dien-anh-full)
          100% Full-Bleed Ken Burns Visuals, Atmospheric Vignette, Editorial Text
         ===================================================================== */}
      {activeLayout === "dien-anh-full" && (
        <AbsoluteFill>
          {/* Fullscreen 1080x1920 Ken Burns Background Artwork */}
          {activeScene.hinhAnhCanh && (
            <AbsoluteFill>
              <Img
                src={staticFile(activeScene.hinhAnhCanh)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${1.04 + sceneProgress * 0.16}) translate(${
                    (currentSceneIndex % 2 === 0 ? -1 : 1) * sceneProgress * 28
                  }px, ${-sceneProgress * 18}px)`,
                }}
              />
            </AbsoluteFill>
          )}

          {/* Cinematic Vignette & Gradient Overlay */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, rgba(5,8,17,0.72) 0%, rgba(5,8,17,0.12) 38%, rgba(5,8,17,0.82) 72%, rgba(5,8,17,0.96) 100%)`,
            }}
          />

          <AbsoluteFill
            style={{
              padding: "64px 60px 58px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Top Editorial Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `2px solid ${mauChuDao}88`,
                paddingBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: mauChuDao,
                  textTransform: "uppercase",
                }}
              >
                {tenKenh}
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#f8fafc",
                  backgroundColor: "rgba(0,0,0,0.55)",
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: `1px solid ${mauChuDao}66`,
                }}
              >
                {`PHÂN CẢNH 0${currentSceneIndex + 1} / 0${sceneCount}`}
              </span>
            </div>

            {/* Lower-Third Cinematic Story Overlay */}
            <div
              style={{
                marginTop: "auto",
                marginBottom: 28,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                opacity: cardEnter,
                transform: `translateY(${(1 - cardEnter) * 40}px)`,
              }}
            >
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: mauChuDao,
                  color: "#050811",
                  padding: "8px 22px",
                  borderRadius: 8,
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                {activeScene.nhanPhu || tieuDeChinh}
              </div>

              <div
                style={{
                  fontSize: 62,
                  fontWeight: 900,
                  lineHeight: 1.12,
                  color: "#ffffff",
                  textShadow: "0 8px 30px rgba(0,0,0,0.85)",
                }}
              >
                {activeScene.tieuDeCanh}
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 600,
                  lineHeight: 1.42,
                  color: "#e2e8f0",
                  textShadow: "0 4px 16px rgba(0,0,0,0.9)",
                  borderLeft: `6px solid ${mauChuDao}`,
                  paddingLeft: 24,
                }}
              >
                {activeScene.noiDungCanh}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {visualItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.78)",
                      border: `2px solid ${idx % 2 === 0 ? mauChuDao : mauPhu}`,
                      borderRadius: 16,
                      padding: "12px 22px",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {renderSubtitles()}
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* =====================================================================
          LAYOUT 3: QUẢNG CÁO SÔI ĐỘNG / TIKTOK REELS KINETIC (quang-cao-reels)
          Bold Kinetic Typography, Tilted Pop-Art Frame, Fast Staggered Strips
         ===================================================================== */}
      {activeLayout === "quang-cao-reels" && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${mauNen} 0%, #1e1035 55%, ${mauNen} 100%)`,
            padding: "56px 50px 52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Energetic Diagonal Accent Strip */}
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -180,
              width: 620,
              height: 620,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mauChuDao}44 0%, transparent 70%)`,
            }}
          />

          {/* Top Kinetic Impact Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 2,
              transform: `scale(${popScale})`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  backgroundColor: mauPhu,
                  color: "#050811",
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "6px 20px",
                  borderRadius: 8,
                  transform: "rotate(-1.5deg)",
                }}
              >
                {activeScene.nhanPhu || `HOT #${currentSceneIndex + 1}`}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 900, color: mauChuDao }}>
                {`${progressPct}%`}
              </span>
            </div>

            <div
              style={{
                fontSize: 58,
                fontWeight: 900,
                lineHeight: 1.08,
                textTransform: "uppercase",
                color: "#ffffff",
                textShadow: `4px 4px 0px ${mauChuDao}66`,
              }}
            >
              {activeScene.tieuDeCanh}
            </div>
          </div>

          {/* Tilted Dynamic Visual Showcase */}
          <div
            style={{
              width: "100%",
              height: 640,
              borderRadius: 34,
              border: `6px solid ${mauChuDao}`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.65), 10px 10px 0px ${mauPhu}`,
              overflow: "hidden",
              transform: `rotate(${Math.sin(frame * 0.08) * 1.6}deg) scale(${popScale})`,
              position: "relative",
              backgroundColor: "#0f172a",
            }}
          >
            {activeScene.hinhAnhCanh && (
              <Img
                src={staticFile(activeScene.hinhAnhCanh)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${1.05 + sceneProgress * 0.12})`,
                }}
              />
            )}
          </div>

          {/* Slam-in Action Callout Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, zIndex: 2 }}>
            <div
              style={{
                fontSize: 31,
                fontWeight: 800,
                color: "#f8fafc",
                backgroundColor: "rgba(15,23,42,0.88)",
                padding: "18px 26px",
                borderRadius: 20,
                borderLeft: `10px solid ${mauChuDao}`,
              }}
            >
              {activeScene.noiDungCanh}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {visualItems.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    backgroundColor: idx % 2 === 0 ? mauChuDao : mauPhu,
                    color: "#050811",
                    padding: "16px 22px",
                    borderRadius: 18,
                    fontSize: 26,
                    fontWeight: 900,
                  }}
                >
                  {`⚡ ${item}`}
                </div>
              ))}
            </div>
          </div>

          {renderSubtitles()}
        </AbsoluteFill>
      )}

      {/* =====================================================================
          LAYOUT 4: KỂ CHUYỆN LOFI / PODCAST / THƯ GIÃN (chill-lofi)
          Spinning Vinyl Disc, Polaroid Art Frame, Warm Cozy Typography
         ===================================================================== */}
      {activeLayout === "chill-lofi" && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 30%, ${mauChuDao}28 0%, ${mauPhu}18 45%, ${mauNen} 90%)`,
            padding: "60px 58px 54px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Lofi Header with Spinning Vinyl Record */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #fbbf24 0%, #fbbf24 18%, #1e293b 20%, #090d16 100%)",
                  border: `3px solid ${mauChuDao}`,
                  transform: `rotate(${frame * 2.2}deg)`,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
                }}
              />
              <div>
                <div style={{ fontSize: 22, color: mauChuDao, fontWeight: 800, letterSpacing: "0.08em" }}>
                  {tenKenh}
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#ffffff" }}>
                  {tieuDeChinh.slice(0, 38)}
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 23,
                color: mauPhu,
                padding: "8px 18px",
                borderRadius: 999,
                border: `2px solid ${mauPhu}66`,
              }}
            >
              {`♫ 0${currentSceneIndex + 1} / 0${sceneCount}`}
            </div>
          </div>

          {/* Center Polaroid Gallery Frame */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              borderRadius: 28,
              padding: "24px 24px 36px",
              boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
              transform: `rotate(${Math.sin(frame * 0.03) * 1.2}deg) scale(${popScale})`,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 660,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: "#1e293b",
              }}
            >
              {activeScene.hinhAnhCanh && (
                <Img
                  src={staticFile(activeScene.hinhAnhCanh)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${1.02 + sceneProgress * 0.08})`,
                  }}
                />
              )}
            </div>

            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#0f172a", lineHeight: 1.18 }}>
                {activeScene.tieuDeCanh}
              </div>
              <div style={{ fontSize: 29, fontWeight: 600, color: "#334155", lineHeight: 1.42 }}>
                {activeScene.noiDungCanh}
              </div>
            </div>
          </div>

          {renderSubtitles()}
        </AbsoluteFill>
      )}

      {/* =====================================================================
          LAYOUT 5: HƯỚNG DẪN TỪNG BƯỚC & CÔNG NGHỆ (cong-nghe-step)
          Step Progress Bar + Large Visual Banner + Interactive Step Widgets
         ===================================================================== */}
      {activeLayout === "cong-nghe-step" && (
        <AbsoluteFill
          style={{
            padding: "60px 56px 52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Step Progress Bar */}
          <div style={{ display: "flex", gap: 10 }}>
            {scenes.map((_, idx) => {
              const isCurr = idx === currentSceneIndex;
              const isDone = idx < currentSceneIndex;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    borderRadius: 14,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 21,
                    backgroundColor: isCurr
                      ? mauChuDao
                      : isDone
                        ? `${mauChuDao}28`
                        : "rgba(255,255,255,0.07)",
                    color: isCurr ? "#050811" : isDone ? mauChuDao : "#94a3b8",
                  }}
                >
                  {isDone ? `✓ Bước ${idx + 1}` : `Bước ${idx + 1}`}
                </div>
              );
            })}
          </div>

          {/* Center Visual + Step Breakdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              opacity: cardEnter,
              transform: `translateY(${(1 - cardEnter) * 30}px)`,
            }}
          >
            {!hienThi3D ? (
              <div
                style={{
                  width: "100%",
                  height: 520,
                  borderRadius: 28,
                  overflow: "hidden",
                  border: `4px solid ${mauChuDao}`,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                  backgroundColor: "#0f172a",
                }}
              >
                {activeScene.hinhAnhCanh && (
                  <Img
                    src={staticFile(activeScene.hinhAnhCanh)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${1 + sceneProgress * 0.08})`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 500,
                  borderRadius: 28,
                  border: `2px solid ${mauPhu}55`,
                  backgroundColor: "rgba(10, 15, 29, 0.78)",
                  overflow: "hidden",
                }}
              >
                <ThreeCanvas width={width - 112} height={500}>
                  <ambientLight intensity={1.25} />
                  <directionalLight position={[4, 6, 5]} intensity={2.2} />
                  <pointLight position={[-3, 2, 4]} intensity={2.4} color={mauChuDao} />
                  <pointLight position={[3, -2, 3]} intensity={2.2} color={mauPhu} />
                  <group
                    rotation={[
                      frame * 0.018 + currentSceneIndex * 0.5,
                      frame * 0.032 + currentSceneIndex * 0.8,
                      0,
                    ]}
                  >
                    <mesh>
                      <octahedronGeometry args={[1.65, 0]} />
                      <meshStandardMaterial
                        color={mauChuDao}
                        emissive={mauChuDao}
                        emissiveIntensity={0.25}
                        metalness={0.35}
                        roughness={0.2}
                      />
                    </mesh>
                  </group>
                </ThreeCanvas>
              </div>
            )}

            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                border: `2px solid ${mauChuDao}88`,
                borderRadius: 28,
                padding: "28px 34px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", lineHeight: 1.15 }}>
                {activeScene.tieuDeCanh}
              </div>
              <div style={{ fontSize: 29, fontWeight: 600, color: "#cbd5e1", lineHeight: 1.4 }}>
                {activeScene.noiDungCanh}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                {visualItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: "#131c31",
                      borderLeft: `6px solid ${idx % 2 === 0 ? mauChuDao : mauPhu}`,
                      padding: "12px 20px",
                      borderRadius: 14,
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#f8fafc",
                    }}
                  >
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {renderSubtitles()}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
