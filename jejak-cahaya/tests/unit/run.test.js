import { describe, it, expect } from 'vitest';
import { createTemplate } from '../../src/config/template-model.js';
import { createRun, selectQuestions, recordAnswer, remaining, finishPos, totals, checkVerse, loseHeart, seededRandom, startPos } from '../../src/scoring/run.js';
import { toCSV, detailRows, summary } from '../../src/results/result-report.js';

const verse = (i) => ({ id: `v${i}`, instruction: '', reference: `Ayat ${i}`, segments: [`a${i}`, `b${i}`, `c${i}`], direction: 'rtl', translation: '', score: null });
const mc = (i) => ({ id: `m${i}`, question: `Q${i}`, options: ['A', 'B', 'C'], answer: 1, score: null });
function tpl(rules = {}) {
  const t = createTemplate();
  t.rules = { ...t.rules, correctScore: 10, wrongPenalty: 2, completionBonus: 5, attemptsPerQuestion: 2, teamHearts: 3, ...rules };
  t.questionBank.pos[0].questions = Array.from({ length: 10 }, (_, i) => verse(i + 1));
  t.questionBank.pos[1].questions = Array.from({ length: 4 }, (_, i) => mc(i + 1));
  t.questionBank.pos[2].questions = [
    { id: 'r1', question: 'R1', format: 'short_text', options: [], grading: 'manual', answer: null, maxScore: 10 },
    { id: 'r2', question: 'R2', format: 'choice', options: ['x', 'y'], grading: 'auto', answer: 0, maxScore: 5 },
    { id: 'r3', question: 'R3', format: 'choice', options: ['x', 'y'], grading: 'none', answer: null, maxScore: null },
  ];
  return t;
}
const run0 = (t, seed = 's') => createRun(t, { groupId: 'g', groupName: 'Elang', character: 'kid-boy-a', seed });

describe('pemilihan soal', () => {
  it('Pos 1: 6 dari 10 ayat, acak per kelompok, tetap urut mushaf', () => {
    const t = tpl({ pos1QuestionCount: 6 });
    const a = selectQuestions(t, seededRandom('kelompok-1')).pos1;
    const b = selectQuestions(t, seededRandom('kelompok-2')).pos1;
    expect(a.length).toBe(6);
    const idx = (ids) => ids.map((id) => Number(id.slice(1)));
    expect(idx(a)).toEqual([...idx(a)].sort((x, y) => x - y));
    expect(a).not.toEqual(b);
  });
  it('0 = semua soal', () => {
    const s = selectQuestions(tpl(), seededRandom('x'));
    expect(s.pos1.length).toBe(10);
    expect(s.pos2.length).toBe(4);
    expect(s.pos3).toEqual(['r1', 'r2', 'r3']);
  });
  it('benih sama → soal sama (bisa diulang server)', () => {
    const t = tpl({ pos1QuestionCount: 5 });
    expect(selectQuestions(t, seededRandom('z'))).toEqual(selectQuestions(t, seededRandom('z')));
  });
});

describe('penilaian', () => {
  it('puzzle: dicek per teks, benar = skor, salah = penalti, kesempatan dibatasi', () => {
    const t = tpl({ pos1QuestionCount: 1, shuffleQuestions: false });
    const run = run0(t);
    const qid = run.questions.pos1[0];
    const q = t.questionBank.pos[0].questions[0];
    expect(checkVerse(q, ['b1', 'a1', 'c1'])).toBe(false);
    recordAnswer(run, t, 'pos1', qid, { response: ['b1', 'a1', 'c1'], correct: false });
    expect(remaining(run, t, 'pos1')).toEqual([qid]);
    recordAnswer(run, t, 'pos1', qid, { response: ['b1', 'c1', 'a1'], correct: false });
    expect(remaining(run, t, 'pos1')).toEqual([]);
    expect(() => recordAnswer(run, t, 'pos1', qid, { response: [], correct: true })).toThrow(/habis/);
    finishPos(run, t, 'pos1');
    expect(totals(run, t).byPos.pos1.score).toBe(1); // -2 -2 +5 bonus = 1
    expect(run.pos.pos2.status).toBe('active');
  });

  it('tidak bisa menjawab pos yang belum terbuka & tidak bisa menjawab ganda', () => {
    const t = tpl();
    const run = run0(t);
    expect(() => recordAnswer(run, t, 'pos2', 'm1', { response: 1, correct: true })).toThrow(/tidak sedang/);
    recordAnswer(run, t, 'pos1', run.questions.pos1[0], { response: [], correct: true });
    expect(() => recordAnswer(run, t, 'pos1', run.questions.pos1[0], { response: [], correct: true })).toThrow(/sudah dijawab/);
  });

  it('nyawa habis → terpental & nyawa penuh lagi', () => {
    const t = tpl();
    const run = run0(t);
    expect(loseHeart(run, t).knockedOut).toBe(false);
    loseHeart(run, t);
    const r = loseHeart(run, t);
    expect(r.knockedOut).toBe(true);
    expect(run.hearts).toBe(3);
  });

  it('waktu habis: tanpa bonus, pos berikut terbuka; total tidak negatif', () => {
    const t = tpl({ wrongPenalty: 50 });
    const run = run0(t);
    startPos(run, 'pos1');
    recordAnswer(run, t, 'pos1', run.questions.pos1[0], { response: [], correct: false });
    finishPos(run, t, 'pos1', { timeout: true });
    const tot = totals(run, t);
    expect(tot.byPos.pos1.score).toBe(0);
    expect(tot.byPos.pos1.timeout).toBe(true);
    expect(run.pos.pos2.status).toBe('active');
  });

  it('refleksi: manual menunggu guru, auto dinilai, none hanya disimpan; gelar setelah Pos 3', () => {
    const t = tpl();
    const run = run0(t);
    finishPos(run, t, 'pos1');
    finishPos(run, t, 'pos2');
    recordAnswer(run, t, 'pos3', 'r1', { response: 'Kami belajar jujur.' });
    recordAnswer(run, t, 'pos3', 'r2', { response: 0, correct: true });
    recordAnswer(run, t, 'pos3', 'r3', { response: 1 });
    finishPos(run, t, 'pos3');
    const tot = totals(run, t);
    expect(tot.byPos.pos3.score).toBe(10); // auto 5 + bonus 5
    expect(tot.pending).toBe(1);
    expect(run.finished).toBe(true);
    expect(run.title).toBe('Penjelajah Cahaya');
  });
});

describe('laporan', () => {
  it('CSV memuat ringkasan, kunci Battle Quiz, dan aman untuk titik koma', () => {
    const t = tpl({ pos1QuestionCount: 1 });
    t.questionBank.pos[1].questions[0].question = 'Apa; "ini"?';
    const run = run0(t);
    finishPos(run, t, 'pos1');
    recordAnswer(run, t, 'pos2', 'm1', { response: 0, correct: false });
    const csv = toCSV(run, t);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('Kelompok;Elang');
    expect(csv).toContain('"Apa; ""ini""?";A;B;Salah;1;-2');
    const rows = detailRows(run, t).filter((r) => r.pos === 'pos2');
    expect(rows.length).toBe(4);
    expect(rows[1].status).toBe('Tidak dijawab');
    expect(summary(run, t).wrong).toBe(1);
  });
});
