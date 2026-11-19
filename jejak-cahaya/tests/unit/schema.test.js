import { describe, it, expect } from 'vitest';
import { validateBank, validateQuestion, emptyBank } from '../../src/question-bank/schema.js';
import { bankTemplate } from '../../src/question-bank/bank-ops.js';

describe('validateBank', () => {
  it('menerima template unduhan tanpa error', () => {
    const r = validateBank(JSON.stringify(bankTemplate()));
    expect(r.ok).toBe(true);
    expect(r.counts).toEqual({ pos1: 1, pos2: 1, pos3: 2 });
  });

  it('menerima bank kosong', () => {
    expect(validateBank(emptyBank()).ok).toBe(true);
  });

  it('menolak teks yang bukan JSON dengan pesan jelas', () => {
    const r = validateBank('{ "pos": [ }');
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/Bukan JSON yang valid/);
  });

  it('menolak bila bagian pos tidak ada', () => {
    const r = validateBank({ game: 'Jejak Cahaya' });
    expect(r.ok).toBe(false);
    expect(r.errors[0].path).toBe('pos');
  });

  it('menolak id pos tidak dikenal dan tipe salah', () => {
    const r = validateBank({ pos: [{ id: 'pos9', questions: [] }, { id: 'pos1', type: 'battle_quiz', questions: [] }] });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.message).join(' ')).toMatch(/pos9/);
    expect(r.errors.map((e) => e.message).join(' ')).toMatch(/verse_puzzle/);
  });

  it('melaporkan lokasi soal yang salah', () => {
    const r = validateBank({ pos: [{ id: 'pos2', questions: [{ id: 'a', question: 'Q', options: ['x'], answer: 3 }] }] });
    expect(r.ok).toBe(false);
    expect(r.errors[0].path).toMatch(/POS2.*soal ke-1/);
  });

  it('menolak ID soal ganda', () => {
    const q = { id: 'same', question: 'Q', options: ['a', 'b'], answer: 1 };
    const r = validateBank({ pos: [{ id: 'pos2', questions: [q, q] }] });
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toMatch(/sudah dipakai/);
  });

  it('memberi peringatan untuk pos yang hilang dan soal tanpa id', () => {
    const r = validateBank({ pos: [{ id: 'pos2', questions: [{ question: 'Q', options: ['a', 'b'], answer: 0 }] }] });
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThanOrEqual(3);
    expect(r.bank.pos[1].questions[0].id).toMatch(/^q_/);
  });

  it('mengambil questionBank dari file konfigurasi lengkap', () => {
    const r = validateBank({ questionBank: bankTemplate() });
    expect(r.ok).toBe(true);
  });
});

describe('validateQuestion', () => {
  it('puzzle ayat: minimal 2 potongan, arah default rtl', () => {
    expect(validateQuestion({ segments: ['a'] }, 'verse_puzzle').errors.length).toBe(1);
    const ok = validateQuestion({ segments: ['a', 'b'] }, 'verse_puzzle');
    expect(ok.errors).toEqual([]);
    expect(ok.question.direction).toBe('rtl');
  });

  it('refleksi auto hanya untuk format choice', () => {
    const r = validateQuestion({ question: 'R', format: 'short_text', grading: 'auto' }, 'reflection');
    expect(r.errors.join(' ')).toMatch(/hanya bisa untuk format "choice"/);
  });

  it('refleksi tidak dinilai tidak perlu kunci', () => {
    const r = validateQuestion({ question: 'R', format: 'choice', options: ['a', 'b'], grading: 'none' }, 'reflection');
    expect(r.errors).toEqual([]);
    expect(r.question.answer).toBeNull();
  });

  it('kunci kosong (null) tidak dianggap pilihan pertama', () => {
    expect(validateQuestion({ question: 'R', format: 'choice', options: ['a', 'b'], grading: 'auto', answer: null }, 'reflection').errors.length).toBe(1);
    expect(validateQuestion({ question: 'Q', options: ['a', 'b'], answer: null }, 'battle_quiz').errors.length).toBe(1);
    expect(validateQuestion({ question: 'Q', options: ['a', 'b'], answer: '1' }, 'battle_quiz').question.answer).toBe(1);
  });

  it('skor negatif ditolak', () => {
    const r = validateQuestion({ question: 'Q', options: ['a', 'b'], answer: 0, score: -5 }, 'battle_quiz');
    expect(r.errors.join(' ')).toMatch(/Skor/);
  });
});
