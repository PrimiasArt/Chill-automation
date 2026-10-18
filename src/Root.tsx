import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { MechaCatDance, MechaCatSchema } from "./MechaCatDance";
import {
  UniversalVideo,
  UniversalVideoSchema,
  calculateUniversalMetadata,
} from "./UniversalVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="UniversalVideo"
        component={UniversalVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        schema={UniversalVideoSchema}
        calculateMetadata={calculateUniversalMetadata}
        defaultProps={{
          theLoai: "cong-nghe",
          tieuDeChinh: "Hướng Dẫn Cài Đặt Agent Từ GitHub A → Z",
          tenKenh: "CHILL AUTOMATION STUDIO",
          loiThoai:
            "Chào các bạn! Hôm nay mình sẽ hướng dẫn cách cài đặt bộ Agent kỹ năng từ GitHub cực kỳ dễ hiểu và trực quan. Bước một, mở kho lưu trữ GitHub và sao chép đường dẫn dự án. Bước hai, mở Terminal và chạy lệnh git clone để tải bộ kỹ năng về thư mục chấm agents xược skills. Bước ba, chạy lệnh npm install để cài đặt đầy đủ các thư viện phụ thuộc. Bước bốn, kiểm tra cấu hình trong file AGENTS chấm md để AI tự động nhận diện quy trình. Bước năm, khởi động giao diện làm việc và bắt đầu tạo sản phẩm tự động từ A đến Z!",
          batGiongDoc: true,
          kieuNhacNen: "chill",
          batNhacNen: true,
          thoiLuongGiay: 60,
          mauChuDao: "#d4ff47",
          mauPhu: "#00f0ff",
          mauNen: "#0b0f19",
          hienThi3D: false,
          cacPhanCanh: [
            {
              nhanPhu: "BƯỚC 01 // CHUẨN BỊ",
              tieuDeCanh: "1. Tìm & Sao Chép Link GitHub",
              noiDungCanh:
                "Truy cập trang GitHub chứa bộ Agent Skills cần dùng và copy đường dẫn HTTPS của repository.",
              loaiMinhHoa2D: "flowchart",
              duLieuMinhHoa: [
                "Truy cập github.com/remotion-dev/skills",
                "Bấm nút Code (Màu xanh lá) → Copy URL",
                "Chuẩn bị sẵn Git & Node.js trên máy tính",
              ],
            },
            {
              nhanPhu: "BƯỚC 02 // TẢI VỀ MÁY",
              tieuDeCanh: "2. Clone Bộ Agent Về Thư Mục Dự Án",
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
                "Cài đặt Core Engine",
                "Tích hợp Animation 2D",
                "Cấu hình Audio & FFmpeg",
                "Sẵn sàng 100%",
              ],
            },
            {
              nhanPhu: "BƯỚC 04 // KÍCH HOẠT SKILL",
              tieuDeCanh: "4. Kiểm Tra Danh Sách Kỹ Năng Agent",
              noiDungCanh:
                "Hệ thống tự động quét thư mục .agents/skills và nạp hướng dẫn SKILL.md vào bộ nhớ.",
              loaiMinhHoa2D: "checklist",
              duLieuMinhHoa: [
                "Phát hiện cấu trúc thư mục .agents/skills/",
                "Đọc file quy chuẩn AGENTS.md ở thư mục gốc",
                "Kích hoạt chế độ tự động thực thi từng bước",
              ],
            },
            {
              nhanPhu: "BƯỚC 05 // HOÀN TẤT",
              tieuDeCanh: "5. Ra Lệnh & Tận Hưởng Kết Quả!",
              noiDungCanh:
                "Giờ bạn chỉ cần nhập yêu cầu bằng tiếng Việt, Agent sẽ tự động làm việc từ A đến Z!",
              loaiMinhHoa2D: "cards",
              duLieuMinhHoa: [
                "🚀 Không cần nhớ câu lệnh phức tạp",
                "🎨 Tự động thiết kế, dựng hình & lồng tiếng",
                "✅ Xuất file hoàn chỉnh chỉ với 1 nút bấm!",
              ],
            },
          ],
        }}
      />
      <Composition
        id="MechaCatDance"
        component={MechaCatDance}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        schema={MechaCatSchema}
        defaultProps={{
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
        }}
      />
      <MyComposition />
    </>
  );
};
