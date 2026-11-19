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
