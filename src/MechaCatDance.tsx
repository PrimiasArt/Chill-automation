import React from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
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

export const MechaCatSchema = z.object({
  nhanVat3D: z
    .enum(["meo-mecha", "cho-shiba", "robot-gundam", "phi-hanh-gia"])
    .describe("Nhân vật 3D"),
  kieuNhay: z
    .enum(["disco", "hiphop", "breakdance", "martial"])
    .describe("Kiểu vũ đạo 3D"),
  hieuUngDacBiet: z
    .enum(["canh-nang-luong", "tia-set", "vong-hao-quang", "khong"])
    .describe("Trang bị / Hiệu ứng 3D"),
  tenSieuNhan: z.string().describe("Tên Nhân Vật (Trên HUD)"),
  khauHieu: z.string().describe("Khẩu hiệu / Dòng chữ dưới"),
  loiThoai: z.string().describe("Lời thoại AI đọc Tiếng Việt & Phụ đề Karaoke"),
  batGiongDoc: z.boolean().describe("Bật giọng đọc AI Tiếng Việt"),
  mauGiapChinh: z.string().describe("Màu giáp chính (HEX)"),
  mauNangLuong: z.string().describe("Màu năng lượng Neon (HEX)"),
  mauAoChoang: z.string().describe("Màu phụ kiện / Áo choàng (HEX)"),
  tocDoNhay: z
    .number()
    .min(0.5)
    .max(2)
    .step(0.1)
    .describe("Tốc độ nhảy (Hệ số nhịp)"),
});

export type MechaCatProps = z.infer<typeof MechaCatSchema>;

const DANCE_MOVES = [
  "PHASE 01 // CYBER GROOVE IGNITION",
  "PHASE 02 // NEON WAVE OVERDRIVE",
  "PHASE 03 // SUPERHERO SHUFFLE",
  "PHASE 04 // HYPER SPIN FINALE",
] as const;

export const MechaCatDance: React.FC<MechaCatProps> = ({
  nhanVat3D = "meo-mecha",
  kieuNhay = "disco",
  hieuUngDacBiet = "canh-nang-luong",
  tenSieuNhan,
  khauHieu,
  loiThoai = "Xin chào các bạn! Mình là Mèo Siêu Nhân Mecha đây, cùng quẩy thật sung nhé!",
  batGiongDoc = true,
  mauGiapChinh,
  mauNangLuong,
  mauAoChoang,
  tocDoNhay,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const t = (frame / fps) * tocDoNhay;
  const bpm = 128;
  const beatFreq = (bpm / 60) * Math.PI * 2;
  const beatPhase = t * beatFreq;

  // Beat pulse (0 -> 1 -> 0 on every beat)
  const beatPulse = Math.pow(Math.max(0, Math.sin(beatPhase)), 2);
  const halfBeatSin = Math.sin(beatPhase * 0.5);
  const halfBeatCos = Math.cos(beatPhase * 0.5);

  // Determine current dance phase (0..3 across 6 seconds)
  const moveIndex = Math.min(3, Math.floor((frame / (6 * fps)) * 4));

  // Smooth procedural camera noise from @remotion/noise
  const camNoiseX = noise2D("camX", frame * 0.015, 0) * 0.18;
  const camNoiseY = noise2D("camY", 0, frame * 0.015) * 0.12;

  // Whole body choreography adjusted by kieuNhay
  const bounceAmp = kieuNhay === "hiphop" ? 0.38 : kieuNhay === "martial" ? 0.34 : 0.3;
  const bodyBounceY = Math.abs(Math.sin(beatPhase)) * bounceAmp - 0.08;
  const bodySwayX =
    kieuNhay === "hiphop"
      ? halfBeatSin * 0.52
      : kieuNhay === "breakdance"
        ? Math.sin(beatPhase) * 0.42
        : halfBeatSin * 0.36;

  // Spin choreography
  const finaleSpin =
    kieuNhay === "breakdance"
      ? (frame / (6 * fps)) * Math.PI * 6
      : interpolate(frame, [4.5 * fps, 5.4 * fps], [0, Math.PI * 2], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        });

  const bodyRotY = halfBeatSin * 0.38 + finaleSpin;
  const bodyTiltZ = halfBeatCos * (kieuNhay === "hiphop" ? 0.18 : 0.12);

  // Head choreography
  const headNodX = Math.sin(beatPhase) * 0.18 - 0.05;
  const headTiltZ = -halfBeatSin * 0.22;
  const headTurnY = halfBeatCos * 0.25;
  const earTwitch = Math.sin(beatPhase * 2) * 0.14;

  // Arm choreography
  let leftArmZ = -0.6;
  let leftArmX = 0;
  let rightArmZ = 0.6;
  let rightArmX = 0;
  let leftForearmZ = -0.35;
  let rightForearmZ = 0.35;

  if (kieuNhay === "martial") {
    leftArmZ = -1.2 - Math.abs(Math.sin(beatPhase)) * 0.8;
    rightArmZ = 1.2 + Math.abs(Math.cos(beatPhase)) * 0.8;
    leftArmX = -0.85 + Math.sin(beatPhase) * 0.75;
    rightArmX = -0.85 - Math.sin(beatPhase) * 0.75;
    leftForearmZ = -0.65;
    rightForearmZ = 0.65;
  } else if (moveIndex === 0) {
    leftArmZ = -1.35 - Math.sin(beatPhase * 0.5) * 0.95;
    rightArmZ = 1.35 - Math.sin(beatPhase * 0.5) * 0.95;
    leftArmX = -0.25 + Math.cos(beatPhase * 0.5) * 0.35;
    rightArmX = -0.25 - Math.cos(beatPhase * 0.5) * 0.35;
    leftForearmZ = -0.45 + Math.sin(beatPhase) * 0.3;
    rightForearmZ = 0.45 - Math.sin(beatPhase) * 0.3;
  } else if (moveIndex === 1) {
    leftArmZ = -1.85 + Math.sin(beatPhase) * 0.45;
    rightArmZ = 1.85 + Math.cos(beatPhase) * 0.45;
    leftArmX = -0.35 + Math.sin(beatPhase * 0.5) * 0.25;
    rightArmX = -0.35 - Math.sin(beatPhase * 0.5) * 0.25;
    leftForearmZ = -0.55 + Math.cos(beatPhase) * 0.45;
    rightForearmZ = 0.55 - Math.sin(beatPhase) * 0.45;
  } else if (moveIndex === 2) {
    leftArmZ = -1.1 + halfBeatSin * 0.7;
    rightArmZ = 1.1 + halfBeatSin * 0.7;
    leftArmX = -0.75 + Math.sin(beatPhase) * 0.55;
    rightArmX = -0.75 - Math.sin(beatPhase) * 0.55;
    leftForearmZ = -0.5;
    rightForearmZ = 0.5;
  } else {
    leftArmZ = -2.35 - Math.sin(beatPhase) * 0.22;
    rightArmZ = 2.35 + Math.sin(beatPhase) * 0.22;
    leftArmX = -0.25;
    rightArmX = -0.25;
    leftForearmZ = -0.2;
    rightForearmZ = 0.2;
  }

  // Leg choreography
  const leftLegX = Math.max(0, Math.sin(beatPhase * 0.5)) * 0.55 - 0.15;
  const rightLegX = Math.max(0, -Math.sin(beatPhase * 0.5)) * 0.55 - 0.15;
  const leftLegZ = -0.1 - Math.max(0, halfBeatSin) * 0.2;
  const rightLegZ = 0.1 + Math.max(0, -halfBeatSin) * 0.2;

  // Camera subtle orbit + Perlin noise
  const camX = Math.sin(t * 0.9) * 0.45 + camNoiseX;
  const camY = 0.52 + Math.sin(beatPhase) * 0.05 + camNoiseY;

  // Word-by-Word Karaoke Caption Calculation
  const words = loiThoai.trim().split(/\s+/).filter(Boolean);
  const activeWordIndex = Math.floor(
    interpolate(frame, [8, 165], [0, words.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Equalizer bars for 2D HUD
  const eqBars = Array.from({ length: 24 }, (_, idx) => {
    const wave =
      Math.abs(Math.sin(beatPhase + idx * 0.45)) * 0.65 +
      Math.abs(Math.cos(beatPhase * 0.5 - idx * 0.3)) * 0.35;
    return Math.max(12, Math.round(wave * 76));
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#060814",
        color: "#f8fafc",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Music Track (Lower volume slightly when voiceover is active) */}
      <Audio
        src={staticFile("mecha-cat-beat.mp3")}
        volume={batGiongDoc ? 0.38 : 0.95}
      />

      {/* Built-in Remotion SFX on Dance Phase Transitions */}
      <Audio from={0} src={whip} volume={0.45} />
      <Audio from={45} src={whoosh} volume={0.4} />
      <Audio from={90} src={whoosh} volume={0.4} />
      <Audio from={135} src={whip} volume={0.5} />

      {/* Vietnamese AI Neural Voiceover (msedge-tts) */}
      {batGiongDoc && (
        <Audio from={5} src={staticFile("voiceover.mp3")} volume={1.0} />
      )}

      {/* Background Radial Cyber Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 44%, ${mauNangLuong}42 0%, ${mauAoChoang}26 42%, #05070f 78%)`,
        }}
      />

      {/* 3D Scene */}
      <ThreeCanvas width={width} height={height}>
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[4, 7, 6]}
          intensity={2.4}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, 4, 5]}
          intensity={1.6}
          color="#e0f2fe"
        />
        <pointLight
          position={[-4, 3, 4]}
          intensity={2.8 + beatPulse * 1.6}
          color={mauNangLuong}
        />
        <pointLight
          position={[4, 2, 3]}
          intensity={2.5 + beatPulse * 1.6}
          color={mauAoChoang}
        />

        <group position={[-camX * 0.3, -0.46 - camY * 0.15, -0.35]}>
          {/* === REACTIVE CYBER DANCE FLOOR === */}
          <group position={[0, -1.85, 0]}>
            <mesh position={[0, -0.12, 0]} rotation={[0, frame * 0.01, 0]}>
              <cylinderGeometry args={[2.9, 3.2, 0.22, 8]} />
              <meshStandardMaterial
                color="#0f172a"
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>

            <mesh
              position={[0, 0.01, 0]}
              rotation={[Math.PI / 2, 0, frame * 0.02]}
            >
              <torusGeometry args={[2.75, 0.055, 16, 48]} />
              <meshStandardMaterial
                color={mauNangLuong}
                emissive={mauNangLuong}
                emissiveIntensity={1.5 + beatPulse}
              />
            </mesh>

            <mesh
              position={[0, 0.02, 0]}
              rotation={[Math.PI / 2, 0, -frame * 0.03]}
              scale={0.9 + beatPulse * 0.18}
            >
              <torusGeometry args={[1.65, 0.04, 16, 36]} />
              <meshStandardMaterial
                color={mauAoChoang}
                emissive={mauAoChoang}
                emissiveIntensity={1.6}
              />
            </mesh>

            {[-1.05, -0.35, 0.35, 1.05].map((tx, xi) =>
              [-1.05, -0.35, 0.35, 1.05].map((tz, zi) => {
                const isLit =
                  (xi + zi + Math.floor(t * (bpm / 60) * 2)) % 3 === 0;
                const tileColor =
                  (xi + zi) % 2 === 0 ? mauNangLuong : mauAoChoang;
                return (
                  <mesh key={`${xi}-${zi}`} position={[tx, 0.01, tz]}>
                    <boxGeometry args={[0.6, 0.04, 0.6]} />
                    <meshStandardMaterial
                      color={isLit ? tileColor : "#1e293b"}
                      emissive={isLit ? tileColor : "#000000"}
                      emissiveIntensity={isLit ? 1.1 + beatPulse * 0.8 : 0}
                      metalness={0.4}
                      roughness={0.35}
                    />
                  </mesh>
                );
              }),
            )}
          </group>

          {/* === FLOATING HOLOGRAM ENERGY RINGS & PARTICLES === */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx / 6) * Math.PI * 2 + t * 1.4;
            const radius = 2.35 + Math.sin(t * 3 + idx) * 0.2;
            const py =
              -0.8 + ((idx * 0.55 + t * 1.2) % 3.2) + beatPulse * 0.15;
            const orbColor = idx % 2 === 0 ? mauNangLuong : mauAoChoang;
            return (
              <mesh
                key={idx}
                position={[
                  Math.cos(angle) * radius,
                  py,
                  Math.sin(angle) * radius - 0.5,
                ]}
                rotation={[frame * 0.04, frame * 0.05, 0]}
              >
                <octahedronGeometry args={[0.14 + beatPulse * 0.05, 0]} />
                <meshStandardMaterial
                  color={orbColor}
                  emissive={orbColor}
                  emissiveIntensity={1.8}
                />
              </mesh>
            );
          })}

          {/* === MAIN 3D CHARACTER RIG === */}
          <group
            position={[bodySwayX, bodyBounceY, 0]}
            rotation={[0, bodyRotY, bodyTiltZ]}
          >
            {/* --- SPECIAL EFFECT: ORBITING LIGHTNING RINGS (tia-set) --- */}
            {hieuUngDacBiet === "tia-set" && (
              <group position={[0, 0.3, 0]}>
                <mesh rotation={[Math.PI / 3, frame * 0.08, 0]}>
                  <torusGeometry args={[1.65, 0.035, 12, 36]} />
                  <meshStandardMaterial
                    color="#d4ff47"
                    emissive="#d4ff47"
                    emissiveIntensity={2.5}
                  />
                </mesh>
                <mesh rotation={[-Math.PI / 3, -frame * 0.08, 0]}>
                  <torusGeometry args={[1.65, 0.035, 12, 36]} />
                  <meshStandardMaterial
                    color={mauNangLuong}
                    emissive={mauNangLuong}
                    emissiveIntensity={2.5}
                  />
                </mesh>
              </group>
            )}

            {/* --- SPECIAL EFFECT: COSMIC HALO (vong-hao-quang) --- */}
            {hieuUngDacBiet === "vong-hao-quang" && (
              <mesh
                position={[0, 2.38, -0.1]}
                rotation={[Math.PI / 2.2, 0, frame * 0.05]}
              >
                <torusGeometry args={[0.68, 0.05, 16, 40]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={2.6}
                />
              </mesh>
            )}

            {/* --- HEAD GROUP --- */}
            <group
              position={[0, 1.38, 0]}
              rotation={[headNodX, headTurnY, headTiltZ]}
            >
              {/* Main Helmet / Head */}
              {nhanVat3D === "phi-hanh-gia" ? (
                <mesh>
                  <sphereGeometry args={[0.76, 28, 28]} />
                  <meshStandardMaterial
                    color={mauGiapChinh}
                    emissive={mauGiapChinh}
                    emissiveIntensity={0.2}
                    metalness={0.25}
                    roughness={0.25}
                  />
                </mesh>
              ) : (
                <mesh>
                  <boxGeometry args={[1.34, 1.06, 1.12]} />
                  <meshStandardMaterial
                    color={mauGiapChinh}
                    emissive={mauGiapChinh}
                    emissiveIntensity={0.18}
                    metalness={0.25}
                    roughness={0.32}
                  />
                </mesh>
              )}

              {/* Shiba Dog Snout if cho-shiba */}
              {nhanVat3D === "cho-shiba" && (
                <mesh position={[0, -0.18, 0.65]}>
                  <boxGeometry args={[0.56, 0.36, 0.42]} />
                  <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#f8fafc"
                    emissiveIntensity={0.25}
                  />
                </mesh>
              )}

              {/* Cheek Armor Plates */}
              <mesh position={[-0.66, -0.12, 0.08]}>
                <boxGeometry args={[0.16, 0.52, 0.86]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.4}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0.66, -0.12, 0.08]}>
                <boxGeometry args={[0.16, 0.52, 0.86]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.4}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>

              {/* Forehead Superhero V-Fin Crest */}
              <mesh position={[0, 0.42, 0.58]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.26, 0.26, 0.1]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[-0.26, 0.54, 0.56]} rotation={[0, 0, 0.48]}>
                <boxGeometry
                  args={[
                    nhanVat3D === "robot-gundam" ? 0.78 : 0.52,
                    0.09,
                    0.08,
                  ]}
                />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={1.6}
                />
              </mesh>
              <mesh position={[0.26, 0.54, 0.56]} rotation={[0, 0, -0.48]}>
                <boxGeometry
                  args={[
                    nhanVat3D === "robot-gundam" ? 0.78 : 0.52,
                    0.09,
                    0.08,
                  ]}
                />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={1.6}
                />
              </mesh>

              {/* Dark Cyber Visor Glass */}
              <mesh position={[0, 0.06, 0.54]}>
                <boxGeometry args={[1.14, 0.54, 0.12]} />
                <meshStandardMaterial
                  color="#090d1a"
                  metalness={0.5}
                  roughness={0.15}
                />
              </mesh>

              {/* Glowing Eyes */}
              <mesh
                position={[-0.31, 0.08, 0.61]}
                rotation={[0, 0, 0.14]}
                scale={[1, 0.85 + beatPulse * 0.35, 1]}
              >
                <boxGeometry args={[0.32, 0.16, 0.04]} />
                <meshStandardMaterial
                  color={mauNangLuong}
                  emissive={mauNangLuong}
                  emissiveIntensity={2.2}
                />
              </mesh>
              <mesh
                position={[0.31, 0.08, 0.61]}
                rotation={[0, 0, -0.14]}
                scale={[1, 0.85 + beatPulse * 0.35, 1]}
              >
                <boxGeometry args={[0.32, 0.16, 0.04]} />
                <meshStandardMaterial
                  color={mauNangLuong}
                  emissive={mauNangLuong}
                  emissiveIntensity={2.2}
                />
              </mesh>

              {/* Cute Nose & Talking Mouth */}
              <mesh
                position={[0, -0.12, 0.62]}
                rotation={[0, 0, Math.PI / 4]}
              >
                <boxGeometry args={[0.11, 0.11, 0.05]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh
                position={[0, -0.24, 0.61]}
                scale={[
                  1,
                  batGiongDoc ? 0.6 + Math.abs(Math.sin(frame * 0.45)) * 1.8 : 1,
                  1,
                ]}
              >
                <boxGeometry args={[0.26, 0.06, 0.04]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={1.8}
                />
              </mesh>

              {/* Glowing Laser Whiskers for Cat */}
              {nhanVat3D === "meo-mecha" &&
                [-0.08, -0.2].map((wy, wi) => (
                  <React.Fragment key={wi}>
                    <mesh
                      position={[-0.78, wy, 0.42]}
                      rotation={[0, 0.2, wi * 0.15 - 0.05]}
                    >
                      <boxGeometry args={[0.44, 0.04, 0.04]} />
                      <meshStandardMaterial
                        color={mauNangLuong}
                        emissive={mauNangLuong}
                        emissiveIntensity={2.0}
                      />
                    </mesh>
                    <mesh
                      position={[0.78, wy, 0.42]}
                      rotation={[0, -0.2, -(wi * 0.15 - 0.05)]}
                    >
                      <boxGeometry args={[0.44, 0.04, 0.04]} />
                      <meshStandardMaterial
                        color={mauNangLuong}
                        emissive={mauNangLuong}
                        emissiveIntensity={2.0}
                      />
                    </mesh>
                  </React.Fragment>
                ))}

              {/* Ears / Antennas */}
              {(nhanVat3D === "meo-mecha" || nhanVat3D === "cho-shiba") && (
                <>
                  <group
                    position={[-0.44, 0.72, 0]}
                    rotation={[0, 0, 0.18 + earTwitch]}
                  >
                    <mesh rotation={[0, Math.PI / 4, 0]}>
                      <coneGeometry
                        args={[
                          0.36,
                          nhanVat3D === "cho-shiba" ? 0.76 : 0.64,
                          4,
                        ]}
                      />
                      <meshStandardMaterial
                        color={mauGiapChinh}
                        emissive={mauGiapChinh}
                        emissiveIntensity={0.2}
                        metalness={0.25}
                        roughness={0.3}
                      />
                    </mesh>
                    <mesh
                      position={[0, -0.02, 0.12]}
                      rotation={[0, Math.PI / 4, 0]}
                    >
                      <coneGeometry args={[0.2, 0.44, 4]} />
                      <meshStandardMaterial
                        color={mauAoChoang}
                        emissive={mauAoChoang}
                        emissiveIntensity={1.6}
                      />
                    </mesh>
                  </group>

                  <group
                    position={[0.44, 0.72, 0]}
                    rotation={[0, 0, -0.18 - earTwitch]}
                  >
                    <mesh rotation={[0, Math.PI / 4, 0]}>
                      <coneGeometry
                        args={[
                          0.36,
                          nhanVat3D === "cho-shiba" ? 0.76 : 0.64,
                          4,
                        ]}
                      />
                      <meshStandardMaterial
                        color={mauGiapChinh}
                        emissive={mauGiapChinh}
                        emissiveIntensity={0.2}
                        metalness={0.25}
                        roughness={0.3}
                      />
                    </mesh>
                    <mesh
                      position={[0, -0.02, 0.12]}
                      rotation={[0, Math.PI / 4, 0]}
                    >
                      <coneGeometry args={[0.2, 0.44, 4]} />
                      <meshStandardMaterial
                        color={mauAoChoang}
                        emissive={mauAoChoang}
                        emissiveIntensity={1.6}
                      />
                    </mesh>
                  </group>
                </>
              )}
            </group>

            {/* --- TORSO & SUPERHERO ARMOR --- */}
            <group position={[0, 0.18, 0]}>
              <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[1.22, 1.12, 0.78]} />
                <meshStandardMaterial
                  color={mauGiapChinh}
                  emissive={mauGiapChinh}
                  emissiveIntensity={0.18}
                  metalness={0.25}
                  roughness={0.32}
                />
              </mesh>

              <mesh position={[0, 0.22, 0.38]}>
                <boxGeometry args={[0.96, 0.72, 0.1]} />
                <meshStandardMaterial
                  color="#1e293b"
                  metalness={0.4}
                  roughness={0.25}
                />
              </mesh>

              {/* Glowing Superhero Arc Reactor Core on Chest */}
              <mesh
                position={[0, 0.24, 0.45]}
                rotation={[0, 0, Math.PI / 4 + frame * 0.05]}
                scale={1 + beatPulse * 0.22}
              >
                <boxGeometry args={[0.38, 0.38, 0.08]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={2.2}
                />
              </mesh>
              <mesh position={[0, 0.24, 0.48]}>
                <boxGeometry args={[0.2, 0.2, 0.08]} />
                <meshStandardMaterial
                  color={mauNangLuong}
                  emissive={mauNangLuong}
                  emissiveIntensity={2.5}
                />
              </mesh>

              {/* Superhero Championship Belt */}
              <mesh position={[0, -0.38, 0]}>
                <boxGeometry args={[1.26, 0.22, 0.82]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={0.6}
                  metalness={0.3}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0, -0.38, 0.43]}>
                <boxGeometry args={[0.32, 0.26, 0.08]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={1.8}
                />
              </mesh>

              {/* Shoulder Pauldrons */}
              <mesh
                position={[-0.84, 0.56, 0]}
                rotation={[0, 0, 0.28 + beatPulse * 0.1]}
              >
                <boxGeometry args={[0.54, 0.36, 0.66]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.65}
                  metalness={0.3}
                  roughness={0.25}
                />
              </mesh>
              <mesh
                position={[0.84, 0.56, 0]}
                rotation={[0, 0, -0.28 - beatPulse * 0.1]}
              >
                <boxGeometry args={[0.54, 0.36, 0.66]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.65}
                  metalness={0.3}
                  roughness={0.25}
                />
              </mesh>

              {/* --- SPECIAL EFFECT: CYBER ENERGY WINGS (canh-nang-luong) --- */}
              {hieuUngDacBiet === "canh-nang-luong" && (
                <group position={[0, 0.35, -0.45]}>
                  {[-1, 1].map((side) => (
                    <group
                      key={side}
                      rotation={[
                        0,
                        side * (0.25 + beatPulse * 0.2),
                        side * (0.35 + Math.sin(beatPhase) * 0.12),
                      ]}
                    >
                      <mesh position={[side * 1.15, 0.45, 0]}>
                        <boxGeometry args={[1.35, 0.18, 0.05]} />
                        <meshStandardMaterial
                          color={mauNangLuong}
                          emissive={mauNangLuong}
                          emissiveIntensity={2.0}
                        />
                      </mesh>
                      <mesh
                        position={[side * 1.0, 0.12, 0]}
                        rotation={[0, 0, side * -0.2]}
                      >
                        <boxGeometry args={[1.1, 0.15, 0.05]} />
                        <meshStandardMaterial
                          color="#d4ff47"
                          emissive="#d4ff47"
                          emissiveIntensity={1.8}
                        />
                      </mesh>
                      <mesh
                        position={[side * 0.82, -0.2, 0]}
                        rotation={[0, 0, side * -0.4]}
                      >
                        <boxGeometry args={[0.85, 0.12, 0.05]} />
                        <meshStandardMaterial
                          color={mauAoChoang}
                          emissive={mauAoChoang}
                          emissiveIntensity={1.8}
                        />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}

              {/* --- FLOWING SUPERHERO CYBER-CAPE --- */}
              <group
                position={[0, 0.55, -0.44]}
                rotation={[0.32 + beatPulse * 0.18, halfBeatCos * 0.2, 0]}
              >
                <mesh position={[0, -0.45, -0.08]}>
                  <boxGeometry args={[1.45, 0.92, 0.06]} />
                  <meshStandardMaterial
                    color={mauAoChoang}
                    emissive={mauAoChoang}
                    emissiveIntensity={0.65}
                    roughness={0.35}
                  />
                </mesh>
                <mesh
                  position={[0, -1.25, -0.22]}
                  rotation={[Math.sin(beatPhase) * 0.25, 0, 0]}
                >
                  <boxGeometry args={[1.7, 0.88, 0.05]} />
                  <meshStandardMaterial
                    color={mauAoChoang}
                    emissive={mauAoChoang}
                    emissiveIntensity={0.85}
                    roughness={0.35}
                  />
                </mesh>
              </group>

              {/* --- SWAYING MECHA TAIL --- */}
              {(nhanVat3D === "meo-mecha" || nhanVat3D === "cho-shiba") && (
                <group position={[0, -0.42, -0.42]}>
                  {[0, 1, 2, 3, 4].map((seg) => {
                    const tailWave = Math.sin(t * 7 + seg * 0.7) * 0.32;
                    return (
                      <mesh
                        key={seg}
                        position={[
                          tailWave * (seg + 1) * 0.38,
                          seg * 0.22,
                          -0.18 - seg * 0.16,
                        ]}
                        rotation={[0.4, 0, tailWave]}
                      >
                        <sphereGeometry args={[0.14, 12, 12]} />
                        <meshStandardMaterial
                          color={seg === 4 ? "#d4ff47" : mauNangLuong}
                          emissive={seg === 4 ? "#d4ff47" : mauNangLuong}
                          emissiveIntensity={1.8}
                        />
                      </mesh>
                    );
                  })}
                </group>
              )}
            </group>

            {/* --- LEFT DANCING ARM --- */}
            <group
              position={[-0.84, 0.56, 0]}
              rotation={[leftArmX, 0, leftArmZ]}
            >
              <mesh position={[0, -0.32, 0]}>
                <boxGeometry args={[0.3, 0.62, 0.3]} />
                <meshStandardMaterial
                  color={mauGiapChinh}
                  emissive={mauGiapChinh}
                  emissiveIntensity={0.15}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>
              <group
                position={[0, -0.62, 0]}
                rotation={[0, 0, leftForearmZ]}
              >
                <mesh position={[0, -0.28, 0]}>
                  <boxGeometry args={[0.38, 0.56, 0.38]} />
                  <meshStandardMaterial
                    color={mauAoChoang}
                    emissive={mauAoChoang}
                    emissiveIntensity={0.5}
                    metalness={0.3}
                    roughness={0.25}
                  />
                </mesh>
                <mesh position={[0, -0.62, 0]} scale={1 + beatPulse * 0.2}>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial
                    color={mauNangLuong}
                    emissive={mauNangLuong}
                    emissiveIntensity={2.0}
                  />
                </mesh>
              </group>
            </group>

            {/* --- RIGHT DANCING ARM --- */}
            <group
              position={[0.84, 0.56, 0]}
              rotation={[rightArmX, 0, rightArmZ]}
            >
              <mesh position={[0, -0.32, 0]}>
                <boxGeometry args={[0.3, 0.62, 0.3]} />
                <meshStandardMaterial
                  color={mauGiapChinh}
                  emissive={mauGiapChinh}
                  emissiveIntensity={0.15}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>
              <group
                position={[0, -0.62, 0]}
                rotation={[0, 0, rightForearmZ]}
              >
                <mesh position={[0, -0.28, 0]}>
                  <boxGeometry args={[0.38, 0.56, 0.38]} />
                  <meshStandardMaterial
                    color={mauAoChoang}
                    emissive={mauAoChoang}
                    emissiveIntensity={0.5}
                    metalness={0.3}
                    roughness={0.25}
                  />
                </mesh>
                <mesh position={[0, -0.62, 0]} scale={1 + beatPulse * 0.2}>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial
                    color={mauNangLuong}
                    emissive={mauNangLuong}
                    emissiveIntensity={2.0}
                  />
                </mesh>
              </group>
            </group>

            {/* --- LEFT DANCING LEG & ROCKET BOOT --- */}
            <group
              position={[-0.38, -0.38, 0]}
              rotation={[leftLegX, 0, leftLegZ]}
            >
              <mesh position={[0, -0.38, 0]}>
                <boxGeometry args={[0.4, 0.72, 0.44]} />
                <meshStandardMaterial
                  color={mauGiapChinh}
                  emissive={mauGiapChinh}
                  emissiveIntensity={0.18}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, -0.45, 0.24]}>
                <boxGeometry args={[0.28, 0.2, 0.06]} />
                <meshStandardMaterial
                  color={mauNangLuong}
                  emissive={mauNangLuong}
                  emissiveIntensity={1.6}
                />
              </mesh>
              <mesh position={[0, -0.88, 0.06]}>
                <boxGeometry args={[0.48, 0.44, 0.62]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.6}
                  metalness={0.3}
                  roughness={0.25}
                />
              </mesh>
              <mesh position={[0, -1.12, 0.06]}>
                <boxGeometry args={[0.52, 0.1, 0.66]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={1.8}
                />
              </mesh>
            </group>

            {/* --- RIGHT DANCING LEG & ROCKET BOOT --- */}
            <group
              position={[0.38, -0.38, 0]}
              rotation={[rightLegX, 0, rightLegZ]}
            >
              <mesh position={[0, -0.38, 0]}>
                <boxGeometry args={[0.4, 0.72, 0.44]} />
                <meshStandardMaterial
                  color={mauGiapChinh}
                  emissive={mauGiapChinh}
                  emissiveIntensity={0.18}
                  metalness={0.3}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, -0.45, 0.24]}>
                <boxGeometry args={[0.28, 0.2, 0.06]} />
                <meshStandardMaterial
                  color={mauNangLuong}
                  emissive={mauNangLuong}
                  emissiveIntensity={1.6}
                />
              </mesh>
              <mesh position={[0, -0.88, 0.06]}>
                <boxGeometry args={[0.48, 0.44, 0.62]} />
                <meshStandardMaterial
                  color={mauAoChoang}
                  emissive={mauAoChoang}
                  emissiveIntensity={0.6}
                  metalness={0.3}
                  roughness={0.25}
                />
              </mesh>
              <mesh position={[0, -1.12, 0.06]}>
                <boxGeometry args={[0.52, 0.1, 0.66]} />
                <meshStandardMaterial
                  color="#d4ff47"
                  emissive="#d4ff47"
                  emissiveIntensity={1.8}
                />
              </mesh>
            </group>
          </group>
        </group>
      </ThreeCanvas>

      {/* === 2D MECHA HUD & KARAOKE CAPTIONS OVERLAY === */}
      <AbsoluteFill
        style={{
          padding: "64px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Header HUD */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              border: `2px solid ${mauNangLuong}`,
              borderRadius: 24,
              padding: "18px 26px",
              boxShadow: `0 0 32px ${mauNangLuong}33`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <CanvasImage
                src={staticFile("mecha-cat-emblem.svg")}
                style={{ width: 74, height: 74 }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 20,
                    color: "#d4ff47",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                  }}
                >
                  {`AI STUDIO // ${nhanVat3D.toUpperCase()} · ${kieuNhay.toUpperCase()}`}
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                  }}
                >
                  {tenSieuNhan}
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                fontFamily: "monospace",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: mauAoChoang,
                }}
              >
                {`${bpm} BPM`}
              </div>
              <div style={{ fontSize: 19, color: "#94a3b8" }}>30-REPO PRO</div>
            </div>
          </div>

          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#d4ff47",
              color: "#050811",
              padding: "10px 24px",
              borderRadius: 999,
              fontFamily: "monospace",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.04em",
              scale: 1 + beatPulse * 0.04,
            }}
          >
            {DANCE_MOVES[moveIndex]}
          </div>
        </div>

        {/* Bottom Karaoke Captions + Equalizer HUD */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Word-by-Word Karaoke Subtitle Box */}
          {words.length > 0 && (
            <div
              style={{
                backgroundColor: "rgba(5, 8, 17, 0.86)",
                border: `2px solid ${mauAoChoang}`,
                borderRadius: 22,
                padding: "18px 26px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px 12px",
                boxShadow: `0 12px 32px rgba(0,0,0,0.65)`,
              }}
            >
              {words.map((word, idx) => {
                const isCurrentWord = idx === activeWordIndex;
                const isSpoken = idx < activeWordIndex;
                return (
                  <span
                    key={idx}
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      padding: "2px 10px",
                      borderRadius: 10,
                      backgroundColor: isCurrentWord
                        ? "#d4ff47"
                        : "transparent",
                      color: isCurrentWord
                        ? "#050811"
                        : isSpoken
                          ? mauNangLuong
                          : "#f8fafc",
                      scale: isCurrentWord ? 1.08 : 1,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          )}

          {/* Equalizer & Tagline Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              backgroundColor: "rgba(10, 14, 26, 0.84)",
              border: "2px solid rgba(255,255,255,0.14)",
              borderRadius: 26,
              padding: "24px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 20,
                    color: mauNangLuong,
                    marginBottom: 4,
                  }}
                >
                  {`> VOICE TTS + SFX + 3D RIG ACTIVE`}
                </div>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: "#f8fafc",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {khauHieu}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  color: "#d4ff47",
                  fontWeight: 700,
                }}
              >
                {`F:${String(frame).padStart(3, "0")}/180`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                height: 76,
                gap: 8,
              }}
            >
              {eqBars.map((barHeight, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: barHeight,
                    borderRadius: 6,
                    background:
                      idx % 3 === 0
                        ? "#d4ff47"
                        : idx % 2 === 0
                          ? mauNangLuong
                          : mauAoChoang,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
