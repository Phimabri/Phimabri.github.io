// Voxel engine: a sparse grid + a face-culling mesher with per-vertex ambient occlusion.
// The whole world is built from code with this, no external models.
import * as THREE from 'three';
import { hash3 } from './rng.js';

export const SOLID = 1;
export const GLOW = 2; // opaque, but lights up at night (windows, lamps)
export const WATER = 3; // translucent, animated

const OFF = 512;
const key = (x, y, z) => ((x + OFF) * 1024 + (y + OFF)) * 1024 + (z + OFF);
const tmp = new THREE.Color();

export class VoxelGrid {
  constructor(seed = 1) {
    this.map = new Map();
    this.seed = seed;
  }

  get(x, y, z) {
    return this.map.get(key(x, y, z));
  }

  has(x, y, z) {
    return this.map.has(key(x, y, z));
  }

  del(x, y, z) {
    this.map.delete(key(x, y, z));
  }

  /**
   * @param color hex number / css string
   * @param o { type, jitter, glow (hex), glowI }
   */
  set(x, y, z, color, o = {}) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    // 'w' = window glass, lit at night (most of the time)
    if (color === 'w') {
      const lit = hash3(x, y, z, this.seed + 7) < 0.82;
      return this.set(x, y, z, 0x5d7289, lit ? { glow: 0xffc979, glowI: 1.9 } : {});
    }
    const type = o.type ?? (o.glow != null ? GLOW : SOLID);
    const jitter = o.jitter ?? 0.045;
    tmp.set(color);
    const j = 1 + (hash3(x, y, z, this.seed) - 0.5) * 2 * jitter;
    const v = { r: tmp.r * j, g: tmp.g * j, b: tmp.b * j, t: type, gr: 0, gg: 0, gb: 0, x, y, z };
    if (o.glow != null) {
      tmp.set(o.glow);
      const gi = o.glowI ?? 1.6;
      v.gr = tmp.r * gi; v.gg = tmp.g * gi; v.gb = tmp.b * gi;
    }
    this.map.set(key(x, y, z), v);
    return v;
  }

  /** Inclusive box. `color` may be a function (x,y,z) => hex | null (skip) | false (erase). */
  box(x0, y0, z0, x1, y1, z1, color, o) {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let x = ax; x <= bx; x++)
      for (let y = ay; y <= by; y++)
        for (let z = az; z <= bz; z++) {
          const c = typeof color === 'function' ? color(x, y, z) : color;
          if (c === false) this.del(x, y, z);
          else if (c != null) this.set(x, y, z, c, o);
        }
  }

  clearBox(x0, y0, z0, x1, y1, z1) {
    this.box(x0, y0, z0, x1, y1, z1, () => false);
  }

  get count() {
    return this.map.size;
  }
}

// ---------------------------------------------------------------- mesher

const AO = [0.48, 0.66, 0.83, 1.0];
const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const DIRS = [];
for (let a = 0; a < 3; a++)
  for (const s of [1, -1]) {
    const n = [0, 0, 0];
    n[a] = s;
    DIRS.push({ a, s, n, u: (a + 1) % 3, v: (a + 2) % 3 });
  }

function buildGeometry(grid, wantWater, offset) {
  const pos = [], nor = [], col = [], glo = [], idx = [];
  const occ = (x, y, z) => {
    const v = grid.get(x, y, z);
    return v && v.t !== WATER ? 1 : 0;
  };
  const p = [0, 0, 0], b = [0, 0, 0];

  for (const v of grid.map.values()) {
    const isWater = v.t === WATER;
    if (isWater !== wantWater) continue;
    const above = grid.get(v.x, v.y + 1, v.z);
    const lowerTop = isWater && !(above && above.t === WATER);

    for (const d of DIRS) {
      const nb = grid.get(v.x + d.n[0], v.y + d.n[1], v.z + d.n[2]);
      if (nb) {
        if (isWater) continue;
        if (nb.t !== WATER) continue;
      }
      const base = pos.length / 3;
      const ao = [];
      for (const [cu, cv] of CORNERS) {
        p[d.a] = d.s > 0 ? 1 : 0;
        p[d.u] = cu;
        p[d.v] = cv;
        let px = v.x + p[0] - 0.5 - offset.x;
        let py = v.y + p[1] - 0.5 - offset.y;
        let pz = v.z + p[2] - 0.5 - offset.z;
        if (lowerTop && p[1] === 1) py -= 0.2;
        pos.push(px, py, pz);
        nor.push(d.n[0], d.n[1], d.n[2]);

        // ambient occlusion from the 3 cells touching this corner, in front of the face
        b[0] = v.x + d.n[0]; b[1] = v.y + d.n[1]; b[2] = v.z + d.n[2];
        const su = cu ? 1 : -1, sv = cv ? 1 : -1;
        const s1 = occ(b[0] + (d.u === 0 ? su : 0), b[1] + (d.u === 1 ? su : 0), b[2] + (d.u === 2 ? su : 0));
        const s2 = occ(b[0] + (d.v === 0 ? sv : 0), b[1] + (d.v === 1 ? sv : 0), b[2] + (d.v === 2 ? sv : 0));
        const cc = occ(
          b[0] + (d.u === 0 ? su : 0) + (d.v === 0 ? sv : 0),
          b[1] + (d.u === 1 ? su : 0) + (d.v === 1 ? sv : 0),
          b[2] + (d.u === 2 ? su : 0) + (d.v === 2 ? sv : 0)
        );
        const level = isWater ? 3 : s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
        ao.push(level);
        const k = AO[level];
        col.push(v.r * k, v.g * k, v.b * k);
        glo.push(v.gr, v.gg, v.gb);
      }
      // keep CCW winding seen from outside, split along the brighter diagonal
      const order = d.s > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
      const q = order.map((i) => base + i);
      const A = ao[order[0]] + ao[order[2]];
      const B = ao[order[1]] + ao[order[3]];
      if (A >= B) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
      else idx.push(q[1], q[2], q[3], q[1], q[3], q[0]);
    }
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('glow', new THREE.Float32BufferAttribute(glo, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

// ---------------------------------------------------------------- materials

export const uniforms = {
  uNight: { value: 0 },
  uTime: { value: 0 },
};

let voxelMat, waterMat;

function voxelMaterial() {
  if (voxelMat) return voxelMat;
  voxelMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  voxelMat.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = uniforms.uNight;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 glow;\nvarying vec3 vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying vec3 vGlow;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow * uNight;'
      );
  };
  voxelMat.customProgramCacheKey = () => 'voxel-glow';
  return voxelMat;
}

function waterMaterial() {
  if (waterMat) return waterMat;
  waterMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
  });
  waterMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime;
    sh.uniforms.uNight = uniforms.uNight;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);'
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uNight;
varying vec3 vWPos;
varying vec3 vWN;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  // stepped time: water moves in little "frames", like hand-animated pixel art
  float tq = floor(uTime * 8.0) / 8.0;
  vec2 p = floor(vWPos.xz * 2.0) / 2.0;
  vec3 c = diffuseColor.rgb;
  if (vWN.y > 0.5) {
    float w = sin(p.x * 0.85 + tq * 1.4 + sin(p.y * 0.45 + tq * 0.7) * 1.6) * sin(p.y * 0.7 - tq * 1.1);
    c = mix(c, c * 1.28 + vec3(0.02, 0.05, 0.05), step(0.62, w) * 0.75);
    c = mix(c, c * 0.82, step(w, -0.75) * 0.6);
    // rain-like ripples (nod to "pond water effects")
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float age = fract(uTime * 0.33 + fi * 0.333);
      float cyc = floor(uTime * 0.33 + fi * 0.333);
      vec2 q = mod(vWPos.xz, 18.0);
      vec2 ctr = vec2(h21(vec2(cyc, fi)), h21(vec2(fi, cyc + 7.0))) * 18.0;
      float d = length(floor((q - ctr) * 2.0) / 2.0);
      float ring = 1.0 - smoothstep(0.0, 0.55, abs(d - age * 5.0));
      c += ring * (1.0 - age) * 0.32;
    }
    // sparkles
    float s = h21(floor(vWPos.xz * 1.5) + floor(uTime * 2.5) * 3.17);
    c += step(0.988, s) * mix(vec3(0.75), vec3(0.95, 0.85, 0.6), uNight);
  } else {
    // falling water: bright streaks sliding down
    float lane = h21(vec2(floor(vWPos.x + vWPos.z), 3.0));
    float f = fract(vWPos.y * 0.35 + tq * 1.8 + lane);
    c = mix(c, c * 1.4 + 0.06, step(0.7, f) * 0.8);
  }
  diffuseColor.rgb = c;
}`
      );
  };
  waterMat.customProgramCacheKey = () => 'voxel-water';
  return waterMat;
}

/** Build a THREE.Group from a grid. `pivot` is subtracted from all positions. */
export function meshFromGrid(grid, { pivot = { x: 0, y: 0, z: 0 }, cast = true, receive = true } = {}) {
  const group = new THREE.Group();
  const opaque = buildGeometry(grid, false, pivot);
  if (opaque) {
    const m = new THREE.Mesh(opaque, voxelMaterial());
    m.castShadow = cast;
    m.receiveShadow = receive;
    group.add(m);
  }
  const water = buildGeometry(grid, true, pivot);
  if (water) {
    const w = new THREE.Mesh(water, waterMaterial());
    w.receiveShadow = true;
    w.renderOrder = 2;
    group.add(w);
  }
  return group;
}
