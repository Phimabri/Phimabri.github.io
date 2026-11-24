// Little surprises that cross the far sky from time to time:
// a plane with its contrail, a rocket, a kid riding a yellow cloud, birds by day, a UFO at night.
// They live in camera space (far behind the islands) so they show up wherever the visitor is.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid } from './voxel.js';

const model = (fn, pivot = { x: 0, y: 0, z: 0 }) => {
  const g = new VoxelGrid(77);
  fn(g);
  return meshFromGrid(g, { pivot, cast: false, receive: false });
};

// ---------------------------------------------------------------- models
function plane() {
  return model((g) => {
    const W = 0xf4f1ea, R = 0xe07a5f, G = 0x8fb3c9;
    g.box(-5, 0, 0, 4, 1, 0, W);
    g.box(-4, 0, 0, 3, 0, 0, R); // belly stripe
    g.set(5, 0, 0, W); g.set(5, 1, 0, 0xdedbd2);
    for (let x = 1; x <= 3; x++) g.set(x, 1, 0, G, { glow: 0xffd89a, glowI: 1.5 }); // cabin windows
    g.box(-1, 0, -4, 1, 0, 4, W); // wings
    g.set(0, 0, -4, R, { glow: 0xff4a3a, glowI: 3 }); g.set(0, 0, 4, 0x6fd38a, { glow: 0x4aff7a, glowI: 3 }); // nav lights
    g.box(-5, 2, 0, -5, 3, 0, R); // tail fin
    g.box(-5, 1, -2, -5, 1, 2, W);
  });
}

function rocket() {
  return model((g) => {
    const W = 0xf4f1ea, R = 0xe07a5f;
    for (let y = 0; y <= 7; y++) g.box(-1, y, -1, 1, y, 1, y === 2 ? 0xbfc4c9 : W);
    g.set(0, 5, 1, 0x7cc8ff, { glow: 0x9fd8ff, glowI: 2 }); // porthole
    g.box(-1, 8, -1, 1, 8, 1, R);
    g.set(0, 9, 0, R); g.set(0, 10, 0, R);
    for (const [x, z] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) { g.set(x, 0, z, R); g.set(x, 1, z, R); g.set(x, -1, z, R); }
    g.set(0, -1, 0, 0xffb347, { glow: 0xff8a2a, glowI: 4 }); // engine
  }, { x: 0, y: 4, z: 0 });
}

function flame() {
  return model((g) => {
    g.set(0, 0, 0, 0xffe08a, { glow: 0xffc24a, glowI: 5, jitter: 0 });
    g.set(0, -1, 0, 0xffa040, { glow: 0xff7a2a, glowI: 5, jitter: 0 });
    g.set(0, -2, 0, 0xff7a3a, { glow: 0xff5a2a, glowI: 4, jitter: 0 });
  });
}

function cloudKid() {
  // Built ~3x finer than the other eggs (then scaled down) so the figure reads clearly.
  // Axes: +x = direction of flight, +y = up, z = left/right of the body.
  return model((g) => {
    const o = { jitter: 0.015 };
    // ------------------------------------------------ golden cloud with a trailing tail
    const Y = 0xffd56b, YL = 0xffeaa8, YD = 0xeeb64e;
    const puffs = [
      [0, -1, 0, 12, 4.4, 7.5], [6, 1, 1, 7, 4, 5.5], [-5, 1, -1, 7.5, 4, 6], [2, 2, -4, 5, 3, 3.5],
      [-13, -1, 0, 5.5, 3.2, 4.2], [-18.5, -1.5, -0.5, 4, 2.4, 3], [-23, -2, 0, 2.6, 1.6, 2],
    ];
    for (const [cx, cy, cz, rx, ry, rz] of puffs)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
          for (let z = Math.floor(cz - rz); z <= cz + rz; z++) {
            const d = Math.hypot((x - cx) / rx, (y - cy) / ry, (z - cz) / rz);
            if (d > 1) continue;
            g.set(x, y, z, y >= cy + ry * 0.35 ? YL : y <= cy - ry * 0.4 ? YD : Y, o);
          }
    const base = 4; // feet sink a little into the cloud

    // ------------------------------------------------ the kid
    const OR = 0xf08a24, ORD = 0xd9731a, BL = 0x2f5aa8, SK = 0xf3c9a2, HA = 0x17151a, RE = 0xc8372d;
    const box = (x0, y0, z0, x1, y1, z1, c) => g.box(x0, base + y0, z0, x1, base + y1, z1, c, o);
    // boots
    box(-1, 0, -3, 2, 2, -1, BL);
    box(-1, 0, 1, 2, 2, 3, BL);
    // baggy gi trousers
    box(-2, 3, -3, 1, 8, -1, OR);
    box(-2, 3, 1, 1, 8, 3, OR);
    box(-2, 7, -3, 1, 9, 3, OR);
    box(-2, 4, -3, -2, 8, -1, ORD); // back shading of the legs
    box(-2, 4, 1, -2, 8, 3, ORD);
    // belt with its knot
    box(-2, 10, -3, 2, 10, 3, BL);
    box(3, 9, -1, 3, 10, 0, BL);
    // gi top, blue undershirt showing in a V
    box(-2, 11, -3, 2, 16, 3, OR);
    box(2, 13, -1, 2, 16, 1, BL);
    box(2, 15, -2, 2, 16, 2, BL);
    // arms: shoulders, sleeves, blue wristbands, hands
    box(-1, 13, -5, 1, 16, -4, OR);
    box(-1, 13, 4, 1, 16, 5, OR);
    box(-1, 11, -5, 1, 12, -4, SK);
    box(-1, 11, 4, 1, 12, 5, SK);
    box(-1, 9, -5, 1, 10, -4, BL);
    box(-1, 9, 4, 1, 10, 5, BL);
    box(-1, 7, -5, 1, 8, -4, SK); // fists
    box(-1, 7, 4, 1, 8, 5, SK);
    // neck + head
    box(-1, 17, -1, 1, 17, 1, SK);
    box(-2, 18, -3, 2, 23, 3, SK);
    g.set(3, base + 21, -1, HA, o); g.set(3, base + 21, 1, HA, o); // eyes
    g.set(3, base + 19, 0, 0xe8a98a, o); // smile hint
    // spiky black hair: cap + big spikes up and back
    box(-3, 22, -4, 2, 25, 4, HA);
    box(-3, 18, -4, -3, 21, 4, HA); // back of the head
    box(2, 24, -3, 3, 24, 3, HA); // fringe
    g.set(3, base + 23, -2, HA, o); g.set(3, base + 23, 2, HA, o); g.set(3, base + 22, 0, HA, o);
    const spikes = [
      [0, 26, 0, 4], [-1, 26, -3, 3], [-1, 26, 3, 3], [1, 26, -2, 2], [1, 26, 2, 2],
      [-3, 25, 0, 3], [-4, 24, -3, 2], [-4, 24, 3, 2], [0, 24, -5, 2], [0, 24, 5, 2],
    ];
    for (const [x, y, z, h] of spikes)
      for (let i = 0; i < h; i++) {
        // spikes lean back and outward as they rise
        const xx = x - Math.floor(i * 0.6);
        const zz = z + Math.sign(z) * Math.floor(i * 0.5);
        g.set(xx, base + y + i, zz, HA, o);
        if (i < h - 1) g.set(xx, base + y + i, zz + (z >= 0 ? -1 : 1), HA, o);
      }
    // the red staff slung across the back
    for (let i = 0; i <= 22; i++) g.set(-3, base + 4 + i, Math.round(-5 + i * 0.45), RE, o);
  }, { x: 0, y: 6, z: 0 });
}

function ufo() {
  return model((g) => {
    const M = 0xaab3bd, D = 0x7f8a94;
    for (let x = -4; x <= 4; x++)
      for (let z = -4; z <= 4; z++) {
        const d = Math.hypot(x, z);
        if (d <= 4.4) g.set(x, 0, z, d > 3.4 && (x + z) % 2 === 0 ? 0xfff1a8 : M, d > 3.4 && (x + z) % 2 === 0 ? { glow: 0xfff07a, glowI: 3 } : {});
        if (d <= 3) g.set(x, -1, z, D);
        if (d <= 2.2) g.set(x, 1, z, 0x9fe8d8, { glow: 0x7affd8, glowI: 1.6 });
        if (d <= 1.2) g.set(x, 2, z, 0x9fe8d8, { glow: 0x7affd8, glowI: 1.6 });
      }
  });
}

function bird() {
  const grp = new THREE.Group();
  const body = model((g) => { g.set(0, 0, 0, 0x3d405b); g.set(1, 0, 0, 0x3d405b); });
  const wl = model((g) => { g.set(0, 0, -1, 0x3d405b); g.set(0, 0, -2, 0x3d405b); }, { x: 0, y: 0, z: -0.5 });
  const wr = model((g) => { g.set(0, 0, 1, 0x3d405b); g.set(0, 0, 2, 0x3d405b); }, { x: 0, y: 0, z: 0.5 });
  grp.add(body, wl, wr);
  grp.userData = { wl, wr };
  return grp;
}

// ---------------------------------------------------------------- trails
const SPIN = new THREE.Vector3(0.3, 1, 0.2).normalize();
class Trail {
  constructor(scene, { count = 40, color = 0xffffff, life = 2.5, size = 2, grow = 2.5, emissive = 0.5 }) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: emissive }),
      count
    );
    this.mesh.frustumCulled = false;
    this.pts = Array.from({ length: count }, () => ({ p: new THREE.Vector3(), t: -1e9, r: 0 }));
    this.i = 0;
    Object.assign(this, { life, size, grow, count });
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3();
    this.last = -1;
    scene.add(this.mesh);
  }
  emit(pos, t, every = 0.06) {
    if (t - this.last < every) return;
    this.last = t;
    const pt = this.pts[this.i];
    this.i = (this.i + 1) % this.count;
    pt.p.copy(pos);
    pt.t = t;
    pt.r = Math.random() * 6;
  }
  update(t) {
    for (let k = 0; k < this.count; k++) {
      const pt = this.pts[k];
      const age = (t - pt.t) / this.life;
      const sc = age < 0 || age > 1 ? 0.0001 : this.size * (0.5 + age * this.grow) * (1 - age) ** 0.7;
      this.s.setScalar(sc);
      this.q.setFromAxisAngle(SPIN, pt.r + age);
      this.m.compose(pt.p, this.q, this.s);
      this.mesh.setMatrixAt(k, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- orientation helper
const UPW = new THREE.Vector3(0, 1, 0);
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
/** Point the model's +x along `dir` (staying upright), then roll around that axis. */
function orient(obj, dir, roll = 0) {
  _f.copy(dir).normalize();
  _u.copy(UPW).addScaledVector(_f, -_f.dot(UPW)).normalize();
  _s.crossVectors(_f, _u);
  _m.makeBasis(_f, _u, _s);
  obj.quaternion.setFromRotationMatrix(_m);
  if (roll) obj.rotateX(roll);
}

// ---------------------------------------------------------------- choreography
export function createSkyEggs(scene) {
  const S = 2.4; // background eggs are big voxels: they are far away
  const eggs = [];
  const add = (obj, def) => {
    obj.scale.setScalar(S * (def.scale ?? 1));
    obj.visible = false;
    scene.add(obj);
    eggs.push({ obj, ...def });
  };

  const contrail = new Trail(scene, { count: 70, color: 0xffffff, life: 4, size: 2.2, grow: 1.6, emissive: 0.6 });
  const smoke = new Trail(scene, { count: 50, color: 0xf2eee8, life: 2.2, size: 3, grow: 2.2, emissive: 0.45 });
  const sparkle = new Trail(scene, { count: 50, color: 0xffe08a, life: 1.3, size: 0.55, grow: 1.2, emissive: 0.8 });

  const fl = flame();
  const rk = rocket();
  rk.add(fl);
  fl.position.y = -5.5;

  // Background eggs live in camera space. path(u, cycle) -> x, y in screen units (-1..1)
  // and d = distance from the camera, so they also travel in depth (true perspective).
  add(plane(), {
    period: 37, dur: 19, offset: 31, trail: contrail, trailAt: [-5, 0.5, 0],
    path: (u, c) => {
      const s = c % 2 ? -1 : 1;
      return { x: s * (-1.35 + 2.7 * u), y: 0.66 - 0.18 * u, d: 560 - 260 * u };
    },
  });
  add(rk, { period: 53, dur: 11, offset: 12, upright: true, trail: smoke, trailAt: [0, -6, 0],
    path: (u, c) => ({ x: (c % 2 ? -0.72 : 0.7) + 0.1 * u, y: -1.3 + 2.7 * u * u, d: 380 + 60 * u }) });
  add(ufo(), { period: 31, dur: 10, offset: 20, night: true, hover: true,
    path: (u) => ({ x: -0.9 + 1.8 * (u < 0.4 ? (u / 0.4) * 0.5 : u > 0.75 ? 0.5 + ((u - 0.75) / 0.25) * 1.3 : 0.5), y: 0.72 + 0.04 * Math.sin(u * 20), d: 360 }) });
  const flock = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const b = bird();
    b.position.set(-Math.abs(i - 2) * 3, (i % 2) * 1.2, (i - 2) * 3.2);
    b.userData.ph = i * 0.7;
    flock.add(b);
  }
  add(flock, { period: 27, dur: 15, offset: 7, day: true, scale: 0.55,
    path: (u, c) => ({ x: (c % 2 ? -1 : 1) * (-1.2 + 2.4 * u), y: 0.42 + 0.06 * Math.sin(u * 5), d: 300 + 120 * Math.sin(u * Math.PI) }) });

  // ------------------------------------------------ the cloud kid flies for real, in world space:
  // lazy loops around the island you are looking at (behind it, in front of it, climbing and
  // diving, banking into the turns, casting a little shadow), now and then a long detour out of
  // sight, and when you travel he follows you to the next island.
  const kid = cloudKid();
  kid.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  kid.scale.setScalar(0.2);
  scene.add(kid);
  const center = new THREE.Vector3(), hasCenter = { v: false };
  const kidPos = new THREE.Vector3(), kidNext = new THREE.Vector3(), kidPrev = new THREE.Vector3(1, 0, 0), kidTan = new THREE.Vector3();
  let kidRoll = 0;
  let orbitR = 20;
  const kidAt = (out, t, c) => {
    const th = t * 0.26;
    const detour = Math.pow(Math.max(0, Math.sin(t * 0.07)), 6) * 110; // occasional long excursion
    const a = orbitR + 9 + detour, b = orbitR * 0.85 + 6 + detour * 0.5;
    return out.set(c.x + Math.cos(th) * a, c.y + 15 + 6 * Math.sin(th * 2 + 0.6) + 3 * Math.sin(th * 3.1), c.z + Math.sin(th) * b);
  };

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const tmp = new THREE.Vector3(), off = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();

  const api = {
    freeze: null, // debug: { i, u } shows only background egg i at progress u; { kid: t } parks the kid at time t
    update(time, camera, state, dt = 0.016, focus = null, focusR = 20) {
      orbitR += (focusR - orbitR) * (1 - Math.exp(-dt * 0.9));
      camera.getWorldDirection(fwd);
      right.crossVectors(fwd, UPW).normalize();
      up.crossVectors(right, fwd).normalize();
      const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const night = state.glow > 0.6, day = state.glow < 0.3;
      const place = (out, p) =>
        out.copy(camera.position).addScaledVector(fwd, p.d).addScaledVector(right, p.x * p.d * tanH * camera.aspect).addScaledVector(up, p.y * p.d * tanH);

      for (const [ei, e] of eggs.entries()) {
        const fr = api.freeze && api.freeze.i != null;
        const k = (time + e.offset) / e.period;
        const cycle = fr ? 1 : Math.floor(k);
        const u = fr ? (api.freeze.i === ei ? api.freeze.u : 2) : ((k % 1) * e.period) / e.dur;
        const allowed = fr || ((!e.night || night) && (!e.day || day));
        if (u > 1 || !allowed) { e.obj.visible = false; continue; }
        e.obj.visible = true;
        place(p0, e.path(u, cycle));
        place(p1, e.path(Math.min(1, u + 0.01), cycle));
        e.obj.position.copy(p0);
        if (e.upright) { e.obj.quaternion.copy(camera.quaternion); e.obj.rotateY(0.5); e.obj.rotateZ(-0.08); }
        else if (e.hover) { e.obj.quaternion.copy(camera.quaternion); e.obj.rotateX(0.35); }
        else if (p1.distanceToSquared(p0) > 1e-6) orient(e.obj, tmp.subVectors(p1, p0));
        if (e.trail) {
          off.set(...e.trailAt).multiplyScalar(e.obj.scale.x).applyQuaternion(e.obj.quaternion);
          e.trail.emit(tmp.copy(e.obj.position).add(off), time);
        }
      }

      // the kid: follow the focused island smoothly, fly the loop, bank into the turns
      if (focus) {
        if (!hasCenter.v) { center.copy(focus); hasCenter.v = true; }
        else center.lerp(focus, 1 - Math.exp(-dt * 0.9));
      }
      const kt = api.freeze && api.freeze.kid != null ? api.freeze.kid : time;
      kidAt(kidPos, kt, center);
      kidAt(kidNext, kt + 0.15, center);
      kidTan.subVectors(kidNext, kidPos).normalize();
      const turn = kidPrev.x * kidTan.z - kidPrev.z * kidTan.x; // signed yaw change this frame
      kidPrev.copy(kidTan);
      const targetRoll = THREE.MathUtils.clamp((-turn / Math.max(dt, 1e-3)) * 1.4, -0.5, 0.5);
      kidRoll += (targetRoll - kidRoll) * Math.min(1, dt * 3);
      kid.position.copy(kidPos);
      kid.position.y += Math.sin(time * 1.7) * 0.3;
      orient(kid, kidTan, kidRoll);
      off.set(-22, -4, 0).multiplyScalar(kid.scale.x).applyQuaternion(kid.quaternion);
      sparkle.emit(tmp.copy(kid.position).add(off), time, 0.05);

      // flicker the rocket flame, flap the birds
      fl.scale.set(1, 0.8 + Math.random() * 0.6, 1);
      flock.children.forEach((b) => {
        const a = Math.sin(time * 9 + b.userData.ph) * 0.7;
        b.userData.wl.rotation.x = a;
        b.userData.wr.rotation.x = -a;
      });
      contrail.update(time);
      smoke.update(time);
      sparkle.update(time);
    },
  };
  return api;
}
