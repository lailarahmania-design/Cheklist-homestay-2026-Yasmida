// Impor bank soal dari JSON: unggah/tempel → validasi → pratinjau → ganti atau gabung.

import { POS_DEFS, POS_BY_ID } from '../../core/constants.js';
import { validateBank } from '../../question-bank/schema.js';
import { mergeBank, replaceBank, countQuestions } from '../../question-bank/bank-ops.js';
import { esc, openModal, pickTextFile, toast } from '../../ui/ui.js';
import { questionSummary } from './questions.js';

export function openJsonImport(ctx) {
  let result = null;
  openModal({
    title: 'Impor Bank Soal dari JSON',
    wide: true,
    render(body, close) {
      body.innerHTML = `
      <ol class="steps"><li>Pilih file JSON atau tempel isinya.</li><li>Periksa hasil validasi & pratinjau.</li><li>Pilih <b>Gabungkan</b> atau <b>Ganti</b>.</li></ol>
      <div class="actions" style="justify-content:flex-start">
        <button type="button" class="btn btn-water" data-pick data-testid="json-pick">📂 Pilih File JSON</button>
        <span class="hint" data-fname></span>
      </div>
      <label class="field"><span>…atau tempel isi JSON di sini</span>
        <textarea data-text rows="6" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:.85rem" data-testid="json-text"></textarea></label>
      <button type="button" class="btn" data-check data-testid="json-check">🔍 Periksa</button>
      <div data-result aria-live="polite"></div>`;

      const text = body.querySelector('[data-text]');
      const out = body.querySelector('[data-result]');

      const run = () => {
        result = validateBank(text.value);
        const r = result;
        const current = countQuestions(ctx.t.questionBank);
        const totalCur = Object.values(current).reduce((a, b) => a + b, 0);
        out.innerHTML = `
          <div class="import-status ${r.ok ? 'ok' : 'bad'}" data-testid="json-status">
            ${r.ok ? '✔ Struktur JSON valid.' : `✖ Ditemukan ${r.errors.length} kesalahan. Perbaiki file lalu periksa kembali.`}
          </div>
          ${r.errors.length ? `<ul class="issues">${r.errors.map((e) => `<li class="issue err"><b>${esc(e.path)}</b>: ${esc(e.message)}</li>`).join('')}</ul>` : ''}
          ${r.warnings.length ? `<ul class="issues">${r.warnings.map((e) => `<li class="issue warn"><b>${esc(e.path)}</b>: ${esc(e.message)}</li>`).join('')}</ul>` : ''}
          ${r.preview ? previewHTML(r.preview, r.ok) : ''}
          ${r.ok ? `
          <div class="import-choice">
            <p>Bank soal saat ini: <b>${totalCur}</b> soal. File: <b>${Object.values(r.counts).reduce((a, b) => a + b, 0)}</b> soal.</p>
            <div class="actions">
              <button type="button" class="btn btn-gold" data-merge data-testid="json-merge">➕ Gabungkan dengan bank lama</button>
              <button type="button" class="btn btn-danger" data-replace data-testid="json-replace">♻️ Ganti seluruh bank soal</button>
            </div>
          </div>` : ''}`;
        out.querySelector('[data-merge]')?.addEventListener('click', () => {
          const m = mergeBank(ctx.t.questionBank, r.bank);
          ctx.change((d) => (d.questionBank = m.bank), { rerender: true });
          toast(`${m.added} soal ditambahkan${m.renamed ? ` (${m.renamed} ID diganti karena bentrok)` : ''}. Jangan lupa Simpan.`, 'ok');
          close();
        });
        out.querySelector('[data-replace]')?.addEventListener('click', (e) => {
          const b = e.currentTarget;
          if (!b.dataset.sure) {
            b.dataset.sure = '1';
            b.textContent = `⚠️ Yakin? ${totalCur} soal lama akan dihapus. Klik lagi`;
            return;
          }
          ctx.change((d) => (d.questionBank = replaceBank(d.questionBank, r.bank)), { rerender: true });
          toast('Bank soal diganti. Jangan lupa Simpan.', 'ok');
          close();
        });
      };

      body.querySelector('[data-pick]').onclick = async () => {
        try {
          const f = await pickTextFile();
          if (!f) return;
          text.value = f.text;
          body.querySelector('[data-fname]').textContent = f.name;
          run();
        } catch (e) {
          toast(e.message, 'error');
        }
      };
      body.querySelector('[data-check]').onclick = () => {
        if (!text.value.trim()) return toast('Tempel isi JSON atau pilih file terlebih dahulu.', 'error');
        run();
      };
    },
  });
}

function previewHTML(bank, ok) {
  return `<div class="import-preview" data-testid="json-preview">
    <h3>Pratinjau ${ok ? '' : '(hanya soal yang valid)'}</h3>
    ${POS_DEFS.map((d, i) => {
      const qs = bank.pos.find((p) => p.id === d.id).questions;
      return `<details ${qs.length ? 'open' : ''}><summary>${d.icon} Pos ${i + 1} · ${esc(POS_BY_ID[d.id].name)}: <b>${qs.length}</b> soal</summary>
        <ol>${qs.map((q) => `<li>${questionSummary(d.type, q)}</li>`).join('')}</ol></details>`;
    }).join('')}
  </div>`;
}
