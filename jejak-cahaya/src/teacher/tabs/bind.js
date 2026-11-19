// Mengikat elemen form ber-atribut data-path ke draf konfigurasi.
//   <input data-path="identity.title">            → teks
//   <input type="number" data-path="timing.x">    → angka
//   <input type="checkbox" data-path="rules.y">   → boolean

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

export function bindFields(container, ctx, { onChange } = {}) {
  container.querySelectorAll('[data-path]').forEach((el) => {
    const path = el.dataset.path;
    const v = getPath(ctx.t, path);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
    const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      let value;
      if (el.type === 'checkbox') value = el.checked;
      else if (el.type === 'number') value = el.value === '' ? NaN : Number(el.value);
      else value = el.value;
      ctx.change((t) => setPath(t, path, value));
      onChange?.(path, value);
    });
  });
}

/** Menampilkan daftar pesan pemeriksaan untuk satu tab. */
export function issuesHTML(check, tab) {
  const errs = check.errors.filter((e) => e.tab === tab);
  const warns = check.warnings.filter((e) => e.tab === tab);
  if (!errs.length && !warns.length) return '';
  return `<ul class="issues">${errs.map((e) => `<li class="issue err">✖ ${e.message}</li>`).join('')}${warns
    .map((e) => `<li class="issue warn">⚠ ${e.message}</li>`)
    .join('')}</ul>`;
}
