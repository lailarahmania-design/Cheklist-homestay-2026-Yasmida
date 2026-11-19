// Peta dunia: satu pulau isometrik yang menghubungkan tiga wilayah.
// Modul ini murni data/logika (tanpa Phaser) sehingga bisa diuji dengan Vitest.
//
//   Hutan (Pos 1) ── sungai + Jembatan Wahyu ── Lembah Tsamud (Pos 2) ── Taman Cahaya (Pos 3)
//
// Sistem koordinat:
//   grid  (gx, gy) → tile.  gx bertambah = arah perjalanan.
//   layar (x, y)   → x = (gx - gy) * TW/2, y = (gx + gy) * TH/2  (pusat tile)

export const TW = 64; // lebar tile
export const TH = 32; // tinggi tile
export const W = 58; // jumlah tile arah gx
export const H = 30; // jumlah tile arah gy
export const MID = 15; // baris jalur utama

export const T = {
  GRASS: 'grass',
  FOREST: 'forest',
  WATER: 'water',
  BRIDGE: 'bridge',
  PATH: 'path',
  SAND: 'sand',
  SANDPATH: 'sandpath',
  DUNE: 'dune',
  GARDEN: 'garden',
  PLAZA: 'plaza',
};

const WALKABLE = new Set([T.GRASS, T.FOREST, T.BRIDGE, T.PATH, T.SAND, T.SANDPATH, T.DUNE, T.GARDEN, T.PLAZA]);

export const REGIONS = [
  { id: 'forest', name: 'Hutan Jembatan Wahyu', from: 0, to: 19 },
  { id: 'river', name: 'Sungai Cahaya', from: 20, to: 22 },
  { id: 'desert', name: 'Lembah Kaum Tsamud', from: 23, to: 41 },
  { id: 'garden', name: 'Taman Cahaya', from: 42, to: W - 1 },
];

export const RIVER = { from: 20, to: 22 };
export const BRIDGE_ROWS = [MID - 1, MID, MID + 1];
export const CANYON = { from: 35, to: 41, open: [MID - 2, MID + 2] };
export const GOLEM_LINE = 40;
export const TREE_CENTER = [49, MID];

/** Titik interaksi tiap pos + objek penandanya. */
export const POS_POINTS = {
  pos1: { tile: [18, MID], objectTile: [19, MID], zoomRadius: 5 },
  pos2: { tile: [38, MID], objectTile: [GOLEM_LINE, MID], zoomRadius: 6 },
  pos3: { tile: [54, MID], objectTile: [55, MID], zoomRadius: 6 },
};
export const START = [3, MID];
export const SIGN_TILE = [4, MID - 2];

export function toScreen(gx, gy) {
  return { x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) };
}
export function toGrid(x, y) {
  const a = x / (TW / 2);
  const b = y / (TH / 2);
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}
export function tileAt(x, y) {
  const { gx, gy } = toGrid(x, y);
  return { gx: Math.round(gx), gy: Math.round(gy) };
}

export function regionAt(gx) {
  return REGIONS.find((r) => gx >= r.from && gx <= r.to) || REGIONS[0];
}

// Pembangkit acak dengan benih tetap: peta selalu sama untuk semua kelompok.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Bentuk jalur utama (berkelok halus) untuk setiap gx. */
export function pathRow(gx) {
  if (gx >= 16 && gx <= 25) return MID; // lurus di sekitar jembatan
  if (gx >= 36) return MID; // lurus di ngarai & taman
  return MID + Math.round(1.6 * Math.sin(gx / 3.2));
}

export function buildWorld() {
  const rand = rng(20261119);
  const tiles = Array.from({ length: H }, () => Array(W).fill(T.GRASS));
  const blocked = new Set();
  const objects = [];
  const key = (gx, gy) => `${gx},${gy}`;
  const block = (gx, gy) => blocked.add(key(gx, gy));
  const reserved = new Set(); // tile yang tidak boleh diberi dekorasi

  // --- dasar wilayah ---
  for (let gy = 0; gy < H; gy++) {
    for (let gx = 0; gx < W; gx++) {
      let t;
      if (gx <= 19) t = rand() < 0.35 ? T.FOREST : T.GRASS;
      else if (gx <= 22) t = T.WATER;
      else if (gx <= 41) t = (gx - 23) < 2 ? T.GRASS : rand() < 0.25 ? T.DUNE : T.SAND;
      else t = T.GARDEN;
      tiles[gy][gx] = t;
    }
  }

  // --- jalur utama ---
  for (let gx = 1; gx < W - 1; gx++) {
    if (gx >= RIVER.from && gx <= RIVER.to) continue;
    const row = pathRow(gx);
    const t = gx <= 19 ? T.PATH : gx <= 41 ? T.SANDPATH : T.PLAZA;
    tiles[row][gx] = t;
    reserved.add(key(gx, row));
    reserved.add(key(gx, row - 1));
    reserved.add(key(gx, row + 1));
    // sambungan diagonal agar jalur tidak terputus
    const prev = pathRow(gx - 1);
    if (prev !== row) {
      tiles[prev][gx] = t;
      reserved.add(key(gx, prev));
    }
  }

  // --- jembatan ---
  for (let gx = RIVER.from; gx <= RIVER.to; gx++) for (const gy of BRIDGE_ROWS) tiles[gy][gx] = T.BRIDGE;
  for (let gy = MID - 2; gy <= MID + 2; gy++) {
    reserved.add(key(19, gy));
    reserved.add(key(23, gy));
  }

  // --- plaza taman di sekitar pohon besar ---
  const [tx, ty] = TREE_CENTER;
  for (let gy = ty - 4; gy <= ty + 4; gy++)
    for (let gx = tx - 4; gx <= tx + 6; gx++) {
      const d = Math.hypot((gx - tx) * 0.9, gy - ty);
      if (d <= 4.2 && gx < W - 1) {
        tiles[gy][gx] = T.PLAZA;
        reserved.add(key(gx, gy));
      }
    }
  for (let gx = tx; gx <= 56; gx++) {
    tiles[MID][gx] = T.PLAZA;
    reserved.add(key(gx, MID));
  }

  // --- area awal ---
  for (let gy = MID - 3; gy <= MID + 3; gy++) for (let gx = 1; gx <= 6; gx++) reserved.add(key(gx, gy));

  // --- tepi pulau tidak bisa dilalui ---
  for (let gx = 0; gx < W; gx++) {
    block(gx, 0);
    block(gx, H - 1);
  }
  for (let gy = 0; gy < H; gy++) {
    block(0, gy);
    block(W - 1, gy);
  }

  const place = (k, gx, gy, { solid = true, footprint = 0 } = {}) => {
    objects.push({ key: k, gx, gy });
    if (solid) for (let y = gy - footprint; y <= gy + footprint; y++) for (let x = gx - footprint; x <= gx + footprint; x++) block(x, y);
    for (let y = gy - footprint; y <= gy + footprint; y++) for (let x = gx - footprint; x <= gx + footprint; x++) reserved.add(key(x, y));
  };
  const free = (gx, gy) => gx > 0 && gy > 0 && gx < W - 1 && gy < H - 1 && !reserved.has(key(gx, gy)) && tiles[gy][gx] !== T.WATER;

  // ---------- objek tetap ----------
  place('sign', SIGN_TILE[0], SIGN_TILE[1]);
  // Pos 1: gerbang bercahaya di tepi barat jembatan
  place('gate', 19, MID, { solid: false });
  place('lantern', 19, MID - 2);
  place('lantern', 19, MID + 2);
  place('crystal', 18, MID - 3);
  place('crystal', 18, MID + 3);
  place('lantern', 23, MID - 2);
  place('lantern', 23, MID + 2);
  for (const gx of [7, 11, 15]) place('lantern', gx, pathRow(gx) - 2);

  // Pos 2: ngarai berbatu dengan golem penjaga
  for (let gx = CANYON.from; gx <= CANYON.to; gx++)
    for (let gy = 1; gy < H - 1; gy++) if (gy < CANYON.open[0] || gy > CANYON.open[1]) block(gx, gy);
  for (let gx = CANYON.from; gx <= CANYON.to; gx += 2) {
    for (let gy = 2; gy < CANYON.open[0]; gy += 3) objects.push({ key: 'cliff', gx, gy });
    for (let gy = CANYON.open[1] + 2; gy < H - 1; gy += 3) objects.push({ key: 'cliff', gx, gy });
    objects.push({ key: 'cliff', gx, gy: CANYON.open[0] - 1 });
    objects.push({ key: 'cliff', gx: gx + 1, gy: CANYON.open[1] + 1 });
  }
  for (let gx = CANYON.from; gx <= CANYON.to; gx++) for (let gy = 0; gy < H; gy++) if (gy < CANYON.open[0] || gy > CANYON.open[1]) reserved.add(key(gx, gy));
  place('golem', GOLEM_LINE, MID, { solid: false });
  place('banner', GOLEM_LINE - 1, CANYON.open[0]);
  place('banner', GOLEM_LINE - 1, CANYON.open[1]);
  place('temple', 30, 6, { footprint: 2 });
  place('ruin', 27, 22, { footprint: 1 });
  place('ruin', 33, 24, { footprint: 1 });
  for (const [gx, gy] of [[26, 10], [29, 11], [32, 19], [28, 19], [34, 11]]) place('pillar', gx, gy);
  for (const [gx, gy] of [[25, 19], [31, 21], [27, 9], [33, 9]]) place('brokenPillar', gx, gy);
  for (const [gx, gy] of [[24, 4], [24, 25], [25, 8], [26, 26], [24, 20]]) place('palm', gx, gy);

  // Pos 3: pohon cahaya, air mancur, prasasti
  place('bigTree', tx, ty, { footprint: 1 });
  place('fountain', 46, 10, { footprint: 1 });
  place('pedestal', POS_POINTS.pos3.objectTile[0], POS_POINTS.pos3.objectTile[1]);
  for (const [gx, gy] of [[45, 12], [45, 18], [53, 11], [53, 19]]) place('lantern', gx, gy);
  for (const [gx, gy] of [[44, 6], [50, 6], [55, 7], [44, 23], [50, 24], [55, 23], [47, 21], [52, 22]]) place('flowerBed', gx, gy, { solid: false });
  for (const [gx, gy] of [[56, 12], [56, 18]]) place('crystal', gx, gy);

  // ---------- dekorasi acak ----------
  for (let gy = 1; gy < H - 1; gy++) {
    for (let gx = 1; gx < W - 1; gx++) {
      if (!free(gx, gy)) continue;
      const r = rand();
      if (gx <= 18) {
        if (r < 0.2) place(rand() < 0.5 ? 'tree' : 'pine', gx, gy);
        else if (r < 0.26) place('bush', gx, gy);
        else if (r < 0.31) place('flowers', gx, gy, { solid: false });
        else if (r < 0.33) place('rock', gx, gy);
      } else if (gx >= 24 && gx < CANYON.from) {
        if (r < 0.05) place('rock', gx, gy);
        else if (r < 0.08) place('cliff', gx, gy);
        else if (r < 0.1) place('palm', gx, gy);
      } else if (gx >= 42) {
        if (r < 0.08) place('tree', gx, gy);
        else if (r < 0.2) place('flowers', gx, gy, { solid: false });
        else if (r < 0.24) place('bush', gx, gy);
      }
    }
  }

  // Tile yang terkunci sampai pos selesai.
  const locks = {
    pos1: BRIDGE_ROWS.flatMap((gy) => [RIVER.from, RIVER.from + 1, RIVER.to].map((gx) => key(gx, gy))),
    pos2: Array.from({ length: CANYON.open[1] - CANYON.open[0] + 1 }, (_, i) => key(GOLEM_LINE, CANYON.open[0] + i)),
  };

  return { tiles, blocked, objects, locks };
}

/**
 * Pengecek tile dapat dilalui.
 * @param world hasil buildWorld()
 * @param unlocked Set id pos yang sudah selesai / dibuka
 */
export function makeWalkable(world, unlocked) {
  return (gx, gy) => {
    if (gx < 0 || gy < 0 || gx >= W || gy >= H) return false;
    const k = `${gx},${gy}`;
    if (world.blocked.has(k)) return false;
    for (const [pos, list] of Object.entries(world.locks)) if (!unlocked.has(pos) && list.includes(k)) return false;
    return WALKABLE.has(world.tiles[gy][gx]);
  };
}

/** Pencarian jalur BFS (dipakai untuk tes konektivitas & nanti navigasi Lumi). */
export function reachable(walk, from, to) {
  const seen = new Set([from.join(',')]);
  const q = [from];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === to[0] && y === to[1]) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [x + dx, y + dy];
      const k = n.join(',');
      if (!seen.has(k) && walk(n[0], n[1])) {
        seen.add(k);
        q.push(n);
      }
    }
  }
  return false;
}
