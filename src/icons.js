// Tiny pixel-art icons, drawn from strings. Each char = 1 pixel, '.' = empty.
// Letters map to palette entries; rendered as crisp SVG rects.
const PAL = {
  t: 'var(--terracotta)', c: '#fff1dc', h: 'var(--honey)', n: 'var(--ink)', s: 'var(--sage)',
  w: '#ffffff', b: '#8a5a3b', k: '#2e2a3a', y: '#ffd56b', g: '#7fb565', a: 'currentColor',
};

const ICONS = {
  balloon: [
    '..thht..',
    '.tchhct.',
    'tcthhtct',
    'tcthhtct',
    'tcthhtct',
    '.tchhct.',
    '..thht..',
    '..b..b..',
    '..bbbb..',
    '..bbbb..',
  ],
  book: [
    'ssssss..',
    'swwwws..',
    'swnnws..',
    'swwwwsss',
    'swnnws.s',
    'swwwws.s',
    'ssssss.s',
    '..ssssss',
  ],
  ball: [
    '..nnnn..',
    '.nwwwwn.',
    'nwwkkwwn',
    'nwkkkkwn',
    'nwwkkwwn',
    'nkwwwwkn',
    '.nwwwwn.',
    '..nnnn..',
  ],
  cap: [
    '...nn...',
    '.nnnnnn.',
    'nnnnnnnn',
    '.nnnnnnh',
    '..nnnn.h',
    '..nnnn.h',
    '..nnnn.y',
    '........',
  ],
  star: [
    '...b....',
    '...b....',
    '.bbbbb..',
    '..bbb...',
    '..b.b...',
    '........',
  ],
  sun: [
    '...a....',
    '.a...a..',
    '...a....',
    'a.aaa.a.',
    '..aaa...',
    '.a.a.a..',
    '........',
  ],
  moon: [
    '..aaa...',
    '.aa.....',
    'aa......',
    'aa......',
    'aa....a.',
    '.aaaaaa.',
    '..aaaa..',
  ],
  arrow: [
    '..a..',
    '..a..',
    '..a..',
    'aaaaa',
    '.aaa.',
    '..a..',
  ],
  chart: [
    'nnnnnnnn',
    'n......n',
    'n.....tn',
    'n..t.t.n',
    'n.t.t..n',
    'nt.....n',
    'n......n',
    'nnnnnnnn',
  ],
  dna: [
    't.....s.',
    '.t...s..',
    '..tns...',
    '...ts...',
    '..s.t...',
    '.s...t..',
    's.....t.',
    'snnnnnt.',
  ],
  notebook: [
    '.nnnnnn.',
    'nwwwwwwn',
    'nwnnnnwn',
    'nwwwwwwn',
    'nwnnnwwn',
    'nwwwwwwn',
    'nwnnwwwn',
    '.nnnnnn.',
  ],
  chat: [
    '.ssssss.',
    'swwwwwws',
    'swnwnwns',
    'swwwwwws',
    '.ssssss.',
    '..s.....',
    '.s......',
    '........',
  ],
  disk: [
    'nnnnnnn.',
    'nwwwwwnn',
    'nwwwwwnn',
    'nnnnnnnn',
    'nntttttn',
    'nntccctn',
    'nntccctn',
    'nnnnnnnn',
  ],
  github: [
    '..aaaa..',
    '.aaaaaa.',
    'a.aaaa.a',
    'aaaaaaaa',
    'aaaaaaaa',
    '.aaaaaa.',
    '..a..a..',
    '..a..a..',
  ],
};

export function iconSVG(name) {
  const rows = ICONS[name];
  if (!rows) return '';
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  let rects = '';
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== '.' && PAL[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${PAL[ch]}"/>`;
    })
  );
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

export function mountIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = iconSVG(el.dataset.icon)));
}
