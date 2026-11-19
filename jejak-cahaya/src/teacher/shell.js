// Kerangka halaman guru: bilah atas + area konten.

import { getAdapter } from '../data/adapter.js';
import { lumiSVG } from '../ui/characters.js';

export function teacherShell(root, { crumbs = '' } = {}) {
  const adapter = getAdapter();
  root.innerHTML = `
  <div class="t-layout">
    <header class="t-top">
      <a class="t-brand" href="#/" title="Kembali ke Beranda">${lumiSVG({ size: 40 })}<span>Jejak Cahaya <small>Mode Guru</small></span></a>
      <nav class="t-crumbs" aria-label="Navigasi">${crumbs}</nav>
      <span class="badge ${adapter.persistent ? 'badge-warn' : 'badge-err'}" title="Tahap 1: data disimpan di browser perangkat ini. Pada Tahap 4 data pindah ke server (Supabase) dengan login guru.">
        ${adapter.persistent ? '💾 Data lokal (pengembangan)' : '⚠️ Penyimpanan browser diblokir'}
      </span>
    </header>
    <main class="t-main" id="t-main"></main>
  </div>`;
  return root.querySelector('#t-main');
}
