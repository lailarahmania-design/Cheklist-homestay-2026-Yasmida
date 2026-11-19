// Uji E2E Tahap 1–3 — menjalankan seluruh alur guru di Chromium sungguhan.
// Jalankan: npm run build && npm run test:e2e
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 4174;
const BASE = `http://localhost:${PORT}/`;
const OUT = path.join(__dirname, '../../test-output');
fs.mkdirSync(OUT, { recursive: true });

let passed = 0;
const failures = [];
let PAGE = null;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ✔', name);
  } catch (e) {
    failures.push(name);
    if (PAGE) await PAGE.screenshot({ path: path.join(OUT, `GAGAL-${failures.length}.png`) }).catch(() => {});
    console.log('  ✖', name, '\n     ', e.message.split('\n')[0]);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: path.join(__dirname, '../..'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  PAGE = page;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && errors.push(m.text()));
  const tid = (id) => `[data-testid="${id}"]`;
  const status = () => page.textContent(tid('save-status'));
  const count = (pos) => page.textContent(tid(`count-${pos}`)).then((t) => Number(t.trim()));

  console.log('Tahap 1 — E2E');
  try {
    await step('Beranda tampil & menuju Mode Guru', async () => {
      await page.goto(BASE);
      await page.waitForSelector('.logo-title');
      await page.click(tid('go-teacher'));
      await page.waitForSelector(tid('config-list'));
      assert((await page.textContent(tid('config-list'))).includes('Belum ada konfigurasi'), 'daftar kosong');
    });

    await step('Buat konfigurasi baru & isi identitas', async () => {
      await page.click(tid('new-config'));
      await page.waitForSelector(tid('f-title'));
      await page.fill(tid('f-title'), 'Ujian Akhir Bab Uji');
      await page.fill(tid('f-subject'), 'Mapel Uji');
      await page.fill(tid('f-chapter'), 'Bab Uji');
      await page.fill(tid('f-class'), 'Kelas Uji');
      await page.fill(tid('f-teacher'), 'Guru Uji');
      assert((await status()).includes('Belum disimpan'), 'status kotor');
      await page.click(tid('save'));
      await page.waitForFunction(() => document.querySelector('[data-testid="save-status"]').textContent.includes('Tersimpan'));
      assert((await page.textContent('.ed-title h1')) === 'Ujian Akhir Bab Uji', 'judul header');
    });

    await step('Kelompok: tambah, ganti nama & karakter, urutkan, hapus, validasi nama ganda', async () => {
      await page.click(tid('tab-kelompok'));
      await page.waitForSelector(tid('group-list'));
      assert((await page.$$(tid('group-row'))).length === 4, '4 kelompok awal');
      await page.click(tid('add-group'));
      const rows = await page.$$(tid('group-row'));
      assert(rows.length === 5, 'jadi 5');
      const last = rows[4];
      await (await last.$('[data-name]')).fill('Elang');
      await page.click('[data-testid="group-row"]:nth-child(5) .char-opt:has(input[value="kid-girl-b"])');
      await page.waitForTimeout(50);
      let r5 = (await page.$$(tid('group-row')))[4];
      assert(await (await r5.$('input[value="kid-girl-b"]')).isChecked(), 'karakter berganti');
      await (await r5.$('[data-act="up"]')).click();
      const names = await page.$$eval('[data-name]', (els) => els.map((e) => e.value));
      assert(names[3] === 'Elang', 'Elang naik ke posisi 4: ' + names);
      // nama ganda
      await (await page.$$('[data-name]'))[1].fill('Kelompok 1');
      await page.waitForSelector('.issue.err');
      assert((await page.textContent('.issues')).includes('tidak boleh sama'), 'pesan nama sama');
      await (await page.$$('[data-name]'))[1].fill('Kelompok 2');
      // hapus kelompok pertama
      await (await page.$$(tid('group-row')))[0].$('[data-act="del"]').then((b) => b.click());
      await page.click('[data-yes]');
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="group-row"]').length === 4);
      assert(!(await page.$('.issue.err')), 'tidak ada error tersisa');
    });

    await step('Waktu & Peraturan tersimpan dalam draf', async () => {
      await page.click(tid('tab-waktu'));
      await page.fill(tid('f-pos1-min'), '20');
      await page.fill(tid('f-total-min'), '30');
      await page.waitForSelector('.issue.warn');
      await page.uncheck(tid('f-extra-allow'));
      assert(await page.isHidden('[data-extra]'), 'durasi tambahan tersembunyi');
      await page.click(tid('tab-peraturan'));
      await page.fill(tid('f-correct'), '5');
      await page.fill(tid('f-hearts'), '4');
      await page.click(tid('tab-waktu'));
      assert((await page.inputValue(tid('f-pos1-min'))) === '20', 'nilai waktu bertahan saat ganti tab');
    });

    await step('Bank soal manual: validasi, tambah 3 tipe soal, edit, urutkan, hapus', async () => {
      await page.click(tid('tab-soal'));
      // Pos 1 — puzzle ayat
      await page.click(tid('add-question'));
      await page.click(tid('q-save'));
      await page.waitForSelector('[data-errors] .issue');
      const segs = await page.$$('[data-seg]');
      for (let i = 0; i < segs.length; i++) await segs[i].fill(`قِطْعَة ${i + 1}`);
      await page.fill(tid('q-reference'), 'Rujukan uji');
      assert((await page.$$('.preview-blocks .verse-block')).length === 3, 'pratinjau balok');
      await page.click(tid('add-segments'));
      await (await page.$$('[data-seg]'))[3].fill('قِطْعَة 4');
      await page.click(tid('q-save'));
      await page.waitForFunction(() => document.querySelector('[data-testid="count-pos1"]').textContent.trim() === '1');
      // Pos 2 — battle quiz (dipilih dari dropdown pos)
      await page.click(tid('add-question'));
      await page.selectOption(tid('q-pos'), 'pos2');
      await page.fill(tid('q-question'), 'Pertanyaan uji A?');
      const opts = await page.$$('[data-opt]');
      for (let i = 0; i < opts.length; i++) await opts[i].fill(`Opsi ${i + 1}`);
      await page.check('input[name="answer"][value="2"]');
      await page.fill(tid('q-score'), '15');
      await page.click(tid('q-save'));
      assert((await count('pos2')) === 1, 'pos2 = 1');
      assert((await page.textContent('.opt.key')).includes('Opsi 3'), 'kunci C');
      // soal kedua pos2 lalu urutkan & edit & hapus
      await page.click(tid('add-question'));
      await page.fill(tid('q-question'), 'Pertanyaan uji B?');
      for (const [i, o] of (await page.$$('[data-opt]')).entries()) await o.fill(`B${i}`);
      await page.click(tid('q-save'));
      await (await page.$$(tid('question-item')))[1].$('[data-act="up"]').then((b) => b.click());
      assert((await (await page.$$(tid('question-item')))[0].textContent()).includes('uji B'), 'urutan berubah');
      await (await page.$$(tid('edit-question')))[0].click();
      await page.fill(tid('q-question'), 'Pertanyaan uji B (diedit)?');
      await page.click(tid('q-save'));
      assert((await page.textContent(tid('question-list'))).includes('(diedit)'), 'edit tersimpan');
      await (await page.$$(tid('delete-question')))[0].click();
      await page.click('[data-yes]');
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="question-item"]').length === 1);
      // Pos 3 — refleksi
      await page.click(tid('postab-pos3'));
      await page.click(tid('add-question'));
      await page.fill(tid('q-question'), 'Apa pelajaran yang kalian dapat?');
      await page.selectOption(tid('q-grading'), 'manual');
      await page.click(tid('q-save'));
      assert((await count('pos3')) === 1, 'pos3 = 1');
      await page.click(tid('add-question'));
      await page.fill(tid('q-question'), 'Pilih sikap yang tepat');
      await page.selectOption(tid('q-grading'), 'auto');
      assert((await page.inputValue(tid('q-format'))) === 'choice', 'auto memaksa format pilihan');
      for (const [i, o] of (await page.$$('[data-opt]')).entries()) await o.fill(`Sikap ${i}`);
      await page.click(tid('q-save'));
      assert((await page.textContent('[data-errors]')).includes('kunci'), 'wajib kunci untuk auto');
      await page.check('input[name="answer"][value="1"]');
      await page.click(tid('q-save'));
      assert((await count('pos3')) === 2, 'pos3 = 2');
    });

    await step('Unduh template JSON berisi data dummy yang valid', async () => {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click(tid('download-template'))]);
      const file = path.join(OUT, 'template.json');
      await dl.saveAs(file);
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert(json.game === 'Jejak Cahaya' && json.pos.length === 3, 'struktur template');
      assert(JSON.stringify(json).includes('[DUMMY]'), 'ditandai dummy');
    });

    await step('Impor JSON: pesan kesalahan jelas untuk file rusak', async () => {
      await page.click(tid('open-import'));
      await page.fill(tid('json-text'), '{"pos":[{"id":"pos2","questions":[{"question":"x","options":["a"],"answer":5}]}]}');
      await page.click(tid('json-check'));
      const s = await page.textContent(tid('json-status'));
      assert(s.includes('kesalahan'), 'status gagal');
      assert((await page.textContent('.modal-body')).includes('POS2 (Lembah Kaum Tsamud), soal ke-1'), 'lokasi kesalahan');
      assert(!(await page.$(tid('json-merge'))), 'tombol impor tidak muncul saat error');
      await page.fill(tid('json-text'), '{ rusak');
      await page.click(tid('json-check'));
      assert((await page.textContent('.modal-body')).includes('Bukan JSON yang valid'), 'json rusak');
    });

    await step('Impor JSON dari file: pratinjau lalu gabungkan', async () => {
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click(tid('json-pick'))]);
      await chooser.setFiles(path.join(OUT, 'template.json'));
      await page.waitForSelector(tid('json-preview'));
      assert((await page.textContent(tid('json-status'))).includes('valid'), 'valid');
      await page.click(tid('json-merge'));
      assert((await count('pos1')) === 2 && (await count('pos2')) === 2 && (await count('pos3')) === 4, 'jumlah setelah gabung');
    });

    await step('Impor JSON: ganti seluruh bank (dengan konfirmasi dua langkah)', async () => {
      await page.click(tid('open-import'));
      await page.fill(tid('json-text'), fs.readFileSync(path.join(OUT, 'template.json'), 'utf8'));
      await page.click(tid('json-check'));
      await page.click(tid('json-replace'));
      assert(await page.isVisible('.modal'), 'klik pertama hanya meminta konfirmasi');
      await page.click(tid('json-replace'));
      assert((await count('pos1')) === 1 && (await count('pos2')) === 1 && (await count('pos3')) === 2, 'jumlah setelah ganti');
    });

    await step('Penjaga perubahan belum disimpan', async () => {
      await page.click('.t-crumbs a');
      await page.waitForSelector('[data-yes]');
      assert((await page.textContent('.modal')).includes('belum disimpan'), 'dialog muncul');
      await page.click('[data-no]');
      assert(page.url().includes('/guru/edit/'), 'tetap di editor');
      await page.click(tid('save'));
      await page.waitForFunction(() => document.querySelector('[data-testid="save-status"]').textContent.includes('Tersimpan'));
    });

    await step('Pemeriksaan menyatakan siap, data bertahan setelah muat ulang', async () => {
      await page.click(tid('tab-periksa'));
      assert((await page.textContent(tid('ready-status'))).includes('siap'), 'siap');
      await page.reload();
      await page.click(tid('tab-kelompok'));
      const names = await page.$$eval('[data-name]', (els) => els.map((e) => e.value));
      assert(names.includes('Elang') && names.length === 4, 'kelompok bertahan: ' + names);
      await page.click(tid('tab-waktu'));
      assert((await page.inputValue(tid('f-pos1-min'))) === '20', 'waktu bertahan');
      await page.click(tid('tab-peraturan'));
      assert((await page.inputValue(tid('f-hearts'))) === '4', 'aturan bertahan');
    });

    await step('Dashboard: duplikat, ekspor, impor konfigurasi, hapus', async () => {
      await page.click('.t-crumbs a');
      await page.waitForSelector(tid('config-card'));
      await page.click('[data-act="dup"]');
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="config-card"]').length === 2);
      assert((await page.textContent(tid('config-list'))).includes('(Salinan)'), 'salinan');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="export"]')]);
      const file = path.join(OUT, 'config.json');
      await dl.saveAs(file);
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert(json.format === 'jejak-cahaya/config' && json.template.groups.length === 4, 'isi ekspor');
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click(tid('import-config'))]);
      await chooser.setFiles(file);
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="config-card"]').length === 3);
      // impor bank soal sebagai konfigurasi → ditolak dengan petunjuk
      const [ch2] = await Promise.all([page.waitForEvent('filechooser'), page.click(tid('import-config'))]);
      await ch2.setFiles(path.join(OUT, 'template.json'));
      await page.waitForSelector('.toast-error');
      assert((await page.textContent('.toast-error')).includes('Bank Soal'), 'petunjuk salah file');
      await (await page.$$('[data-act="delete"]'))[0].click();
      await page.click('[data-yes]');
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="config-card"]').length === 2);
    });

    await step('Muat contoh dummy ditandai DATA DUMMY', async () => {
      await page.click(tid('load-demo'));
      await page.waitForSelector('.badge-dummy');
    });

    await step('Responsif: tanpa scroll horizontal di HP, tablet, laptop', async () => {
      const editUrl = page.url();
      const targets = [
        ['/', 'beranda'],
        ['#/guru', 'dashboard'],
      ];
      const firstId = await page.$eval('[data-testid="config-card"]', (e) => e.dataset.id);
      targets.push([`#/guru/edit/${firstId}/kelompok`, 'kelompok'], [`#/guru/edit/${firstId}/soal`, 'soal']);
      for (const [w, h, label] of [[390, 844, 'hp'], [820, 1180, 'tablet'], [1366, 768, 'laptop']]) {
        await page.setViewportSize({ width: w, height: h });
        for (const [url, name] of targets) {
          await page.goto(BASE + url.replace(/^\//, ''));
          await page.waitForTimeout(250);
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          assert(over <= 0, `${label}/${name} melebar ${over}px`);
          await page.screenshot({ path: path.join(OUT, `${label}-${name}.png`), fullPage: true });
        }
      }
      void editUrl;
    });

    console.log('Tahap 2 — E2E');
    const sc = (fn, arg) => page.evaluate(fn, arg);
    const grid = () => sc(() => { const s = window.__jc.scene; const a = s.player.x / 32, b = s.player.y / 16; return { gx: (a + b) / 2, gy: (b - a) / 2 }; });
    const teleport = (gx, gy) => sc(([gx, gy]) => window.__jc.scene.player.setPosition((gx - gy) * 32, (gx + gy) * 16), [gx, gy]);
    const closeDialogs = async () => {
      for (let i = 0; i < 6 && (await page.isVisible(tid('lumi-dialog'))); i++) await page.click(`${tid('dialog-btn')} >> nth=-1`);
    };

    await step('Uji Coba Main: pilih kelompok & karakter', async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(BASE + '#/guru');
      await page.click('[data-act="edit"] >> nth=0');
      await page.click(tid('test-play'));
      await page.waitForSelector(tid('start-adventure'));
      assert((await page.$$(tid('pick-char'))).length === 4, '4 karakter');
      await page.click(`${tid('pick-group')} >> nth=1`);
      await page.click(`${tid('pick-char')} >> nth=3`);
      assert((await page.getAttribute(`${tid('pick-char')} >> nth=3`, 'aria-checked')) === 'true', 'karakter terpilih');
    });

    await step('Dunia dimuat < 15 detik, Lumi menyambut (3 dialog)', async () => {
      const t0 = Date.now();
      await page.click(tid('start-adventure'));
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`, { timeout: 15000 });
      console.log(`     (dimuat dalam ${((Date.now() - t0) / 1000).toFixed(1)} dtk)`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('Lumi'), 'dialog Lumi');
      assert(await sc(() => window.__jc.scene.player.characterId === 'kid-girl-b'), 'karakter sesuai pilihan');
      for (let i = 0; i < 3; i++) await page.click(tid('dialog-btn'));
      assert(!(await page.isVisible(tid('lumi-dialog'))), 'dialog tertutup');
      await page.screenshot({ path: path.join(OUT, 'game-start.png') });
    });

    await step('Keyboard: WASD berjalan, Shift berlari lebih cepat', async () => {
      const a = await grid();
      await page.keyboard.down('d');
      await page.waitForTimeout(600);
      await page.keyboard.up('d');
      const b = await grid();
      const walk = Math.hypot(b.gx - a.gx, b.gy - a.gy);
      assert(walk > 0.5, 'bergerak: ' + walk.toFixed(2));
      await page.keyboard.down('Shift');
      await page.keyboard.down('a');
      await page.waitForTimeout(600);
      await page.keyboard.up('a');
      await page.keyboard.up('Shift');
      const c = await grid();
      const run = Math.hypot(c.gx - b.gx, c.gy - b.gy);
      assert(run > walk * 1.3, `lari (${run.toFixed(2)}) > jalan (${walk.toFixed(2)})`);
    });

    await step('Jembatan terkunci sebelum Pos 1, golem minggir setelah Pos 2', async () => {
      const stand = (gx, gy) => sc(([gx, gy]) => window.__jc.scene.canStand((gx - gy) * 32, (gx + gy) * 16), [gx, gy]);
      assert(!(await stand(21, 15)), 'jembatan terkunci');
      await page.click(tid('btn-test'));
      await page.click(tid('complete-pos1'));
      await closeDialogs();
      assert(await stand(21, 15), 'jembatan terbuka');
      assert(!(await stand(40, 15)), 'golem masih menghadang');
      await page.click(tid('complete-pos2'));
      await closeDialogs();
      assert(await stand(40, 15), 'golem minggir');
      assert(!(await stand(21, 5)), 'sungai tetap tidak bisa diseberangi');
      const track = await page.textContent('[data-quest]');
      assert((track.match(/✅/g) || []).length === 2, 'progres 2 pos selesai');
    });

    await step('Mendekati pos memunculkan tombol E & dialog tantangan', async () => {
      await teleport(37.6, 15);
      await page.waitForTimeout(400);
      assert(await sc(() => window.__jc.scene.near === 'pos2'), 'dekat pos2');
      await page.keyboard.press('e');
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('sudah kalian taklukkan'), 'pesan pos selesai');
      await closeDialogs();
      await page.waitForTimeout(1200);
      assert(await sc(() => window.__jc.scene.region === 'desert'), 'wilayah gurun');
      await page.screenshot({ path: path.join(OUT, 'game-pos2.png') });
    });

    await step('Animasi lompat, interaksi, menang, kalah berjalan lalu kembali idle', async () => {
      for (const a of ['jump', 'interact', 'victory', 'defeat']) {
        await page.click(tid(`anim-${a}`));
        await page.waitForTimeout(150);
        assert(await sc((a) => window.__jc.scene.player.state === a, a), 'state ' + a);
        await page.waitForTimeout(a === 'victory' || a === 'defeat' ? 2300 : 700);
      }
      assert(await sc(() => window.__jc.scene.player.state === 'idle'), 'kembali idle');
    });

    await step('Peta penuh memperkecil kamera lalu kembali mengikuti', async () => {
      const z0 = await sc(() => window.__jc.scene.cameras.main.zoom);
      await page.click(tid('btn-map'));
      await page.waitForTimeout(2000);
      const z1 = await sc(() => window.__jc.scene.cameras.main.zoom);
      assert(z1 < z0 * 0.7, `zoom ${z0.toFixed(2)} → ${z1.toFixed(2)}`);
      await page.screenshot({ path: path.join(OUT, 'game-map.png') });
      await page.keyboard.press('m');
      await page.waitForTimeout(1800);
      assert(await sc(() => !!window.__jc.scene.cameras.main._follow), 'mengikuti lagi');
    });

    await step('Keluar menghentikan game & kembali ke editor', async () => {
      await page.click(tid('btn-exit'));
      assert((await page.textContent('.modal')).includes('Hasil sementara'), 'konfirmasi simpan');
      await page.click('[data-yes]');
      await page.waitForSelector(tid('save'));
      assert(!(await page.$('canvas')), 'canvas dihapus');
    });

    await step('HP: joystick sentuh menggerakkan karakter, tanpa scroll horizontal', async () => {
      const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      const m = await mctx.newPage();
      m.setDefaultTimeout(10000);
      m.on('pageerror', (e) => errors.push(e.message));
      const data = await page.evaluate(() => localStorage.getItem('jejak-cahaya:templates:v1'));
      await m.goto(BASE);
      await m.evaluate((d) => localStorage.setItem('jejak-cahaya:templates:v1', d), data);
      const id = JSON.parse(data)[0].id;
      await m.goto(BASE + '#/uji/' + id);
      await m.click(tid('start-adventure'));
      await m.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`, { timeout: 15000 });
      for (let i = 0; i < 3; i++) await m.click(tid('dialog-btn'));
      const g = () => m.evaluate(() => { const s = window.__jc.scene; return { x: s.player.x, y: s.player.y }; });
      const a = await g();
      const box = await m.locator('[data-joy]').boundingBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const cdp = await mctx.newCDPSession(m);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 40, y: cy }] });
      await m.waitForTimeout(700);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const b = await g();
      assert(b.x - a.x > 20, `joystick menggerakkan (${(b.x - a.x).toFixed(0)}px)`);
      const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(over <= 0, 'melebar ' + over);
      await m.screenshot({ path: path.join(OUT, 'hp-game.png') });
      await mctx.close();
    });

    console.log('Tahap 3 — E2E');
    // Template uji: 10 "ayat" (teks dummy Arab), 4 soal battle, 3 refleksi; Pos 1 memakai 6 ayat.
    const verses = Array.from({ length: 10 }, (_, i) => ({ id: `v${i + 1}`, instruction: 'Susun ayat', reference: `[DUMMY] Ayat ${i + 1}`, direction: 'rtl', translation: '', score: null,
      segments: [`أَلِف${i + 1}`, `بَاء${i + 1}`, `تَاء${i + 1}`, `ثَاء${i + 1}`] }));
    const mcs = Array.from({ length: 4 }, (_, i) => ({ id: `m${i + 1}`, question: `[DUMMY] Soal ${i + 1}?`, options: [`Salah${i}a`, `Benar${i}`, `Salah${i}b`], answer: 1, score: null }));
    const refl = [
      { id: 'r1', question: '[DUMMY] Apa yang kalian pelajari?', format: 'short_text', options: [], grading: 'manual', answer: null, maxScore: 10 },
      { id: 'r2', question: '[DUMMY] Sikap yang tepat?', format: 'choice', options: ['Sombong', 'Rendah hati'], grading: 'auto', answer: 1, maxScore: 10 },
      { id: 'r3', question: '[DUMMY] Perasaan kalian?', format: 'choice', options: ['Senang', 'Biasa'], grading: 'none', answer: null, maxScore: null },
    ];
    const T3 = 'tpl_e2e_tahap3';
    const seedTemplate = () =>
      page.evaluate(([T3, verses, mcs, refl]) => {
        const key = 'jejak-cahaya:templates:v1';
        const list = JSON.parse(localStorage.getItem(key) || '[]').filter((x) => x.id !== T3);
        const base = JSON.parse(JSON.stringify(list[0]));
        base.id = T3;
        base.identity.title = '[DUMMY] Ujian Tahap 3';
        base.rules = { ...base.rules, correctScore: 10, wrongPenalty: 2, completionBonus: 20, attemptsPerQuestion: 2, teamHearts: 3, pos1QuestionCount: 6, pos2QuestionCount: 0, shuffleQuestions: true, shuffleOptions: true, reflectionRequireAll: true, reflectionMinChars: 10 };
        base.timing = { ...base.timing, pos1Minutes: 10, pos2Minutes: 10, pos3Minutes: 10, totalMinutes: 60 };
        base.questionBank.pos[0].questions = verses;
        base.questionBank.pos[1].questions = mcs;
        base.questionBank.pos[2].questions = refl;
        list.push(base);
        localStorage.setItem(key, JSON.stringify(list));
      }, [T3, verses, mcs, refl]);
    const startGameAt = async () => {
      await page.goto(BASE + '#/guru'); // pindah dulu agar rute uji selalu dimuat ulang
      await page.waitForSelector(tid('config-list'));
      await page.goto(BASE + '#/uji/' + T3);
      await page.click(tid('start-adventure'));
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`, { timeout: 15000 });
      for (let i = 0; i < 3; i++) await page.click(tid('dialog-btn'));
    };
    const openPos = async (gx, gy) => {
      await teleport(gx, gy);
      await page.waitForTimeout(300);
      await page.keyboard.press('e');
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      await page.click(`${tid('dialog-btn')} >> nth=0`); // Mulai tantangan
    };
    const boardTexts = () => page.$$eval('[data-testid="vblock"]', (els) => els.map((e) => e.textContent));
    const currentVerse = async () => {
      const txt = await boardTexts();
      return verses.find((v) => v.segments.includes(txt[0]));
    };
    const solveBoard = async () => {
      const v = await currentVerse();
      for (let i = 0; i < v.segments.length; i++) {
        const now = await boardTexts();
        if (now[i] === v.segments[i]) continue;
        const j = now.indexOf(v.segments[i]);
        await page.click(`[data-testid="vblock"] >> nth=${i}`);
        await page.click(`[data-testid="vblock"] >> nth=${j}`);
      }
    };

    await step('Pengaturan: jumlah ayat Pos 1 dapat diatur', async () => {
      await seedTemplate();
      await page.goto(BASE + `#/guru/edit/${T3}/peraturan`);
      assert((await page.inputValue(tid('f-pos1count'))) === '6', 'nilai 6');
      assert((await page.textContent('.ed-panel')).includes('10 tersedia'), 'info ayat tersedia');
    });

    await step('Pos 1: puzzle 6 dari 10 ayat, urut mushaf, Arab kanan-ke-kiri', async () => {
      await startGameAt();
      await openPos(18, 15);
      await page.waitForSelector(tid('verse-puzzle'));
      assert((await page.textContent('.ch-count')).includes('dari 6'), '6 ayat');
      assert((await page.getAttribute('[data-board]', 'dir')) === 'rtl', 'rtl');
      const ids = await sc(() => window.__run.questions.pos1);
      const nums = ids.map((x) => Number(x.slice(1)));
      assert(nums.join() === [...nums].sort((a, b) => a - b).join(), 'urut: ' + nums);
      await page.waitForFunction(() => document.querySelector('[data-testid="hud-timer"]').textContent.includes('Pos 1'), null, { timeout: 3000 });
      await page.screenshot({ path: path.join(OUT, 'game-puzzle.png') });
    });

    await step('Pos 1: seret-dan-lepas memindahkan balok', async () => {
      const before = await boardTexts();
      const a = await page.locator('[data-testid="vblock"] >> nth=0').boundingBox();
      const b = await page.locator('[data-testid="vblock"] >> nth=3').boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2, { steps: 3 });
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
      await page.mouse.up();
      const after = await boardTexts();
      assert(after[3] === before[0], `balok pindah: ${before} → ${after}`);
    });

    await step('Pos 1: benar → skor & jembatan bertambah; salah 2x → susunan benar ditampilkan, nilai 0', async () => {
      await solveBoard();
      await page.click(tid('verse-check'));
      await page.waitForSelector('.fb.ok');
      assert((await page.textContent('.bridge-meter small')).includes('1/6'), 'jembatan 1/6');
      assert((await page.textContent(tid('hud-score'))).includes('10'), 'skor 10');
      await page.click(tid('verse-next'));
      // ayat ke-2: periksa tanpa mengubah (susunan acak pasti salah) dua kali
      await page.click(tid('verse-check'));
      await page.waitForSelector('.fb.bad');
      await page.click(tid('verse-check'));
      await page.waitForSelector('.fb.info');
      const v = await currentVerse();
      assert((await boardTexts()).join() === v.segments.join(), 'susunan benar ditampilkan');
      assert((await page.textContent(tid('hud-score'))).includes('6'), 'skor 10 − 2 − 2 = 6');
      await page.click(tid('verse-next'));
    });

    await step('Pos 1 selesai → jembatan tersambung', async () => {
      for (let k = 0; k < 4; k++) {
        await solveBoard();
        await page.click(tid('verse-check'));
        await page.waitForSelector('.fb.ok');
        await page.click(tid('verse-next'));
      }
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('Jembatan tersambung'), 'pesan jembatan');
      await closeDialogs();
      assert(await sc(() => window.__jc.scene.canStand((21 - 15) * 32, (21 + 15) * 16)), 'jembatan bisa dilalui');
      assert(await sc(() => window.__run.pos.pos1.status === 'done' && window.__run.pos.pos1.bonus === 20), 'bonus pos 1');
    });

    await step('Pos 2: salah → nyawa berkurang & kunci TIDAK ditampilkan', async () => {
      await openPos(37.6, 15);
      await page.waitForSelector(tid('battle-quiz'));
      assert((await page.textContent(tid('golem-hp'))).trim() === '4/4', 'energi 4/4');
      await page.screenshot({ path: path.join(OUT, 'game-battle.png') });
      const wrong = page.locator(tid('battle-opt'), { hasText: 'Salah' }).first();
      await wrong.click();
      await page.waitForSelector('.fb.bad');
      assert((await page.$$('.opt-btn.ok')).length === 0, 'kunci tidak ditampilkan');
      assert((await page.$$('.hearts span.on')).length === 2, 'nyawa 2');
    });

    await step('Pos 2: semua benar → energi golem habis, golem menyingkir', async () => {
      for (let k = 0; k < 4; k++) {
        await page.waitForSelector(`${tid('battle-opt')}:not([disabled])`);
        await page.locator(tid('battle-opt'), { hasText: 'Benar' }).first().click();
        await page.waitForTimeout(1200);
      }
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('Golem kalah'), 'golem kalah');
      await closeDialogs();
      assert(await sc(() => window.__jc.scene.canStand((40 - 15) * 32, (40 + 15) * 16)), 'jalan terbuka');
    });

    await step('Pos 3: refleksi satu per satu, validasi panjang jawaban', async () => {
      await openPos(53.4, 15);
      await page.waitForSelector(tid('reflection'));
      await page.fill(tid('reflect-text'), 'pendek');
      await page.click(tid('reflect-save'));
      assert((await page.textContent('.ch-feedback')).includes('terlalu singkat'), 'validasi panjang');
      await page.fill(tid('reflect-text'), 'Kami belajar untuk rendah hati dan jujur.');
      await page.click(tid('reflect-save'));
      await page.click('.reflect-choice >> nth=1');
      await page.click(tid('reflect-save'));
      await page.click('.reflect-choice >> nth=0');
      await page.click(tid('reflect-save'));
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('Penjelajah Cahaya'), 'gelar');
    });

    await step('Layar akhir: nilai akhir, lalu Jawaban Soal Battle Quiz di bawahnya', async () => {
      await closeDialogs(); // pesan gelar → tombol Lihat Hasil
      await page.waitForSelector(tid('result-sheet'));
      const shown = Number((await page.textContent(`${tid('final-score')} b`)).trim());
      // Pos1: 5×10 −2 −2 +20 = 66 · Pos2: 4×10 −2 +20 = 58 · Pos3: auto 10 + 20 = 30 → 154
      assert(shown === 154, 'nilai akhir ' + shown);
      const keys = await page.textContent(tid('battle-keys'));
      assert(keys.includes('Benar0') && keys.includes('Kunci jawaban'), 'kunci battle tampil');
      const yScore = (await page.locator(tid('final-score')).boundingBox()).y;
      const yKeys = (await page.locator(tid('battle-keys')).boundingBox()).y;
      assert(yKeys > yScore, 'kunci di bawah nilai');
      assert((await page.textContent(tid('result-sheet'))).includes('Penjelajah Cahaya'), 'gelar di lembar hasil');
      await page.screenshot({ path: path.join(OUT, 'game-result.png'), fullPage: false });
    });

    await step('Unduh hasil: CSV (Excel) & JSON', async () => {
      const [d1] = await Promise.all([page.waitForEvent('download'), page.click(tid('dl-csv'))]);
      const f1 = path.join(OUT, 'hasil.csv');
      await d1.saveAs(f1);
      const csv = fs.readFileSync(f1, 'utf8');
      assert(csv.includes('Skor total;154') && csv.includes('Kunci'), 'isi CSV');
      assert(d1.suggestedFilename().endsWith('.csv'), 'nama file');
      const [d2] = await Promise.all([page.waitForEvent('download'), page.click(tid('dl-json'))]);
      const f2 = path.join(OUT, 'hasil.json');
      await d2.saveAs(f2);
      const j = JSON.parse(fs.readFileSync(f2, 'utf8'));
      assert(j.summary.score === 154 && j.details.length === 13, 'isi JSON');
    });

    await step('Waktu pos habis: tantangan ditutup, nilai 0, jalan tetap terbuka', async () => {
      await startGameAt();
      await openPos(18, 15);
      await page.waitForSelector(tid('verse-puzzle'));
      await sc(() => (window.__run.pos.pos1.startedAt -= 11 * 60 * 1000));
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`);
      assert((await page.textContent(tid('lumi-dialog'))).includes('habis'), 'pesan waktu habis');
      assert(!(await page.isVisible(tid('verse-puzzle'))), 'puzzle ditutup');
      await closeDialogs();
      assert(await sc(() => window.__run.pos.pos1.timeout && window.__run.pos.pos2.status === 'active'), 'pos 2 terbuka');
      assert(await sc(() => window.__jc.scene.canStand((21 - 15) * 32, (21 + 15) * 16)), 'jembatan terbuka');
    });

    await step('Keluar di tengah permainan menyimpan hasil sementara', async () => {
      await page.click(tid('btn-exit'));
      await page.click('[data-yes]');
      await page.waitForSelector(tid('save'));
      await page.goto(BASE + '#/guru');
      await page.waitForSelector(tid('result-card'));
      const txt = await page.textContent(tid('result-list'));
      assert(txt.includes('Belum selesai') && txt.includes('Penjelajah Cahaya'), 'dua hasil tersimpan');
    });

    await step('Dashboard: lihat hasil & unduh CSV dari Hasil Tersimpan', async () => {
      const card = page.locator(tid('result-card'), { hasText: 'Penjelajah Cahaya' });
      await card.locator('[data-ract="view"]').click();
      await page.waitForSelector(`.modal ${tid('battle-keys')}`);
      await page.click('[data-close]');
      const [d] = await Promise.all([page.waitForEvent('download'), card.locator('[data-ract="csv"]').click()]);
      const f = path.join(OUT, 'hasil-dashboard.csv');
      await d.saveAs(f);
      assert(fs.readFileSync(f, 'utf8').includes('Skor total;154'), 'csv dashboard');
    });

    await step('Mode Siswa: dari beranda memilih ujian siap lalu bermain', async () => {
      await page.goto(BASE + '#/');
      await page.click(tid('go-student'));
      await page.waitForSelector(tid('student-exams'));
      const n = await page.$$(tid('student-start'));
      assert(n.length >= 1, 'ada ujian siap');
      await page.click(`${tid('student-start')} >> nth=0`);
      await page.click(tid('start-adventure'));
      await page.waitForSelector(`${tid('lumi-dialog')}:not([hidden])`, { timeout: 15000 });
      assert(!(await page.$(tid('btn-test'))), 'panel uji guru tidak tampil untuk siswa');
      for (let i = 0; i < 3; i++) await page.click(tid('dialog-btn'));
      await page.click(tid('btn-exit'));
      await page.click('[data-yes]');
      await page.waitForSelector(tid('student-exams'));
    });

    await step('Tidak ada error JavaScript selama pengujian', async () => {
      assert(errors.length === 0, errors.join(' | '));
    });
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\n${passed} lolos, ${failures.length} gagal`);
  process.exit(failures.length ? 1 : 0);
})();
