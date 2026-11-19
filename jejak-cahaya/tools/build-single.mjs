// Menghasilkan jejak-cahaya.html (satu file) dari hasil `vite build --config vite.single.config.js`.
//   node tools/build-single.mjs [--fragment] [output]
//   --fragment : tanpa <!doctype>/<html>/<head>/<body> (untuk halaman Artifact)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const out = args.find((a) => !a.startsWith('--')) || 'jejak-cahaya.html';
const dir = 'dist-single/assets';
const files = readdirSync(dir);
const js = readFileSync(join(dir, files.find((f) => f.endsWith('.js'))), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(dir, files.find((f) => f.endsWith('.css'))), 'utf8').replace(/<\/style/gi, '<\\/style');

const head = `<title>Jejak Cahaya</title>
<meta name="description" content="Game petualangan edukatif untuk ujian akhir bab secara berkelompok.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap">
<style>${css}</style>`;
const body = `<div id="app"><noscript>Aktifkan JavaScript untuk memainkan Jejak Cahaya.</noscript></div>
<script type="module">${js}</script>`;

const html = fragment
  ? `${head}\n${body}\n`
  : `<!doctype html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="theme-color" content="#2f5d34">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
writeFileSync(out, html);
console.log(`${out}: ${(html.length / 1024 / 1024).toFixed(2)} MB`);
