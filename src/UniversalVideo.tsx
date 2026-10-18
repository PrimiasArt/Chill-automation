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
    .enum(["illustration", "terminal", "flowchart", "checklist", "progress", "cards"])
    .optional(),
  duLieuMinhHoa: z.array(z.string()).optional(),
});

export const UniversalVideoSchema = z.object({
  theLoai: z
    .enum(["kien-thuc", "ke-chuyen", "quang-cao", "cong-nghe"])
    .describe("Thể loại bố cục video"),
  tieuDeChinh: z.string().describe("Tiêu đề chính của Video"),
  tenKenh: z.string().describe("Tên kênh / Thương hiệu"),
  loiThoai: z.string().describe("Toàn bộ kịch bản lời thoại AI Tiếng Việt"),
  batGiongDoc: z.boolean().describe("Bật giọng đọc AI Tiếng Việt (Độc lập với phụ đề)"),
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
    .describe("True = Khối 3D, False = Hoạt hình 2D Vector & Minh họa động"),
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
  tieuDeChinh = "Dự Án Video Sáng Tạo Mới",
  tenKenh = "CHILL ARGON STUDIO",
  loiThoai = "",
  batGiongDoc = true,
  batPhuDe = true,
  kieuNhacNen = "chill",
  batNhacNen = true,
  mauChuDao = "#d4ff47",
  mauPhu = "#00f0ff",
  mauNen = "#0b0f19",
  hienThi3D = false,
  cacPhanCanh = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  const scenes =
    cacPhanCanh.length > 0
      ? cacPhanCanh
      : [
          {
            tieuDeCanh: tieuDeChinh,
            noiDungCanh: loiThoai || "Nội dung tự động tạo bởi Chill Studio",
            nhanPhu: "BƯỚC 01",
            conSoNoiBat: "01",
            loaiMinhHoa2D: "flowchart" as const,
            duLieuMinhHoa: ["GitHub Repo", "Clone về máy", "Cài đặt & Chạy"],
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

  // Smooth card entrance animation per scene
  const cardEnter = interpolate(frameInScene, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Scene internal progress (0 -> 1)
  const sceneProgress = interpolate(
    frameInScene,
    [8, Math.max(25, framesPerScene - 15)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Procedural ambient floating noise
  const floatX = noise2D("ux", frame * 0.01, 0) * 18;
  const floatY = noise2D("uy", 0, frame * 0.01) * 18;

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

  const windowSize = 14;
  const windowIndex = Math.floor(activeWordGlobalIdx / windowSize);
  const windowStart = windowIndex * windowSize;
  const visibleWords = allWords.slice(windowStart, windowStart + windowSize);

  const progressPct = Math.min(
    100,
    Math.round((frame / Math.max(1, durationInFrames - 1)) * 100),
  );

  const eqBars = Array.from({ length: 28 }, (_, idx) => {
    const wave =
      Math.abs(Math.sin(frame * 0.2 + idx * 0.45)) * 0.65 +
      Math.abs(Math.cos(frame * 0.12 - idx * 0.3)) * 0.35;
    return Math.max(10, Math.round(wave * 68));
  });

  const visualMode2D =
    activeScene.loaiMinhHoa2D ||
    (["flowchart", "terminal", "checklist", "progress", "cards"][
      currentSceneIndex % 5
    ] as "terminal" | "flowchart" | "checklist" | "progress" | "cards");

  const visualItems =
    activeScene.duLieuMinhHoa && activeScene.duLieuMinhHoa.length > 0
      ? activeScene.duLieuMinhHoa
      : [
          "1. Mở link GitHub Repository",
          "2. Tải về máy (git clone / Download ZIP)",
          "3. Chạy lệnh cài đặt tự động & Sử dụng!",
        ];

  const bgmFile =
    kieuNhacNen === "energetic" ? "mecha-cat-beat.mp3" : "chill-bgm.mp3";

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
          <Audio src={idx === 0 ? whip : whoosh} volume={0.32} />
        </Sequence>
      ))}

      {/* Dynamic Ambient Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${50 + floatX * 0.5}% ${35 + floatY * 0.5}%, ${mauChuDao}24 0%, ${mauPhu}18 40%, ${mauNen} 80%)`,
        }}
      />

      {/* Top Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${mauChuDao}, ${mauPhu})`,
          }}
        />
      </div>

      <AbsoluteFill
        style={{
          padding: "70px 60px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* === TOP STEP TRACKER BAR (Like Docs Reference Video) === */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              border: `2px solid ${mauChuDao}55`,
              borderRadius: 22,
              padding: "16px 26px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: mauChuDao,
                  boxShadow: `0 0 16px ${mauChuDao}`,
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 23,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "#f8fafc",
                }}
              >
                {tenKenh}
              </span>
            </div>

            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                color: mauPhu,
                backgroundColor: "rgba(0,0,0,0.45)",
                padding: "6px 16px",
                borderRadius: 999,
              }}
            >
              {`BƯỚC ${currentSceneIndex + 1}/${sceneCount} · ${Math.round(frame / fps)}s/${Math.round(durationInFrames / fps)}s`}
            </div>
          </div>

          {/* Step Pills Row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            {scenes.map((sc, idx) => {
              const isDone = idx < currentSceneIndex;
              const isCurr = idx === currentSceneIndex;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 14,
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontSize: 19,
                    fontWeight: 800,
                    backgroundColor: isCurr
                      ? mauChuDao
                      : isDone
                        ? "rgba(212,255,71,0.14)"
                        : "rgba(255,255,255,0.05)",
                    color: isCurr
                      ? "#050811"
                      : isDone
                        ? mauChuDao
                        : "#64748b",
                    border: isCurr
                      ? `2px solid ${mauChuDao}`
                      : "2px solid transparent",
                  }}
                >
                  {isDone ? `✓ B.${idx + 1}` : `Bước ${idx + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* === CENTER ANIMATED STAGE (2D MOTION GRAPHICS OR 3D) === */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            opacity: cardEnter,
            translate: `0px ${Math.round((1 - cardEnter) * 36)}px`,
          }}
        >
          {/* Scene Title & Description Card */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: `2px solid ${mauChuDao}`,
              borderRadius: 30,
              padding: "34px 40px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  backgroundColor: mauChuDao,
                  color: "#050811",
                  padding: "6px 18px",
                  borderRadius: 999,
                  fontFamily: "monospace",
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                {activeScene.nhanPhu || `BƯỚC 0${currentSceneIndex + 1}`}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  color: mauPhu,
                  fontWeight: 700,
                }}
              >
                {tieuDeChinh}
              </span>
            </div>

            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1.15,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              {activeScene.tieuDeCanh}
            </div>

            <div
              style={{
                fontSize: 34,
                fontWeight: 600,
                lineHeight: 1.4,
                color: "#cbd5e1",
              }}
            >
              {activeScene.noiDungCanh}
            </div>
          </div>

          {/* === 2D ANIMATED ILLUSTRATION CANVAS (WHEN hienThi3D === false) === */}
          {!hienThi3D ? (
            <div
              style={{
                width: "100%",
                minHeight: 490,
                borderRadius: 30,
                border: `2px solid ${mauPhu}66`,
                backgroundColor: "#090d18",
                padding: "32px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Window Top Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "#facc15",
                    }}
                  />
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 21,
                      color: "#94a3b8",
                      marginLeft: 12,
                    }}
                  >
                    {activeScene.nhanPhu || `CẢNH 0${currentSceneIndex + 1} · MINH HỌA 2D`}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 20,
                    color: mauChuDao,
                    fontWeight: 700,
                  }}
                >
                  2D MOTION LIVE
                </span>
              </div>

              {/* CUSTOM GENERATED 2D ILLUSTRATION IMAGE FOR THIS SCENE */}
              {activeScene.hinhAnhCanh && (
                <div
                  style={{
                    width: "100%",
                    height: visualMode2D === "illustration" ? 410 : 250,
                    borderRadius: 22,
                    overflow: "hidden",
                    border: `2px solid ${mauChuDao}66`,
                    marginBottom: 18,
                    position: "relative",
                    backgroundColor: "#0f172a",
                    flexShrink: 0,
                  }}
                >
                  <Img
                    src={staticFile(activeScene.hinhAnhCanh)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${1 + sceneProgress * 0.08}) translateY(${Math.sin(frame * 0.06) * 4}px)`,
                    }}
                  />
                </div>
              )}

              {/* 2D MODE 0: ILLUSTRATION + KEY POINTS */}
              {visualMode2D === "illustration" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    margin: "auto 0",
                  }}
                >
                  {visualItems.slice(0, 2).map((itemText, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#131c31",
                        borderLeft: `8px solid ${idx % 2 === 0 ? mauChuDao : mauPhu}`,
                        borderRadius: 16,
                        padding: "16px 24px",
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {itemText}
                    </div>
                  ))}
                </div>
              )}

              {/* 2D MODE 1: ANIMATED TERMINAL TYPING */}
              {visualMode2D === "terminal" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    margin: "auto 0",
                    fontFamily: "monospace",
                  }}
                >
                  {visualItems.map((line, lIdx) => {
                    const lineStart = lIdx / visualItems.length;
                    const lineProg = interpolate(
                      sceneProgress,
                      [lineStart, lineStart + 0.35],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                    );
                    const charsToShow = Math.floor(line.length * lineProg);
                    return (
                      <div
                        key={lIdx}
                        style={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: `2px solid ${lineProg > 0.9 ? mauChuDao : "#1e293b"}`,
                          borderRadius: 18,
                          padding: "16px 24px",
                          fontSize: 28,
                          fontWeight: 700,
                          color: lIdx % 2 === 0 ? mauChuDao : mauPhu,
                          opacity: lineProg > 0 ? 1 : 0.25,
                        }}
                      >
                        <span>{line.slice(0, charsToShow)}</span>
                        {lineProg > 0 && lineProg < 1 && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 16,
                              height: 28,
                              backgroundColor: mauChuDao,
                              marginLeft: 6,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2D MODE 2: ANIMATED FLOWCHART / ARCHITECTURE DIAGRAM */}
              {visualMode2D === "flowchart" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    margin: "auto 0",
                  }}
                >
                  {visualItems.map((nodeText, nIdx) => {
                    const nodeEnter = interpolate(
                      frameInScene,
                      [nIdx * 12, nIdx * 12 + 20],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                      },
                    );
                    return (
                      <div
                        key={nIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 18,
                          scale: 0.85 + nodeEnter * 0.15,
                          opacity: nodeEnter,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 18,
                            backgroundColor:
                              nIdx % 2 === 0 ? mauChuDao : mauPhu,
                            color: "#050811",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                            fontWeight: 900,
                            fontFamily: "monospace",
                            flexShrink: 0,
                          }}
                        >
                          {`0${nIdx + 1}`}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: "#131c31",
                            border: `2px solid ${nIdx % 2 === 0 ? mauChuDao : mauPhu}`,
                            borderRadius: 18,
                            padding: "16px 24px",
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#f8fafc",
                          }}
                        >
                          {nodeText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2D MODE 3: ANIMATED CHECKLIST */}
              {visualMode2D === "checklist" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    margin: "auto 0",
                  }}
                >
                  {visualItems.map((itemText, cIdx) => {
                    const checked =
                      sceneProgress > (cIdx + 0.35) / visualItems.length;
                    return (
                      <div
                        key={cIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 18,
                          backgroundColor: checked
                            ? "rgba(212, 255, 71, 0.1)"
                            : "#111827",
                          border: `2px solid ${checked ? mauChuDao : "#26324d"}`,
                          borderRadius: 18,
                          padding: "16px 24px",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: checked
                              ? mauChuDao
                              : "transparent",
                            border: `3px solid ${checked ? mauChuDao : "#64748b"}`,
                            color: "#050811",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 26,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {checked ? "✓" : ""}
                        </div>
                        <span
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: checked ? "#ffffff" : "#94a3b8",
                          }}
                        >
                          {itemText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2D MODE 4: ANIMATED PROGRESS & METRICS */}
              {visualMode2D === "progress" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    margin: "auto 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 26,
                        color: mauPhu,
                        fontWeight: 700,
                      }}
                    >
                      {activeScene.nhanPhu || "TIẾN ĐỘ THỰC HIỆN"}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 64,
                        fontWeight: 900,
                        color: mauChuDao,
                      }}
                    >
                      {`${Math.round(sceneProgress * 100)}%`}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 32,
                      backgroundColor: "#162038",
                      borderRadius: 999,
                      overflow: "hidden",
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(8, Math.round(sceneProgress * 100))}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${mauPhu}, ${mauChuDao})`,
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {visualItems.map((tag, tIdx) => (
                      <div
                        key={tIdx}
                        style={{
                          flex: 1,
                          minWidth: 240,
                          backgroundColor: "#131c31",
                          border: `2px solid ${mauChuDao}88`,
                          borderRadius: 16,
                          padding: "14px 20px",
                          fontSize: 25,
                          fontWeight: 700,
                          color: "#f8fafc",
                        }}
                      >
                        {`✓ ${tag}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2D MODE 5: BOUNCING FEATURE CARDS */}
              {visualMode2D === "cards" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                    margin: "auto 0",
                  }}
                >
                  {visualItems.map((cardText, kIdx) => {
                    const floatOffset =
                      Math.sin(frame * 0.1 + kIdx * 1.4) * 6;
                    return (
                      <div
                        key={kIdx}
                        style={{
                          backgroundColor: "#131c31",
                          borderLeft: `10px solid ${kIdx % 2 === 0 ? mauChuDao : mauPhu}`,
                          borderRadius: 18,
                          padding: "18px 24px",
                          fontSize: 28,
                          fontWeight: 700,
                          color: "#ffffff",
                          translate: `0px ${floatOffset}px`,
                          boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                        }}
                      >
                        {cardText}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* === 3D VISUAL SHOWCASE BOX (WHEN hienThi3D === true) === */
            <div
              style={{
                width: "100%",
                height: 460,
                borderRadius: 28,
                border: `2px solid ${mauPhu}55`,
                backgroundColor: "rgba(10, 15, 29, 0.78)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <ThreeCanvas width={width - 120} height={460}>
                <ambientLight intensity={1.25} />
                <directionalLight position={[4, 6, 5]} intensity={2.2} />
                <pointLight
                  position={[-3, 2, 4]}
                  intensity={2.4}
                  color={mauChuDao}
                />
                <pointLight
                  position={[3, -2, 3]}
                  intensity={2.2}
                  color={mauPhu}
                />
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
                  <mesh rotation={[Math.PI / 2.5, 0, frame * 0.02]}>
                    <torusGeometry args={[2.25, 0.05, 16, 48]} />
                    <meshStandardMaterial
                      color="#ffffff"
                      emissive={mauPhu}
                      emissiveIntensity={1.6}
                    />
                  </mesh>
                </group>
              </ThreeCanvas>
            </div>
          )}
        </div>

        {/* === FOOTER: KARAOKE CAPTIONS (CONTROLLED INDEPENDENTLY BY batPhuDe) & AUDIO WAVEFORM === */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {batPhuDe !== false && visibleWords.length > 0 && (
            <div
              style={{
                backgroundColor: "rgba(5, 8, 17, 0.92)",
                border: `2px solid ${mauPhu}88`,
                borderRadius: 22,
                padding: "18px 26px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px 11px",
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
                      fontSize: 33,
                      fontWeight: 800,
                      padding: "2px 9px",
                      borderRadius: 9,
                      backgroundColor: isCurrent ? mauChuDao : "transparent",
                      color: isCurrent
                        ? "#050811"
                        : isSpoken
                          ? mauPhu
                          : "#f8fafc",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              height: 58,
              gap: 8,
              backgroundColor: "rgba(10, 14, 26, 0.75)",
              padding: "10px 22px",
              borderRadius: 18,
            }}
          >
            {eqBars.map((barH, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: barH,
                  borderRadius: 5,
                  background: idx % 2 === 0 ? mauChuDao : mauPhu,
                }}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
