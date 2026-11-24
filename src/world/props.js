// Travelling hot-air balloon + drifting voxel clouds.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid } from './voxel.js';
import { P } from './palette.js';
import { cloudGrid } from './builders.js';
import { mulberry32 } from './rng.js';

export function buildBalloon() {
  const g = new VoxelGrid(51);
  const stripes = [P.terracotta, 0xfff1dc, P.honey, 0xfff1dc];
  // envelope
  for (let y = 3; y <= 13; y++) {
    const t = (y - 3) / 10;
    const r = 4.6 * Math.pow(Math.sin(Math.PI * (0.14 + 0.84 * t)), 0.62);
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++)
      for (let dz = -R; dz <= R; dz++) {
        const d = Math.hypot(dx, dz);
        if (d > r) continue;
        const a = (Math.atan2(dz, dx) + Math.PI * 2) % (Math.PI * 2);
        const seg = Math.floor(a / (Math.PI / 4)) % 4;
        const c = y === 8 ? P.navy : stripes[seg];
        g.set(dx, y, dz, c, { jitter: 0.025 });
      }
  }
  g.box(-1, 2, -1, 1, 2, 1, 0xd8c7a8); // neck
  // burner (glows at night)
  g.set(0, 1, 0, 0xffa040, { glow: 0xff9a3a, glowI: 3 });
  // ropes
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    for (let y = -1; y <= 1; y++) g.set(x, y, z, 0x6b4a32, { jitter: 0 });
  // basket
  g.box(-1, -3, -1, 1, -2, 1, (x, y, z) => (y === -2 && x === 0 && z === 0 ? null : (x + y + z) % 2 ? P.wood : P.woodDark));
  // me, in the basket
  g.set(0, -2, 0, P.sage, { jitter: 0 });
  g.set(0, -1, 0, 0xf1c7a1, { jitter: 0 });
  g.set(0, 0, 0, 0x4a3326, { jitter: 0 });
  const mesh = meshFromGrid(g, { pivot: { x: 0, y: 5, z: 0 } });
  const group = new THREE.Group();
  group.add(mesh);
  group.scale.setScalar(0.85);
  return group;
}

export function buildClouds(scene, { count = 18, seed = 7, area, avoid = () => false }) {
  const rnd = mulberry32(seed);
  const clouds = [];
  const templates = [];
  // clouds get their own material: a touch of self-light tinted by the sky so they stay fluffy, never grey
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0.4 });
  for (let i = 0; i < 5; i++) {
    const g = new VoxelGrid(100 + i);
    cloudGrid(g, 900 + i * 31, 0.9 + rnd() * 0.6);
    const m = meshFromGrid(g, { cast: false, receive: false });
    m.traverse((o) => { if (o.isMesh) o.material = material; });
    templates.push(m);
  }
  for (let i = 0; i < count; i++) {
    const c = templates[i % templates.length].clone();
    for (let tries = 0; tries < 40; tries++) {
      c.position.set(
        area.x0 + rnd() * (area.x1 - area.x0),
        area.y0 + rnd() * (area.y1 - area.y0),
        area.z0 + rnd() * (area.z1 - area.z0)
      );
      if (!avoid(c.position)) break;
    }
    c.userData.s = 0.9 + rnd() * 1.4;
    c.scale.setScalar(c.userData.s);
    c.rotation.y = rnd() * Math.PI;
    c.userData.speed = 0.6 + rnd() * 1.2;
    scene.add(c);
    clouds.push(c);
  }
  return {
    clouds,
    material,
    update(dt) {
      for (const c of clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > area.x1) c.position.x = area.x0;
        // fade out (shrink) when drifting into the camera corridor
        const near = avoid(c.position);
        c.userData.k = (c.userData.k ?? 1) + ((near ? 0 : 1) - (c.userData.k ?? 1)) * Math.min(1, dt * 1.5);
        c.scale.setScalar(c.userData.s * Math.max(0.001, c.userData.k));
      }
    },
  };
}
