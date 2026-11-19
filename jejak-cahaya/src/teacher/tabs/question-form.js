// Formulir tambah/edit soal (modal). Bentuk formulir menyesuaikan tipe pos.

import { POS_DEFS, POS_BY_ID, LIMITS } from '../../core/constants.js';
import { validateQuestion } from '../../question-bank/schema.js';
import { esc, openModal } from '../../ui/ui.js';

/**
 * @param {object} opts
 * @param {string} opts.posId   pos awal
 * @param {object} [opts.question] soal yang diedit (pos dikunci saat edit)
 * @param {number} opts.defaultScore
 * @param {(posId:string, q:object)=>void} opts.onSave
 */
export function openQuestionForm({ posId, question, defaultScore, onSave }) {
  const editing = !!question;
  let pos = posId;
  // State formulir terpisah dari draf hingga tombol Simpan ditekan.
  let f = question ? JSON.parse(JSON.stringify(question)) : null;

  openModal({
    title: editing ? 'Edit Soal' : 'Tambah Soal',
    wide: true,
    render(body, close) {
      const blank = (type) =>
        type === 'verse_puzzle'
          ? { instruction: '', reference: '', segments: ['', '', ''], direction: 'rtl', translation: '', score: null }
          : type === 'battle_quiz'
            ? { question: '', options: ['', '', '', ''], answer: 0, score: null }
            : { question: '', format: 'short_text', options: ['', ''], grading: 'none', answer: null, maxScore: null };

      const draw = () => {
        const def = POS_BY_ID[pos];
        if (!f) f = blank(def.type);
        body.innerHTML = `
        <form class="qform" novalidate data-testid="question-form">
          <label class="field"><span>Pos tempat soal digunakan</span>
            <select name="pos" ${editing ? 'disabled' : ''} data-testid="q-pos">
              ${POS_DEFS.map((p, i) => `<option value="${p.id}" ${p.id === pos ? 'selected' : ''}>Pos ${i + 1} · ${esc(p.name)} (${esc(p.mechanic)})</option>`).join('')}
            </select>
            ${editing ? '<small>Pos tidak dapat diubah saat mengedit karena bentuk soal tiap pos berbeda.</small>' : ''}
          </label>
          ${def.type === 'verse_puzzle' ? verseFields(f) : def.type === 'battle_quiz' ? battleFields(f) : reflectionFields(f)}
          <ul class="issues" data-errors aria-live="polite"></ul>
          <div class="actions">
            <button type="button" class="btn btn-ghost" data-cancel>Batal</button>
            <button type="submit" class="btn btn-primary" data-testid="q-save">💾 Simpan Soal</button>
          </div>
        </form>`;
        wire(body, def.type);
      };

      const collect = (type) => {
        const form = body.querySelector('form');
        const val = (n) => form.elements[n]?.value ?? '';
        const list = (sel) => Array.from(form.querySelectorAll(sel)).map((i) => i.value);
        const score = (n) => (val(n).trim() === '' ? null : Number(val(n)));
        if (type === 'verse_puzzle')
          return { ...f, instruction: val('instruction'), reference: val('reference'), direction: val('direction'), translation: val('translation'), segments: list('[data-seg]'), score: score('score') };
        if (type === 'battle_quiz') {
          const checked = form.querySelector('input[name="answer"]:checked');
          return { ...f, question: val('question'), options: list('[data-opt]'), answer: checked ? Number(checked.value) : -1, score: score('score') };
        }
        const checked = form.querySelector('input[name="answer"]:checked');
        return {
          ...f,
          question: val('question'),
          format: val('format'),
          grading: val('grading'),
          // Bila daftar pilihan sedang tidak tampil (isian singkat), pertahankan isinya.
          options: form.querySelector('[data-opt]') ? list('[data-opt]') : f.options,
          answer: checked ? Number(checked.value) : null,
          maxScore: score('maxScore'),
        };
      };

      const wire = (root, type) => {
        const form = root.querySelector('form');
        const list = (q) => Array.from(form.querySelectorAll(q)).map((i) => i.value);
        const sync = () => (f = collect(type));
        root.querySelector('[data-cancel]').onclick = close;
        const sel = form.elements.pos;
        sel.addEventListener('change', () => {
          pos = sel.value;
          f = null;
          draw();
        });
        // ganti format/grading refleksi → gambar ulang
        ['format', 'grading', 'direction'].forEach((n) =>
          form.elements[n]?.addEventListener('change', () => {
            sync();
            if (type === 'reflection' && f.grading === 'auto' && f.format !== 'choice') f.format = 'choice';
            if (type === 'reflection' && f.format === 'choice') while (f.options.length < 2) f.options.push('');
            draw();
          })
        );
        form.addEventListener('input', (e) => {
          if (!e.target.matches('[data-seg]')) return;
          const box = form.querySelector('.preview-blocks');
          const ar = box.classList.contains('rtl');
          box.innerHTML = list('[data-seg]').filter((s) => s.trim()).map((s) => `<span class="verse-block ${ar ? 'arabic' : ''}">${esc(s)}</span>`).join('');
        });
        form.addEventListener('click', (e) => {
          const b = e.target.closest('[data-list]');
          if (!b) return;
          sync();
          const key = b.dataset.list; // segments | options
          const arr = f[key];
          const i = Number(b.dataset.i);
          const op = b.dataset.op;
          if (op === 'add') arr.push('');
          if (op === 'del') {
            arr.splice(i, 1);
            if (key === 'options' && f.answer !== null) {
              if (f.answer === i) f.answer = type === 'battle_quiz' ? 0 : null;
              else if (f.answer > i) f.answer--;
            }
          }
          if (op === 'up' || op === 'down') {
            const j = op === 'up' ? i - 1 : i + 1;
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          draw();
          root.querySelectorAll(key === 'segments' ? '[data-seg]' : '[data-opt]')[op === 'add' ? arr.length - 1 : Math.max(0, i)]?.focus();
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          sync();
          const { question: q, errors } = validateQuestion({ ...f, id: f.id || 'baru' }, type);
          const box = form.querySelector('[data-errors]');
          if (errors.length) {
            box.innerHTML = errors.map((m) => `<li class="issue err">✖ ${esc(m)}</li>`).join('');
            box.scrollIntoView({ block: 'nearest' });
            return;
          }
          if (!f.id) delete q.id;
          onSave(pos, q);
          close();
        });
      };

      function scoreField(name, value, label = 'Skor soal') {
        return `<label class="field"><span>${label}</span>
          <input type="number" min="0" step="1" name="${name}" value="${value ?? ''}" placeholder="Bawaan: ${defaultScore}" data-testid="q-score">
          <small>Kosongkan untuk memakai skor bawaan dari Peraturan (${defaultScore}).</small></label>`;
      }

      function rows(key, arr, { arabic = false, radio = null, min, max, label }) {
        return `<div class="list-edit" data-testid="list-${key}">
          ${arr
            .map(
              (v, i) => `<div class="list-row">
              ${radio !== null ? `<label class="radio-key" title="Tandai sebagai kunci jawaban"><input type="radio" name="answer" value="${i}" ${radio === i ? 'checked' : ''} aria-label="Kunci: ${label} ${i + 1}"><span>Kunci</span></label>` : `<span class="list-no">${i + 1}</span>`}
              <input type="text" class="${arabic ? 'arabic' : ''}" dir="${arabic ? 'rtl' : 'auto'}" ${key === 'segments' ? 'data-seg' : 'data-opt'} value="${esc(v)}" aria-label="${label} ${i + 1}" placeholder="${label} ${i + 1}">
              ${key === 'segments' ? `<button type="button" class="icon-btn" data-list="${key}" data-op="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">▲</button>
              <button type="button" class="icon-btn" data-list="${key}" data-op="down" data-i="${i}" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Turunkan">▼</button>` : ''}
              <button type="button" class="icon-btn danger" data-list="${key}" data-op="del" data-i="${i}" ${arr.length <= min ? 'disabled' : ''} aria-label="Hapus ${label} ${i + 1}">✕</button>
            </div>`
            )
            .join('')}
          <button type="button" class="btn btn-sm" data-list="${key}" data-op="add" ${arr.length >= max ? 'disabled' : ''} data-testid="add-${key}">＋ Tambah ${label.toLowerCase()}</button>
        </div>`;
      }

      function verseFields(q) {
        const ar = q.direction === 'rtl';
        return `
        <label class="field"><span>Petunjuk untuk siswa</span>
          <input type="text" name="instruction" value="${esc(q.instruction)}" placeholder="Susunlah potongan ayat berikut dengan urutan yang benar."></label>
        <div class="grid-2">
          <label class="field"><span>Sumber / rujukan ayat</span>
            <input type="text" name="reference" value="${esc(q.reference)}" placeholder="Contoh: QS. Nama Surah: 1–2" data-testid="q-reference"></label>
          <label class="field"><span>Arah teks</span>
            <select name="direction"><option value="rtl" ${ar ? 'selected' : ''}>Arab, kanan ke kiri (RTL)</option><option value="ltr" ${!ar ? 'selected' : ''}>Latin, kiri ke kanan (LTR)</option></select></label>
        </div>
        <div class="field"><span class="field-label">Potongan ayat, tulis sesuai URUTAN YANG BENAR</span>
          <small class="hint">Game akan mengacak urutannya untuk siswa. Salin teks dari mushaf atau sumber terverifikasi.</small>
          ${rows('segments', q.segments, { arabic: ar, min: LIMITS.minSegments, max: LIMITS.maxSegments, label: 'Potongan' })}
        </div>
        <div class="preview-blocks ${ar ? 'rtl' : ''}" aria-label="Pratinjau urutan benar">
          ${q.segments.filter((s) => s.trim()).map((s) => `<span class="verse-block ${ar ? 'arabic' : ''}">${esc(s)}</span>`).join('') || '<small class="hint">Pratinjau balok muncul di sini.</small>'}
        </div>
        <label class="field"><span>Terjemahan (opsional, tampil setelah jembatan tersambung)</span>
          <textarea name="translation" rows="2">${esc(q.translation)}</textarea></label>
        ${scoreField('score', q.score)}`;
      }

      function battleFields(q) {
        return `
        <label class="field"><span>Pertanyaan</span>
          <textarea name="question" rows="2" dir="auto" data-testid="q-question">${esc(q.question)}</textarea></label>
        <div class="field"><span class="field-label">Pilihan jawaban (tandai satu sebagai kunci)</span>
          ${rows('options', q.options, { radio: q.answer ?? -1, min: LIMITS.minOptions, max: LIMITS.maxOptions, label: 'Pilihan' })}
        </div>
        ${scoreField('score', q.score)}`;
      }

      function reflectionFields(q) {
        const choice = q.format === 'choice';
        return `
        <label class="field"><span>Pertanyaan refleksi</span>
          <textarea name="question" rows="2" dir="auto" data-testid="q-question">${esc(q.question)}</textarea></label>
        <div class="grid-2">
          <label class="field"><span>Bentuk jawaban</span>
            <select name="format" data-testid="q-format"><option value="short_text" ${!choice ? 'selected' : ''}>Isian singkat</option><option value="choice" ${choice ? 'selected' : ''}>Pilihan situasi</option></select></label>
          <label class="field"><span>Penilaian</span>
            <select name="grading" data-testid="q-grading">
              <option value="none" ${q.grading === 'none' ? 'selected' : ''}>Tidak dinilai (hanya disimpan)</option>
              <option value="manual" ${q.grading === 'manual' ? 'selected' : ''}>Dinilai manual oleh guru</option>
              <option value="auto" ${q.grading === 'auto' ? 'selected' : ''}>Otomatis dengan kunci (khusus pilihan)</option>
            </select></label>
        </div>
        ${choice ? `<div class="field"><span class="field-label">Pilihan situasi ${q.grading === 'auto' ? '(tandai kunci)' : ''}</span>
          ${rows('options', q.options, { radio: q.grading === 'auto' ? (q.answer ?? -1) : null, min: LIMITS.minOptions, max: LIMITS.maxOptions, label: 'Situasi' })}</div>` : ''}
        ${q.grading !== 'none' ? scoreField('maxScore', q.maxScore, 'Skor maksimal') : ''}`;
      }

      draw();
    },
  });
}
