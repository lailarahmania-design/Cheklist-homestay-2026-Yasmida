// LocalAdapter: menyimpan konfigurasi di penyimpanan browser (localStorage).
// Dipakai pada Tahap 1–3 untuk pengembangan & pengujian. Pada Tahap 4 diganti
// SupabaseAdapter dengan antarmuka yang sama (lihat ./adapter.js).

import { clone } from '../core/ids.js';
import { normalizeTemplate } from '../config/template-model.js';

const KEY = 'jejak-cahaya:templates:v1';

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

export class LocalAdapter {
  constructor(storage) {
    this.kind = 'local';
    this.storage = storage;
  }

  _readAll() {
    try {
      const raw = this.storage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  _writeAll(list) {
    try {
      this.storage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      throw new Error('Penyimpanan browser penuh atau diblokir. Ekspor konfigurasi sebagai JSON agar data tidak hilang.');
    }
  }

  async listTemplates() {
    return this._readAll()
      .map((t) => clone(t))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  async getTemplate(id) {
    const t = this._readAll().find((x) => x.id === id);
    return t ? normalizeTemplate(t) : null;
  }

  async saveTemplate(template) {
    const list = this._readAll();
    const saved = { ...clone(template), updatedAt: new Date().toISOString() };
    const i = list.findIndex((x) => x.id === saved.id);
    if (i >= 0) list[i] = saved;
    else list.push(saved);
    this._writeAll(list);
    return clone(saved);
  }

  async deleteTemplate(id) {
    this._writeAll(this._readAll().filter((x) => x.id !== id));
  }
}
