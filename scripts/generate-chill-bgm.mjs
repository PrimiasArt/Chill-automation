import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve("public");
fs.mkdirSync(publicDir, { recursive: true });

// Generate a 12-second loopable Chill / Upbeat Lo-Fi Marimba & Warm Rhodes melody (44.1kHz Stereo WAV)
const sampleRate = 44100;
const durationSeconds = 12.0;
const numSamples = Math.floor(sampleRate * durationSeconds);
const numChannels = 2;
const bytesPerSample = 2;
const dataSize = numSamples * numChannels * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

const bpm = 100; // Relaxed, cheerful 100 BPM
const beatDur = 60 / bpm; // 0.6s per beat
const stepDur = beatDur / 2; // 8th notes (0.3s)

// Cheerful C Major 7 / F Major 7 / G6 / Am7 warm chord progression & pluck melody
const melodyNotes = [
  523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392.0,
  440.0,  523.25, 659.25, 783.99, 698.46, 659.25, 587.33, 523.25,
];
const chordRoots = [261.63, 349.23, 220.0, 196.0];

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const beatPos = (t % beatDur) / beatDur;
  const beatIndex = Math.floor(t / beatDur);
  const stepIndex = Math.floor(t / stepDur);
  const stepPos = (t % stepDur) / stepDur;

  // 1) Soft Lo-Fi Rim/Kick on beats
  const kickFreq = 95 * Math.exp(-beatPos * 20) + 45;
  const kickEnv = Math.exp(-beatPos * 12);
  const softKick = Math.sin(2 * Math.PI * kickFreq * (t % beatDur)) * kickEnv * 0.25;

  // 2) Gentle shaker on off-beats
  let shaker = 0;
  if (stepIndex % 2 === 1) {
    const shEnv = Math.exp(-stepPos * 28);
    const noise = ((Math.sin(i * 45.123) * 23421.67) % 1);
    shaker = noise * shEnv * 0.05;
  }

  // 3) Warm Rhodes Pad Chords
  const chordRoot = chordRoots[Math.floor(beatIndex / 4) % chordRoots.length];
  const padL =
    (Math.sin(2 * Math.PI * chordRoot * t) +
      0.6 * Math.sin(2 * Math.PI * (chordRoot * 1.25) * t) +
      0.5 * Math.sin(2 * Math.PI * (chordRoot * 1.5) * t)) *
    0.11;
  const padR =
    (Math.sin(2 * Math.PI * (chordRoot * 1.002) * t) +
      0.6 * Math.sin(2 * Math.PI * (chordRoot * 1.252) * t) +
      0.5 * Math.sin(2 * Math.PI * (chordRoot * 1.498) * t)) *
    0.11;

  // 4) Cheerful Marimba / Kalimba Pluck Melody
  const noteFreq = melodyNotes[stepIndex % melodyNotes.length];
  const pluckEnv = Math.exp(-stepPos * 9.5);
  const pluck =
    (Math.sin(2 * Math.PI * noteFreq * t) +
      0.3 * Math.sin(2 * Math.PI * noteFreq * 3 * t) * Math.exp(-stepPos * 22)) *
    pluckEnv *
    0.22;

  const left = Math.max(-0.95, Math.min(0.95, softKick + shaker + padL + pluck * 0.9));
  const right = Math.max(-0.95, Math.min(0.95, softKick + shaker * 0.8 + padR + pluck * 1.05));

  const offset = 44 + i * 4;
  buffer.writeInt16LE(Math.floor(left * 32767), offset);
  buffer.writeInt16LE(Math.floor(right * 32767), offset + 2);
}

const wavPath = path.join(publicDir, "chill-raw.wav");
fs.writeFileSync(wavPath, buffer);
console.log("Generated chill-raw.wav");
