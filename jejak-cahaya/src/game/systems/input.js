// Gabungan input keyboard (WASD/panah, Shift, Spasi, E) dan kontrol sentuh (joystick HTML).

export const touchInput = { x: 0, y: 0, run: false, actions: [] };

export class InputController {
  constructor(scene) {
    const kb = scene.input.keyboard;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,E,ENTER,M');
    // Jangan menelan tombol saat pengguna mengetik di kolom isian.
    kb.disableGlobalCapture();
    this.queue = [];
    this.keys.SPACE.on('down', () => this.queue.push('jump'));
    this.keys.E.on('down', () => this.queue.push('interact'));
    this.keys.ENTER.on('down', () => this.queue.push('interact'));
    this.keys.M.on('down', () => this.queue.push('map'));
    this.enabled = true;
  }

  read() {
    const k = this.keys;
    let x = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let y = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    let run = k.SHIFT.isDown;
    if (!x && !y && (touchInput.x || touchInput.y)) {
      x = touchInput.x;
      y = touchInput.y;
      run = touchInput.run;
    }
    const actions = [...this.queue, ...touchInput.actions];
    this.queue.length = 0;
    touchInput.actions.length = 0;
    if (!this.enabled) return { x: 0, y: 0, run: false, actions: [] };
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y, run, actions };
  }
}
