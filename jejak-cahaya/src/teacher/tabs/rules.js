import { checkTemplate, maxPossibleScore } from '../../config/template-model.js';
import { bindFields, issuesHTML } from './bind.js';

export function renderRulesTab(panel, ctx) {
  const pos1Count = ctx.t.questionBank.pos.find((p) => p.id === 'pos1').questions.length;
  const pos2Count = ctx.t.questionBank.pos.find((p) => p.id === 'pos2').questions.length;
  panel.innerHTML = `
  <h2>Peraturan & Penilaian</h2>
  <fieldset class="fieldset">
    <legend>Skor</legend>
    <div class="grid-3">
      <label class="field"><span>Skor jawaban benar (bawaan)</span>
        <input type="number" min="0" step="1" data-path="rules.correctScore" data-testid="f-correct">
        <small>Dipakai bila soal tidak punya skor sendiri.</small></label>
      <label class="field"><span>Penalti jawaban salah</span>
        <input type="number" min="0" step="1" data-path="rules.wrongPenalty" data-testid="f-penalty">
        <small>Skor dikurangi setiap jawaban salah. 0 = tanpa penalti.</small></label>
      <label class="field"><span>Bonus penyelesaian per pos</span>
        <input type="number" min="0" step="1" data-path="rules.completionBonus" data-testid="f-bonus"></label>
    </div>
  </fieldset>
  <fieldset class="fieldset">
    <legend>Jumlah soal yang dipakai</legend>
    <div class="grid-2">
      <label class="field"><span>Jumlah ayat Pos 1 (puzzle)</span>
        <input type="number" min="0" step="1" data-path="rules.pos1QuestionCount" data-testid="f-pos1count">
        <small>0 = semua ayat (${pos1Count} tersedia). Contoh: bank berisi ayat 1–10, isi 5 atau 6. Ayat dipilih acak per kelompok lalu ditampilkan sesuai urutan bank soal.</small></label>
      <label class="field"><span>Jumlah soal Battle Quiz (Pos 2)</span>
        <input type="number" min="0" step="1" data-path="rules.pos2QuestionCount" data-testid="f-pos2count">
        <small>0 = semua soal Pos 2 (${pos2Count} tersedia). Energi golem = jumlah soal.</small></label>
    </div>
  </fieldset>
  <fieldset class="fieldset">
    <legend>Kesempatan & Battle Quiz</legend>
    <div class="grid-3">
      <label class="field"><span>Kesempatan menjawab per soal</span>
        <input type="number" min="1" max="10" step="1" data-path="rules.attemptsPerQuestion" data-testid="f-attempts">
        <small>Berlaku untuk puzzle ayat dan Battle Quiz.</small></label>
      <label class="field"><span>Nyawa kelompok (❤)</span>
        <input type="number" min="1" max="10" step="1" data-path="rules.teamHearts" data-testid="f-hearts">
        <small>Jawaban salah di Battle Quiz mengurangi 1 nyawa (serangan balasan golem).</small></label>
    </div>
    <div class="note">Jika nyawa habis, kelompok mengulang pertarungan dengan soal yang belum terjawab benar. Skor yang sudah diperoleh tetap tersimpan.
      Jika kesempatan sebuah soal habis, soal bernilai 0 (puzzle: susunan benar ditampilkan) lalu lanjut ke soal berikutnya.
      Kunci jawaban Battle Quiz ditampilkan di layar akhir setelah nilai akhir.</div>
  </fieldset>
  <fieldset class="fieldset">
    <legend>Pengacakan</legend>
    <label class="check"><input type="checkbox" data-path="rules.shuffleQuestions"><span>Acak urutan soal untuk setiap kelompok</span></label>
    <label class="check"><input type="checkbox" data-path="rules.shuffleOptions"><span>Acak urutan pilihan jawaban</span></label>
  </fieldset>
  <fieldset class="fieldset">
    <legend>Ketentuan refleksi (Pos 3)</legend>
    <label class="check"><input type="checkbox" data-path="rules.reflectionRequireAll"><span>Semua pertanyaan refleksi wajib dijawab sebelum mendapat gelar <b>Penjelajah Cahaya</b></span></label>
    <label class="field" style="max-width:320px"><span>Panjang minimal isian singkat (karakter)</span>
      <input type="number" min="0" step="1" data-path="rules.reflectionMinChars"></label>
    <small class="hint">Cara penilaian tiap pertanyaan refleksi (tidak dinilai / otomatis / manual oleh guru) diatur per soal di Bank Soal.</small>
  </fieldset>
  <p class="max-score">Perkiraan skor maksimum: <b data-max data-testid="max-score"></b></p>
  <div data-issues></div>`;

  const update = () => {
    panel.querySelector('[data-max]').textContent = maxPossibleScore(ctx.t) || 0;
    panel.querySelector('[data-issues]').innerHTML = issuesHTML(checkTemplate(ctx.t), 'peraturan');
  };
  bindFields(panel, ctx, { onChange: update });
  update();
}
