// Halaman bermain. Tahap 2: "Uji Coba Main" dari editor guru (sebelum multiplayer Tahap 4).
// Alur: pilih kelompok & karakter → dunia isometrik → jelajah, Lumi memandu, pos dapat didekati.

import { getAdapter } from '../data/adapter.js';
import { navigate, setLeaveGuard } from '../core/router.js';
import { CHARACTERS, CHARACTER_BY_ID, POS_DEFS, POS_BY_ID } from '../core/constants.js';
import { characterSVG, lumiSVG } from '../ui/characters.js';
import { esc, toast } from '../ui/ui.js';
import { QuestState } from '../game/systems/quest.js';
import { touchInput } from '../game/systems/input.js';

export async function renderPlay(root, { id }) {
  const t = await getAdapter().getTemplate(id);
  if (!t) {
    toast('Konfigurasi tidak ditemukan.', 'error');
    navigate('/guru');
    return;
  }
  renderSetup(root, t);
}

// ---------------- 1. pilih kelompok & karakter ----------------
function renderSetup(root, t) {
  let groupId = t.groups[0]?.id;
  let charId = t.groups[0]?.character;
  const allowPick = t.settings.allowCharacterSelect;

  const draw = () => {
    const group = t.groups.find((g) => g.id === groupId);
    if (!allowPick) charId = group.character;
    root.innerHTML = `
    <div class="setup">
      <header class="setup-head">
        <a class="btn btn-ghost btn-sm" href="#/guru/edit/${esc(t.id)}/identitas">← Kembali ke editor</a>
        <span class="badge badge-warn">🧪 Uji Coba Guru · progres tidak disimpan</span>
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
    root.querySelector('[data-start]').onclick = () => startPlay(root, t, t.groups.find((g) => g.id === groupId), charId);
  };
  draw();
}

// ---------------- 2. bermain ----------------
async function startPlay(root, t, group, charId) {
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
    </div>
    <div class="hud hud-right">
      <ol class="quest-track" data-quest aria-label="Progres misi"></ol>
      <div class="hud-buttons">
        <button class="icon-btn hud-btn" data-act="map" title="Peta penuh (M)" aria-label="Peta penuh" data-testid="btn-map">🗺️</button>
        <button class="icon-btn hud-btn" data-act="help" title="Bantuan kontrol" aria-label="Bantuan" data-testid="btn-help">❔</button>
        <button class="icon-btn hud-btn" data-act="test" title="Panel uji guru" aria-label="Panel uji guru" data-testid="btn-test">🧪</button>
        <button class="icon-btn hud-btn" data-act="exit" title="Keluar" aria-label="Keluar" data-testid="btn-exit">✕</button>
      </div>
    </div>

    <div class="region-banner" data-banner aria-live="polite"></div>

    <div class="test-panel panel" data-test-panel hidden data-testid="test-panel">
      <h3>Panel Uji Guru</h3>
      <label class="check"><input type="checkbox" data-free data-testid="free-explore"><span>Jelajah bebas (abaikan gerbang & golem)</span></label>
      <p class="field-label">Simulasikan pos selesai</p>
      <div class="test-row">${POS_DEFS.map((p, i) => `<button class="btn btn-sm" data-complete="${p.id}" data-testid="complete-${p.id}">Pos ${i + 1}</button>`).join('')}
        <button class="btn btn-sm btn-ghost" data-reset-quest>Atur ulang</button></div>
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

    <div class="lumi-dialog panel" data-dialog hidden role="dialog" aria-live="polite" data-testid="lumi-dialog">
      <div class="lumi-face">${lumiSVG({ size: 64 })}</div>
      <div class="lumi-text"><b>Lumi</b><p data-dialog-text></p></div>
      <div class="lumi-actions" data-dialog-actions></div>
    </div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const quest = new QuestState();
  let api = null;
  let destroyed = false;

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
      api?.setPaused(false);
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
      const [ic, label] = STATUS[quest.status[p.id]];
      return `<li class="qt ${quest.status[p.id]}" title="${esc(p.name)}: ${label}"><span aria-hidden="true">${p.icon}</span><b>Pos ${i + 1}</b><span class="qt-st" aria-label="${label}">${ic}</span></li>`;
    }).join('');
  };
  quest.on(drawQuest);
  drawQuest();

  // ----- interaksi pos -----
  const posMessage = (posId) => {
    const p = POS_BY_ID[posId];
    const n = POS_DEFS.indexOf(p) + 1;
    const count = t.questionBank.pos.find((x) => x.id === posId).questions.length;
    const st = quest.status[posId];
    if (st === 'done') return showDialog(`<b>${esc(p.name)}</b> sudah kalian taklukkan. Ayo lanjutkan perjalanan!`);
    const intro = {
      pos1: `Ini <b>Jembatan Wahyu</b>. Jembatannya terputus! Susun ${count} potongan ayat dengan urutan yang benar agar batu-batu jembatan tersambung kembali.`,
      pos2: `Hati-hati! Golem batu penjaga <b>Lembah Kaum Tsamud</b> menghadang. Ia lambang kesombongan. Jawab pertanyaan dengan benar untuk mengurangi energinya. Jawaban salah akan dibalas serangannya, jadi jaga ${t.rules.teamHearts} nyawa kelompok kalian!`,
      pos3: `Selamat datang di <b>Taman Cahaya</b>. Buka prasasti ini dan renungkan ${count} pertanyaan refleksi bersama kelompok.`,
    }[posId];
    showDialog(`${intro}<br><small class="hint">Tantangan Pos ${n} (${esc(p.mechanic)}) dibangun pada Tahap 3. Gunakan Panel Uji 🧪 untuk menyimulasikan pos selesai.</small>`, [
      { label: '✔ Simulasikan selesai', primary: true, onClick: () => completePos(posId) },
      { label: 'Nanti saja' },
    ]);
  };

  const completePos = (posId) => {
    if (quest.status[posId] === 'done') return;
    quest.complete(posId);
    api?.lumi('happy');
    api?.playAnim('victory');
    const msg = {
      pos1: 'Jembatan tersambung! Cahaya membuka jalan menuju lembah.',
      pos2: 'Golem minggir! Jalan menuju Taman Cahaya terbuka.',
      pos3: 'Refleksi selesai. Kalian kini bergelar <b>Penjelajah Cahaya</b>! ✨',
    }[posId];
    showDialog(msg);
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
    if (act === 'exit') navigate(`/guru/edit/${t.id}/identitas`);
  };
  root.querySelector('[data-act="help"]').onclick = (e) => {
    e.stopPropagation();
    showDialog(isTouch()
      ? 'Joystick = berjalan (tarik penuh untuk berlari) · ✋ = interaksi · ⤒ = lompat · 🗺️ = peta penuh.'
      : 'WASD / panah = berjalan · Shift = berlari · Spasi = lompat · E = interaksi · M = peta penuh.');
  };
  const panel = $('[data-test-panel]');
  panel.querySelector('[data-free]').onchange = (e) => api?.setFreeExplore(e.target.checked);
  panel.querySelectorAll('[data-complete]').forEach((b) => (b.onclick = () => completePos(b.dataset.complete)));
  panel.querySelector('[data-reset-quest]').onclick = () => quest.reset();
  panel.querySelectorAll('[data-anim]').forEach((b) => (b.onclick = () => {
    api?.playAnim(b.dataset.anim);
    if (b.dataset.anim === 'defeat') api?.lumi('sad');
    if (b.dataset.anim === 'victory') api?.lumi('happy');
  }));

  setupTouch(root);

  // ----- muat game (Phaser dimuat terpisah) -----
  setLeaveGuard(async () => {
    destroyed = true;
    document.removeEventListener('keydown', onDialogKey);
    api?.destroy();
    return true;
  });
  try {
    const { startGame } = await import('../game/index.js');
    if (destroyed) return;
    api = startGame($('#game-host'), { characterId: char.id, quest, hooks });
    window.__jc = api; // dipakai uji otomatis
  } catch (err) {
    console.error(err);
    toast('Game gagal dimuat. Muat ulang halaman.', 'error');
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
