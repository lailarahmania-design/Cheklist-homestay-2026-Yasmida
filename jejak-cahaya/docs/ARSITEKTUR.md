# Arsitektur

## Gambaran umum

```
┌──────────────── Klien (browser) ────────────────┐
│ Beranda ─ Mode Guru ─ Mode Siswa                 │
│ UI: HTML/CSS + JS modul (tanpa framework)         │
│ Game: Phaser 3 (Tahap 2+, dimuat hanya saat main) │
│ Lapisan data: getAdapter()                        │
│   ├─ LocalAdapter    (Tahap 1–3, pengembangan)    │
│   └─ SupabaseAdapter (Tahap 4+, mode online)      │
└───────────────────────┬──────────────────────────┘
                        │ HTTPS / WebSocket
┌──────────────────── Supabase ────────────────────┐
│ Auth: guru (email+password), siswa (anonim)       │
│ Postgres + Row Level Security                     │
│ RPC SECURITY DEFINER: join_session, submit_answer,│
│   control_session, server_now                     │
│ Realtime: Broadcast (posisi), Presence (koneksi), │
│   perubahan tabel (skor & status)                 │
└───────────────────────────────────────────────────┘
```

## Keputusan desain yang disepakati

1. Proyek berdiri sendiri (repo baru), di-host di **GitHub Pages**.
2. Mode final **online saja** (Supabase). LocalAdapter hanya untuk pengembangan Tahap 1–3.
3. Aset visual dibuat sendiri (SVG chibi) mengikuti referensi.
4. Puzzle ayat memakai **teks Arab, kanan ke kiri** (bisa diganti ke LTR per soal).
5. Battle Quiz: kelompok punya **nyawa**; jawaban salah = serangan balasan golem (−1 nyawa,
   ditambah penalti skor bila diatur). Nyawa habis → mengulang pertarungan dengan soal yang belum
   terjawab benar; skor yang sudah diperoleh tetap.
6. Waktu pos habis → jalan tetap terbuka, soal tersisa bernilai 0, guru dapat memberi waktu tambahan.
7. **Proyektor = tampilan desktop guru** (peta & dashboard). Setiap kelompok bermain di perangkat
   masing-masing secara bersamaan. (Mode "bergiliran di satu perangkat" dari rancangan awal tidak dipakai.)
8. Refleksi: penilaian diatur per soal (tidak dinilai / otomatis untuk pilihan / manual oleh guru).

## Modul

| Modul | Folder | Tahap |
|---|---|---|
| Configuration manager | `src/config` | 1 |
| Question bank | `src/question-bank` | 1 |
| Teacher dashboard | `src/teacher` | 1 (dasar), 4 (real-time) |
| Data adapter | `src/data` | 1 (lokal), 4 (Supabase) |
| Core game engine | `src/game/scenes` | 2 |
| Character, camera, world map | `src/game/systems` | 2 |
| Quest system | `src/game/systems/quest` | 3 |
| Scoring system | `src/scoring` + RPC server | 3–4 |
| Multiplayer sync | `src/multiplayer` | 4 |
| Result manager | `src/results` | 5 |

## Keamanan (Tahap 4)

- Kunci jawaban disimpan di tabel terpisah yang hanya dapat dibaca pemilik konfigurasi (guru).
  Klien siswa hanya menerima soal tanpa kunci.
- Jawaban dikirim ke RPC `submit_answer`. Server yang mencocokkan, menghitung skor, dan
  menolak pengiriman ganda (constraint unik sesi + kelompok + soal + percobaan).
- Timer dihitung dari `started_at` dan total jeda di server; klien hanya menampilkan.
- Link/QR sesi hanya memuat **kode sesi**, tanpa kunci jawaban atau data rahasia.
- Setiap kelompok terikat ke `auth.uid()` siswa anonim; RLS membatasi akses ke data kelompok sendiri.

## Tahap 2: dunia game

- **Peta** (`game/systems/world-map.js`): satu pulau isometrik 58×30 tile (tile 64×32). Wilayah berurutan
  sepanjang jalur batu keemasan: Hutan → Sungai + Jembatan Wahyu → Lembah Kaum Tsamud (ngarai dengan golem)
  → Taman Cahaya (pohon cahaya, air mancur, prasasti). Dekorasi memakai benih acak tetap, sehingga peta selalu
  sama di semua perangkat. Ini penting untuk sinkronisasi posisi di Tahap 4.
- **Kunci wilayah**: jembatan tidak bisa dilalui sampai Pos 1 selesai; golem menutup ngarai sampai Pos 2 selesai.
  Konektivitas ini diuji otomatis (`tests/unit/world-map.test.js`).
- **Karakter** (`character-rig.js`): tekstur SVG tampak depan/belakang + animasi prosedural
  idle, walk, run, jump, interact, victory, defeat (squash & stretch, partikel debu/bintang).
- **Lumi** (`lumi.js`): mengikuti karakter dengan jeda halus, bercahaya, berekspresi senang/sedih.
- **Kamera** (`camera.js`): follow dengan lerp 0.08, zoom bertambah otomatis di area misi, mode peta penuh.
- **Input** (`input.js`): keyboard + joystick sentuh HTML.
- Phaser dimuat terpisah (`import()`) hanya saat bermain, sehingga halaman guru tetap ringan.
- Tanah dirender sekali ke RenderTexture dengan `batchDraw` (waktu muat ±1 detik).

## Tahap 3: tantangan & penilaian

- `src/scoring/run.js`: satu "run" per kelompok, berisi soal terpilih (benih acak tetap), jawaban, nyawa, status & waktu pos.
  Fungsi murni: `selectQuestions`, `recordAnswer` (menolak jawaban ganda, pos tertutup, dan kesempatan habis),
  `finishPos` (bonus hanya bila tidak kehabisan waktu), `totals` (total tidak negatif). Pada Tahap 4 logika yang sama
  dipindahkan ke server, sehingga kunci jawaban tidak lagi dikirim ke perangkat siswa.
- `src/student/challenges/`: `verse-puzzle.js` (seret-dan-lepas, ketuk-tukar, keyboard; RTL), `battle-quiz.js`, `reflection.js`.
- `src/results/`: `result-report.js` (ringkasan, rincian, CSV/JSON) dan `result-sheet.js` (lembar hasil HTML untuk layar akhir,
  dashboard, dan cetak). Hasil disimpan lewat `adapter.saveResult`.
