// Utilitas tampilan: escape HTML, toast, modal, konfirmasi, unduh & baca file.

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let toastBox;
export function toast(message, type = 'info') {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toast-box';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  toastBox.appendChild(el);
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

/**
 * Membuka modal. `render(body, close)` mengisi isi modal.
 * @returns {{close:Function, el:HTMLElement}}
 */
export function openModal({ title, wide = false, render, onClose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal panel ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-head">
        <h2 id="modal-title">${esc(title)}</h2>
        <button type="button" class="icon-btn" data-close aria-label="Tutup">✕</button>
      </header>
      <div class="modal-body"></div>
    </div>`;
  const prevFocus = document.activeElement;
  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
    prevFocus?.focus?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  const body = backdrop.querySelector('.modal-body');
  render(body, close);
  const first = body.querySelector('input, textarea, select, button');
  first?.focus();
  return { close, el: backdrop };
}

/** Dialog konfirmasi. @returns {Promise<boolean>} */
export function confirmDialog({ title = 'Konfirmasi', message, okText = 'Ya', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openModal({
      title,
      onClose: () => !answered && resolve(false),
      render(body, close) {
        body.innerHTML = `<p class="confirm-msg">${esc(message)}</p>
          <div class="actions">
            <button type="button" class="btn btn-ghost" data-no>Batal</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(okText)}</button>
          </div>`;
        body.querySelector('[data-no]').onclick = () => close();
        body.querySelector('[data-yes]').onclick = () => {
          answered = true;
          resolve(true);
          close();
        };
      },
    });
  });
}

export function downloadJSON(filename, data) {
  downloadText(filename, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s) {
  return (
    String(s || 'ujian')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'ujian'
  );
}

/** Membuka pemilih file dan membaca isinya sebagai teks. */
export function pickTextFile(accept = '.json,application/json') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return resolve(null);
      if (file.size > 5 * 1024 * 1024) return reject(new Error('Ukuran file lebih dari 5 MB.'));
      file.text().then((text) => resolve({ name: file.name, text }), reject);
    });
    document.body.appendChild(input);
    input.click();
  });
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
