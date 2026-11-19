// Operasi bank soal: tambah, ubah, hapus, urutkan, gabung, ganti, template.

import { GAME_ID, BANK_VERSION } from '../core/constants.js';
import { clone, newId } from '../core/ids.js';
import { emptyBank, normalizeBank } from './schema.js';

export function getPos(bank, posId) {
  const p = bank.pos.find((x) => x.id === posId);
  if (!p) throw new Error(`Pos ${posId} tidak ditemukan`);
  return p;
}

export function addQuestion(bank, posId, question) {
  const out = clone(bank);
  getPos(out, posId).questions.push({ ...question, id: question.id || newId('q') });
  return out;
}

export function updateQuestion(bank, posId, question) {
  const out = clone(bank);
  const list = getPos(out, posId).questions;
  const i = list.findIndex((q) => q.id === question.id);
  if (i < 0) throw new Error('Soal tidak ditemukan');
  list[i] = question;
  return out;
}

export function deleteQuestion(bank, posId, questionId) {
  const out = clone(bank);
  const p = getPos(out, posId);
  p.questions = p.questions.filter((q) => q.id !== questionId);
  return out;
}

export function moveQuestion(bank, posId, questionId, delta) {
  const out = clone(bank);
  const list = getPos(out, posId).questions;
  const i = list.findIndex((q) => q.id === questionId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return out;
  [list[i], list[j]] = [list[j], list[i]];
  return out;
}

/** Mengganti seluruh bank dengan bank baru. */
export function replaceBank(_current, incoming) {
  return normalizeBank(clone(incoming));
}

/**
 * Menggabungkan bank baru ke bank lama. Soal dengan ID yang sudah ada
 * diberi ID baru agar tidak menimpa soal lama.
 * @returns {{bank:object, added:number, renamed:number}}
 */
export function mergeBank(current, incoming) {
  const out = normalizeBank(clone(current));
  const ids = new Set(out.pos.flatMap((p) => p.questions.map((q) => q.id)));
  let added = 0;
  let renamed = 0;
  for (const p of normalizeBank(incoming).pos) {
    const target = getPos(out, p.id);
    for (const q of p.questions) {
      const copy = clone(q);
      if (ids.has(copy.id)) {
        copy.id = newId('q');
        renamed++;
      }
      ids.add(copy.id);
      target.questions.push(copy);
      added++;
    }
  }
  return { bank: out, added, renamed };
}

export function countQuestions(bank) {
  return Object.fromEntries(bank.pos.map((p) => [p.id, p.questions.length]));
}

/**
 * Template JSON yang dapat diunduh guru. Berisi satu contoh per tipe soal.
 * Semua contoh adalah DATA DUMMY dan wajib diganti dengan materi asli.
 */
export function bankTemplate() {
  return {
    game: GAME_ID,
    version: BANK_VERSION,
    _petunjuk: [
      'File ini adalah TEMPLATE. Semua soal di bawah adalah DATA DUMMY, ganti dengan materi Anda.',
      'pos1 (verse_puzzle): tulis potongan ayat di "segments" sesuai URUTAN YANG BENAR. Game akan mengacaknya sendiri.',
      'direction: "rtl" untuk teks Arab (dibaca kanan ke kiri), "ltr" untuk teks Latin.',
      'pos2 (battle_quiz) dan reflection: "answer" adalah nomor urut pilihan yang benar, dimulai dari 0.',
      'pos3 (reflection): format "choice" = pilihan situasi, "short_text" = isian singkat. grading: "none" (tidak dinilai), "auto" (dicocokkan kunci, khusus choice), "manual" (dinilai guru).',
      '"score"/"maxScore" boleh dikosongkan agar memakai skor bawaan di Peraturan.',
      'Pastikan teks ayat disalin dari mushaf atau sumber yang terverifikasi.',
    ],
    pos: [
      {
        id: 'pos1',
        type: 'verse_puzzle',
        questions: [
          {
            id: 'contoh_pos1_1',
            instruction: '[DUMMY] Susunlah potongan berikut dengan urutan yang benar.',
            reference: '[DUMMY] Nama surah : nomor ayat',
            direction: 'rtl',
            segments: ['جُزْءٌ ١', 'جُزْءٌ ٢', 'جُزْءٌ ٣', 'جُزْءٌ ٤'],
            translation: '[DUMMY] Terjemahan ayat ditulis di sini (opsional).',
            score: 10,
          },
        ],
      },
      {
        id: 'pos2',
        type: 'battle_quiz',
        questions: [
          {
            id: 'contoh_pos2_1',
            question: '[DUMMY] Tulis pertanyaan pilihan ganda di sini?',
            options: ['[DUMMY] Pilihan A', '[DUMMY] Pilihan B', '[DUMMY] Pilihan C', '[DUMMY] Pilihan D'],
            answer: 0,
            score: 10,
          },
        ],
      },
      {
        id: 'pos3',
        type: 'reflection',
        questions: [
          {
            id: 'contoh_pos3_1',
            question: '[DUMMY] Pertanyaan refleksi dengan pilihan situasi?',
            format: 'choice',
            options: ['[DUMMY] Situasi 1', '[DUMMY] Situasi 2', '[DUMMY] Situasi 3'],
            grading: 'none',
          },
          {
            id: 'contoh_pos3_2',
            question: '[DUMMY] Pertanyaan refleksi dengan isian singkat?',
            format: 'short_text',
            grading: 'manual',
            maxScore: 10,
          },
        ],
      },
    ],
  };
}

export { emptyBank };
