// Konstanta global Jejak Cahaya. Tidak berisi materi pelajaran apa pun:
// semua soal berasal dari bank soal yang dibuat guru.

export const GAME_ID = 'Jejak Cahaya';
export const BANK_VERSION = '1.0';
export const CONFIG_FORMAT = 'jejak-cahaya/config';
export const CONFIG_VERSION = 1;

/** Definisi tiga pos. Urutan array = urutan perjalanan. */
export const POS_DEFS = [
  {
    id: 'pos1',
    type: 'verse_puzzle',
    name: 'Jembatan Wahyu',
    mechanic: 'Puzzle Susun Ayat',
    region: 'Hutan & Sungai',
    icon: '📖',
  },
  {
    id: 'pos2',
    type: 'battle_quiz',
    name: 'Lembah Kaum Tsamud',
    mechanic: 'Battle Quiz',
    region: 'Gurun & Tebing Batu',
    icon: '⚔️',
  },
  {
    id: 'pos3',
    type: 'reflection',
    name: 'Taman Cahaya',
    mechanic: 'Refleksi Pembelajaran',
    region: 'Taman Bercahaya',
    icon: '🌿',
  },
];

export const POS_BY_ID = Object.fromEntries(POS_DEFS.map((p) => [p.id, p]));
export const POS_BY_TYPE = Object.fromEntries(POS_DEFS.map((p) => [p.type, p]));

/** Empat karakter penjelajah (lihat src/ui/characters.js untuk gambarnya). */
export const CHARACTERS = [
  { id: 'kid-boy-a', name: 'Kid Laki-laki A', desc: 'Helm penjelajah, pakaian petualang, tas punggung' },
  { id: 'kid-girl-a', name: 'Kid Perempuan A', desc: 'Pakaian penjelajah dengan kerudung' },
  { id: 'kid-boy-b', name: 'Kid Laki-laki B', desc: 'Topi petualang, peta, tas punggung' },
  { id: 'kid-girl-b', name: 'Kid Perempuan B', desc: 'Kerudung dan perlengkapan penjelajah' },
];
export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);
export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export const REFLECTION_FORMATS = ['choice', 'short_text'];
export const REFLECTION_GRADING = ['none', 'auto', 'manual'];
export const VERSE_DIRECTIONS = ['rtl', 'ltr'];

export const LIMITS = {
  minGroups: 1,
  maxGroups: 12,
  groupNameMax: 40,
  minSegments: 2,
  maxSegments: 12,
  minOptions: 2,
  maxOptions: 6,
  maxMinutes: 180,
};
