// The 3D world: renderer, lights, islands, sky, camera choreography.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// The monitor's glass, drawn as a quad in viewport pixels right where the illustrated room
// (DOM, on top of the canvas) has its hole. It shows the malOS desktop texture, with the island
// world as a window that can shrink into its folder icon (uWin). Raw display colours.
const ScreenShader = {
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D uIslands, uDesk; uniform vec4 uWin; uniform float uWinA, uCRT, uTime;
    varying vec2 vUv;
    float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
    void main(){
      vec2 c = vUv * 2.0 - 1.0;
      c *= 1.0 + uCRT * 0.03 * dot(c, c);
      vec2 uv = c * 0.5 + 0.5;
      vec3 col = texture2D(uDesk, uv).rgb;
      vec2 mn = uWin.xy, mx = uWin.zw;
      vec2 ctr = (mn + mx) * 0.5, hf = (mx - mn) * 0.5;
      float full = step(0.999, hf.x * 2.0);
      float d = rbox(uv - ctr, hf, mix(0.012, 0.0, full));
      col *= 1.0 - (1.0 - smoothstep(0.0, 0.03, d + 0.004)) * 0.35 * (1.0 - full) * uWinA;
      if (d < 0.0 && uWinA > 0.0) col = mix(col, texture2D(uIslands, (uv - mn) / (mx - mn)).rgb, uWinA);
      col *= 1.0 - uCRT * 0.28 * pow(length(c) * 0.75, 3.0);
      col += uCRT * vec3(0.012, 0.008, 0.02);
      col *= 1.0 - uCRT * 0.025 * (0.5 + 0.5 * sin(uv.y * 1400.0));
      col += uCRT * vec3(1.0, 0.85, 0.7) * 0.035 * smoothstep(0.9, 0.0, length(c - vec2(-0.55, 0.6)));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

import { uniforms as voxelUniforms } from './voxel.js';
import { sampleTime, lookHour } from './timeOfDay.js';
import { createSky } from './sky.js';
import { buildBalloon, buildClouds } from './props.js';
import { createSkyEggs } from './skyEggs.js';
import { createRoom2D, SCREEN, ART } from '../room/room2d.js';
import { paintWallpaper, createDeskTexture, eduIconUV } from '../os/desktopArt.js';
import { buildHome } from './islands/home.js';
import { buildSaclay } from './islands/saclay.js';
import { buildEnsae } from './islands/ensae.js';
import { buildOxford } from './islands/oxford.js';

// rAF so the loader can paint, with a timeout fallback for background tabs
const nextFrame = () =>
  new Promise((r) => {
    let done = false;
    const go = () => { if (!done) { done = true; r(); } };
    requestAnimationFrame(go);
    setTimeout(go, 50);
  });
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uVig: { value: 0.22 }, uCrop: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec2 uRes, uCrop; uniform float uVig;
    varying vec2 vUv;
    float bayer4(vec2 p){
      int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
      int i = x + y * 4;
      int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
      return float(m[i]) / 16.0 - 0.5;
    }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // cosy grade: a touch warmer, highlights rolled off, shadows lifted (never harsh)
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(c.rgb, c.rgb * vec3(1.035, 1.0, 0.93), 0.6);
      c.rgb = mix(c.rgb, vec3(l), 0.03);
      c.rgb = c.rgb * 0.95 + 0.02;
      c.rgb = min(c.rgb, vec3(0.94)) + max(c.rgb - 0.94, 0.0) * 0.35; // soft shoulder on whites
      vec2 q = (vUv - 0.5) * uCrop; // uCrop: in the room the 4:3 picture is cover-fitted, keep the viewport's vignette
      c.rgb *= 1.0 - dot(q, q) * uVig * 2.0;
      // ordered dithering at the render-pixel scale: removes banding, adds a retro grain
      c.rgb += bayer4(gl_FragCoord.xy) / 64.0;
      gl_FragColor = c;
    }`,
};

export async function createWorld(canvas, { roomEl, onProgress = () => {}, reducedMotion = false } = {}) {
  // ---------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 200, 700);
  const camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);

  const sky = createSky();
  scene.add(sky.mesh);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.35;
  const sc = sun.shadow.camera;
  sc.near = 1; sc.far = 400;
  scene.add(sun, sun.target);

  // ---------------------------------------------------------------- islands
  const builders = [buildHome, buildSaclay, buildEnsae, buildOxford];
  const positions = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-68, -8, -100),
    new THREE.Vector3(36, 4, -192),
    new THREE.Vector3(-44, -2, -290),
  ];
  const islands = [];
  let voxels = 0;
  for (let i = 0; i < builders.length; i++) {
    await nextFrame();
    const isl = builders[i]();
    voxels += isl.count;
    isl.group.position.copy(positions[i]);
    isl.base = positions[i].clone();
    isl.lift = 0;
    isl.liftTarget = 0;
    isl.phase = i * 1.7;
    const lamp = new THREE.PointLight(0xffb86b, 0, 38, 1.6);
    lamp.position.copy(isl.lamp);
    isl.group.add(lamp);
    isl.pointLight = lamp;
    scene.add(isl.group);
    islands.push(isl);
    onProgress({ step: i + 1, total: builders.length + 1, voxels });
  }
  await nextFrame();

  const balloon = buildBalloon();
  scene.add(balloon);
  const eggs = createSkyEggs(scene);

  // ---------------------------------------------------------------- camera rig
  // Each stop = a look-at target + an orbit (distance, azimuth, elevation) around it.
  // Between stops we interpolate those orbit values rather than raw positions: the camera
  // glides along wide arcs, rises a little mid-flight, and never cuts corners.
  const UP = new THREE.Vector3(0, 1, 0);
  const stopDefs = [
    { island: 0, offset: [-66, 44, 92], shift: 13, lookY: 3 },
    { island: 1, offset: [80, 54, 100], shift: 16, lookY: 4 },
    { island: 2, offset: [92, 58, 92], shift: -19, lookY: 4 },
    { island: 3, offset: [94, 62, 108], shift: 22, lookY: 5 },
    { pos: [225, 182, 120], target: [-15, -8, -175] },
  ];
  const balloonDefs = [
    [25, 19, -8], [24, 22, -22], [-14, 24, 18], [28, 28, -22], [-50, 55, -265],
  ];
  let rig = [];
  let mobile = false;
  let aspect = 16 / 9;

  function buildRig() {
    rig = stopDefs.map((s, i) => {
      let pos, tgt, b;
      if (s.island != null) {
        const c = positions[s.island].clone().add(new THREE.Vector3(0, s.lookY, 0));
        pos = c.clone().add(new THREE.Vector3(...s.offset));
        if (mobile) pos.sub(c).multiplyScalar(1.45).add(c);
        const fwd = c.clone().sub(pos).normalize();
        const right = fwd.clone().cross(UP).normalize();
        // on narrower desktop windows, push the island further from the text
        const shift = mobile ? 0 : s.shift * (aspect < 1.5 ? 1.35 : 1);
        tgt = c.clone().addScaledVector(right, -shift);
        pos.addScaledVector(right, -shift);
        if (mobile) tgt.y -= 21;
        b = positions[s.island].clone().add(new THREE.Vector3(...balloonDefs[i]));
      } else {
        pos = new THREE.Vector3(...s.pos);
        tgt = new THREE.Vector3(...s.target);
        if (mobile) pos.sub(tgt).multiplyScalar(1.35).add(tgt);
        b = new THREE.Vector3(...balloonDefs[i]);
      }
      const o = pos.sub(tgt);
      const r = o.length();
      return { t: tgt, r, az: Math.atan2(o.x, o.z), el: Math.asin(o.y / r), b };
    });
  }
  buildRig();

  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpAngle = (a, b, t) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };
  function rigAt(p, outPos, outTgt, outBalloon) {
    const N = rig.length - 1;
    const q = Math.min(N, Math.max(0, p));
    const i = Math.min(N - 1, Math.floor(q));
    const f = q - i;
    const A = rig[i], B = rig[i + 1];
    const arc = Math.sin(Math.PI * f); // 0 at the stops, 1 mid-flight
    outTgt.lerpVectors(A.t, B.t, f);
    const r = Math.exp(lerp(Math.log(A.r), Math.log(B.r), f)) * (1 + 0.42 * arc);
    const az = lerpAngle(A.az, B.az, f);
    const el = lerp(A.el, B.el, f) + 0.07 * arc;
    outPos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r).add(outTgt);
    if (outBalloon) {
      outBalloon.lerpVectors(A.b, B.b, f);
      outBalloon.y += arc * 8;
    }
  }

  // clouds stay out of the camera corridor and out of every line of sight camera -> target
  const sight = [];
  for (let i = 0; i <= 150; i++) {
    const cp = new THREE.Vector3(), tp = new THREE.Vector3();
    rigAt((i / 150) * (stopDefs.length - 1), cp, tp);
    sight.push(new THREE.Line3(cp, tp));
  }
  const closest = new THREE.Vector3();
  const avoid = (p) => {
    for (const l of sight) {
      l.closestPointToPoint(p, true, closest);
      if (closest.distanceToSquared(p) < 60 * 60) return true;
    }
    for (const isl of positions) if (Math.abs(isl.x - p.x) < 40 && Math.abs(isl.z - p.z) < 40 && p.y > isl.y - 22) return true;
    return false;
  };
  const clouds = buildClouds(scene, { count: 24, avoid, area: { x0: -240, x1: 220, y0: -45, y1: 40, z0: -400, z1: 80 } });
  onProgress({ step: builders.length + 1, total: builders.length + 1, voxels });

  // ---------------------------------------------------------------- post-processing
  // HalfFloat + MSAA render target: crisp, antialiased edges and no banding
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.45, 1.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  // ---------------------------------------------------------------- chapter 02: the room
  // an illustration in the DOM (src/room) + the glass of its monitor, drawn here
  const room = createRoom2D(roomEl);
  await room.prepare(); // bitmaps of the drawing for smooth zooms (behind the loader)
  const screenU = {
    uIslands: { value: null },
    uDesk: { value: null },
    uWin: { value: new THREE.Vector4(0, 0, 1, 1) },
    uWinA: { value: 1 },
    uCRT: { value: 0 },
    uTime: { value: 0 },
  };
  const screenScene = new THREE.Scene();
  const screenCam = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);
  const screenQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({ uniforms: screenU, toneMapped: false, depthTest: false, depthWrite: false, ...ScreenShader })
  );
  screenQuad.frustumCulled = false;
  screenScene.add(screenQuad);
  const wallpaper = paintWallpaper();
  screenU.uDesk.value = createDeskTexture(wallpaper);
  const EDU_UV = eduIconUV();
  room.setNotes(...noteText());
  function noteText() {
    return (document.documentElement.lang || 'en').startsWith('fr') ? ['Projets', 'bientôt ✿'] : ['Projects', 'coming ✿'];
  }

  let pixelMode = false;
  let baseFov = 28;
  let pixelRatio = 1;
  let quality = Math.min(window.devicePixelRatio || 1, 1.5); // lowered automatically if frames drop
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;
    mobile = w < 820;
    aspect = w / h;
    buildRig();
    const px = Math.max(2, Math.min(4, Math.round(w / 480)));
    pixelRatio = pixelMode ? 1 / px : quality;
    // MSAA would soften the big pixels: only use it for the smooth render
    const samples = pixelMode ? 0 : 4;
    for (const t of [composer.renderTarget1, composer.renderTarget2])
      if (t.samples !== samples) { t.samples = samples; t.dispose(); }
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);
    // pixel mode: scale the canvas by an exact integer so every pixel is a perfect square
    if (pixelMode) {
      canvas.style.width = canvas.width * px + 'px';
      canvas.style.height = canvas.height * px + 'px';
    } else {
      canvas.style.width = '';
      canvas.style.height = '';
    }
    camera.aspect = w / h;
    baseFov = mobile ? 34 : 28;
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
    Object.assign(screenCam, { left: 0, right: w, top: 0, bottom: -h });
    screenCam.updateProjectionMatrix();
    grade.uniforms.uRes.value.set(canvas.width, canvas.height);
    sky.uniforms.uResY.value = canvas.height;
    canvas.classList.toggle('is-pixel', pixelMode);
    const scale = Math.max(1, pixelRatio * 1.5);
    islands.forEach((isl) => isl.fireflies.forEach((f) => (f.material.uniforms.uScale.value = scale)));
  }
  let resizePending = false;
  window.addEventListener('resize', () => (resizePending = true));
  resize();

  // ---------------------------------------------------------------- state
  let progress = 0; // 0 .. stops-1
  let hour = 12, hourTarget = 12;
  const pointer = new THREE.Vector2(0, 0), pointerSm = new THREE.Vector2(0, 0);
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const desiredPos = new THREE.Vector3(), desiredTgt = new THREE.Vector3(), balloonTgt = new THREE.Vector3();
  rigAt(0, camPos, camTgt);
  const tmpV = new THREE.Vector3(), right = new THREE.Vector3();
  const fogCol = new THREE.Color();
  const focusV = new THREE.Vector3();
  let time = 0;
  let state = sampleTime(lookHour(hour));

  // hover / click on islands. Each island gets an invisible, low-poly "hit shape" (a tapered
  // cylinder hugging its silhouette) that stays at the island's resting position: the hover lift
  // and the floating bob no longer move the target under the cursor (that made it flicker).
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for (const isl of islands) {
    isl.box = new THREE.Box3();
    isl.group.children[0].traverse((m) => m.geometry?.boundingBox && isl.box.union(m.geometry.boundingBox));
    const r = Math.min(isl.box.max.x - isl.box.min.x, isl.box.max.z - isl.box.min.z) / 2;
    const top = isl.box.max.y, bottom = -7;
    const geo = new THREE.CylinderGeometry(r * 0.95, r * 0.55, top - bottom, 20);
    isl.hit = new THREE.Mesh(geo, hitMat);
    isl.hit.position.set(
      isl.base.x + (isl.box.min.x + isl.box.max.x) / 2,
      isl.base.y + (top + bottom) / 2,
      isl.base.z + (isl.box.min.z + isl.box.max.z) / 2
    );
    isl.hit.updateMatrixWorld(true);
  }
  const hitList = islands.map((i) => i.hit);
  function pickIsland(x, y) {
    if (roomMode) return -1;
    ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitList, false)[0];
    return hit ? hitList.indexOf(hit.object) : -1;
  }

  // ---------------------------------------------------------------- modes & transitions
  // 'edu'    : the island world, full screen, driven by the page scroll
  // 'toDesk' : the camera pulls out of the monitor, the Education window shrinks into its folder,
  //            then we move in on the malOS desktop (HTML fades in on top of the screen)
  // 'desk'   : the computer desktop (hub with the Education + Experience folders)
  // 'toEdu'  : the Education window grows back from its folder and we dive into the screen
  // 'intro'  : first arrival: a wide shot of the room, then we move in on the computer's desktop
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let mode = 'edu', modeT0 = 0, modeResolve = null;
  const onMode = new Set();
  function setMode(m) {
    mode = m;
    modeT0 = time;
    onMode.forEach((f) => f(m));
  }

  const SCREEN_ASPECT = SCREEN.w / SCREEN.h;
  const SCX = SCREEN.x + SCREEN.w / 2, SCY = SCREEN.y + SCREEN.h / 2;
  // 2D views of the illustration: centre (art units) + scale (viewport px per art unit),
  // interpolated with the scale in log space (a zoom that feels even all the way)
  const KEY = {
    fill: () => ({ cx: SCX, cy: SCY, s: Math.max(window.innerWidth / SCREEN.w, window.innerHeight / SCREEN.h) }),
    wide: () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.max(vw / ART.w, vh / ART.h) * 1.03;
      const hx = vw / 2 / s, hy = vh / 2 / s;
      const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
      return { cx: clamp(800, hx, ART.w - hx), cy: clamp(455, hy, ART.h - hy), s };
    },
    desk: () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = mobile ? (vw * 0.98) / SCREEN.w : Math.min((vh * 0.8) / SCREEN.h, (vw * 0.84) / SCREEN.w);
      return { cx: SCX, cy: SCY - (mobile ? 0 : 14 / s), s };
    },
  };
  const view = { cx: 0, cy: 0, s: 1 };
  function camBetween(A, B, e) {
    view.cx = A.cx + (B.cx - A.cx) * e;
    view.cy = A.cy + (B.cy - A.cy) * e;
    view.s = Math.exp(Math.log(A.s) + (Math.log(B.s) - Math.log(A.s)) * e);
  }
  const lerpWin = (k) => {
    // k = 0: full screen, k = 1: shrunk into the Education folder icon
    const e = k;
    screenU.uWin.value.set(EDU_UV.x0 * e, EDU_UV.y0 * e, 1 + (EDU_UV.x1 - 1) * e, 1 + (EDU_UV.y1 - 1) * e);
  };

  const desk = { active: false, alpha: 0, x: 0, y: 0, w: 0, h: 0 };
  let roomMode = false;
  let parallax = 1;

  // dynamic resolution: if the GPU struggles, lower the render scale a notch
  let ftAcc = 0, ftN = 0, perfT = 0;
  function watchPerf(dt) {
    if (pixelMode || dt <= 0) return;
    perfT += dt;
    if (perfT < 4) return; // warm-up
    ftAcc += Math.min(dt, 0.1); ftN++;
    if (ftAcc > 2.5) {
      const avg = ftAcc / ftN;
      ftAcc = 0; ftN = 0;
      if (avg > 1 / 45 && quality > 1) {
        quality = Math.max(1, +(quality - 0.25).toFixed(2));
        resizePending = true; // applied at the start of the next frame, just before it is drawn
      }
    }
  }

  function update(dt) {
    if (resizePending) { resizePending = false; resize(); }
    time += dt;
    voxelUniforms.uTime.value = time;

    // time of day (shortest way around the clock)
    let dh = hourTarget - hour;
    if (dh > 12) dh -= 24;
    if (dh < -12) dh += 24;
    hour = (hour + dh * (1 - Math.exp(-dt * 2.5)) + 24) % 24;
    const lh = lookHour(hour);
    state = sampleTime(lh);
    if (lh !== hour) state.phase = 'golden'; // daytime shown in its late-afternoon look
    voxelUniforms.uNight.value = state.glow;
    sky.uniforms.uTop.value.copy(state.top);
    sky.uniforms.uHor.value.copy(state.hor);
    sky.uniforms.uSun.value.copy(state.sunDir);
    sky.uniforms.uMoon.value.copy(state.moonDir);
    sky.uniforms.uSunCol.value.copy(state.light);
    sky.uniforms.uStars.value = state.stars;
    sky.uniforms.uTime.value = time;
    hemi.color.copy(state.sky);
    hemi.groundColor.copy(state.ground);
    hemi.intensity = state.hi * 1.8;
    sun.color.copy(state.light);
    sun.intensity = state.li * 1.7;
    bloom.strength = state.bloom;
    clouds.material.emissive.copy(state.sky).lerp(state.hor, 0.35);
    clouds.material.emissiveIntensity = 0.55 + state.glow * 0.1;
    fogCol.copy(state.hor).lerp(state.top, 0.3);
    scene.fog.color.copy(fogCol);

    // camera along the rig
    rigAt(Math.min(progress, rig.length - 1), desiredPos, desiredTgt, balloonTgt);
    pointerSm.x = damp(pointerSm.x, pointer.x, 3, dt);
    pointerSm.y = damp(pointerSm.y, pointer.y, 3, dt);
    tmpV.subVectors(desiredTgt, desiredPos);
    const dist = tmpV.length();
    right.copy(tmpV).normalize().cross(UP).normalize();
    const sway = reducedMotion ? 0 : 1;
    desiredPos.addScaledVector(right, pointerSm.x * dist * 0.025 + Math.sin(time * 0.12) * 1.0 * sway);
    desiredPos.y += pointerSm.y * dist * 0.015 + Math.sin(time * 0.17) * 0.6 * sway;
    const k = reducedMotion ? 12 : 4.5;
    camPos.x = damp(camPos.x, desiredPos.x, k, dt);
    camPos.y = damp(camPos.y, desiredPos.y, k, dt);
    camPos.z = damp(camPos.z, desiredPos.z, k, dt);
    camTgt.x = damp(camTgt.x, desiredTgt.x, k, dt);
    camTgt.y = damp(camTgt.y, desiredTgt.y, k, dt);
    camTgt.z = damp(camTgt.z, desiredTgt.z, k, dt);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    sky.mesh.position.copy(camPos);

    const camDist = camPos.distanceTo(camTgt);
    scene.fog.near = camDist * 1.25;
    scene.fog.far = camDist * 4.2 + 120;

    // sun / shadow frustum follows what we look at
    const ext = Math.min(150, Math.max(42, camDist * 0.42));
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
    sc.updateProjectionMatrix();
    sun.target.position.copy(camTgt);
    sun.position.copy(camTgt).addScaledVector(state.lightDir, 200);

    // islands float + lift on hover
    for (const isl of islands) {
      isl.lift = damp(isl.lift, isl.liftTarget, 6, dt);
      const bob = reducedMotion ? 0 : Math.sin(time * 0.5 + isl.phase) * 0.45;
      isl.group.position.y = isl.base.y + bob + isl.lift;
      isl.pointLight.intensity = state.glow * 55;
      for (const a of isl.actors) a.update(time, dt);
      for (const f of isl.fireflies) f.material.uniforms.uNight.value = Math.max(0, state.glow - 0.3) / 0.7;
    }

    // balloon
    balloon.position.x = damp(balloon.position.x, balloonTgt.x, 2.2, dt);
    balloon.position.y = damp(balloon.position.y, balloonTgt.y + Math.sin(time * 0.8) * 0.8, 2.2, dt);
    balloon.position.z = damp(balloon.position.z, balloonTgt.z, 2.2, dt);
    balloon.rotation.y = time * 0.08;

    clouds.update(dt);
    // the island we are looking at (the cloud kid loops around it)
    let fi = 0, fd = Infinity;
    islands.forEach((isl, i) => { const d = isl.group.position.distanceToSquared(camTgt); if (d < fd) { fd = d; fi = i; } });
    focusV.copy(islands[fi].group.position).lerp(camTgt, 0.45); // pull the loop toward the middle of the frame
    eggs.update(time, camera, state, dt, focusV, (islands[fi].box.max.x - islands[fi].box.min.x) / 2);

    // ---------------------------------------------------- transition timeline
    const T = time - modeT0;
    let deskA = 0, winK = 0, winA = 1, crt = 0, needIslands = true;
    roomMode = mode !== 'edu';
    if (mode === 'intro') {
      const dolly = ease(Math.min(1, Math.max(0, (T - 0.5) / 2.7)));
      camBetween(KEY.wide(), KEY.desk(), dolly);
      winK = 1; winA = 0; crt = 1; needIslands = false;
      deskA = sstep(2.75, 3.2, T);
      if (T >= 3.25) { setMode('desk'); modeResolve?.(); modeResolve = null; }
    } else if (mode === 'toDesk') {
      const r = ease(Math.min(1, T / 1.8));
      const dolly = ease(Math.min(1, Math.max(0, (T - 2.0) / 1.5)));
      if (dolly <= 0) camBetween(KEY.fill(), KEY.wide(), r);
      else camBetween(KEY.wide(), KEY.desk(), dolly);
      winK = ease(Math.min(1, Math.max(0, (T - 1.35) / 1.1)));
      winA = 1 - sstep(0.82, 1, winK);
      crt = Math.min(1, T / 0.9);
      deskA = sstep(3.15, 3.65, T);
      needIslands = winA > 0;
      if (T >= 3.7) { setMode('desk'); modeResolve?.(); modeResolve = null; }
    } else if (mode === 'desk') {
      camBetween(KEY.wide(), KEY.desk(), 1);
      winK = 1; winA = 0; crt = 1; deskA = 1; needIslands = false;
    } else if (mode === 'toEdu') {
      deskA = 1 - sstep(0, 0.35, T);
      const grow = ease(Math.min(1, Math.max(0, (T - 0.3) / 0.95)));
      winK = 1 - grow;
      winA = sstep(0, 0.12, grow);
      const z = ease(Math.min(1, Math.max(0, (T - 0.55) / 1.7)));
      camBetween(KEY.desk(), KEY.fill(), z);
      crt = 1 - sstep(1.7, 2.25, T);
      if (T >= 2.3) { roomMode = false; setMode('edu'); modeResolve?.(); modeResolve = null; }
    } else if (mode === 'toApp' || mode === 'app' || mode === 'fromApp') {
      // a program opens: we dive toward the glass until the screen fills the view (like Education)
      winK = 1; winA = 0; crt = 1; needIslands = false;
      let z = 1;
      if (mode === 'toApp') { z = ease(Math.min(1, T / 1.25)); if (T >= 1.3) { setMode('app'); modeResolve?.(); modeResolve = null; } }
      if (mode === 'fromApp') { z = 1 - ease(Math.min(1, T / 1.1)); if (T >= 1.15) { setMode('desk'); modeResolve?.(); modeResolve = null; } }
      camBetween(KEY.desk(), KEY.fill(), z);
      deskA = 1 - sstep(0.05, 0.45, z);
    }
    const U = screenU;
    U.uCRT.value = crt;
    U.uWinA.value = winA;
    U.uTime.value = time;
    lerpWin(winK);

    if (!roomMode || needIslands) {
      // in the room the islands are rendered for a 4:3 screen, cover-fit so the hand-off is seamless
      let fov = baseFov, asp = window.innerWidth / window.innerHeight;
      if (roomMode) {
        if (asp >= SCREEN_ASPECT) fov = THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) * asp) / SCREEN_ASPECT));
        asp = SCREEN_ASPECT;
      }
      if (camera.fov !== fov || camera.aspect !== asp) { camera.fov = fov; camera.aspect = asp; camera.updateProjectionMatrix(); }
      const va = window.innerWidth / window.innerHeight;
      if (!roomMode) grade.uniforms.uCrop.value.set(1, 1);
      else if (va >= SCREEN_ASPECT) grade.uniforms.uCrop.value.set(1, va / SCREEN_ASPECT);
      else grade.uniforms.uCrop.value.set(SCREEN_ASPECT / va, 1);
      composer.renderToScreen = !roomMode;
      composer.render(dt);
      if (roomMode) U.uIslands.value = composer.readBuffer.texture;
    }
    if (roomMode) {
      // parallax is strongest in the wide shot, almost nothing once the screen is under the cursor
      const settle = mode === 'desk' ? 0.35 : mode === 'intro' || mode === 'toDesk' || mode === 'toEdu' ? 1 : 0.1;
      parallax += (settle - parallax) * (1 - Math.exp(-dt * 3));
      const vw = window.innerWidth, vh = window.innerHeight;
      const V = window.__roomView || view; // debug: __roomView = { cx, cy, s } freezes the view
      const rest = mode === 'desk' && (!window.__roomView || window.__roomView.live); // { live: true } inspects the crisp SVG
      const R = room.setView(V.cx, V.cy, V.s, pointerSm.x, pointerSm.y, reducedMotion ? 0 : parallax, rest);
      // the drawing is hidden once the glass covers the whole viewport (inside a program, at the hand-off)
      const covered = R.x <= 0.5 && R.y <= 0.5 && R.x + R.w >= vw - 0.5 && R.y + R.h >= vh - 0.5;
      room.setVisible(!covered);
      if (!covered) room.setView(V.cx, V.cy, V.s, pointerSm.x, pointerSm.y, reducedMotion ? 0 : parallax, rest);
      Object.assign(desk, { x: R.x, y: R.y, w: R.w, h: R.h });
      screenQuad.position.set(R.x + R.w / 2, -(R.y + R.h / 2), 0);
      screenQuad.scale.set(R.w, R.h, 1);
      renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, vw, vh); // never inherit a stale viewport (dynamic resolution changes)
      renderer.render(screenScene, screenCam);
    } else room.setVisible(false);
    desk.active = roomMode;
    desk.alpha = roomMode ? deskA : 0;
    watchPerf(dt);
  }

  return {
    voxels,
    islands,
    camera,
    scene,
    eggs,
    room,
    desk,
    refreshNotes() { room.setNotes(...noteText()); },
    wallpaper,
    get mode() { return mode; },
    onMode(f) { onMode.add(f); },
    goDesk() {
      if (mode !== 'edu') return Promise.resolve();
      setMode('toDesk');
      return new Promise((r) => (modeResolve = r));
    },
    /** Land on the computer (the site's home). `instant` skips the camera move. */
    intro(instant = false) {
      modeResolve?.(); modeResolve = null; // a pending intro (skipped or restarted) still settles
      setMode(instant ? 'desk' : 'intro');
      roomMode = true;
      if (instant) return Promise.resolve();
      return new Promise((r) => (modeResolve = r));
    },
    goApp() {
      if (mode !== 'desk') return Promise.resolve();
      setMode('toApp');
      return new Promise((r) => (modeResolve = r));
    },
    leaveApp() {
      if (mode !== 'app') return Promise.resolve();
      setMode('fromApp');
      return new Promise((r) => (modeResolve = r));
    },
    goEdu() {
      if (mode !== 'desk') return Promise.resolve();
      setMode('toEdu');
      return new Promise((r) => (modeResolve = r));
    },
    stops: 6,
    update,
    resize,
    pick: pickIsland,
    setProgress(p) { progress = p; },
    setHour(h, instant = false) { hourTarget = h; if (instant) hour = h; },
    get hour() { return hour; },
    get state() { return state; },
    setPointer(x, y) { pointer.set(x, y); },
    setHover(i) { islands.forEach((isl, j) => (isl.liftTarget = j === i ? 1.6 : 0)); },
    setPixel(on) { pixelMode = on; resize(); },
    get pixel() { return pixelMode; },
    warmUp() {
      // render once with frustum culling off so every island, prop and the room are uploaded
      // to the GPU (geometry + shaders) behind the loader, instead of the first time they appear
      const culled = [];
      const off = (o) => { if (o.frustumCulled) { o.frustumCulled = false; culled.push(o); } };
      scene.traverse(off);
      renderer.compile(scene, camera);
      renderer.compile(screenScene, screenCam);
      composer.render(0);
      culled.forEach((o) => (o.frustumCulled = true));
    },
    snap() {
      update(0);
      camPos.copy(desiredPos);
      camTgt.copy(desiredTgt);
      balloon.position.copy(balloonTgt);
    },
  };
}
