import { describe, it, expect, beforeAll } from 'vitest';

describe('router', () => {
  let r;
  const hits = [];
  beforeAll(async () => {
    globalThis.location = { hash: '' };
    globalThis.window = { addEventListener() {}, scrollTo() {} };
    globalThis.history = { replaceState() {} };
    r = await import('../../src/core/router.js');
    r.route('/', (p) => hits.push(['home', p]));
    r.route('/guru', (p) => hits.push(['guru', p]));
    r.route('/guru/edit/:id/:tab?', (p) => hits.push(['edit', p]));
  });
  const go = async (h) => {
    location.hash = h;
    r.refresh();
    await new Promise((s) => setTimeout(s, 1));
  };
  it('mencocokkan rute & parameter opsional', async () => {
    await go('#/');
    await go('#/guru');
    await go('#/guru/edit/abc');
    await go('#/guru/edit/abc/soal');
    expect(hits).toEqual([
      ['home', {}],
      ['guru', {}],
      ['edit', { id: 'abc', tab: undefined }],
      ['edit', { id: 'abc', tab: 'soal' }],
    ]);
  });
});
