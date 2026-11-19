// Tab Bank Soal: daftar soal per pos, tambah/edit/hapus/urutkan, template & impor JSON.

import { POS_DEFS, POS_BY_ID } from '../../core/constants.js';
import { addQuestion, updateQuestion, deleteQuestion, moveQuestion, bankTemplate, countQuestions } from '../../question-bank/bank-ops.js';
import { GAME_ID, BANK_VERSION } from '../../core/constants.js';
import { esc, confirmDialog, downloadJSON, slug, toast } from '../../ui/ui.js';
import { openQuestionForm } from './question-form.js';
import { openJsonImport } from './json-import.js';

let activePos = 'pos1';

const GRADING_LABEL = { none: 'Tidak dinilai', manual: 'Dinilai manual', auto: 'Otomatis' };

/** Ringkasan satu baris soal (dipakai di daftar & pratinjau impor). */
export function questionSummary(type, q) {
  if (type === 'verse_puzzle') {
    const ar = q.direction === 'rtl';
    return `<span class="q-blocks ${ar ? 'rtl' : ''}">${q.segments.map((s) => `<span class="verse-block sm ${ar ? 'arabic' : ''}">${esc(s)}</span>`).join('')}</span>
      ${q.reference ? `<small class="hint">${esc(q.reference)}</small>` : ''}`;
  }
  if (type === 'battle_quiz') {
    return `<span dir="auto">${esc(q.question)}</span>
      <span class="q-opts">${q.options.map((o, i) => `<span class="opt ${i === q.answer ? 'key' : ''}">${String.fromCharCode(65 + i)}. ${esc(o)}${i === q.answer ? ' ✔' : ''}</span>`).join('')}</span>`;
  }
  return `<span dir="auto">${esc(q.question)}</span>
    <span class="q-opts"><span class="badge">${q.format === 'choice' ? 'Pilihan situasi' : 'Isian singkat'}</span>
    <span class="badge ${q.grading === 'none' ? '' : 'badge-water'}">${GRADING_LABEL[q.grading]}</span>
    ${q.format === 'choice' ? q.options.map((o, i) => `<span class="opt ${q.grading === 'auto' && i === q.answer ? 'key' : ''}">${esc(o)}</span>`).join('') : ''}</span>`;
}

export function renderQuestionsTab(panel, ctx) {
  const bank = ctx.t.questionBank;
  const counts = countQuestions(bank);
  const def = POS_BY_ID[activePos];
  const list = bank.pos.find((p) => p.id === activePos).questions;
  const scoreOf = (q) => (def.type === 'reflection' ? (q.grading === 'none' ? '–' : q.maxScore ?? ctx.t.rules.correctScore) : q.score ?? ctx.t.rules.correctScore);

  panel.innerHTML = `
  <div class="tab-head">
    <div><h2>Bank Soal</h2>
      <p class="hint">Bank soal tidak terikat pada satu materi; isi sesuai bab yang diujikan. Kunci jawaban hanya terlihat di Mode Guru.</p></div>
    <div class="actions">
      <button class="btn btn-ghost btn-sm" data-act="template" data-testid="download-template">⬇️ Template JSON</button>
      <button class="btn btn-ghost btn-sm" data-act="export">⬇️ Ekspor Bank Soal</button>
      <button class="btn btn-water btn-sm" data-act="import" data-testid="open-import">⬆️ Impor JSON</button>
    </div>
  </div>
  <div class="pos-tabs" role="tablist" aria-label="Pilih pos">
    ${POS_DEFS.map(
      (p, i) => `<button role="tab" class="pos-tab pos-${p.id} ${p.id === activePos ? 'active' : ''}" aria-selected="${p.id === activePos}" data-pos="${p.id}" data-testid="postab-${p.id}">
        <span class="pos-icon" aria-hidden="true">${p.icon}</span>
        <span><b>Pos ${i + 1} · ${esc(p.name)}</b><small>${esc(p.mechanic)}</small></span>
        <span class="badge ${counts[p.id] ? 'badge-ok' : 'badge-err'}" data-testid="count-${p.id}">${counts[p.id]}</span>
      </button>`
    ).join('')}
  </div>
  <div class="q-toolbar">
    <p class="hint">${posHelp(def.type)}</p>
    <button class="btn btn-primary" data-act="add" data-testid="add-question">＋ Tambah Soal</button>
  </div>
  <ol class="q-list" data-testid="question-list">
    ${
      list.length
        ? list
            .map(
              (q, i) => `<li class="q-item" data-id="${esc(q.id)}" data-testid="question-item">
          <span class="q-no">${i + 1}</span>
          <div class="q-body">${questionSummary(def.type, q)}</div>
          <span class="badge q-score" title="Skor">⭐ ${esc(scoreOf(q))}</span>
          <div class="row-actions">
            <button class="icon-btn" data-act="up" aria-label="Naikkan soal" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button class="icon-btn" data-act="down" aria-label="Turunkan soal" ${i === list.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="icon-btn" data-act="edit" aria-label="Edit soal" data-testid="edit-question">✏️</button>
            <button class="icon-btn danger" data-act="del" aria-label="Hapus soal" data-testid="delete-question">🗑</button>
          </div>
        </li>`
            )
            .join('')
        : `<li class="empty panel">Belum ada soal di ${esc(def.name)}. Tambahkan manual atau impor dari JSON.</li>`
    }
  </ol>`;

  panel.onclick = async (e) => {
    const tabBtn = e.target.closest('[data-pos]');
    if (tabBtn) {
      activePos = tabBtn.dataset.pos;
      ctx.rerender();
      return;
    }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    const id = btn.closest('[data-id]')?.dataset.id;
    if (act === 'add') {
      openQuestionForm({
        posId: activePos,
        defaultScore: ctx.t.rules.correctScore,
        onSave: (posId, q) => {
          activePos = posId;
          ctx.change((d) => (d.questionBank = addQuestion(d.questionBank, posId, q)), { rerender: true });
          toast('Soal ditambahkan. Jangan lupa Simpan.', 'ok');
        },
      });
    } else if (act === 'edit') {
      openQuestionForm({
        posId: activePos,
        question: list.find((q) => q.id === id),
        defaultScore: ctx.t.rules.correctScore,
        onSave: (posId, q) => ctx.change((d) => (d.questionBank = updateQuestion(d.questionBank, posId, q)), { rerender: true }),
      });
    } else if (act === 'del') {
      const ok = await confirmDialog({ title: 'Hapus soal?', message: 'Soal ini akan dihapus dari bank soal.', okText: 'Hapus', danger: true });
      if (ok) ctx.change((d) => (d.questionBank = deleteQuestion(d.questionBank, activePos, id)), { rerender: true });
    } else if (act === 'up' || act === 'down') {
      ctx.change((d) => (d.questionBank = moveQuestion(d.questionBank, activePos, id, act === 'up' ? -1 : 1)), { rerender: true });
    } else if (act === 'template') {
      downloadJSON('template-bank-soal-jejak-cahaya.json', bankTemplate());
      toast('Template diunduh. Isi file lalu unggah lewat "Impor JSON".');
    } else if (act === 'export') {
      downloadJSON(`bank-soal-${slug(ctx.t.identity.title)}.json`, { ...ctx.t.questionBank, game: GAME_ID, version: BANK_VERSION });
      toast('Bank soal diekspor (berisi kunci jawaban).');
    } else if (act === 'import') {
      openJsonImport(ctx);
    }
  };
}

function posHelp(type) {
  if (type === 'verse_puzzle') return 'Setiap soal = satu ayat/potongan ayat. Siswa menyusun balok yang diacak; jika benar, jembatan tersambung.';
  if (type === 'battle_quiz') return 'Soal pilihan ganda. Jawaban benar mengurangi energi golem; jawaban salah mengurangi nyawa kelompok.';
  return 'Pertanyaan reflektif ditampilkan satu per satu. Jawaban disimpan dan bisa dinilai atau tidak.';
}
