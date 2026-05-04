import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const sampleRate = 44100;
const outputDir = join(process.cwd(), 'public', 'assets', 'audio');

mkdirSync(outputDir, { recursive: true });

function envelope(t, duration, attack = 0.01, release = 0.08) {
  const attackGain = Math.min(1, t / attack);
  const releaseGain = Math.min(1, (duration - t) / release);
  return Math.max(0, Math.min(attackGain, releaseGain));
}

function sine(freq, t) {
  return Math.sin(Math.PI * 2 * freq * t);
}

function noise(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function renderWav(name, duration, renderer) {
  const sampleCount = Math.floor(sampleRate * duration);
  const dataBytes = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / sampleRate;
    const sample = Math.max(-1, Math.min(1, renderer(t, duration, index))) * 0.42;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }

  writeFileSync(join(outputDir, `${name}.wav`), buffer);
}

const sounds = {
  ui_click: [0.08, (t, d) => sine(760, t) * envelope(t, d, 0.004, 0.035)],
  panel_open: [0.18, (t, d) => (sine(360 + t * 900, t) + sine(520 + t * 600, t) * 0.35) * envelope(t, d, 0.012, 0.09)],
  panel_close: [0.16, (t, d) => (sine(520 - t * 1100, t) + sine(260, t) * 0.25) * envelope(t, d, 0.008, 0.08)],
  cast: [0.28, (t, d, i) => (noise(i) * 0.18 + sine(220 + t * 260, t) * 0.45) * envelope(t, d, 0.015, 0.16)],
  bite: [0.22, (t, d) => (sine(880, t) * 0.55 + sine(1320, t) * 0.22) * envelope(t, d, 0.006, 0.12)],
  catch_success: [0.5, (t, d) => {
    const arpeggio = t < 0.16 ? 520 : t < 0.32 ? 660 : 880;
    return (sine(arpeggio, t) * 0.5 + sine(arpeggio * 2, t) * 0.12) * envelope(t, d, 0.015, 0.22);
  }],
  fish_escape: [0.36, (t, d, i) => (noise(i) * 0.15 + sine(310 - t * 260, t) * 0.5) * envelope(t, d, 0.015, 0.2)],
  upgrade_purchase: [0.42, (t, d) => {
    const step = t < 0.14 ? 440 : t < 0.28 ? 660 : 990;
    return (sine(step, t) * 0.48 + sine(step * 1.5, t) * 0.12) * envelope(t, d, 0.012, 0.2);
  }],
  legendary_warning: [1.15, (t, d, i) => {
    const rumble = sine(58 + Math.sin(t * 10) * 6, t) * 0.7;
    const shimmer = sine(210 + t * 45, t) * 0.16;
    const breath = noise(i) * 0.05;
    return (rumble + shimmer + breath) * envelope(t, d, 0.08, 0.38);
  }],
};

Object.entries(sounds).forEach(([name, [duration, renderer]]) => {
  renderWav(name, duration, renderer);
});

console.log(`Generated ${Object.keys(sounds).length} placeholder WAV files in ${outputDir}`);
