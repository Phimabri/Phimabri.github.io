// Island 0: home (Clamart). Cosy house, garden, a football goal, a surfboard,
// an apple tree, and a kid doing keepy-uppies.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid } from '../voxel.js';
import { P, pick } from '../palette.js';
import { islandBase, roundTree, bush, flowers, lampPost, fence, bench, paint, person, windowAt } from '../builders.js';
import { model, smoke, fireflies } from '../actors.js';
import { hash2 } from '../rng.js';

export function buildHome() {
  const g = new VoxelGrid(11);
  const base = islandBase(g, { R: 16, depth: 14, seed: 11 });

  // ---------------------------------------------------------------- house
  const X0 = -7, X1 = 4, Z0 = -8, Z1 = -1, H = 6;
  g.box(X0, 1, Z0, X1, H, Z1, (x, y) => (y === 1 ? P.creamShade : P.cream));
  // corner stones
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]])
    for (let y = 1; y <= H; y++) if (y % 2) g.set(x, y, z, P.creamShade);

  // door + step + lamp
  g.box(-2, 1, Z1, -1, 3, Z1, P.woodDark);
  g.set(-2, 2, Z1, 0xd9a441); // door knob-ish
  g.box(-3, 4, Z1 + 1, 0, 4, Z1 + 1, P.roof[1]); // little awning
  g.box(-2, 0, Z1 + 1, -1, 0, Z1 + 1, P.path[0]);
  g.set(-3, 3, Z1 + 1, 0xfff1c9, { glow: P.lampGlow, glowI: 2.4 });

  // windows with sage shutters and flower boxes
  const frontWindow = (x) => {
    g.box(x, 3, Z1, x + 1, 4, Z1, () => null);
    windowAt(g, x, 3, Z1); windowAt(g, x + 1, 3, Z1); windowAt(g, x, 4, Z1); windowAt(g, x + 1, 4, Z1);
    g.set(x - 1, 3, Z1, P.sage); g.set(x - 1, 4, Z1, P.sage);
    g.set(x + 2, 3, Z1, P.sage); g.set(x + 2, 4, Z1, P.sage);
    g.set(x, 2, Z1 + 1, P.wood); g.set(x + 1, 2, Z1 + 1, P.wood);
    g.set(x, 3, Z1 + 1, 0xf28fa0, { jitter: 0 }); g.set(x + 1, 3, Z1 + 1, 0xffd56b, { jitter: 0 });
  };
  frontWindow(-5);
  frontWindow(1);
  // side + back windows
  windowAt(g, X1, 3, -4); windowAt(g, X1, 4, -4); windowAt(g, X1, 3, -5); windowAt(g, X1, 4, -5);
  windowAt(g, X0, 3, -4); windowAt(g, X0, 4, -4);
  windowAt(g, -3, 3, Z0); windowAt(g, -3, 4, Z0);

  // gabled roof (ridge along x) with tile rows
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const y = H + 1 + i;
    const zf = Z1 + 1 - i, zb = Z0 - 1 + i;
    const c = P.roof[i % 2];
    g.box(X0 - 1, y, zf, X1 + 1, y, zf, c);
    g.box(X0 - 1, y, zb, X1 + 1, y, zb, c);
    // gable walls
    if (zb + 1 <= zf - 1) {
      g.box(X0, y, zb + 1, X0, y, zf - 1, P.cream);
      g.box(X1, y, zb + 1, X1, y, zf - 1, P.cream);
    }
  }
  g.box(X0 - 1, H + 1 + layers, Z0 + 2, X1 + 1, H + 1 + layers, Z1 - 2, P.roof[2]); // ridge
  windowAt(g, X1, H + 3, -5); windowAt(g, X1, H + 3, -4); // attic window (my room)
  // dormer
  g.box(-5, H + 3, Z1 - 1, -4, H + 4, Z1 - 1, P.cream);
  windowAt(g, -5, H + 3, Z1 - 1); windowAt(g, -4, H + 3, Z1 - 1);
  g.box(-6, H + 5, Z1 - 1, -3, H + 5, Z1 - 1, P.roof[0]);

  // chimney
  g.box(1, H + 1, -6, 2, H + 8, -6, P.brick);
  g.box(0, H + 9, -7, 3, H + 9, -5, 0x7d4a3c);

  // surfboard leaning on the east wall
  for (let y = 1; y <= 6; y++) g.set(X1 + 1, y, -2, y === 4 ? P.white : 0x55b8bd, { jitter: 0.01 });
  g.set(X1 + 1, 7, -2, 0x55b8bd);

  // ---------------------------------------------------------------- garden
  // path from the door
  for (let z = Z1 + 2; z <= 15; z++) {
    const wob = Math.round(Math.sin(z * 0.5) * 0.8);
    paint(g, -2 + wob, z, P.path);
    paint(g, -1 + wob, z, P.path);
  }
  // flower beds along the facade
  for (let x = X0; x <= X1; x++) if (x < -2 || x > -1) {
    paint(g, x, Z1 + 1, [P.soil]);
    if (hash2(x, 5, 1) < 0.7) g.set(x, 1, Z1 + 1, pick([0xf28fa0, 0xffd56b, 0xffffff, 0xc9a0dc, P.leaf[0]], hash2(x, 9, 2)));
  }

  // football goal (mouth facing -x), on the right lawn
  const gx = 9, gz0 = 2, gz1 = 6;
  for (let y = 1; y <= 3; y++) { g.set(gx, y, gz0, P.white); g.set(gx, y, gz1, P.white); }
  g.box(gx, 3, gz0, gx, 3, gz1, P.white);
  g.box(gx + 1, 1, gz0, gx + 2, 3, gz1, (x, y, z) =>
    (x === gx + 2 || y === 3 || z === gz0 || z === gz1) && (x + y + z) % 2 === 0 ? 0xd9dde0 : null
  );
  // goal-line painted in the grass
  for (let z = 0; z <= 8; z++) paint(g, gx - 5, z, [0xdfe8d0]);

  // apple tree, bench, bushes
  roundTree(g, -10, 5, { h: 4, r: 3.4, seed: 4, fruit: P.apple, fruitRate: 0.08 });
  bench(g, -9, 9, { len: 3 });
  bush(g, 7, -6, { r: 1.6, seed: 8, flowers: 0xf4b6c2 });
  bush(g, -10, -5, { r: 1.5, seed: 9 });
  bush(g, 5, 10, { r: 1.2, seed: 10, flowers: 0xffe08a });
  lampPost(g, 1, 8, { h: 5 });

  // mailbox (future contact section!)
  g.set(-4, 1, 12, P.woodDark); g.set(-4, 2, 12, P.woodDark);
  g.box(-5, 3, 12, -4, 3, 12, P.terracotta);
  g.set(-4, 4, 12, 0xffe08a); // the little flag is up: you've got mail

  // picket fence along the front, gap for the path
  fence(g, -9, 13, -4, 13);
  fence(g, 1, 13, 6, 13);

  flowers(g, [-15, -15, 15, 15], { rate: 0.035, seed: 12, ok: (x, z) => base.d(x, z) < 0.9 && !(x > X0 - 2 && x < X1 + 2 && z > Z0 - 2 && z < Z1 + 2) });

  const group = new THREE.Group();
  group.add(meshFromGrid(g));

  // ---------------------------------------------------------------- actors
  const actors = [];
  const chimney = smoke(new THREE.Vector3(1.5, H + 10, -6), { count: 9 });
  group.add(chimney.object);
  actors.push(chimney);

  // me, doing keepy-uppies in front of the goal
  const kid = model((m) => person(m, 0, 0, 0, { shirt: P.terracotta, pants: P.navy }), { x: 0, y: -0.5, z: 0 });
  kid.position.set(4, 0.5, 4);
  const ball = model((m) => m.set(0, 0, 0, P.white, { jitter: 0 }));
  ball.scale.setScalar(0.7);
  group.add(kid, ball);
  actors.push({
    update(t) {
      const k = Math.abs(Math.sin(t * 3.2));
      ball.position.set(4.9, 0.9 + k * 2.6, 4.2);
      ball.rotation.set(t * 4, t * 3, 0);
      kid.position.y = 0.5 + (k < 0.15 ? 0.15 : 0);
      kid.rotation.y = Math.sin(t * 0.7) * 0.3 + Math.PI * 0.1;
    },
  });

  const ff = fireflies(new THREE.Vector3(-6, 0, 6), 9, { count: 22, height: 7, seed: 7 });
  group.add(ff.object);
  actors.push(ff);

  return { group, actors, count: g.count, fireflies: [ff], lamp: new THREE.Vector3(1, 7, 8) };
}
