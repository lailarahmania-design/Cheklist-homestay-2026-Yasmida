// Kamera isometrik: mengikuti karakter dengan halus, zoom khusus di area misi,
// dan mode "peta penuh" untuk melihat seluruh dunia (dipakai juga oleh guru).

export class CameraDirector {
  constructor(scene, worldBounds) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.bounds = worldBounds; // {x,y,width,height}
    this.missionBoost = 1;
    this.overview = false;
    this.target = null;
    this.cam.setBounds(worldBounds.x - 240, worldBounds.y - 260, worldBounds.width + 480, worldBounds.height + 520);
  }

  baseZoom() {
    const { width, height } = this.scale();
    // HP potret tetap cukup dekat agar karakter jelas terlihat
    return Math.max(0.82, Math.min(1.15, Math.min(width / 980, height / 640)));
  }

  scale() {
    return this.scene.scale.gameSize;
  }

  overviewZoom() {
    const { width, height } = this.scale();
    return Math.min(width / (this.bounds.width + 120), height / (this.bounds.height + 160));
  }

  follow(target) {
    this.target = target;
    // lerp 0.08 → gerak kamera halus, tidak membuat pemain kehilangan orientasi
    this.cam.startFollow(target, true, 0.08, 0.08, 0, 20);
    this.cam.setZoom(this.baseZoom());
  }

  setMissionFocus(active) {
    this.missionBoost = active ? 1.22 : 1;
  }

  toggleOverview(force) {
    this.overview = force ?? !this.overview;
    if (this.overview) {
      this.cam.stopFollow();
      this.cam.pan(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2 + 30, 700, 'Sine.easeInOut');
    } else if (this.target) {
      this.cam.pan(this.target.x, this.target.y, 500, 'Sine.easeInOut', false, (_c, p) => {
        if (p === 1) this.cam.startFollow(this.target, true, 0.08, 0.08, 0, 20);
      });
    }
    return this.overview;
  }

  update(dt) {
    const want = this.overview ? this.overviewZoom() : this.baseZoom() * this.missionBoost;
    const z = this.cam.zoom + (want - this.cam.zoom) * Math.min(1, dt * 2.5);
    this.cam.setZoom(z);
  }
}
