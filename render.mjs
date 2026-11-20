import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { edition } from './editorial.mjs';

const cream = '#f8f1e3';
const paper = '#eae1cd';
const ink = '#152d31';
const muted = '#455d5d';
const rust = '#9b3927';
const gold = '#f2be72';
const sea = '#092f38';
const sans = 'Arial';
const serif = 'Georgia';
const width = 1024;

const xml = value => value.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function text(value, x, y, size, options = {}) {
  const { fill = ink, font = sans, weight = 400, spacing = 0, anchor = 'start' } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" text-anchor="${anchor}">${xml(value)}</text>`;
}
function lines(values, x, y, size, lineHeight, options) {
  return values.map((value, i) => text(value, x, y + i * lineHeight, size, options)).join('');
}
const rule = (x1, y1, x2, y2, color = '#a99e89', stroke = 1) =>
  `<path d="M${x1} ${y1}H${x2}V${y2}" stroke="${color}" stroke-width="${stroke}" fill="none"/>`;

const symbols = {
  prices: '<path d="M4 47h49M9 42V29m12 13V21m12 21V25m12 17V11M7 25l13-9 13 3 13-13"/><path d="M38 6h8v8"/>',
  pine: '<path d="M7 41 18 23h-5l10-16 10 16h-5l11 18H7Zm16 0v11M40 49c-7-5-7-10-3-16 0 5 3 6 5 6-1-6 2-10 5-14 0 6 5 11 6 16 1 6-3 9-6 10"/>',
  orbit: '<circle cx="28" cy="28" r="22"/><ellipse cx="28" cy="28" rx="10" ry="22"/><path d="M7 21h42M7 35h42M28 6v44"/>',
  summit: '<path d="m5 19 23-11 23 11H5Zm3 29h40m-36-5h32M15 23v17m9-17v17m8-17v17m9-17v17"/><circle cx="28" cy="16" r="1"/>',
  health: '<path d="M23 7h10v14h14v10H33v14H23V31H9V21h14Z"/><circle cx="28" cy="26" r="24" opacity=".35"/>',
  history: '<path d="M28 15C22 8 13 8 5 10v33c11-3 17-1 23 3 6-4 12-6 23-3V10c-8-2-17-2-23 5Zm0 0v31M10 19c5-1 9 0 13 2m-13 7c5-1 9 0 13 2m10-9c4-2 8-3 13-2m-13 11c4-2 8-3 13-2"/>',
  storm: '<path d="M50 12c-17-10-39 0-39 17 0 13 18 23 30 12 8-7 4-18-4-19-7-1-10 5-9 8M6 44c17 10 39 0 39-17 0-13-18-23-30-12-8 7-4 18 4 19 7 1 10-5 9-8"/>',
};
function icon(name, x, y, scale, color) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${color}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" fill="none">${symbols[name]}</g>`;
}

function cyclone() {
  // Simplified Natural Earth land, clipped to 81.9–88.7°E and 16.3–21.65°N.
  const land = 'M894 158L872 177L880 211L865 235L842 255L833 252L838 256L832 261L791 274L786 274L790 270L786 262L770 270L766 280L778 275L782 278L740 310L698 362L669 377L640 406L587 438L582 448L585 465L558 483L558 151L923 151L894 158Z';
  function project(lon, lat) {
    return [558 + (lon - 81.9) * 431 / 6.8, 151 + (21.65 - lat) * 337 / 5.35];
  }
  const [townX, townY] = project(84.86, 19.26);
  const [stormX, stormY] = project(84.9, 17.7);
  const [forecastX, forecastY] = project(85.0, 19.3);
  return `<g clip-path="url(#panel)">
    <rect x="558" y="151" width="431" height="337" fill="url(#water)"/>
    <rect x="558" y="151" width="431" height="337" fill="url(#grid)"/>
    <path d="${land}" fill="#397078" stroke="#a8c8bd" stroke-width="2"/>
    ${text('ODISHA', 725, 199, 22, { fill: cream, weight: 700, spacing: 1 })}
    ${lines(['ANDHRA', 'PRADESH'], 575, 327, 20, 24, { fill: cream, weight: 700, spacing: .6 })}
    ${text('BAY OF BENGAL', 967, 278, 18, { fill: '#b5d9c9', weight: 700, anchor: 'end' })}
    <path d="M950 220v-27m-5 6 5-8 5 8" stroke="#b5d9c9" stroke-width="2" fill="none"/>
    ${text('N', 950, 186, 17, { fill: '#b5d9c9', anchor: 'middle', weight: 700 })}
    <path d="M${stormX} ${stormY-13}L${forecastX} ${forecastY+13}" stroke="${gold}" stroke-width="3" stroke-dasharray="7 6" fill="none" marker-end="url(#arrow)"/>
    <path d="M${townX-7} ${townY-6}L${townX-27} ${townY-25}H585" stroke="${gold}" stroke-width="2" fill="none"/>
    <circle cx="${townX}" cy="${townY}" r="6" fill="${gold}" stroke="${sea}" stroke-width="2"/>
    ${text('GOPALPUR', 585, townY-33, 21, { fill: gold, weight: 700 })}
    ${text('FORECAST', 771, 352, 18, { fill: gold, weight: 700, spacing: .5 })}
    <circle cx="${stormX}" cy="${stormY}" r="8" fill="#e2eae1" stroke="${sea}" stroke-width="2"/>
    ${text('AKVAN CENTER', 771, stormY-3, 18, { fill: cream, weight: 700 })}
    ${text('02:30 IST', 771, stormY+21, 17, { fill: cream })}
    ${text('IMD BULLETIN 36  /  20 NOV', 968, 472, 15, { fill: '#b5d9c9', anchor: 'end', weight: 700, spacing: .4 })}
  </g>`;
}

function report(item, x, y) {
  return `${rule(x, y, x + 300, y, ink, 2)}
    ${text(item.label, x, y + 26, 16, { fill: rust, weight: 700, spacing: 0.7 })}
    ${icon(item.symbol, x + 260, y + 7, 0.65, rust)}
    ${lines(item.title, x, y + 67, 27, 30, { font: serif, weight: 700 })}
    ${lines(item.detail, x, y + 103, 21, 24, { fill: muted })}
    ${text(item.source, x, y + 152, 12, { fill: muted, weight: 700, spacing: 0.8 })}`;
}

function agendaCard(item, x, y, i) {
  const alternate = i % 2 ? '#f8f1e3' : '#e5dac1';
  return `<rect x="${x}" y="${y}" width="230" height="215" fill="${alternate}"/>
    ${icon(item.symbol, x + 181, y + 10, 0.64, rust)}
    ${text(item.label, x + 12, y + 30, 13.5, { fill: rust, weight: 700, spacing: 0.3 })}
    ${lines(item.title, x + 12, y + 80, 24, 30, { font: serif, weight: 700 })}
    ${lines(item.detail, x + 12, y + 146, 17.5, 22, { fill: ink })}
    ${text(item.source, x + 12, y + 199, 11.5, { fill: muted, spacing: 0.7, weight: 700 })}`;
}

function frontPage() {
  const hero = edition.hero;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#0e4550"/><stop offset="1" stop-color="#061e28"/>
      </linearGradient>
      <pattern id="grid" width="29" height="29" patternUnits="userSpaceOnUse">
        <path d="M0 29V0H29" fill="none" stroke="#76a0a3" stroke-opacity=".32" />
      </pattern>
      <clipPath id="panel"><rect x="558" y="151" width="431" height="337"/></clipPath>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M1 1l6 3-6 3" stroke="${gold}" stroke-width="1.5" fill="none"/>
      </marker>
    </defs>
    <rect width="${width}" height="${width}" fill="${paper}"/>
    ${rule(36, 31, 988, 31, rust, 3)}
    ${text(edition.masthead, 33, 101, 69, { font: serif, weight: 700, spacing: -2 })}
    ${text(edition.date, 986, 103, 22, { fill: rust, weight: 700, anchor: 'end', spacing: .8 })}
    ${rule(36, 125, 988, 125, ink, 2)}
    <rect x="36" y="151" width="952" height="337" fill="${sea}"/>
    ${cyclone()}
    ${text(hero.label, 61, 194, 20, { fill: gold, weight: 700, spacing: 1.6 })}
    ${lines(hero.title, 60, 260, 52, 55, { fill: cream, font: serif, weight: 700 })}
    ${lines(hero.detail, 62, 364, 24, 30, { fill: cream })}
    ${text(hero.metric, 60, 437, 29, { fill: gold, weight: 700, spacing: .5 })}
    ${text(hero.unit, 240, 436, 16, { fill: gold, weight: 700, spacing: .6 })}
    ${text(hero.source, 62, 473, 12, { fill: '#b5d9c9', weight: 700, spacing: 1 })}
    ${edition.reports.map((item, i) => report(item, 36 + i * 326, 512)).join('')}
    <rect x="36" y="686" width="952" height="55" fill="${ink}"/>
    ${text('ON FRIDAY’S AGENDA', 51, 722, 27, { fill: cream, weight: 700, spacing: 1.6 })}
    ${text('SCHEDULED / EXPECTED', 970, 721, 16, { fill: '#d5d9cb', weight: 700, anchor: 'end', spacing: 1 })}
    ${edition.agenda.map((item, i) => agendaCard(item, 36 + i * 240, 752, i)).join('')}
    ${rule(36, 983, 988, 983)}
    ${text('EARLY EDITION', 36, 1006, 15, { fill: muted, weight: 700, spacing: 2 })}
    ${text('REPORTING DATES FOLLOW LOCAL TIME', 988, 1006, 14, { fill: muted, weight: 700, anchor: 'end', spacing: 1 })}
  </svg>`;
}

const rendererPath = process.argv[2];
const outputPath = process.argv[3];
if (!rendererPath || !outputPath) {
  throw new Error('Usage: node render.mjs <resvg-js module file URL> <output PNG>');
}
const { Resvg } = await import(rendererPath);
const rendered = new Resvg(frontPage(), { font: { loadSystemFonts: true, defaultFontFamily: sans } }).render();
writeFileSync(resolve(outputPath), rendered.asPng());
