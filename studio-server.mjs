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
const UI_FILE = path.join(__dirname, "studio-ui", "index.html");
const STATE_FILE = path.join(__dirname, "studio-ui", "studio-state.json");

fs.mkdirSync(OUT_DIR, { recursive: true });
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

const DEFAULT_GITHUB_AGENT_SCENES = [
  {
    nhanPhu: "BƯỚC 01 // TÌM REPO",
    tieuDeCanh: "1. Tìm & Sao Chép Link GitHub",
    noiDungCanh:
      "Truy cập trang GitHub chứa bộ Agent Skills cần dùng và copy đường dẫn HTTPS của repository.",
    loaiMinhHoa2D: "flowchart",
    duLieuMinhHoa: [
      "Truy cập github.com/remotion-dev/skills",
      "Bấm nút Code (Màu xanh lá) → Copy HTTPS link",
      "Chuẩn bị sẵn Git & Node.js trên máy tính",
    ],
  },
  {
    nhanPhu: "BƯỚC 02 // CLONE VỀ MÁY",
    tieuDeCanh: "2. Tải Bộ Agent Về Thư Mục Dự Án",
    noiDungCanh:
      "Mở Terminal trong thư mục làm việc và chạy lệnh git clone để kéo toàn bộ kỹ năng về máy.",
    loaiMinhHoa2D: "terminal",
    duLieuMinhHoa: [
      "$ mkdir -p .agents/skills",
      "$ git clone https://github.com/remotion-dev/skills.git",
      "✓ Đã tải xong 21 bộ kỹ năng chuẩn SKILL.md!",
    ],
  },
  {
    nhanPhu: "BƯỚC 03 // CÀI THƯ VIỆN",
    tieuDeCanh: "3. Cài Đặt Các Gói Thư Viện Đi Kèm",
    noiDungCanh:
      "Chạy lệnh npm install để hệ thống tự động tải và liên kết tất cả các công cụ cần thiết.",
    loaiMinhHoa2D: "progress",
    duLieuMinhHoa: [
      "Cài đặt Core Video Engine",
      "Tích hợp Animation 2D & Vector",
      "Cấu hình Audio TTS & FFmpeg",
      "Hoàn tất 100%",
    ],
  },
  {
    nhanPhu: "BƯỚC 04 // CẤU HÌNH AGENT",
    tieuDeCanh: "4. Kiểm Tra Danh Sách Kỹ Năng Agent",
    noiDungCanh:
      "Hệ thống tự động quét thư mục .agents/skills và nạp hướng dẫn SKILL.md vào bộ nhớ.",
    loaiMinhHoa2D: "checklist",
    duLieuMinhHoa: [
      "Tự động nhận diện thư mục .agents/skills/",
      "Đọc file quy chuẩn AGENTS.md ở thư mục gốc",
      "Kích hoạt quy trình tự động thực thi từng bước",
    ],
  },
  {
    nhanPhu: "BƯỚC 05 // SỬ DỤNG NGAY",
    tieuDeCanh: "5. Ra Lệnh & Tận Hưởng Kết Quả!",
    noiDungCanh:
      "Giờ bạn chỉ cần nhập yêu cầu bằng tiếng Việt, Agent sẽ tự động làm việc từ A đến Z!",
    loaiMinhHoa2D: "cards",
    duLieuMinhHoa: [
      "🚀 Không cần nhớ câu lệnh phức tạp",
      "🎨 Tự động thiết kế, dựng hình 2D/3D & lồng tiếng",
      "✅ Xuất file MP4 hoàn chỉnh chỉ với 1 nút bấm!",
    ],
  },
];

const DEFAULT_STATE = {
  UniversalVideo: {
    outputFile: "huong-dan-agent-github-2d.mp4",
    giongDoc: "vi-VN-HoaiMyNeural",
    props: {
      theLoai: "cong-nghe",
      tieuDeChinh: "Hướng Dẫn Cài Đặt Agent Từ GitHub A → Z",
      tenKenh: "CHILL AUTOMATION STUDIO",
      loiThoai:
        "Chào các bạn! Hôm nay mình sẽ hướng dẫn cách cài đặt bộ Agent kỹ năng từ GitHub cực kỳ dễ hiểu và trực quan. Bước một, mở kho lưu trữ GitHub cần dùng, bấm vào nút Code màu xanh lá và sao chép đường dẫn dự án. Bước hai, mở cửa sổ Terminal trong thư mục dự án của bạn và gõ lệnh git clone để tải toàn bộ bộ kỹ năng về thư mục chấm agents xược skills. Bước ba, chạy lệnh npm install để máy tự động cài đặt đầy đủ các thư viện đồ họa và âm thanh đi kèm. Bước bốn, kiểm tra danh sách kỹ năng đã được nạp tự động thông qua các file SKILL chấm md và AGENTS chấm md. Bước năm, mọi thứ đã sẵn sàng! Giờ bạn chỉ cần nhập yêu cầu bằng tiếng Việt trên giao diện và để Agent tự động làm việc từ A đến Z!",
      batGiongDoc: true,
      kieuNhacNen: "chill",
      batNhacNen: true,
      thoiLuongGiay: 60,
      mauChuDao: "#d4ff47",
      mauPhu: "#00f0ff",
      mauNen: "#0b0f19",
      hienThi3D: false,
      cacPhanCanh: DEFAULT_GITHUB_AGENT_SCENES,
    },
  },
  MechaCatDance: {
    outputFile: "mecha-cat-dance.mp4",
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
      mauGiapChinh: "#cbd5e1",
      mauNangLuong: "#00f0ff",
      mauAoChoang: "#ff0055",
      tocDoNhay: 1,
    },
  },
  Argon20ReposReady: {
    outputFile: "argon-20-repos.mp4",
    props: {
      tieuDeChinh: "20 repo GitHub",
      tieuDePhu: "Argon tự làm video A → Z",
      dongGhiChu: "> /skills · gemini-4-argon",
      mauChuDao: "#d4ff47",
      mauNen: "#0a0a0a",
      tocDoXoay3D: 1,
      hienThi3D: true,
    },
  },
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      return {
        UniversalVideo: {
          ...DEFAULT_STATE.UniversalVideo,
          ...(parsed.UniversalVideo || {}),
          props: {
            ...DEFAULT_STATE.UniversalVideo.props,
            ...(parsed.UniversalVideo?.props || {}),
          },
        },
        MechaCatDance: {
          ...DEFAULT_STATE.MechaCatDance,
          ...(parsed.MechaCatDance || {}),
          props: {
            ...DEFAULT_STATE.MechaCatDance.props,
            ...(parsed.MechaCatDance?.props || {}),
          },
        },
        Argon20ReposReady: {
          ...DEFAULT_STATE.Argon20ReposReady,
          ...(parsed.Argon20ReposReady || {}),
          props: {
            ...DEFAULT_STATE.Argon20ReposReady.props,
            ...(parsed.Argon20ReposReady?.props || {}),
          },
        },
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_STATE;
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

let studioState = loadState();

let renderJob = {
  isRendering: false,
  compositionId: null,
  progress: 100,
  stage: "ship ✓ Sẵn sàng phát và tải về",
  lastError: null,
  outputUrl: "/out/cho-shiba-hiphop.mp4",
  updatedAt: Date.now(),
};

/**
 * Generate a structured multi-scene 2D/3D storyboard & full Vietnamese script for ANY prompt topic!
 */
function buildUniversalStoryboard(rawPrompt, lower, durationSec) {
  // Colors
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
  } else if (lower.includes("xanh dương") || lower.includes("xanh biển")) {
    mauChuDao = "#38bdf8";
    mauPhu = "#d4ff47";
  }

  // Music style
  let kieuNhacNen = "chill";
  if (
    lower.includes("sôi động") ||
    lower.includes("edm") ||
    lower.includes("bốc") ||
    lower.includes("nhạc mạnh")
  ) {
    kieuNhacNen = "energetic";
  } else if (lower.includes("tắt nhạc") || lower.includes("không nhạc")) {
    kieuNhacNen = "off";
  }

  // 2D vs 3D
  const wants3D =
    lower.includes("3d") && !lower.includes("2d") && !lower.includes("hoạt hình 2d");
  const hienThi3D = wants3D;

  // Check if topic is about installing Agent / GitHub / coding / CLI
  if (
    lower.includes("github") ||
    lower.includes("cài đặt") ||
    lower.includes("agent") ||
    lower.includes("repo") ||
    lower.includes("skill")
  ) {
    return {
      theLoai: "cong-nghe",
      tieuDeChinh: "Hướng Dẫn Cài Đặt Agent Từ GitHub A → Z",
      tenKenh: "HƯỚNG DẪN AI TRỰC QUAN · 2D MOTION",
      loiThoai:
        "Chào các bạn! Hôm nay mình sẽ hướng dẫn cách cài đặt bộ Agent kỹ năng từ GitHub cực kỳ dễ hiểu và trực quan. Bước một, mở kho lưu trữ GitHub cần dùng, bấm vào nút Code màu xanh lá và sao chép đường dẫn dự án. Bước hai, mở cửa sổ Terminal trong thư mục dự án của bạn và gõ lệnh git clone để tải toàn bộ bộ kỹ năng về thư mục chấm agents xược skills. Bước ba, chạy lệnh npm install để máy tự động cài đặt đầy đủ các thư viện đồ họa và âm thanh đi kèm. Bước bốn, kiểm tra danh sách kỹ năng đã được nạp tự động thông qua các file SKILL chấm md và AGENTS chấm md. Bước năm, mọi thứ đã sẵn sàng! Giờ bạn chỉ cần nhập yêu cầu bằng tiếng Việt trên giao diện và để Agent tự động làm việc từ A đến Z!",
      batGiongDoc: !lower.includes("tắt giọng"),
      kieuNhacNen,
      batNhacNen: kieuNhacNen !== "off",
      thoiLuongGiay: durationSec,
      mauChuDao,
      mauPhu,
      mauNen,
      hienThi3D,
      cacPhanCanh: DEFAULT_GITHUB_AGENT_SCENES,
    };
  }

  // Generic intelligent multi-scene builder for ANY other user topic!
  // Clean up filler words from prompt to get the core topic title
  let cleanTopic = rawPrompt
    .replace(
      /^(hãy\s+)?(làm|tạo|dựng)\s+(cho\s+mình\s+|cho\s+tôi\s+)?(1\s+|một\s+)?(clip|video|đoạn\s+phim)\s*/i,
      "",
    )
    .split(/[,.\n]/)[0]
    .trim();
  if (!cleanTopic || cleanTopic.length < 4) {
    cleanTopic = "Cẩm Nang Hướng Dẫn Chi Tiết A → Z";
  }
  cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const customScenes = [
    {
      nhanPhu: "PHẦN 01 // TỔNG QUAN",
      tieuDeCanh: `1. Giới Thiệu: ${cleanTopic}`,
      noiDungCanh: `Khám phá quy trình từng bước đơn giản, trực quan và dễ áp dụng ngay trong thực tế.`,
      loaiMinhHoa2D: "flowchart",
      duLieuMinhHoa: [
        `Xác định mục tiêu chính của ${cleanTopic}`,
        "Chuẩn bị công cụ & tài nguyên cần thiết",
        "Thực hiện theo lộ trình 5 bước chuẩn",
      ],
    },
    {
      nhanPhu: "PHẦN 02 // BƯỚC ĐẦU TIÊN",
      tieuDeCanh: "2. Thiết Lập & Chuẩn Bị Nền Tảng",
      noiDungCanh:
        "Khởi tạo môi trường làm việc gọn gàng để tiết kiệm tối đa thời gian thao tác.",
      loaiMinhHoa2D: "terminal",
      duLieuMinhHoa: [
        `> Khởi động quy trình: ${cleanTopic}`,
        "> Nạp dữ liệu & cấu hình tự động...",
        "✓ Hoàn tất bước chuẩn bị nền tảng!",
      ],
    },
    {
      nhanPhu: "PHẦN 03 // TRIỂN KHAI",
      tieuDeCanh: "3. Thực Hiện Quy Trình Từng Bước",
      noiDungCanh:
        "Áp dụng công thức trực quan giúp tăng tốc độ xử lý và đảm bảo độ chính xác cao.",
      loaiMinhHoa2D: "progress",
      duLieuMinhHoa: [
        "Tối ưu hóa bố cục",
        "Tự động hóa tác vụ lặp lại",
        "Kiểm tra chất lượng đầu ra",
      ],
    },
    {
      nhanPhu: "PHẦN 04 // KIỂM TRA",
      tieuDeCanh: "4. Danh Sách Kiểm Tra Quan Trọng",
      noiDungCanh:
        "Đảm bảo mọi tiêu chí đều đạt chuẩn trước khi xuất bản và đưa vào sử dụng.",
      loaiMinhHoa2D: "checklist",
      duLieuMinhHoa: [
        "Giao diện rõ ràng, trực quan, dễ hiểu",
        "Tốc độ vận hành mượt mà, ổn định",
        "Sẵn sàng chia sẻ và nhân rộng quy trình",
      ],
    },
    {
      nhanPhu: "PHẦN 05 // TỔNG KẾT",
      tieuDeCanh: "5. Hoàn Tất & Ứng Dụng Thực Tế!",
      noiDungCanh:
        "Lưu lại ngay quy trình này để áp dụng mỗi ngày và nâng cao hiệu suất gấp nhiều lần!",
      loaiMinhHoa2D: "cards",
      duLieuMinhHoa: [
        `✨ Nắm vững ${cleanTopic} chỉ trong vài phút`,
        "⚡ Dễ dàng áp dụng cho mọi dự án mới",
        "📌 Đừng quên lưu lại video để dùng khi cần nhé!",
      ],
    },
  ];

  const customScript = `Chào các bạn! Trong video này chúng ta sẽ cùng tìm hiểu về ${cleanTopic} một cách cực kỳ dễ hiểu và trực quan. Đầu tiên, ở phần tổng quan, chúng ta xác định rõ mục tiêu và chuẩn bị đầy đủ các công cụ cần thiết trước khi bắt đầu. Tiếp theo, ở bước thứ hai, bạn tiến hành thiết lập môi trường nền tảng thật gọn gàng để mọi thao tác diễn ra tự động và nhanh chóng. Sang bước thứ ba, chúng ta triển khai quy trình cốt lõi theo từng công đoạn rõ ràng, giúp tiết kiệm tối đa thời gian. Ở bước thứ tư, hãy rà soát lại danh sách kiểm tra để đảm bảo mọi tiêu chí chất lượng đều đạt một trăm phần trăm. Cuối cùng, bạn đã hoàn tất toàn bộ quy trình và sẵn sàng áp dụng ngay vào thực tế. Hãy lưu lại video này để dùng bất cứ khi nào cần nhé!`;

  return {
    theLoai: "kien-thuc",
    tieuDeChinh: cleanTopic,
    tenKenh: "CHILL AUTOMATION STUDIO · 2D MOTION",
    loiThoai: customScript,
    batGiongDoc: !lower.includes("tắt giọng"),
    kieuNhacNen,
    batNhacNen: kieuNhacNen !== "off",
    thoiLuongGiay: durationSec,
    mauChuDao,
    mauPhu,
    mauNen,
    hienThi3D,
    cacPhanCanh: customScenes,
  };
}

/**
 * Multi-Genre Vietnamese AI Prompt Interpreter
 * - Uses UniversalVideo (2D Motion Explainer / Tutorial / Story / Promo) by default!
 * - Only uses MechaCatDance when explicitly asked for 3D dancing character (mèo, chó shiba, gundam, nhảy...)
 */
function parseVietnamesePrompt(rawPrompt) {
  const p = (rawPrompt || "").trim();
  const lower = p.toLowerCase();

  // Extract requested duration in seconds (e.g. "~60s", "45 giây", "2 phút")
  let durationSec = 45;
  const secMatch = lower.match(/~?\s*(\d+)\s*(?:s|giây|sec)\b/);
  const minMatch = lower.match(/~?\s*(\d+)\s*(?:phút|phut|min)\b/);
  if (secMatch) {
    durationSec = Math.max(5, Math.min(600, parseInt(secMatch[1], 10)));
  } else if (minMatch) {
    durationSec = Math.max(10, Math.min(600, parseInt(minMatch[1], 10) * 60));
  }

  // Voice gender detection
  let giongDoc = "vi-VN-HoaiMyNeural";
  if (lower.includes("giọng nam") || lower.includes("nam minh")) {
    giongDoc = "vi-VN-NamMinhNeural";
  }

  // Does the user explicitly want the 3D Dancing Character showcase?
  const isCharacterDancePrompt =
    (lower.includes("mèo") ||
      lower.includes("chó") ||
      lower.includes("shiba") ||
      lower.includes("gundam") ||
      lower.includes("nhảy") ||
      lower.includes("dance") ||
      lower.includes("hiphop") ||
      lower.includes("disco") ||
      lower.includes("múa võ")) &&
    !lower.includes("hướng dẫn") &&
    !lower.includes("cài đặt") &&
    !lower.includes("hoạt hình 2d");

  if (!isCharacterDancePrompt) {
    const universalProps = buildUniversalStoryboard(p, lower, durationSec);
    return {
      compositionId: "UniversalVideo",
      giongDoc,
      summary: `Đã tạo Kịch Bản 2D Đa Cảnh (${universalProps.cacPhanCanh.length} bước · ~${universalProps.thoiLuongGiay}s) · Nhạc nền [${universalProps.kieuNhacNen === "chill" ? "Nhẹ Vui Tai Lo-Fi" : universalProps.kieuNhacNen}] · Chế độ [${universalProps.hienThi3D ? "3D" : "Hoạt Hình 2D Động"}]`,
      props: universalProps,
    };
  }

  // Otherwise configure 3D Character Dance Scene (MechaCatDance)
  let nhanVat3D = "meo-mecha";
  let defaultName = "MECHA NEKO-X9";
  let defaultTag = "Siêu Nhân Mèo Mecha · Quẩy Cực Sung!";
  let defaultSpeech =
    "Xin chào các bạn! Mình là Mèo Siêu Nhân Mecha đây, cùng quẩy thật sung nhé!";

  if (
    lower.includes("chó") ||
    lower.includes("shiba") ||
    lower.includes("cún") ||
    lower.includes("dog")
  ) {
    nhanVat3D = "cho-shiba";
    defaultName = "CYBER SHIBA-07";
    defaultTag = "Chiến Binh Chó Shiba Vũ Trụ · Quẩy Đỉnh Cao!";
    defaultSpeech =
      "Gâu gâu! Chó Shiba siêu nhân vũ trụ xin chào cả nhà, lên nhạc quẩy thôi nào!";
  } else if (
    lower.includes("gundam") ||
    lower.includes("robot") ||
    lower.includes("người máy")
  ) {
    nhanVat3D = "robot-gundam";
    defaultName = "GUNDAM STRIKE-V";
    defaultTag = "Siêu Chiến Binh Robot Gundam · Năng Lượng Tối Đa!";
    defaultSpeech =
      "Hệ thống chiến binh Gundam đã kích hoạt một trăm phần trăm! Sẵn sàng bùng nổ!";
    giongDoc = "vi-VN-NamMinhNeural";
  } else if (lower.includes("phi hành gia") || lower.includes("vũ trụ")) {
    nhanVat3D = "phi-hanh-gia";
    defaultName = "ASTRO HERO-99";
    defaultTag = "Phi Hành Gia Siêu Cấp · Nhảy Giữa Ngân Hà!";
    defaultSpeech =
      "Từ trạm vũ trụ ngân hà, phi hành gia siêu nhân gửi lời chào tới tất cả các bạn!";
  }

  let kieuNhay = "disco";
  if (lower.includes("hiphop") || lower.includes("hip-hop") || lower.includes("shuffle")) {
    kieuNhay = "hiphop";
  } else if (lower.includes("xoay") || lower.includes("breakdance") || lower.includes("360")) {
    kieuNhay = "breakdance";
  } else if (lower.includes("võ") || lower.includes("kungfu")) {
    kieuNhay = "martial";
  }

  let hieuUngDacBiet = "canh-nang-luong";
  if (lower.includes("sét") || lower.includes("điện")) {
    hieuUngDacBiet = "tia-set";
  } else if (lower.includes("hào quang") || lower.includes("vòng sáng")) {
    hieuUngDacBiet = "vong-hao-quang";
  }

  let mauGiapChinh = "#cbd5e1";
  let mauNangLuong = "#00f0ff";
  let mauAoChoang = "#ff0055";

  if (lower.includes("vàng") || lower.includes("bumblebee")) {
    mauGiapChinh = "#facc15";
    mauNangLuong = "#00f0ff";
    mauAoChoang = "#ef4444";
  } else if (lower.includes("tím") || lower.includes("eva")) {
    mauGiapChinh = "#a855f7";
    mauNangLuong = "#d4ff47";
    mauAoChoang = "#ec4899";
  } else if (lower.includes("xanh dương") || lower.includes("xanh biển")) {
    mauGiapChinh = "#38bdf8";
    mauNangLuong = "#d4ff47";
    mauAoChoang = "#f97316";
  } else if (lower.includes("đỏ") || lower.includes("iron")) {
    mauGiapChinh = "#ef4444";
    mauNangLuong = "#facc15";
    mauAoChoang = "#38bdf8";
  }

  let tocDoNhay = 1.0;
  const speedMatch = lower.match(/(\d+(?:\.\d+)?)\s*x/);
  if (speedMatch) {
    tocDoNhay = Math.min(2.0, Math.max(0.5, parseFloat(speedMatch[1])));
  }

  const batGiongDoc = !lower.includes("tắt giọng");
  let loiThoai = defaultSpeech;
  const quotedText = p.match(/["“]([^"”]+)["”]/);
  if (quotedText && quotedText[1].trim().length > 3) {
    loiThoai = quotedText[1].trim();
  }

  return {
    compositionId: "MechaCatDance",
    giongDoc,
    summary: `Chế độ Nhân Vật 3D [${nhanVat3D}] · Vũ đạo [${kieuNhay}] · Hiệu ứng [${hieuUngDacBiet}]`,
    props: {
      nhanVat3D,
      kieuNhay,
      hieuUngDacBiet,
      tenSieuNhan: defaultName,
      khauHieu: defaultTag,
      loiThoai,
      batGiongDoc,
      mauGiapChinh,
      mauNangLuong,
      mauAoChoang,
      tocDoNhay,
    },
  };
}

/**
 * Zero-Key AI Storyboard & Script Generator (runs 100% inside the app UI with 0 API key & 0 cost)
 */
async function generateStoryboardWithAI(rawPrompt) {
  const baseParsed = parseVietnamesePrompt(rawPrompt);

  // If user asked for a 3D dancing character or the exact GitHub Agent preset, return immediately or enrich
  if (baseParsed.compositionId === "MechaCatDance") {
    return baseParsed;
  }
  const lower = (rawPrompt || "").toLowerCase();
  if (
    lower.includes("github") &&
    lower.includes("agent") &&
    lower.includes("cài đặt")
  ) {
    return baseParsed;
  }

  try {
    const durationSec = baseParsed.props.thoiLuongGiay || 45;
    const targetWords = Math.min(220, Math.max(55, Math.round(durationSec * 2.2)));

    const systemInstruction = `Bạn là Đạo diễn Video Hoạt Hình 2D Motion Graphics chuyên nghiệp của Chill Argon Studio.
Nhiệm vụ: Dựa trên yêu cầu của người dùng, hãy thiết kế kịch bản video 2D trực quan bằng tiếng Việt và CHỈ trả về duy nhất 1 khối JSON hợp lệ (không giải thích thêm) theo đúng cấu trúc sau:
{
  "theLoai": "cong-nghe" | "kien-thuc" | "ke-chuyen" | "quang-cao",
  "tieuDeChinh": "Tiêu đề chính ngắn gọn, hấp dẫn (tối đa 55 ký tự)",
  "tenKenh": "NHÃN CHỦ ĐỀ NGẮN IN HOA · 2D MOTION",
  "loiThoai": "Lời thuyết minh tiếng Việt tự nhiên, mạch lạc, cuốn hút, dài khoảng ${targetWords} từ để đọc vừa khít ${durationSec} giây.",
  "cacPhanCanh": [
    {
      "nhanPhu": "BƯỚC 01 // TỪ KHÓA",
      "tieuDeCanh": "1. Tiêu đề phân cảnh 1",
      "noiDungCanh": "Câu mô tả ngắn gọn trực quan cho cảnh 1.",
      "loaiMinhHoa2D": "flowchart",
      "duLieuMinhHoa": ["Ý ngắn 1", "Ý ngắn 2", "Ý ngắn 3"]
    }
  ]
}
Lưu ý:
- Tạo đúng 5 phân cảnh trong mảng cacPhanCanh.
- loaiMinhHoa2D của 5 cảnh lần lượt sử dụng đa dạng: "flowchart", "terminal", "progress", "checklist", "cards".
- Mỗi duLieuMinhHoa gồm 3 dòng ngắn gọn, đúng trọng tâm chủ đề người dùng yêu cầu.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: `Hãy thiết kế kịch bản video 2D chi tiết cho yêu cầu sau: "${rawPrompt}"`,
          },
        ],
      }),
    });
    clearTimeout(timer);

    if (response.ok) {
      const rawText = await response.text();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        if (
          aiData.tieuDeChinh &&
          aiData.loiThoai &&
          Array.isArray(aiData.cacPhanCanh) &&
          aiData.cacPhanCanh.length >= 2
        ) {
          const validTypes = [
            "flowchart",
            "terminal",
            "progress",
            "checklist",
            "cards",
          ];
          const sanitizedScenes = aiData.cacPhanCanh.slice(0, 8).map((sc, i) => {
            if (typeof sc === "string") {
              const parts = sc.split(/[.;—–-]/).map((s) => s.trim()).filter(Boolean);
              return {
                nhanPhu: `BƯỚC 0${i + 1} // THỰC HIỆN`,
                tieuDeCanh: parts[0] || `${i + 1}. Bước ${i + 1}`,
                noiDungCanh: sc,
                loaiMinhHoa2D: validTypes[i % validTypes.length],
                duLieuMinhHoa: parts.length >= 2 ? parts.slice(0, 3) : [sc, "Thực hiện trực quan, dễ hiểu", "Hoàn tất bước này"],
              };
            }
            return {
              nhanPhu: String(sc.nhanPhu || `BƯỚC 0${i + 1} // CHI TIẾT`),
              tieuDeCanh: String(sc.tieuDeCanh || `${i + 1}. Nội dung chính`),
              noiDungCanh: String(sc.noiDungCanh || ""),
              loaiMinhHoa2D: validTypes.includes(sc.loaiMinhHoa2D)
                ? sc.loaiMinhHoa2D
                : validTypes[i % validTypes.length],
              duLieuMinhHoa:
                Array.isArray(sc.duLieuMinhHoa) && sc.duLieuMinhHoa.length > 0
                  ? sc.duLieuMinhHoa.slice(0, 4).map((item) => String(item))
                  : ["Nội dung trực quan 1", "Nội dung trực quan 2", "Hoàn tất"],
            };
          });

          const mergedProps = {
            ...baseParsed.props,
            theLoai: ["cong-nghe", "kien-thuc", "ke-chuyen", "quang-cao"].includes(
              aiData.theLoai,
            )
              ? aiData.theLoai
              : baseParsed.props.theLoai,
            tieuDeChinh: String(aiData.tieuDeChinh),
            tenKenh: String(
              aiData.tenKenh || "CHILL ARGON STUDIO · AI STORYBOARD",
            ),
            loiThoai: String(aiData.loiThoai),
            cacPhanCanh: sanitizedScenes,
          };

          return {
            compositionId: "UniversalVideo",
            giongDoc: baseParsed.giongDoc,
            summary: `🤖 AI đã tự động biên kịch "${mergedProps.tieuDeChinh}" (${sanitizedScenes.length} phân cảnh 2D · ~${mergedProps.thoiLuongGiay}s) ngay trên App!`,
            props: mergedProps,
          };
        }
      }
    }
  } catch (err) {
    console.warn("AI Cloud fallback to local parser:", err.message);
  }

  return baseParsed;
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

function startRenderProcess(
  compositionId,
  props,
  giongDoc = "vi-VN-HoaiMyNeural",
) {
  if (!studioState[compositionId]) {
    studioState[compositionId] = {
      outputFile: `${compositionId}.mp4`,
      giongDoc,
      props,
    };
  } else {
    studioState[compositionId].props = props;
    studioState[compositionId].giongDoc = giongDoc;
  }
  saveState(studioState);

  let tagSlug = "video-ai";
  if (compositionId === "UniversalVideo") {
    tagSlug = `video-2d-${props.theLoai || "huong-dan"}-${props.thoiLuongGiay || 45}s`;
  } else if (compositionId === "MechaCatDance") {
    tagSlug = `${props.nhanVat3D || "meo"}-${props.kieuNhay || "dance"}`;
  } else {
    tagSlug = "argon-20-repos";
  }

  const outputFileName = `${tagSlug}.mp4`;
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
    stage: "sound: Đang tạo giọng đọc AI Tiếng Việt (msedge-tts)...",
    lastError: null,
    outputUrl: `/out/${outputFileName}`,
    updatedAt: Date.now(),
  };

  // Step 1: Synthesize Vietnamese TTS and measure audio length if UniversalVideo
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

      // Measure actual TTS audio duration via ffprobe so video never cuts off voiceover!
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
          // Ensure video is at least as long as the voiceover + 2s outro (or user's requested duration)
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

  renderJob.progress = 12;
  renderJob.stage =
    "brief → design → animate: Đang đóng gói các phân cảnh 2D/3D...";

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
        12 + Math.round(pct * 0.18),
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
      renderJob.stage = `sound & review: Đang ghép giọng đọc AI + Nhạc nền & xuất MP4...`;
    }
  };

  child.stdout.on("data", handleOutput);
  child.stderr.on("data", handleOutput);

  child.on("close", (code) => {
    if (code === 0) {
      renderJob.isRendering = false;
      renderJob.progress = 100;
      renderJob.stage = `ship ✓ Hoàn tất! Đã xuất file ${outputFileName} (${props.thoiLuongGiay || 6}s · 1080x1920 · 30fps).`;
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
    const fileName = path.basename(pathname);
    const filePath = path.join(PUBLIC_DIR, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const mime =
      ext === ".svg"
        ? "image/svg+xml"
        : ext === ".mp3"
          ? "audio/mpeg"
          : ext === ".ico"
            ? "image/x-icon"
            : "application/octet-stream";
    serveStaticFile(res, filePath, mime);
    return;
  }

  if (req.method === "GET" && pathname === "/api/status") {
    let argonRequest = null;
    const reqFile = path.join(__dirname, "studio-ui", "argon-request.json");
    if (fs.existsSync(reqFile)) {
      try {
        argonRequest = JSON.parse(fs.readFileSync(reqFile, "utf8"));
      } catch {
        // ignore
      }
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        lanUrl: `http://${getLanIp()}:${PORT}`,
        state: studioState,
        renderJob,
        argonRequest,
        videos: getVideoList(),
      }),
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/argon-request") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const reqFile = path.join(__dirname, "studio-ui", "argon-request.json");
        const requestObj = {
          id: `req-${Date.now()}`,
          status: "pending",
          prompt: (payload.prompt || "").trim(),
          activeTemplate: payload.activeTemplate || "UniversalVideo",
          createdAt: new Date().toLocaleTimeString("vi-VN"),
          updatedAt: Date.now(),
          message:
            "Đang chờ Argon (Antigravity) đọc file studio-ui/argon-request.json và tự động thiết kế/dựng video...",
        };
        fs.writeFileSync(reqFile, JSON.stringify(requestObj, null, 2), "utf8");
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(
          JSON.stringify({
            ok: true,
            argonRequest: requestObj,
            triggerCommand: "Thực hiện yêu cầu từ Chill Argon Studio",
          }),
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/argon-complete") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const compositionId = payload.compositionId || "UniversalVideo";
        const props = payload.props || studioState[compositionId]?.props || {};
        const giongDoc = payload.giongDoc || "vi-VN-HoaiMyNeural";

        const reqFile = path.join(__dirname, "studio-ui", "argon-request.json");
        const completedObj = {
          id: payload.id || `req-${Date.now()}`,
          status: "completed",
          prompt: payload.prompt || "",
          compositionId,
          props,
          giongDoc,
          updatedAt: Date.now(),
          message:
            payload.summary ||
            "✅ Argon (Antigravity) đã thiết kế xong kịch bản & đang xuất video MP4!",
        };
        fs.writeFileSync(
          reqFile,
          JSON.stringify(completedObj, null, 2),
          "utf8",
        );

        if (payload.autoRender !== false && !renderJob.isRendering) {
          startRenderProcess(compositionId, props, giongDoc);
        }

        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(
          JSON.stringify({ ok: true, argonRequest: completedObj, renderJob }),
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/open-folder") {
    exec(`explorer.exe "${OUT_DIR}"`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
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
        const useCloudAI = payload.useCloudAI !== false;
        const parsed = useCloudAI
          ? await generateStoryboardWithAI(payload.prompt || "")
          : parseVietnamesePrompt(payload.prompt || "");

        if (payload.autoRender && !renderJob.isRendering) {
          startRenderProcess(
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
    req.on("end", () => {
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

        startRenderProcess(compositionId, props, giongDoc);

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
    `Chill Argon Studio (Universal 2D/3D) đang chạy tại: http://localhost:${PORT} (LAN: http://${getLanIp()}:${PORT})`,
  );
});
