// Teacher Dashboard dasar: daftar konfigurasi ujian + aksi kelola.

import { getAdapter } from '../data/adapter.js';
import { navigate, refresh } from '../core/router.js';
import { POS_DEFS } from '../core/constants.js';
import { createTemplate, checkTemplate } from '../config/template-model.js';
import { exportConfig, importConfig, duplicateTemplate } from '../config/config-io.js';
import { bankTemplate } from '../question-bank/bank-ops.js';
import { validateBank } from '../question-bank/schema.js';
import { teacherShell } from './shell.js';
import { esc, toast, confirmDialog, downloadJSON, downloadText, pickTextFile, slug, formatDate, openModal } from '../ui/ui.js';
import { csvFromData, resultFileName } from '../results/result-report.js';
import { resultSheetHTML } from '../results/result-sheet.js';

export async function renderDashboard(root) {
  const main = teacherShell(root, { crumbs: '<span>Dashboard</span>' });
  const adapter = getAdapter();
  const templates = await adapter.listTemplates();
  const results = await adapter.listResults();

  main.innerHTML = `
  <section class="t-section">
    <div class="t-section-head">
      <div>
        <h1>Konfigurasi Ujian</h1>
        <p class="hint">Satu konfigurasi berisi identitas ujian, kelompok, waktu, peraturan, dan bank soal. Bisa dipakai berulang untuk banyak sesi.</p>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" data-act="demo" data-testid="load-demo">🧪 Muat Contoh (Dummy)</button>
        <button class="btn btn-ghost" data-act="import" data-testid="import-config">⬆️ Impor Konfigurasi</button>
        <button class="btn btn-primary" data-act="new" data-testid="new-config">＋ Konfigurasi Baru</button>
      </div>
    </div>
    <div class="tpl-list" data-testid="config-list">
      ${templates.length ? templates.map(card).join('') : emptyState()}
    </div>
  </section>

  <section class="t-section">
    <div class="t-section-head"><div>
      <h2>Hasil Tersimpan</h2>
      <p class="hint">Hasil setiap kelompok disimpan otomatis di perangkat ini saat bermain. Unduh sebagai file agar aman. Rekap seluruh kelompok & peringkat tersedia di Tahap 5.</p>
    </div></div>
    <div class="res-list" data-testid="result-list">
      ${results.length ? results.map(resultCard).join('') : '<div class="panel empty"><p class="hint">Belum ada hasil permainan.</p></div>'}
    </div>
  </section>

  <section class="t-section panel t-note">
    <h2>Sesi Permainan</h2>
    <p>Membuat sesi, kode/QR untuk siswa, tombol <b>Mulai · Jeda · Lanjut · Akhiri</b>, dan pemantauan kelompok secara langsung akan aktif di <b>Tahap 4</b> (multiplayer). Tampilan dashboard ini bisa ditayangkan ke proyektor dari laptop guru.</p>
  </section>`;

  main.addEventListener('click', async (e) => {
    const rbtn = e.target.closest('[data-ract]');
    if (rbtn) return resultAction(rbtn.dataset.ract, rbtn.closest('[data-rid]').dataset.rid, results);
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.closest('[data-id]')?.dataset.id;
    const act = btn.dataset.act;
    try {
      if (act === 'new') {
        const t = await adapter.saveTemplate(createTemplate());
        navigate(`/guru/edit/${t.id}/identitas`);
      } else if (act === 'demo') {
        const t = createTemplate({
          identity: {
            title: '[DUMMY] Contoh Ujian Jejak Cahaya',
            subject: '[DUMMY] Mata Pelajaran',
            chapter: '[DUMMY] Bab',
            className: '[DUMMY] Kelas',
            teacherName: '[DUMMY] Nama Guru',
            description: 'Konfigurasi contoh berisi DATA DUMMY untuk mencoba aplikasi. Ganti seluruh soal dengan materi asli sebelum dipakai ujian.',
          },
          questionBank: validateBank(bankTemplate()).bank,
        });
        await adapter.saveTemplate(t);
        toast('Konfigurasi contoh (dummy) ditambahkan.', 'ok');
        refresh();
      } else if (act === 'import') {
        const file = await pickTextFile();
        if (!file) return;
        const r = importConfig(file.text);
        if (!r.ok) {
          toast(r.errors[0], 'error');
          return;
        }
        await adapter.saveTemplate(r.template);
        toast(`"${r.template.identity.title}" berhasil diimpor.`, 'ok');
        refresh();
      } else if (act === 'edit') {
        navigate(`/guru/edit/${id}/identitas`);
      } else if (act === 'dup') {
        const t = await adapter.getTemplate(id);
        await adapter.saveTemplate(duplicateTemplate(t));
        toast('Konfigurasi diduplikasi.', 'ok');
        refresh();
      } else if (act === 'export') {
        const t = await adapter.getTemplate(id);
        downloadJSON(`jejak-cahaya-${slug(t.identity.title)}.json`, exportConfig(t));
        toast('File konfigurasi diunduh. Simpan khusus untuk guru karena berisi kunci jawaban.');
      } else if (act === 'delete') {
        const t = await adapter.getTemplate(id);
        const ok = await confirmDialog({
          title: 'Hapus konfigurasi?',
          message: `"${t.identity.title}" beserta seluruh bank soalnya akan dihapus dari perangkat ini. Tindakan ini tidak dapat dibatalkan. Ekspor JSON terlebih dahulu jika ingin menyimpan cadangan.`,
          okText: 'Hapus',
          danger: true,
        });
        if (!ok) return;
        await adapter.deleteTemplate(id);
        toast('Konfigurasi dihapus.');
        refresh();
      }
    } catch (err) {
      toast(err.message || 'Terjadi kesalahan.', 'error');
    }
  });
}

function emptyState() {
  return `<div class="panel empty">
    <p><b>Belum ada konfigurasi.</b></p>
    <p class="hint">Mulai dengan <b>Konfigurasi Baru</b>, atau coba aplikasi dengan <b>Muat Contoh (Dummy)</b>.</p>
  </div>`;
}

function card(t) {
  const check = checkTemplate(t);
  const isDummy = /\[DUMMY\]/.test(t.identity.title);
  const counts = POS_DEFS.map((p) => {
    const n = t.questionBank.pos.find((x) => x.id === p.id)?.questions.length ?? 0;
    return `<span class="badge ${n ? 'badge-ok' : 'badge-err'}" title="${esc(p.name)}">${p.icon} ${n} soal</span>`;
  }).join('');
  const meta = [t.identity.subject, t.identity.chapter, t.identity.className].filter(Boolean).map(esc).join(' · ');
  return `
  <article class="panel tpl-card" data-id="${esc(t.id)}" data-testid="config-card">
    <div class="tpl-card-main">
      <h3>${esc(t.identity.title)} ${isDummy ? '<span class="badge badge-dummy">DATA DUMMY</span>' : ''}</h3>
      <p class="hint">${meta || 'Identitas belum lengkap'}</p>
      <div class="tpl-badges">
        ${check.ready ? '<span class="badge badge-ok">✔ Siap dipakai</span>' : `<span class="badge badge-err">✖ ${check.errors.length} hal perlu dilengkapi</span>`}
        <span class="badge">👥 ${t.groups.length} kelompok</span>
        ${counts}
      </div>
      <small class="hint">Diperbarui ${esc(formatDate(t.updatedAt))}</small>
    </div>
    <div class="tpl-card-actions">
      <button class="btn btn-primary btn-sm" data-act="edit">✏️ Edit</button>
      <button class="btn btn-sm" data-act="dup">⧉ Duplikat</button>
      <button class="btn btn-sm" data-act="export">⬇️ Ekspor JSON</button>
      <button class="btn btn-sm btn-ghost" data-act="delete" style="color:var(--danger)">🗑 Hapus</button>
    </div>
  </article>`;
}

function resultCard(r) {
  const s = r.summary;
  const done = r.run.finished;
  return `
  <article class="panel res-card" data-rid="${esc(r.id)}" data-testid="result-card">
    <div class="res-score"><b>${s.score}</b><small>nilai</small></div>
    <div class="res-main">
      <h3>${esc(s.group)} ${done ? (s.title !== '-' ? '<span class="badge badge-ok">✨ Penjelajah Cahaya</span>' : '<span class="badge">Selesai</span>') : '<span class="badge badge-warn">Belum selesai</span>'}</h3>
      <p class="hint">${esc(s.exam)} · ✔ ${s.correct} benar · ✖ ${s.wrong} salah · ⏱ ${esc(s.duration)} · ${esc(formatDate(r.savedAt))}</p>
    </div>
    <div class="tpl-card-actions">
      <button class="btn btn-sm btn-primary" data-ract="view">👁 Lihat</button>
      <button class="btn btn-sm" data-ract="csv">⬇️ CSV</button>
      <button class="btn btn-sm" data-ract="json">⬇️ JSON</button>
      <button class="btn btn-sm btn-ghost" data-ract="delete" style="color:var(--danger)">🗑</button>
    </div>
  </article>`;
}

async function resultAction(act, id, results) {
  const r = results.find((x) => x.id === id);
  if (!r) return;
  if (act === 'view') {
    openModal({
      title: `Hasil ${r.summary.group}`,
      wide: true,
      render(body) {
        body.innerHTML = `${resultSheetHTML(r)}<div class="actions no-print"><button class="btn btn-gold" data-print>🖨️ Cetak / Simpan PDF</button></div>`;
        body.querySelector('[data-print]').onclick = () => window.print();
      },
    });
  } else if (act === 'csv') {
    downloadText(resultFileName(r.run, 'csv'), csvFromData(r), 'text/csv;charset=utf-8');
  } else if (act === 'json') {
    downloadJSON(resultFileName(r.run, 'json'), r);
  } else if (act === 'delete') {
    const ok = await confirmDialog({ title: 'Hapus hasil?', message: `Hasil "${r.summary.group}" akan dihapus dari perangkat ini. Unduh terlebih dahulu jika masih diperlukan.`, okText: 'Hapus', danger: true });
    if (!ok) return;
    await getAdapter().deleteResult(id);
    toast('Hasil dihapus.');
    refresh();
  }
}
