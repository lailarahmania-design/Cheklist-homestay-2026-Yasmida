import { POS_DEFS, LIMITS } from '../../core/constants.js';
import { checkTemplate } from '../../config/template-model.js';
import { bindFields, issuesHTML } from './bind.js';

export function renderTimingTab(panel, ctx) {
  panel.innerHTML = `
  <h2>Waktu</h2>
  <p class="hint">Saat permainan online, timer mengacu pada jam server sehingga sama untuk semua kelompok.</p>
  <div class="grid-3">
    ${POS_DEFS.map(
      (p, i) => `<label class="field"><span>${p.icon} Pos ${i + 1} · ${p.name} (menit)</span>
        <input type="number" min="1" max="${LIMITS.maxMinutes}" step="1" data-path="timing.${p.id}Minutes" data-testid="f-${p.id}-min"></label>`
    ).join('')}
  </div>
  <div class="grid-2">
    <label class="field"><span>⏳ Waktu total permainan (menit)</span>
      <input type="number" min="1" max="${LIMITS.maxMinutes}" step="1" data-path="timing.totalMinutes" data-testid="f-total-min">
      <small data-sum></small></label>
  </div>
  <fieldset class="fieldset">
    <legend>Waktu tambahan</legend>
    <label class="check"><input type="checkbox" data-path="timing.allowExtraTime" data-testid="f-extra-allow">
      <span>Izinkan guru memberi waktu tambahan dari dashboard saat permainan berlangsung</span></label>
    <label class="field" data-extra><span>Durasi tambahan sekali klik (menit)</span>
      <input type="number" min="1" max="60" step="1" data-path="timing.extraTimeMinutes"></label>
  </fieldset>
  <div class="note">Jika waktu sebuah pos habis: jalan ke wilayah berikutnya tetap terbuka, soal yang belum dijawab bernilai 0, dan kelompok boleh melanjutkan perjalanan.</div>
  <div data-issues></div>`;

  const update = () => {
    const t = ctx.t.timing;
    const sum = t.pos1Minutes + t.pos2Minutes + t.pos3Minutes;
    panel.querySelector('[data-sum]').textContent = Number.isFinite(sum) ? `Jumlah durasi ketiga pos: ${sum} menit.` : '';
    panel.querySelector('[data-extra]').hidden = !t.allowExtraTime;
    panel.querySelector('[data-issues]').innerHTML = issuesHTML(checkTemplate(ctx.t), 'waktu');
  };
  bindFields(panel, ctx, { onChange: update });
  update();
}
