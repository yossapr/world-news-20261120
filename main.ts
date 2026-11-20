import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const artwork = readFileSync(new URL('./front-page.png', import.meta.url));
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (artwork.length < 33 || artwork.length > 1_048_576 ||
    !artwork.subarray(0, 8).equals(pngSignature)) {
  throw new Error('The front page must be a PNG of at most 1 MiB.');
}
const headerLength = artwork.readUInt32BE(8);
const headerTag = artwork.toString('ascii', 12, 16);
const imageWidth = artwork.readUInt32BE(16);
const imageHeight = artwork.readUInt32BE(20);
if (headerLength !== 13 || headerTag !== 'IHDR' ||
    imageWidth !== 1024 || imageHeight !== 1024) {
  throw new Error('Expected the 1024 × 1024 edition produced by render.mjs.');
}
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(destination, { recursive: true });
writeFileSync(join(destination, 'entry.png'), artwork);
