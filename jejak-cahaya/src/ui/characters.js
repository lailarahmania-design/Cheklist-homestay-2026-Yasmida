// Ilustrasi chibi (SVG) untuk 4 karakter penjelajah dan maskot Lumi.
// Proporsi konsisten: kepala besar (≈45% tinggi), badan pendek, sepatu bot.
// Gambar yang sama akan dipakai sebagai tekstur Phaser di Tahap 2.

const P = {
  skin: '#f7d3b2',
  skinShade: '#e8b48f',
  blush: '#f29a8a',
  eye: '#2b1d14',
  khaki: '#cdb27a',
  khakiDark: '#a88c55',
  olive: '#6b7f3a',
  oliveDark: '#4f6129',
  brown: '#7a5230',
  brownDark: '#563620',
  boot: '#5a3a22',
  gold: '#f2b632',
  cream: '#f1e6cc',
  creamDark: '#d9c9a3',
  lens: '#a9dcec',
  hair: '#5a3824',
};

function base({ shirt = P.khaki, vest = P.olive, pants = P.khakiDark, hands = '' } = {}) {
  return `
  <ellipse cx="60" cy="152" rx="30" ry="6" fill="#000" opacity=".15"/>
  <!-- tas punggung -->
  <rect x="30" y="86" width="60" height="44" rx="12" fill="${P.brown}"/>
  <rect x="34" y="92" width="10" height="26" rx="4" fill="${P.brownDark}"/>
  <rect x="76" y="92" width="10" height="26" rx="4" fill="${P.brownDark}"/>
  <!-- kaki & bot -->
  <rect x="44" y="124" width="13" height="18" rx="4" fill="${pants}"/>
  <rect x="63" y="124" width="13" height="18" rx="4" fill="${pants}"/>
  <path d="M41 138h18v8a4 4 0 0 1-4 4H43a4 4 0 0 1-4-4z" fill="${P.boot}"/>
  <path d="M61 138h18v8a4 4 0 0 1-4 4H63a4 4 0 0 1-4-4z" fill="${P.boot}"/>
  <!-- badan -->
  <path d="M40 96q0-8 8-8h24q8 0 8 8v30H40z" fill="${shirt}"/>
  <path d="M40 98q0-8 8-9l6 0v37H40z" fill="${vest}"/>
  <path d="M80 98q0-8-8-9l-6 0v37h14z" fill="${vest}"/>
  <rect x="40" y="114" width="40" height="5" fill="${P.brownDark}"/>
  <rect x="57" y="113" width="6" height="7" rx="1" fill="${P.gold}"/>
  <rect x="44" y="100" width="8" height="7" rx="1.5" fill="${P.oliveDark}"/>
  <rect x="68" y="100" width="8" height="7" rx="1.5" fill="${P.oliveDark}"/>
  ${hands || `
  <!-- lengan -->
  <rect x="30" y="94" width="11" height="24" rx="5.5" fill="${shirt}"/>
  <rect x="79" y="94" width="11" height="24" rx="5.5" fill="${shirt}"/>
  <circle cx="35.5" cy="119" r="5" fill="${P.skin}"/>
  <circle cx="84.5" cy="119" r="5" fill="${P.skin}"/>`}`;
}

function face({ y = 0 } = {}) {
  return `
  <g transform="translate(0 ${y})">
  <ellipse cx="46" cy="68" rx="6" ry="7.5" fill="${P.eye}"/>
  <ellipse cx="74" cy="68" rx="6" ry="7.5" fill="${P.eye}"/>
  <circle cx="48" cy="65" r="2.4" fill="#fff"/>
  <circle cx="76" cy="65" r="2.4" fill="#fff"/>
  <circle cx="44.5" cy="71" r="1.1" fill="#fff"/>
  <circle cx="72.5" cy="71" r="1.1" fill="#fff"/>
  <ellipse cx="38" cy="78" rx="5" ry="3" fill="${P.blush}" opacity=".55"/>
  <ellipse cx="82" cy="78" rx="5" ry="3" fill="${P.blush}" opacity=".55"/>
  <path d="M54 79q6 6 12 0" fill="none" stroke="${P.brownDark}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}

const head = `<ellipse cx="60" cy="62" rx="32" ry="30" fill="${P.skin}"/>
  <ellipse cx="29" cy="66" rx="5" ry="7" fill="${P.skinShade}"/>
  <ellipse cx="91" cy="66" rx="5" ry="7" fill="${P.skinShade}"/>`;

function goggles(y = 40) {
  return `
  <rect x="30" y="${y + 4}" width="60" height="6" rx="3" fill="${P.brownDark}"/>
  <circle cx="47" cy="${y + 7}" r="9.5" fill="${P.gold}"/><circle cx="47" cy="${y + 7}" r="6.5" fill="${P.lens}"/>
  <circle cx="73" cy="${y + 7}" r="9.5" fill="${P.gold}"/><circle cx="73" cy="${y + 7}" r="6.5" fill="${P.lens}"/>
  <path d="M43 ${y + 4}l3-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <path d="M69 ${y + 4}l3-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
}

function boyA() {
  return `${base()}${head}
  <path d="M34 56q4-10 14-8q-6 6-2 12zM86 56q-4-10-14-8q6 6 2 12z" fill="${P.hair}"/>
  <path d="M26 56q0-32 34-32t34 32q-8-6-34-6t-34 6z" fill="${P.brown}"/>
  <path d="M26 56q-2 10 4 14v-12z M94 56q2 10-4 14v-12z" fill="${P.brownDark}"/>
  <path d="M60 24v26" stroke="${P.brownDark}" stroke-width="2"/>
  ${goggles(38)}${face()}`;
}

function hijab(color, dark) {
  return `
  <path d="M24 66q-4-44 36-44t36 44q2 22-10 34q-26 10-52 0q-12-12-10-34z" fill="${color}"/>
  <path d="M34 98q26 12 52 0l-2 8q-24 10-48 0z" fill="${dark}"/>
  <ellipse cx="60" cy="66" rx="27" ry="25" fill="${P.skin}"/>
  <path d="M33 54q27-22 54 0q-2-24-27-24t-27 24z" fill="${color}"/>
  <path d="M33 54q27-14 54 0" fill="none" stroke="${dark}" stroke-width="2" opacity=".6"/>`;
}

function girlA() {
  return `${base({ vest: P.khakiDark, shirt: P.khaki })}${hijab(P.olive, P.oliveDark)}${face({ y: 1 })}`;
}

function safariHat(y = 30, color = '#d9c08a') {
  return `
  <ellipse cx="60" cy="${y + 20}" rx="44" ry="9" fill="#c4a76b"/>
  <path d="M34 ${y + 20}q0-26 26-26t26 26z" fill="${color}"/>
  <rect x="34" y="${y + 12}" width="52" height="7" fill="${P.brown}"/>
  <path d="M38 ${y + 6}q22-12 44 0" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`;
}

function boyB() {
  const hands = `
  <rect x="30" y="94" width="11" height="20" rx="5.5" fill="${P.khaki}"/>
  <rect x="79" y="94" width="11" height="20" rx="5.5" fill="${P.khaki}"/>
  <!-- peta -->
  <path d="M38 104l14-4l16 4l14-4v22l-14 4l-16-4l-14 4z" fill="#f3e2b3" stroke="${P.khakiDark}" stroke-width="1.5"/>
  <path d="M52 100v22M68 104v22" stroke="${P.khakiDark}" stroke-width="1.2"/>
  <path d="M44 114q8-6 14 0t14-2" fill="none" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="3 2"/>
  <circle cx="38" cy="112" r="5" fill="${P.skin}"/><circle cx="82" cy="112" r="5" fill="${P.skin}"/>`;
  return `${base({ hands, vest: P.olive })}${head}
  <path d="M30 60q2-18 18-18q-4 8 0 14q6-8 14-10q-2 8 4 10q6-6 14-2q8 4 6 16z" fill="${P.hair}"/>
  ${safariHat(22)}${face()}`;
}

function girlB() {
  const hands = `
  <rect x="30" y="94" width="11" height="24" rx="5.5" fill="${P.cream}"/>
  <rect x="79" y="94" width="11" height="18" rx="5.5" fill="${P.cream}"/>
  <circle cx="35.5" cy="119" r="5" fill="${P.skin}"/>
  <!-- lentera -->
  <circle cx="92" cy="124" r="16" fill="${P.gold}" opacity=".25"/>
  <path d="M86 110q6-6 12 0" fill="none" stroke="${P.brownDark}" stroke-width="2"/>
  <rect x="85" y="112" width="14" height="4" rx="1" fill="${P.brownDark}"/>
  <rect x="86" y="116" width="12" height="14" rx="3" fill="#ffe38a" stroke="${P.brownDark}" stroke-width="2"/>
  <rect x="85" y="130" width="14" height="3" rx="1" fill="${P.brownDark}"/>
  <circle cx="84.5" cy="112" r="5" fill="${P.skin}"/>`;
  return `${base({ hands, shirt: P.cream, vest: P.khaki, pants: P.khakiDark })}${hijab(P.cream, P.creamDark)}
  ${safariHat(10, '#d6b87e')}${face({ y: 1 })}`;
}

const DRAW = { 'kid-boy-a': boyA, 'kid-girl-a': girlA, 'kid-boy-b': boyB, 'kid-girl-b': girlB };

/** @returns {string} markup SVG karakter */
export function characterSVG(id, { size = 96, title = '' } = {}) {
  const draw = DRAW[id] || boyA;
  return `<svg class="chibi" viewBox="0 0 120 160" width="${size}" height="${Math.round(size * 1.333)}" role="img" aria-label="${title}">${title ? `<title>${title}</title>` : ''}${draw()}</svg>`;
}

/** Lumi, kunang-kunang pendamping: tubuh mungil, sayap transparan, cahaya emas, mata besar. */
export function lumiSVG({ size = 72, mood = 'happy' } = {}) {
  const mouth =
    mood === 'sad'
      ? '<path d="M54 74q6-5 12 0" fill="none" stroke="#5a3a22" stroke-width="2.4" stroke-linecap="round"/>'
      : '<path d="M53 71q7 7 14 0" fill="#c0392b" stroke="#5a3a22" stroke-width="2" stroke-linecap="round"/>';
  return `<svg class="lumi" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="Lumi">
  <defs><radialGradient id="lumiGlow"><stop offset="0" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs>
  <circle cx="60" cy="72" r="54" fill="url(#lumiGlow)"/>
  <ellipse cx="30" cy="50" rx="22" ry="13" transform="rotate(-30 30 50)" fill="#dff6ff" opacity=".6" stroke="#bfe8f5"/>
  <ellipse cx="90" cy="50" rx="22" ry="13" transform="rotate(30 90 50)" fill="#dff6ff" opacity=".6" stroke="#bfe8f5"/>
  <path d="M48 32q-6-16-14-18M72 32q6-16 14-18" fill="none" stroke="#5a3a22" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="34" cy="14" r="4" fill="#ffd23f"/><circle cx="86" cy="14" r="4" fill="#ffd23f"/>
  <ellipse cx="60" cy="96" rx="16" ry="14" fill="#ffe066"/>
  <ellipse cx="60" cy="98" rx="10" ry="8" fill="#fff6bf"/>
  <circle cx="60" cy="62" r="26" fill="#f7c948"/>
  <path d="M34 56q0-22 26-22t26 22q-10-6-26-6t-26 6z" fill="#7a5230"/>
  <ellipse cx="50" cy="64" rx="6" ry="7.5" fill="#2b1d14"/><ellipse cx="70" cy="64" rx="6" ry="7.5" fill="#2b1d14"/>
  <circle cx="52" cy="61" r="2.4" fill="#fff"/><circle cx="72" cy="61" r="2.4" fill="#fff"/>
  <ellipse cx="42" cy="72" rx="4" ry="2.4" fill="#f29a8a" opacity=".7"/><ellipse cx="78" cy="72" rx="4" ry="2.4" fill="#f29a8a" opacity=".7"/>
  ${mouth}
  </svg>`;
}
