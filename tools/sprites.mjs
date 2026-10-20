// Draws the desktop sprites as exact 32x32 pixel grids and writes them as
// crisp-edged SVGs to public/img/. Run: node tools/sprites.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const P = {
  k: '#000000', w: '#ffffff', g: '#c0c0c0', d: '#808080', D: '#404040',
  s: '#002a10', S: '#004a1c', G: '#33ff66', x: '#200008', r: '#ff5555', R: '#a4243b',
  y: '#f2d264', Y: '#c9a227', o: '#7a5c0a', l: '#e8e8e8', n: '#000080',
};

function sprite(draw) {
  const g = Array.from({ length: 32 }, () => Array(32).fill(null));
  const px = (x, y, c) => { if (x >= 0 && x < 32 && y >= 0 && y < 32) g[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  const box = (x, y, w, h, fill, edge) => { rect(x, y, w, h, edge); rect(x + 1, y + 1, w - 2, h - 2, fill); };
  const line = (pts, c) => { for (let k = 0; k < pts.length - 1; k++) {
    let [x0, y0] = pts[k]; const [x1, y1] = pts[k + 1];
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  } };
  draw({ px, rect, box, line });
  return g;
}

function svg(g) {
  let rects = '';
  g.forEach((row, y) => {
    for (let x = 0; x < 32;) {
      const c = row[x];
      let w = 1;
      while (c && row[x + w] === c) w++;
      if (c) rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${P[c]}"/>`;
      x += w;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">${rects}</svg>\n`;
}

// A beige CRT: bevelled case, bezel, screen, stand. The screen is drawn by `face`.
function crt(face, screen = 's') {
  return sprite((t) => {
    t.box(3, 2, 26, 21, 'g', 'D');
    t.rect(4, 3, 24, 1, 'w'); t.rect(4, 3, 1, 18, 'w'); // highlight
    t.rect(4, 21, 24, 1, 'd'); t.rect(27, 4, 1, 18, 'd'); // shadow
    t.box(6, 5, 20, 14, screen, 'k');
    for (let y = 7; y < 18; y += 2) t.rect(7, y, 18, 1, screen === 's' ? 'S' : 'x'); // scanlines
    t.px(24, 20, screen === 's' ? 'G' : 'r'); // power LED
    t.rect(13, 23, 6, 2, 'd');
    t.box(9, 25, 14, 4, 'g', 'D'); t.rect(10, 26, 12, 1, 'w');
    face(t);
  });
}

const sprites = {
  pal: crt((t) => {
    t.rect(11, 9, 2, 2, 'G'); t.rect(19, 9, 2, 2, 'G'); // eyes
    t.px(10, 13, 'G'); t.px(21, 13, 'G'); t.rect(11, 14, 10, 1, 'G'); // smile
  }),
  'pal-cracked': crt((t) => {
    t.line([[11, 8], [13, 10]], 'r'); t.line([[13, 8], [11, 10]], 'r'); // X eyes
    t.line([[19, 8], [21, 10]], 'r'); t.line([[21, 8], [19, 10]], 'r');
    t.rect(11, 14, 10, 1, 'r'); t.px(10, 15, 'r'); t.px(21, 15, 'r'); // frown
    t.line([[7, 6], [11, 11], [10, 13], [15, 16], [18, 15], [24, 18]], 'w'); // the crack
    t.line([[15, 16], [16, 18]], 'w');
  }, 'x'),
  folder: sprite((t) => {
    t.box(3, 7, 11, 4, 'Y', 'o');
    t.box(3, 9, 26, 18, 'Y', 'o');
    t.box(3, 12, 26, 15, 'y', 'o');
    t.rect(4, 13, 24, 1, 'w');
  }),
  file: sprite((t) => {
    t.box(8, 3, 17, 26, 'w', 'k');
    t.rect(19, 3, 6, 6, null); t.line([[19, 3], [24, 8]], 'k'); t.rect(19, 4, 1, 5, 'k'); t.rect(19, 8, 5, 1, 'k'); // dog-ear
    t.line([[20, 4], [23, 7]], 'g'); t.rect(20, 5, 1, 3, 'l'); t.rect(21, 6, 1, 2, 'l'); t.px(22, 7, 'l');
    for (const y of [11, 14, 17, 20, 23]) t.rect(11, y, y === 23 ? 7 : 11, 1, 'd');
  }),
  'wren-file': sprite((t) => {
    t.box(8, 3, 17, 26, 'w', 'k');
    t.rect(19, 3, 6, 6, null); t.line([[19, 3], [24, 8]], 'k'); t.rect(19, 4, 1, 5, 'k'); t.rect(19, 8, 5, 1, 'k');
    t.line([[20, 4], [23, 7]], 'g');
    for (const y of [11, 14, 17]) t.rect(11, y, 11, 1, 'R');
    t.rect(11, 21, 2, 1, 'r'); t.px(13, 20, 'r'); t.px(13, 22, 'r'); // the arrow ->
    t.rect(15, 21, 1, 1, 'r');
  }),
  // A torn diary page: ruled lines, red scrawl, a ragged bottom edge.
  page: sprite((t) => {
    t.box(8, 4, 16, 22, 'l', 'k');
    for (const y of [8, 11, 14, 17, 20]) t.rect(10, y, 12, 1, 'g');
    t.rect(10, 4, 1, 21, 'R');
    t.line([[12, 9], [15, 10], [18, 9], [20, 10]], 'r'); t.line([[12, 15], [16, 16], [19, 15]], 'r');
    for (let x = 8; x < 24; x++) { const d = [0, 2, 1, 3, 0, 2, 1, 0][x % 8]; t.rect(x, 25 - d, 1, d + 1, null); t.px(x, 24 - d, 'k'); }
  }),
};

function bin(full) {
  return sprite((t) => {
    t.box(8, 6, 16, 3, 'l', 'D'); // lid
    t.rect(14, 5, 4, 1, 'D');
    for (let y = 9; y <= 27; y++) {
      const inset = Math.floor((y - 9) / 7);
      const x0 = 9 + inset, x1 = 22 - inset;
      t.px(x0, y, 'D'); t.px(x1, y, 'D');
      for (let x = x0 + 1; x < x1; x++) t.px(x, y, (x - x0) % 3 === 0 ? 'd' : 'g');
    }
    t.rect(11, 27, 10, 1, 'D');
    if (full) { t.box(11, 2, 7, 5, 'w', 'd'); t.box(16, 3, 6, 4, 'l', 'd'); t.px(13, 4, 'd'); }
  });
}
sprites.bin = bin(false);
sprites['bin-full'] = bin(true);

const dir = new URL('../public/img/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, g] of Object.entries(sprites)) writeFileSync(new URL(`${name}.svg`, dir), svg(g));
console.log('wrote', Object.keys(sprites).map((n) => `${n}.svg`).join(' '));
