// POS 1 — Jembatan Wahyu: menyusun potongan ayat yang diacak.
// Interaksi: seret-dan-lepas (mouse & sentuh), ketuk dua balok untuk menukar,
// atau keyboard (Tab ke balok, panah kiri/kanan untuk memindahkan).

import { esc } from '../../ui/ui.js';
import { checkVerse, recordAnswer, remaining, attemptsUsed, isSolved, findQuestion, seededRandom, shuffle } from '../../scoring/run.js';

/**
 * @param ctx {{panel:HTMLElement, t, run, api, say:Function, onProgress:Function, onFinish:Function, onClose:Function}}
 */
export function openVersePuzzle(ctx) {
  const { panel, t, run } = ctx;
  const ids = run.questions.pos1;
  let order = null; // susunan teks saat ini
  let current = null;
  let selected = null; // indeks balok untuk ketuk-tukar
  let locked = false;

  const solvedCount = () => ids.filter((id) => isSolved(run, id) || attemptsUsed(run, id) >= t.rules.attemptsPerQuestion).length;

  const next = () => {
    const left = remaining(run, t, 'pos1');
    if (!left.length) return ctx.onFinish();
    current = findQuestion(t, 'pos1', left[0]);
    order = scramble(current, `${run.seed}:${current.id}:${attemptsUsed(run, current.id)}`);
    selected = null;
    locked = false;
    draw();
  };

  const draw = (feedback = '') => {
    const q = current;
    const rtl = q.direction === 'rtl';
    const left = t.rules.attemptsPerQuestion - attemptsUsed(run, q.id);
    const n = ids.indexOf(q.id) + 1;
    panel.innerHTML = `
    <div class="ch ch-verse" data-testid="verse-puzzle">
      <header class="ch-head">
        <span class="ch-pill pos1">📖 Jembatan Wahyu</span>
        <span class="ch-count">Ayat ${n} dari ${ids.length}</span>
        <button class="btn btn-ghost btn-sm" data-close>🗺️ Kembali ke peta</button>
      </header>
      <div class="bridge-meter" aria-label="Progres jembatan">
        ${ids.map((id, i) => `<i class="${i < solvedCount() ? 'on' : ''}"></i>`).join('')}
        <small>Jembatan ${solvedCount()}/${ids.length}</small>
      </div>
      <p class="ch-instr">${esc(q.instruction)}</p>
      ${q.reference ? `<p class="ch-ref">${esc(q.reference)}</p>` : ''}
      <div class="verse-board ${rtl ? 'rtl' : ''}" dir="${rtl ? 'rtl' : 'ltr'}" data-board role="list" aria-label="Susunan potongan ayat">
        ${order.map((s, i) => `<button type="button" role="listitem" class="vblock ${rtl ? 'arabic' : ''} ${selected === i ? 'sel' : ''}" data-i="${i}" aria-label="Potongan ${i + 1}: ${esc(s)}" data-testid="vblock">${esc(s)}</button>`).join('')}
      </div>
      <p class="hint ch-help">Seret balok ke posisi yang benar, atau ketuk dua balok untuk menukar posisinya.${rtl ? ' Ayat dibaca dari <b>kanan ke kiri</b>.' : ''}</p>
      <div class="ch-feedback" data-feedback aria-live="assertive">${feedback}</div>
      <footer class="ch-foot">
        <span class="badge">🎯 Sisa kesempatan: <b data-left>${left}</b></span>
        <button class="btn btn-gold btn-lg" data-check ${locked ? 'hidden' : ''} data-testid="verse-check">✔ Periksa Susunan</button>
        <button class="btn btn-primary btn-lg" data-next hidden data-testid="verse-next">Lanjut ▸</button>
      </footer>
    </div>`;
    wire();
  };

  const wire = () => {
    panel.querySelector('[data-close]').onclick = ctx.onClose;
    panel.querySelector('[data-check]').onclick = check;
    panel.querySelector('[data-next]').onclick = next;
    const board = panel.querySelector('[data-board]');
    board.querySelectorAll('.vblock').forEach((b) => {
      b.addEventListener('pointerdown', (e) => startDrag(e, b, board));
      b.addEventListener('keydown', (e) => {
        if (locked) return;
        const i = Number(b.dataset.i);
        const rtl = current.direction === 'rtl';
        let j = null;
        if (e.key === 'ArrowRight') j = rtl ? i - 1 : i + 1;
        if (e.key === 'ArrowLeft') j = rtl ? i + 1 : i - 1;
        if (j === null || j < 0 || j >= order.length) return;
        e.preventDefault();
        move(i, j);
        panel.querySelector(`.vblock[data-i="${j}"]`)?.focus();
      });
    });
  };

  const move = (from, to) => {
    const [x] = order.splice(from, 1);
    order.splice(to, 0, x);
    selected = null;
    draw();
  };

  // ---- seret-dan-lepas dengan pointer events (mouse & sentuh) ----
  const startDrag = (e, block, board) => {
    if (locked) return;
    const from = Number(block.dataset.i);
    const sx = e.clientX;
    const sy = e.clientY;
    let dragging = false;
    let ghost = null;
    let target = from;
    const rects = () => Array.from(board.querySelectorAll('.vblock')).map((b) => b.getBoundingClientRect());
    const onMove = (ev) => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      if (!dragging) {
        dragging = true;
        ghost = block.cloneNode(true);
        ghost.classList.add('ghost');
        const r = block.getBoundingClientRect();
        ghost.style.width = `${r.width}px`;
        document.body.appendChild(ghost);
        block.classList.add('placeholder');
      }
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
      // tempat sisip = balok terdekat dari pointer
      let best = Infinity;
      rects().forEach((r, i) => {
        const d = Math.hypot(ev.clientX - (r.left + r.width / 2), ev.clientY - (r.top + r.height / 2));
        if (d < best) {
          best = d;
          target = i;
        }
      });
      board.querySelectorAll('.vblock').forEach((b, i) => b.classList.toggle('drop', i === target && i !== from));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      ghost?.remove();
      if (dragging) {
        if (target !== from) move(from, target);
        else draw();
        return;
      }
      // ketuk: pilih lalu tukar
      if (selected === null) {
        selected = from;
        draw();
        panel.querySelector(`.vblock[data-i="${from}"]`)?.focus();
      } else if (selected === from) {
        selected = null;
        draw();
      } else {
        [order[selected], order[from]] = [order[from], order[selected]];
        selected = null;
        draw();
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const check = () => {
    if (locked) return;
    const correct = checkVerse(current, order);
    let entry;
    try {
      entry = recordAnswer(run, t, 'pos1', current.id, { response: [...order], correct });
    } catch (e) {
      return ctx.say(e.message);
    }
    ctx.onAnswer?.(entry);
    const left = t.rules.attemptsPerQuestion - attemptsUsed(run, current.id);
    if (correct) {
      locked = true;
      ctx.api.lumi('happy');
      ctx.api.playAnim('victory');
      ctx.onProgress(solvedCount() / ids.length);
      draw(`<div class="fb ok">✨ Masya Allah, susunan benar! +${entry.points} poin. Batu jembatan bertambah.
        ${current.translation ? `<p class="translation">“${esc(current.translation)}”</p>` : ''}</div>`);
      markBoard('ok');
    } else if (left > 0) {
      ctx.api.lumi('sad');
      draw(`<div class="fb bad">Belum tepat. Coba periksa lagi urutannya. ${t.rules.wrongPenalty ? `(−${t.rules.wrongPenalty} poin)` : ''}</div>`);
      panel.querySelector('[data-board]').classList.add('shake');
    } else {
      // kesempatan habis: tampilkan susunan benar sebagai pembelajaran, nilai 0
      locked = true;
      order = [...current.segments];
      ctx.api.lumi('sad');
      ctx.onProgress(solvedCount() / ids.length);
      draw(`<div class="fb info">Kesempatan habis, ayat ini bernilai 0. Perhatikan susunan yang benar di atas, lalu lanjutkan.</div>`);
      markBoard('reveal');
    }
  };

  const markBoard = (cls) => {
    panel.querySelector('[data-check]').hidden = true;
    panel.querySelector('[data-next]').hidden = false;
    panel.querySelector('[data-next]').focus();
    panel.querySelectorAll('.vblock').forEach((b) => {
      b.classList.add(cls);
      b.disabled = true;
    });
  };

  next();
}

/** Acak susunan, dan pastikan tidak sama dengan urutan benar. */
export function scramble(q, seed) {
  const rand = seededRandom(seed);
  let out = shuffle(q.segments, rand);
  for (let k = 0; k < 6 && checkVerse(q, out); k++) out = shuffle(q.segments, rand);
  if (checkVerse(q, out)) out = [...q.segments].reverse();
  return out;
}
