import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { z } from "zod";

export const ArgonVideoSchema = z.object({
  tieuDeChinh: z.string().describe("Tiêu đề chính (Dòng 1)"),
  tieuDePhu: z.string().describe("Tiêu đề nổi bật (Dòng 2)"),
  dongGhiChu: z.string().describe("Dòng trạng thái phía trên"),
  mauChuDao: z.string().describe("Màu chủ đạo (Mã màu HEX)"),
  mauNen: z.string().describe("Màu nền video (Mã màu HEX)"),
  tocDoXoay3D: z.number().min(0).max(5).step(0.5).describe("Tốc độ xoay khối 3D"),
  hienThi3D: z.boolean().describe("Bật / Tắt khung 3D"),
});

export type ArgonVideoProps = z.infer<typeof ArgonVideoSchema>;

const PIPELINE_STEPS = [
  "brief",
  "design",
  "animate",
  "build",
  "sound",
  "render",
  "review",
  "ship",
] as const;

const REPO_BADGES = [
  "RS",
  "MA",
  "GS",
  "SVGO",
  "Sat",
  "GSAP",
  "Ani",
  "Mo",
  "Rive",
  "Lot",
  "Rmo",
  "MC",
  "3JS",
  "R3F",
  "Drei",
  "Rap",
  "PP",
  "How",
  "MB",
  "FF",
] as const;

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="Argon20ReposReady"
      component={ArgonPipelinePreview}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
      schema={ArgonVideoSchema}
      defaultProps={{
        tieuDeChinh: "20 repo GitHub",
        tieuDePhu: "Argon tự làm video A → Z",
        dongGhiChu: "> /skills · gemini-4-argon",
        mauChuDao: "#d4ff47",
        mauNen: "#0a0a0a",
        tocDoXoay3D: 1,
        hienThi3D: true,
      }}
    />
  );
};

export const ArgonPipelinePreview: React.FC<ArgonVideoProps> = ({
  tieuDeChinh,
  tieuDePhu,
  dongGhiChu,
  mauChuDao,
  mauNen,
  tocDoXoay3D,
  hienThi3D,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const activeStepIndex = Math.min(
    PIPELINE_STEPS.length - 1,
    Math.floor(
      interpolate(frame, [0, 5 * fps], [0, PIPELINE_STEPS.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );

  const activeRepoCount = Math.floor(
    interpolate(frame, [0.5 * fps, 4.5 * fps], [0, REPO_BADGES.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const cubeRotationY = frame * 0.035 * tocDoXoay3D;
  const cubeRotationX = frame * 0.02 * tocDoXoay3D;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: mauNen,
        color: "#f5f5f0",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        padding: "96px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top 7-Step Pipeline Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "monospace",
          fontSize: 28,
          letterSpacing: "-0.02em",
        }}
      >
        {PIPELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          return (
            <div
              key={step}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                color: isCurrent
                  ? "#f5f5f0"
                  : isCompleted
                    ? mauChuDao
                    : "#525252",
                fontWeight: isCurrent ? 700 : 500,
              }}
            >
              <span>{isCompleted ? `✓${step}` : step}</span>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: isCurrent ? mauChuDao : "transparent",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Center Hero + 3D Preview Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 36,
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 30,
            color: "#a3a3a3",
          }}
        >
          {dongGhiChu}
        </div>

        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(
              frame,
              [0, 0.6 * fps],
              ["0px 30px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          <div>{tieuDeChinh}</div>
          <div style={{ color: mauChuDao, marginTop: 12 }}>{tieuDePhu}</div>
        </div>

        {/* 3D Canvas Preview Box */}
        {hienThi3D && (
          <div
            style={{
              width: "100%",
              height: 520,
              borderRadius: 24,
              border: "2px solid #262626",
              backgroundColor: "#121212",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <ThreeCanvas width={width - 144} height={520}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[4, 6, 5]} intensity={1.2} />
              <mesh rotation={[cubeRotationX, cubeRotationY, 0]}>
                <boxGeometry args={[2.1, 2.1, 2.1]} />
                <meshStandardMaterial
                  color={mauChuDao}
                  roughness={0.25}
                  metalness={0.2}
                />
              </mesh>
            </ThreeCanvas>
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 32,
                fontFamily: "monospace",
                fontSize: 24,
                color: "#a3a3a3",
              }}
            >
              {`ThreeCanvas · frame ${frame} / ${6 * fps}`}
            </div>
          </div>
        )}
      </div>

      {/* Bottom 20-Repo Grid Tracker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 16,
          }}
        >
          {REPO_BADGES.map((badge, index) => {
            const unlocked = index < activeRepoCount;
            return (
              <div
                key={badge}
                style={{
                  height: 76,
                  borderRadius: 16,
                  border: unlocked
                    ? `2px solid ${mauChuDao}`
                    : "2px dashed #404040",
                  backgroundColor: unlocked ? mauChuDao : "transparent",
                  color: unlocked ? "#0a0a0a" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 32,
            color: "#a3a3a3",
          }}
        >
          {`${activeRepoCount}/20 repo đã tích hợp sẵn`}
        </div>
      </div>
    </AbsoluteFill>
  );
};
