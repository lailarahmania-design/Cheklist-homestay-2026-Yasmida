# Jejak Cahaya — The Last Journey

Game petualangan edukatif berbasis web untuk **ujian akhir bab secara berkelompok**.
Siswa menjelajahi dunia isometrik melalui tiga pos ujian, sementara guru mengatur dan memantau permainan.

| Pos | Wilayah | Mekanisme |
|---|---|---|
| 1 | Jembatan Wahyu (hutan & sungai) | Puzzle menyusun potongan ayat (Arab, kanan ke kiri) |
| 2 | Lembah Kaum Tsamud (gurun & tebing) | Battle Quiz melawan golem batu |
| 3 | Taman Cahaya (taman bercahaya) | Refleksi pembelajaran |

Aplikasi **tidak terikat pada satu materi**. Semua soal berasal dari bank soal yang dibuat guru.

## Status pengembangan

| Tahap | Isi | Status |
|---|---|---|
| 1 | Fondasi: beranda, dashboard guru, konfigurasi ujian, kelompok, bank soal manual & JSON | ✅ Selesai |
| 2 | Phaser, pilih karakter, animasi, kamera isometrik, peta 3 wilayah | ✅ Selesai |
| 3 | Puzzle ayat, Battle Quiz, refleksi, skor & progres | ⏳ |
| 4 | Supabase: login guru, kode/QR sesi, multiplayer real-time, validasi skor di server | ⏳ |
| 5 | Rekap, peringkat, ekspor CSV/XLSX/JSON, pengujian menyeluruh | ⏳ |

> **Catatan Tahap 1:** konfigurasi masih disimpan di browser (localStorage) melalui `LocalAdapter`.
> Di Tahap 4 penyimpanan pindah ke Supabase dengan login guru, tanpa mengubah kode tampilan.

## Mencoba game (Tahap 2)

Buka konfigurasi di Mode Guru → **▶ Uji Coba Main** → pilih kelompok & karakter → **Mulai Petualangan**.

| Aksi | Laptop | HP / tablet |
|---|---|---|
| Berjalan | WASD / tombol panah | joystick kiri bawah |
| Berlari | tahan Shift | tarik joystick penuh |
| Lompat | Spasi | tombol ⤒ |
| Interaksi (pos, papan) | E / Enter | tombol ✋ |
| Peta penuh | M / tombol 🗺️ | tombol 🗺️ |

Panel 🧪 (khusus uji coba guru): jelajah bebas, simulasi pos selesai, dan uji animasi.

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev        # server pengembangan → http://localhost:5173
npm test           # unit test (Vitest)
npm run build      # hasil build di folder dist/
npm run test:e2e   # uji E2E di Chromium (jalankan setelah build; butuh Playwright)
```

Push ke branch `main` akan menjalankan tes, build, dan deploy ke **GitHub Pages**
(aktifkan di *Settings → Pages → Source: GitHub Actions*).

## Struktur folder

```
jejak-cahaya/
├─ index.html                 satu halaman (router hash: #/, #/guru, #/guru/edit/ID/tab)
├─ src/
│  ├─ main.js                 titik masuk & daftar rute
│  ├─ core/                   konstanta (pos, karakter), router, pembuat ID
│  ├─ data/                   DataAdapter → LocalAdapter (Tahap 1) / SupabaseAdapter (Tahap 4)
│  ├─ config/                 model template, pemeriksaan kesiapan, ekspor/impor konfigurasi
│  ├─ question-bank/          skema & validasi bank soal, operasi tambah/gabung/ganti
│  ├─ teacher/                dashboard, editor, dan tab-tab konfigurasi
│  ├─ home/                   beranda
│  ├─ student/                halaman bermain (pilih kelompok/karakter, HUD, dialog Lumi, joystick)
│  ├─ game/                   Phaser: scenes/, systems/ (peta, karakter, Lumi, kamera, input, misi), art/
│  ├─ ui/                     ilustrasi karakter & Lumi (SVG), modal, toast, unduh file
│  └─ styles/                 tema petualangan (palet hijau hutan, krem, emas, cokelat, biru air)
├─ tests/unit/                Vitest
├─ tests/e2e/                 alur lengkap Mode Guru & uji coba game di Chromium
└─ docs/                      ARSITEKTUR, FORMAT-JSON, DATABASE
```

Dokumentasi lanjutan:
- [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md): arsitektur, modul, rencana tiap tahap
- [docs/FORMAT-JSON.md](docs/FORMAT-JSON.md): format bank soal & file konfigurasi
- [docs/DATABASE.md](docs/DATABASE.md): rancangan skema Supabase & aturan keamanan

## Aset visual

Karakter (4 penjelajah chibi) dan Lumi digambar sebagai SVG di `src/ui/characters.js`,
mengikuti lembar konsep referensi. Gambar yang sama dipakai sebagai tekstur Phaser (tampak depan & belakang).
Aset lingkungan (pohon, gerbang bercahaya, golem, kuil batu, pohon cahaya, prasasti, dll.)
ada di `src/game/art/objects.js`; tile isometrik digambar di `src/game/art/textures.js`.
