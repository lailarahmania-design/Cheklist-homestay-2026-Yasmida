// Titik masuk lapisan data. Semua modul lain hanya memanggil getAdapter(),
// sehingga peralihan ke Supabase (Tahap 4) tidak mengubah kode tampilan.
//
// Antarmuka DataAdapter:
//   listTemplates(): Promise<Template[]>
//   getTemplate(id): Promise<Template|null>
//   saveTemplate(template): Promise<Template>
//   deleteTemplate(id): Promise<void>
// (Tahap 4 menambahkan: auth, sesi, join, submitAnswer, realtime.)

import { LocalAdapter, memoryStorage } from './local-adapter.js';

let instance = null;

function safeLocalStorage() {
  try {
    const k = '__jc_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return { storage: window.localStorage, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
  }
}

export function getAdapter() {
  if (!instance) {
    const { storage, persistent } = safeLocalStorage();
    instance = new LocalAdapter(storage);
    instance.persistent = persistent;
  }
  return instance;
}
