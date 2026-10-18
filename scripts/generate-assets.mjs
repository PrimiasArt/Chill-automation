import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve("public");
fs.mkdirSync(publicDir, { recursive: true });

// 1. Create raw SVG emblem for Mecha-Cat Superhero
const rawSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Mecha Cat Superhero Emblem -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <metadata>Mecha Cat Hero Crest</metadata>
  <defs>
    <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="50%" stop-color="#d4ff47" />
      <stop offset="100%" stop-color="#ff0055" />
    </linearGradient>
  </defs>
  <!-- Outer Shield -->
  <polygon points="120,12 216,58 194,182 120,228 46,182 24,58" fill="#10141f" stroke="url(#cyberGrad)" stroke-width="6" />
  <!-- Mecha Cat Head Silhouette -->
  <polygon points="62,92 48,38 94,68 146,68 192,38 178,92 190,136 154,176 86,176 50,136" fill="#1a2236" stroke="#00f0ff" stroke-width="4" />
  <!-- Glowing Visor -->
  <polygon points="72,110 114,122 126,122 168,110 158,134 120,144 82,134" fill="#d4ff47" />
  <!-- Forehead Hero Star -->
  <polygon points="120,76 130,96 120,108 110,96" fill="#ff0055" />
</svg>`;

const rawSvgPath = path.join(publicDir, "mecha-cat-emblem.svg");
fs.writeFileSync(rawSvgPath, rawSvg, "utf8");
console.log("Saved SVG:", rawSvgPath);

// 2. Synthesize a 6-second 128 BPM Cyberpunk Mecha-Dance Audio Track (44.1kHz 16-bit Stereo WAV)
const sampleRate = 44100;
const durationSeconds = 6.0;
const numSamples = Math.floor(sampleRate * durationSeconds);
const numChannels = 2;
const bytesPerSample = 2;
const dataSize = numSamples * numChannels * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

// WAV Header
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16); // PCM
buffer.writeUInt16LE(1, 20);  // Linear PCM
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

const bpm = 128;
const beatDur = 60 / bpm; // ~0.46875s per beat
const stepDur = beatDur / 4; // 16th note

// Cyberpunk minor pentatonic arpeggio notes (Hz)
const arpNotes = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const bassNotes = [55, 55, 65.41, 73.42];

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const beatPos = (t % beatDur) / beatDur; // 0..1 within each beat
  const beatIndex = Math.floor(t / beatDur);
  const stepIndex = Math.floor(t / stepDur);
  const stepPos = (t % stepDur) / stepDur;

  // 1) Punchy Kick on every beat
  const kickFreq = 150 * Math.exp(-beatPos * 18) + 42;
  const kickEnv = Math.exp(-beatPos * 8.5);
  const kick = Math.sin(2 * Math.PI * kickFreq * (t % beatDur)) * kickEnv * 0.65;

  // 2) Snare / Cyber Clap on beats 1 and 3
  let snare = 0;
  if (beatIndex % 2 === 1) {
    const snareEnv = Math.exp(-beatPos * 16);
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const snap = Math.sin(2 * Math.PI * 240 * (t % beatDur)) * Math.exp(-beatPos * 28);
    snare = (noise * 0.45 + snap * 0.4) * snareEnv;
  }

  // 3) Off-beat Hi-hat on 8th off-beats
  let hat = 0;
  const halfBeatPos = ((t + beatDur * 0.5) % beatDur) / beatDur;
  if (halfBeatPos < 0.25) {
    const hatEnv = Math.exp(-halfBeatPos * 40);
    const highNoise = ((Math.sin(i * 78.233) * 19341.123) % 1);
    hat = highNoise * hatEnv * 0.18;
  }

  // 4) Driving Mecha Bassline (Saw-like wave)
  const bassFreq = bassNotes[Math.floor(beatIndex / 2) % bassNotes.length];
  const bassEnv = 0.3 + 0.7 * (1 - Math.exp(-beatPos * 10)); // sidechain ducking
  const saw = 2 * ((t * bassFreq) - Math.floor(0.5 + t * bassFreq));
  const bass = Math.tanh(saw * 2.2) * bassEnv * 0.28;

  // 5) Neon Synth Lead Arpeggio (Stereo panned)
  const noteFreq = arpNotes[(stepIndex * 3 + beatIndex) % arpNotes.length];
  const arpEnv = Math.exp(-stepPos * 5.5);
  const synthL = Math.sin(2 * Math.PI * noteFreq * t + 0.4 * Math.sin(2 * Math.PI * noteFreq * 2 * t)) * arpEnv * 0.22;
  const synthR = Math.sin(2 * Math.PI * (noteFreq * 1.003) * t + 0.4 * Math.cos(2 * Math.PI * noteFreq * 2 * t)) * arpEnv * 0.22;

  // Fade out slightly at last 0.25s for clean loop
  const masterFade = t > durationSeconds - 0.25 ? (durationSeconds - t) / 0.25 : 1.0;

  const leftSample = Math.max(-0.98, Math.min(0.98, (kick + snare + hat + bass + synthL) * masterFade));
  const rightSample = Math.max(-0.98, Math.min(0.98, (kick + snare + hat * 0.85 + bass + synthR) * masterFade));

  const offset = 44 + i * 4;
  buffer.writeInt16LE(Math.floor(leftSample * 32767), offset);
  buffer.writeInt16LE(Math.floor(rightSample * 32767), offset + 2);
}

const rawWavPath = path.join(publicDir, "mecha-cat-raw.wav");
fs.writeFileSync(rawWavPath, buffer);
console.log("Saved raw WAV:", rawWavPath);
