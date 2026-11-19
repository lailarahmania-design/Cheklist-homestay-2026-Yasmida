// Scene dunia: peta isometrik tiga wilayah, karakter, Lumi, kamera, interaksi pos.

import Phaser from 'phaser';
import { queueTextures, makeTileTextures, SCALE } from '../art/textures.js';
import {
  buildWorld, makeWalkable, toScreen, toGrid, tileAt, regionAt,
  W, H, TW, TH, T, START, POS_POINTS, SIGN_TILE, RIVER, BRIDGE_ROWS, GOLEM_LINE, MID,
} from '../systems/world-map.js';
import { CharacterRig } from '../systems/character-rig.js';
import { Lumi } from '../systems/lumi.js';
import { CameraDirector } from '../systems/camera.js';
import { InputController } from '../systems/input.js';

const WALK_SPEED = 130;
const RUN_SPEED = 215;
const INTERACT_DIST = 1.7; // dalam satuan tile

export class WorldScene extends Phaser.Scene {
  constructor(opts) {
    super({ key: 'world' });
    this.opts = opts; // {characterId, quest, hooks, freeExplore}
  }

  preload() {
    queueTextures(this);
  }

  create() {
    makeTileTextures(this);
    this.world = buildWorld();
    this.unlocked = new Set();
    this.freeExplore = !!this.opts.freeExplore;
    this.refreshWalkable();

    // Batas dunia dalam koordinat layar
    const minX = -(H - 1) * (TW / 2) - TW / 2;
    const maxX = (W - 1) * (TW / 2) + TW / 2;
    const maxY = (W + H - 2) * (TH / 2) + TH;
    this.bounds = { x: minX, y: -TH / 2, width: maxX - minX, height: maxY + TH / 2 + 60 };

    this.drawGround();
    this.drawObjects();
    this.drawWaterShimmer();

    const s = toScreen(...START);
    this.player = new CharacterRig(this, s.x, s.y, this.opts.characterId);
    this.lumi = new Lumi(this, s.x - 40, s.y - 80);

    this.prompt = this.add.container(0, 0).setDepth(100000).setVisible(false);
    const bg = this.add.image(0, 0, 'prompt-bg');
    this.promptText = this.add.text(0, 0, 'E', { fontFamily: 'Baloo 2, Nunito, sans-serif', fontSize: '20px', fontStyle: '800', color: '#2f5d34' }).setOrigin(0.5);
    this.prompt.add([bg, this.promptText]);

    this.cameraDirector = new CameraDirector(this, this.bounds);
    this.cameraDirector.follow(this.player.container);
    this.controls = new InputController(this);

    this.near = null;
    this.region = null;
    this.paused = false;

    this.opts.quest.on(() => this.applyQuest(true));
    this.applyQuest(false);
    this.scale.on('resize', () => this.cameraDirector.update(1));
    this.opts.hooks.onReady?.();
  }

  // ---------------- dunia ----------------
  refreshWalkable() {
    const unlocked = this.freeExplore ? new Set(['pos1', 'pos2', 'pos3']) : this.unlocked;
    this.walkable = makeWalkable(this.world, unlocked);
  }

  drawGround() {
    const { tiles } = this.world;
    const ox = -this.bounds.x;
    const oy = TH / 2;
    const rt = this.add.renderTexture(this.bounds.x, -TH / 2, this.bounds.width, this.bounds.height).setOrigin(0, 0).setDepth(-100000);
    const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
    // batchDraw = satu kali kirim ke GPU (jauh lebih cepat daripada draw() per tile)
    rt.beginDraw();
    // Gambar dari belakang ke depan agar sisi pulau menimpa dengan benar.
    for (let sum = 0; sum <= W + H - 2; sum++) {
      for (let gx = 0; gx < W; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= H) continue;
        const type = tiles[gy][gx];
        const p = toScreen(gx, gy);
        const x = p.x + ox - TW / 2;
        const y = p.y + oy - TH / 2;
        const sand = type === T.SAND || type === T.DUNE || type === T.SANDPATH;
        if (gy === H - 1) rt.batchDraw(type === T.WATER ? 'waterfall' : sand ? 'side-left-sand' : 'side-left', x, y + (type === T.WATER ? TH / 2 : 0));
        if (gx === W - 1) rt.batchDraw(sand ? 'side-right-sand' : 'side-right', x, y);
        rt.batchDraw(`tile-${type}-${hash(gx, gy) % 3}`, x, y);
      }
    }
    rt.endDraw();
  }

  drawObjects() {
    this.objectSprites = {};
    for (const o of this.world.objects) {
      const p = toScreen(o.gx, o.gy);
      const img = this.add.image(p.x, p.y + TH / 4, `obj-${o.key}`).setOrigin(0.5, 1).setScale(1 / SCALE);
      img.setDepth(p.y + (o.key === 'flowers' || o.key === 'flowerBed' ? -20 : 0));
      if (o.key === 'golem') this.objectSprites.golem = img;
      if (o.key === 'gate') this.objectSprites.gate = img;
      if (o.key === 'pedestal') this.objectSprites.pedestal = img;
      if (o.key === 'crystal') this.tweens.add({ targets: img, y: img.y - 4, duration: 1400 + (o.gx % 5) * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Penghalang cahaya di pintu jembatan (Pos 1 belum selesai)
    const b = toScreen(RIVER.from, MID);
    this.barrier = this.add.image(b.x - 8, b.y + 14, 'obj-barrier').setOrigin(0.5, 1).setScale(1 / SCALE).setDepth(b.y + 1);
    this.tweens.add({ targets: this.barrier, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    // Batu jembatan yang belum tersambung: ditutup air, dibuka bertahap per ayat benar.
    this.bridgeCovers = [];
    for (let gx = RIVER.from; gx <= RIVER.to; gx++)
      for (const gy of BRIDGE_ROWS) {
        const p = toScreen(gx, gy);
        this.bridgeCovers.push(this.add.image(p.x, p.y, `tile-water-${(gx + gy) % 3}`).setDepth(-99999));
      }
    this.bridgeProgress = 0;
    // Golem bernapas
    const g = this.objectSprites.golem;
    this.tweens.add({ targets: g, scaleY: g.scaleY * 1.03, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  drawWaterShimmer() {
    this.add.particles(0, 0, 'p-spark', {
      emitZone: {
        type: 'random',
        source: {
          getRandomPoint: (pt) => {
            const gy = 1 + Math.random() * (H - 3);
            const gx = RIVER.from - 0.4 + Math.random() * (RIVER.to - RIVER.from + 0.8);
            const s = toScreen(gx, gy);
            pt.x = s.x;
            pt.y = s.y;
            return pt;
          },
        },
      },
      frequency: 90,
      lifespan: 1200,
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD',
    }).setDepth(-50000);
  }

  /** Terapkan status misi ke dunia (jembatan, golem). */
  applyQuest(animate) {
    this.unlocked = this.opts.quest.unlocked();
    this.refreshWalkable();
    const open1 = this.freeExplore || this.unlocked.has('pos1');
    const open2 = this.freeExplore || this.unlocked.has('pos2');
    this.barrier.setVisible(!open1);
    this.setBridgeProgress(open1 ? 1 : this.bridgeProgress, animate);
    const g = this.objectSprites.golem;
    const home = toScreen(GOLEM_LINE, MID);
    const aside = toScreen(GOLEM_LINE, MID - 3);
    const dest = open2 ? aside : home;
    if (animate) this.tweens.add({ targets: g, x: dest.x, y: dest.y + TH / 4, duration: 1200, ease: 'Sine.easeInOut', onUpdate: () => g.setDepth(g.y) });
    else g.setPosition(dest.x, dest.y + TH / 4).setDepth(dest.y);
  }

  /** Menampilkan batu jembatan sesuai progres puzzle (0..1). */
  setBridgeProgress(frac, animate = true) {
    if (!(this.freeExplore || this.unlocked.has('pos1'))) this.bridgeProgress = frac;
    const n = Math.round(this.bridgeCovers.length * Math.max(0, Math.min(1, frac)));
    this.bridgeCovers.forEach((img, i) => {
      const hide = i < n;
      if (hide && img.visible && animate) {
        this.tweens.add({ targets: img, alpha: 0, duration: 500, onComplete: () => img.setVisible(false) });
        this.add.particles(img.x, img.y, 'p-spark', { speed: { min: 20, max: 60 }, lifespan: 600, scale: { start: 0.8, end: 0 }, blendMode: 'ADD', emitting: false }).explode(8);
      } else if (!hide) img.setVisible(true).setAlpha(1);
      else if (!animate) img.setVisible(false);
    });
  }

  /** Golem terkena jawaban benar. */
  golemHit() {
    const g = this.objectSprites.golem;
    g.setTint(0xffb3a0);
    this.time.delayedCall(220, () => g.clearTint());
    this.tweens.add({ targets: g, x: g.x + 6, duration: 50, yoyo: true, repeat: 3 });
    this.add.particles(g.x, g.y - 60, 'p-star', { speed: { min: 60, max: 140 }, lifespan: 600, scale: { start: 0.8, end: 0 }, gravityY: 200, emitting: false }).explode(10);
    this.player.play('interact');
  }

  /** Serangan balasan golem saat jawaban salah. */
  golemAttack(knockedOut) {
    const g = this.objectSprites.golem;
    const p = this.player;
    this.tweens.add({ targets: g, x: g.x + (p.x - g.x) * 0.25, y: g.y + (p.y - g.y) * 0.25, duration: 160, yoyo: true, ease: 'Quad.easeIn' });
    this.time.delayedCall(160, () => {
      this.cameras.main.shake(260, 0.008);
      p.body.setTint(0xff9a8a);
      this.time.delayedCall(260, () => p.body.clearTint());
      if (knockedOut) p.play('defeat');
      this.lumi.react('sad');
    });
  }

  setFreeExplore(on) {
    this.freeExplore = on;
    this.applyQuest(true);
  }

  // ---------------- gerak & interaksi ----------------
  canStand(x, y) {
    // cek beberapa titik di sekitar kaki agar karakter tidak menempel ke objek
    for (const [dx, dy] of [[0, 0], [-9, 0], [9, 0], [0, -5], [0, 5]]) {
      const t = tileAt(x + dx, y + dy);
      if (!this.walkable(t.gx, t.gy)) return false;
    }
    return true;
  }

  findNear() {
    const g = toGrid(this.player.x, this.player.y);
    let best = null;
    const points = { ...Object.fromEntries(Object.entries(POS_POINTS).map(([k, v]) => [k, v.tile])), sign: [SIGN_TILE[0] + 1, SIGN_TILE[1] + 1] };
    for (const [id, [px, py]] of Object.entries(points)) {
      const d = Math.hypot(g.gx - px, g.gy - py);
      if (d < INTERACT_DIST && (!best || d < best.d)) best = { id, d };
    }
    let focus = false;
    for (const v of Object.values(POS_POINTS)) if (Math.hypot(g.gx - v.tile[0], g.gy - v.tile[1]) < v.zoomRadius) focus = true;
    return { id: best?.id ?? null, focus, grid: g };
  }

  promptAnchor(id) {
    if (id === 'sign') return toScreen(...SIGN_TILE);
    const t = POS_POINTS[id].objectTile;
    return toScreen(t[0], t[1]);
  }

  update(time, deltaMs) {
    const dt = Math.min(0.05, deltaMs / 1000);
    const inp = this.controls.read();
    for (const a of inp.actions) this.handleAction(a);

    let vx = 0;
    let vy = 0;
    if (!this.paused && !this.player.busy && !this.cameraDirector.overview) {
      const speed = inp.run ? RUN_SPEED : WALK_SPEED;
      vx = inp.x;
      vy = inp.y;
      const dx = vx * speed * dt;
      const dy = vy * speed * 0.78 * dt; // sedikit dipipihkan agar terasa isometrik
      const { x, y } = this.player;
      if (this.canStand(x + dx, y + dy)) this.player.setPosition(x + dx, y + dy);
      else if (dx && this.canStand(x + dx, y)) this.player.setPosition(x + dx, y);
      else if (dy && this.canStand(x, y + dy)) this.player.setPosition(x, y + dy);
    }
    this.player.update(dt, { vx, vy, running: inp.run });
    this.lumi.update(dt, this.player, this.player.flip);

    const near = this.findNear();
    if (near.id !== this.near) {
      this.near = near.id;
      this.opts.hooks.onNear?.(near.id);
    }
    if (this.near) {
      const a = this.promptAnchor(this.near);
      const big = this.near === 'pos3' ? 90 : this.near === 'sign' ? 70 : 125;
      this.prompt.setPosition(a.x, a.y - big + Math.sin(time / 250) * 4).setVisible(true);
    } else this.prompt.setVisible(false);
    this.cameraDirector.setMissionFocus(near.focus);
    this.cameraDirector.update(dt);

    const region = regionAt(Math.round(near.grid.gx));
    if (region.id !== this.region) {
      this.region = region.id;
      this.opts.hooks.onRegion?.(region);
    }
  }

  handleAction(a) {
    if (this.paused) return;
    if (a === 'map') {
      this.opts.hooks.onOverview?.(this.cameraDirector.toggleOverview());
      return;
    }
    if (this.cameraDirector.overview) return;
    if (a === 'jump') this.player.play('jump');
    if (a === 'interact') {
      this.player.play('interact');
      if (this.near) this.opts.hooks.onInteract?.(this.near);
    }
  }
}
