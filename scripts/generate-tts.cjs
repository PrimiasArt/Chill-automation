const fs = require("node:fs");
const path = require("node:path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const text =
  process.argv[2] ||
  "Xin chào các bạn! Mình là Mèo Siêu Nhân Mecha đây, cùng quẩy thật sung nhé!";
const voice = process.argv[3] || "vi-VN-HoaiMyNeural";

(async () => {
  try {
    const publicDir = path.resolve(__dirname, "..", "public");
    fs.mkdirSync(publicDir, { recursive: true });
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(publicDir, text);
    const destPath = path.join(publicDir, "voiceover.mp3");
    if (audioFilePath !== destPath) {
      fs.copyFileSync(audioFilePath, destPath);
    }
    console.log("TTS_OK:", destPath);
    process.exit(0);
  } catch (err) {
    console.error("TTS_ERR:", err.message);
    process.exit(0);
  }
})();
