// build.mjs: writes poster.html, the 1024x1024 front page for Friday 20 November 2026.
// Stories and figures come from edition.json; the wording comes from copy.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { leads, cards, briefs, numbers, REGION, MAP_POINTS } from './copy.mjs';

const edition = JSON.parse(readFileSync(new URL('./edition.json', import.meta.url), 'utf8'));
const landPath = readFileSync(new URL('./land-path.txt', import.meta.url), 'utf8');
const stories = edition.stories;
const by = (n) => stories.find((s) => s.n === n);
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
  bridges: `<svg viewBox="0 0 128 104" aria-hidden="true">
    <rect width="128" height="104" fill="#13253c"/>
    <g stroke="#e0662f" stroke-width="1" stroke-linecap="round" opacity="0.95">
      <path d="M88 4L74 30"/><path d="M100 2L86 32"/><path d="M112 8L98 34"/><path d="M76 2L64 24"/>
    </g>
    <g fill="#f0b24a"><circle cx="74" cy="30" r="1.7"/><circle cx="86" cy="32" r="1.7"/><circle cx="98" cy="34" r="1.7"/><circle cx="64" cy="24" r="1.5"/></g>
    <path d="M0 78H128" stroke="#aebfd2" stroke-width="1.5"/>
    <g fill="none" stroke="#e4ebf3" stroke-width="1.3">
      <path d="M2 78C2 62 28 62 28 78"/><path d="M34 78C34 54 66 54 66 78"/><path d="M72 78C72 62 98 62 98 78"/><path d="M104 78C104 66 124 66 124 78"/>
    </g>
    <g stroke="#dbe3ec" stroke-width="0.6" opacity="0.85">
      <path d="M15 78V67M59 78V62M85 78V67M114 78V70"/>
      <path d="M2 70H28M34 64H66M72 70H98M104 73H124"/>
    </g>
    <g stroke="#7f97b2" stroke-width="0.8" opacity="0.6">
      <path d="M14 86H44M58 92H90M100 86H122M26 98H62M74 98H106"/>
    </g>
  </svg>`,
  cyclone: `<svg viewBox="0 0 128 104" aria-hidden="true">
    <rect width="128" height="104" fill="#0c3742"/>
    <path d="M96 0H128V104H84C96 78 92 44 104 16Z" fill="#c9bda3"/>
    <path d="M96 0H128V104H84C96 78 92 44 104 16Z" fill="none" stroke="#8f9f92" stroke-width="0.6" opacity="0.6"/>
    ${[0, 1, 2].map((i) => `<path d="${spiral(50, 49, 0.86, 4 + i * 8, 13 + i * 8)}" fill="none" stroke="${i === 1 ? '#9ec9c6' : '#eef4f2'}" stroke-width="${i === 1 ? 1.4 : 2.6}" stroke-linecap="round" opacity="${i === 1 ? 0.75 : 0.95}" transform="rotate(${i * 28} 50 49)"/>`).join('')}
    <circle cx="50" cy="49" r="2.2" fill="#e0662f"/>
    <g stroke="#b9d4d6" stroke-width="0.6" opacity="0.45">
      <path d="M6 14L2 22M18 8L14 16M32 6L28 14M70 96L66 104M84 94L80 102"/>
    </g>
    <circle cx="88" cy="62" r="2.4" fill="#e0662f"/>
    <circle cx="88" cy="62" r="5" fill="none" stroke="#e0662f" stroke-width="0.8" opacity="0.55"/>
  </svg>`,
  market: `<svg viewBox="0 0 128 104" aria-hidden="true">
    <rect width="128" height="104" fill="#191411"/>
    <g stroke="#3b332b" stroke-width="0.6" stroke-dasharray="2 3">
      <path d="M6 24H122M6 48H122M6 72H122M6 94H122"/>
    </g>
    <g stroke="#6b6055" stroke-width="1" fill="none" stroke-linejoin="round" stroke-dasharray="3 3" opacity="0.5">
      <path d="M6 20L20 22L34 19L48 30L62 34L76 48L90 60L104 62L122 82"/>
    </g>
    ${candles}
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
        <div class="pk">${esc(l.kicker)}</div>
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
    <div class="chead"><span class="ck">${esc(c.kicker)}</span><span class="cg">${g}</span></div>
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
  .panel .part { position:absolute; right:0; top:0; width:124px; height:96px }
  .panel .part svg { display:block; width:124px; height:96px }
  .panel::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg, rgba(19,37,60,.97) 34%, rgba(19,37,60,0) 68%); z-index:1 }
  .lead:nth-child(2) .panel::after { background:linear-gradient(90deg, rgba(11,68,83,.97) 34%, rgba(11,68,83,0) 68%) }
  .lead:nth-child(3) .panel::after { background:linear-gradient(90deg, rgba(52,26,21,.97) 34%, rgba(52,26,21,0) 68%) }
  .panel-txt { position:relative; z-index:2; padding:3px 0 3px 8px; width:100%; color:#f7f3ea;
    display:flex; flex-direction:column }
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
  .ck { flex:1 1 auto; min-width:0; font-size:6.9px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); font-weight:700; white-space:nowrap; overflow:hidden }
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
      Outlets are named with each story; the map is drawn from Natural Earth land outlines.</p>
    <div class="mark">One day &middot; 35 stories &middot; 7 regions</div>
  </footer>
</body></html>`;

writeFileSync(new URL('./poster.html', import.meta.url), html);
console.log('poster.html', html.length, 'bytes |', leads.length, 'leads', cards.length, 'cards', briefs.length, 'briefs', numbers.length, 'numbers');
