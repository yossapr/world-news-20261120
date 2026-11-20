import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { edition } from './editorial.mjs';

const paper = '#f4eee0';
const ink = '#172c37';
const muted = '#3d535a';
const navy = '#102c3e';
const white = '#fff8eb';
const mint = '#b3dfd0';
const gold = '#ffcb83';
const blue = '#b5d7f1';
const red = '#f4a58e';
const serif = 'Georgia';
const sans = 'Arial';

const xml = value => value.replace(/[&<>"]/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[ch]));

function text(value, x, y, size, options = {}) {
  const { fill = ink, font = sans, weight = 400, spacing = 0, anchor = 'start' } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" text-anchor="${anchor}">${xml(value)}</text>`;
}

function lines(values, x, y, size, advance, options) {
  return values.map((value, i) => text(value, x, y + i * advance, size, options)).join('');
}

function rect(x, y, w, h, fill, radius = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
}

function line(x1, y1, x2, y2, color, width = 1) {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
}

function bridgeDiagram() {
  const bridges = [[171, 32], [185, 64], [178, 96]];
  return `
    <path d="M163 -4C130 29 204 43 183 78c-11 21-16 33-3 54" fill="none" stroke="#47798f" stroke-width="47"/>
    <path d="M163 -4C130 29 204 43 183 78c-11 21-16 33-3 54" fill="none" stroke="#6d9eaa" stroke-width="1.5"/>
    ${bridges.map(([x, y]) => `
      ${line(x - 41, y, x + 39, y, blue, 4)}
      ${line(x - 41, y + 6, x + 39, y + 6, blue)}
      <circle cx="${x}" cy="${y + 2}" r="9" fill="#6d3640" stroke="${red}" stroke-width="2"/>
      <path d="m${x - 3} ${y - 1} 6 6m0-6-6 6" stroke="${white}" stroke-width="2"/>
    `).join('')}
    ${text('3', 18, 78, 65, { font: serif, fill: white, weight: 700 })}
    ${text('BRIDGES HIT', 19, 102, 14, { fill: red, weight: 700, spacing: 0.6 })}
    ${text('DNIPRO', 282, 45, 14, { fill: blue, weight: 700, anchor: 'end' })}
    ${text('Schematic', 282, 108, 13, { fill: blue, anchor: 'end' })}
  `;
}

function cycloneMap() {
  // The outline is the same simplified Natural Earth coastline as the earlier edition.
  const land = 'M894 158L872 177L880 211L865 235L842 255L833 252L838 256L832 261L791 274L786 274L790 270L786 262L770 270L766 280L778 275L782 278L740 310L698 362L669 377L640 406L587 438L582 448L585 465L558 483L558 151L923 151L894 158Z';
  const project = (lon, lat) => [(lon - 81.9) * 43, (21.65 - lat) * 43];
  const [townX, townY] = project(84.86, 19.26);
  const [stormX, stormY] = project(84.9, 20.0);
  const [northX, northY] = project(85.05, 21.3);
  return `
    <path d="${land}" transform="translate(-377.9 -102.3) scale(.677)" fill="#356e73" stroke="#acc9bc" stroke-width="2.4"/>
    ${text('ODISHA', 14, 27, 15, { fill: white, weight: 700, spacing: .6 })}
    ${text('BAY OF BENGAL', 287, 101, 13, { fill: mint, weight: 700, anchor: 'end' })}
    <path d="M${stormX} ${stormY - 10}L${northX} ${northY}" stroke="${gold}" stroke-width="3" stroke-dasharray="5 4" fill="none" marker-end="url(#arrow)"/>
    <path d="M${townX - 6} ${townY - 2}L${townX - 18} ${townY - 9}H14" stroke="${gold}" stroke-width="1.6" fill="none"/>
    <circle cx="${townX}" cy="${townY}" r="4.5" fill="${gold}" stroke="${navy}" stroke-width="1.5"/>
    ${text('Gopalpur', 14, townY - 14, 16, { fill: gold, weight: 700 })}
    <circle cx="${stormX}" cy="${stormY}" r="6" fill="#f9faf0" stroke="${navy}" stroke-width="1.6"/>
    ${line(stormX + 7, stormY, 146, stormY, white, 1.4)}
    ${rect(146, stormY - 23, 128, 33, navy, 3)}
    ${text('14:30 IST center', 154, stormY - 3, 15, { fill: white, weight: 700 })}
    ${line(260, 31, 260, 17, mint, 1.5)}
    <path d="m256 23 4-6 4 6" stroke="${mint}" stroke-width="1.5" fill="none"/>
    ${text('N', 270, 29, 12, { fill: mint, weight: 700 })}
  `;
}

function marketChart() {
  const originX = 97;
  const plotWidth = 121;
  const scale = plotWidth / 7;
  return `
    ${text('FRIDAY CLOSE  /  DAILY CHANGE', 15, 19, 13.2, { fill: white, weight: 700, spacing: .4 })}
    ${line(originX, 29, originX, 112, blue)}
    ${edition.markets.map(({ name, change }, i) => {
      const y = 34 + i * 28;
      return `
        ${text(name, 15, y + 14, 16, { fill: white, weight: 700 })}
        ${rect(originX, y, plotWidth, 15, '#254356', 3)}
        ${rect(originX, y, Math.abs(change) * scale, 15, red, 3)}
        ${text(`−${Math.abs(change).toFixed(2)}%`, 289, y + 14, 17, { fill: white, weight: 700, anchor: 'end' })}
      `;
    }).join('')}
    ${text('0%', originX, 125, 11.8, { fill: blue })}
    ${text('7% fall', originX + plotWidth, 125, 11.8, { fill: blue, anchor: 'end' })}
  `;
}

const art = {
  kyiv: { color: blue, draw: bridgeDiagram },
  akvan: { color: mint, draw: cycloneMap },
  markets: { color: red, draw: marketChart },
};

function leadCard(item, x) {
  const y = 130;
  const artWidth = 306;
  const { color, draw } = art[item.theme];
  const isMap = item.theme === 'akvan';
  return `<g transform="translate(${x} ${y})">
    ${rect(0, 0, 306, 303, '#e8e4d8', 5)}
    ${rect(0, 0, 306, 157, navy, 5)}
    ${text(item.label, 13, 22, 15, { fill: color, weight: 700, spacing: .75 })}
    <svg x="0" y="28" width="${artWidth}" height="128" viewBox="0 0 306 128" overflow="hidden">
      ${rect(0, 0, artWidth, 128, '#153849')}
      ${draw()}
    </svg>
    ${isMap ? `<g transform="translate(0 153)">
      ${rect(0, 0, 306, 24, navy)}
      <circle cx="13" cy="12" r="3.8" fill="${gold}"/>
      ${text('Town', 22, 17, 14, { fill: white, weight: 700 })}
      <circle cx="75" cy="12" r="4" fill="${white}"/>
      ${text('Observed center', 85, 17, 14, { fill: white, weight: 700 })}
      <path d="M198 12h20m-5-4 5 4-5 4" stroke="${gold}" stroke-width="1.8" stroke-dasharray="4 2" fill="none"/>
      ${text('Forecast', 226, 17, 14, { fill: white, weight: 700 })}
    </g>` : `<g transform="translate(0 153)">
      ${rect(0, 0, 306, 24, navy)}
      ${text(item.theme === 'kyiv' ? 'OVERNIGHT INTO FRIDAY' : 'LOCAL MARKET CLOSES', 13, 17, 12.5, { fill: color, weight: 700, spacing: .65 })}
    </g>`}
    ${lines(item.title, 13, 207, 27.5, 29, { font: serif, weight: 700 })}
    ${lines(item.detail, 13, 259, 16.7, 19, { fill: muted })}
    ${text(item.source, 13, 296, 10.9, { fill: muted, weight: 700, spacing: .25 })}
  </g>`;
}

const symbols = {
  treaty: '<path d="M6 12h22l6 6-6 6H6zm26 8h22l6 6-6 6H32l-6-6z"/>',
  overtime: '<circle cx="31" cy="22" r="16"/><path d="M31 12v10l7 5m9-17 7-3v9m0-9-7 7"/>',
  port: '<path d="M10 33h45M15 31V11h30l10 7H15m13 0v10m17-10v10M11 37q5 4 10 0 5 4 10 0 5 4 10 0 5 4 10 0"/>',
  rig: '<path d="M13 39h39M22 39l10-32 10 32M24 31h16M26 23h12M29 16h6M18 39v-9h6m18 9V27h6v12"/>',
  learning: '<path d="M32 15q-10-9-23-5v22q13-4 23 5 10-9 23-5V10q-13-4-23 5v22M16 17l9 1m14 0 9-1M16 23l9 1m14 0 9-1"/>',
  dialogue: '<path d="M9 10h30v17H22l-9 6v-6H9zm20 19h12l9 6v-6h5V14H42M15 18h17"/>',
};

const palettes = {
  blue: ['#dce8eb', '#2c5369'],
  green: ['#e0ebe0', '#34614e'],
  gold: ['#f3e6c9', '#775119'],
  red: ['#f1ded5', '#8b3e35'],
};

function reportCard(item, x, y) {
  const [background, foreground] = palettes[item.tone];
  const graphic = item.metric
    ? text(item.metric, 220, 23, 16, { fill: foreground, weight: 700, anchor: 'end' })
    : `<g transform="translate(178 6) scale(.72)" fill="none" stroke="${foreground}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${symbols[item.icon]}</g>`;
  return `<g transform="translate(${x} ${y})">
    ${rect(0, 0, 232, 138, background, 4)}
    ${rect(0, 0, 232, 3, foreground)}
    ${graphic}
    ${text(item.label, 11, 23, 14.2, { fill: foreground, weight: 700, spacing: .55 })}
    ${lines(item.title, 11, 52, 24, 25, { font: serif, weight: 700 })}
    ${lines(item.detail, 11, 100, 17.3, 19, { fill: muted })}
    ${text(item.source, 11, 132, 11.2, { fill: foreground, weight: 700, spacing: .18 })}
  </g>`;
}

function briefColumn(items, x) {
  return items.map(({ label, detail }, i) => {
    const y = 779 + i * 23;
    return `
      ${rect(x, y, 468, 23, i % 2 ? '#eee8d9' : paper)}
      <text x="${x + 4}" y="${y + 17}" font-family="${sans}" font-size="20" fill="${ink}">
        <tspan font-size="16.5" font-weight="700" fill="#813b30">${xml(label)}</tspan><tspan> · ${xml(detail)}</tspan>
      </text>
    `;
  }).join('');
}

function frontPage() {
  const reportCount = edition.leads.length + edition.reports.length + edition.briefColumns.flat().length;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
        <path d="M1 1l4 2-4 2" stroke="${gold}" stroke-width="1.3" fill="none"/>
      </marker>
    </defs>
    ${rect(0, 0, 1024, 1024, paper)}
    ${rect(0, 0, 1024, 6, '#963d31')}
    ${text('WORLD IN VIEW', 34, 37, 23, { weight: 700, spacing: 3 })}
    ${text(`${reportCount} REPORTS ACROSS SIX CONTINENTS`, 990, 36, 16, { anchor: 'end', fill: muted, weight: 700, spacing: 1 })}
    ${text(edition.date, 31, 101, 62, { font: serif, weight: 700 })}
    ${line(34, 119, 990, 119, '#9eaca5', 1.5)}
    ${edition.leads.map((item, i) => leadCard(item, 34 + i * 325)).join('')}
    ${text('AROUND THE WORLD', 34, 460, 21, { weight: 700, spacing: 1.5 })}
    ${line(309, 451, 990, 451, '#9eaca5', 1.5)}
    ${edition.reports.map((item, i) => reportCard(item, 34 + (i % 4) * 241, 472 + Math.floor(i / 4) * 146)).join('')}
    ${text('IN BRIEF', 34, 775, 18.5, { weight: 700, spacing: 1.4 })}
    ${line(143, 769, 990, 769, '#9eaca5', 1.5)}
    ${edition.briefColumns.map((column, i) => briefColumn(column, 34 + i * 488)).join('')}
    ${rect(0, 988, 1024, 36, navy)}
    ${text('REPORTING SNAPSHOT', 34, 1011, 14, { fill: gold, weight: 700, spacing: 1 })}
    ${text(`As reported by ${edition.cutoff} · Event dates follow local time`, 990, 1011, 15, { fill: white, anchor: 'end' })}
  </svg>`;
}

const [rendererPath, outputPath] = process.argv.slice(2);
if (!rendererPath || !outputPath) {
  throw new Error('Usage: node render.mjs <resvg-js module file URL> <output PNG>');
}
const { Resvg } = await import(rendererPath);
const rendered = new Resvg(frontPage(), { font: { loadSystemFonts: true, defaultFontFamily: sans } }).render();
writeFileSync(resolve(outputPath), rendered.asPng());
