// Model "template" = konfigurasi ujian yang bisa dipakai berulang kali.
// Data sesi (kelompok yang bergabung, posisi, skor, jawaban) disimpan terpisah (Tahap 4).

import { CHARACTER_IDS, LIMITS, POS_DEFS } from '../core/constants.js';
import { clone, newId } from '../core/ids.js';
import { emptyBank, normalizeBank } from '../question-bank/schema.js';

export const DEFAULT_TIMING = {
  pos1Minutes: 10,
  pos2Minutes: 15,
  pos3Minutes: 10,
  totalMinutes: 40,
  allowExtraTime: true,
  extraTimeMinutes: 5,
};

export const DEFAULT_RULES = {
  correctScore: 10, // skor bawaan per soal jika soal tidak menentukan skornya sendiri
  wrongPenalty: 0, // pengurangan skor setiap jawaban salah
  completionBonus: 20, // bonus setiap menyelesaikan satu pos
  attemptsPerQuestion: 2, // kesempatan menjawab per soal (puzzle & battle)
  teamHearts: 3, // nyawa kelompok saat Battle Quiz
  pos1QuestionCount: 0, // jumlah ayat yang dipakai di Pos 1; 0 = semua (dipilih acak per kelompok)
  pos2QuestionCount: 0, // jumlah soal yang dipakai di Battle Quiz; 0 = semua
  shuffleQuestions: true,
  shuffleOptions: true,
  reflectionRequireAll: true, // semua pertanyaan refleksi wajib dijawab
  reflectionMinChars: 10, // panjang minimal isian singkat
};

export const DEFAULT_SETTINGS = {
  allowCharacterSelect: true, // siswa boleh memilih karakter saat bergabung
};

export function createGroup(name, character, order = 0) {
  return { id: newId('g'), name, character: CHARACTER_IDS.includes(character) ? character : CHARACTER_IDS[0], order };
}

export function createTemplate(overrides = {}) {
  const now = new Date().toISOString();
  const t = {
    id: newId('tpl'),
    createdAt: now,
    updatedAt: now,
    identity: {
      title: 'Ujian Tanpa Judul',
      subject: '',
      chapter: '',
      className: '',
      teacherName: '',
      description: '',
    },
    groups: [1, 2, 3, 4].map((n, i) => createGroup(`Kelompok ${n}`, CHARACTER_IDS[i % CHARACTER_IDS.length], i)),
    timing: { ...DEFAULT_TIMING },
    rules: { ...DEFAULT_RULES },
    settings: { ...DEFAULT_SETTINGS },
    questionBank: emptyBank(),
  };
  return { ...t, ...overrides };
}

/** Melengkapi field yang hilang (mis. file lama) tanpa mengubah data yang sudah ada. */
export function normalizeTemplate(raw) {
  const base = createTemplate();
  const t = clone(raw || {});
  return {
    id: typeof t.id === 'string' && t.id ? t.id : base.id,
    createdAt: t.createdAt || base.createdAt,
    updatedAt: t.updatedAt || base.updatedAt,
    identity: { ...base.identity, ...(t.identity || {}) },
    groups: Array.isArray(t.groups)
      ? t.groups.map((g, i) => ({
          id: g.id || newId('g'),
          name: String(g.name ?? `Kelompok ${i + 1}`),
          character: CHARACTER_IDS.includes(g.character) ? g.character : CHARACTER_IDS[0],
          order: i,
        }))
      : base.groups,
    timing: { ...DEFAULT_TIMING, ...(t.timing || {}) },
    rules: { ...DEFAULT_RULES, ...(t.rules || {}) },
    settings: { ...DEFAULT_SETTINGS, ...(t.settings || {}) },
    questionBank: normalizeBank(t.questionBank),
  };
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Memeriksa kesiapan konfigurasi.
 * errors = harus diperbaiki sebelum dipakai untuk sesi; warnings = saran.
 */
export function checkTemplate(t) {
  const errors = [];
  const warnings = [];
  const id = t.identity;
  if (!id.title.trim()) errors.push({ tab: 'identitas', message: 'Judul ujian wajib diisi.' });
  if (!id.subject.trim()) warnings.push({ tab: 'identitas', message: 'Mata pelajaran belum diisi.' });
  if (!id.className.trim()) warnings.push({ tab: 'identitas', message: 'Kelas belum diisi.' });

  if (t.groups.length < LIMITS.minGroups) errors.push({ tab: 'kelompok', message: 'Minimal harus ada 1 kelompok.' });
  if (t.groups.length > LIMITS.maxGroups) errors.push({ tab: 'kelompok', message: `Maksimal ${LIMITS.maxGroups} kelompok.` });
  const names = t.groups.map((g) => g.name.trim().toLowerCase());
  if (names.some((n) => !n)) errors.push({ tab: 'kelompok', message: 'Ada kelompok yang belum diberi nama.' });
  if (new Set(names).size !== names.length) errors.push({ tab: 'kelompok', message: 'Nama kelompok tidak boleh sama.' });

  const tm = t.timing;
  for (const k of ['pos1Minutes', 'pos2Minutes', 'pos3Minutes', 'totalMinutes']) {
    if (!num(tm[k]) || tm[k] < 1 || tm[k] > LIMITS.maxMinutes)
      errors.push({ tab: 'waktu', message: `Durasi harus antara 1 dan ${LIMITS.maxMinutes} menit.` });
  }
  if (tm.totalMinutes < tm.pos1Minutes + tm.pos2Minutes + tm.pos3Minutes)
    warnings.push({ tab: 'waktu', message: 'Waktu total lebih singkat dari jumlah durasi ketiga pos.' });

  const r = t.rules;
  for (const k of ['correctScore', 'wrongPenalty', 'completionBonus', 'pos1QuestionCount', 'pos2QuestionCount', 'reflectionMinChars'])
    if (!num(r[k]) || r[k] < 0) errors.push({ tab: 'peraturan', message: 'Nilai pada Peraturan tidak boleh negatif atau kosong.' });
  if (!num(r.attemptsPerQuestion) || r.attemptsPerQuestion < 1)
    errors.push({ tab: 'peraturan', message: 'Kesempatan menjawab minimal 1.' });
  if (!num(r.teamHearts) || r.teamHearts < 1) errors.push({ tab: 'peraturan', message: 'Nyawa kelompok minimal 1.' });

  for (const p of POS_DEFS) {
    const n = t.questionBank.pos.find((x) => x.id === p.id).questions.length;
    if (n === 0) errors.push({ tab: 'soal', message: `${p.name} (${p.id.toUpperCase()}) belum memiliki soal.` });
  }
  const pos1 = t.questionBank.pos.find((x) => x.id === 'pos1').questions.length;
  if (r.pos1QuestionCount > pos1 && pos1 > 0)
    warnings.push({ tab: 'peraturan', message: `Jumlah ayat Pos 1 (${r.pos1QuestionCount}) melebihi ayat yang tersedia (${pos1}); semua ayat akan dipakai.` });
  const pos2 = t.questionBank.pos.find((x) => x.id === 'pos2').questions.length;
  if (r.pos2QuestionCount > pos2 && pos2 > 0)
    warnings.push({ tab: 'peraturan', message: `Jumlah soal Battle Quiz (${r.pos2QuestionCount}) melebihi soal yang tersedia (${pos2}); semua soal akan dipakai.` });

  // pesan unik saja
  const uniq = (list) => list.filter((e, i) => list.findIndex((x) => x.message === e.message) === i);
  return { ready: errors.length === 0, errors: uniq(errors), warnings: uniq(warnings) };
}

/** Skor maksimum yang mungkin diraih (tanpa refleksi tak-dinilai). */
export function maxPossibleScore(t) {
  const r = t.rules;
  const s = (q) => (q.score ?? null) === null ? r.correctScore : q.score;
  const [p1, p2, p3] = ['pos1', 'pos2', 'pos3'].map((id) => t.questionBank.pos.find((x) => x.id === id).questions);
  const used1 = r.pos1QuestionCount > 0 ? Math.min(r.pos1QuestionCount, p1.length) : p1.length;
  const avg1 = p1.length ? p1.reduce((a, q) => a + s(q), 0) / p1.length : 0;
  const used2 = r.pos2QuestionCount > 0 ? Math.min(r.pos2QuestionCount, p2.length) : p2.length;
  // Untuk pos 2 dengan sebagian soal, pakai rata-rata skor soal.
  const avg2 = p2.length ? p2.reduce((a, q) => a + s(q), 0) / p2.length : 0;
  const ref = p3.filter((q) => q.grading !== 'none').reduce((a, q) => a + (q.maxScore ?? r.correctScore), 0);
  return Math.round(avg1 * used1 + avg2 * used2 + ref + r.completionBonus * 3);
}
