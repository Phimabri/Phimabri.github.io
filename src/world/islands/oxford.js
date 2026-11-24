// Island 3: University of Oxford. The Radcliffe Camera, a gothic college with
// a spired gate tower, a striped quad, a river with a punt, a stone bridge,
// a weeping willow, and a waterfall pouring off the edge of the island.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid, WATER } from '../voxel.js';
import { P, pick } from '../palette.js';
import { islandBase, roundTree, willowTree, bush, flowers, lampPost, bench, paint, pond, person, windowAt } from '../builders.js';
import { model, mist, fireflies } from '../actors.js';
import { hash2 } from '../rng.js';

export function buildOxford() {
  const g = new VoxelGrid(41);
  const base = islandBase(g, { R: 26, depth: 21, seed: 41, sx: 1.1 });
  const ok = (x, z, m = 0.88) => base.d(x, z) < m;
  const stone = (x, y, z) => pick(P.stone, hash2(x * 3 + y, z - y, 41));

  // ---------------------------------------------------------------- river + waterfall
  const rc = (x) => 10 + 2.2 * Math.sin(x * 0.16);
  const riverMask = [];
  for (let x = -base.lim; x <= 18; x++)
    for (let z = -base.lim; z <= base.lim; z++) {
      if (Math.abs(z - rc(x)) > 2.3) continue;
      if (x >= 0 ? ok(x, z, 0.95) : base.inside(x, z)) riverMask.push([x, z]);
    }
  const river = pond(g, riverMask, { depth: 2, rim: P.stoneDark });
  let fallX = 0, fallZ = 0, nFall = 0;
  for (const [x, z] of riverMask)
    if (x < 0 && !base.inside(x - 1, z)) {
      for (let y = 0; y >= -16; y--) g.set(x - 1, y, z, y > -3 ? P.water : P.waterLight, { type: WATER, jitter: 0.04 });
      fallX += x - 1; fallZ += z; nFall++;
    }
  fallX /= nFall || 1; fallZ /= nFall || 1;
  // towpath along the north bank
  for (let x = -20; x <= 18; x++) {
    const z = Math.round(rc(x) - 4);
    if (!river.has(x + ',' + z)) paint(g, x, z, P.cobble);
  }

  // ---------------------------------------------------------------- Radcliffe Camera
  const C = { x: -8, z: -7 };
  const ring = (y, r0, r1, col) => {
    for (let dx = -9; dx <= 9; dx++)
      for (let dz = -9; dz <= 9; dz++) {
        const d = Math.hypot(dx, dz);
        if (d <= r1 && d > r0 - 0.001) {
          const c = typeof col === 'function' ? col(dx, dz, d) : col;
          if (c != null) g.set(C.x + dx, y, C.z + dz, c);
        }
      }
  };
  const ang = (dx, dz) => (Math.atan2(dz, dx) + Math.PI * 2) % (Math.PI * 2);
  // rusticated base with arched doors
  for (let y = 1; y <= 3; y++)
    ring(y, 0, 7.6, (dx, dz, d) => {
      const a = ang(dx, dz);
      const door = d > 6.6 && y <= 2 && Math.abs(((a / (Math.PI / 4)) % 1) - 0.5) < 0.12;
      if (door) return P.woodDark;
      return y === 2 ? P.stoneDark[1] : P.stoneDark[0];
    });
  // drum with paired columns and tall windows
  for (let y = 4; y <= 11; y++) {
    ring(y, 0, 6.1, (dx, dz, d) => {
      if (d < 5.2) return P.stone[2];
      const a = ang(dx, dz);
      const seg = (a / ((Math.PI * 2) / 16)) % 1;
      if (y >= 6 && y <= 9 && Math.abs(seg - 0.5) < 0.18) return 'w';
      return pick(P.stone, hash2(dx, y, dz));
    });
    ring(y, 6.6, 7.4, (dx, dz) => {
      const seg = (ang(dx, dz) / ((Math.PI * 2) / 16)) % 1;
      return seg < 0.22 || seg > 0.78 ? 0xf1dcae : null; // columns
    });
  }
  ring(12, 0, 7.7, P.stone[0]); // entablature
  ring(13, 6.8, 7.6, (dx, dz) => ((dx + dz) % 2 ? P.stone[1] : null)); // balustrade
  for (let y = 13; y <= 15; y++)
    ring(y, 0, 5.2, (dx, dz, d) => {
      if (d > 4.3 && y === 14 && Math.abs(((ang(dx, dz) / (Math.PI / 4)) % 1) - 0.5) < 0.2) return 'w';
      return y === 15 ? P.stone[0] : P.stone[2];
    });
  // lead dome with stone ribs
  for (let y = 16; y <= 21; y++) {
    const rr = Math.sqrt(Math.max(0, 5.6 ** 2 - (y - 15.5) ** 2 * 1.05));
    ring(y, 0, rr, (dx, dz, d) => {
      const rib = d > rr - 1.2 && Math.abs(((ang(dx, dz) / (Math.PI / 4)) % 1) - 0.5) > 0.42;
      return rib ? 0xe8d6b0 : pick(P.lead, hash2(dx, y, dz));
    });
  }
  // lantern
  for (let y = 21; y <= 23; y++) ring(y, 0, 1.6, (dx, dz, d) => (y === 22 && d > 0.9 ? 'w' : P.stone[0]));
  ring(24, 0, 1.1, P.lead[0]);
  g.set(C.x, 25, C.z, P.honey);
  g.set(C.x, 26, C.z, 0xf6d77a, { glow: 0xffd56b, glowI: 0.8 });

  // ---------------------------------------------------------------- college + gate tower
  const cx0 = 5, cx1 = 17, cz0 = -15, cz1 = -8, ch = 8;
  g.box(cx0, 1, cz0, cx1, ch, cz1, (x, y, z) => {
    const face = x === cx0 || x === cx1 || z === cz0 || z === cz1;
    if (!face) return P.stone[2];
    const along = z === cz0 || z === cz1 ? x : z;
    if (y >= 3 && y <= 6 && along % 3 === 0) return 'w';
    return y === 1 ? P.stoneDark[0] : stone(x, y, z);
  });
  g.box(cx0, ch + 1, cz0, cx1, ch + 1, cz1, (x, y, z) => {
    const face = x === cx0 || x === cx1 || z === cz0 || z === cz1;
    if (!face) return P.slate;
    return (x + z) % 2 ? stone(x, y, z) : null; // battlements
  });
  for (const [x, z] of [[cx0, cz0], [cx1, cz0], [cx0, cz1], [cx1, cz1]])
    for (let y = ch + 1; y <= ch + 4; y++) g.set(x, y, z, y === ch + 4 ? P.stone[0] : stone(x, y, z));
  // gate tower
  const tx0 = 9, tx1 = 12, tz0 = -10, tz1 = -7, th = 15;
  g.box(tx0, 1, tz0, tx1, th, tz1, (x, y, z) => stone(x, y, z));
  g.box(10, 1, tz1, 11, 3, tz1, P.woodDark);
  g.set(10, 4, tz1, P.stone[0]); g.set(11, 4, tz1, P.stone[0]);
  for (let y = 7; y <= 9; y++) { windowAt(g, 10, y, tz1); windowAt(g, 11, y, tz1); }
  // clock face
  g.box(10, 12, tz1, 11, 13, tz1, 0xf6efe0);
  g.set(10, 13, tz1, P.honey, { jitter: 0 });
  g.box(tx0, th + 1, tz0, tx1, th + 1, tz1, (x, y, z) =>
    x === tx0 || x === tx1 || z === tz0 || z === tz1 ? ((x + z) % 2 ? stone(x, y, z) : null) : P.stone[2]
  );
  for (const [x, z] of [[tx0, tz0], [tx1, tz0], [tx0, tz1], [tx1, tz1]])
    for (let y = th + 1; y <= th + 4; y++) g.set(x, y, z, stone(x, y, z));
  const sc = { x: 10.5, z: -8.5 };
  for (let y = th + 1; y <= th + 9; y++) {
    const r = 1.9 * (1 - (y - th - 1) / 9);
    for (let x = tx0; x <= tx1; x++)
      for (let z = tz0; z <= tz1; z++)
        if (Math.hypot(x - sc.x, z - sc.z) <= r + 0.15) g.set(x, y, z, y % 3 ? P.lead[1] : P.stone[0]);
  }
  for (let y = th + 9; y <= th + 13; y++) g.set(10, y, -9, 0x6f6a66);

  // bikes leaning on the college, very Oxford
  const bike = (x, z, col) => {
    g.set(x, 1, z, 0x2b2b33); g.set(x + 2, 1, z, 0x2b2b33);
    g.set(x + 1, 2, z, col); g.set(x, 2, z, col); g.set(x + 2, 2, z, 0x2b2b33);
    g.set(x, 3, z, 0x2b2b33);
  };
  bike(6, cz1 + 1, 0x7fb0a8);
  bike(14, cz1 + 1, 0xd9573f);

  // ---------------------------------------------------------------- the quad (striped lawn) + paths
  for (let x = cx0 - 1; x <= cx1 + 1; x++)
    for (let z = cz1 + 2; z <= 3; z++)
      if (g.has(x, 0, z) && !river.has(x + ',' + z)) g.set(x, 0, z, Math.floor(x / 2) % 2 ? 0x8cc172 : 0x7cb262, { jitter: 0.015 });
  for (let z = tz1 + 1; z <= 22; z++) {
    if (river.has(10 + ',' + z) || river.has(11 + ',' + z)) continue;
    paint(g, 10, z, P.cobble); paint(g, 11, z, P.cobble);
  }
  for (let x = -1; x <= 9; x++) { paint(g, x, -3, P.cobble); paint(g, x, -2, P.cobble); }

  // ---------------------------------------------------------------- stone bridge over the river
  const bz0 = Math.round(rc(10.5) - 4), bz1 = Math.round(rc(10.5) + 4);
  for (let z = bz0; z <= bz1; z++) {
    const t = (z - bz0) / (bz1 - bz0);
    const h = 1 + Math.round(Math.sin(Math.PI * t) * 2.2);
    for (let x = 9; x <= 12; x++) {
      g.set(x, h, z, x === 9 || x === 12 ? P.stoneDark[0] : P.cobble[hash2(x, z, 2) * 3 | 0]);
      if (!river.has(x + ',' + z)) for (let y = 1; y < h; y++) g.set(x, y, z, P.stoneDark[1]);
      else if (h > 2) g.set(x, h - 1, z, P.stoneDark[1]); // arch soffit
    }
    if (z % 2 === 0 || z === bz0 || z === bz1) { g.set(8, h + 1, z, P.stone[0]); g.set(13, h + 1, z, P.stone[0]); }
    g.set(8, h, z, P.stone[1]); g.set(13, h, z, P.stone[1]);
  }

  // ---------------------------------------------------------------- trees, lamps, benches
  willowTree(g, -13, 15, { h: 6, r: 4.6, seed: 5 });
  roundTree(g, 20, -2, { h: 5, r: 3.2, seed: 6 });
  roundTree(g, -21, -6, { h: 4, r: 2.8, seed: 7, leaves: P.leafWarm });
  roundTree(g, 2, 18, { h: 4, r: 2.6, seed: 8, leaves: P.blossom });
  bush(g, -1, -12, { r: 1.4, seed: 9, flowers: 0xf4b6c2 });
  bush(g, 1, 5, { r: 1.3, seed: 10 });
  for (const x of [-16, -6, 4, 15]) lampPost(g, x, Math.round(rc(x) - 5), { h: 5 });
  bench(g, -4, Math.round(rc(-4) - 6), { len: 3 });
  bench(g, 15, 17, { len: 3 });
  flowers(g, [-26, -26, 26, 26], { rate: 0.028, seed: 42, ok: (x, z) => ok(x, z, 0.92) && !g.has(x, 1, z) && !river.has(x + ',' + z) });

  const group = new THREE.Group();
  group.add(meshFromGrid(g));

  // ---------------------------------------------------------------- actors
  const actors = [];
  // the punt, with a punter and a passenger
  const punt = model((m) => {
    m.box(-3, 0, -1, 3, 0, 1, P.woodDark);
    m.box(-3, 1, -1, 3, 1, 1, (x, y, z) => (Math.abs(z) === 1 || Math.abs(x) === 3 ? P.wood : null));
    person(m, 2, 1, 0, { shirt: P.white, pants: P.navy, hair: 0x2b211b }); // punter (boater hat colours)
    m.set(2, 5, 0, 0xe8d39a, { jitter: 0 });
    person(m, -1, 1, 0, { shirt: P.honey, pants: 0x6b8fb8, hair: 0x8a5a3b });
    for (let y = 1; y <= 8; y++) m.set(3, y, 1, 0x8a6a4a, { jitter: 0 }); // pole
  }, { x: 0, y: 0, z: 0 });
  punt.scale.setScalar(0.62);
  group.add(punt);
  let lastX = 0;
  actors.push({
    update(t) {
      const x = -9 + Math.sin(t * 0.09) * 9;
      punt.position.set(x, -0.1 + Math.sin(t * 1.5) * 0.04, rc(x));
      const dir = x - lastX;
      if (Math.abs(dir) > 1e-4) punt.rotation.y += ((dir > 0 ? 0 : Math.PI) - punt.rotation.y) * 0.04;
      lastX = x;
    },
  });

  // waving "Distinction" pennant on the tower
  const flag = new THREE.Group();
  const cols = [];
  for (let i = 0; i < 4; i++) {
    const c = model((m) => { m.set(0, 0, 0, P.honey, { jitter: 0 }); m.set(0, 1, 0, i % 2 ? P.honey : 0xe8b86a, { jitter: 0 }); });
    c.scale.set(0.7, 0.7, 0.35);
    c.position.set(0.6 + i * 0.7, 0, 0);
    flag.add(c);
    cols.push(c);
  }
  flag.position.set(10, th + 12.5, -9);
  group.add(flag);
  actors.push({ update(t) { cols.forEach((c, i) => { c.position.y = Math.sin(t * 4 - i * 0.9) * 0.18 * i; c.position.z = Math.sin(t * 3 - i) * 0.12 * i; }); } });

  if (nFall) {
    const m = mist(new THREE.Vector3(fallX, -16.5, fallZ), { count: 12, spread: 3 });
    group.add(m.object);
    actors.push(m);
  }

  const ff = fireflies(new THREE.Vector3(-6, 0, 11), 14, { count: 34, height: 6, seed: 41 });
  group.add(ff.object);
  actors.push(ff);

  return { group, actors, count: g.count, fireflies: [ff], lamp: new THREE.Vector3(-8, 8, 4) };
}
