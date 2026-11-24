// Reusable voxel "props": floating island base, trees, lamps, fences, people, clouds...
import { P, pick } from './palette.js';
import { mulberry32, fbm2, valueNoise2, hash2 } from './rng.js';
import { GLOW, WATER } from './voxel.js';

/**
 * Floating island: grass top at y = 0, dirt, then a tapered rocky underside.
 * Returns helpers to place decorations on the top surface.
 */
export function islandBase(g, { R, depth = 16, seed = 1, sx = 1, sz = 1 }) {
  const lim = Math.ceil(R * 1.4 * Math.max(sx, sz));
  const dist = (x, z) => {
    const n = fbm2(x * 0.07 + seed * 3.1, z * 0.07 - seed, seed, 3);
    const rr = R * (0.88 + 0.34 * n);
    return Math.hypot(x / sx, z / sz) / rr;
  };
  const D = new Map();
  const k2 = (x, z) => x * 4096 + z;
  for (let x = -lim; x <= lim; x++)
    for (let z = -lim; z <= lim; z++) D.set(k2(x, z), dist(x, z));
  const d = (x, z) => D.get(k2(x, z)) ?? 9;
  const inside = (x, z) => d(x, z) < 1;
  const isEdge = (x, z) =>
    inside(x, z) && (!inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1));

  for (let x = -lim; x <= lim; x++)
    for (let z = -lim; z <= lim; z++) {
      const dd = d(x, z);
      if (dd >= 1) continue;
      const patch = valueNoise2(x * 0.18, z * 0.18, seed + 5);
      const h = hash2(x, z, seed);
      // top: grass with darker patches
      g.set(x, 0, z, patch > 0.68 ? pick(P.grassDark, h) : pick(P.grass, h));
      // grass drips over the edge
      const edge = isEdge(x, z);
      g.set(x, -1, z, edge && h < 0.6 ? pick(P.grass, h * 7) : pick(P.dirt, h * 3));
      if (dd < 0.97) g.set(x, -2, z, edge && h < 0.2 ? pick(P.grassDark, h) : pick(P.dirt, h * 5));
      if (dd < 0.93) g.set(x, -3, z, h < 0.5 ? pick(P.dirt, h * 11) : pick(P.rock, h * 13));
      for (let k = 4; k <= depth; k++) {
        const t = (k - 3) / (depth - 3);
        const lump = 0.86 + 0.28 * valueNoise2(x * 0.22, z * 0.22 + k * 0.35, seed + 9);
        const f = Math.pow(1 - t, 1.25) * 0.93 * lump;
        if (dd < f) {
          const strata = Math.floor((k + valueNoise2(x * 0.15, z * 0.15, seed) * 3) / 2);
          let c = P.rock[strata % P.rock.length];
          if (k > depth - 3) c = P.rockDark;
          g.set(x, -k, z, c);
        }
      }
    }

  // hanging roots & vines under the rim
  const rnd = mulberry32(seed * 77);
  for (let x = -lim; x <= lim; x++)
    for (let z = -lim; z <= lim; z++) {
      if (!isEdge(x, z) || rnd() > 0.07) continue;
      let y = -2;
      while (g.has(x, y, z) && y > -6) y--;
      const len = 2 + Math.floor(rnd() * 4);
      const vine = rnd() < 0.6;
      for (let i = 0; i < len; i++) g.set(x, y - i, z, vine ? pick(P.leaf, rnd()) : P.trunk);
    }

  return { inside, isEdge, d, lim };
}

/** Replace grass top with a path / other ground material along a mask. */
export function paint(g, x, z, colors, y = 0) {
  if (g.has(x, y, z)) g.set(x, y, z, pick(colors, hash2(x, z, 91)));
}

export function roundTree(g, x, z, { y = 1, h = 5, r = 3.2, leaves = P.leaf, seed = 1, fruit = null, fruitRate = 0.06 } = {}) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < h; i++) g.set(x, y + i, z, P.trunk);
  // a little branch
  g.set(x + 1, y + h - 2, z, P.trunk);
  const cy = y + h + r * 0.35;
  const R = Math.ceil(r + 1);
  for (let dx = -R; dx <= R; dx++)
    for (let dy = -R; dy <= R; dy++)
      for (let dz = -R; dz <= R; dz++) {
        const n = valueNoise2((x + dx) * 0.5, (z + dz) * 0.5 + dy * 0.7, seed);
        const dd = Math.hypot(dx, dy * 1.15, dz);
        if (dd > r * (0.82 + 0.3 * n)) continue;
        const shade = dy < -r * 0.3 ? 1 : 0; // bottom a bit darker
        const c = shade ? leaves[1 % leaves.length] : pick(leaves, rnd());
        const surface = dd > r * 0.62;
        if (fruit && surface && rnd() < fruitRate) g.set(x + dx, Math.round(cy + dy), z + dz, fruit);
        else g.set(x + dx, Math.round(cy + dy), z + dz, c);
      }
}

export function pineTree(g, x, z, { y = 1, h = 9, seed = 1 } = {}) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < 3; i++) g.set(x, y + i, z, P.trunk);
  for (let i = 0; i < h; i++) {
    const r = Math.max(0, (h - i) * 0.42 - (i % 3 === 2 ? 0.8 : 0));
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++)
      for (let dz = -R; dz <= R; dz++)
        if (Math.hypot(dx, dz) <= r + 0.2) g.set(x + dx, y + 2 + i, z + dz, pick(P.pine, rnd()));
  }
  g.set(x, y + 2 + h, z, P.pine[0]);
}

export function willowTree(g, x, z, { y = 1, h = 6, r = 4.5, seed = 3 } = {}) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < h; i++) g.set(x + (i > h - 3 ? 1 : 0), y + i, z, P.trunk);
  const cy = y + h;
  const R = Math.ceil(r);
  for (let dx = -R; dx <= R; dx++)
    for (let dz = -R; dz <= R; dz++) {
      const rr = Math.hypot(dx, dz);
      if (rr > r) continue;
      const top = Math.round(cy + 2.2 * Math.sqrt(Math.max(0, 1 - (rr / r) ** 2)));
      for (let yy = cy; yy <= top; yy++) g.set(x + dx, yy, z + dz, pick(P.willow, rnd()));
      // hanging curtains on the outer ring
      if (rr > r - 1.4 && rnd() < 0.55) {
        const len = 2 + Math.floor(rnd() * (h - 1));
        for (let i = 1; i <= len; i++) g.set(x + dx, cy - i, z + dz, pick(P.willow, rnd()));
      }
    }
}

export function bush(g, x, z, { y = 1, r = 1.4, leaves = P.leaf, seed = 2, flowers = null } = {}) {
  const rnd = mulberry32(seed);
  const R = Math.ceil(r);
  for (let dx = -R; dx <= R; dx++)
    for (let dy = 0; dy <= R; dy++)
      for (let dz = -R; dz <= R; dz++) {
        if (Math.hypot(dx, dy * 1.3, dz) > r) continue;
        const c = flowers && rnd() < 0.2 ? flowers : pick(leaves, rnd());
        g.set(x + dx, y + dy, z + dz, c);
      }
}

export function flowers(g, area, { y = 1, colors = [0xf4b6c2, 0xffe08a, 0xffffff, 0xc9a0dc], rate = 0.05, seed = 4, ok }) {
  const rnd = mulberry32(seed);
  const [x0, z0, x1, z1] = area;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (rnd() < rate && g.has(x, y - 1, z) && !g.has(x, y, z) && (!ok || ok(x, z)))
        g.set(x, y, z, pick(colors, rnd()), { jitter: 0.02 });
}

export function lampPost(g, x, z, { y = 1, h = 5 } = {}) {
  // Victorian-ish lamp: light sage-grey post, glowing lantern with a little roof
  const post = 0x6f8a7e;
  g.set(x, y, z, 0x55695f);
  for (let i = 1; i < h - 1; i++) g.set(x, y + i, z, post, { jitter: 0.02 });
  g.set(x, y + h - 1, z, 0x55695f);
  g.set(x, y + h, z, 0xfff1c9, { glow: P.lampGlow, glowI: 3.2, jitter: 0 });
  g.set(x, y + h + 1, z, 0x55695f);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.set(x + dx, y + h + 1, z + dz, 0x55695f, { jitter: 0 });
}

export function fence(g, x0, z0, x1, z1, { y = 1, color = P.white } = {}) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const z = Math.round(z0 + ((z1 - z0) * i) / n);
    g.set(x, y, z, color);
    if (i % 2 === 0) g.set(x, y + 1, z, color);
  }
}

export function bench(g, x, z, { y = 1, axis = 'x', len = 3 } = {}) {
  for (let i = 0; i < len; i++) {
    const [bx, bz] = axis === 'x' ? [x + i, z] : [x, z + i];
    g.set(bx, y, bz, P.woodDark);
    if (axis === 'x') g.set(bx, y + 1, bz - 1, P.wood);
    else g.set(bx - 1, y + 1, bz, P.wood);
  }
}

/** Tiny 3-voxel person (legs / shirt / head). */
export function person(g, x, y, z, { shirt = P.terracotta, pants = 0x3d405b, skin = 0xf1c7a1, hair = 0x4a3326 } = {}) {
  g.set(x, y, z, pants, { jitter: 0 });
  g.set(x, y + 1, z, shirt, { jitter: 0 });
  g.set(x, y + 2, z, skin, { jitter: 0 });
  if (hair) g.set(x, y + 3, z, hair, { jitter: 0 });
}

export function windowAt(g, x, y, z, { lit = true } = {}) {
  if (lit) g.set(x, y, z, P.glass, { glow: P.windowGlow, glowI: 1.9 });
  else g.set(x, y, z, P.glass);
}

/** Puffy cloud made of a few ellipsoids, flat-ish bottom. */
export function cloudGrid(g, seed, size = 1) {
  const rnd = mulberry32(seed);
  const blobs = 3 + Math.floor(rnd() * 3);
  for (let b = 0; b < blobs; b++) {
    const cx = (rnd() - 0.5) * 14 * size;
    const cz = (rnd() - 0.5) * 6 * size;
    const r = (3 + rnd() * 3.5) * size;
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++)
      for (let dy = -1; dy <= R; dy++)
        for (let dz = -R; dz <= R; dz++)
          if (Math.hypot(dx, dy * 1.5, dz * 1.2) < r) {
            const yy = dy;
            const c = yy <= 0 ? 0xe9e6f2 : 0xffffff;
            g.set(Math.round(cx + dx), yy, Math.round(cz + dz), c, { jitter: 0.015 });
          }
  }
}

/** Carve a water body: ground voxels in mask become water, with sandy rim. */
export function pond(g, mask, { depth = 2, rim = P.sand, seed = 5 } = {}) {
  const cells = [];
  for (const [x, z] of mask) cells.push([x, z]);
  const set = new Set(cells.map(([x, z]) => x + ',' + z));
  for (const [x, z] of cells) {
    for (let k = 0; k < depth; k++) {
      g.del(x, -k, z);
      g.set(x, -k, z, k === 0 ? P.water : P.waterDeep, { type: WATER, jitter: 0.03 });
    }
    g.set(x, -depth, z, pick(P.sand, hash2(x, z, seed)));
  }
  // rim
  for (const [x, z] of cells)
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = x + dx, nz = z + dz;
      if (!set.has(nx + ',' + nz) && g.has(nx, 0, nz) && g.get(nx, 0, nz).t !== WATER)
        g.set(nx, 0, nz, pick(rim, hash2(nx, nz, seed)));
    }
  return set;
}

export { GLOW, WATER };
