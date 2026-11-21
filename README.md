# The world in one day — Friday 20 November 2026

[![make.fun bounty](https://img.shields.io/badge/make.fun-news--image--20261120-b3261e)](https://make.fun/bounty/news-image-20261120)

A single 1024 × 1024 front page that sums up Friday 20 November 2026: the date in full, three lead
stories, a world map with one dot for each dateline, ten more stories, ten figures from the day,
and 22 short briefs — all 35 of the day's stories, each with the outlet that reported it.

The entry in the [make.fun bounty](https://make.fun/bounty/news-image-20261120) is `entry.png`;
`main.ts` writes it to `/output/entry.png` and nothing else. It reads no network, installs nothing,
and two runs write the same bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# out/entry.png — 1024 × 1024 PNG, about 252 KiB
```

## How the page was made

`tools/` holds the build, not the runtime:

- `tools/edition.json` — the house edition of the day: 35 stories, each with its section, place,
  geo, summary or tldr, and outlets.
- `tools/copy.mjs` — the page's own wording, one entry per story. Facts (numbers, names, places)
  are the edition's; the sentences are written for this page.
- `tools/build.mjs` — builds `tools/poster.html` in one pass: masthead, stats band, three leads with
  drawn panels, the map, the numbers panel, the ten cards, the briefs and the colophon. It refuses to
  build unless all 35 stories appear exactly once.
- `tools/check-facts.mjs` — checks 41 of the page's figures and claims against the edition's own
  record of the story they belong to (`FACTS: 41 claims checked, all present in the edition`).
- `tools/render.mjs` — screenshots `tools/poster.html` at exactly 1024 × 1024 through headless
  Chrome over CDP and reports the section boxes, so overflow and collisions are measured.
- `tools/land-path.txt` — Natural Earth 110m land outlines, projected equirectangular (84N..58S).

Rebuild:

```sh
cd tools && node check-facts.mjs && node build.mjs && node render.mjs ../entry.png poster.html
```

The map is drawn from Natural Earth land outlines (public domain), not traced from any photograph.
Every story on the page is dated Friday 20 November 2026 and is one of the 35 stories in the edition.

## License

MIT — see `LICENSE`.
