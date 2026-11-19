import { bindFields } from './bind.js';

export function renderIdentityTab(panel, ctx) {
  panel.innerHTML = `
  <h2>Identitas Ujian</h2>
  <p class="hint">Informasi ini tampil di layar pembuka siswa dan di rekap hasil.</p>
  <label class="field"><span>Judul ujian *</span>
    <input type="text" data-path="identity.title" maxlength="80" required data-testid="f-title"></label>
  <div class="grid-2">
    <label class="field"><span>Mata pelajaran</span><input type="text" data-path="identity.subject" maxlength="60" data-testid="f-subject"></label>
    <label class="field"><span>Materi / Bab</span><input type="text" data-path="identity.chapter" maxlength="80" data-testid="f-chapter"></label>
    <label class="field"><span>Kelas</span><input type="text" data-path="identity.className" maxlength="40" data-testid="f-class"></label>
    <label class="field"><span>Nama guru</span><input type="text" data-path="identity.teacherName" maxlength="60" data-testid="f-teacher"></label>
  </div>
  <label class="field"><span>Deskripsi permainan</span>
    <textarea data-path="identity.description" maxlength="600" placeholder="Contoh: Ujian akhir bab berbentuk petualangan. Kerjakan bersama kelompokmu dengan jujur dan kompak."></textarea>
    <small>Ditampilkan kepada siswa sebelum permainan dimulai.</small></label>
  <fieldset class="fieldset">
    <legend>Pengaturan permainan</legend>
    <label class="check"><input type="checkbox" data-path="settings.allowCharacterSelect" data-testid="f-charselect">
      <span>Siswa boleh memilih karakter sendiri saat bergabung<br><small class="hint">Jika dimatikan, kelompok memakai karakter yang ditentukan guru di tab Kelompok.</small></span></label>
  </fieldset>`;
  bindFields(panel, ctx);
}
