const fs = require('fs');
const path = require('path');

function writeWav(filePath) {
  const sampleRate = 22050;
  const duration = 0.2;
  const n = Math.floor(sampleRate * duration);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 14);
    const sample = Math.round(Math.sin(2 * Math.PI * 880 * t) * env * 20000);
    buf.writeInt16LE(sample, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

const roots = [
  path.join(__dirname, '../../admin/public/alert.wav'),
  path.join(__dirname, '../../customer/public/alert.wav'),
];
roots.forEach(writeWav);
console.log('wrote', roots.join(', '));
