// Status misi tiap pos. Tahap 2: hanya status terbuka/terkunci & pesan Lumi.
// Tahap 3 menambahkan pengerjaan tantangan & skor.

import { POS_DEFS } from '../../core/constants.js';

export class QuestState {
  constructor() {
    this.status = Object.fromEntries(POS_DEFS.map((p, i) => [p.id, i === 0 ? 'active' : 'locked']));
    this.listeners = new Set();
  }
  /** Pos yang jalannya sudah terbuka (selesai). */
  unlocked() {
    return new Set(Object.entries(this.status).filter(([, s]) => s === 'done').map(([id]) => id));
  }
  complete(posId) {
    this.status[posId] = 'done';
    const i = POS_DEFS.findIndex((p) => p.id === posId);
    const next = POS_DEFS[i + 1];
    if (next && this.status[next.id] === 'locked') this.status[next.id] = 'active';
    this.emit();
  }
  reset() {
    POS_DEFS.forEach((p, i) => (this.status[p.id] = i === 0 ? 'active' : 'locked'));
    this.emit();
  }
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) fn(this.status);
  }
}
