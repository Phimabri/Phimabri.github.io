// Island 2: ENSAE Paris. A building with warm wooden slats, a green roof,
// a football pitch with tiny players (sports association) and the "Foyer"
// kiosk with string lights (student union).
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid } from '../voxel.js';
import { P, pick } from '../palette.js';
import { islandBase, roundTree, pineTree, bush, flowers, lampPost, paint, person, windowAt } from '../builders.js';
import { model, fireflies } from '../actors.js';
import { hash2 } from '../rng.js';

export function buildEnsae() {
  const g = new VoxelGrid(31);
  const base = islandBase(g, { R: 23, depth: 19, seed: 31 });
  const ok = (x, z, m = 0.88) => base.d(x, z) < m;

  // ---------------------------------------------------------------- main building (from the photo)
  // A crisp cube wrapped in a silver aluminium grid: slender columns on the ground floor
  // (glass box set back behind them), then four floors of modules filled with light
  // green-grey horizontal louvres. Some louvres are raised (lit windows at night), and the
  // near corner of the top floors is an open, double-height loggia.
  const X0 = -17, X1 = -2, Z0 = -15, Z1 = -4, TOP = 17;
  const FRAME = 0xd9dde0, FRAME2 = 0xb9bfc3, LOUV = [0x9fb0ad, 0x8c9d9a], CORE = 0xa9afb2;
  const isPerim = (x, z) => x === X0 || x === X1 || z === Z0 || z === Z1;
  const alongOf = (x, z) => (z === Z0 || z === Z1 ? x - X0 : z - Z0);
  const floorLine = (y) => y === 5 || (y > 5 && (y - 5) % 3 === 0);
  // the open corner (nearest the camera): last two floors, two modules each way
  const inLoggia = (x, z, y) => y >= 11 && y <= 16 && x >= X1 - 6 && z >= Z1 - 6;

  const FRAME_LIT = 0xe8ebed;
  const isRing = (x, z) => x === X0 + 1 || x === X1 - 1 || z === Z0 + 1 || z === Z1 - 1;
  g.box(X0, 1, Z0, X1, TOP, Z1, (x, y, z) => {
    if (isPerim(x, z)) {
      // outer plane = the aluminium grid only (the louvres sit one voxel behind it)
      const a = alongOf(x, z);
      const corner = (x === X0 || x === X1) && (z === Z0 || z === Z1);
      if (a % 3 === 0 || corner) return y % 2 ? FRAME_LIT : FRAME; // mullions / pilotis
      if (y > 4 && (floorLine(y) || y === TOP)) return FRAME_LIT; // floor bands
      return null;
    }
    if (y <= 4) return null; // ground floor handled below
    if (inLoggia(x, z, y)) return null;
    if (isRing(x, z)) {
      if (floorLine(y)) return FRAME2;
      const a = alongOf(x === X0 + 1 ? X0 : x === X1 - 1 ? X1 : x, z === Z0 + 1 ? Z0 : z === Z1 - 1 ? Z1 : z);
      const mod = Math.floor(a / 3) * 7 + Math.floor((y - 6) / 3) * 13 + (z === Z1 - 1 || x === X1 - 1 ? 1 : 3);
      if (hash2(mod, 3, 31) < 0.3) return 'w'; // raised louvres: a window
      return LOUV[y % 2];
    }
    return CORE;
  });
  // recessed glass ground floor
  const gx0 = X0 + 2, gx1 = X1 - 2, gz0 = Z0 + 2, gz1 = Z1 - 2;
  g.box(gx0, 1, gz0, gx1, 4, gz1, (x, y, z) => {
    const perim = x === gx0 || x === gx1 || z === gz0 || z === gz1;
    if (!perim) return CORE;
    if (y === 4) return FRAME2;
    return null; // glass, set just below
  });
  // glass of the ground floor: greenish, lit at night
  g.box(gx0, 1, gz0, gx1, 3, gz1, (x, y, z) => {
    const perim = x === gx0 || x === gx1 || z === gz0 || z === gz1;
    if (perim) g.set(x, y, z, 0x6f8a86, { glow: P.windowGlow, glowI: 1.6 });
    return null;
  });
  g.box(-10, 1, gz1, -9, 2, gz1, 0x2f3446); // entrance doors
  // loggia: inner glass walls + a floor slab at mid height
  g.box(X1 - 7, 11, Z1 - 7, X1 - 1, 16, Z1 - 1, (x, y, z) => {
    if (x === X1 - 7 || z === Z1 - 7) return 'w';
    return null;
  });
  g.box(X1 - 6, 10, Z1 - 6, X1 - 1, 10, Z1 - 1, FRAME2);
  // roof: flat, light, with a small plant room
  g.box(X0 + 1, TOP, Z0 + 1, X1 - 1, TOP, Z1 - 1, (x, y, z) => (inLoggia(x, z, 16) ? FRAME2 : 0xdfe2e3));
  g.box(-13, TOP + 1, -13, -9, TOP + 2, -10, 0xc9cdd0);
  // a few birch trees like in the photo
  for (const [x, z, s] of [[2, -13, 41], [-19, 2, 42]]) {
    for (let y = 1; y <= 6; y++) g.set(x, y, z, y % 3 ? 0xf1efe8 : 0x3b3a3a);
    bush(g, x, z, { y: 6, r: 2.2, seed: s, leaves: P.leafWarm });
  }

  // ---------------------------------------------------------------- football pitch
  const px0 = 4, px1 = 17, pz0 = -8, pz1 = 8;
  const cx = (px0 + px1) / 2;
  for (let x = px0 - 1; x <= px1 + 1; x++)
    for (let z = pz0 - 2; z <= pz1 + 2; z++) {
      if (!g.has(x, 0, z)) continue;
      const stripe = Math.floor((z - pz0) / 2) % 2 === 0;
      let c = stripe ? P.pitch[0] : P.pitch[1];
      const border = x === px0 || x === px1 || z === pz0 || z === pz1;
      const mid = z === 0;
      const circle = Math.abs(Math.hypot(x - cx, z) - 3) < 0.55;
      const box = (z <= pz0 + 3 || z >= pz1 - 3) && (x === 7 || x === 14) && Math.abs(z) >= pz1 - 3;
      const boxLine = (z === pz0 + 3 || z === pz1 - 3) && x >= 7 && x <= 14;
      if ((border || mid || circle || box || boxLine) && x >= px0 && x <= px1 && z >= pz0 && z <= pz1) c = P.line;
      if (x < px0 || x > px1 || z < pz0 || z > pz1) c = 0x5d9a4b;
      g.set(x, 0, z, c, { jitter: 0.02 });
    }
  const goal = (z, back) => {
    for (let y = 1; y <= 3; y++) { g.set(9, y, z, P.white); g.set(12, y, z, P.white); }
    g.box(9, 3, z, 12, 3, z, P.white);
    g.box(9, 1, back, 12, 3, back, (x, y) => ((x + y) % 2 ? 0xd9dde0 : null));
    g.box(9, 3, Math.min(z, back), 12, 3, Math.max(z, back), (x, y, zz) => (zz !== z && (x + zz) % 2 ? 0xd9dde0 : null));
  };
  goal(pz0 - 1, pz0 - 2);
  goal(pz1 + 1, pz1 + 2);
  // corner flags
  for (const [x, z] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) {
    g.set(x, 1, z, P.white); g.set(x, 2, z, P.white); g.set(x, 3, z, P.terracotta);
  }
  // subs bench on the touchline
  g.box(2, 1, -3, 2, 1, 3, P.woodDark);
  g.box(1, 2, -3, 1, 2, 3, P.wood);
  g.set(2, 2, 2, P.white); // a spare ball

  // ---------------------------------------------------------------- Foyer kiosk + string lights
  const kx0 = -16, kx1 = -10, kz0 = 2, kz1 = 7;
  g.box(kx0, 1, kz0, kx1, 4, kz1, (x, y, z) => (y === 1 ? P.woodDark : x % 2 ? P.woodLight : P.wood));
  // serving hatch (glowing inside)
  for (let x = kx0 + 1; x <= kx1 - 1; x++) { g.set(x, 2, kz1, 0xffd9a0, { glow: 0xffb25e, glowI: 2 }); g.set(x, 3, kz1, 0xffd9a0, { glow: 0xffb25e, glowI: 2 }); }
  g.box(kx0 + 1, 2, kz1 + 1, kx1 - 1, 2, kz1 + 1, P.woodLight); // counter
  g.box(kx0 - 1, 5, kz0 - 1, kx1 + 1, 5, kz1 + 2, (x, y, z) => ((x + z) % 2 ? P.terracotta : 0xf3e6d0)); // striped awning roof
  g.box(kx0 + 1, 6, kz0 + 1, kx1 - 1, 6, kz1 - 1, P.woodDark);
  // stools + picnic tables
  const table = (x, z) => {
    g.box(x, 2, z, x + 2, 2, z + 1, P.woodLight);
    g.set(x, 1, z, P.woodDark); g.set(x + 2, 1, z + 1, P.woodDark);
    g.box(x, 1, z - 1, x + 2, 1, z - 1, P.wood);
    g.box(x, 1, z + 2, x + 2, 1, z + 2, P.wood);
  };
  table(-16, 11);
  table(-9, 12);
  // poles + bulbs strung in a catenary
  const poles = [[-17, 9], [-6, 9], [-6, 15]];
  for (const [x, z] of poles) for (let y = 1; y <= 6; y++) g.set(x, y, z, P.woodDark);
  const bulbs = [0xffd27a, 0xff9f7a, 0xfff2c4, 0x9fd9b0];
  const string = (a, b, ya, yb) => {
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.2);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      const y = ya + (yb - ya) * t - Math.sin(Math.PI * t) * 1.6;
      const c = bulbs[i % bulbs.length];
      g.set(x, y, z, c, i % 2 ? { glow: c, glowI: 2.6, jitter: 0 } : { jitter: 0 });
    }
  };
  string([kx1 + 1, kz1 + 2], poles[1], 5, 6);
  string([kx0 - 1, kz1 + 2], poles[0], 5, 6);
  string(poles[0], poles[1], 6, 6);
  string(poles[1], poles[2], 6, 6);

  // ---------------------------------------------------------------- paths & greenery
  for (let x = -9; x <= 3; x++) { paint(g, x, -3, P.path); paint(g, x, -2, P.path); }
  for (let z = -2; z <= 18; z++) { const w = Math.round(Math.sin(z * 0.4)); paint(g, -7 + w, z, P.path); paint(g, -6 + w, z, P.path); }
  roundTree(g, -20, -2, { h: 4, r: 2.8, seed: 7 });
  roundTree(g, 1, 13, { h: 5, r: 3, seed: 8, leaves: P.leafWarm });
  pineTree(g, 20, 0, { h: 8, seed: 9 });
  pineTree(g, 3, -17, { h: 9, seed: 10 });
  roundTree(g, -3, 19, { h: 3, r: 2.4, seed: 11, leaves: P.blossom });
  bush(g, -19, 7, { r: 1.4, seed: 12 });
  lampPost(g, 0, -4);
  lampPost(g, -4, 8);
  flowers(g, [-22, -22, 22, 22], { rate: 0.03, seed: 32, ok: (x, z) => ok(x, z, 0.94) && !(x >= px0 - 1 && x <= px1 + 1 && z >= pz0 - 2 && z <= pz1 + 2) });

  const group = new THREE.Group();
  group.add(meshFromGrid(g));

  // ---------------------------------------------------------------- tiny football match
  const actors = [];
  const teamA = { shirt: P.terracotta, pants: P.white };
  const teamB = { shirt: 0x6b8fb8, pants: P.navy };
  const hairs = [0x4a3326, 0x2b211b, 0xc9973f, 0x6b4a2f, 0x1e1a18];
  const players = [];
  const spots = [
    [7, -4, teamA], [14, -3, teamA], [10.5, -6.5, teamA],
    [7, 4, teamB], [13, 3, teamB], [10.5, 6.5, teamB],
  ];
  spots.forEach(([x, z, team], i) => {
    const m = model((mm) => person(mm, 0, 0, 0, { ...team, hair: hairs[i % hairs.length] }), { x: 0, y: -0.5, z: 0 });
    m.scale.setScalar(0.8);
    m.position.set(x, 0.5, z);
    group.add(m);
    players.push({ m, home: new THREE.Vector3(x, 0.5, z), phase: i * 1.7 });
  });
  const ball = model((m) => m.set(0, 0, 0, P.white, { jitter: 0 }));
  ball.scale.setScalar(0.5);
  group.add(ball);

  // the ball is passed from player to player along little arcs
  let from = 0, to = 3, t0 = 0;
  const order = [0, 3, 1, 4, 2, 5, 1, 3, 0, 4, 2, 5];
  let k = 0;
  const tmp = new THREE.Vector3();
  actors.push({
    update(t) {
      const dur = 1.25;
      if (t - t0 > dur) { t0 = t; from = to; k = (k + 1) % order.length; to = order[k] === from ? order[(k + 1) % order.length] : order[k]; }
      const u = Math.min(1, (t - t0) / dur);
      const a = players[from].m.position, b = players[to].m.position;
      tmp.lerpVectors(a, b, u);
      ball.position.set(tmp.x + 0.4, 0.75 + Math.sin(Math.PI * u) * 1.6, tmp.z);
      ball.rotation.x += 0.2;
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        // drift toward the ball a little, jog in place
        const bx = ball.position.x, bz = ball.position.z;
        const ax = p.home.x + (bx - p.home.x) * 0.25 + Math.sin(t * 0.8 + p.phase) * 1.2;
        const az = p.home.z + (bz - p.home.z) * 0.2 + Math.cos(t * 0.6 + p.phase) * 0.8;
        p.m.position.x += (ax - p.m.position.x) * 0.05;
        p.m.position.z += (az - p.m.position.z) * 0.05;
        p.m.position.y = 0.5 + Math.abs(Math.sin(t * 9 + p.phase)) * 0.18;
        p.m.rotation.y = Math.atan2(bx - p.m.position.x, bz - p.m.position.z) - Math.PI / 2;
      }
    },
  });

  const ff = fireflies(new THREE.Vector3(-10, 0, 8), 10, { count: 26, height: 6, seed: 31 });
  group.add(ff.object);
  actors.push(ff);

  return { group, actors, count: g.count, fireflies: [ff], lamp: new THREE.Vector3(-12, 6, 10) };
}
