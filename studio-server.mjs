import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn, exec } from "child_process";
import { fileURLToPath } from "url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4000;
const OUT_DIR = path.join(__dirname, "out");
const PUBLIC_DIR = path.join(__dirname, "public");
const SCENE_IMG_DIR = path.join(PUBLIC_DIR, "scene-images");
const UI_FILE = path.join(__dirname, "studio-ui", "index.html");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(SCENE_IMG_DIR)) {
  fs.mkdirSync(SCENE_IMG_DIR, { recursive: true });
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

/**
 * Pure artistic 2D vector cartoon scene fallback (ZERO duplicate text inside the image!)
 * Only used if the machine is 100% offline without internet.
 */
function generateOfflineArtisticSvg(idx, mauChuDao = "#38bdf8", mauPhu = "#fbbf24") {
  const scenes = [
    // Scene 0: Cozy Workspace & Glowing Laptop
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
      <defs>
        <linearGradient id="sky0" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="640" fill="url(#sky0)"/>
      <circle cx="820" cy="140" r="95" fill="${mauPhu}" opacity="0.85"/>
      <circle cx="820" cy="140" r="135" fill="${mauPhu}" opacity="0.18"/>
      <path d="M0 480 Q260 410 520 470 T1024 450 L1024 640 L0 640 Z" fill="#1e293b"/>
      <rect x="210" y="450" width="604" height="32" rx="14" fill="#475569"/>
      <rect x="310" y="210" width="404" height="245" rx="22" fill="#0f172a" stroke="${mauChuDao}" stroke-width="8"/>
      <rect x="336" y="240" width="352" height="185" rx="12" fill="#1e293b"/>
      <circle cx="430" cy="330" r="46" fill="${mauChuDao}"/>
      <path d="M412 330 L426 344 L454 314" fill="none" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/>
      <rect x="505" y="295" width="145" height="22" rx="8" fill="${mauPhu}"/>
      <rect x="505" y="335" width="110" height="18" rx="8" fill="#94a3b8"/>
      <path d="M260 455 L764 455 L730 485 L294 485 Z" fill="#cbd5e1"/>
    </svg>`,
    // Scene 1: Cute Robot Character & Floating Nodes
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
      <rect width="1024" height="640" fill="#0f172a"/>
      <circle cx="200" cy="160" r="140" fill="${mauChuDao}" opacity="0.14"/>
      <circle cx="840" cy="480" r="180" fill="${mauPhu}" opacity="0.14"/>
      <rect x="392" y="180" width="240" height="210" rx="48" fill="#f8fafc" stroke="${mauChuDao}" stroke-width="10"/>
      <rect x="432" y="230" width="160" height="90" rx="24" fill="#0f172a"/>
      <circle cx="478" cy="275" r="18" fill="${mauChuDao}"/>
      <circle cx="546" cy="275" r="18" fill="${mauChuDao}"/>
      <line x1="512" y1="120" x2="512" y2="180" stroke="${mauPhu}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="512" cy="110" r="24" fill="${mauPhu}"/>
      <rect x="422" y="405" width="180" height="140" rx="36" fill="#cbd5e1" stroke="${mauChuDao}" stroke-width="8"/>
      <circle cx="240" cy="300" r="54" fill="${mauPhu}"/>
      <circle cx="784" cy="300" r="54" fill="${mauChuDao}"/>
      <path d="M294 300 L392 285 M632 285 L730 300" stroke="#ffffff" stroke-width="8" stroke-dasharray="12 10"/>
    </svg>`,
    // Scene 2: Rocket Launch & Starry Sky
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
      <rect width="1024" height="640" fill="#090d16"/>
      <circle cx="180" cy="120" r="6" fill="#fff"/><circle cx="820" cy="100" r="8" fill="#fff"/>
      <circle cx="740" cy="240" r="5" fill="#fff"/><circle cx="260" cy="340" r="7" fill="#fff"/>
      <circle cx="512" cy="320" r="210" fill="${mauChuDao}" opacity="0.12"/>
      <path d="M512 110 C590 200 595 340 575 430 L449 430 C429 340 434 200 512 110 Z" fill="#f8fafc" stroke="${mauChuDao}" stroke-width="8"/>
      <path d="M449 350 L380 445 L449 430 Z" fill="${mauPhu}"/>
      <path d="M575 350 L644 445 L575 430 Z" fill="${mauPhu}"/>
      <circle cx="512" cy="265" r="42" fill="#0f172a" stroke="${mauChuDao}" stroke-width="8"/>
      <path d="M475 435 Q512 560 549 435 Z" fill="${mauPhu}"/>
    </svg>`,
  ];
  return scenes[idx % scenes.length];
}

/**
 * Helper to read Gradio SSE stream and stop immediately when the image URL arrives.
 */
async function readGradioSseUrl(sseUrl, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(sseUrl, { signal: controller.signal });
    if (!res.ok || !res.body) throw new Error(`SSE HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: error")) {
          controller.abort();
          throw new Error("Gradio SSE quota/error");
        }
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (!raw || raw === "null") continue;
          try {
            const parsed = JSON.parse(raw);
            const first = Array.isArray(parsed) ? parsed[0] : parsed;
            const url =
              first?.url ||
              first?.image?.url ||
              (typeof first === "string" && first.startsWith("http") ? first : null);
            if (url) {
              controller.abort();
              return url;
            }
          } catch {}
        }
      }
    }
    throw new Error("Stream ended without URL");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try generating a real AI image via FLUX.1-schnell or Pollinations.
 */
async function tryGenerateAiDiffusionImage(promptEn, seed) {
  // 1. Try FLUX.1-schnell Gradio API
  try {
    const host = "https://black-forest-labs-flux-1-schnell.hf.space";
    const callRes = await fetch(`${host}/gradio_api/call/infer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [promptEn, seed % 999999, true, 1024, 576, 4],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (callRes.ok) {
      const { event_id } = await callRes.json();
      const imgUrl = await readGradioSseUrl(`${host}/gradio_api/call/infer/${event_id}`, 18000);
      const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(8000) });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 5000) return { buf, ext: "webp" };
      }
    }
  } catch {}

  // 2. Try Pollinations Flux endpoint
  try {
    const pUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEn)}?width=1024&height=576&nologo=true&seed=${seed}`;
    const res = await fetch(pUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(9000),
    });
    if (res.ok && (res.headers.get("content-type") || "").includes("image")) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 5000) return { buf, ext: "jpg" };
    }
  } catch {}

  return null;
}

/**
 * Style-aware High-Resolution Visual Search Engine (Bing CDN + Vector/Photo Repositories)
 * Downloads 1024x640 / full-res illustrations or photography in ~1.5 seconds with ZERO rate limits!
 */
async function fetchHighResVisualFromSearch(searchQuery, usedUrls, variationOffset = 0) {
  const q = encodeURIComponent(searchQuery);
  const res = await fetch(
    `https://www.bing.com/images/async?q=${q}&first=1&count=28&qft=+filterui:aspect-wide`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(7000),
    },
  );
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
  const html = await res.text();

  // Extract Bing High-Speed CDN URLs (ts1..4.mm.bing.net) and direct high-res murls
  const turls = [
    ...html.matchAll(/&quot;turl&quot;:&quot;(https:\/\/ts\w*\.mm\.bing\.net\/th\?id=OIP\.[^&"]+)/g),
  ].map((m) => `${m[1]}&w=1024&h=640&c=7&rs=1&qlt=92`);

  const murls = [
    ...html.matchAll(/&quot;murl&quot;:&quot;(https?:\/\/[^"&]+?\.(?:jpg|jpeg|png|webp))&quot;/gi),
  ].map((m) => m[1]);

  // Interleave CDN HD URLs (ultra-reliable, fast, 1024x640) and original murls
  const candidates = [];
  const maxLen = Math.max(turls.length, murls.length);
  for (let i = 0; i < maxLen; i++) {
    if (turls[i]) candidates.push(turls[i]);
    if (murls[i]) candidates.push(murls[i]);
  }

  const unused = candidates.filter((u) => !usedUrls.has(u));
  const pool = unused.length > 0 ? unused : candidates;
  const startIdx = (variationOffset * 2) % Math.max(1, pool.length);
  const ordered = [...pool.slice(startIdx), ...pool.slice(0, startIdx)];

  for (const url of ordered.slice(0, 8)) {
    try {
      const imgRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4500),
      });
      if (imgRes.ok && (imgRes.headers.get("content-type") || "").includes("image")) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 6000) {
          usedUrls.add(url);
          return { buf, ext: "jpg" };
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Builds the English visual query tailored to the video's layout style (`kieuBoCuc`) and scene content.
 */
function buildStyleQueryForScene(sc, idx, props) {
  const layout = props.kieuBoCuc || "hoat-hinh-2d";
  const baseEn = String(sc.moTaHinhAnhEn || sc.tieuDeCanh || props.tieuDeChinh || "creative studio")
    .replace(/^(2d flat vector cartoon illustration of|illustration of|photo of)\s*/i, "")
    .trim();

  if (layout === "hoat-hinh-2d") {
    return `flat vector 2d cartoon illustration ${baseEn} colorful clean art`;
  }
  if (layout === "dien-anh-full") {
    return `${baseEn} cinematic high resolution photography 4k`;
  }
  if (layout === "chill-lofi") {
    return `anime lofi aesthetic illustration ${baseEn} cozy warm art`;
  }
  if (layout === "quang-cao-reels") {
    return `vibrant modern digital illustration ${baseEn} dynamic colorful`;
  }
  return `flat vector 2d tech illustration ${baseEn} modern UI`;
}

/**
 * Populates high-resolution illustrations for all scenes in parallel (~2s total!).
 */
async function attachSceneIllustrations(props, useAiDiffusion = false, variationOffset = 0) {
  const scenes = Array.isArray(props.cacPhanCanh) ? props.cacPhanCanh : [];
  const batchId = Date.now();
  const usedUrls = new Set();

  // Keep scene-images folder tidy
  try {
    const oldFiles = fs.readdirSync(SCENE_IMG_DIR);
    if (oldFiles.length > 50) {
      for (const f of oldFiles.slice(0, oldFiles.length - 25)) {
        fs.unlinkSync(path.join(SCENE_IMG_DIR, f));
      }
    }
  } catch {}

  await Promise.all(
    scenes.map(async (sc, idx) => {
      const styleQuery = buildStyleQueryForScene(sc, idx, props);

      // 1. If user explicitly requested AI diffusion synthesis
      if (useAiDiffusion) {
        const aiImg = await tryGenerateAiDiffusionImage(styleQuery, batchId + idx * 137);
        if (aiImg) {
          const fileName = `scene-${batchId}-${idx + 1}.${aiImg.ext}`;
          fs.writeFileSync(path.join(SCENE_IMG_DIR, fileName), aiImg.buf);
          sc.hinhAnhCanh = `scene-images/${fileName}`;
          return;
        }
      }

      // 2. Fast High-Res Style-Matched Visual Search (2D Vector Cartoon / Cinema Photo / Lofi Art)
      try {
        const found = await fetchHighResVisualFromSearch(
          styleQuery,
          usedUrls,
          variationOffset + idx,
        );
        if (found) {
          const fileName = `scene-${batchId}-${idx + 1}.${found.ext}`;
          fs.writeFileSync(path.join(SCENE_IMG_DIR, fileName), found.buf);
          sc.hinhAnhCanh = `scene-images/${fileName}`;
          return;
        }
      } catch {}

      // 3. Offline pure-art SVG fallback (no duplicate text!)
      const svgContent = generateOfflineArtisticSvg(idx, props.mauChuDao, props.mauPhu);
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
      kieuBoCuc: "hoat-hinh-2d",
      tieuDeChinh: "",
      tenKenh: "CHILL ARGON STUDIO",
      loiThoai: "",
      batGiongDoc: true,
      batPhuDe: true,
      kieuNhacNen: "chill",
      batNhacNen: true,
      thoiLuongGiay: 60,
      mauChuDao: "#38bdf8",
      mauPhu: "#fbbf24",
      mauNen: "#0f172a",
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
  stage: "Sẵn sàng — Hãy nhập Prompt để AI sáng tạo kịch bản, chọn bố cục & vẽ minh họa mới",
  lastError: null,
  outputUrl: null,
  updatedAt: 0,
};

/**
 * Detects the best video layout (`kieuBoCuc`) and color theme from the user's prompt.
 */
function detectLayoutAndTheme(lower) {
  let kieuBoCuc = "hoat-hinh-2d";
  let theLoai = "kien-thuc";
  let mauChuDao = "#38bdf8";
  let mauPhu = "#fbbf24";
  let mauNen = "#0f172a";

  if (
    lower.includes("hoạt hình 2d") ||
    lower.includes("2d động") ||
    lower.includes("minh họa 2d") ||
    lower.includes("trực quan") ||
    lower.includes("cartoon")
  ) {
    kieuBoCuc = "hoat-hinh-2d";
    theLoai = "kien-thuc";
    mauChuDao = "#38bdf8";
    mauPhu = "#fbbf24";
    mauNen = "#1e1b4b";
  } else if (
    lower.includes("lofi") ||
    lower.includes("tâm sự") ||
    lower.includes("podcast") ||
    lower.includes("thư giãn") ||
    lower.includes("đêm mưa") ||
    lower.includes("chữa lành")
  ) {
    kieuBoCuc = "chill-lofi";
    theLoai = "ke-chuyen";
    mauChuDao = "#f59e0b";
    mauPhu = "#c084fc";
    mauNen = "#181326";
  } else if (
    lower.includes("quảng cáo") ||
    lower.includes("tiktok") ||
    lower.includes("reels") ||
    lower.includes("sôi động") ||
    lower.includes("viral") ||
    lower.includes("bán hàng") ||
    lower.includes("khuyến mãi")
  ) {
    kieuBoCuc = "quang-cao-reels";
    theLoai = "quang-cao";
    mauChuDao = "#ff2a85";
    mauPhu = "#00f0ff";
    mauNen = "#140824";
  } else if (
    lower.includes("điện ảnh") ||
    lower.includes("cinematic") ||
    lower.includes("kể chuyện") ||
    lower.includes("ẩm thực") ||
    lower.includes("nấu ăn") ||
    lower.includes("cà phê") ||
    lower.includes("du lịch") ||
    lower.includes("lịch sử") ||
    lower.includes("review")
  ) {
    kieuBoCuc = "dien-anh-full";
    theLoai = "ke-chuyen";
    mauChuDao = "#fbbf24";
    mauPhu = "#fb923c";
    mauNen = "#090a0f";
  } else if (
    lower.includes("code") ||
    lower.includes("lập trình") ||
    lower.includes("terminal") ||
    lower.includes("từng bước")
  ) {
    kieuBoCuc = "cong-nghe-step";
    theLoai = "cong-nghe";
    mauChuDao = "#d4ff47";
    mauPhu = "#00f0ff";
    mauNen = "#0b0f19";
  }

  return { kieuBoCuc, theLoai, mauChuDao, mauPhu, mauNen };
}

function buildDynamicFallbackStoryboard(rawPrompt, lower, durationSec) {
  const { kieuBoCuc, theLoai, mauChuDao, mauPhu, mauNen } = detectLayoutAndTheme(lower);

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
    .replace(
      /,?\s*(dễ|trực quan|hình ảnh|hoạt hình 2d động|nhạc nền nhẹ|vui tai|~?\d+\s*(s|giây|phút)).*$/i,
      "",
    )
    .trim();

  if (!cleanTopic || cleanTopic.length < 3) {
    cleanTopic = rawPrompt.trim().slice(0, 50) || "Chủ Đề Sáng Tạo Mới";
  }
  cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const modes = ["illustration", "flowchart", "terminal", "checklist", "cards"];
  const sceneTopics = [
    `Giới thiệu & Mở đầu: ${cleanTopic}`,
    `Chuẩn bị nền tảng cho: ${cleanTopic}`,
    `Thực hiện bước trọng tâm: ${cleanTopic}`,
    `Bí quyết tối ưu khi ${cleanTopic}`,
    `Trải nghiệm kết quả ${cleanTopic}`,
  ];

  const scenes = sceneTopics.map((st, idx) => ({
    nhanPhu: `CẢNH 0${idx + 1}`,
    tieuDeCanh: `${idx + 1}. ${st.slice(0, 52)}`,
    noiDungCanh: `Khám phá trực quan và chi tiết cho phần: ${st}.`,
    moTaHinhAnhEn: `${cleanTopic} step ${idx + 1} illustration`,
    loaiMinhHoa2D: modes[idx % modes.length],
    duLieuMinhHoa: [
      `Điểm nhấn: ${st.slice(0, 38)}`,
      `Trực quan hóa sinh động cảnh ${idx + 1}`,
    ],
  }));

  const loiThoai = scenes.map((s) => `${s.tieuDeCanh}. ${s.noiDungCanh}`).join(" ");

  return {
    theLoai,
    kieuBoCuc,
    tieuDeChinh: cleanTopic.slice(0, 55),
    tenKenh: "CHILL ARGON STUDIO",
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
 * 100% Creative AI Storyboard, Layout Director & High-Res Visual Generator
 */
async function generateStoryboardWithAI(rawPrompt, wantAiDiffusion = false) {
  const p = (rawPrompt || "").trim();
  const lower = p.toLowerCase();

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

    const systemPrompt = `Bạn là Đạo diễn Video & Hoạt hình chuyên nghiệp.
Hãy viết kịch bản video hoàn toàn mới, sáng tạo 100% theo đúng chủ đề người dùng yêu cầu và chọn bố cục hình ảnh phù hợp nhất.
Trả về JSON hợp lệ theo cấu trúc:
{
  "theLoai": "kien-thuc" | "ke-chuyen" | "quang-cao" | "cong-nghe",
  "kieuBoCuc": "hoat-hinh-2d" | "dien-anh-full" | "quang-cao-reels" | "cong-nghe-step" | "chill-lofi",
  "tieuDeChinh": "Tiêu đề video cụ thể, hấp dẫn (tối đa 52 ký tự)",
  "tenKenh": "NHÃN CHỦ ĐỀ IN HOA",
  "loiThoai": "Lời thuyết minh tiếng Việt chi tiết, mạch lạc, khớp từng cảnh từ Cảnh 1 đến Cảnh 5 (khoảng ${targetWords} từ).",
  "cacPhanCanh": [
    {
      "nhanPhu": "CẢNH 01 // TỪ KHÓA",
      "tieuDeCanh": "1. Tiêu đề cụ thể của Cảnh 1",
      "noiDungCanh": "Mô tả cụ thể nội dung diễn ra trong Cảnh 1.",
      "moTaHinhAnhEn": "Specific English visual search keywords describing the exact objects/action in Scene 1 (e.g., 'developer cloning github repository on laptop cartoon' or 'whipping golden egg yolk cream hanoi egg coffee')",
      "loaiMinhHoa2D": "illustration" | "flowchart" | "terminal" | "progress" | "checklist" | "cards",
      "duLieuMinhHoa": ["Ý chính ngắn gọn 1 bằng tiếng Việt hiển thị trên màn hình (TUYỆT ĐỐI KHÔNG ghi tên file .png/.mp4)", "Ý chính ngắn gọn 2 bằng tiếng Việt", "Ý chính ngắn gọn 3 bằng tiếng Việt"]
    }
  ]
}
Quy tắc chọn kieuBoCuc:
- Nếu người dùng yêu cầu "hoạt hình 2d", "2d động", "dễ hiểu, trực quan", "minh họa": BẮT BUỘC chọn "hoat-hinh-2d".
- Nếu là ẩm thực, nấu ăn, pha chế, du lịch, lịch sử, kể chuyện, điện ảnh: chọn "dien-anh-full".
- Nếu là quảng cáo, bán hàng, TikTok/Reels sôi động: chọn "quang-cao-reels".
- Nếu là tâm sự, lofi, podcast, thư giãn: chọn "chill-lofi".
- Phải có đúng 5 phân cảnh trong cacPhanCanh, mỗi cảnh có moTaHinhAnhEn bằng tiếng Anh thật khác biệt để tìm/vẽ 5 bức ảnh khác nhau.`;

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
          const validLayouts = [
            "hoat-hinh-2d",
            "dien-anh-full",
            "quang-cao-reels",
            "cong-nghe-step",
            "chill-lofi",
          ];
          const sanitizedScenes = aiData.cacPhanCanh.slice(0, 8).map((sc, i) => {
            if (typeof sc === "string") {
              return {
                nhanPhu: `CẢNH 0${i + 1}`,
                tieuDeCanh: `${i + 1}. ${sc.slice(0, 48)}`,
                noiDungCanh: sc,
                moTaHinhAnhEn: sc,
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
              nhanPhu: String(sc.nhanPhu || `CẢNH 0${i + 1}`),
              tieuDeCanh: String(sc.tieuDeCanh || `${i + 1}. Phân cảnh ${i + 1}`),
              noiDungCanh: String(sc.noiDungCanh || ""),
              moTaHinhAnhEn: String(
                sc.moTaHinhAnhEn || `${aiData.tieuDeChinh} ${sc.tieuDeCanh}`,
              ),
              loaiMinhHoa2D: validTypes.includes(sc.loaiMinhHoa2D)
                ? sc.loaiMinhHoa2D
                : validTypes[i % validTypes.length],
              duLieuMinhHoa: rawItems,
            };
          });

          // If user prompt explicitly asked for "hoạt hình 2d", honor it over generic AI layout
          const chosenLayout =
            lower.includes("hoạt hình 2d") || lower.includes("2d động")
              ? "hoat-hinh-2d"
              : validLayouts.includes(aiData.kieuBoCuc)
                ? aiData.kieuBoCuc
                : baseProps.kieuBoCuc;

          const mergedProps = {
            ...baseProps,
            theLoai: ["cong-nghe", "kien-thuc", "ke-chuyen", "quang-cao"].includes(
              aiData.theLoai,
            )
              ? aiData.theLoai
              : baseProps.theLoai,
            kieuBoCuc: chosenLayout,
            tieuDeChinh: String(aiData.tieuDeChinh),
            tenKenh: String(aiData.tenKenh || "CHILL ARGON STUDIO"),
            loiThoai: String(aiData.loiThoai),
            cacPhanCanh: sanitizedScenes,
          };

          await attachSceneIllustrations(mergedProps, wantAiDiffusion, 0);

          return {
            compositionId: "UniversalVideo",
            giongDoc,
            summary: `✨ Đã tạo kịch bản "${mergedProps.tieuDeChinh}" · Bố cục [${mergedProps.kieuBoCuc}] · ${sanitizedScenes.length} cảnh kèm 5 tranh minh họa HD riêng biệt (~${mergedProps.thoiLuongGiay}s)!`,
            props: mergedProps,
          };
        }
      }
    }
  } catch (err) {
    console.warn("AI Cloud fallback:", err.message);
  }

  await attachSceneIllustrations(baseProps, wantAiDiffusion, 0);
  return {
    compositionId: "UniversalVideo",
    giongDoc,
    summary: `Đã tạo kịch bản "${baseProps.tieuDeChinh}" · Bố cục [${baseProps.kieuBoCuc}] (${baseProps.cacPhanCanh.length} phân cảnh + hình minh họa HD · ~${baseProps.thoiLuongGiay}s)`,
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
  if (compositionId === "UniversalVideo" && Array.isArray(props.cacPhanCanh)) {
    const missingImg = props.cacPhanCanh.some((s) => !s.hinhAnhCanh);
    if (missingImg) {
      await attachSceneIllustrations(props, false, 0);
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
  } catch {}

  renderJob = {
    isRendering: true,
    compositionId,
    progress: 4,
    stage: "brief → sound: Đang thu âm giọng đọc AI Tiếng Việt...",
    lastError: null,
    outputUrl: null,
    updatedAt: Date.now(),
  };

  if (props.batGiongDoc && props.loiThoai && props.loiThoai.trim().length > 0) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(
        giongDoc || "vi-VN-HoaiMyNeural",
        OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
      );
      const voiceFile = path.join(PUBLIC_DIR, "voiceover.mp3");
      const { audioStream } = tts.toStream(props.loiThoai.trim());
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(voiceFile);
        audioStream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        audioStream.on("error", reject);
      });

      const voiceBytes = fs.statSync(voiceFile).size;
      const actualVoiceSeconds = Math.ceil(voiceBytes / 12000) + 2;
      if (
        compositionId === "UniversalVideo" &&
        actualVoiceSeconds > (props.thoiLuongGiay || 15)
      ) {
        props.thoiLuongGiay = Math.min(600, actualVoiceSeconds);
      }
      renderJob.progress = 12;
      renderJob.stage = `sound ✓ Đã thu âm giọng đọc AI (${actualVoiceSeconds}s). Đang dựng bố cục [${props.kieuBoCuc || "hoat-hinh-2d"}]...`;
    } catch (ttsErr) {
      console.error("TTS warning:", ttsErr);
    }
  }

  const propsFilePath = path.join(__dirname, "studio-ui", "current-props.json");
  fs.writeFileSync(propsFilePath, JSON.stringify(props), "utf8");

  renderJob.progress = 14;
  renderJob.stage = `design → animate: Đang đóng gói bố cục [${props.kieuBoCuc || "hoat-hinh-2d"}] & hình ảnh các cảnh...`;

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
      renderJob.stage = `build: Đang đóng gói ${props.cacPhanCanh ? props.cacPhanCanh.length + " phân cảnh" : "cảnh 3D"} (${pct}%)...`;
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
      renderJob.stage = `ship ✓ Hoàn tất! Đã xuất file ${outputFileName} (Bố cục: ${props.kieuBoCuc || "2D"} · ${props.thoiLuongGiay || 6}s · Thoại: ${props.batGiongDoc ? "BẬT" : "TẮT"} · Sub: ${props.batPhuDe !== false ? "BẬT" : "TẮT"}).`;
      renderJob.outputUrl = `/out/${outputFileName}?t=${Date.now()}`;
      renderJob.updatedAt = Date.now();
    } else {
      renderJob.isRendering = false;
      renderJob.stage = "Có lỗi khi xuất video.";
      renderJob.lastError = `Process exited with code ${code}`;
    }
  });
}

let globalVariationCounter = 0;

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
              : ext === ".webp"
                ? "image/webp"
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

  // Regenerate all scene images (picks a new set of unseen HD illustrations or runs AI diffusion)
  if (req.method === "POST" && pathname === "/api/regenerate-images") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const props = payload.props || {};
        globalVariationCounter += 1;
        await attachSceneIllustrations(
          props,
          payload.useCloudImage === true,
          globalVariationCounter,
        );
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, props }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // Regenerate or replace a SINGLE scene's image (Swap HD image or AI Diffusion for 1 scene)
  if (req.method === "POST" && pathname === "/api/scene-image") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const scene = payload.scene || {};
        const idx = Number(payload.sceneIndex || 0);
        const props = payload.props || {};
        const useAi = payload.mode === "ai";
        globalVariationCounter += 1;

        const styleQuery = buildStyleQueryForScene(scene, idx, props);
        const stamp = Date.now();
        let savedRelPath = null;

        if (useAi) {
          const aiImg = await tryGenerateAiDiffusionImage(styleQuery, stamp + idx);
          if (aiImg) {
            const fileName = `scene-${stamp}-${idx + 1}.${aiImg.ext}`;
            fs.writeFileSync(path.join(SCENE_IMG_DIR, fileName), aiImg.buf);
            savedRelPath = `scene-images/${fileName}`;
          }
        }

        if (!savedRelPath) {
          const found = await fetchHighResVisualFromSearch(
            styleQuery,
            new Set(),
            globalVariationCounter + idx,
          );
          if (found) {
            const fileName = `scene-${stamp}-${idx + 1}.${found.ext}`;
            fs.writeFileSync(path.join(SCENE_IMG_DIR, fileName), found.buf);
            savedRelPath = `scene-images/${fileName}`;
          }
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, hinhAnhCanh: savedRelPath }));
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
