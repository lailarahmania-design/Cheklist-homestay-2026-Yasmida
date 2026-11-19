// "Run" = satu perjalanan satu kelompok: soal terpilih, jawaban, skor, waktu, status pos.
// Modul murni (tanpa DOM/Phaser) supaya perhitungan skor konsisten dan bisa diuji.
// Pada Tahap 4 logika yang sama dijalankan di server (RPC submit_answer).

import { POS_DEFS } from '../core/constants.js';
import { newId } from '../core/ids.js';

export function seededRandom(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const posQuestions = (t, posId) => t.questionBank.pos.find((p) => p.id === posId).questions;

/** Skor soal (nilai benar). */
export function questionValue(rules, q, posType) {
  if (posType === 'reflection') return q.grading === 'none' ? 0 : q.maxScore ?? rules.correctScore;
  return q.score ?? rules.correctScore;
}

/**
 * Memilih soal untuk satu kelompok.
 * - Pos 1: pos1QuestionCount ayat (0 = semua), dipilih acak lalu diurutkan sesuai urutan bank (urutan mushaf).
 * - Pos 2: pos2QuestionCount soal (0 = semua), urutan acak bila shuffleQuestions.
 * - Pos 3: semua pertanyaan refleksi sesuai urutan bank.
 */
export function selectQuestions(t, rand) {
  const r = t.rules;
  const pick = (list, n, keepOrder) => {
    const count = n > 0 ? Math.min(n, list.length) : list.length;
    if (count === list.length && keepOrder) return [...list];
    const chosen = r.shuffleQuestions ? shuffle(list, rand).slice(0, count) : list.slice(0, count);
    if (!keepOrder) return chosen;
    const order = new Map(list.map((q, i) => [q.id, i]));
    return chosen.sort((a, b) => order.get(a.id) - order.get(b.id));
  };
  return {
    pos1: pick(posQuestions(t, 'pos1'), r.pos1QuestionCount ?? 0, true).map((q) => q.id),
    pos2: pick(posQuestions(t, 'pos2'), r.pos2QuestionCount ?? 0, !r.shuffleQuestions).map((q) => q.id),
    pos3: posQuestions(t, 'pos3').map((q) => q.id),
  };
}

export function createRun(t, { groupId, groupName, character, seed = newId('run') }) {
  const rand = seededRandom(seed);
  return {
    id: newId('res'),
    seed,
    templateId: t.id,
    exam: { ...t.identity },
    groupId,
    groupName,
    character,
    startedAt: Date.now(),
    endedAt: null,
    hearts: t.rules.teamHearts,
    questions: selectQuestions(t, rand),
    pos: Object.fromEntries(
      POS_DEFS.map((p, i) => [p.id, { status: i === 0 ? 'active' : 'locked', startedAt: null, endedAt: null, timeout: false, bonus: 0 }])
    ),
    answers: [],
    finished: false,
    title: null,
  };
}

export const findQuestion = (t, posId, qid) => posQuestions(t, posId).find((q) => q.id === qid);
export const attemptsUsed = (run, qid) => run.answers.filter((a) => a.questionId === qid).length;
export const isSolved = (run, qid) => run.answers.some((a) => a.questionId === qid && a.correct);

/** Apakah susunan potongan ayat benar (dibandingkan per teks, aman untuk potongan kembar). */
export function checkVerse(q, orderTexts) {
  return orderTexts.length === q.segments.length && orderTexts.every((s, i) => s === q.segments[i]);
}

/**
 * Mencatat jawaban & menghitung poin.
 * @returns {object} entri jawaban yang disimpan
 */
export function recordAnswer(run, t, posId, qid, { response, correct }) {
  const def = POS_DEFS.find((p) => p.id === posId);
  const q = findQuestion(t, posId, qid);
  if (!q) throw new Error('Soal tidak ditemukan');
  if (run.pos[posId].status !== 'active') throw new Error('Pos ini tidak sedang dikerjakan');
  if (def.type !== 'reflection') {
    if (isSolved(run, qid)) throw new Error('Soal ini sudah dijawab benar');
    if (attemptsUsed(run, qid) >= t.rules.attemptsPerQuestion) throw new Error('Kesempatan menjawab sudah habis');
  } else if (run.answers.some((a) => a.questionId === qid)) {
    throw new Error('Refleksi ini sudah dijawab');
  }

  let points = 0;
  let pending = false;
  if (def.type === 'reflection') {
    if (q.grading === 'auto') points = correct ? questionValue(t.rules, q, def.type) : 0;
    else if (q.grading === 'manual') pending = true;
    correct = q.grading === 'auto' ? !!correct : null;
  } else {
    points = correct ? questionValue(t.rules, q, def.type) : -t.rules.wrongPenalty;
  }
  const entry = { posId, questionId: qid, attempt: attemptsUsed(run, qid) + 1, response, correct, points, pending, at: Date.now() };
  run.answers.push(entry);
  return entry;
}

/** Sisa soal yang masih bisa dikerjakan di sebuah pos. */
export function remaining(run, t, posId) {
  const ids = run.questions[posId];
  if (posId === 'pos3') return ids.filter((id) => !run.answers.some((a) => a.questionId === id));
  return ids.filter((id) => !isSolved(run, id) && attemptsUsed(run, id) < t.rules.attemptsPerQuestion);
}

export function startPos(run, posId) {
  if (!run.pos[posId].startedAt) run.pos[posId].startedAt = Date.now();
}

/** Menutup pos (selesai normal atau karena waktu habis) dan membuka pos berikutnya. */
export function finishPos(run, t, posId, { timeout = false } = {}) {
  const p = run.pos[posId];
  if (p.status === 'done') return;
  p.status = 'done';
  p.timeout = timeout;
  p.endedAt = Date.now();
  if (!p.startedAt) p.startedAt = p.endedAt;
  p.bonus = timeout ? 0 : t.rules.completionBonus;
  const i = POS_DEFS.findIndex((d) => d.id === posId);
  const next = POS_DEFS[i + 1];
  if (next && run.pos[next.id].status === 'locked') run.pos[next.id].status = 'active';
  if (!next) finishRun(run);
}

export function finishRun(run) {
  if (run.finished) return;
  run.finished = true;
  run.endedAt = Date.now();
  if (run.pos.pos3.status === 'done') run.title = 'Penjelajah Cahaya';
}

/** Rekap skor. Total tidak pernah negatif. Skor refleksi manual menunggu penilaian guru. */
export function totals(run, t) {
  const byPos = {};
  for (const d of POS_DEFS) {
    const ans = run.answers.filter((a) => a.posId === d.id);
    const raw = ans.reduce((s, a) => s + a.points, 0) + run.pos[d.id].bonus;
    byPos[d.id] = {
      score: Math.max(0, raw),
      correct: ans.filter((a) => a.correct === true).length,
      wrong: ans.filter((a) => a.correct === false).length,
      pending: ans.filter((a) => a.pending).length,
      bonus: run.pos[d.id].bonus,
      timeout: run.pos[d.id].timeout,
      status: run.pos[d.id].status,
      seconds: run.pos[d.id].startedAt ? Math.round(((run.pos[d.id].endedAt || Date.now()) - run.pos[d.id].startedAt) / 1000) : 0,
    };
  }
  void t;
  const score = Object.values(byPos).reduce((s, p) => s + p.score, 0);
  return {
    score,
    correct: Object.values(byPos).reduce((s, p) => s + p.correct, 0),
    wrong: Object.values(byPos).reduce((s, p) => s + p.wrong, 0),
    pending: Object.values(byPos).reduce((s, p) => s + p.pending, 0),
    seconds: Math.round(((run.endedAt || Date.now()) - run.startedAt) / 1000),
    byPos,
  };
}

/**
 * Serangan balasan golem: nyawa berkurang 1. Bila habis, kelompok "terpental"
 * dan nyawa diisi ulang untuk mengulang pertarungan (skor tetap).
 * @returns {{knockedOut:boolean, hearts:number}}
 */
export function loseHeart(run, t) {
  run.hearts -= 1;
  if (run.hearts <= 0) {
    run.hearts = t.rules.teamHearts;
    run.knockouts = (run.knockouts || 0) + 1;
    return { knockedOut: true, hearts: run.hearts };
  }
  return { knockedOut: false, hearts: run.hearts };
}

export function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
