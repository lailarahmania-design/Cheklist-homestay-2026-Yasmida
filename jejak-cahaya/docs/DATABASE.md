# Rancangan Database (Supabase, Tahap 4)

> Status: **rancangan**. Migrasi SQL dibuat dan diuji pada Tahap 4. Pada Tahap 1, data yang sama
> disimpan di browser oleh `LocalAdapter` dengan bentuk objek yang identik dengan file konfigurasi.

## Pemisahan data

- **Template** = konfigurasi yang dapat dipakai berulang (identitas, kelompok, waktu, aturan, bank soal).
- **Sesi** = satu kali permainan. Saat sesi dibuat, isi template **disalin** ke sesi, sehingga
  mengedit template tidak mengubah sesi yang sedang berjalan.

## Tabel

| Tabel | Kolom utama | Akses |
|---|---|---|
| `templates` | id, owner_id → auth.users, identity jsonb, timing jsonb, rules jsonb, settings jsonb, updated_at | pemilik saja |
| `template_groups` | id, template_id, name, character, sort_order | pemilik saja |
| `questions` | id, template_id, pos_id, sort_order, type, payload jsonb (**tanpa kunci**), score | pemilik saja |
| `question_keys` | question_id, answer jsonb (urutan benar / indeks kunci) | pemilik saja; **tidak pernah** ke siswa |
| `sessions` | id, code (6 huruf), owner_id, snapshot jsonb, status (`lobby/running/paused/ended`), started_at, paused_total, ended_at | guru: penuh; siswa: baca kolom publik via RPC |
| `session_questions` | session_id, question_id, pos_id, payload (tanpa kunci), score | siswa sesi tersebut: baca |
| `session_keys` | session_id, question_id, answer | tidak ada akses langsung; hanya fungsi `SECURITY DEFINER` |
| `session_groups` | id, session_id, group_ref, name, character, auth_uid, current_pos, pos_x, pos_y, hearts, score, last_seen, finished_at | guru: semua; siswa: kelompoknya saja |
| `answers` | id, session_id, group_id, question_id, attempt, response jsonb, correct bool, points, created_at, **unique(session_id, group_id, question_id, attempt)** | guru: semua; siswa: miliknya, hanya lewat RPC |
| `manual_grades` | answer_id, points, graded_by, graded_at | guru |

## Fungsi (RPC)

| Fungsi | Pemanggil | Tugas |
|---|---|---|
| `create_session(template_id)` | guru | salin template ke sesi, buat kode unik |
| `join_session(code, group_ref, character)` | siswa (anonim) | ikat `auth.uid()` ke kelompok; tolak jika sudah diambil perangkat lain (kecuali bergabung kembali) |
| `control_session(session_id, action)` | guru | `start`, `pause`, `resume`, `end`, `add_time`, `reset` |
| `submit_answer(session_id, question_id, response)` | siswa | cek status & waktu server, cocokkan kunci, hitung poin dan nyawa, simpan; tolak pengiriman ganda |
| `server_now()` | semua | jam server untuk sinkronisasi timer |

## Realtime

- **Broadcast** `session:{id}`: posisi karakter (±10 kali/detik, tidak disimpan), event mulai/jeda.
- **Presence**: status koneksi tiap kelompok untuk dashboard guru.
- **Postgres changes** pada `session_groups`: skor, pos aktif, status selesai.
- Posisi terakhir juga disimpan berkala (±5 detik) agar kelompok bisa bergabung kembali di tempat yang sama.
