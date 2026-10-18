import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, exec, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4000;
const OUT_DIR = path.join(__dirname, "out");
const PUBLIC_DIR = path.join(__dirname, "public");
const SCENE_IMG_DIR = path.join(PUBLIC_DIR, "scene-images");
const UI_FILE = path.join(__dirname, "studio-ui", "index.html");
const STATE_FILE = path.join(__dirname, "studio-ui", "studio-state.json");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SCENE_IMG_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, "studio-ui"), { recursive: true });

try {
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.includes(".remotion-in-progress")) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }
} catch {
  // ignore
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a unique, topic-tailored 2D Cartoon Vector Illustration SVG for each scene
 * so every scene has its own custom artwork (never reusing unrelated templates).
 */
function generateCustom2DSceneSvg(scene, idx, totalScenes, mauChuDao, mauPhu, topicTitle) {
  const title = escapeXml((scene.tieuDeCanh || `Cảnh ${idx + 1}`).slice(0, 48));
  const sub = escapeXml((scene.noiDungCanh || "").slice(0, 75));
  const badge = escapeXml(scene.nhanPhu || `CẢNH 0${idx + 1} / 0${totalScenes}`);
  const items = Array.isArray(scene.duLieuMinhHoa) ? scene.duLieuMinhHoa.slice(0, 3) : [];
  const lowerText = `${scene.tieuDeCanh} ${scene.noiDungCanh} ${topicTitle}`.toLowerCase();

  // Choose custom 2D vector character/object illustration based on scene semantics & index
  let centerArtwork = "";
  if (lowerText.includes("github") || lowerText.includes("code") || lowerText.includes("git") || lowerText.includes("terminal") || lowerText.includes("lệnh")) {
    centerArtwork = `
      <!-- 2D Cartoon Laptop + Code Window + Mascot -->
      <rect x="470" y="55" width="290" height="190" rx="18" fill="#0f172a" stroke="${mauChuDao}" stroke-width="4"/>
      <rect x="470" y="55" width="290" height="34" rx="14" fill="#1e293b"/>
      <circle cx="494" cy="72" r="6" fill="#ef4444"/>
      <circle cx="514" cy="72" r="6" fill="#facc15"/>
      <circle cx="534" cy="72" r="6" fill="#22c55e"/>
      <text x="492" y="122" fill="${mauChuDao}" font-family="monospace" font-size="18" font-weight="bold">$ git clone repo.git</text>
      <text x="492" y="154" fill="${mauPhu}" font-family="monospace" font-size="17">&gt; Installing skills...</text>
      <rect x="492" y="176" width="210" height="14" rx="7" fill="#1e293b"/>
      <rect x="492" y="176" width="${80 + (idx * 35) % 130}" height="14" rx="7" fill="${mauChuDao}"/>
      <path d="M440 245 L790 245 L765 268 L465 268 Z" fill="#334155" stroke="${mauPhu}" stroke-width="3"/>
    `;
  } else if (idx % 4 === 0) {
    centerArtwork = `
      <!-- 2D Cartoon Explorer / Idea Bulb & Rocket Scene -->
      <circle cx="620" cy="155" r="88" fill="${mauChuDao}22" stroke="${mauChuDao}" stroke-width="3" stroke-dasharray="10 6"/>
      <circle cx="620" cy="155" r="62" fill="#1e293b" stroke="${mauPhu}" stroke-width="4"/>
      <path d="M620 105 L638 142 L678 148 L648 176 L656 215 L620 196 L584 215 L592 176 L562 148 L602 142 Z" fill="${mauChuDao}"/>
      <circle cx="515" cy="95" r="14" fill="${mauPhu}"/>
      <circle cx="725" cy="210" r="18" fill="${mauChuDao}"/>
    `;
  } else if (idx % 4 === 1) {
    centerArtwork = `
      <!-- 2D Cartoon Connected Workflow Nodes -->
      <rect x="465" y="70" width="130" height="75" rx="16" fill="#1e293b" stroke="${mauChuDao}" stroke-width="4"/>
      <text x="530" y="115" text-anchor="middle" fill="${mauChuDao}" font-family="sans-serif" font-size="22" font-weight="900">BƯỚC ${idx}</text>
      <path d="M595 108 L645 165" stroke="${mauPhu}" stroke-width="5" stroke-linecap="round"/>
      <rect x="635" y="145" width="135" height="80" rx="16" fill="#1e293b" stroke="${mauPhu}" stroke-width="4"/>
      <text x="702" y="192" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="900">BƯỚC ${idx + 1}</text>
      <circle cx="618" cy="135" r="12" fill="${mauChuDao}"/>
    `;
  } else if (idx % 4 === 2) {
    centerArtwork = `
      <!-- 2D Cartoon Visual Analytics & Growth Chart -->
      <rect x="470" y="65" width="290" height="190" rx="20" fill="#111827" stroke="${mauPhu}" stroke-width="3"/>
      <rect x="505" y="175" width="38" height="55" rx="8" fill="${mauPhu}"/>
      <rect x="565" y="140" width="38" height="90" rx="8" fill="${mauChuDao}"/>
      <rect x="625" y="105" width="38" height="125" rx="8" fill="${mauPhu}"/>
      <rect x="685" y="82" width="38" height="148" rx="8" fill="${mauChuDao}"/>
      <path d="M510 155 L580 120 L640 92 L705 70" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="705" cy="70" r="9" fill="${mauChuDao}"/>
    `;
  } else {
    centerArtwork = `
      <!-- 2D Cartoon Trophy / Completion Shield -->
      <circle cx="620" cy="155" r="85" fill="${mauPhu}22" stroke="${mauPhu}" stroke-width="3"/>
      <polygon points="620,75 685,110 670,195 620,235 570,195 555,110" fill="#1e293b" stroke="${mauChuDao}" stroke-width="4"/>
      <path d="M592 155 L612 176 L652 132" fill="none" stroke="${mauChuDao}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  }

  const itemTags = items
    .map((it, i) => {
      const y = 135 + i * 52;
      const text = escapeXml(String(it).slice(0, 42));
      return `
        <rect x="34" y="${y}" width="405" height="40" rx="10" fill="#162038" stroke="${i % 2 === 0 ? mauChuDao : mauPhu}" stroke-width="2"/>
        <text x="52" y="${y + 26}" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="17" font-weight="700">${text}</text>
      `;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" width="800" height="320">
    <defs>
      <linearGradient id="bgGrad${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b1120"/>
        <stop offset="60%" stop-color="#111c35"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
    </defs>
    <rect width="800" height="320" rx="22" fill="url(#bgGrad${idx})"/>
    <circle cx="720" cy="40" r="140" fill="${mauChuDao}" opacity="0.08"/>
    <circle cx="120" cy="280" r="160" fill="${mauPhu}" opacity="0.08"/>

    <!-- Scene Badge & Title on Left -->
    <rect x="34" y="28" width="185" height="32" rx="16" fill="${mauChuDao}"/>
    <text x="126" y="49" text-anchor="middle" fill="#050811" font-family="monospace" font-size="15" font-weight="900">${badge}</text>

    <text x="34" y="92" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="23" font-weight="900">${title}</text>
    <text x="34" y="118" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="14" font-weight="600">${sub}</text>

    ${itemTags}
    ${centerArtwork}
  </svg>`;
}

/**
 * Creates 2D illustration files in public/scene-images/ for every scene in cacPhanCanh.
 * Optionally fetches AI raster illustrations if requested.
 */
async function attachSceneIllustrations(props, tryCloudImage = false) {
  const scenes = Array.isArray(props.cacPhanCanh) ? props.cacPhanCanh : [];
  const batchId = Date.now();
  const mauChuDao = props.mauChuDao || "#d4ff47";
  const mauPhu = props.mauPhu || "#00f0ff";
  const topicTitle = props.tieuDeChinh || "Video 2D";

  // Clean up old generated scene images so folder stays light
  try {
    const oldFiles = fs.readdirSync(SCENE_IMG_DIR);
    if (oldFiles.length > 40) {
      for (const f of oldFiles.slice(0, oldFiles.length - 20)) {
        fs.unlinkSync(path.join(SCENE_IMG_DIR, f));
      }
    }
  } catch {
    // ignore
  }

  await Promise.all(
    scenes.map(async (sc, idx) => {
      // If user requested AI raster image and moTaHinhAnhEn exists
      if (tryCloudImage) {
        try {
          const promptEn =
            sc.moTaHinhAnhEn ||
            `2d flat vector cartoon illustration of ${sc.tieuDeCanh}, vibrant neon colors, clean minimal explainer art`;
          const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEn)}?width=800&height=360&nologo=true&seed=${batchId + idx}`;
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 7500);
          const res = await fetch(imgUrl, { signal: ctrl.signal });
          clearTimeout(t);
          if (res.ok && (res.headers.get("content-type") || "").includes("image")) {
            const arrayBuf = await res.arrayBuffer();
            const buf = Buffer.from(arrayBuf);
            if (buf.length > 4000) {
              const fileName = `scene-${batchId}-${idx + 1}.jpg`;
              fs.writeFileSync(path.join(SCENE_IMG_DIR, fileName), buf);
              sc.hinhAnhCanh = `scene-images/${fileName}`;
              return;
            }
          }
        } catch {
          // fallback to crisp custom 2D vector SVG below
        }
      }

      // Generate custom 2D Vector Cartoon SVG tailored to this exact scene
      const svgContent = generateCustom2DSceneSvg(
        sc,
        idx,
        scenes.length,
        mauChuDao,
        mauPhu,
        topicTitle,
      );
      const svgFileName = `scene-${batchId}-${idx + 1}.svg`;
      fs.writeFileSync(path.join(SCENE_IMG_DIR, svgFileName), svgContent, "utf8");
      sc.hinhAnhCanh = `scene-images/${svgFileName}`;
    }),
  );

  return props;
}

/**
 * Clean, empty initial state (no template forced by default!)
 */
const DEFAULT_STATE = {
  UniversalVideo: {
    outputFile: "video-sang-tao-moi.mp4",
    giongDoc: "vi-VN-HoaiMyNeural",
    props: {
      theLoai: "kien-thuc",
      tieuDeChinh: "",
      tenKenh: "CHILL ARGON STUDIO · 2D MOTION",
      loiThoai: "",
      batGiongDoc: true,
      batPhuDe: true,
      kieuNhacNen: "chill",
      batNhacNen: true,
      thoiLuongGiay: 60,
      mauChuDao: "#d4ff47",
      mauPhu: "#00f0ff",
      mauNen: "#0b0f19",
      hienThi3D: false,
      cacPhanCanh: [],
    },
  },
  MechaCatDance: {
    outputFile: "nhan-vat-3d.mp4",
    giongDoc: "vi-VN-HoaiMyNeural",
    props: {
      nhanVat3D: "meo-mecha",
      kieuNhay: "disco",
      hieuUngDacBiet: "canh-nang-luong",
      tenSieuNhan: "MECHA NEKO-X9",
      khauHieu: "Siêu Nhân Mèo Mecha · Quẩy Cực Sung!",
      loiThoai:
        "Xin chào các bạn! Mình là Mèo Siêu Nhân Mecha đây, cùng quẩy thật sung nhé!",
      batGiongDoc: true,
      batPhuDe: true,
      mauGiapChinh: "#cbd5e1",
      mauNangLuong: "#00f0ff",
      mauAoChoang: "#ff0055",
      tocDoNhay: 1,
    },
  },
};

let studioState = JSON.parse(JSON.stringify(DEFAULT_STATE));

let renderJob = {
  isRendering: false,
  compositionId: null,
  progress: 0,
  stage: "Sẵn sàng — Hãy nhập Prompt để AI sáng tạo kịch bản & hình ảnh mới",
  lastError: null,
  outputUrl: null,
  updatedAt: 0,
};

/**
 * Offline fallback that dynamically breaks down the user's prompt into custom scenes
 * (NEVER uses hardcoded boilerplate scenes 2-5!)
 */
function buildDynamicFallbackStoryboard(rawPrompt, lower, durationSec) {
  let mauChuDao = "#d4ff47";
  let mauPhu = "#00f0ff";
  let mauNen = "#0b0f19";

  if (lower.includes("xanh lá") || lower.includes("lục")) {
    mauChuDao = "#4ade80";
    mauPhu = "#38bdf8";
  } else if (lower.includes("cam") || lower.includes("vàng")) {
    mauChuDao = "#facc15";
    mauPhu = "#fb923c";
  } else if (lower.includes("tím") || lower.includes("hồng")) {
    mauChuDao = "#c084fc";
    mauPhu = "#f472b6";
  }

  let kieuNhacNen = "chill";
  if (lower.includes("sôi động") || lower.includes("edm") || lower.includes("bốc")) {
    kieuNhacNen = "energetic";
  } else if (lower.includes("tắt nhạc") || lower.includes("không nhạc")) {
    kieuNhacNen = "off";
  }

  const batGiongDoc =
    !lower.includes("tắt giọng") &&
    !lower.includes("không giọng") &&
    !lower.includes("tắt thoại") &&
    !lower.includes("không thoại");
  const batPhuDe =
    !lower.includes("tắt sub") &&
    !lower.includes("không sub") &&
    !lower.includes("tắt phụ đề") &&
    !lower.includes("không phụ đề");
  const hienThi3D =
    lower.includes("3d") && !lower.includes("2d") && !lower.includes("hoạt hình 2d");

  let cleanTopic = rawPrompt
    .replace(
      /^(hãy\s+)?(làm|tạo|dựng|viết)\s+(cho\s+mình\s+|cho\s+tôi\s+)?(1\s+|một\s+)?(clip|video|đoạn\s+phim)\s*/i,
      "",
    )
    .replace(/,?\s*(dễ|trực quan|hình ảnh|hoạt hình 2d động|nhạc nền nhẹ|vui tai|~?\d+\s*(s|giây|phút)).*$/i, "")
    .trim();

  if (!cleanTopic || cleanTopic.length < 3) {
    cleanTopic = rawPrompt.trim().slice(0, 50) || "Chủ Đề Sáng Tạo Mới";
  }
  cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const modes = ["illustration", "flowchart", "terminal", "checklist", "cards"];
  const clauses = rawPrompt
    .split(/[\n.;!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const sceneTopics =
    clauses.length >= 3
      ? clauses.slice(0, 5)
      : [
          `Tổng quan & Mục tiêu: ${cleanTopic}`,
          `Chuẩn bị công cụ cho: ${cleanTopic}`,
          `Thao tác thực hiện trực tiếp: ${cleanTopic}`,
          `Mẹo tối ưu & Lưu ý quan trọng khi ${cleanTopic}`,
          `Kết quả hoàn chỉnh & Ứng dụng ${cleanTopic}`,
        ];

  const scenes = sceneTopics.map((st, idx) => ({
    nhanPhu: `CẢNH 0${idx + 1} // BƯỚC ${idx + 1}`,
    tieuDeCanh: `${idx + 1}. ${st.slice(0, 52)}`,
    noiDungCanh: `Minh họa trực quan chi tiết cho phần: ${st}.`,
    loaiMinhHoa2D: modes[idx % modes.length],
    duLieuMinhHoa: [
      `Ý chính 1: ${st.slice(0, 40)}`,
      `Thao tác trực quan bước ${idx + 1}`,
      `Hoàn thành bước ${idx + 1} nhanh chóng`,
    ],
  }));

  const loiThoai = scenes
    .map((s) => `${s.tieuDeCanh}. ${s.noiDungCanh}`)
    .join(" ");

  return {
    theLoai: "cong-nghe",
    tieuDeChinh: cleanTopic.slice(0, 55),
    tenKenh: "CHILL ARGON STUDIO · 2D MOTION",
    loiThoai,
    batGiongDoc,
    batPhuDe,
    kieuNhacNen,
    batNhacNen: kieuNhacNen !== "off",
    thoiLuongGiay: durationSec,
    mauChuDao,
    mauPhu,
    mauNen,
    hienThi3D,
    cacPhanCanh: scenes,
  };
}

/**
 * 100% Creative AI Storyboard, Script & 2D Illustration Generator
 * Uses https://text.pollinations.ai/openai (JSON mode) so every single scene (1..N)
 * is uniquely written from scratch for the user's exact prompt!
 */
async function generateStoryboardWithAI(rawPrompt, wantCloudImages = false) {
  const p = (rawPrompt || "").trim();
  const lower = p.toLowerCase();

  // Extract requested duration in seconds
  let durationSec = 45;
  const secMatch = lower.match(/~?\s*(\d+)\s*(?:s|giây|sec)\b/);
  const minMatch = lower.match(/~?\s*(\d+)\s*(?:phút|phut|min)\b/);
  if (secMatch) {
    durationSec = Math.max(5, Math.min(600, parseInt(secMatch[1], 10)));
  } else if (minMatch) {
    durationSec = Math.max(10, Math.min(600, parseInt(minMatch[1], 10) * 60));
  }

  let giongDoc = "vi-VN-HoaiMyNeural";
  if (lower.includes("giọng nam") || lower.includes("nam minh")) {
    giongDoc = "vi-VN-NamMinhNeural";
  }

  const baseProps = buildDynamicFallbackStoryboard(p, lower, durationSec);

  try {
    const targetWords = Math.min(240, Math.max(60, Math.round(durationSec * 2.3)));

    const systemPrompt = `Bạn là Đạo diễn Hoạt Hình 2D Motion Graphics chuyên nghiệp.
Hãy viết kịch bản video hoàn toàn mới, sáng tạo 100% theo đúng chủ đề người dùng yêu cầu. TUYỆT ĐỐI KHÔNG dùng nội dung mẫu chung chung.
Trả về JSON hợp lệ theo cấu trúc:
{
  "theLoai": "cong-nghe" | "kien-thuc" | "ke-chuyen" | "quang-cao",
  "tieuDeChinh": "Tiêu đề video cụ thể, hấp dẫn (tối đa 52 ký tự)",
  "tenKenh": "NHÃN CHỦ ĐỀ IN HOA",
  "loiThoai": "Lời thuyết minh tiếng Việt chi tiết, mạch lạc, khớp từng cảnh từ Cảnh 1 đến Cảnh 5 (khoảng ${targetWords} từ).",
  "cacPhanCanh": [
    {
      "nhanPhu": "CẢNH 01 // TỪ KHÓA",
      "tieuDeCanh": "1. Tiêu đề cụ thể của Cảnh 1",
      "noiDungCanh": "Mô tả cụ thể nội dung diễn ra trong Cảnh 1.",
      "moTaHinhAnhEn": "2d flat vector cartoon illustration of [specific scene 1 action in English]",
      "loaiMinhHoa2D": "illustration" | "flowchart" | "terminal" | "progress" | "checklist" | "cards",
      "duLieuMinhHoa": ["Ý chính ngắn gọn 1 bằng tiếng Việt hiển thị trên màn hình (TUYỆT ĐỐI KHÔNG ghi tên file .png/.mp4)", "Ý chính ngắn gọn 2 bằng tiếng Việt", "Ý chính ngắn gọn 3 bằng tiếng Việt"]
    }
  ]
}
Yêu cầu bắt buộc:
- Phải có đúng 5 phân cảnh trong cacPhanCanh (Cảnh 1, Cảnh 2, Cảnh 3, Cảnh 4, Cảnh 5).
- Cả 5 phân cảnh đều phải viết nội dung thực chất, bám sát chủ đề "${p}", tuyệt đối không lặp lại câu chữ chung chung.
- Mảng duLieuMinhHoa phải là 3 câu/cụm từ tiếng Việt ngắn gọn tóm tắt nội dung cảnh (không được viết tên file ảnh hay video).`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai-fast",
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Yêu cầu đề bài: "${p}". Hãy viết kịch bản 5 phân cảnh thật chi tiết và sáng tạo riêng cho đề bài này.`,
          },
        ],
      }),
    });
    clearTimeout(timer);

    if (response.ok) {
      const apiJson = await response.json();
      const contentStr =
        apiJson?.choices?.[0]?.message?.content || JSON.stringify(apiJson);
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        if (
          aiData.tieuDeChinh &&
          aiData.loiThoai &&
          Array.isArray(aiData.cacPhanCanh) &&
          aiData.cacPhanCanh.length >= 2
        ) {
          const validTypes = [
            "illustration",
            "flowchart",
            "terminal",
            "progress",
            "checklist",
            "cards",
          ];
          const sanitizedScenes = aiData.cacPhanCanh.slice(0, 8).map((sc, i) => {
            if (typeof sc === "string") {
              return {
                nhanPhu: `CẢNH 0${i + 1}`,
                tieuDeCanh: `${i + 1}. ${sc.slice(0, 48)}`,
                noiDungCanh: sc,
                moTaHinhAnhEn: `2d flat cartoon illustration of ${sc}`,
                loaiMinhHoa2D: validTypes[i % validTypes.length],
                duLieuMinhHoa: [sc],
              };
            }
            const filteredItems = Array.isArray(sc.duLieuMinhHoa)
              ? sc.duLieuMinhHoa
                  .map((item) => String(item).trim())
                  .filter(
                    (item) =>
                      item.length > 1 &&
                      !/\.(png|jpg|jpeg|gif|mp4|svg|webp|wav|mp3)$/i.test(item),
                  )
                  .slice(0, 4)
              : [];
            const fallbackPhrases = String(sc.noiDungCanh || sc.tieuDeCanh || "")
              .split(/[.;,!?–-]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 3)
              .slice(0, 3);
            const rawItems =
              filteredItems.length > 0
                ? filteredItems
                : fallbackPhrases.length > 0
                  ? fallbackPhrases
                  : [String(sc.tieuDeCanh || `Nội dung phân cảnh ${i + 1}`)];
            return {
              nhanPhu: String(sc.nhanPhu || `CẢNH 0${i + 1} // BƯỚC ${i + 1}`),
              tieuDeCanh: String(sc.tieuDeCanh || `${i + 1}. Phân cảnh ${i + 1}`),
              noiDungCanh: String(sc.noiDungCanh || ""),
              moTaHinhAnhEn: String(
                sc.moTaHinhAnhEn ||
                  `2d flat vector cartoon illustration of ${sc.tieuDeCanh}`,
              ),
              loaiMinhHoa2D: validTypes.includes(sc.loaiMinhHoa2D)
                ? sc.loaiMinhHoa2D
                : validTypes[i % validTypes.length],
              duLieuMinhHoa: rawItems,
            };
          });

          const mergedProps = {
            ...baseProps,
            theLoai: ["cong-nghe", "kien-thuc", "ke-chuyen", "quang-cao"].includes(
              aiData.theLoai,
            )
              ? aiData.theLoai
              : baseProps.theLoai,
            tieuDeChinh: String(aiData.tieuDeChinh),
            tenKenh: String(
              aiData.tenKenh || "CHILL ARGON STUDIO · AI STORYBOARD",
            ),
            loiThoai: String(aiData.loiThoai),
            cacPhanCanh: sanitizedScenes,
          };

          await attachSceneIllustrations(mergedProps, wantCloudImages);

          return {
            compositionId: "UniversalVideo",
            giongDoc,
            summary: `✨ AI đã sáng tạo mới hoàn toàn kịch bản "${mergedProps.tieuDeChinh}" (${sanitizedScenes.length} phân cảnh + ${sanitizedScenes.length} hình minh họa 2D riêng · ~${mergedProps.thoiLuongGiay}s)!`,
            props: mergedProps,
          };
        }
      }
    }
  } catch (err) {
    console.warn("AI Cloud fallback:", err.message);
  }

  await attachSceneIllustrations(baseProps, false);
  return {
    compositionId: "UniversalVideo",
    giongDoc,
    summary: `Đã tạo kịch bản "${baseProps.tieuDeChinh}" (${baseProps.cacPhanCanh.length} phân cảnh + hình minh họa 2D riêng · ~${baseProps.thoiLuongGiay}s)`,
    props: baseProps,
  };
}

function getVideoList() {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".mp4") && !f.includes(".remotion-in-progress"))
    .map((f) => {
      const full = path.join(OUT_DIR, f);
      const stat = fs.statSync(full);
      return {
        name: f,
        mtimeMs: stat.mtimeMs,
        url: `/out/${f}?t=${Math.floor(stat.mtimeMs)}`,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
        updatedAt: stat.mtime.toLocaleTimeString("vi-VN"),
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function serveStaticFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "File not found" }));
    return;
  }
  const buf = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": buf.length,
    "Cache-Control": "no-store",
  });
  res.end(buf);
}

async function startRenderProcess(
  compositionId,
  props,
  giongDoc = "vi-VN-HoaiMyNeural",
) {
  // Ensure every scene has its own generated 2D illustration before rendering
  if (compositionId === "UniversalVideo" && Array.isArray(props.cacPhanCanh)) {
    const missingImg = props.cacPhanCanh.some((s) => !s.hinhAnhCanh);
    if (missingImg) {
      await attachSceneIllustrations(props, false);
    }
  }

  studioState[compositionId] = {
    outputFile: `${compositionId}.mp4`,
    giongDoc,
    props,
  };

  const slugTitle = (props.tieuDeChinh || "video-moi")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);

  const outputFileName = `${slugTitle || "video-2d"}-${props.thoiLuongGiay || 45}s.mp4`;
  const outputRelPath = `out/${outputFileName}`;

  const fullOutPath = path.join(OUT_DIR, outputFileName);
  try {
    if (fs.existsSync(fullOutPath)) {
      fs.unlinkSync(fullOutPath);
    }
  } catch {
    // ignore if locked
  }

  renderJob = {
    isRendering: true,
    compositionId,
    progress: 6,
    stage: props.batGiongDoc
      ? "sound: Đang tạo giọng đọc AI Tiếng Việt (msedge-tts)..."
      : "design: Đang chuẩn bị hình ảnh minh họa 2D cho từng phân cảnh...",
    lastError: null,
    outputUrl: `/out/${outputFileName}`,
    updatedAt: Date.now(),
  };

  // Step 1: Synthesize Vietnamese TTS ONLY if batGiongDoc === true
  if (props.batGiongDoc && props.loiThoai) {
    try {
      execFileSync(
        "node",
        [
          path.join(__dirname, "scripts", "generate-tts.cjs"),
          props.loiThoai,
          giongDoc || "vi-VN-HoaiMyNeural",
        ],
        { cwd: __dirname, timeout: 25000 },
      );

      if (compositionId === "UniversalVideo") {
        const probeOut = execFileSync(
          "npx.cmd",
          [
            "remotion",
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            "public/voiceover.mp3",
          ],
          { cwd: __dirname, shell: true, encoding: "utf8" },
        ).trim();
        const ttsSec = parseFloat(probeOut);
        if (!Number.isNaN(ttsSec) && ttsSec > 3) {
          props.thoiLuongGiay = Math.max(
            props.thoiLuongGiay || 15,
            Math.ceil(ttsSec + 2),
          );
        }
      }
    } catch (e) {
      console.error("TTS warning:", e.message);
    }
  }

  const propsFilePath = path.join(__dirname, "studio-ui", "current-props.json");
  fs.writeFileSync(propsFilePath, JSON.stringify(props), "utf8");

  renderJob.progress = 14;
  renderJob.stage =
    "brief → design → animate: Đang đóng gói hình ảnh 2D & chuyển động các phân cảnh...";

  const child = spawn(
    "npx.cmd",
    [
      "remotion",
      "render",
      compositionId,
      outputRelPath,
      "--gl=angle",
      "--props=./studio-ui/current-props.json",
    ],
    {
      cwd: __dirname,
      shell: true,
    },
  );

  const handleOutput = (data) => {
    const text = data.toString();
    const bundleMatch = text.match(/Bundling\s+(\d+)%/);
    if (bundleMatch) {
      const pct = parseInt(bundleMatch[1], 10);
      renderJob.progress = Math.max(
        renderJob.progress,
        14 + Math.round(pct * 0.16),
      );
      renderJob.stage = `build: Đang đóng gói ${props.cacPhanCanh ? props.cacPhanCanh.length + " phân cảnh 2D" : "cảnh 3D"} (${pct}%)...`;
    }
    const renderMatch = text.match(/Rendered\s+(\d+)\/(\d+)/);
    if (renderMatch) {
      const cur = parseInt(renderMatch[1], 10);
      const total = parseInt(renderMatch[2], 10) || 180;
      const ratio = cur / total;
      renderJob.progress = Math.min(93, Math.round(30 + ratio * 62));
      renderJob.stage = `render: Đang kết xuất khung hình (${cur}/${total} frames)...`;
    }
    const encodeMatch = text.match(/Encoded\s+(\d+)\/(\d+)/);
    if (encodeMatch) {
      renderJob.progress = 97;
      renderJob.stage = `sound & review: Đang ghép âm thanh & xuất file MP4...`;
    }
  };

  child.stdout.on("data", handleOutput);
  child.stderr.on("data", handleOutput);

  child.on("close", (code) => {
    if (code === 0) {
      renderJob.isRendering = false;
      renderJob.progress = 100;
      renderJob.stage = `ship ✓ Hoàn tất! Đã xuất file ${outputFileName} (${props.thoiLuongGiay || 6}s · Giọng đọc: ${props.batGiongDoc ? "BẬT" : "TẮT"} · Phụ đề: ${props.batPhuDe !== false ? "BẬT" : "TẮT"}).`;
      renderJob.outputUrl = `/out/${outputFileName}?t=${Date.now()}`;
      renderJob.updatedAt = Date.now();
    } else {
      renderJob.isRendering = false;
      renderJob.stage = "Có lỗi khi xuất video.";
      renderJob.lastError = `Process exited with code ${code}`;
    }
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  if (req.method === "GET" && pathname === "/") {
    serveStaticFile(res, UI_FILE, "text/html; charset=utf-8");
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/out/")) {
    const fileName = path.basename(pathname);
    const filePath = path.join(OUT_DIR, fileName);
    serveStaticFile(res, filePath, "video/mp4");
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/public/")) {
    const relFromPublic = pathname.replace(/^\/public\//, "");
    const safePath = path.normalize(path.join(PUBLIC_DIR, relFromPublic));
    if (!safePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const mime =
      ext === ".svg"
        ? "image/svg+xml"
        : ext === ".mp3"
          ? "audio/mpeg"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : ext === ".ico"
                ? "image/x-icon"
                : "application/octet-stream";
    serveStaticFile(res, safePath, mime);
    return;
  }

  if (req.method === "GET" && pathname === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        lanUrl: `http://${getLanIp()}:${PORT}`,
        state: studioState,
        renderJob,
        videos: getVideoList(),
      }),
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/open-folder") {
    exec(`explorer.exe "${OUT_DIR}"`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Endpoint to regenerate 2D illustrations (either fast SVG vector or Cloud AI image)
  if (req.method === "POST" && pathname === "/api/regenerate-images") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const props = payload.props || {};
        await attachSceneIllustrations(props, payload.useCloudImage === true);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, props }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/prompt") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const parsed = await generateStoryboardWithAI(
          payload.prompt || "",
          payload.useCloudImage === true,
        );

        if (payload.autoRender && !renderJob.isRendering) {
          await startRenderProcess(
            parsed.compositionId,
            parsed.props,
            parsed.giongDoc,
          );
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ ok: true, parsed, renderJob }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/render") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (renderJob.isRendering) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Đang có tiến trình xuất video khác chạy!" }),
        );
        return;
      }

      try {
        const payload = JSON.parse(body);
        const compositionId = payload.compositionId || "UniversalVideo";
        const props = payload.props || studioState[compositionId]?.props || {};
        const giongDoc = payload.giongDoc || "vi-VN-HoaiMyNeural";

        await startRenderProcess(compositionId, props, giongDoc);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, renderJob }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Chill Argon Studio đang chạy tại: http://localhost:${PORT} (LAN: http://${getLanIp()}:${PORT})`,
  );
});
