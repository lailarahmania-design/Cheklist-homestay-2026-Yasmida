// Validasi & normalisasi bank soal.
// Semua pesan kesalahan ditulis dalam bahasa Indonesia yang mudah dipahami guru.

import {
  GAME_ID,
  BANK_VERSION,
  POS_DEFS,
  POS_BY_ID,
  REFLECTION_FORMATS,
  REFLECTION_GRADING,
  VERSE_DIRECTIONS,
  LIMITS,
} from '../core/constants.js';
import { newId } from '../core/ids.js';

export function emptyBank() {
  return {
    game: GAME_ID,
    version: BANK_VERSION,
    pos: POS_DEFS.map((p) => ({ id: p.id, type: p.type, questions: [] })),
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
// Number(null) = 0, jadi kunci kosong harus ditolak secara eksplisit.
const toIndex = (v) => (v === null || v === undefined || v === '' || typeof v === 'boolean' ? NaN : Number(v));

function optScore(v, label, push) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) {
    push(`${label} harus berupa angka 0 atau lebih.`);
    return null;
  }
  return n;
}

function textList(list, label, min, max, push) {
  if (!Array.isArray(list)) {
    push(`${label} harus berupa daftar (array), contoh: ["...", "..."].`);
    return [];
  }
  const out = list.map((s) => (typeof s === 'string' ? s.trim() : s));
  out.forEach((s, i) => {
    if (!isText(s)) push(`${label} nomor ${i + 1} kosong atau bukan teks.`);
  });
  if (out.length < min) push(`${label} minimal ${min} buah (sekarang ${out.length}).`);
  if (out.length > max) push(`${label} maksimal ${max} buah (sekarang ${out.length}).`);
  return out.filter(isText);
}

/**
 * Memvalidasi satu soal untuk tipe pos tertentu.
 * @returns {{question: object, errors: string[], warnings: string[]}}
 */
export function validateQuestion(raw, type) {
  const errors = [];
  const warnings = [];
  const push = (m) => errors.push(m);

  if (!isObj(raw)) return { question: null, errors: ['Soal harus berupa objek { ... }.'], warnings };

  let id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null;
  if (!id) {
    id = newId('q');
    warnings.push('Soal tidak memiliki "id", ID baru dibuat otomatis.');
  }

  let q;
  if (type === 'verse_puzzle') {
    const segments = textList(raw.segments, 'Potongan ayat (segments)', LIMITS.minSegments, LIMITS.maxSegments, push);
    const direction = raw.direction ?? 'rtl';
    if (!VERSE_DIRECTIONS.includes(direction)) push('Arah teks (direction) harus "rtl" (Arab) atau "ltr".');
    if (new Set(segments).size !== segments.length)
      warnings.push('Ada potongan ayat yang sama persis; pemain mungkin sulit membedakannya.');
    q = {
      id,
      instruction: isText(raw.instruction) ? raw.instruction.trim() : 'Susunlah potongan ayat berikut dengan urutan yang benar.',
      reference: typeof raw.reference === 'string' ? raw.reference.trim() : '',
      segments,
      direction,
      translation: typeof raw.translation === 'string' ? raw.translation.trim() : '',
      score: optScore(raw.score, 'Skor', push),
    };
  } else if (type === 'battle_quiz') {
    if (!isText(raw.question)) push('Teks pertanyaan (question) wajib diisi.');
    const options = textList(raw.options, 'Pilihan jawaban (options)', LIMITS.minOptions, LIMITS.maxOptions, push);
    const answer = toIndex(raw.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length)
      push(`Kunci jawaban (answer) harus nomor urut pilihan mulai dari 0 sampai ${Math.max(options.length - 1, 0)}.`);
    q = {
      id,
      question: isText(raw.question) ? raw.question.trim() : '',
      options,
      answer: Number.isInteger(answer) ? answer : 0,
      score: optScore(raw.score, 'Skor', push),
    };
  } else if (type === 'reflection') {
    if (!isText(raw.question)) push('Teks pertanyaan refleksi (question) wajib diisi.');
    const format = raw.format ?? 'short_text';
    if (!REFLECTION_FORMATS.includes(format)) push('Bentuk jawaban (format) harus "choice" (pilihan situasi) atau "short_text" (isian singkat).');
    const grading = raw.grading ?? 'none';
    if (!REFLECTION_GRADING.includes(grading)) push('Penilaian (grading) harus "none", "auto", atau "manual".');
    let options = [];
    let answer = null;
    if (format === 'choice') {
      options = textList(raw.options, 'Pilihan situasi (options)', LIMITS.minOptions, LIMITS.maxOptions, push);
    }
    if (grading === 'auto') {
      if (format !== 'choice') push('Penilaian otomatis (auto) hanya bisa untuk format "choice". Gunakan "manual" untuk isian singkat.');
      const a = toIndex(raw.answer);
      if (!Number.isInteger(a) || a < 0 || a >= options.length) push('Refleksi dengan penilaian otomatis wajib punya kunci (answer) yang valid.');
      else answer = a;
    }
    const maxScore = grading === 'none' ? null : optScore(raw.maxScore ?? raw.score, 'Skor maksimal', push);
    if (grading !== 'none' && maxScore === null && !errors.length)
      warnings.push('Skor maksimal belum diisi; skor bawaan dari Peraturan akan dipakai.');
    q = { id, question: isText(raw.question) ? raw.question.trim() : '', format, options, grading, answer, maxScore };
  } else {
    return { question: null, errors: [`Tipe pos "${type}" tidak dikenal.`], warnings };
  }
  return { question: q, errors, warnings };
}

/**
 * Memvalidasi seluruh bank soal (objek atau teks JSON).
 * @returns {{ok:boolean, bank:object|null, errors:{path:string,message:string}[], warnings:{path:string,message:string}[], counts:object}}
 */
export function validateBank(input) {
  const errors = [];
  const warnings = [];
  const err = (path, message) => errors.push({ path, message });
  const warn = (path, message) => warnings.push({ path, message });

  let raw = input;
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch (e) {
      const m = /position (\d+)/.exec(e.message);
      err('File', `Bukan JSON yang valid${m ? ` (periksa sekitar karakter ke-${m[1]})` : ''}. Pastikan tanda kutip, koma, dan kurung sudah benar.`);
      return { ok: false, bank: null, errors, warnings, counts: {} };
    }
  }
  // Izinkan file konfigurasi lengkap: ambil bagian questionBank-nya.
  if (isObj(raw) && isObj(raw.questionBank) && !raw.pos) raw = raw.questionBank;

  if (!isObj(raw)) {
    err('File', 'Isi file harus berupa objek JSON yang diawali "{".');
    return { ok: false, bank: null, errors, warnings, counts: {} };
  }
  if (raw.game !== undefined && raw.game !== GAME_ID) warn('game', `Nilai "game" adalah "${raw.game}", bukan "${GAME_ID}". Tetap diproses.`);
  if (!Array.isArray(raw.pos)) {
    err('pos', 'Bagian "pos" wajib ada dan berupa daftar berisi pos1, pos2, dan pos3.');
    return { ok: false, bank: null, errors, warnings, counts: {} };
  }

  const bank = emptyBank();
  const seenPos = new Set();
  const seenIds = new Set();

  raw.pos.forEach((p, pi) => {
    const where = `pos[${pi}]`;
    if (!isObj(p)) return err(where, 'Setiap pos harus berupa objek.');
    const def = POS_BY_ID[p.id];
    if (!def) return err(where, `ID pos "${p.id}" tidak dikenal. Gunakan "pos1", "pos2", atau "pos3".`);
    const label = `${def.id.toUpperCase()} (${def.name})`;
    if (seenPos.has(p.id)) return err(label, 'Pos ini ditulis lebih dari sekali.');
    seenPos.add(p.id);
    if (p.type !== undefined && p.type !== def.type)
      return err(label, `Tipe pos harus "${def.type}", bukan "${p.type}".`);
    if (!Array.isArray(p.questions)) return err(label, 'Bagian "questions" harus berupa daftar soal.');

    const target = bank.pos.find((b) => b.id === def.id);
    p.questions.forEach((rq, qi) => {
      const qLabel = `${label}, soal ke-${qi + 1}`;
      const { question, errors: qe, warnings: qw } = validateQuestion(rq, def.type);
      qe.forEach((m) => err(qLabel, m));
      qw.forEach((m) => warn(qLabel, m));
      if (!question) return;
      if (seenIds.has(question.id)) {
        err(qLabel, `ID soal "${question.id}" sudah dipakai soal lain. Setiap soal harus punya ID unik.`);
        return;
      }
      seenIds.add(question.id);
      if (!qe.length) target.questions.push(question);
    });
  });

  POS_DEFS.forEach((d) => {
    if (!seenPos.has(d.id)) warn(d.id.toUpperCase(), `Pos "${d.name}" tidak ada di file; dianggap belum memiliki soal.`);
  });

  const counts = Object.fromEntries(bank.pos.map((p) => [p.id, p.questions.length]));
  return { ok: errors.length === 0, bank: errors.length ? null : bank, errors, warnings, counts, preview: bank };
}

/** Mengisi bank yang mungkin rusak/kurang agar selalu memiliki 3 pos. */
export function normalizeBank(bank) {
  const out = emptyBank();
  if (bank && Array.isArray(bank.pos)) {
    for (const p of bank.pos) {
      const t = out.pos.find((o) => o.id === p.id);
      if (t && Array.isArray(p.questions)) t.questions = p.questions;
    }
  }
  return out;
}
