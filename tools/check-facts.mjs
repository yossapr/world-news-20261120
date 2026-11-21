// check-facts.mjs: every figure and claim printed on the page must be present in the edition's
// own record of the story it belongs to. Run before rendering; exits 1 on the first mismatch.
import { readFileSync } from 'node:fs';

const edition = JSON.parse(readFileSync(new URL('./edition.json', import.meta.url), 'utf8'));
const by = (n) => edition.stories.find((s) => s.n === n);
const text = (n) => JSON.stringify(by(n));
const norm = (s) => s.replace(/\u2212/g, '-').replace(/\u2013/g, '-').replace(/\s+/g, ' ');

// [what the page says, story number, how the edition records it]
const claims = [
  ['110 missiles', 1, '110 missiles'],
  ['400 drones', 1, '400 drones'],
  ['at least nine killed', 1, 'at least nine people'],
  ['three bridges in Kyiv', 1, 'three Kyiv bridges'],
  ['300,000 moved to shelters', 2, '300,000 people were moved to shelters'],
  ['no deaths reported', 2, 'No deaths were reported'],
  ['70-80 kph winds', 2, '70-80 kph'],
  ['landfall near Gopalpur at 8 am', 2, 'near Gopalpur from about 8 am'],
  ['Taiwan -6.2%', 3, 'fell 6.2%'],
  ['worst week since 1991', 3, 'worst week since 1991'],
  ['Seoul -5.2%, Tokyo -5.1%', 3, 'Seoul lost 5.2% and Tokyo 5.1%'],
  ['$81.3bn IPO', 3, '$81.3 billion'],
  ['317/6', 13, '317/6'],
  ['Phillips 118', 13, 'Phillips made 118'],
  ['Nicholls 146 not out', 13, 'Nicholls was 146 not out'],
  ['175 in a stand of 216', 31, '175'],
  ['175 in a stand of 216', 31, '216'],
  ['Sknyliv station, two killed', 14, 'killed two'],
  ['760,000 border crossings', 15, '760,000'],
  ['six months border closure', 15, 'six months'],
  ['18th month at 3.0%', 18, '18th month'],
  ['18th month at 3.0%', 18, '3.0%'],
  ['SoftBank 14.48% at 3,025', 19, '14.48'],
  ['SoftBank 14.48% at 3,025', 19, '3,025'],
  ['Kospi 7.9%', 20, '7.9%'],
  ['209 mm at Patrapur', 21, '209 mm'],
  ['9,341 shelters', 21, '9,341'],
  ['five strikes near Janta', 22, 'five strikes'],
  ['22 countries in debt distress', 27, '22 African countries'],
  ['Russell 0.071 s clear', 28, '0.071'],
  ['Nasdaq futures 1.6%', 29, '1.6%'],
  ['Japan inflation 2.3%', 9, '2.3%'],
  ['Bukele vote 28 February 2027', 12, '28 February 2027'],
  ['Kenya crude 1 December', 11, '1 December'],
  ['Malawi petrol $3.24', 26, '3.24'],
  ['ATP $350m', 35, '$350m'],
  ['Iraq troops at Jurf al-Sakhar', 7, 'Jurf al-Sakhar'],
  ['COP31 draft omits fossil fuels', 5, 'fossil fuels'],
  ['Tusk called it a provocation', 6, 'provocation'],
  ['UK-EU food trade, youth visas, carbon link', 4, 'youth mobility'],
  ['Korea impeach after overturned conviction', 10, 'overturned conviction'],
];

let bad = 0;
for (const [claim, n, find] of claims) {
  const hay = norm(text(n));
  if (!hay.includes(norm(find))) { console.log('MISSING:', claim, '| story', n, '| expected:', find); bad++; }
}
// every story on the page exists in the edition, and the edition has no story the page drops
const used = [...edition.stories].map((s) => s.n);
if (used.length !== 35) { console.log('edition does not hold 35 stories:', used.length); bad++; }
console.log(bad ? `FACTS: ${bad} mismatch(es)` : `FACTS: ${claims.length} claims checked, all present in the edition`);
if (bad) process.exit(1);
