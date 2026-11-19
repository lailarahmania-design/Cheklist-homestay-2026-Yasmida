// POS 2 — Lembah Kaum Tsamud: Battle Quiz melawan golem batu (lambang kesombongan).
// Benar → energi golem berkurang. Salah → golem menyerang balik (nyawa −1), kunci TIDAK ditampilkan.
// Nyawa habis → terpental, nyawa pulih, lanjut dengan soal yang belum terjawab benar.

import { esc } from '../../ui/ui.js';
import { recordAnswer, remaining, attemptsUsed, isSolved, findQuestion, loseHeart, seededRandom, shuffle } from '../../scoring/run.js';

export function openBattleQuiz(ctx) {
  const { panel, t, run } = ctx;
  const ids = run.questions.pos2;
  // antrian: soal yang belum benar & masih punya kesempatan; soal salah pindah ke belakang
  let queue = remaining(run, t, 'pos2');
  let busy = false;

  const energy = () => ids.filter((id) => !isSolved(run, id)).length;

  const next = () => {
    queue = queue.filter((id) => remaining(run, t, 'pos2').includes(id));
    if (!queue.length) return ctx.onFinish({ defeated: energy() === 0 });
    draw(findQuestion(t, 'pos2', queue[0]));
  };

  const draw = (q, feedback = '') => {
    // urutan pilihan diacak per soal & percobaan bila diatur guru; dipetakan kembali ke indeks asli
    const idx = q.options.map((_, i) => i);
    const opts = t.rules.shuffleOptions ? shuffle(idx, seededRandom(`${run.seed}:${q.id}:${attemptsUsed(run, q.id)}`)) : idx;
    const hp = energy();
    panel.innerHTML = `
    <div class="ch ch-battle" data-testid="battle-quiz">
      <div class="battle-bars">
        <div class="hp golem" aria-label="Energi golem ${hp} dari ${ids.length}">
          <span>🗿 Golem Penjaga</span>
          <div class="hp-track"><div class="hp-fill" style="width:${(hp / ids.length) * 100}%"></div></div>
          <b data-testid="golem-hp">${hp}/${ids.length}</b>
        </div>
        <div class="hearts" aria-label="Nyawa kelompok ${run.hearts}" data-testid="hearts">
          ${Array.from({ length: t.rules.teamHearts }, (_, i) => `<span class="${i < run.hearts ? 'on' : ''}">❤</span>`).join('')}
        </div>
      </div>
      <div class="battle-card">
        <header class="ch-head">
          <span class="ch-pill pos2">⚔️ Battle Quiz</span>
          <span class="ch-count">Soal ${ids.indexOf(q.id) + 1} dari ${ids.length} · kesempatan ${t.rules.attemptsPerQuestion - attemptsUsed(run, q.id)}</span>
          <button class="btn btn-ghost btn-sm" data-close>🗺️ Mundur ke peta</button>
        </header>
        <p class="battle-q" dir="auto" data-testid="battle-question">${esc(q.question)}</p>
        <div class="battle-opts">
          ${opts.map((oi, k) => `<button class="opt-btn" data-o="${oi}" data-testid="battle-opt"><span>${String.fromCharCode(65 + k)}</span><b dir="auto">${esc(q.options[oi])}</b></button>`).join('')}
        </div>
        <div class="ch-feedback" aria-live="assertive">${feedback}</div>
      </div>
    </div>`;
    panel.querySelector('[data-close]').onclick = ctx.onClose;
    panel.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => answer(q, Number(b.dataset.o), b)));
  };

  const answer = (q, oi, btn) => {
    if (busy) return;
    busy = true;
    const correct = oi === q.answer;
    let entry;
    try {
      entry = recordAnswer(run, t, 'pos2', q.id, { response: oi, correct });
    } catch (e) {
      busy = false;
      return ctx.say(e.message);
    }
    ctx.onAnswer?.(entry);
    panel.querySelectorAll('[data-o]').forEach((b) => (b.disabled = true));
    const fb = panel.querySelector('.ch-feedback');
    if (correct) {
      btn.classList.add('ok');
      ctx.api.golemHit();
      ctx.api.lumi('happy');
      fb.innerHTML = `<div class="fb ok">💥 Serangan berhasil! Energi golem berkurang. +${entry.points} poin</div>`;
      const hp = energy();
      panel.querySelector('.hp-fill').style.width = `${(hp / ids.length) * 100}%`;
      panel.querySelector('[data-testid="golem-hp"]').textContent = `${hp}/${ids.length}`;
      queue.shift();
    } else {
      btn.classList.add('bad');
      const r = loseHeart(run, t);
      ctx.api.golemAttack(r.knockedOut);
      fb.innerHTML = r.knockedOut
        ? `<div class="fb bad">💫 Belum tepat! Golem menyerang dan kalian terpental. Nyawa dipulihkan, ayo bangkit dan coba lagi!</div>`
        : `<div class="fb bad">🪨 Belum tepat! Golem menyerang balik, nyawa berkurang.${t.rules.wrongPenalty ? ` (−${t.rules.wrongPenalty} poin)` : ''}</div>`;
      // soal dipindah ke belakang antrian (jika kesempatan masih ada)
      queue.push(queue.shift());
      panel.querySelectorAll('.hearts span').forEach((s, i) => s.classList.toggle('on', i < run.hearts));
    }
    setTimeout(() => {
      busy = false;
      if (ctx.alive && !ctx.alive()) return; // tantangan sudah ditutup (mundur / waktu habis)
      next();
    }, correct ? 1100 : 1700);
  };

  next();
}
