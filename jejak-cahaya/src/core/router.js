// Router hash sederhana (#/guru, #/guru/edit/ID/tab). Cocok untuk GitHub Pages
// karena tidak membutuhkan pengaturan server.

const routes = [];
let leaveGuard = null;
let current = '';

/**
 * Daftarkan rute. Pola: "/guru/edit/:id/:tab?" (tanda ? = opsional).
 */
export function route(pattern, handler) {
  const keys = [];
  const src = pattern
    .split('/')
    .filter(Boolean)
    .map((part) => {
      const m = /^:(\w+)(\?)?$/.exec(part);
      if (!m) return '/' + part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keys.push(m[1]);
      return m[2] ? '(?:/([^/]+))?' : '/([^/]+)';
    })
    .join('');
  routes.push({ re: new RegExp('^' + (src || '/') + '/?$'), keys, handler });
}

/** Pasang penjaga: fungsi async yang mengembalikan false untuk membatalkan pindah halaman. */
export function setLeaveGuard(fn) {
  leaveGuard = fn;
}

export function navigate(path) {
  if (location.hash === '#' + path) resolve();
  else location.hash = path;
}

async function resolve() {
  const path = location.hash.replace(/^#/, '') || '/';
  if (path === current) return;
  if (leaveGuard) {
    const ok = await leaveGuard(path);
    if (!ok) {
      history.replaceState(null, '', '#' + current);
      return;
    }
    leaveGuard = null;
  }
  current = path;
  for (const r of routes) {
    const m = r.re.exec(path);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1] ? decodeURIComponent(m[i + 1]) : undefined]));
      window.scrollTo(0, 0);
      return r.handler(params);
    }
  }
  location.hash = '/';
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

/** Paksa render ulang rute saat ini (mis. setelah data berubah). */
export function refresh() {
  current = '';
  resolve();
}
