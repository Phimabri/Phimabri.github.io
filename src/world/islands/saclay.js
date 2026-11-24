// Island 1: Université Paris-Saclay. A modern faculty building, a glass tower,
// the wheat fields of the plateau, hay bales, and a pond with swimming ducks.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid, WATER } from '../voxel.js';
import { P, pick } from '../palette.js';
import { islandBase, roundTree, pineTree, bush, flowers, lampPost, bench, paint, pond, windowAt } from '../builders.js';
import { model, fireflies } from '../actors.js';
import { hash2, mulberry32, valueNoise2 } from '../rng.js';

export function buildSaclay() {
  const g = new VoxelGrid(21);
  const R = 22;
  const base = islandBase(g, { R, depth: 18, seed: 21, sx: 1.08 });
  const ok = (x, z, m = 0.86) => base.d(x, z) < m;
  const rnd = mulberry32(2121);

  // ---------------------------------------------------------------- faculty building (from the photo)
  // Long white block: a glass ground floor set back under the building, then three floors that
  // each sit on a projecting slab with a white slatted railing, tall windows between white
  // louvred shutters, and a thin overhanging roof.
  const X0 = -16, X1 = 8, Z0 = -14, Z1 = -6;
  const WHITE = 0xf2f0ea, SLAB = 0xe9e7e0, SHUT = 0xe2ded3, FRAME = 0x3f4c4a;
  const perimeter = (x, z, x0, x1, z0, z1) => x === x0 || x === x1 || z === z0 || z === z1;

  // ground floor: recessed glass box with dark mullions
  g.box(X0 + 2, 1, Z0 + 2, X1 - 2, 3, Z1 - 2, (x, y, z) => {
    if (!perimeter(x, z, X0 + 2, X1 - 2, Z0 + 2, Z1 - 2)) return P.concrete[1];
    const along = z === Z0 + 2 || z === Z1 - 2 ? x : z;
    if (along % 3 === 0) return FRAME;
    return null;
  });
  g.box(X0 + 2, 1, Z0 + 2, X1 - 2, 3, Z1 - 2, (x, y, z) => {
    if (g.has(x, y, z)) return null;
    g.set(x, y, z, 0x5f7a76, { glow: P.windowGlow, glowI: 1.5 });
    return null;
  });
  // slender white columns under the cantilever
  for (let x = X0 + 3; x <= X1 - 3; x += 5) for (let y = 1; y <= 3; y++) { g.set(x, y, Z1 - 1, WHITE); g.set(x, y, Z0 + 1, WHITE); }

  // three floors
  for (let f = 0; f < 3; f++) {
    const ys = 4 + f * 4;
    g.box(X0, ys, Z0, X1, ys, Z1, SLAB); // projecting slab
    // see-through railing: slats with gaps on the slab edge
    g.box(X0, ys + 1, Z0, X1, ys + 1, Z1, (x, y, z) =>
      perimeter(x, z, X0, X1, Z0, Z1) && (x + z) % 2 === 0 ? WHITE : null
    );
    // facade, set back by one voxel (the balcony)
    const fx0 = X0 + 1, fx1 = X1 - 1, fz0 = Z0 + 1, fz1 = Z1 - 1;
    g.box(fx0, ys + 1, fz0, fx1, ys + 3, fz1, (x, y, z) => {
      if (!perimeter(x, z, fx0, fx1, fz0, fz1)) return P.concrete[0];
      if (y === ys + 3) return WHITE; // lintel
      const along = z === fz0 || z === fz1 ? x : z;
      return along % 3 === 0 ? SHUT : null;
    });
    g.box(fx0, ys + 1, fz0, fx1, ys + 2, fz1, (x, y, z) => {
      if (g.has(x, y, z)) return null;
      const along = z === fz0 || z === fz1 ? x : z;
      windowAt(g, x, y, z, { lit: hash2(along >> 1, f * 7 + z, 5) < 0.7 });
      return null;
    });
  }
  // thin roof, overhanging a little more, with a couple of technical boxes
  g.box(X0 - 1, 16, Z0 - 1, X1 + 1, 16, Z1 + 1, WHITE);
  g.box(X0, 17, Z0, X1, 17, Z1, (x, y, z) => (perimeter(x, z, X0, X1, Z0, Z1) ? 0xdedbd2 : null));
  g.box(-8, 17, -12, -5, 18, -10, P.concrete[1]);
  g.box(2, 17, -11, 4, 17, -9, 0xb9b6ae);
  // paved forecourt under and in front of the building
  for (let x = X0; x <= X1; x++) for (let z = Z1 - 1; z <= Z1 + 2; z++) paint(g, x, z, P.path);

  // ---------------------------------------------------------------- the plateau: wheat field + hay bales
  for (let x = -19; x <= -4; x++)
    for (let z = 1; z <= 15; z++) {
      if (!ok(x, z, 0.84)) continue;
      if (z % 2 === 0) {
        paint(g, x, z, [P.soil]);
      } else {
        const h = hash2(x, z, 31);
        g.set(x, 1, z, pick(P.wheat, h));
        if (h < 0.35) g.set(x, 2, z, P.wheat[2]);
      }
    }
  const hay = (cx, cz) => {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = 0; dy <= 2; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          if (Math.abs(dz) === 1 && Math.abs(dy - 1) === 1) continue; // round section (cylinder along x)
          g.set(cx + dx, 1 + dy, cz + dz, dx === 0 ? 0xe0b858 : 0xcfa54a);
        }
  };
  hay(-1, 4);
  hay(-2, 9);

  // ---------------------------------------------------------------- pond
  const pc = { x: 10, z: 7 };
  const mask = [];
  for (let x = pc.x - 9; x <= pc.x + 9; x++)
    for (let z = pc.z - 8; z <= pc.z + 8; z++) {
      const n = valueNoise2(x * 0.3, z * 0.3, 77);
      if (Math.hypot((x - pc.x) / 1.25, z - pc.z) < 4.6 + n * 1.6 && ok(x, z, 0.8)) mask.push([x, z]);
    }
  const water = pond(g, mask, { depth: 2 });
  // lily pads & reeds
  const lilies = [[7, 6], [12, 9], [9, 10], [13, 5]];
  for (const [x, z] of lilies) if (water.has(x + ',' + z)) { g.set(x, 0, z, 0x5f9a4e, { jitter: 0 }); }
  g.set(12, 0, 9, 0xf4b6c2, { jitter: 0 }); // one lotus flower
  for (const [x, z] of mask) {
    const edgeish = !water.has(x + 1 + ',' + z) || !water.has(x - 1 + ',' + z) || !water.has(x + ',' + (z + 1));
    if (edgeish && hash2(x, z, 4) < 0.18) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (!water.has(nx + ',' + nz) && g.has(nx, 0, nz) && !g.has(nx, 1, nz)) {
          g.set(nx, 1, nz, 0x6b8f3e); g.set(nx, 2, nz, 0x6b8f3e); g.set(nx, 3, nz, 0x7a5236);
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------- paths, trees, lamps, benches
  for (let z = Z1 + 3; z <= 20; z++) {
    const wob = Math.round(Math.sin(z * 0.35) * 1.5);
    for (let w = 0; w < 2; w++) if (ok(-6 + wob + w, z, 0.98) && !g.has(-6 + wob + w, 1, z)) paint(g, -6 + wob + w, z, P.path);
  }
  for (let x = -5; x <= 5; x++) paint(g, x, Z1 + 3, P.path);
  for (let z = Z1 + 3; z <= 1; z++) { paint(g, 5, z, P.path); paint(g, 6, z, P.path); }

  roundTree(g, 15, -3, { h: 5, r: 3.3, seed: 5 });
  roundTree(g, -18, -6, { h: 4, r: 3, seed: 6, leaves: P.leafWarm });
  pineTree(g, 14, -11, { h: 9, seed: 7 });
  pineTree(g, 2, 17, { h: 7, seed: 8 });
  roundTree(g, 17, 10, { h: 4, r: 2.6, seed: 9, leaves: P.blossom });
  bush(g, -3, -3, { seed: 3, r: 1.3 });
  bush(g, 4, -3, { seed: 4, r: 1.3, flowers: 0xffe08a });
  lampPost(g, -3, 6);
  lampPost(g, 4, 1);
  bench(g, 6, 14, { len: 3 });
  flowers(g, [-20, -20, 20, 20], { rate: 0.03, seed: 23, ok: (x, z) => ok(x, z, 0.92) && !g.has(x, 1, z) });

  // a tiny "π" chalkboard on an easel next to the entrance
  g.set(-10, 1, Z1 + 3, P.woodDark); g.set(-10, 2, Z1 + 3, P.woodDark);
  g.box(-11, 3, Z1 + 3, -9, 4, Z1 + 3, 0x2f4a3e);
  g.set(-10, 4, Z1 + 3, 0xf4f1ea, { jitter: 0 });

  const group = new THREE.Group();
  group.add(meshFromGrid(g));

  // ---------------------------------------------------------------- ducks
  const actors = [];
  const duck = (body) =>
    model((m) => {
      m.set(0, 0, 0, body, { jitter: 0 }); m.set(-1, 0, 0, body, { jitter: 0 });
      m.set(-1, 1, 0, body === P.white ? 0xc9c4b8 : body, { jitter: 0 });
      m.set(0, 1, 0, body === P.white ? P.white : 0x3e7d4f, { jitter: 0 });
      m.set(1, 1, 0, 0xf2a33a, { jitter: 0 });
    }, { x: -0.5, y: -0.5, z: 0 });
  const ducks = [duck(P.white), duck(0x8c6a4a), duck(P.white)];
  ducks.forEach((d, i) => {
    d.scale.setScalar(0.55);
    group.add(d);
    actors.push({
      update(t) {
        const a = t * 0.18 + i * 0.55;
        const r = 2.6 + i * 0.3;
        d.position.set(pc.x + Math.cos(a) * r * 1.2, 0.25 + Math.sin(t * 2 + i) * 0.04, pc.z + Math.sin(a) * r);
        d.rotation.y = -a - Math.PI / 2; // face direction of travel
      },
    });
  });

  const ff = fireflies(new THREE.Vector3(8, 0, 6), 11, { count: 28, height: 6, seed: 21 });
  group.add(ff.object);
  actors.push(ff);

  return { group, actors, count: g.count, fireflies: [ff], lamp: new THREE.Vector3(0, 7, 2) };
}
