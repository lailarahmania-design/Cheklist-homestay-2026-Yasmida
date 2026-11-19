// Lembar hasil (HTML) dari {summary, details}: layar akhir, dashboard guru, dan cetak/PDF.

import { esc } from '../ui/ui.js';
import { formatDuration } from '../scoring/run.js';
import { characterSVG } from '../ui/characters.js';
import { CHARACTER_BY_ID } from '../core/constants.js';

const ST_CLASS = { Benar: 'ok', Salah: 'bad', 'Tidak dijawab': 'skip', 'Menunggu nilai guru': 'wait', Tersimpan: 'info' };
const charIdByName = (name) => Object.values(CHARACTER_BY_ID).find((c) => c.name === name)?.id;

export function resultSheetHTML({ summary: s, details }, { showKeys = true } = {}) {
  const rows = (pos) => details.filter((d) => d.pos === pos);
  const status = (r) => `<span class="st st-${ST_CLASS[r.status] || 'info'}">${esc(r.status)}</span>`;
  const cid = charIdByName(s.character);
  return `
  <article class="result-sheet" data-testid="result-sheet">
    <header class="rs-head">
      ${cid ? `<div class="rs-avatar">${characterSVG(cid, { size: 80 })}</div>` : ''}
      <div>
        <p class="rs-exam">${esc(s.exam)}</p>
        <h2>${esc(s.group)}</h2>
        <p class="hint">${[s.subject, s.chapter, s.className].filter(Boolean).map(esc).join(' · ')}${s.teacher ? ` · Guru: ${esc(s.teacher)}` : ''}</p>
        ${s.title && s.title !== '-' ? `<span class="rs-title">✨ ${esc(s.title)}</span>` : '<span class="badge badge-warn">Perjalanan belum selesai</span>'}
      </div>
      <div class="rs-score" data-testid="final-score"><small>Nilai akhir</small><b>${s.score}</b></div>
    </header>

    <div class="rs-stats">
      <div><b>${s.correct}</b><small>Jawaban benar</small></div>
      <div><b>${s.wrong}</b><small>Jawaban salah</small></div>
      <div><b>${s.duration}</b><small>Waktu penyelesaian</small></div>
      ${s.pending ? `<div><b>${s.pending}</b><small>Refleksi menunggu nilai guru</small></div>` : ''}
    </div>

    <div class="rs-scroll"><table class="rs-table">
      <thead><tr><th>Pos</th><th>Skor</th><th>Benar</th><th>Salah</th><th>Bonus</th><th>Waktu</th><th>Status</th></tr></thead>
      <tbody>${s.byPos.map((p) => `<tr><td>${esc(p.name)}</td><td><b>${p.score}</b></td><td>${p.correct}</td><td>${p.wrong}</td><td>${p.bonus}</td><td>${formatDuration(p.seconds)}</td>
        <td>${p.status === 'done' ? (p.timeout ? '⏰ Waktu habis' : '✅ Selesai') : '— Belum selesai'}</td></tr>`).join('')}</tbody>
    </table></div>

    ${showKeys ? `
    <section class="rs-section" data-testid="battle-keys">
      <h3>⚔️ Jawaban Soal Battle Quiz</h3>
      <div class="rs-scroll"><table class="rs-table">
        <thead><tr><th>No</th><th>Soal</th><th>Jawaban kelompok</th><th>Kunci jawaban</th><th>Status</th><th>Percobaan</th></tr></thead>
        <tbody>${rows('pos2').map((r) => `<tr><td>${r.no}</td><td dir="auto">${esc(r.question)}</td><td dir="auto">${esc(r.answer) || '—'}</td><td dir="auto"><b>${esc(r.key)}</b></td><td>${status(r)}</td><td>${r.attempts}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada soal.</td></tr>'}</tbody>
      </table></div>
    </section>
    <section class="rs-section">
      <h3>📖 Susunan Ayat (Pos 1)</h3>
      <div class="rs-scroll"><table class="rs-table">
        <thead><tr><th>No</th><th>Rujukan</th><th>Susunan yang benar</th><th>Status</th><th>Percobaan</th></tr></thead>
        <tbody>${rows('pos1').map((r) => `<tr><td>${r.no}</td><td>${esc(r.question)}</td><td class="arabic-cell" dir="auto">${esc(r.verse)}</td><td>${status(r)}</td><td>${r.attempts}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>` : ''}
    <section class="rs-section">
      <h3>🌿 Jawaban Refleksi (Pos 3)</h3>
      <div class="rs-scroll"><table class="rs-table">
        <thead><tr><th>No</th><th>Pertanyaan</th><th>Jawaban kelompok</th><th>Status</th></tr></thead>
        <tbody>${rows('pos3').map((r) => `<tr><td>${r.no}</td><td dir="auto">${esc(r.question)}</td><td dir="auto">${esc(r.answer) || '—'}</td><td>${status(r)}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>
    <footer class="rs-foot hint">Dibuat oleh Jejak Cahaya · ${esc(s.startedAt)}</footer>
  </article>`;
}
