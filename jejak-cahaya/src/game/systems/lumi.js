// Lumi: kunang-kunang pendamping yang mengikuti karakter dan bereaksi.
import { SCALE } from '../art/textures.js';

export class Lumi {
  constructor(scene, x, y) {
    this.scene = scene;
    this.glow = scene.add.image(x, y, 'p-glow').setBlendMode('ADD').setScale(1.6).setAlpha(0.7);
    this.img = scene.add.image(x, y, 'lumi-happy').setScale(1 / SCALE);
    this.x = x;
    this.y = y;
    this.t = 0;
    this.mood = 'happy';
    this.moodTimer = 0;
    this.spin = 0;
    this.trail = scene.add.particles(0, 0, 'p-spark', {
      follow: this.img,
      frequency: 140,
      lifespan: 700,
      speed: { min: 2, max: 10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
    });
  }

  react(kind) {
    if (kind === 'happy') {
      this.spin = 1;
      this.setMood('happy');
    } else if (kind === 'sad') {
      this.setMood('sad');
      this.moodTimer = 2;
    }
  }

  setMood(m) {
    this.mood = m;
    this.img.setTexture(`lumi-${m}`);
  }

  update(dt, target, flip) {
    this.t += dt;
    const tx = target.x + (flip ? 34 : -34);
    const ty = target.y - 74 + Math.sin(this.t * 2.4) * 6;
    const k = Math.min(1, dt * 3.2);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    if (this.spin > 0) {
      this.spin -= dt * 1.4;
      this.img.angle = (1 - Math.max(0, this.spin)) * 360;
      if (this.spin <= 0) this.img.angle = 0;
    }
    if (this.moodTimer > 0) {
      this.moodTimer -= dt;
      if (this.moodTimer <= 0) this.setMood('happy');
    }
    const droop = this.mood === 'sad' ? 10 : 0;
    this.img.setPosition(this.x, this.y + droop);
    this.glow.setPosition(this.x, this.y + droop + 4);
    this.glow.setAlpha(0.55 + Math.sin(this.t * 4) * 0.2);
    this.img.setDepth(target.y + 2000);
    this.glow.setDepth(target.y + 1999);
  }

  destroy() {
    this.trail.destroy();
    this.glow.destroy();
    this.img.destroy();
  }
}
