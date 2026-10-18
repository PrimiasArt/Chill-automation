# Chill Automation — AI Video Pipeline (20-Repo Stack)

Workspace này được cấu hình sẵn cho **Gemini 4 Argon** để tự động dựng video từ A đến Z theo quy trình 7 bước:
`brief` $\rightarrow$ `design` $\rightarrow$ `animate` $\rightarrow$ `build` $\rightarrow$ `sound` $\rightarrow$ `render` $\rightarrow$ `review` $\rightarrow$ `ship`.

## 1. Agent Skills (`.agents/skills/`)
Trước khi viết code hoặc dựng video, luôn tham khảo các bộ skill đã cài đặt sẵn trong `.agents/skills/`:
- **Remotion Skills** (`remotion-best-practices`, `remotion-create`, `remotion-markup`, `remotion-render`, `remotion-multimedia`, `remotion-interactivity`, `remotion-captions`, `remotion-maps`, `remotion-studio`, `remotion-docs`): Quy chuẩn viết composition, timeline, 3D (`@remotion/three`), âm thanh và xuất video.
- **Motion AI Kit** (`motion`): Quy chuẩn animation giao diện & layout với `motion` (`motion/react`) và CSS spring.
- **GSAP Skills** (`gsap-core`, `gsap-timeline`, `gsap-react`, `gsap-plugins`, `gsap-scrolltrigger`, `gsap-utils`, `gsap-performance`, `gsap-frameworks`): Quy chuẩn điều khiển timeline phức tạp và hoạt hình SVG/chữ với GSAP.

## 2. Kiến trúc 20 Repo theo từng lớp
1. **Agent Skills:** `remotion-skills`, `motion-ai-kit`, `gsap-skills` (đã tích hợp tại `.agents/skills/`).
2. **Design:**
   - `svgo`: Tối ưu hóa file SVG (`npx.cmd svgo <file.svg>`) trước khi đưa vào animation.
   - `satori`: Render thẻ tiêu đề / layout từ JSX sang SVG sắc nét.
3. **Animation 2D:**
   - `gsap` (`@gsap/react`): Chạy timeline chữ và chuyển động phức hợp (đồng bộ theo frame của Remotion `tl.seek(frame / fps)`).
   - `animejs`: Vẽ đường viền vector (`stroke-dashoffset`) và hiệu ứng SVG.
   - `motion`: Bố cục giao diện và hiệu ứng chuyển tiếp UI.
   - `@rive-app/react-canvas` / `@remotion/rive` & `@lottiefiles/dotlottie-react` / `@remotion/lottie`: Phát hoạt hình vector có sẵn.
4. **Video Engine:**
   - `remotion`: Dựng video bằng React theo từng frame (`useCurrentFrame()`, `useVideoConfig()`, `interpolate()`).
   - `@motion-canvas/core` / `@motion-canvas/2d`: Dựng biểu đồ giải thích kỹ thuật khi cần.
5. **3D Scene:**
   - `three`, `@react-three/fiber`, `@remotion/three`: Dựng cảnh 3D trong `<ThreeCanvas width={width} height={height}>` (luôn điều khiển chuyển động qua `useCurrentFrame()`, không dùng `useFrame()`).
   - `@react-three/drei`: Camera (`<PerspectiveCamera/>`), chữ 3D (`<Text/>`), môi trường và ánh sáng.
   - `@react-three/rapier`: Mô phỏng vật lý rơi và va chạm.
   - `@react-three/postprocessing`: Hiệu ứng hậu kỳ (`<Bloom/>`, `<DepthOfField/>`).
6. **Âm thanh & Xuất bản (`sound` -> `render` -> `review` -> `ship`):**
   - `@remotion/media` / `howler`: Quản lý hiệu ứng âm thanh (SFX) và nhạc nền.
   - `mediabunny`: Encode/xử lý video ngay trong trình duyệt qua WebCodecs.
   - `npx.cmd remotion ffmpeg` & `npx.cmd remotion ffprobe`: Kiểm tra thông số video đầu ra (độ phân giải, FPS, codec H.264, âm lượng chuẩn `-13 LUFS`) kết hợp với khả năng **Multimodal** của Gemini 4 Argon (dùng `view_file` xem trực tiếp file `.mp4` sau khi render để kiểm tra bố cục, chuyển động và âm thanh).

## 3. Lưu ý môi trường Windows PowerShell
- Khi chạy lệnh `npm` hoặc `npx` trong PowerShell trên máy này, sử dụng `npm.cmd` và `npx.cmd` để tránh lỗi ExecutionPolicy của `npm.ps1`.
- Dùng `npx.cmd remotion ffmpeg` và `npx.cmd remotion ffprobe` cho mọi tác vụ xử lý và kiểm định video/audio.
