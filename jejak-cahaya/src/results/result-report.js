// Laporan hasil satu kelompok: ringkasan, rincian jawaban, kunci Battle Quiz, CSV & JSON.

import { POS_DEFS, POS_BY_ID, CHARACTER_BY_ID } from '../core/constants.js';
import { totals, findQuestion, formatDuration } from '../scoring/run.js';

// Urutan logis (bacaan); browser menampilkan teks Arab dari kanan ke kiri secara otomatis.
const verseText = (q, list) => list.join(' ');

function responseText(posType, q, a) {
  if (!a) return '';
  if (posType === 'verse_puzzle') return (a.response || []).join(' | ');
  if (posType === 'battle_quiz') return q.options[a.response] ?? '';
  if (q.format === 'choice') return q.options[a.response] ?? '';
  return String(a.response ?? '');
}

/** Rincian per soal (dipakai layar akhir, CSV, dan cetak). */
export function detailRows(run, t) {
  const rows = [];
  for (const d of POS_DEFS) {
    run.questions[d.id].forEach((qid, i) => {
      const q = findQuestion(t, d.id, qid);
      if (!q) return;
      const ans = run.answers.filter((a) => a.questionId === qid);
      const last = ans[ans.length - 1];
      let key = '';
      if (d.type === 'verse_puzzle') key = q.segments.join(' | ');
      if (d.type === 'battle_quiz') key = q.options[q.answer];
      if (d.type === 'reflection' && q.grading === 'auto') key = q.options[q.answer];
      rows.push({
        pos: d.id,
        posName: d.name,
        no: i + 1,
        question: d.type === 'verse_puzzle' ? q.reference || q.instruction : q.question,
        answer: responseText(d.type, q, last),
        key,
        status: !last ? 'Tidak dijawab' : last.pending ? 'Menunggu nilai guru' : last.correct === true ? 'Benar' : last.correct === false ? 'Salah' : 'Tersimpan',
        attempts: ans.length,
        points: ans.reduce((s, a) => s + a.points, 0),
        verse: d.type === 'verse_puzzle' ? verseText(q, q.segments) : '',
      });
    });
  }
  return rows;
}

export function summary(run, t) {
  const tot = totals(run, t);
  return {
    exam: run.exam.title,
    subject: run.exam.subject,
    chapter: run.exam.chapter,
    className: run.exam.className,
    teacher: run.exam.teacherName,
    group: run.groupName,
    character: CHARACTER_BY_ID[run.character]?.name ?? run.character,
    title: run.title || '-',
    score: tot.score,
    correct: tot.correct,
    wrong: tot.wrong,
    pending: tot.pending,
    duration: formatDuration(tot.seconds),
    startedAt: new Date(run.startedAt).toLocaleString('id-ID'),
    byPos: POS_DEFS.map((d) => ({ id: d.id, name: d.name, ...tot.byPos[d.id] })),
  };
}

const cell = (v) => {
  const s = String(v ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV (pemisah titik koma, cocok untuk Excel berbahasa Indonesia). */
export function toCSV(run, t) {
  return csvFromData({ summary: summary(run, t), details: detailRows(run, t) });
}

/** CSV dari data hasil tersimpan (tidak butuh template, aman walau bank soal sudah diubah). */
export function csvFromData({ summary: s, details }) {
  const lines = [
    ['Jejak Cahaya - Hasil Kelompok'],
    ['Ujian', s.exam],
    ['Mata pelajaran', s.subject],
    ['Materi/Bab', s.chapter],
    ['Kelas', s.className],
    ['Guru', s.teacher],
    ['Kelompok', s.group],
    ['Karakter', s.character],
    ['Mulai', s.startedAt],
    ['Waktu penyelesaian', s.duration],
    ['Gelar', s.title],
    ['Skor total', s.score],
    ['Jawaban benar', s.correct],
    ['Jawaban salah', s.wrong],
    [],
    ['Pos', 'Skor', 'Benar', 'Salah', 'Bonus', 'Waktu', 'Status'],
    ...s.byPos.map((p) => [p.name, p.score, p.correct, p.wrong, p.bonus, formatDuration(p.seconds), p.status === 'done' ? (p.timeout ? 'Waktu habis' : 'Selesai') : 'Belum selesai']),
    [],
    ['Pos', 'No', 'Soal', 'Jawaban kelompok', 'Kunci', 'Status', 'Percobaan', 'Poin'],
    ...details.map((r) => [r.posName, r.no, r.question, r.answer, r.key, r.status, r.attempts, r.points]),
  ];
  return '\ufeff' + lines.map((l) => l.map(cell).join(';')).join('\r\n');
}

export function toJSON(run, t) {
  return { format: 'jejak-cahaya/result', formatVersion: 1, summary: summary(run, t), details: detailRows(run, t), run };
}

export function resultFileName(run, ext) {
  const slug = (x) => String(x || '').toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const d = new Date(run.startedAt);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  return `hasil-${slug(run.groupName)}-${slug(run.exam.title)}-${stamp}.${ext}`;
}

export { POS_BY_ID };
