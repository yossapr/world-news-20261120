import { readFileSync, writeFileSync } from 'node:fs';
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

const leadArt = {
  kyiv: { accent: blue, surface: '#214668', draw: bridgeDiagram },
  akvan: { accent: mint, surface: '#0d4353', draw: cycloneMap },
  markets: { accent: red, surface: '#38283b', draw: marketChart },
};

function leadCard(item, x) {
  const { accent, surface, draw } = leadArt[item.theme];
  const legend = item.theme === 'akvan' ? `
    <circle cx="13" cy="11" r="4.5" fill="${gold}"/>
    ${text('Town', 23, 16, 14, { fill: white, weight: 700 })}
    <circle cx="78" cy="11" r="4.5" fill="${white}"/>
    ${text('Observed center', 89, 16, 14, { fill: white, weight: 700 })}
    <path d="M205 11h20m-5-4 5 4-5 4" stroke="${gold}" stroke-width="2" stroke-dasharray="3 2" fill="none"/>
    ${text('Forecast', 233, 16, 14, { fill: white, weight: 700 })}
  ` : text(item.theme === 'kyiv' ? 'OVERNIGHT STRIKES' : 'NIKKEI / KBS / TWSE',
    13, 16, 13.5, { fill: accent, weight: 700, spacing: .7 });
  return `<g transform="translate(${x} 117)">
    ${rect(0, 0, 312, 259, '#fff9eb', 5)}
    ${rect(0, 0, 312, 181, navy, 5)}
    ${text(item.label, 13, 21, 15, { fill: accent, weight: 700, spacing: .75 })}
    <svg x="0" y="29" width="312" height="130" viewBox="0 0 306 128" overflow="hidden">
      ${rect(0, 0, 306, 128, surface)}
      ${draw()}
    </svg>
    <g transform="translate(0 160)">${legend}</g>
    ${lines(item.title, 12, 209, 26, 27, { font: serif, weight: 700 })}
    ${text(item.context, 13, 253, 15.2, { fill: muted, weight: 700 })}
  </g>`;
}

function star(x, y, radius, fill) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const r = i % 2 ? radius * .42 : radius;
    return `${(x + Math.cos(a) * r).toFixed(2)},${(y + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
  return `<polygon points="${points}" fill="${fill}"/>`;
}

function flag(x, y, w, h, code) {
  const union = `
    ${rect(0, 0, 78, 43, '#19356f')}
    <path d="M0 0l78 43M78 0L0 43" stroke="#fff" stroke-width="8"/>
    <path d="M0 0l78 43M78 0L0 43" stroke="#c93446" stroke-width="3.2"/>
    <path d="M39 0v43M0 21.5h78" stroke="#fff" stroke-width="13"/>
    <path d="M39 0v43M0 21.5h78" stroke="#c93446" stroke-width="7"/>
  `;
  const panels = {
    eu: `${rect(0, 0, 78, 43, '#194998')}
      ${Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        return star(39 + 13 * Math.sin(a), 21.5 + 13 * Math.cos(a), 2, '#ffda55');
      }).join('')}`,
    uk: union,
    cn: `${rect(0, 0, 78, 43, '#bd2939')}${star(13, 12, 7, '#ffcf58')}
      ${[[23, 6], [28, 11], [28, 17], [23, 21]].map(([sx, sy]) => star(sx, sy, 2.45, '#ffcf58')).join('')}`,
    au: `${rect(0, 0, 78, 43, '#19356f')}
      <svg x="0" y="0" width="39" height="21.5" viewBox="0 0 78 43" overflow="hidden">${union}</svg>
      ${[[20, 32, 4.7], [59, 8, 3.3], [48, 19, 3.3], [68, 17, 3.3], [59, 34, 3.3], [63, 25, 2.25]].map(([sx, sy, sr]) => star(sx, sy, sr, '#fff')).join('')}`,
  };
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 78 43" overflow="hidden">${panels[code]}</svg>`;
}

function pairFlags(left, right, surface) {
  return `
    ${rect(0, 0, 234, 62, surface)}
    ${flag(17, 10, 76, 42, left)}
    ${flag(141, 10, 76, 42, right)}
    <path d="M101 23h29m-7-6 7 6-7 6m10 10h-29m7-6-7 6 7 6" stroke="#fff3de" stroke-width="2.4" fill="none"/>
  `;
}

const photo = readFileSync(new URL('./xavier-nasa.jpg', import.meta.url)).toString('base64');

function sceneText(value, x, y, size, fill = white) {
  return text(value, x, y, size, { fill, weight: 700, spacing: .32 });
}

const scenes = {
  brussels: () => pairFlags('eu', 'uk', '#344c82'),
  shenzhen: () => pairFlags('cn', 'au', '#653c57'),
  antalya: () => `
    ${rect(0, 0, 234, 62, '#306d55')}
    <circle cx="43" cy="31" r="20" fill="#214f43" stroke="#b9e7cd" stroke-width="3"/>
    <path d="M43 17v14l11 6m-7-23v-5h-8v5" fill="none" stroke="#e9f7d4" stroke-width="3" stroke-linecap="round"/>
    ${sceneText('OVERTIME', 77, 33, 25)}
    ${sceneText('FUELS + FINANCE', 79, 49, 12.5, '#cce9d0')}
  `,
  yemen: () => `
    ${rect(0, 0, 234, 62, '#664254')}
    <path d="M109 0h125v47l-41 15-47-13-32-22-16-9z" fill="#a36c64"/>
    <path d="M126 0l24 16 9 14 27 11 14 18m-22-18 56-15" fill="none" stroke="#e2aa88" stroke-width="2"/>
    ${sceneText('SAUDI-LED', 14, 21, 17)}
    ${sceneText('COALITION', 14, 39, 17)}
    ${sceneText('YEMEN', 164, 34, 19)}
    ${sceneText('SCHEMATIC', 161, 51, 9.5, '#ffdfc0')}
  `,
  turkana: () => `
    ${rect(0, 0, 234, 62, '#84542f')}
    <path d="M0 49l49-12 52 13 50-13 83 11v14H0z" fill="#d59557"/>
    <path d="M0 53l49-8 43 12 60-11 82 8v8H0z" fill="#b67347"/>
    <path d="M27 49L47 10l19 39M32 39h28M36 30h20M41 21h10m-29 28h50" stroke="#ffe4ae" stroke-width="2.5" fill="none"/>
    ${sceneText('1 DEC', 85, 32, 30)}
    ${sceneText('PLANNED FIRST OIL', 87, 49, 11.5, '#fff1c5')}
  `,
  xavier: () => `
    ${rect(0, 0, 234, 62, '#22606e')}
    <image x="0" y="0" width="125" height="62" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${photo}"/>
    ${rect(0, 47, 125, 15, '#102c3e')}
    ${sceneText('NASA  /  17 NOV UTC', 5, 58, 9.5)}
    ${sceneText('95', 136, 33, 30)}
    ${sceneText('KM/H', 177, 33, 13.5, '#d7f4e7')}
    ${sceneText('GALE ALERTS', 137, 51, 12.5, '#d7f4e7')}
  `,
  abuja: () => `
    ${rect(0, 0, 234, 62, '#3a645c')}
    <path d="M85 18q-15-10-43-4v33q28-6 43 4 15-10 43-4V14q-28-6-43 4z" fill="#f1e3ac" stroke="#c8e5d6" stroke-width="2"/>
    <path d="M85 18v30M53 24l19 2m-19 7 19 2m26-9 19-2m-19 11 19-2" stroke="#74846d" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M147 12h68v25h-39l-15 12V37h-14z" fill="#bbdec7"/>
    <circle cx="168" cy="24" r="2.6" fill="#314f44"/><circle cx="181" cy="24" r="2.6" fill="#314f44"/><circle cx="194" cy="24" r="2.6" fill="#314f44"/>
  `,
  florida: () => `
    ${rect(0, 0, 234, 62, '#315c79')}
    <path d="M0 0h70l-6 16 13 16 13 16 3 14H49L39 48 24 31V12H0z" fill="#86afa7"/>
    <path d="M67 12l2 12 14 16 8 14" fill="none" stroke="#ffce83" stroke-width="4"/>
    <circle cx="67" cy="12" r="4" fill="#fff4d2"/><circle cx="91" cy="54" r="4" fill="#fff4d2"/>
    ${sceneText('≈200 MI', 110, 33, 25)}
    ${sceneText('ALERT CORRIDOR', 112, 49, 11.8, '#e1edf0')}
  `,
  germany: () => `
    ${rect(0, 0, 234, 62, '#595165')}
    <path d="M15 51V31l23 9V27l22 10V23l20 10V11h12v40z" fill="#c6b1cb"/>
    <path d="M26 45h10m10 0h10m10 0h10" stroke="#5c4d67" stroke-width="4"/>
    ${sceneText('24 H', 109, 33, 31)}
    ${sceneText('WARNING STRIKES', 112, 49, 11.5, '#ebdef0')}
  `,
  argentina: () => `
    ${rect(0, 0, 234, 62, '#325d82')}
    <path d="M12 42q5-11 20-12l12-13q5-4 15-4h33l20 16 14 3 7 13H12z" fill="#ef9a89"/>
    <path d="M47 20h34l12 10H39z" fill="#3b607c"/>
    <circle cx="37" cy="45" r="8" fill="#18354c" stroke="#b4d8e3" stroke-width="2.5"/>
    <circle cx="108" cy="45" r="8" fill="#18354c" stroke="#b4d8e3" stroke-width="2.5"/>
    ${sceneText('MODEL 3', 144, 28, 16)}
    ${sceneText('MODEL Y', 144, 47, 16, '#d9eef7')}
  `,
  court: () => `
    ${rect(0, 0, 234, 62, '#69604b')}
    <path d="M16 24l43-16 43 16zM20 52h79v5H20z" fill="#ecd6a1"/>
    <path d="M30 28v20m19-20v20m19-20v20m19-20v20" stroke="#ead4a2" stroke-width="7"/>
    ${sceneText('2027', 116, 33, 27)}
    ${sceneText('ELIGIBILITY CASE', 118, 49, 12, '#f9e8ba')}
  `,
  iran: () => `
    ${rect(0, 0, 234, 62, '#36576b')}
    <path d="M0 48q12-6 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0 34 0v14H0z" fill="#4a798c"/>
    <path d="M16 34h87l-9 10H28zM30 22h62v8H30zM21 27h9v6h-9zM46 14h32v5H46zM55 12h14v2H55z" fill="#c7d9cf"/>
    ${sceneText('>14', 122, 34, 31)}
    ${sceneText('TANKERS', 124, 51, 13, '#dcf0e7')}
  `,
};

function reportCard(item, i) {
  const x = 26 + (i % 4) * 246;
  const y = 404 + Math.floor(i / 4) * 127;
  return `<g transform="translate(${x} ${y})">
    ${rect(0, 0, 234, 122, '#fff9eb', 3)}
    <svg width="234" height="62" viewBox="0 0 234 62" overflow="hidden">${scenes[item.scene]()}</svg>
    ${lines(item.title, 8, 83, 22, 21, { font: serif, weight: 700 })}
    ${text(item.label, 8, 117, 11.5, { fill: '#7d4138', weight: 700, spacing: .36 })}
  </g>`;
}

function briefColumn(items, x) {
  return items.map(({ label, detail }, i) => {
    const y = 810 + i * 20.3;
    return `
      ${rect(x, y, 480, 20.3, i % 2 ? '#e9e1d1' : paper)}
      <text x="${x + 4}" y="${y + 15}" font-family="${sans}" font-size="17.5" fill="${ink}">
        <tspan font-size="14.6" font-weight="700" fill="#813b30">${xml(label)}</tspan><tspan> · ${xml(detail)}</tspan>
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
    ${rect(0, 0, 1024, 6, '#a34b40')}
    <g stroke="#93603a" stroke-width="1.55" fill="none">
      <circle cx="37" cy="30" r="11"/><ellipse cx="37" cy="30" rx="4.3" ry="11"/>
      <path d="M27 30h20m-17-6h14m-14 12h14"/>
    </g>
    ${text('WORLD IN VIEW', 57, 36, 21, { weight: 700, spacing: 2.4 })}
    ${text(`${reportCount} REPORTS ACROSS SIX CONTINENTS`, 998, 35, 15.5, { anchor: 'end', fill: muted, weight: 700, spacing: .85 })}
    ${text(edition.date, 23, 93, 61.5, { font: serif, weight: 700 })}
    ${line(26, 106, 998, 106, '#9eaca5', 1.5)}
    ${edition.leads.map((item, i) => leadCard(item, 26 + i * 330)).join('')}
    ${text('AROUND THE WORLD', 26, 396, 17.8, { weight: 700, spacing: 1.6 })}
    ${line(269, 390, 998, 390, '#9eaca5')}
    ${edition.reports.map(reportCard).join('')}
    ${text('IN BRIEF', 26, 802, 17, { weight: 700, spacing: 1.2 })}
    ${line(130, 796, 998, 796, '#9eaca5')}
    ${edition.briefColumns.map((col, i) => briefColumn(col, 26 + i * 492)).join('')}
    ${rect(0, 995, 1024, 29, navy)}
    ${text(`AS REPORTED BY ${edition.cutoff}`, 26, 1015, 13.5, { fill: gold, weight: 700, spacing: .85 })}
    ${text('Event dates follow local time', 998, 1015, 13.5, { fill: white, anchor: 'end' })}
  </svg>`;
}

const [rendererPath, outputPath] = process.argv.slice(2);
if (!rendererPath || !outputPath) {
  throw new Error('Usage: node render.mjs <resvg-js module file URL> <output PNG>');
}
const { Resvg } = await import(rendererPath);
const rendered = new Resvg(frontPage(), { font: { loadSystemFonts: true, defaultFontFamily: sans } }).render();
writeFileSync(resolve(outputPath), rendered.asPng());
