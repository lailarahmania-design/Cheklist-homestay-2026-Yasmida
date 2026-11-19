import { CHARACTERS, CHARACTER_IDS, LIMITS } from '../../core/constants.js';
import { createGroup, checkTemplate } from '../../config/template-model.js';
import { characterSVG } from '../../ui/characters.js';
import { esc, confirmDialog } from '../../ui/ui.js';
import { issuesHTML } from './bind.js';

export function renderGroupsTab(panel, ctx) {
  const t = ctx.t;
  const groups = t.groups;
  panel.innerHTML = `
  <div class="tab-head">
    <div>
      <h2>Kelompok</h2>
      <p class="hint">Atur nama, karakter, dan urutan kelompok (${groups.length}/${LIMITS.maxGroups}).
      ${t.settings.allowCharacterSelect ? 'Karakter di sini menjadi pilihan awal; siswa masih boleh menggantinya.' : 'Siswa akan memakai karakter yang dipilih di sini.'}</p>
    </div>
    <button class="btn btn-primary" data-act="add" ${groups.length >= LIMITS.maxGroups ? 'disabled' : ''} data-testid="add-group">＋ Tambah Kelompok</button>
  </div>
  <div data-issues>${issuesHTML(checkTemplate(t), 'kelompok')}</div>
  <ol class="group-list" data-testid="group-list">
    ${groups
      .map(
        (g, i) => `
      <li class="group-row" data-id="${esc(g.id)}" data-testid="group-row">
        <span class="group-no" aria-hidden="true">${i + 1}</span>
        <div class="group-avatar">${characterSVG(g.character, { size: 52 })}</div>
        <div class="group-fields">
          <label class="field"><span class="sr-only">Nama kelompok ${i + 1}</span>
            <input type="text" value="${esc(g.name)}" maxlength="${LIMITS.groupNameMax}" data-name aria-label="Nama kelompok ${i + 1}"></label>
          <div class="char-pick" role="radiogroup" aria-label="Karakter kelompok ${i + 1}">
            ${CHARACTERS.map(
              (c) => `<label class="char-opt ${c.id === g.character ? 'on' : ''}" title="${esc(c.name)}">
                <input type="radio" name="char-${esc(g.id)}" value="${c.id}" ${c.id === g.character ? 'checked' : ''} class="sr-only">
                ${characterSVG(c.id, { size: 30 })}<span>${esc(c.name.replace('Kid ', ''))}</span></label>`
            ).join('')}
          </div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-act="up" aria-label="Naikkan urutan" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button class="icon-btn" data-act="down" aria-label="Turunkan urutan" ${i === groups.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="icon-btn danger" data-act="del" aria-label="Hapus kelompok" ${groups.length <= LIMITS.minGroups ? 'disabled' : ''}>🗑</button>
        </div>
      </li>`
      )
      .join('')}
  </ol>`;

  const refreshIssues = () => (panel.querySelector('[data-issues]').innerHTML = issuesHTML(checkTemplate(ctx.t), 'kelompok'));
  const reorder = (list) => list.forEach((g, i) => (g.order = i));

  panel.querySelectorAll('[data-name]').forEach((input) => {
    input.addEventListener('input', () => {
      const id = input.closest('[data-id]').dataset.id;
      ctx.change((d) => (d.groups.find((g) => g.id === id).name = input.value));
      refreshIssues();
    });
  });

  panel.querySelectorAll('.char-pick input').forEach((radio) => {
    radio.addEventListener('change', () => {
      const id = radio.closest('[data-id]').dataset.id;
      ctx.change((d) => (d.groups.find((g) => g.id === id).character = radio.value), { rerender: true });
    });
  });

  panel.onclick = async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'add') {
      ctx.change(
        (d) => {
          const used = new Set(d.groups.map((g) => g.name.trim().toLowerCase()));
          let n = d.groups.length + 1;
          while (used.has(`kelompok ${n}`)) n++;
          d.groups.push(createGroup(`Kelompok ${n}`, CHARACTER_IDS[d.groups.length % CHARACTER_IDS.length], d.groups.length));
        },
        { rerender: true }
      );
      const inputs = panel.querySelectorAll('[data-name]');
      inputs[inputs.length - 1]?.select();
      return;
    }
    const id = btn.closest('[data-id]').dataset.id;
    const i = ctx.t.groups.findIndex((g) => g.id === id);
    if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1;
      ctx.change(
        (d) => {
          [d.groups[i], d.groups[j]] = [d.groups[j], d.groups[i]];
          reorder(d.groups);
        },
        { rerender: true }
      );
    } else if (act === 'del') {
      const ok = await confirmDialog({ title: 'Hapus kelompok?', message: `Hapus "${ctx.t.groups[i].name}" dari daftar?`, okText: 'Hapus', danger: true });
      if (!ok) return;
      ctx.change(
        (d) => {
          d.groups.splice(i, 1);
          reorder(d.groups);
        },
        { rerender: true }
      );
    }
  };
}
