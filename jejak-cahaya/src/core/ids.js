/** Membuat ID pendek acak dengan awalan, mis. "q_k3f9a2x1". */
export function newId(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join('')
      : Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36).slice(-4)}${rand}`;
}

/** Deep clone untuk data JSON murni. */
export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
