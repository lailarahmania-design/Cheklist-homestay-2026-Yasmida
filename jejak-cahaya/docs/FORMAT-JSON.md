# Format JSON

Ada dua jenis file:

| File | Diimpor dari | Isi |
|---|---|---|
| **Bank soal** | Editor → tab *Bank Soal* → *Impor JSON* | hanya soal ketiga pos |
| **Konfigurasi** | Dashboard → *Impor Konfigurasi* | identitas, kelompok, waktu, peraturan, dan bank soal |

> Kedua file berisi **kunci jawaban**. Simpan khusus untuk guru.

## Bank soal

```json
{
  "game": "Jejak Cahaya",
  "version": "1.0",
  "pos": [
    { "id": "pos1", "type": "verse_puzzle", "questions": [ ... ] },
    { "id": "pos2", "type": "battle_quiz",  "questions": [ ... ] },
    { "id": "pos3", "type": "reflection",   "questions": [ ... ] }
  ]
}
```

Pos yang tidak ditulis dianggap kosong (muncul peringatan). Kolom yang diawali `_`
(mis. `_petunjuk`) diabaikan.

### Pos 1 · `verse_puzzle`

| Kolom | Wajib | Keterangan |
|---|---|---|
| `id` | disarankan | unik di seluruh bank; dibuat otomatis jika kosong |
| `segments` | ✔ | 2–12 potongan, ditulis **sesuai urutan yang benar** (game yang mengacak) |
| `direction` | | `"rtl"` (Arab, bawaan) atau `"ltr"` |
| `instruction` | | petunjuk untuk siswa |
| `reference` | | rujukan, mis. nama surah dan nomor ayat |
| `translation` | | terjemahan, ditampilkan setelah jembatan tersambung |
| `score` | | angka ≥ 0; kosong = skor bawaan dari Peraturan |

### Pos 2 · `battle_quiz`

| Kolom | Wajib | Keterangan |
|---|---|---|
| `question` | ✔ | teks pertanyaan |
| `options` | ✔ | 2–6 pilihan |
| `answer` | ✔ | nomor urut pilihan yang benar, **dimulai dari 0** |
| `score` | | seperti di atas |

### Pos 3 · `reflection`

| Kolom | Wajib | Keterangan |
|---|---|---|
| `question` | ✔ | pertanyaan reflektif |
| `format` | | `"short_text"` (isian singkat, bawaan) atau `"choice"` (pilihan situasi) |
| `options` | jika `choice` | 2–6 pilihan situasi |
| `grading` | | `"none"` (tidak dinilai), `"auto"` (khusus `choice`, butuh `answer`), `"manual"` (dinilai guru) |
| `answer` | jika `auto` | nomor urut pilihan, mulai dari 0 |
| `maxScore` | | skor maksimal bila dinilai |

## Gabung vs ganti

- **Gabungkan**: soal baru ditambahkan di belakang soal lama. ID yang bentrok diganti otomatis.
- **Ganti**: seluruh bank lama dihapus (perlu konfirmasi dua kali).

## File konfigurasi

```json
{
  "format": "jejak-cahaya/config",
  "formatVersion": 1,
  "exportedAt": "2026-11-19T03:00:00.000Z",
  "template": {
    "identity": { "title": "", "subject": "", "chapter": "", "className": "", "teacherName": "", "description": "" },
    "groups": [ { "id": "g_…", "name": "Kelompok 1", "character": "kid-boy-a", "order": 0 } ],
    "timing": { "pos1Minutes": 10, "pos2Minutes": 15, "pos3Minutes": 10, "totalMinutes": 40, "allowExtraTime": true, "extraTimeMinutes": 5 },
    "rules": { "correctScore": 10, "wrongPenalty": 0, "completionBonus": 20, "attemptsPerQuestion": 2, "teamHearts": 3,
               "pos2QuestionCount": 0, "shuffleQuestions": true, "shuffleOptions": true,
               "reflectionRequireAll": true, "reflectionMinChars": 10 },
    "settings": { "allowCharacterSelect": true },
    "questionBank": { "...": "format bank soal di atas" }
  }
}
```

Karakter: `kid-boy-a`, `kid-girl-a`, `kid-boy-b`, `kid-girl-b`.
Konfigurasi yang diimpor selalu mendapat ID baru, sehingga tidak menimpa konfigurasi yang ada.
