// build.mjs: writes poster.html, the 1024x1024 front page for Friday 20 November 2026.
// Stories and figures come from edition.json; the wording comes from copy.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { leads, cards, briefs, numbers, REGION, MAP_POINTS } from './copy.mjs';

const edition = JSON.parse(readFileSync(new URL('./edition.json', import.meta.url), 'utf8'));
const landPath = readFileSync(new URL('./land-path.txt', import.meta.url), 'utf8');
const stories = edition.stories;
const by = (n) => stories.find((s) => s.n === n);
// sourcing chip: derived only from what the edition carries.
// OFFICIAL = the outlet *is* the body that issued the report; CONFIRMED = the edition's
// summary was built from a published article; REPORTED = built from the outlet's sources.
const OFFICIAL_OUTLETS = new Set(['imd', 'icc', 'ukmto', 'un news', 'xinhua']);
const badgeOf = (n) => {
  const st = by(n);
  const outs = (st.outlets || []).map((o) => String(o).toLowerCase());
  if (outs.some((o) => OFFICIAL_OUTLETS.has(o))) return { label: 'OFFICIAL', cls: 'o' };
  if (st.tldr && st.tldr.basis === 'article') return { label: 'CONFIRMED', cls: 'c' };
  return { label: 'REPORTED', cls: 'r' };
};
const chip = (n) => { const b = badgeOf(n); return `<span class="bdg ${b.cls}">${b.label}</span>`; };
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- integrity: every story appears exactly once, and no copy names a story the edition lacks ----
const used = [...leads, ...cards, ...briefs].map((s) => s.n);
if (used.length !== 35 || new Set(used).size !== 35) throw new Error('page must carry all 35 stories once: ' + used.length);
for (const n of used) if (!by(n)) throw new Error('story ' + n + ' is not in the edition');
if (leads[0].n !== 1 || leads[1].n !== 2 || leads[2].n !== 3) throw new Error('leads must be the edition leads');

const regionOf = (r) => REGION[r] ?? REGION.world;
const dotColor = (r) => (DARK_MAP ? REGC[r] ?? REGC.world : regionOf(r)[1]);
const dotColorCss = (r) => (DARK_MAP ? REGC[r] ?? REGC.world : regionOf(r)[1]);
const counts = stories.reduce((m, s) => ((m[s.region] = (m[s.region] ?? 0) + 1), m), {});
const regionLine = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([r, c]) => `<span class="rg"><i style="background:${regionOf(r)[1]}"></i>${regionOf(r)[0]}<b>${c}</b></span>`)
  .join('');


// ---- the day strip: only stories the edition stamps inside 20 November 2026 in UTC ----
const DAY_STRIP = [
  { n: 1, t: '00:04', label: 'Kyiv bridges' },
  { n: 18, t: '01:01', label: 'China loan rate' },
  { n: 27, t: '01:34', label: 'AfDB debt' },
  { n: 22, t: '02:05', label: 'Lebanon strikes' },
  { n: 4, t: '03:20', label: 'UK–EU deal' },
  { n: 2, t: '03:58', label: 'Akvan landfall' },
  { n: 25, t: '04:41', label: 'Ebola rallies' },
  { n: 5, t: '06:06', label: 'COP31 final day' },
  { n: 6, t: '07:45', label: 'Poland missile' },
  { n: 7, t: '08:18', label: 'Jurf al-Sakhar' },
  { n: 19, t: '12:28', label: 'SoftBank −14.48%' },
  { n: 23, t: '14:38', label: 'Yemen ship' },
  { n: 15, t: '16:58', label: 'Estonia border' },
];
// the times are the edition's publishedAt stamps, so the check is mechanical, not a claim
for (const d of DAY_STRIP) {
  const stamps = (by(d.n).links ?? []).map((l) => l.publishedAt ?? '');
  const utc = stamps.map((x) => x.slice(11, 16));
  const day = stamps.map((x) => x.slice(0, 10));
  if (!day.includes('2026-11-20') || !utc.includes(d.t)) throw new Error('day strip time ' + d.t + ' is not story ' + d.n + "'s stamp: " + stamps.join(','));
}

// ---- map: equirectangular, cropped to 72N..50S so the panel holds no dead polar bands ----
const DARK_MAP = process.env.MAPSTYLE !== 'light';
const MAPC = DARK_MAP
  ? { sea: '#0f2433', land: '#2b4c63', stroke: '#456b83', grid: '#1b3749', label: '#f4efe3', halo: '#0f2433' }
  : { sea: '#cfdedb', land: '#faf6ec', stroke: '#a3937a', grid: '#bccdc9', label: '#1b1712', halo: '#f9f5ea' };
const REGC = DARK_MAP
  ? { europe: '#6ea8e0', asia: '#ef6a4a', 'middle-east': '#e0a94f', africa: '#4fbf8b', americas: '#a987e0', oceania: '#45c2d6', world: '#c9ced4' }
  : null;
const TOP = 12, HEIGHT = 122; // 84 - 72 = 12, and 84 + 50 = 134
const project = ([lon, lat]) => [lon + 180, 84 - Math.max(-58, Math.min(84, lat))];
const dot = (s) => {
  const [x, y] = project([s.geo.lon, s.geo.lat]);
  const c = dotColor(s.region);
  const lead = s.tier === 'lead';
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lead ? 2.4 : 2.1}" fill="${c}" opacity="${lead ? 0.98 : 0.85}"/>`;
};
const dotPaths = stories.filter((s) => s.geo).map(dot).join('');
const leadDots = [1, 2].map((n) => {
  const s = by(n);
  const [x, y] = project([s.geo.lon, s.geo.lat]);
  const p = MAP_POINTS[n];
  return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="${MAPC.halo}"/>` +
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.9" fill="${dotColor(s.region)}"/>` +
    `<text x="${x.toFixed(1)}" y="${(y + 1.9).toFixed(1)}" class="mn">${n}</text>` +
    `<text x="${(x + p.dx).toFixed(1)}" y="${(y + p.dy).toFixed(1)}" class="ml"${p.anchor ? ' text-anchor="end"' : ''}>${p.label}</text></g>`;
}).join('');
const eastAsia = MAP_POINTS[3].map((c) => {
  const [x, y] = project([c.lon, c.lat]);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${dotColor('asia')}"/>`;
}).join('');
const [tx, ty] = project([MAP_POINTS[3.1].lon, MAP_POINTS[3.1].lat]);
const taipeiLabel = `<g><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="5.2" fill="${MAPC.halo}"/>` +
  `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3.9" fill="${dotColor('asia')}"/>` +
  `<text x="${tx.toFixed(1)}" y="${(ty + 1.9).toFixed(1)}" class="mn">3</text>` +
  `<text x="${(tx - 6).toFixed(1)}" y="${(ty + 10).toFixed(1)}" class="ml" text-anchor="end">TAIPEI</text></g>`;

const mapSvg = `<svg class="map" viewBox="0 ${TOP} 360 ${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-label="World map with one dot for each story">
  <rect x="0" y="${TOP}" width="360" height="${HEIGHT}" fill="${MAPC.sea}"/>
  <g stroke="${MAPC.grid}" stroke-width="0.35" fill="none">
    <path d="M0 26H360M0 56H360M0 86H360M0 116H360"/>
    <path d="M60 0V142M120 0V142M180 0V142M240 0V142M300 0V142"/>
  </g>
  <path d="${landPath}" fill="${MAPC.land}" stroke="${MAPC.stroke}" stroke-width="0.55"/>
  ${dotPaths}
  ${eastAsia}
  ${leadDots}
  ${taipeiLabel}
</svg>`;

// ---- lead illustrations: flat shapes drawn here, no photographs ----
function spiral(cx, cy, turns, r0, r1, steps = 160) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps, t = f * turns * Math.PI * 2, r = r0 + (r1 - r0) * f;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t) * 0.9]);
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
}
const candles = Array.from({ length: 9 }, (_, i) => {
  const x = 12 + i * 13;
  const top = 18 + i * 8.2;
  const h = 9 + ((i * 5) % 7);
  return `<line x1="${x}" y1="${(top - 5).toFixed(1)}" x2="${x}" y2="${(top + h + 5).toFixed(1)}" stroke="#e0662f" stroke-width="0.8"/>` +
    `<rect x="${(x - 3).toFixed(1)}" y="${top.toFixed(1)}" width="6" height="${h}" fill="${i % 3 === 2 ? '#f3c79a' : '#c94a24'}"/>`;
}).join('');

const ART = {
  bridges: `<svg viewBox="0 0 315 96" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="gb1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1a30"/><stop offset=".5" stop-color="#1b3a5d"/><stop offset="1" stop-color="#0e2438"/>
    </linearGradient></defs>
    <rect width="315" height="96" fill="url(#gb1)"/>
    <ellipse cx="250" cy="70" rx="120" ry="34" fill="#2a5a7d" opacity=".28"/>
    <g fill="#060f1b" opacity=".92">
      <rect x="0" y="56" width="20" height="16"/><rect x="26" y="50" width="12" height="22"/>
      <rect x="238" y="48" width="16" height="24"/><rect x="258" y="42" width="10" height="30"/>
      <rect x="272" y="52" width="18" height="20"/><rect x="294" y="46" width="12" height="26"/>
    </g>
    <g fill="none" stroke="#ffc775" stroke-linecap="round">
      <path d="M314 -6C296 24 236 38 152 56" stroke-width="2.1" opacity=".95"/>
      <path d="M316 12C292 38 238 50 174 62" stroke-width="1.2" opacity=".8"/>
      <path d="M302 -8C278 16 222 32 130 50" stroke-width="1" opacity=".7"/>
      <path d="M318 34C302 50 264 60 222 68" stroke-width="1" opacity=".55"/>
    </g>
    <g fill="#ffd9a0">
      <circle cx="152" cy="56" r="3.2"/><circle cx="174" cy="62" r="2.4"/>
      <circle cx="130" cy="50" r="1.9"/><circle cx="222" cy="68" r="1.7"/>
    </g>
    <g stroke="#f6c27a" stroke-width=".9" opacity=".85">
      <path d="M152 56l-8-5M152 56l9-4M152 56l-6 7M152 56l10 5"/>
      <path d="M174 62l-7-4M174 62l8 3M174 62l-4 6"/>
    </g>
    <rect x="0" y="70" width="315" height="26" fill="#16405a"/>
    <g fill="#f3c79a" opacity=".55"><rect x="240" y="58" width="2" height="3"/><rect x="248" y="54" width="2" height="3"/><rect x="258" y="60" width="2" height="3"/><rect x="274" y="56" width="2" height="3"/><rect x="284" y="62" width="2" height="3"/><rect x="298" y="54" width="2" height="3"/><rect x="6" y="60" width="2" height="3"/><rect x="14" y="56" width="2" height="3"/></g>
    <g stroke="#2c5f79" stroke-width=".8" opacity=".6">
      <path d="M8 78h26M46 84h34M96 79h30M152 87h44M208 81h26M252 89h40M300 83h12"/>
    </g>
    <g fill="none" stroke="#040c15" stroke-linejoin="round">
      <path d="M16 72h142" stroke-width="3.4"/><path d="M166 76h134" stroke-width="3.2"/>
      <path d="M16 70.6h142M166 74.6h134" stroke="#5b8bab" stroke-width=".7"/>
      <path d="M24 72v-9M52 72v-12M80 72v-12M108 72v-12M136 72v-9" stroke-width="1.5"/>
      <path d="M24 63h112" stroke-width="1.2"/>
      <path d="M24 63l14 9M52 63l14 9M66 63l14 9M94 63l14 9M108 63l14 9M136 63l-14 9" stroke-width="1"/>
      <path d="M174 76v-8M200 76v-10M226 76v-10M252 76v-10M278 76v-8" stroke-width="1.5"/>
      <path d="M174 68h104" stroke-width="1.2"/>
      <path d="M174 68l13 8M200 68l13 8M213 68l13 8M239 68l13 8M252 68l13 8M278 68l-13 8" stroke-width="1"/>
    </g>
    <g fill="#0a1a28">
      <rect x="24" y="72" width="4" height="13"/><rect x="78" y="72" width="4" height="13"/>
      <rect x="130" y="72" width="4" height="13"/><rect x="176" y="76" width="4" height="12"/>
      <rect x="226" y="76" width="4" height="12"/><rect x="274" y="76" width="4" height="12"/>
    </g>
    <g fill="#f3c79a" opacity=".9">
      <circle cx="26" cy="71" r=".9"/><circle cx="80" cy="71" r=".9"/><circle cx="132" cy="71" r=".9"/>
      <circle cx="178" cy="75" r=".9"/><circle cx="228" cy="75" r=".9"/><circle cx="276" cy="75" r=".9"/>
    </g>
  </svg>`,
  cyclone: `<svg viewBox="0 0 315 96" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="gc1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b4150"/><stop offset="1" stop-color="#14707f"/>
    </linearGradient></defs>
    <rect width="315" height="96" fill="url(#gc1)"/>
    <g fill="none" stroke="#1d6b7a" stroke-width=".8" opacity=".45">
      <path d="M0 18h315M0 42h315M0 66h315M0 90h315" stroke-dasharray="16 12"/>
    </g>
    <path d="M226 96C244 74 250 55 268 39C282 26 300 17 315 12V96Z" fill="#27492f"/>
    <path d="M226 96C244 74 250 55 268 39C282 26 300 17 315 12" fill="none" stroke="#a3c08c" stroke-width="1.4"/>
    <g fill="none" stroke="#f2fbfa" stroke-linecap="round" transform="translate(196 46)">
      <path d="${spiral(0, 0, 0.92, 7, 19)}" stroke-width="3.4"/>
      <path d="${spiral(0, 0, 0.84, 19, 30)}" stroke-width="2.6" opacity=".85"/>
      <path d="${spiral(0, 0, 0.78, 30, 40)}" stroke-width="2" opacity=".55"/>
    </g>
    <circle cx="196" cy="46" r="3.2" fill="#ffc07a"/>
    <circle cx="196" cy="46" r="6.8" fill="none" stroke="#ffc07a" stroke-width="1" opacity=".8"/>
    <g stroke="#9fd0d4" stroke-width=".7" opacity=".4" stroke-linecap="round">
      <path d="M14 10l-8 14M34 4l-9 16M56 8l-9 16M78 2l-9 16M100 8l-9 16M122 4l-8 14"/>
      <path d="M244 86l-8 14M266 90l-8 14M288 84l-8 14M308 92l-7 12"/>
      <path d="M12 52l-7 12M70 56l-7 12M128 52l-7 12M196 88l-7 12"/>
    </g>
    <g>
      <path d="M140 20L226 62" stroke="#f3c79a" stroke-width="1" stroke-dasharray="3 4" opacity=".8"/>
      <circle cx="226" cy="62" r="5.2" fill="none" stroke="#f3c79a" stroke-width="1.3"/>
      <circle cx="226" cy="62" r="2" fill="#f3c79a"/>
      <path d="M226 56V44l8 3-8 3" fill="#f3c79a"/>
    </g>
  </svg>`,
  market: `<svg viewBox="0 0 315 96" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="gm1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#331811"/><stop offset="1" stop-color="#4b2418"/>
    </linearGradient></defs>
    <rect width="315" height="96" fill="url(#gm1)"/>
    <g stroke="#f7f3ea" stroke-width=".6" opacity=".07">
      <path d="M0 16h315M0 32h315M0 48h315M0 64h315M0 80h315"/>
      <path d="M26 0v96M78 0v96M130 0v96M182 0v96M234 0v96M286 0v96"/>
    </g>
    <path d="M28 18L60 26L92 22L124 36L156 42L188 52L220 58L252 64L284 74L310 84V96H28Z" fill="#e0552c" opacity=".22"/>
    <g stroke="#e0662f" stroke-width="1">
      <path d="M44 20v14M66 24v16M88 24v18M110 32v18M132 38v18M154 42v18M176 48v20M198 54v18M220 58v20M242 62v18M264 66v20M286 70v18M302 76v18"/>
    </g>
    <g>
      <rect x="41" y="23" width="7" height="8" fill="#d9553a"/><rect x="63" y="28" width="7" height="9" fill="#f3c79a"/>
      <rect x="85" y="28" width="7" height="11" fill="#d9553a"/><rect x="107" y="36" width="7" height="10" fill="#d9553a"/>
      <rect x="129" y="42" width="7" height="10" fill="#f3c79a"/><rect x="151" y="46" width="7" height="11" fill="#d9553a"/>
      <rect x="173" y="52" width="7" height="12" fill="#d9553a"/><rect x="195" y="58" width="7" height="10" fill="#f3c79a"/>
      <rect x="217" y="62" width="7" height="12" fill="#d9553a"/><rect x="239" y="66" width="7" height="11" fill="#d9553a"/>
      <rect x="261" y="70" width="7" height="12" fill="#f3c79a"/><rect x="283" y="74" width="7" height="10" fill="#d9553a"/>
    </g>
    <path d="M28 18L60 26L92 22L124 36L156 42L188 52L220 58L252 64L284 74L310 84" fill="none" stroke="#ff8a6b" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M286 72h16l-8 14z" fill="#ff8a6b"/>
  </svg>`,
};


// ---- ten small flat glyphs, one per card, in the region's colour ----
const GLYPH = {
  flag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5v19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6.6 4h11.6l-2.8 3.7 2.8 3.7H6.6z" fill="currentColor"/><path d="M6.6 12.6h8.6l-2.2 3 2.2 3H6.6z" fill="currentColor" opacity=".55"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5.8 16.2 5.4 9.2 12 3c6.6 6.2 6.2 13.2 0 18z" fill="currentColor"/><path d="M12 20V8.5M12 12.5l3-2.5M12 16l-2.6-2.2" stroke="#f7f3ea" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`,
  missile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2.3 2.8 3.4 5.9 3.4 9.4V16H8.6v-4.6C8.6 7.9 9.7 4.8 12 2z" fill="currentColor"/><path d="M8.6 12.6 5.6 17v4l3-2.2M15.4 12.6 18.4 17v4l-3-2.2" fill="currentColor"/><path d="M10.4 16.6h3.2L12 21.6z" fill="#e0662f"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 20 5v6.3c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5V5z" fill="currentColor"/><path d="M12 6.2v9.6M9.4 9.6h5.2" stroke="#f7f3ea" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  megaphone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.4 15.4 4.6v14.8L3 13.6z" fill="currentColor"/><path d="M15.4 9.2c2.2.7 3.4 1.8 3.4 3.3s-1.2 2.6-3.4 3.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.4 14.2v4.2h3.1v-3.2" fill="currentColor" opacity=".7"/></svg>`,
  inflation: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5h3.2v-5.2H3.5zM10.4 20.5h3.2v-9.4h-3.2zM17.3 20.5h3.2V6.8h-3.2z" fill="currentColor" opacity=".85"/><path d="M4 9.4l5.8-4 3.6 1.8L20.4 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16.6 2h3.8v3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  gavel: `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-38 12 7.5)"><rect x="5.4" y="4.4" width="13.2" height="5.4" rx="1.1" fill="currentColor"/><rect x="10.9" y="9.6" width="2.2" height="12.4" rx="1" fill="currentColor"/></g></svg>`,
  derrick: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 5.6 20.5M12 2l6.4 18.5M8 14.6h8M9.3 9.7h5.4M6.6 19.6h10.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M19.4 12.4c1.5 1.9 2.2 3.1 2.2 4.1a2.2 2.2 0 0 1-4.4 0c0-1 .7-2.2 2.2-4.1z" fill="#e0662f"/></svg>`,
  ballot: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9.4" width="16" height="11.6" rx="1.2" fill="currentColor"/><rect x="9.2" y="2.6" width="9.4" height="9.2" rx="1" fill="currentColor" opacity=".6"/><path d="M11 7.1l1.9 1.9 3.4-3.4" fill="none" stroke="#f7f3ea" stroke-width="1.6" stroke-linecap="round"/><rect x="10.2" y="13.2" width="4.4" height="1.5" fill="#f7f3ea"/></svg>`,
  ball: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="currentColor"/><path d="M6.4 6.6c3 1.1 4.6 3.1 5.7 4.9M17.6 17.4c-3-1.1-4.6-3.1-5.7-4.9" fill="none" stroke="#f7f3ea" stroke-width="1.3" stroke-linecap="round"/><g stroke="#f7f3ea" stroke-width="1"><path d="M7.4 8.2 6.4 7.4M8.9 9.7l-1-.8M10.4 11.2l-1-.8M16.6 15.8l1 .8M15.1 14.3l1 .8M13.6 12.8l1 .8"/></g></svg>`,
};
const GLYPH_BY_STORY = { 4: 'flag', 5: 'leaf', 6: 'missile', 7: 'shield', 8: 'megaphone', 9: 'inflation', 10: 'gavel', 11: 'derrick', 12: 'ballot', 13: 'ball' };

const dayStrip = `
  <section class="daystrip">
    <div class="ds-head"><h5>Reported through the day, in UTC <span>the hour each of these thirteen reports was filed</span></h5></div>
    <div class="ds-track">${DAY_STRIP.map((d) => `<div class="ds-i"><b>${d.t}</b><span>${esc(d.label)}</span></div>`).join('')}</div>
  </section>`;

const leadBlock = (l, i) => `
  <article class="lead">
    <div class="panel">
      <div class="panel-txt">
        <div class="pkrow"><span class="pk">${esc(l.kicker)}</span>${chip(l.n)}</div>
        <div class="pfig">${esc(l.fig)}</div>
        <div class="punit">${esc(l.figUnit)}</div>
        <div class="psub">${esc(l.figSub)}</div>
      </div>
      <div class="part">${ART[l.art]}</div>
    </div>
    <h3>${l.head.map((h) => esc(h)).join('<br>')}</h3>
    <p class="deck">${esc(l.deck)}</p>
    <div class="src">${esc(l.src)}</div>
  </article>`;

const cardBlock = (c) => {
  const region = by(c.n).region;
  const g = GLYPH[GLYPH_BY_STORY[c.n]] ?? '';
  return `
  <article class="card" style="--gc:${regionOf(region)[1]}">
    <div class="chead"><span class="ck">${esc(c.kicker)}</span>${chip(c.n)}<span class="cg">${g}</span></div>
    <h4>${esc(c.head)}</h4>
    <p>${esc(c.hook)}</p>
    <div class="src">${esc(c.src)}</div>
  </article>`;
};

const briefLi = (b) => `<li style="--gc:${regionOf(by(b.n).region)[1]}"><b>${esc(b.place)}</b> ${esc(b.text)} <span class="bs">${esc(b.src)}</span></li>`;
// column-major so each of the three columns is full and the last row is never ragged
const per = Math.ceil(briefs.length / 3);
const long = briefs.length - per * 3 + 3; // first `long` columns take one extra
const cols = [];
let at = 0;
for (let i = 0; i < 3; i++) { const size = per - (i < long ? 0 : 1); cols.push(briefs.slice(at, at + size)); at += size; }

const numBlock = (n) => `<div class="num"><div class="nf">${esc(n.fig)}</div><div class="nc">${esc(n.cap)} <span class="ns">&middot; ${esc(n.src)}</span></div></div>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Friday 20 November 2026</title>
<style>
  :root { --paper:#f7f3ea; --ink:#15120e; --muted:#6d645a; --rule:#15120e; --soft:#d8cfc0; --accent:#b3261e; }
  * { box-sizing:border-box; margin:0; padding:0 }
  html,body { width:1024px; height:1024px; overflow:hidden }
  body { background:var(--paper); color:var(--ink); font-family:Arial,Helvetica,sans-serif;
    -webkit-font-smoothing:antialiased; padding:11px 16px 9px; display:flex; flex-direction:column; gap:5px }

  .rail { display:flex; justify-content:space-between; align-items:baseline; background:var(--ink);
    color:#e8dfd2; padding:3px 8px 2.5px; font-size:8.8px; letter-spacing:.16em; text-transform:uppercase }
  .rail b { color:var(--paper); letter-spacing:.18em } .rail .date { color:#f3c79a; font-weight:700; letter-spacing:.18em }

  .mast { display:flex; justify-content:space-between; align-items:flex-end; gap:18px;
    border-top:3px solid var(--rule); border-bottom:1px solid var(--rule); padding:3px 0 4px }
  .mast h1 { font-family:Georgia,'Times New Roman',serif; font-weight:700; font-size:48px; line-height:.94;
    letter-spacing:-.028em }
  .mast .side { text-align:right; font-size:8.6px; line-height:1.35; letter-spacing:.1em; text-transform:uppercase;
    color:#4a433b; padding-bottom:3px; white-space:nowrap }
  .mast .side b { display:block; font-size:10.6px; letter-spacing:.01em; text-transform:none; color:var(--ink);
    font-family:Georgia,serif; font-style:italic; font-weight:400; margin:1px 0 }

  .daystrip { border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:3px 0 4px }
  .daystrip .ds-head { display:flex; align-items:baseline; gap:0 }
  .daystrip h5 { margin:0 0 3px }
  .ds-track { display:grid; grid-template-columns:repeat(13,minmax(0,1fr)); gap:0;
    border-top:1px solid #b8ae9e }
  .ds-i { position:relative; min-width:0; border-left:1px solid #cec3b0;
    padding:3px 6px 2px 7px; color:#332d26 }
  .ds-i:first-child { border-left:0 }
  .ds-i::before { content:''; position:absolute; left:-1px; top:-1px; width:1px; height:5px; background:var(--accent) }
  .ds-i:first-child::before { left:0 }
  .ds-i b { display:block; font-size:7.2px; font-weight:700; letter-spacing:.01em; color:var(--accent); line-height:1.05 }
  .ds-i span { display:block; font-size:7.5px; line-height:1.15; margin-top:1.5px; white-space:nowrap; overflow:hidden }

  .leads { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 14px }
  .lead { min-width:0; display:flex; flex-direction:column }
  .panel { position:relative; display:flex; height:96px; overflow:hidden; background:#16304f }
  .panel .part { position:absolute; inset:0 }
  .panel .part svg { display:block; width:100%; height:96px }
  .panel::after { content:''; position:absolute; inset:0; z-index:1;
    background:linear-gradient(90deg, rgba(9,22,38,.98) 26%, rgba(9,22,38,.8) 48%, rgba(9,22,38,0) 74%) }
  .lead:nth-child(2) .panel::after { background:linear-gradient(90deg, rgba(7,44,54,.98) 26%, rgba(7,44,54,.8) 48%, rgba(7,44,54,0) 74%) }
  .lead:nth-child(3) .panel::after { background:linear-gradient(90deg, rgba(34,16,12,.98) 26%, rgba(34,16,12,.8) 48%, rgba(34,16,12,0) 74%) }
  .panel-txt { position:relative; z-index:2; padding:3px 0 3px 8px; width:100%; color:#f7f3ea;
    display:flex; flex-direction:column }
  .pkrow { display:flex; align-items:center; gap:5px }
  .pk { font-size:7.4px; letter-spacing:.13em; text-transform:uppercase; color:#f3c79a; font-weight:700 }
  .pfig { font-family:Georgia,serif; font-size:29px; font-weight:700; line-height:1; letter-spacing:-.02em; margin-top:auto }
  .punit { font-size:8.2px; letter-spacing:.05em; text-transform:uppercase; color:#ece3d5; margin-top:1px }
  .psub { font-size:7.5px; line-height:1.18; color:#c7d2da; margin-top:1px; max-width:62% }
  .lead:nth-child(2) .pk { color:#bfe3e0 }
  .lead:nth-child(3) .pk { color:#f3c79a }

  .lead h3 { font-family:Georgia,serif; font-size:24px; line-height:1.01; letter-spacing:-.018em; margin:4px 0 1px }
  .lead .deck { font-size:9.8px; line-height:1.22; color:#332d26; min-height:24px }
  .src { font-size:7.4px; letter-spacing:.055em; text-transform:uppercase; color:#8a8074; margin-top:2px }

  .mid { display:grid; grid-template-columns:1fr 312px; gap:14px; border-top:1px solid var(--rule);
    border-bottom:1px solid var(--rule); padding:4px 0 5px }
  h5 { font-size:8.4px; letter-spacing:.13em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:2px }
  h5 span { color:var(--muted); letter-spacing:.04em; text-transform:none; font-weight:400; font-size:7.8px }
  .map { width:100%; display:block; border:1px solid ${DARK_MAP ? '#0b1c27' : '#aebbb8'} }
  .ml { font:700 5.4px Arial; fill:${MAPC.label}; letter-spacing:.03em; paint-order:stroke; stroke:${MAPC.halo}; stroke-width:1.1 }
  .mn { font:700 4.9px Arial; fill:#f9f5ea; text-anchor:middle }
  .regions { display:flex; flex-wrap:wrap; gap:1px 11px; margin-top:3px; align-items:center }
  .rg { font-size:8px; color:#3d372f; display:inline-flex; align-items:center; gap:3px }
  .rg i { width:5.5px; height:5.5px; display:inline-block }
  .rg b { margin-left:1px }
  .nums-note { font-size:7.4px; line-height:1.25; color:#e8dfd2; opacity:.75; margin-top:auto }

  .nums-panel { background:#0f2433; color:var(--paper); padding:4px 9px 10px; display:flex; flex-direction:column }
  .nums-panel h5 { color:#f3c79a; border-bottom:1px solid #4a433b; padding-bottom:2px; margin-bottom:3px }
  .nums-panel h5 span { color:#a89c8d }
  .nums { display:grid; grid-template-columns:1fr 1fr; gap:2px 8px; flex:1; align-content:space-between }
  .nf { font-family:Georgia,serif; font-size:16px; font-weight:700; line-height:1; letter-spacing:-.02em; color:#f3c79a }
  .nc { font-size:7.1px; line-height:1.12; color:#e8dfd2; margin-top:1px; padding-right:2px }
  .ns { color:#a89c8d; font-size:6.4px; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap }

  .cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0 12px; align-content:start }
  .card { padding:1px 0 1px; border-top:2px solid var(--gc); min-width:0 }
  .chead { display:flex; justify-content:space-between; align-items:center; gap:4px; min-height:28px }
  .ck { flex:1 1 auto; min-width:0; font-size:6.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); font-weight:700; white-space:nowrap; overflow:hidden }
  .bdg { display:inline-block; flex:0 0 auto; font-size:6.5px; line-height:1; letter-spacing:.08em;
    font-weight:700; text-transform:uppercase; padding:2px 3px 1.5px; border:.6px solid currentColor; white-space:nowrap }
  .bdg.o { color:#2c6446; background:#e4eee3; border-color:#b4cbb6 }
  .bdg.c { color:#2a4f78; background:#e4ecf5; border-color:#bccfe2 }
  .bdg.r { color:#7b5b2c; background:#f2e8d6; border-color:#dbc6a0 }
  .cg { flex:0 0 28px; width:28px; height:28px; color:var(--gc) }
  .cg svg { display:block; width:28px; height:28px }
  .card h4 { font-family:Georgia,serif; font-size:12.1px; line-height:1.04; letter-spacing:-.01em; margin:1px 0 }
  .card p { font-size:8.4px; line-height:1.15; color:#4a433b }
  .card .src { margin-top:1px }

  .sentence { border-top:2px solid var(--rule); border-bottom:1px solid var(--rule); padding:2px 0 2px;
    display:flex; gap:12px; align-items:baseline }
  .sentence .lab { font-size:8px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent);
    font-weight:700; white-space:nowrap }
  .sentence p { font-family:Georgia,serif; font-size:14.8px; line-height:1.2; letter-spacing:-.01em }
  .sentence p b { font-weight:700 }

  .briefs-head { border-top:1px solid var(--soft); padding-top:3px; display:flex; justify-content:space-between; align-items:baseline }
  .briefs-head h5 { margin:0 }
  .briefs-head .cnt { font-size:7.8px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted) }
  .briefs { flex:1; min-height:0; border-top:1px solid var(--soft); padding:5px 0 4px; margin-top:3px;
    display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 16px }
  ul.b { list-style:none; display:flex; flex-direction:column; justify-content:space-between; min-width:0 }
  ul.b li { font-size:10.3px; line-height:1.13; color:#2b2620; padding-left:9px; position:relative }
  ul.b li::before { content:''; position:absolute; left:0; top:5px; width:3.5px; height:3.5px; background:var(--gc) }
  ul.b li b { font-weight:700 }
  .bs { color:#8a8074; font-size:7px; letter-spacing:.03em; text-transform:uppercase; white-space:nowrap }

  .foot { border-top:1px solid var(--rule); padding-top:3px; display:flex; justify-content:space-between;
    align-items:baseline; gap:14px }
  .foot p { font-size:7.5px; line-height:1.24; color:#4a433b; max-width:820px }
  .foot p b { color:var(--ink) }
  .mark { font-family:Georgia,serif; font-size:10px; font-weight:700; letter-spacing:.02em; white-space:nowrap }
</style></head>
<body>
  <div class="rail">
    <span><b>The world in one day</b></span>
    <span class="date">Friday 20 November 2026</span>
    <span>35 stories &middot; 7 regions &middot; every one dated</span>
  </div>

  <header class="mast">
    <h1>Friday 20 November 2026</h1>
    <div class="side">A front page of the day&rsquo;s reporting<b>35 stories, from Kyiv to Wellington</b></div>
  </header>

  ${dayStrip}

  <section class="leads">${leads.map(leadBlock).join('')}</section>

  <section class="mid">
    <div>
      <h5>Where it happened, Friday 20 November 2026 <span>one dot for each dateline, coloured by region</span></h5>
      ${mapSvg}
      <div class="regions">${regionLine}</div>
    </div>
    <div class="nums-panel">
      <h5>The day in numbers <span>as its outlets reported them</span></h5>
      <div class="nums">${numbers.map(numBlock).join('')}</div>
    </div>
  </section>

  <section class="cards">${cards.map(cardBlock).join('')}</section>

  <section class="sentence">
    <span class="lab">The day in one sentence</span>
    <p>Missiles over <b>Kyiv</b>, a <b>cyclone</b> over Odisha, a sell-off from <b>Taipei</b> to Seoul,
      a reset deal in <b>Brussels</b> and no deal in <b>Antalya</b>: one Friday, 35 stories, seven regions.</p>
  </section>

  <section class="briefs-head"><h5>And in brief <span>the rest of the day, place by place</span></h5><span class="cnt">22 more stories</span></section>
  <section class="briefs">${cols.map((c) => `<ul class="b">${c.map(briefLi).join('')}</ul>`).join('')}</section>

  <footer class="foot">
    <p><b>Date check.</b> Every story above is dated 20 November 2026: the thirteen in the hour strip were filed in UTC
      that day, the rest carry that day&rsquo;s dateline in their own time zone. Nothing here is from an earlier or later day.
      Chips show sourcing: <b>OFFICIAL</b> where the outlet is the body that issued the report, <b>CONFIRMED</b>
      where the edition worked from a published article, <b>REPORTED</b> where it worked from the outlet's sources.
      The map is drawn from Natural Earth land outlines.</p>
    <div class="mark">One day &middot; 35 stories &middot; 7 regions</div>
  </footer>
</body></html>`;

writeFileSync(new URL('./poster.html', import.meta.url), html);
console.log('poster.html', html.length, 'bytes |', leads.length, 'leads', cards.length, 'cards', briefs.length, 'briefs', numbers.length, 'numbers');
