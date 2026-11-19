// Mode Siswa (sementara, Tahap 1–3): memilih ujian yang tersimpan di perangkat ini.
// Pada Tahap 4 halaman ini diganti "Gabung dengan kode sesi / QR".

import { getAdapter } from '../data/adapter.js';
import { checkTemplate } from '../config/template-model.js';
import { POS_DEFS } from '../core/constants.js';
import { lumiSVG } from '../ui/characters.js';
import { esc } from '../ui/ui.js';

export async function renderStudentHome(root) {
  const list = (await getAdapter().listTemplates()).filter((t) => checkTemplate(t).ready);
  root.innerHTML = `
  <div class="setup">
    <header class="setup-head">
      <a class="btn btn-ghost btn-sm" href="#/">← Beranda</a>
      <span class="badge badge-water">🎒 Mode Siswa</span>
    </header>
    <div class="setup-title">${lumiSVG({ size: 72 })}
      <div><h1>Pilih Ujian</h1><p class="hint">Ujian yang sudah disiapkan guru di perangkat ini.</p></div>
    </div>
    <div class="tpl-list" data-testid="student-exams">
      ${list.length ? list.map((t) => `
        <article class="panel tpl-card">
          <div class="tpl-card-main">
            <h3>${esc(t.identity.title)}</h3>
            <p class="hint">${[t.identity.subject, t.identity.chapter, t.identity.className].filter(Boolean).map(esc).join(' · ')}</p>
            <p class="hint">${POS_DEFS.map((p, i) => `${p.icon} Pos ${i + 1}: ${t.timing[p.id + 'Minutes']} menit`).join(' · ')}</p>
          </div>
          <div class="tpl-card-actions"><a class="btn btn-gold btn-lg" href="#/main/${esc(t.id)}" data-testid="student-start">▶ Mulai</a></div>
        </article>`).join('') : `
        <div class="panel empty">
          <p><b>Belum ada ujian yang siap.</b></p>
          <p class="hint">Guru perlu membuat konfigurasi di <a href="#/guru">Mode Guru</a> sampai statusnya <b>✔ Siap dipakai</b> (misalnya dengan <b>Muat Contoh (Dummy)</b>).</p>
        </div>`}
    </div>
    <p class="hint" style="margin-top:16px">Bergabung dari perangkat masing-masing dengan kode sesi atau QR akan tersedia setelah aplikasi tersambung ke server (Tahap 4).</p>
  </div>`;
}
