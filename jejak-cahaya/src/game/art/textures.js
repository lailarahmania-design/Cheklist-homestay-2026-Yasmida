// Pembuatan tekstur: SVG (karakter, Lumi, objek) dimuat sebagai gambar 2x,
// tile isometrik digambar langsung dengan Graphics Phaser.

import { CHARACTER_IDS } from '../../core/constants.js';
import { characterSVG, lumiSVG } from '../../ui/characters.js';
import { OBJECTS, PARTICLES } from './objects.js';
import { TW, TH, T } from '../systems/world-map.js';

export const SCALE = 2; // tekstur dibuat 2x, ditampilkan setScale(1/SCALE)
export const CHAR_W = 56; // lebar karakter di dunia (px)

const toDataURL = (svg) => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
// Ubah width/height SVG menjadi 2x agar tajam saat di-zoom.
const upscale = (svg, w, h) =>
  svg.replace(/<svg([^>]*?)width="[\d.]+"([^>]*?)height="[\d.]+"/, `<svg$1width="${w * SCALE}"$2height="${h * SCALE}"`);

export function queueTextures(scene) {
  const L = scene.load;
  for (const id of CHARACTER_IDS) {
    for (const view of ['front', 'back']) {
      const raw = characterSVG(id, { size: CHAR_W * SCALE, view, shadow: false }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      L.image(`${id}-${view}`, toDataURL(raw));
    }
  }
  for (const mood of ['happy', 'sad']) L.image(`lumi-${mood}`, toDataURL(lumiSVG({ size: 48 * SCALE, mood }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')));
  for (const [k, o] of Object.entries(OBJECTS)) L.image(`obj-${k}`, toDataURL(upscale(o.svg, o.w, o.h)));
  for (const [k, s] of Object.entries(PARTICLES)) L.image(`p-${k}`, toDataURL(s));
}

// ---------------- tile ----------------
const PALETTE = {
  [T.GRASS]: [0x7cbf4a, 0x74b743, 0x84c653],
  [T.FOREST]: [0x5ea23d, 0x579a38, 0x66aa44],
  [T.WATER]: [0x3aa6d0, 0x42b0da, 0x369dc6],
  [T.BRIDGE]: [0xcfc4a6, 0xc6bb9c, 0xd8cdb0],
  [T.PATH]: [0x7cbf4a, 0x74b743, 0x84c653],
  [T.SAND]: [0xe8c48a, 0xe2bc80, 0xedca93],
  [T.DUNE]: [0xd9ad72, 0xd3a76b, 0xdfb57b],
  [T.SANDPATH]: [0xe8c48a, 0xe2bc80, 0xedca93],
  [T.GARDEN]: [0x8fd06a, 0x86c862, 0x98d873],
  [T.PLAZA]: [0xf1e4c3, 0xebddb9, 0xf5eacd],
};

function diamond(g, color, edge) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(TW / 2, 0);
  g.lineTo(TW, TH / 2);
  g.lineTo(TW / 2, TH);
  g.lineTo(0, TH / 2);
  g.closePath();
  g.fillPath();
  if (edge !== undefined) {
    g.lineStyle(1, edge, 0.25);
    g.strokePath();
  }
}

export function makeTileTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const make = (key, w, h) => {
    g.generateTexture(key, w, h);
    g.clear();
  };
  for (const [type, colors] of Object.entries(PALETTE)) {
    colors.forEach((c, i) => {
      diamond(g, c, type === T.WATER ? 0xffffff : 0x000000);
      if (type === T.GRASS || type === T.FOREST || type === T.GARDEN) {
        g.lineStyle(1.2, 0x3f7f2a, 0.35);
        for (let k = 0; k < 4; k++) {
          const x = 14 + ((k * 13 + i * 7) % 36);
          const y = 10 + ((k * 5 + i * 3) % 12);
          g.lineBetween(x, y, x + 1, y - 3);
        }
      }
      if (type === T.WATER) {
        g.lineStyle(1.5, 0xffffff, 0.45);
        g.lineBetween(18 + i * 4, 14, 28 + i * 4, 12);
        g.lineBetween(34 - i * 3, 20, 44 - i * 3, 18);
      }
      if (type === T.SAND || type === T.DUNE || type === T.SANDPATH) {
        g.fillStyle(0xb98a52, 0.35);
        for (let k = 0; k < 4; k++) g.fillCircle(16 + ((k * 11 + i * 5) % 32), 10 + ((k * 7) % 12), 1);
      }
      if (type === T.BRIDGE) {
        g.lineStyle(1.5, 0x9b9178, 0.8);
        g.lineBetween(TW / 4, TH / 4, TW * 0.75, TH * 0.75);
        g.lineBetween(TW / 2, 0, TW / 2, TH);
      }
      if (type === T.PLAZA) {
        g.lineStyle(1, 0xc9b98f, 0.8);
        g.lineBetween(TW / 4, TH / 4 + 8, TW / 2 + 8, TH * 0.75 + 4);
        g.lineBetween(TW / 2 - 6, TH / 4, TW * 0.75 - 6, TH * 0.75);
      }
      if (type === T.PATH || type === T.SANDPATH) {
        // batu pijakan keemasan seperti pada konsep
        g.fillStyle(0xf2c94c, 1);
        g.fillEllipse(TW / 2 - 8, TH / 2 - 1, 18, 9);
        g.fillEllipse(TW / 2 + 9, TH / 2 + 2, 14, 7);
        g.fillStyle(0xfff0a8, 0.9);
        g.fillEllipse(TW / 2 - 10, TH / 2 - 3, 8, 3);
      }
      make(`tile-${type}-${i}`, TW, TH);
    });
  }
  // sisi pulau (tebing tanah) & air terjun
  const side = (key, left, colors) => {
    const d = 46;
    g.fillStyle(colors[0], 1);
    g.beginPath();
    if (left) {
      g.moveTo(0, 0); g.lineTo(TW / 2, TH / 2); g.lineTo(TW / 2, TH / 2 + d); g.lineTo(0, d);
    } else {
      g.moveTo(TW / 2, TH / 2); g.lineTo(TW, 0); g.lineTo(TW, d); g.lineTo(TW / 2, TH / 2 + d);
    }
    g.closePath();
    g.fillPath();
    g.fillStyle(colors[1], 1);
    if (left) { g.beginPath(); g.moveTo(0, 0); g.lineTo(TW / 2, TH / 2); g.lineTo(TW / 2, TH / 2 + 7); g.lineTo(0, 7); g.closePath(); g.fillPath(); }
    else { g.beginPath(); g.moveTo(TW / 2, TH / 2); g.lineTo(TW, 0); g.lineTo(TW, 7); g.lineTo(TW / 2, TH / 2 + 7); g.closePath(); g.fillPath(); }
    g.lineStyle(1, 0x000000, 0.12);
    for (let y = 18; y < d; y += 10) left ? g.lineBetween(2, y, TW / 2 - 2, y + TH / 2 - 2) : g.lineBetween(TW / 2 + 2, y + TH / 2 - 2, TW - 2, y);
    make(key, TW, TH / 2 + d);
  };
  side('side-left', true, [0x8a5a34, 0x5a9a3a]);
  side('side-right', false, [0x734a2a, 0x4f8a33]);
  side('side-left-sand', true, [0xb07a48, 0xd9ad72]);
  side('side-right-sand', false, [0x986538, 0xc89c62]);
  // air terjun
  g.fillStyle(0x5fc0e6, 0.95);
  g.fillRect(0, 0, TW / 2, 150);
  g.fillStyle(0xdff6ff, 0.8);
  for (let x = 3; x < TW / 2; x += 7) g.fillRect(x, 0, 2, 150);
  make('waterfall', TW / 2, 150);
  // penanda interaksi
  g.fillStyle(0xffffff, 1);
  g.fillCircle(16, 16, 15);
  g.lineStyle(3, 0x2f5d34, 1);
  g.strokeCircle(16, 16, 15);
  make('prompt-bg', 32, 32);
  g.destroy();
}
