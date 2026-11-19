import { describe, it, expect } from 'vitest';
import { buildWorld, makeWalkable, reachable, toScreen, toGrid, POS_POINTS, START, regionAt, W, H, T } from '../../src/game/systems/world-map.js';

const world = buildWorld();
const walk = (...ids) => makeWalkable(world, new Set(ids));
const p = (id) => POS_POINTS[id].tile;

describe('peta dunia', () => {
  it('konversi isometrik bolak-balik', () => {
    for (const [gx, gy] of [[0, 0], [10, 3], [57, 29]]) {
      const s = toScreen(gx, gy);
      const g = toGrid(s.x, s.y);
      expect(g.gx).toBeCloseTo(gx);
      expect(g.gy).toBeCloseTo(gy);
    }
  });

  it('peta selalu sama (benih tetap)', () => {
    expect(JSON.stringify(buildWorld().objects)).toBe(JSON.stringify(world.objects));
  });

  it('titik awal & titik pos dapat dipijak', () => {
    const w = walk('pos1', 'pos2');
    for (const t of [START, p('pos1'), p('pos2'), p('pos3')]) expect(w(...t)).toBe(true);
  });

  it('tiga wilayah tersambung secara bertahap', () => {
    expect(reachable(walk(), START, p('pos1'))).toBe(true);
    expect(reachable(walk(), START, p('pos2'))).toBe(false); // jembatan belum tersambung
    expect(reachable(walk('pos1'), START, p('pos2'))).toBe(true);
    expect(reachable(walk('pos1'), START, p('pos3'))).toBe(false); // golem masih menjaga
    expect(reachable(walk('pos1', 'pos2'), START, p('pos3'))).toBe(true);
  });

  it('sungai tidak dapat dilalui kecuali lewat jembatan', () => {
    const w = walk('pos1', 'pos2');
    expect(world.tiles[3][21]).toBe(T.WATER);
    expect(w(21, 3)).toBe(false);
    expect(w(21, 15)).toBe(true);
  });

  it('wilayah sesuai urutan perjalanan', () => {
    expect(regionAt(START[0]).id).toBe('forest');
    expect(regionAt(p('pos2')[0]).id).toBe('desert');
    expect(regionAt(p('pos3')[0]).id).toBe('garden');
    expect(W).toBeGreaterThan(H);
  });
});
