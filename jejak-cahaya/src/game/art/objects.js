// Aset lingkungan (SVG) mengikuti lembar konsep: hutan, gurun berbatu, taman bercahaya.
// Setiap entri: { w, h, svg } → w/h = ukuran tampilan di dunia (px). Tekstur dibuat 2x lebih tajam.
// Titik pijak (origin) objek berada di tengah bawah.

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const shadow = (cx, cy, rx, ry = rx / 3, o = 0.18) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1b2a10" opacity="${o}"/>`;

export const OBJECTS = {
  // ---------- hutan ----------
  tree: {
    w: 84, h: 112,
    svg: svg(84, 112, `${shadow(42, 104, 30)}
      <path d="M36 70h12l3 36H33z" fill="#7a5230"/><path d="M42 70h6l3 36h-9z" fill="#5f3d22"/>
      <circle cx="26" cy="58" r="20" fill="#3f8a3a"/><circle cx="58" cy="58" r="20" fill="#357a33"/>
      <circle cx="42" cy="40" r="26" fill="#4f9f3f"/><circle cx="30" cy="30" r="14" fill="#6fbf4a"/>
      <circle cx="54" cy="46" r="10" fill="#6fbf4a" opacity=".7"/><circle cx="24" cy="54" r="6" fill="#8ad05a" opacity=".8"/>`),
  },
  pine: {
    w: 62, h: 118,
    svg: svg(62, 118, `${shadow(31, 110, 22)}<rect x="27" y="88" width="8" height="22" fill="#6b4528"/>
      <path d="M31 6L8 50h46z" fill="#3c7f3a"/><path d="M31 30L4 78h54z" fill="#347233"/><path d="M31 54L2 96h58z" fill="#2c6530"/>
      <path d="M31 6L20 28h12z M31 30l-14 26h14z" fill="#5aa64a" opacity=".7"/>`),
  },
  bush: {
    w: 50, h: 36,
    svg: svg(50, 36, `${shadow(25, 32, 20)}<circle cx="15" cy="22" r="11" fill="#3f8a3a"/><circle cx="35" cy="22" r="11" fill="#3f8a3a"/>
      <circle cx="25" cy="15" r="13" fill="#55a243"/><circle cx="20" cy="11" r="5" fill="#7cc458"/><circle cx="36" cy="18" r="2.5" fill="#f2b632"/>`),
  },
  flowers: {
    w: 48, h: 26,
    svg: svg(48, 26, `<g>${[[8, 16, '#f28bb8'], [18, 10, '#fff'], [28, 18, '#f2b632'], [38, 11, '#b98be8'], [14, 21, '#f2b632'], [34, 22, '#f28bb8']]
      .map(([x, y, c]) => `<path d="M${x} ${y + 6}v-6" stroke="#4f9f3f" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3.6" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.3" fill="#fff6bf"/>`).join('')}</g>`),
  },
  rock: {
    w: 54, h: 40,
    svg: svg(54, 40, `${shadow(27, 35, 24)}<path d="M6 34l6-20 14-10 16 4 8 14-2 12z" fill="#9aa3a8"/>
      <path d="M26 4l16 4 8 14-14 2z" fill="#c2c9cc"/><path d="M6 34l6-20 14 10z" fill="#7d868b"/><path d="M12 34h36" stroke="#5f686d" stroke-width="2"/>`),
  },
  crystal: {
    w: 34, h: 50,
    svg: svg(34, 50, `<ellipse cx="17" cy="44" rx="16" ry="5" fill="#7fe3ff" opacity=".35"/>
      <path d="M17 2l8 16-8 28-8-28z" fill="#5fc9f0"/><path d="M17 2l8 16-8 28z" fill="#9be6ff"/>
      <path d="M7 22l5 8-4 16-6-14z" fill="#4fb3de"/><path d="M27 22l5 10-6 14-3-16z" fill="#7fd6f5"/>
      <path d="M15 8l2-4 2 4-2 10z" fill="#fff" opacity=".8"/>`),
  },
  lantern: {
    w: 26, h: 66,
    svg: svg(26, 66, `<circle cx="13" cy="16" r="13" fill="#ffd25e" opacity=".35"/>${shadow(13, 62, 8)}
      <rect x="11" y="22" width="4" height="40" fill="#5f3d22"/><rect x="7" y="58" width="12" height="5" rx="2" fill="#4e3320"/>
      <path d="M6 10h14l-2 14H8z" fill="#ffe38a" stroke="#4e3320" stroke-width="2"/><path d="M5 9h16l-8-6z" fill="#4e3320"/>`),
  },
  gate: {
    w: 100, h: 128,
    svg: svg(100, 128, `<defs><radialGradient id="g1"><stop offset="0" stop-color="#e9fbff"/><stop offset=".6" stop-color="#6fd3f5"/><stop offset="1" stop-color="#2f8fc0"/></radialGradient></defs>
      ${shadow(50, 120, 44, 10)}
      <path d="M14 120V50a36 36 0 0 1 72 0v70H72V52a22 22 0 0 0-44 0v68z" fill="#b8b2a2"/>
      <path d="M14 120V50a36 36 0 0 1 36-36v14a22 22 0 0 0-22 24v68z" fill="#d4cfbf"/>
      <path d="M28 120V52a22 22 0 0 1 44 0v68z" fill="url(#g1)" opacity=".9"/>
      <path d="M40 70q10-14 20 0q-10 20-20 0z" fill="#fff" opacity=".5"/>
      <circle cx="50" cy="10" r="8" fill="#f2b632"/><path d="M50 0v20M40 10h20" stroke="#fff6bf" stroke-width="2"/>
      ${[30, 50, 70, 90, 110].map((y) => `<rect x="10" y="${y}" width="10" height="3" fill="#8f8a7c"/><rect x="80" y="${y}" width="10" height="3" fill="#8f8a7c"/>`).join('')}
      <path d="M20 40q-6 10 0 22M80 40q6 10 0 22" stroke="#4f9f3f" stroke-width="4" fill="none"/>`),
  },
  barrier: {
    w: 76, h: 92,
    svg: svg(76, 92, `<defs><linearGradient id="b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0" stop-opacity="0"/><stop offset=".4" stop-color="#ffd25e" stop-opacity=".55"/><stop offset="1" stop-color="#f2b632" stop-opacity=".8"/></linearGradient></defs>
      <path d="M4 70L38 52l34 18v-56L38-4 4 14z" fill="url(#b1)"/>
      <path d="M4 70L38 52l34 18" fill="none" stroke="#fff6bf" stroke-width="3"/>
      ${[[14, 40], [30, 24], [48, 44], [60, 28], [24, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`).join('')}`),
  },
  sign: {
    w: 70, h: 70,
    svg: svg(70, 70, `${shadow(35, 66, 16)}<rect x="31" y="22" width="8" height="44" fill="#6b4528"/>
      <path d="M4 10h56l8 10-8 10H4z" fill="#a0703f" stroke="#5f3d22" stroke-width="3"/>
      <text x="32" y="26" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="15" fill="#fff6dc">Start</text>`),
  },

  // ---------- lembah gurun ----------
  palm: {
    w: 74, h: 112,
    svg: svg(74, 112, `${shadow(36, 106, 18)}<path d="M33 106q-2-40 6-72h6q-8 32-4 72z" fill="#9a6a3a"/>
      ${[-60, -20, 20, 60, 160, 200].map((a) => `<path d="M42 34q20-10 32 6q-18-4-32-6z" fill="#4f9f3f" transform="rotate(${a} 42 34)"/>`).join('')}
      <circle cx="40" cy="38" r="4" fill="#7a5230"/><circle cx="46" cy="38" r="4" fill="#7a5230"/>`),
  },
  pillar: {
    w: 30, h: 76,
    svg: svg(30, 76, `${shadow(15, 72, 14)}<rect x="2" y="64" width="26" height="9" fill="#b98a5a"/><rect x="6" y="12" width="18" height="54" fill="#d7a56d"/>
      <rect x="6" y="12" width="6" height="54" fill="#e8bd86"/><rect x="2" y="4" width="26" height="9" fill="#c79560"/><path d="M10 30v20M20 26v24" stroke="#b07f4c" stroke-width="1.5"/>`),
  },
  brokenPillar: {
    w: 30, h: 46,
    svg: svg(30, 46, `${shadow(15, 42, 14)}<rect x="2" y="34" width="26" height="9" fill="#b98a5a"/><path d="M6 36V12l5-4 4 5 5-6 4 4v25z" fill="#d7a56d"/><path d="M6 36V12l5-4v28z" fill="#e8bd86"/>`),
  },
  temple: {
    w: 170, h: 160,
    svg: svg(170, 160, `${shadow(85, 152, 78, 10)}
      <path d="M0 150V30L20 6h130l20 24v120z" fill="#c98b55"/><path d="M0 150V30L20 6h20v144z" fill="#dfa46a"/>
      <rect x="24" y="44" width="122" height="10" fill="#a86d3d"/><path d="M40 44l45-26 45 26z" fill="#d79a62" stroke="#a86d3d" stroke-width="3"/>
      ${[34, 62, 98, 126].map((x) => `<rect x="${x}" y="58" width="10" height="70" fill="#e2ad75"/><rect x="${x - 3}" y="56" width="16" height="5" fill="#a86d3d"/>`).join('')}
      <path d="M68 150v-56a17 17 0 0 1 34 0v56z" fill="#5b3520"/><rect x="20" y="128" width="130" height="8" fill="#a86d3d"/><rect x="12" y="140" width="146" height="10" fill="#b8784a"/>
      <path d="M150 40l14 20M6 60l10 14" stroke="#a86d3d" stroke-width="2"/>`),
  },
  ruin: {
    w: 92, h: 82,
    svg: svg(92, 82, `${shadow(46, 76, 42, 8)}<path d="M4 76V30l12-10 10 6 14-8 10 4 10-6 12 8 16-2v54z" fill="#c98b55"/>
      <path d="M4 76V30l12-10v56z" fill="#dfa46a"/><rect x="34" y="44" width="22" height="32" rx="11" fill="#5b3520"/><rect x="64" y="40" width="12" height="12" fill="#5b3520"/>
      <path d="M4 60h84" stroke="#a86d3d" stroke-width="2"/>`),
  },
  cliff: {
    w: 96, h: 84,
    svg: svg(96, 84, `${shadow(48, 78, 44, 8, 0.22)}<path d="M4 78L10 30l20-22 26 4 22-6 14 26 0 46z" fill="#c28652"/>
      <path d="M30 8l26 4 22-6 14 26-30 6-26-8z" fill="#e0a86e"/><path d="M4 78L10 30l20-22 6 24-10 46z" fill="#a8703f"/>
      <path d="M40 40l6 30M66 44l-4 30" stroke="#9a6236" stroke-width="2"/>`),
  },
  banner: {
    w: 30, h: 76,
    svg: svg(30, 76, `${shadow(15, 72, 10)}<rect x="4" y="4" width="4" height="68" fill="#5f3d22"/><path d="M8 8h20v34l-10-6-10 6z" fill="#c0392b"/>
      <path d="M18 16l3 6-3 6-3-6z" fill="#f2b632"/>`),
  },
  golem: {
    w: 104, h: 112,
    svg: svg(104, 112, `<defs><radialGradient id="ge"><stop offset="0" stop-color="#fff6bf"/><stop offset="1" stop-color="#f2a232"/></radialGradient></defs>
      ${shadow(52, 106, 44, 9, 0.28)}
      <rect x="28" y="80" width="18" height="26" rx="5" fill="#7d7468"/><rect x="58" y="80" width="18" height="26" rx="5" fill="#6d655a"/>
      <path d="M22 44q0-14 14-14h32q14 0 14 14v38H22z" fill="#8f8677"/><path d="M22 44q0-14 14-14h16v52H22z" fill="#a39a8a"/>
      <rect x="2" y="38" width="22" height="46" rx="10" fill="#857c6e"/><rect x="80" y="38" width="22" height="46" rx="10" fill="#7a7164"/>
      <rect x="0" y="76" width="26" height="18" rx="7" fill="#6d655a"/><rect x="78" y="76" width="26" height="18" rx="7" fill="#5f574d"/>
      <rect x="32" y="6" width="40" height="30" rx="9" fill="#9c9383"/><rect x="32" y="6" width="18" height="30" rx="9" fill="#b0a797"/>
      <rect x="38" y="16" width="10" height="6" rx="2" fill="url(#ge)"/><rect x="56" y="16" width="10" height="6" rx="2" fill="url(#ge)"/>
      <path d="M40 48l8 8-4 10 8 8M64 44l-6 12 8 6" stroke="#f2b632" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M10 50l6 10M90 52l-4 12" stroke="#f2b632" stroke-width="2" fill="none"/>
      <circle cx="30" cy="34" r="4" fill="#6fa83a"/><circle cx="74" cy="32" r="3" fill="#6fa83a"/>`),
  },

  // ---------- taman cahaya ----------
  bigTree: {
    w: 190, h: 210,
    svg: svg(190, 210, `<defs><radialGradient id="tg"><stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd25e" stop-opacity="0"/></radialGradient></defs>
      <circle cx="95" cy="120" r="94" fill="url(#tg)"/>${shadow(95, 200, 60, 12)}
      <path d="M80 200q4-50-6-80l14 6 8-30 8 30 14-6q-10 30-6 80z" fill="#c98a12"/><path d="M90 200q2-40-2-70l8-4 4 74z" fill="#f2b632"/>
      <path d="M74 120q-20-6-30-20M118 122q22-4 32-22" stroke="#c98a12" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${[[50, 80, 36, '#c58be0'], [140, 80, 36, '#b77ad6'], [95, 56, 50, '#d9a3ec'], [64, 44, 30, '#e6b8f2'], [126, 46, 30, '#cf96e6'], [95, 100, 34, '#c58be0']]
        .map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
      ${[[60, 30], [110, 20], [140, 60], [40, 70], [96, 80], [70, 96], [124, 94]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".85"/>`).join('')}
      ${[[44, 112], [150, 108], [120, 128]].map(([x, y]) => `<path d="M${x} ${y - 14}v10" stroke="#7a5230" stroke-width="1.5"/><rect x="${x - 4}" y="${y - 4}" width="8" height="10" rx="2" fill="#ffe38a" stroke="#c98a12"/>`).join('')}`),
  },
  fountain: {
    w: 104, h: 88,
    svg: svg(104, 88, `${shadow(52, 80, 48, 10)}<ellipse cx="52" cy="66" rx="48" ry="16" fill="#cfc7b2"/><ellipse cx="52" cy="62" rx="42" ry="12" fill="#5fc0e6"/>
      <ellipse cx="52" cy="62" rx="30" ry="7" fill="#9be0f7" opacity=".7"/><rect x="46" y="30" width="12" height="32" fill="#d8d1bd"/>
      <ellipse cx="52" cy="30" rx="20" ry="6" fill="#cfc7b2"/><ellipse cx="52" cy="28" rx="16" ry="4" fill="#5fc0e6"/>
      <path d="M52 26q-4-16 0-22q4 6 0 22M52 26q-14-10-20 2M52 26q14-10 20 2" stroke="#bfeeff" stroke-width="3" fill="none"/>`),
  },
  pedestal: {
    w: 76, h: 78,
    svg: svg(76, 78, `<defs><radialGradient id="pg"><stop offset="0" stop-color="#fff6bf"/><stop offset="1" stop-color="#ffd25e" stop-opacity="0"/></radialGradient></defs>
      <circle cx="38" cy="26" r="30" fill="url(#pg)"/>${shadow(38, 72, 30, 7)}
      <path d="M10 72l6-10h44l6 10z" fill="#bdb49e"/><rect x="24" y="36" width="28" height="28" fill="#d8d1bd"/><rect x="24" y="36" width="10" height="28" fill="#e9e3d2"/>
      <path d="M12 30l26 6 26-6-4 8-22 6-22-6z" fill="#a89f88"/>
      <path d="M14 28q12-8 24 2q12-10 24-2l-2 6q-10-6-22 2q-12-8-22-2z" fill="#fffaf0" stroke="#c98a12" stroke-width="1.5"/>
      <path d="M20 26h12M44 26h12M22 29h10M44 29h10" stroke="#c9b98f" stroke-width="1"/>`),
  },
  flowerBed: {
    w: 60, h: 30,
    svg: svg(60, 30, `<ellipse cx="30" cy="22" rx="28" ry="8" fill="#4f9f3f"/>${[[10, 16, '#d9a3ec'], [20, 12, '#fff'], [30, 17, '#f28bb8'], [40, 12, '#b98be8'], [50, 16, '#f2b632'], [16, 22, '#f2b632'], [44, 22, '#d9a3ec'], [30, 24, '#fff']]
      .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#fff6bf"/>`).join('')}`),
  },
};

// Tekstur partikel kecil
export const PARTICLES = {
  spark: svg(16, 16, `<defs><radialGradient id="s"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ffe680"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs><circle cx="8" cy="8" r="8" fill="url(#s)"/>`),
  dust: svg(16, 16, `<circle cx="8" cy="8" r="6" fill="#e9dcc0" opacity=".9"/>`),
  star: svg(20, 20, `<path d="M10 0l3 7 7 .6-5.4 4.6 1.8 7.2L10 15.6 3.6 19.4l1.8-7.2L0 7.6 7 7z" fill="#f2b632" stroke="#fff6bf"/>`),
  glow: svg(64, 64, `<defs><radialGradient id="gl"><stop offset="0" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="32" fill="url(#gl)"/>`),
};
