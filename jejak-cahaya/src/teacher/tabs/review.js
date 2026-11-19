import { POS_DEFS } from '../../core/constants.js';
import { checkTemplate, maxPossibleScore } from '../../config/template-model.js';
import { countQuestions } from '../../question-bank/bank-ops.js';
import { esc } from '../../ui/ui.js';

const TAB_LABEL = { identitas: 'Identitas', kelompok: 'Kelompok', waktu: 'Waktu', peraturan: 'Peraturan', soal: 'Bank Soal' };

export function renderReviewTab(panel, ctx) {
  const t = ctx.t;
  const c = checkTemplate(t);
  const counts = countQuestions(t.questionBank);
  const link = (tab) => `<a href="#/guru/edit/${esc(t.id)}/${tab}">${TAB_LABEL[tab]}</a>`;
  panel.innerHTML = `
  <h2>Pemeriksaan Konfigurasi</h2>
  <div class="import-status ${c.ready ? 'ok' : 'bad'}" data-testid="ready-status">
    ${c.ready ? '✔ Konfigurasi siap dipakai untuk membuat sesi permainan.' : `✖ Ada ${c.errors.length} hal yang wajib dilengkapi.`}
  </div>
  ${c.errors.length ? `<ul class="issues">${c.errors.map((e) => `<li class="issue err">✖ ${esc(e.message)} (${link(e.tab)})</li>`).join('')}</ul>` : ''}
  ${c.warnings.length ? `<ul class="issues">${c.warnings.map((e) => `<li class="issue warn">⚠ ${esc(e.message)} (${link(e.tab)})</li>`).join('')}</ul>` : ''}
  <dl class="summary">
    <div><dt>Judul</dt><dd>${esc(t.identity.title)}</dd></div>
    <div><dt>Mapel · Bab · Kelas</dt><dd>${[t.identity.subject, t.identity.chapter, t.identity.className].filter(Boolean).map(esc).join(' · ') || '-'}</dd></div>
    <div><dt>Kelompok</dt><dd>${t.groups.map((g) => esc(g.name)).join(', ')}</dd></div>
    <div><dt>Waktu</dt><dd>${POS_DEFS.map((p, i) => `Pos ${i + 1}: ${t.timing[p.id + 'Minutes']} mnt`).join(' · ')} · Total ${t.timing.totalMinutes} mnt</dd></div>
    <div><dt>Soal</dt><dd>${POS_DEFS.map((p, i) => `Pos ${i + 1}: ${counts[p.id]}`).join(' · ')}</dd></div>
    <div><dt>Skor maksimum (perkiraan)</dt><dd>${maxPossibleScore(t) || 0}</dd></div>
  </dl>`;
}
