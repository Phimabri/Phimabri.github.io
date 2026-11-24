// Small animated things living on the islands.
import * as THREE from 'three';
import { VoxelGrid, meshFromGrid } from './voxel.js';

/** Build a small voxel model with a callback, centred on `pivot`. */
export function model(fn, pivot = { x: 0, y: 0, z: 0 }, seed = 3) {
  const g = new VoxelGrid(seed);
  fn(g);
  return meshFromGrid(g, { pivot });
}

/** Chimney / campfire smoke: cubes that rise, drift and shrink away. */
export function smoke(origin, { count = 10, rate = 0.22, rise = 10, drift = 3.5, size = 1.1, color = 0xf2eee8 } = {}) {
  const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.9 });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, count);
  mesh.position.copy(origin);
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const e = new THREE.Euler();
  return {
    object: mesh,
    update(t) {
      for (let i = 0; i < count; i++) {
        const age = (t * rate + i / count) % 1;
        p.set(age * drift + Math.sin(age * 7 + i) * 0.4, age * rise, Math.cos(age * 5 + i * 2) * 0.4);
        const k = size * (0.35 + age * 1.3) * Math.pow(1 - age, 0.6);
        s.set(k, k, k);
        e.set(age * 1.3 + i, age * 2 + i, 0);
        q.setFromEuler(e);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Mist puffs at the bottom of a waterfall. */
export function mist(origin, { count = 14, spread = 4 } = {}) {
  return smoke(origin, { count, rate: 0.5, rise: 2.5, drift: -spread, size: 1.0, color: 0xf3fbfb });
}

/** Points that drift around and glow at night. */
export function fireflies(center, radius, { count = 40, height = 8, seed = 1 } = {}) {
  const pos = new Float32Array(count * 3);
  const ph = new Float32Array(count);
  let a = seed;
  const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const ang = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * radius;
    pos.set([Math.cos(ang) * r, 1.5 + rnd() * height, Math.sin(ang) * r], i * 3);
    ph[i] = rnd() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uScale: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float phase;
      uniform float uTime; uniform float uScale;
      varying float vA;
      void main(){
        vec3 p = position;
        float t = uTime * 0.35 + phase;
        p += vec3(sin(t*1.3)*1.6, sin(t*0.9)*0.9, cos(t*1.1)*1.6);
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        vA = 0.5 + 0.5 * sin(uTime * 2.2 + phase * 3.0);
        gl_PointSize = uScale * (1.5 + vA) * (120.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight; varying float vA;
      void main(){
        vec2 c = abs(gl_PointCoord - 0.5);
        if (max(c.x, c.y) > 0.5) discard;
        gl_FragColor = vec4(vec3(1.0, 0.85, 0.45) * (0.6 + vA), uNight * (0.35 + 0.65 * vA));
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.position.copy(center);
  pts.frustumCulled = false;
  return { object: pts, material: mat, update(t) { mat.uniforms.uTime.value = t; } };
}
