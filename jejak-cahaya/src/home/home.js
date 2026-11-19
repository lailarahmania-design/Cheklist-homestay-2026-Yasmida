// Beranda: pintu masuk Teacher Mode dan Student Mode.

import { POS_DEFS, CHARACTERS } from '../core/constants.js';
import { characterSVG, lumiSVG } from '../ui/characters.js';
import { esc } from '../ui/ui.js';

export function renderHome(root) {
  root.innerHTML = `
  <div class="home">
    <div class="fireflies" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>

    <header class="home-hero">
      <div class="logo">
        <h1 class="logo-title">Jejak<br>Cahaya</h1>
        <span class="logo-sub">The Last Journey</span>
      </div>
      <div class="hero-lumi">
        ${lumiSVG({ size: 110 })}
        <p class="speech">Assalamu'alaikum, penjelajah! Aku <b>Lumi</b>. Siap menempuh tiga pos ujian bersama kelompokmu?</p>
      </div>
    </header>

    <section class="home-cards">
      <article class="panel home-card">
        <span class="ribbon">🧭 Mode Guru</span>
        <p>Susun konfigurasi ujian, kelola kelompok dan bank soal, lalu pantau perjalanan setiap kelompok.</p>
        <a class="btn btn-primary btn-lg" href="#/guru" data-testid="go-teacher">Masuk sebagai Guru</a>
      </article>
      <article class="panel home-card">
        <span class="ribbon" style="background:linear-gradient(180deg,#5cbde3,#3aa6d0);box-shadow:0 3px 0 #24799b">🎒 Mode Siswa</span>
        <p>Bergabung dengan kode sesi dari guru, pilih karakter, lalu jelajahi dunia bersama kelompokmu.</p>
        <p class="badge badge-water">Bergabung dengan kode sesi tersedia di Tahap 4</p>
      </article>
    </section>

    <section class="panel home-journey" aria-labelledby="journey-title">
      <h2 id="journey-title">Peta Petualangan</h2>
      <ol class="journey">
        ${POS_DEFS.map(
          (p, i) => `<li class="journey-step step-${i + 1}">
            <span class="journey-icon" aria-hidden="true">${p.icon}</span>
            <span><b>Pos ${i + 1} · ${esc(p.name)}</b><small>${esc(p.mechanic)} · ${esc(p.region)}</small></span>
          </li>`
        ).join('')}
      </ol>
    </section>

    <section class="home-chars" aria-label="Karakter penjelajah">
      ${CHARACTERS.map((c) => `<figure>${characterSVG(c.id, { size: 84, title: c.name })}<figcaption>${esc(c.name)}</figcaption></figure>`).join('')}
    </section>
  </div>`;
}
