// Editor konfigurasi ujian: tab Identitas, Kelompok, Waktu, Peraturan, Bank Soal, Pemeriksaan.

import { getAdapter } from '../data/adapter.js';
import { navigate, setLeaveGuard } from '../core/router.js';
import { clone } from '../core/ids.js';
import { checkTemplate } from '../config/template-model.js';
import { exportConfig } from '../config/config-io.js';
import { teacherShell } from './shell.js';
import { esc, toast, confirmDialog, downloadJSON, slug } from '../ui/ui.js';
import { renderIdentityTab } from './tabs/identity.js';
import { renderGroupsTab } from './tabs/groups.js';
import { renderTimingTab } from './tabs/timing.js';
import { renderRulesTab } from './tabs/rules.js';
import { renderQuestionsTab } from './tabs/questions.js';
import { renderReviewTab } from './tabs/review.js';

const TABS = [
  { id: 'identitas', label: 'Identitas', icon: '📜', render: renderIdentityTab },
  { id: 'kelompok', label: 'Kelompok', icon: '👥', render: renderGroupsTab },
  { id: 'waktu', label: 'Waktu', icon: '⏳', render: renderTimingTab },
  { id: 'peraturan', label: 'Peraturan', icon: '⚖️', render: renderRulesTab },
  { id: 'soal', label: 'Bank Soal', icon: '📚', render: renderQuestionsTab },
  { id: 'periksa', label: 'Pemeriksaan', icon: '✅', render: renderReviewTab },
];

let unloadHandler = null;

export async function renderEditor(root, { id, tab }) {
  const adapter = getAdapter();
  const saved = await adapter.getTemplate(id);
  if (!saved) {
    toast('Konfigurasi tidak ditemukan.', 'error');
    navigate('/guru');
    return;
  }
  const activeTab = TABS.find((t) => t.id === tab) || TABS[0];
  // Draf disimpan per editor agar berpindah tab tidak kehilangan perubahan.
  const state = (renderEditor.state && renderEditor.state.id === id) ? renderEditor.state : { id, draft: saved, dirty: false };
  renderEditor.state = state;

  const main = teacherShell(root, {
    crumbs: `<a href="#/guru">Dashboard</a><span aria-hidden="true">›</span><span>Edit Konfigurasi</span>`,
  });
  main.innerHTML = `
  <div class="ed-head panel">
    <div class="ed-title">
      <h1 data-bind="title"></h1>
      <span class="badge" data-bind="status" data-testid="save-status"></span>
    </div>
    <div class="actions">
      <button class="btn btn-ghost btn-sm" data-act="export">⬇️ Ekspor JSON</button>
      <button class="btn btn-gold btn-sm" data-act="play" data-testid="test-play">▶ Uji Coba Main</button>
      <button class="btn btn-primary" data-act="save" data-testid="save">💾 Simpan</button>
    </div>
  </div>
  <div class="ed-tabs" role="tablist" aria-label="Bagian konfigurasi">
    ${TABS.map(
      (t) => `<a role="tab" class="tab ${t.id === activeTab.id ? 'active' : ''}" aria-selected="${t.id === activeTab.id}"
        href="#/guru/edit/${esc(id)}/${t.id}" data-tab="${t.id}" data-testid="tab-${t.id}">
        <span aria-hidden="true">${t.icon}</span> ${t.label} <span class="tab-count" data-count="${t.id}"></span></a>`
    ).join('')}
  </div>
  <section class="ed-panel panel" role="tabpanel" id="ed-panel"></section>`;

  const panel = main.querySelector('#ed-panel');

  const updateHeader = () => {
    main.querySelector('[data-bind="title"]').textContent = state.draft.identity.title || 'Ujian Tanpa Judul';
    const st = main.querySelector('[data-bind="status"]');
    st.textContent = state.dirty ? '● Belum disimpan' : '✔ Tersimpan';
    st.className = `badge ${state.dirty ? 'badge-warn' : 'badge-ok'}`;
    const check = checkTemplate(state.draft);
    for (const t of TABS) {
      const n = check.errors.filter((e) => e.tab === t.id).length;
      const el = main.querySelector(`[data-count="${t.id}"]`);
      el.textContent = n ? String(n) : '';
      el.title = n ? `${n} hal perlu diperbaiki` : '';
    }
  };

  const ctx = {
    get t() {
      return state.draft;
    },
    /** Ubah draf. rerender=true untuk menggambar ulang tab (mis. daftar berubah). */
    change(fn, { rerender = false } = {}) {
      const next = clone(state.draft);
      fn(next);
      state.draft = next;
      state.dirty = true;
      updateHeader();
      if (rerender) renderTab();
    },
    rerender: () => renderTab(),
    save,
  };

  function renderTab() {
    const y = window.scrollY;
    activeTab.render(panel, ctx);
    window.scrollTo(0, y);
  }

  async function save() {
    const check = checkTemplate(state.draft);
    if (!state.draft.identity.title.trim()) {
      toast('Judul ujian wajib diisi sebelum menyimpan.', 'error');
      return false;
    }
    try {
      state.draft = await adapter.saveTemplate(state.draft);
      state.dirty = false;
      updateHeader();
      toast(check.ready ? 'Konfigurasi tersimpan dan siap dipakai.' : `Tersimpan. Masih ada ${check.errors.length} hal yang perlu dilengkapi.`, 'ok');
      return true;
    } catch (e) {
      toast(e.message, 'error');
      return false;
    }
  }

  main.querySelector('[data-act="save"]').onclick = save;
  main.querySelector('[data-act="play"]').onclick = async () => {
    // Uji coba memakai versi tersimpan, jadi simpan dulu bila ada perubahan.
    if (state.dirty && !(await save())) return;
    navigate(`/uji/${id}`);
  };
  main.querySelector('[data-act="export"]').onclick = () => {
    downloadJSON(`jejak-cahaya-${slug(state.draft.identity.title)}.json`, exportConfig(state.draft));
    toast('Ekspor berisi draf saat ini (termasuk kunci jawaban).');
  };

  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
    }
  };
  document.addEventListener('keydown', onKey);

  if (unloadHandler) window.removeEventListener('beforeunload', unloadHandler);
  unloadHandler = (e) => {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', unloadHandler);

  setLeaveGuard(async (nextPath) => {
    const staying = nextPath.startsWith(`/guru/edit/${id}`);
    if (staying) {
      document.removeEventListener('keydown', onKey);
      return true;
    }
    if (state.dirty) {
      const ok = await confirmDialog({
        title: 'Perubahan belum disimpan',
        message: 'Anda memiliki perubahan yang belum disimpan. Tinggalkan halaman dan buang perubahan tersebut?',
        okText: 'Buang & tinggalkan',
        danger: true,
      });
      if (!ok) return false;
    }
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('beforeunload', unloadHandler);
    renderEditor.state = null;
    return true;
  });

  updateHeader();
  renderTab();
}
