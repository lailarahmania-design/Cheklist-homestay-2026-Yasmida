// POS 3 — Taman Cahaya: refleksi pembelajaran, satu pertanyaan per layar.
// Jawaban disimpan sebagai bagian hasil kelompok; penilaian mengikuti pengaturan per soal.

import { esc } from '../../ui/ui.js';
import { recordAnswer, findQuestion } from '../../scoring/run.js';

export function openReflection(ctx) {
  const { panel, t, run } = ctx;
  const ids = run.questions.pos3;
  const answered = (id) => run.answers.some((a) => a.questionId === id);
  const skipped = new Set();

  const next = () => {
    const id = ids.find((x) => !answered(x) && !skipped.has(x));
    if (!id) return ctx.onFinish();
    draw(findQuestion(t, 'pos3', id));
  };

  const draw = (q) => {
    const i = ids.indexOf(q.id);
    const choice = q.format === 'choice';
    const min = t.rules.reflectionMinChars;
    panel.innerHTML = `
    <div class="ch ch-reflect" data-testid="reflection">
      <header class="ch-head">
        <span class="ch-pill pos3">🌿 Prasasti Taman Cahaya</span>
        <span class="ch-count">Refleksi ${i + 1} dari ${ids.length}</span>
        <button class="btn btn-ghost btn-sm" data-close>🗺️ Kembali ke peta</button>
      </header>
      <ol class="reflect-dots" aria-hidden="true">${ids.map((x, k) => `<li class="${answered(x) ? 'done' : k === i ? 'now' : ''}"></li>`).join('')}</ol>
      <div class="scroll-paper">
        <p class="reflect-q" dir="auto" data-testid="reflect-question">${esc(q.question)}</p>
        ${choice
          ? `<div class="reflect-choices" role="radiogroup">${q.options.map((o, k) => `<label class="reflect-choice"><input type="radio" name="rc" value="${k}"><span dir="auto">${esc(o)}</span></label>`).join('')}</div>`
          : `<textarea class="reflect-text" rows="4" dir="auto" maxlength="1000" placeholder="Tuliskan jawaban kelompok kalian dengan jujur…" data-testid="reflect-text"></textarea>
             <small class="hint" data-chars>Minimal ${min} karakter.</small>`}
      </div>
      <div class="ch-feedback" aria-live="assertive"></div>
      <footer class="ch-foot">
        ${t.rules.reflectionRequireAll ? '<span class="hint">Semua pertanyaan wajib dijawab.</span>' : '<button class="btn btn-ghost" data-skip>Lewati</button>'}
        <button class="btn btn-primary btn-lg" data-save data-testid="reflect-save">💾 Simpan & Lanjut</button>
      </footer>
    </div>`;
    panel.querySelector('[data-close]').onclick = ctx.onClose;
    const ta = panel.querySelector('textarea');
    if (ta) {
      ta.addEventListener('input', () => {
        const n = ta.value.trim().length;
        panel.querySelector('[data-chars]').textContent = n >= min ? `✔ ${n} karakter` : `${n}/${min} karakter`;
      });
      ta.focus();
    }
    panel.querySelector('[data-skip]')?.addEventListener('click', () => {
      skipped.add(q.id);
      next();
    });
    panel.querySelector('[data-save]').onclick = () => {
      const fb = panel.querySelector('.ch-feedback');
      let response;
      if (choice) {
        const c = panel.querySelector('input[name="rc"]:checked');
        if (!c) return (fb.innerHTML = '<div class="fb bad">Pilih salah satu situasi terlebih dahulu.</div>');
        response = Number(c.value);
      } else {
        response = ta.value.trim();
        if (response.length < min) return (fb.innerHTML = `<div class="fb bad">Jawaban masih terlalu singkat (minimal ${min} karakter).</div>`);
      }
      try {
        const entry = recordAnswer(run, t, 'pos3', q.id, { response, correct: q.grading === 'auto' ? response === q.answer : null });
        ctx.onAnswer?.(entry);
      } catch (e) {
        return ctx.say(e.message);
      }
      ctx.api.lumi('happy');
      next();
    };
  };

  next();
}
