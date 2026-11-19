import { describe, it, expect } from 'vitest';
import { createTemplate, checkTemplate, normalizeTemplate, maxPossibleScore } from '../../src/config/template-model.js';
import { exportConfig, importConfig, duplicateTemplate } from '../../src/config/config-io.js';
import { LocalAdapter, memoryStorage } from '../../src/data/local-adapter.js';
import { validateBank } from '../../src/question-bank/schema.js';
import { bankTemplate } from '../../src/question-bank/bank-ops.js';

const filled = () => createTemplate({ questionBank: validateBank(bankTemplate()).bank });

describe('template', () => {
  it('template baru punya 4 kelompok & belum siap karena belum ada soal', () => {
    const t = createTemplate();
    expect(t.groups.length).toBe(4);
    const c = checkTemplate(t);
    expect(c.ready).toBe(false);
    expect(c.errors.filter((e) => e.tab === 'soal').length).toBe(3);
  });

  it('nama kelompok kembar & kosong ditolak', () => {
    const t = filled();
    t.groups[1].name = 'kelompok 1';
    t.groups[2].name = '  ';
    const msgs = checkTemplate(t).errors.map((e) => e.message);
    expect(msgs).toContain('Nama kelompok tidak boleh sama.');
    expect(msgs).toContain('Ada kelompok yang belum diberi nama.');
  });

  it('template berisi soal dummy dinyatakan siap', () => {
    expect(checkTemplate(filled()).ready).toBe(true);
  });

  it('normalisasi melengkapi field yang hilang', () => {
    const t = normalizeTemplate({ identity: { title: 'A' } });
    expect(t.identity.title).toBe('A');
    expect(t.rules.teamHearts).toBe(3);
    expect(t.questionBank.pos.length).toBe(3);
  });

  it('skor maksimum dihitung', () => {
    // pos1 10 + pos2 10 + refleksi manual 10 + bonus 3x20
    expect(maxPossibleScore(filled())).toBe(90);
  });
});

describe('ekspor/impor konfigurasi', () => {
  it('bolak-balik menghasilkan isi sama dengan ID baru', () => {
    const t = filled();
    const r = importConfig(JSON.stringify(exportConfig(t)));
    expect(r.ok).toBe(true);
    expect(r.template.id).not.toBe(t.id);
    expect(r.template.questionBank).toEqual(t.questionBank);
    expect(r.template.groups.map((g) => g.name)).toEqual(t.groups.map((g) => g.name));
  });

  it('menolak file bank soal dengan petunjuk', () => {
    const r = importConfig(JSON.stringify(bankTemplate()));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/Bank Soal/);
  });

  it('duplikasi memberi judul (Salinan)', () => {
    const d = duplicateTemplate(filled());
    expect(d.identity.title).toMatch(/\(Salinan\)$/);
  });
});

describe('LocalAdapter', () => {
  it('simpan, daftar, ambil, hapus', async () => {
    const a = new LocalAdapter(memoryStorage());
    const t = filled();
    await a.saveTemplate(t);
    await a.saveTemplate({ ...t, identity: { ...t.identity, title: 'Diubah' } });
    const list = await a.listTemplates();
    expect(list.length).toBe(1);
    expect((await a.getTemplate(t.id)).identity.title).toBe('Diubah');
    await a.deleteTemplate(t.id);
    expect(await a.listTemplates()).toEqual([]);
  });
});
