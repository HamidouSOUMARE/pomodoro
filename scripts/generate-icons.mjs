/**
 * Génère les icônes PWA à partir du sprite de la tomate.
 * Une seule source de vérité : src/lib/sprites.ts.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSprite } from '../src/lib/sprites.ts';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const BACKGROUND = '#1c241e';

const CRC_TABLE = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Encode un buffer RGBA en PNG, sans dépendance. */
function encodePng(rgba, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // profondeur
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filtre "none" : l'image est déjà minuscule
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function parseColor(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

/**
 * Dessine le sprite au plus grand facteur entier qui tient dans `coverage`,
 * pour que chaque pixel d'origine reste un carré parfait.
 */
function renderIcon({ size, coverage, background }) {
  const sprite = getSprite('focus');
  const scale = Math.max(1, Math.floor((size * coverage) / Math.max(sprite.width, sprite.height)));
  const offsetX = Math.round((size - sprite.width * scale) / 2);
  const offsetY = Math.round((size - sprite.height * scale) / 2);

  const rgba = Buffer.alloc(size * size * 4);
  if (background) {
    const [r, g, b, a] = parseColor(background);
    for (let i = 0; i < size * size; i += 1) {
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      rgba[i * 4 + 3] = a;
    }
  }

  for (const pixel of sprite.pixels) {
    const [r, g, b] = parseColor(pixel.fill);
    for (let dy = 0; dy < scale; dy += 1) {
      for (let dx = 0; dx < scale; dx += 1) {
        const x = offsetX + pixel.x * scale + dx;
        const y = offsetY + pixel.y * scale + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const i = (y * size + x) * 4;
        rgba[i] = r;
        rgba[i + 1] = g;
        rgba[i + 2] = b;
        rgba[i + 3] = 255;
      }
    }
  }

  return encodePng(rgba, size);
}

const ICONS = [
  { file: 'favicon-64.png', size: 64, coverage: 1, background: null },
  { file: 'icon-192.png', size: 192, coverage: 1, background: null },
  { file: 'icon-512.png', size: 512, coverage: 1, background: null },
  // iOS n'aime pas la transparence : fond plein
  { file: 'apple-touch-icon.png', size: 180, coverage: 0.78, background: BACKGROUND },
  // maskable : le contenu doit tenir dans les 80 % centraux
  { file: 'icon-maskable-512.png', size: 512, coverage: 0.6, background: BACKGROUND },
];

for (const icon of ICONS) {
  const png = renderIcon(icon);
  writeFileSync(join(OUT_DIR, icon.file), png);
  console.log(`${icon.file.padEnd(24)} ${icon.size}x${icon.size}  ${png.length} octets`);
}
