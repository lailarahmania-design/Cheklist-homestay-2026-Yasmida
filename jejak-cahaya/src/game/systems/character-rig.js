// Karakter chibi + animasi prosedural:
// idle, walk, run, jump, interact, victory, defeat.
// Animasi dibuat dengan transformasi (pantulan, condong, squash & stretch) sehingga
// gaya chibi tetap konsisten untuk keempat karakter.

import { SCALE } from '../art/textures.js';

export const ANIMS = ['idle', 'walk', 'run', 'jump', 'interact', 'victory', 'defeat'];

export class CharacterRig {
  constructor(scene, x, y, characterId) {
    this.scene = scene;
    this.characterId = characterId;
    this.container = scene.add.container(x, y);
    this.shadow = scene.add.ellipse(0, 0, 40, 13, 0x1b2a10, 0.25);
    this.body = scene.add.image(0, 0, `${characterId}-front`).setOrigin(0.5, 0.94).setScale(1 / SCALE);
    this.container.add([this.shadow, this.body]);
    this.state = 'idle';
    this.facing = 'front';
    this.flip = false;
    this.t = 0;
    this.phase = 0;
    this.action = null; // {name, t, dur}
    this.dustTimer = 0;
    this.dust = scene.add.particles(0, 0, 'p-dust', {
      speed: { min: 10, max: 30 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 450,
      emitting: false,
    });
    this.stars = scene.add.particles(0, 0, 'p-star', {
      speed: { min: 60, max: 140 },
      angle: { min: 200, max: 340 },
      gravityY: 180,
      scale: { start: 0.9, end: 0.2 },
      lifespan: 900,
      emitting: false,
    });
    this.sparks = scene.add.particles(0, 0, 'p-spark', {
      speed: { min: 20, max: 70 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      emitting: false,
    });
  }

  get x() {
    return this.container.x;
  }
  get y() {
    return this.container.y;
  }
  setPosition(x, y) {
    this.container.setPosition(x, y);
  }

  /** Aksi sekali jalan. victory/defeat berlangsung 2 detik. */
  play(name) {
    if (this.action && (this.action.name === 'victory' || this.action.name === 'defeat') && name === 'jump') return;
    const dur = { jump: 0.55, interact: 0.5, victory: 2.2, defeat: 2 }[name];
    if (!dur) return;
    if (name === 'jump' && this.action?.name === 'jump') return;
    this.action = { name, t: 0, dur };
    if (name === 'interact') this.sparks.explode(10, this.x, this.y - 40);
    if (name === 'victory') this.stars.explode(14, this.x, this.y - 50);
    if (name === 'defeat') this.body.setTint(0x9a9a9a);
  }

  get busy() {
    return this.action && (this.action.name === 'victory' || this.action.name === 'defeat' || this.action.name === 'interact');
  }

  /** @param moving {vx, vy, running} kecepatan layar ternormalisasi */
  update(dt, { vx = 0, vy = 0, running = false } = {}) {
    this.t += dt;
    const moving = Math.hypot(vx, vy) > 0.05;
    this.state = this.action ? this.action.name : moving ? (running ? 'run' : 'walk') : 'idle';

    if (moving) {
      const facing = vy < -0.2 ? 'back' : vy > 0.2 ? 'front' : this.facing;
      if (facing !== this.facing) {
        this.facing = facing;
        this.body.setTexture(`${this.characterId}-${facing}`);
      }
      if (Math.abs(vx) > 0.1) this.flip = vx < 0;
    }
    this.body.setFlipX(this.flip);

    let bob = 0;
    let angle = 0;
    let sx = 1;
    let sy = 1;
    let lift = 0;

    if (moving && !this.action) {
      this.phase += dt * (running ? 16 : 10);
      bob = Math.abs(Math.sin(this.phase)) * (running ? 6 : 4);
      angle = Math.sin(this.phase) * (running ? 6 : 4) + (running ? (this.flip ? -5 : 5) : 0);
      sy = 1 - Math.abs(Math.cos(this.phase)) * 0.04;
      this.dustTimer -= dt;
      if (running && this.dustTimer <= 0) {
        this.dust.explode(2, this.x, this.y);
        this.dustTimer = 0.12;
      }
    } else if (!this.action) {
      sy = 1 + Math.sin(this.t * 3) * 0.02;
      sx = 1 - Math.sin(this.t * 3) * 0.01;
    }

    const a = this.action;
    if (a) {
      a.t += dt;
      const p = Math.min(1, a.t / a.dur);
      if (a.name === 'jump') {
        lift = Math.sin(Math.PI * p) * 30;
        sy = p < 0.15 ? 0.9 : p > 0.9 ? 0.92 : 1.06;
        sx = 2 - sy;
        if (moving) {
          this.phase += dt * 10;
          angle = Math.sin(this.phase) * 3;
        }
      } else if (a.name === 'interact') {
        const k = Math.sin(Math.PI * p);
        sx = 1 + k * 0.08;
        sy = 1 - k * 0.06;
        angle = (this.flip ? -1 : 1) * k * 10;
      } else if (a.name === 'victory') {
        const hop = (a.t * 2.6) % 1;
        lift = Math.sin(Math.PI * hop) * 22;
        sx = Math.cos(a.t * 6); // berputar
        if (Math.abs(sx) < 0.15) sx = sx < 0 ? -0.15 : 0.15;
        if (hop < 0.05 && a.t > 0.2) this.stars.explode(3, this.x, this.y - 60);
      } else if (a.name === 'defeat') {
        const k = Math.min(1, p * 4);
        sy = 1 - 0.14 * k;
        sx = 1 + 0.08 * k;
        angle = (this.flip ? -1 : 1) * 8 * k + Math.sin(a.t * 18) * 2 * (1 - p);
      }
      if (a.t >= a.dur) {
        if (a.name === 'defeat') this.body.clearTint();
        this.action = null;
      }
    }

    this.body.y = -bob - lift;
    this.body.angle = angle;
    this.body.setScale((sx * (this.flip ? 1 : 1)) / SCALE, sy / SCALE);
    const sh = 1 - lift / 60;
    this.shadow.setScale(sh, sh);
    this.shadow.setAlpha(0.25 * sh);
    this.container.setDepth(this.y);
  }

  destroy() {
    this.dust.destroy();
    this.stars.destroy();
    this.sparks.destroy();
    this.container.destroy();
  }
}

