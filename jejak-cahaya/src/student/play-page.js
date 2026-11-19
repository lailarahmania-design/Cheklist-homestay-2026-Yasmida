// Halaman bermain. Tahap 2: "Uji Coba Main" dari editor guru (sebelum multiplayer Tahap 4).
// Alur: pilih kelompok & karakter → dunia isometrik → jelajah, Lumi memandu, pos dapat didekati.

import { getAdapter } from '../data/adapter.js';
import { navigate, setLeaveGuard } from '../core/router.js';
import { CHARACTERS, CHARACTER_BY_ID, POS_DEFS, POS_BY_ID } from '../core/constants.js';
import { characterSVG, lumiSVG } from '../ui/characters.js';
import { esc, toast } from '../ui/ui.js';
import { checkTemplate } from '../config/template-model.js';
import { QuestState } from '../game/systems/quest.js';
import { createRun, startPos, finishPos, finishRun, totals, formatDuration } from '../scoring/run.js';
import { toJSON, toCSV, resultFileName } from '../results/result-report.js';
import { resultSheetHTML } from '../results/result-sheet.js';
import { openVersePuzzle } from './challenges/verse-puzzle.js';
import { openBattleQuiz } from './challenges/battle-quiz.js';
import { openReflection } from './challenges/reflection.js';
import { confirmDialog, downloadJSON, downloadText, canPrint } from '../ui/ui.js';
import { touchInput } from '../game/systems/input.js';

/**
 * @param mode 'test' = Uji Coba dari editor guru (ada panel uji); 'student' = Mode Siswa di perangkat ini.
 */
export async function renderPlay(root, { id, mode = 'test' }) {
  const t = await getAdapter().getTemplate(id);
  if (!t) {
    toast('Konfigurasi tidak ditemukan.', 'error');
    navigate('/guru');
    return;
  }
  if (mode === 'student' && !checkTemplate(t).ready) {
    toast('Ujian ini belum lengkap. Minta guru melengkapinya di Mode Guru.', 'error');
    navigate('/main');
    return;
  }
  renderSetup(root, t, mode);
}

// ---------------- 1. pilih kelompok & karakter ----------------
function renderSetup(root, t, mode) {
  const backHref = mode === 'student' ? '#/main' : `#/guru/edit/${esc(t.id)}/identitas`;
  let groupId = t.groups[0]?.id;
  let charId = t.groups[0]?.character;
  const allowPick = t.settings.allowCharacterSelect;

  const draw = () => {
    const group = t.groups.find((g) => g.id === groupId);
    if (!allowPick) charId = group.character;
    root.innerHTML = `
    <div class="setup">
      <header class="setup-head">
        <a class="btn btn-ghost btn-sm" href="${backHref}">← ${mode === 'student' ? 'Pilih ujian lain' : 'Kembali ke editor'}</a>
        ${mode === 'student' ? '<span class="badge badge-water">🎒 Mode Siswa · perangkat ini</span>' : '<span class="badge badge-warn">🧪 Uji Coba Guru</span>'}
      </header>
      <div class="setup-title">
        ${lumiSVG({ size: 72 })}
        <div><h1>${esc(t.identity.title)}</h1>
        <p class="hint">${[t.identity.subject, t.identity.chapter, t.identity.className].filter(Boolean).map(esc).join(' · ')}</p></div>
      </div>
      ${t.identity.description ? `<p class="panel setup-desc">${esc(t.identity.description)}</p>` : ''}

      <section class="panel setup-block">
        <h2>1. Pilih kelompok</h2>
        <div class="group-pick" role="radiogroup" aria-label="Kelompok">
          ${t.groups.map((g) => `<button type="button" role="radio" aria-checked="${g.id === groupId}" class="group-chip ${g.id === groupId ? 'on' : ''}" data-group="${esc(g.id)}" data-testid="pick-group">
            ${characterSVG(allowPick ? g.character : g.character, { size: 34 })}<span>${esc(g.name)}</span></button>`).join('')}
        </div>
      </section>

      <section class="panel setup-block">
        <h2>2. ${allowPick ? 'Pilih karakter penjelajah' : 'Karakter kelompok'}</h2>
        ${allowPick ? '' : '<p class="hint">Guru telah menentukan karakter untuk setiap kelompok.</p>'}
        <div class="char-cards" role="radiogroup" aria-label="Karakter">
          ${CHARACTERS.filter((c) => allowPick || c.id === charId).map((c) => `<button type="button" role="radio" aria-checked="${c.id === charId}" class="char-card ${c.id === charId ? 'on' : ''}" data-char="${c.id}" ${allowPick ? '' : 'disabled'} data-testid="pick-char">
            ${characterSVG(c.id, { size: 96, title: c.name })}<b>${esc(c.name)}</b><small>${esc(c.desc)}</small></button>`).join('')}
        </div>
      </section>

      <div class="setup-go">
        <button class="btn btn-gold btn-lg" data-start data-testid="start-adventure">✨ Mulai Petualangan</button>
      </div>
    </div>`;

    root.querySelectorAll('[data-group]').forEach((b) => (b.onclick = () => {
      groupId = b.dataset.group;
      if (allowPick) charId = t.groups.find((g) => g.id === groupId).character;
      draw();
    }));
    root.querySelectorAll('[data-char]').forEach((b) => (b.onclick = () => {
      charId = b.dataset.char;
      draw();
    }));
    root.querySelector('[data-start]').onclick = () => startPlay(root, t, t.groups.find((g) => g.id === groupId), charId, mode);
  };
  draw();
}

// ---------------- 2. bermain ----------------
async function startPlay(root, t, group, charId, mode = 'test') {
  const exitPath = mode === 'student' ? '/main' : `/guru/edit/${t.id}/identitas`;
  const char = CHARACTER_BY_ID[charId];
  root.innerHTML = `
  <div class="play" data-testid="play">
    <div class="sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="game-host" id="game-host"></div>
    <div class="loading" data-loading>${lumiSVG({ size: 80 })}<p>Menyiapkan dunia petualangan…</p></div>

    <div class="hud hud-left">
      <div class="hud-card">
        ${characterSVG(charId, { size: 38 })}
        <div><b>${esc(group.name)}</b><small data-region>—</small></div>
      </div>
      <div class="hud-stats">
        <span class="hud-chip" data-score data-testid="hud-score">⭐ 0</span>
        <span class="hud-chip" data-timer data-testid="hud-timer">⏳ --:--</span>
      </div>
    </div>
    <div class="hud hud-right">
      <ol class="quest-track" data-quest aria-label="Progres misi"></ol>
      <div class="hud-buttons">
        <button class="icon-btn hud-btn" data-act="map" title="Peta penuh (M)" aria-label="Peta penuh" data-testid="btn-map">🗺️</button>
        <button class="icon-btn hud-btn" data-act="help" title="Bantuan kontrol" aria-label="Bantuan" data-testid="btn-help">❔</button>
        ${mode === 'test' ? '<button class="icon-btn hud-btn" data-act="test" title="Panel uji guru" aria-label="Panel uji guru" data-testid="btn-test">🧪</button>' : ''}
        <button class="icon-btn hud-btn" data-act="exit" title="Keluar" aria-label="Keluar" data-testid="btn-exit">✕</button>
      </div>
    </div>

    <div class="region-banner" data-banner aria-live="polite"></div>

    <div class="test-panel panel" data-test-panel hidden data-testid="test-panel">
      <h3>Panel Uji Guru</h3>
      <label class="check"><input type="checkbox" data-free data-testid="free-explore"><span>Jelajah bebas (abaikan gerbang & golem)</span></label>
      <p class="field-label">Lewati pos (tanpa nilai)</p>
      <div class="test-row">${POS_DEFS.map((p, i) => `<button class="btn btn-sm" data-complete="${p.id}" data-testid="complete-${p.id}">Pos ${i + 1}</button>`).join('')}</div>
      <p class="field-label">Uji animasi</p>
      <div class="test-row">${[['jump', 'Lompat'], ['interact', 'Interaksi'], ['victory', 'Menang'], ['defeat', 'Kalah']].map(([a, l]) => `<button class="btn btn-sm" data-anim="${a}" data-testid="anim-${a}">${l}</button>`).join('')}</div>
      <p class="hint">Diam, berjalan, dan berlari terlihat saat karakter digerakkan (Shift / joystick ditarik penuh untuk berlari).</p>
    </div>

    <div class="touch-controls" data-touch>
      <div class="joystick" data-joy aria-label="Joystick arah"><div class="joy-knob" data-knob></div></div>
      <div class="touch-buttons">
        <button class="touch-btn jump" data-touch-act="jump" aria-label="Lompat">⤒</button>
        <button class="touch-btn act" data-touch-act="interact" aria-label="Interaksi" data-testid="touch-interact">✋</button>
      </div>
    </div>

    <div class="challenge-layer" data-challenge hidden><div class="challenge panel" data-ch-panel></div></div>
    <div class="result-layer" data-result hidden></div>

    <div class="lumi-dialog panel" data-dialog hidden role="dialog" aria-live="polite" data-testid="lumi-dialog">
      <div class="lumi-face">${lumiSVG({ size: 64 })}</div>
      <div class="lumi-text"><b>Lumi</b><p data-dialog-text></p></div>
      <div class="lumi-actions" data-dialog-actions></div>
    </div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const quest = new QuestState();
  const run = createRun(t, { groupId: group.id, groupName: group.name, character: charId });
  let api = null;
  let destroyed = false;
  let openPos = null; // pos yang tantangannya sedang terbuka
    window.__run = run; // dipakai uji otomatis

  // ----- dialog Lumi (antrian) -----
  const dialogQueue = [];
  let dialogOpen = false;
  const showDialog = (text, actions = [{ label: 'Lanjut ▸', primary: true }]) => {
    dialogQueue.push({ text, actions });
    if (!dialogOpen) nextDialog();
  };
  const nextDialog = () => {
    const d = dialogQueue.shift();
    const box = $('[data-dialog]');
    if (!d) {
      box.hidden = true;
      dialogOpen = false;
      api?.setPaused(!!openPos); // tetap berhenti bila tantangan sedang terbuka
      return;
    }
    dialogOpen = true;
    api?.setPaused(true);
    box.hidden = false;
    $('[data-dialog-text]').innerHTML = d.text;
    const acts = $('[data-dialog-actions]');
    acts.innerHTML = d.actions.map((a, i) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'} btn-sm" data-i="${i}" data-testid="dialog-btn">${a.label}</button>`).join('');
    acts.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      d.actions[Number(b.dataset.i)].onClick?.();
      nextDialog();
    }));
    acts.querySelector('button')?.focus();
  };
  const onDialogKey = (e) => {
    if (dialogOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && document.activeElement?.closest?.('[data-dialog]') == null) {
      e.preventDefault();
      nextDialog();
    }
  };
  document.addEventListener('keydown', onDialogKey);

  // ----- progres misi -----
  const STATUS = { locked: ['🔒', 'Terkunci'], active: ['✨', 'Sedang dituju'], done: ['✅', 'Selesai'] };
  const drawQuest = () => {
    $('[data-quest]').innerHTML = POS_DEFS.map((p, i) => {
      const st = run.pos[p.id].status;
      const [ic, label] = STATUS[st];
      return `<li class="qt ${st}" title="${esc(p.name)}: ${label}"><span aria-hidden="true">${p.icon}</span><b>Pos ${i + 1}</b><span class="qt-st" aria-label="${label}">${ic}</span></li>`;
    }).join('');
  };
  quest.on(drawQuest);
  drawQuest();

  // ----- interaksi pos & tantangan -----
  const adapter = getAdapter();
  const saveResult = async () => {
    try {
      await adapter.saveResult(toJSON(run, t));
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const updateScore = () => {
    $('[data-score]').textContent = `⭐ ${totals(run, t).score}`;
  };

  const posMessage = (posId) => {
    const p = POS_BY_ID[posId];
    const st = run.pos[posId].status;
    const count = run.questions[posId].length;
    if (st === 'done') return showDialog(`<b>${esc(p.name)}</b> sudah kalian taklukkan. Ayo lanjutkan perjalanan!`);
    if (st === 'locked') return showDialog('Pos ini masih tertutup. Selesaikan pos sebelumnya terlebih dahulu.');
    if (run.pos[posId].startedAt) return openChallenge(posId); // lanjutkan
    const mins = t.timing[`${posId}Minutes`];
    const intro = {
      pos1: `Ini <b>Jembatan Wahyu</b>. Jembatannya terputus! Susun <b>${count} ayat</b> dengan urutan yang benar. Setiap ayat yang benar menyambungkan batu-batu jembatan.`,
      pos2: `Hati-hati! Golem batu penjaga <b>Lembah Kaum Tsamud</b>, lambang kesombongan, menghadang. Jawab <b>${count} soal</b> untuk menguras energinya. Jawaban salah akan dibalas seranganya. Jaga <b>${t.rules.teamHearts} nyawa</b> kelompok kalian!`,
      pos3: `Selamat datang di <b>Taman Cahaya</b>. Prasasti ini menyimpan <b>${count} pertanyaan refleksi</b>. Jawablah bersama kelompok dengan jujur.`,
    }[posId].replace('seranganya', 'serangannya');
    showDialog(`${intro}<br><small class="hint">⏳ Waktu pos ini ${mins} menit, dimulai saat tantangan dibuka.</small>`, [
      { label: '▶ Mulai tantangan', primary: true, onClick: () => setTimeout(() => openChallenge(posId), 0) },
      { label: 'Nanti saja' },
    ]);
  };

  const closeChallenge = () => {
    $('[data-challenge]').hidden = true;
    $('[data-ch-panel]').innerHTML = '';
    openPos = null;
    api?.setPaused(false);
    root.querySelector('.play').classList.remove('in-challenge');
  };

  const openChallenge = (posId) => {
    if (run.pos[posId].status !== 'active' || run.finished) return;
    startPos(run, posId);
    openPos = posId;
    api?.setPaused(true);
    root.querySelector('.play').classList.add('in-challenge');
    $('[data-challenge]').hidden = false;
    $('[data-challenge]').dataset.pos = posId;
    const ctx = {
      panel: $('[data-ch-panel]'),
      t,
      run,
      api,
      alive: () => openPos === posId,
      say: (m) => toast(m, 'error'),
      onAnswer: () => {
        updateScore();
        saveResult();
      },
      onProgress: (f) => api?.setBridgeProgress(f),
      onClose: closeChallenge,
      onFinish: (info = {}) => completePos(posId, { ...info }),
    };
    if (posId === 'pos1') openVersePuzzle(ctx);
    if (posId === 'pos2') openBattleQuiz(ctx);
    if (posId === 'pos3') openReflection(ctx);
  };

  const completePos = (posId, { timeout = false, defeated = true, skipped = false } = {}) => {
    if (run.pos[posId].status === 'done') return;
    if (openPos === posId) closeChallenge();
    finishPos(run, t, posId, { timeout: timeout || skipped });
    quest.complete(posId);
    drawQuest();
    updateScore();
    saveResult();
    if (timeout) {
      api?.lumi('sad');
      showDialog(`⏰ Waktu <b>${esc(POS_BY_ID[posId].name)}</b> habis. Soal yang belum dijawab bernilai 0, tetapi jalan tetap terbuka. Ayo lanjutkan!`);
    } else {
      api?.lumi('happy');
      api?.playAnim('victory');
      const msg = {
        pos1: `Jembatan tersambung! ${skipped ? '' : `Bonus penyelesaian +${t.rules.completionBonus}. `}Cahaya membuka jalan menuju lembah.`,
        pos2: defeated ? 'Golem kalah dan menyingkir! Kesombongan tidak bisa menghalangi ilmu. Jalan menuju Taman Cahaya terbuka.' : 'Golem kelelahan dan menyingkir. Jalan menuju Taman Cahaya terbuka.',
        pos3: 'Refleksi tersimpan. Kalian kini bergelar <b>Penjelajah Cahaya</b>! ✨',
      }[posId];
      showDialog(msg);
    }
    if (posId === 'pos3') showDialog('Mari kita lihat hasil perjalanan kalian.', [{ label: '🏆 Lihat Hasil', primary: true, onClick: () => showResult() }]);
  };

  const endByTime = () => {
    if (openPos) closeChallenge();
    finishRun(run);
    saveResult();
    showDialog('⏰ Waktu total permainan sudah habis. Perjalanan berhenti di sini.', [{ label: '🏆 Lihat Hasil', primary: true, onClick: () => showResult() }]);
  };

  // ----- timer (Tahap 4: mengacu ke jam server) -----
  const timerEl = $('[data-timer]');
  const tick = () => {
    if (destroyed || run.finished) return;
    const now = Date.now();
    const totalLeft = Math.ceil((run.startedAt + t.timing.totalMinutes * 60000 - now) / 1000);
    const active = POS_DEFS.find((p) => run.pos[p.id].status === 'active' && run.pos[p.id].startedAt);
    let posLeft = null;
    if (active) {
      posLeft = Math.ceil((run.pos[active.id].startedAt + t.timing[`${active.id}Minutes`] * 60000 - now) / 1000);
      if (posLeft <= 0) return completePos(active.id, { timeout: true });
    }
    if (totalLeft <= 0) return endByTime();
    const shown = posLeft ?? totalLeft;
    timerEl.textContent = `⏳ ${active ? `Pos ${POS_DEFS.indexOf(active) + 1}` : 'Total'} ${formatDuration(Math.max(0, shown))}`;
    timerEl.classList.toggle('low', shown <= 60);
  };
  const timerId = setInterval(tick, 500);

  // ----- layar hasil -----
  const showResult = () => {
    if (!run.finished) finishRun(run);
    saveResult();
    const data = toJSON(run, t);
    const layer = $('[data-result]');
    layer.hidden = false;
    layer.innerHTML = `
      <div class="result-wrap">
        <div class="confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
        ${resultSheetHTML(data)}
        <div class="result-actions no-print">
          <button class="btn btn-primary" data-dl="csv" data-testid="dl-csv">⬇️ Unduh CSV (Excel)</button>
          <button class="btn" data-dl="json" data-testid="dl-json">⬇️ Unduh JSON</button>
          ${canPrint() ? '<button class="btn btn-gold" data-dl="print">🖨️ Cetak / Simpan PDF</button>' : ''}
          <button class="btn btn-ghost" data-dl="close">🗺️ Kembali ke peta</button>
        </div>
        <p class="hint no-print">Hasil juga tersimpan di perangkat ini dan dapat diunduh ulang dari Dashboard Guru → Hasil Tersimpan.</p>
      </div>`;
    layer.querySelector('[data-dl="csv"]').onclick = () => downloadText(resultFileName(run, 'csv'), toCSV(run, t), 'text/csv;charset=utf-8');
    layer.querySelector('[data-dl="json"]').onclick = () => downloadJSON(resultFileName(run, 'json'), toJSON(run, t));
    layer.querySelector('[data-dl="print"]')?.addEventListener('click', () => window.print());
    layer.querySelector('[data-dl="close"]').onclick = () => (layer.hidden = true);
  };

  const hooks = {
    onReady() {
      $('[data-loading]').remove();
      showDialog(`Assalamu'alaikum, <b>${esc(group.name)}</b>! Aku Lumi, kunang-kunang pemandu kalian. Hari ini kita menempuh ujian <b>${esc(t.identity.title)}</b>.`);
      showDialog('Ada tiga pos: <b>Jembatan Wahyu</b>, <b>Lembah Kaum Tsamud</b>, dan <b>Taman Cahaya</b>. Ikuti batu pijakan keemasan, ya!');
      showDialog(isTouch()
        ? 'Geser <b>joystick</b> untuk berjalan (tarik penuh untuk berlari). Tekan <b>✋</b> untuk berinteraksi dan <b>⤒</b> untuk melompat.'
        : 'Gerak: <b>WASD</b> atau <b>tombol panah</b> · Lari: tahan <b>Shift</b> · Lompat: <b>Spasi</b> · Interaksi: <b>E</b> · Peta: <b>M</b>.');
    },
    onRegion(region) {
      $('[data-region]').textContent = region.name;
      const b = $('[data-banner]');
      b.textContent = region.name;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
    },
    onNear() {},
    onInteract(target) {
      if (openPos || dialogOpen) return;
      if (target === 'sign') return showDialog('Titik awal petualangan. Ikuti jalan keemasan menuju gerbang bercahaya di tepi sungai!');
      posMessage(target);
    },
    onOverview(on) {
      $('[data-act="map"]').classList.toggle('on', on);
    },
  };

  // ----- tombol HUD -----
  root.querySelector('.hud-right').onclick = async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'map') hooks.onOverview(api?.toggleOverview());
    if (act === 'test') $('[data-test-panel]').hidden = !$('[data-test-panel]').hidden;
    if (act === 'exit') {
      if (!run.finished) {
        const ok = await confirmDialog({
          title: 'Keluar dari permainan?',
          message: 'Hasil sementara kelompok ini akan disimpan di perangkat dan dapat diunduh dari Dashboard Guru → Hasil Tersimpan.',
          okText: 'Simpan & keluar',
        });
        if (!ok) return;
        await saveResult();
      }
      navigate(exitPath);
    }
  };
  root.querySelector('[data-act="help"]').onclick = (e) => {
    e.stopPropagation();
    showDialog(isTouch()
      ? 'Joystick = berjalan (tarik penuh untuk berlari) · ✋ = interaksi · ⤒ = lompat · 🗺️ = peta penuh.'
      : 'WASD / panah = berjalan · Shift = berlari · Spasi = lompat · E = interaksi · M = peta penuh.');
  };
  const panel = $('[data-test-panel]');
  panel.querySelector('[data-free]').onchange = (e) => api?.setFreeExplore(e.target.checked);
  panel.querySelectorAll('[data-complete]').forEach((b) => (b.onclick = () => {
    const id = b.dataset.complete;
    if (run.pos[id].status !== 'active') return toast('Pos ini belum terbuka atau sudah selesai.', 'error');
    completePos(id, { skipped: true });
  }));
  panel.querySelectorAll('[data-anim]').forEach((b) => (b.onclick = () => {
    api?.playAnim(b.dataset.anim);
    if (b.dataset.anim === 'defeat') api?.lumi('sad');
    if (b.dataset.anim === 'victory') api?.lumi('happy');
  }));

  setupTouch(root);

  // ----- muat game (Phaser dimuat terpisah) -----
  setLeaveGuard(async () => {
    destroyed = true;
    clearInterval(timerId);
    document.removeEventListener('keydown', onDialogKey);
    api?.destroy();
    return true;
  });
  const showLoadError = (detail) => {
    const box = $('[data-loading]');
    if (!box) return;
    box.innerHTML = `${lumiSVG({ size: 80, mood: 'sad' })}
      <p>Dunia petualangan belum bisa dimuat di perangkat ini.</p>
      <p class="hint">${esc(detail)}</p>
      <p class="hint">Coba muat ulang, atau buka dengan Chrome/Edge versi terbaru.</p>
      <a class="btn btn-primary" href="#${exitPath}">← Kembali</a>`;
  };
  try {
    const { startGame } = await import('../game/index.js');
    if (destroyed) return;
    api = startGame($('#game-host'), { characterId: char.id, quest, hooks });
    window.__jc = api; // dipakai uji otomatis
    setTimeout(() => {
      if (!destroyed && $('[data-loading]')) showLoadError('Waktu memuat lebih dari 20 detik (WebGL/Canvas mungkin diblokir).');
    }, 20000);
  } catch (err) {
    console.error(err);
    showLoadError(err?.message || String(err));
  }
}

function isTouch() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function setupTouch(root) {
  const joy = root.querySelector('[data-joy]');
  const knob = root.querySelector('[data-knob]');
  const R = 46;
  let active = null;
  const move = (e) => {
    if (active !== e.pointerId) return;
    const r = joy.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    touchInput.x = dx / R;
    touchInput.y = dy / R;
    touchInput.run = d / R > 0.9;
  };
  const end = (e) => {
    if (active !== e.pointerId) return;
    active = null;
    knob.style.transform = '';
    touchInput.x = touchInput.y = 0;
    touchInput.run = false;
  };
  joy.addEventListener('pointerdown', (e) => {
    active = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    move(e);
  });
  joy.addEventListener('pointermove', move);
  joy.addEventListener('pointerup', end);
  joy.addEventListener('pointercancel', end);
  root.querySelectorAll('[data-touch-act]').forEach((b) =>
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchInput.actions.push(b.dataset.touchAct);
    })
  );
}
