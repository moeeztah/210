// One-off generator for the PWA icons ("210" in block digits). Run with: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// 3x5 bitmaps for each digit, joined with a 1-column gap -> 11x5 grid.
const DIGITS = {
  2: ['111', '001', '111', '100', '111'],
  1: ['010', '110', '010', '010', '111'],
  0: ['111', '101', '101', '101', '111'],
};
const GLYPH = [0, 1, 2, 3, 4].map((row) => ['2', '1', '0'].map((d) => DIGITS[d][row]).join('0'));

function makePng(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const bg = [0, 0, 0, 255]; // black
  const accent = [229, 22, 31, 255]; // red
  const cell = Math.floor((size * 0.62) / 11); // glyph spans ~62% of the icon (inside maskable safe zone)
  const gx = Math.floor((size - cell * 11) / 2);
  const gy = Math.floor((size - cell * 5) / 2);

  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      let pixel = bg;
      const col = Math.floor((x - gx) / cell);
      const row = Math.floor((y - gy) / cell);
      if (x >= gx && y >= gy && col < 11 && row < 5 && GLYPH[row][col] === '1') pixel = accent;

      raw[offset++] = pixel[0];
      raw[offset++] = pixel[1];
      raw[offset++] = pixel[2];
      raw[offset++] = pixel[3];
    }
  }

  const idat = chunk('IDAT', zlib.deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), makePng(size));
  console.log(`wrote icons/icon-${size}.png`);
}
