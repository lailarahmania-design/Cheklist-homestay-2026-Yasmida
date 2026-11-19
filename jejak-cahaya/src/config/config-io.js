// Ekspor / impor konfigurasi lengkap (template) sebagai file JSON.

import { CONFIG_FORMAT, CONFIG_VERSION } from '../core/constants.js';
import { clone, newId } from '../core/ids.js';
import { normalizeTemplate } from './template-model.js';
import { validateBank } from '../question-bank/schema.js';

export function exportConfig(template) {
  return {
    format: CONFIG_FORMAT,
    formatVersion: CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    _peringatan: 'File ini berisi KUNCI JAWABAN. Simpan hanya untuk guru, jangan dibagikan kepada siswa.',
    template: clone(template),
  };
}

/**
 * Membaca file konfigurasi. Template hasil impor selalu mendapat ID baru
 * agar tidak menimpa konfigurasi yang sudah ada.
 * @returns {{ok:boolean, template?:object, errors:string[]}}
 */
export function importConfig(input) {
  let raw = input;
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch {
      return { ok: false, errors: ['File bukan JSON yang valid.'] };
    }
  }
  if (!raw || raw.format !== CONFIG_FORMAT || !raw.template) {
    const hint = raw && Array.isArray(raw.pos) ? ' File ini tampaknya bank soal; impor melalui tab "Bank Soal".' : '';
    return { ok: false, errors: ['File ini bukan file konfigurasi Jejak Cahaya.' + hint] };
  }
  if (raw.formatVersion > CONFIG_VERSION)
    return { ok: false, errors: ['File dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi terlebih dahulu.'] };

  const bankCheck = validateBank(raw.template.questionBank ?? { pos: [] });
  if (!bankCheck.ok) return { ok: false, errors: bankCheck.errors.map((e) => `${e.path}: ${e.message}`) };

  const t = normalizeTemplate({ ...raw.template, questionBank: bankCheck.bank });
  const now = new Date().toISOString();
  return { ok: true, template: { ...t, id: newId('tpl'), createdAt: now, updatedAt: now }, errors: [] };
}

export function duplicateTemplate(template) {
  const now = new Date().toISOString();
  const t = clone(template);
  return {
    ...t,
    id: newId('tpl'),
    createdAt: now,
    updatedAt: now,
    identity: { ...t.identity, title: `${t.identity.title} (Salinan)` },
  };
}
