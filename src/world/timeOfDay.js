// Day/night cycle: everything the lighting needs, as a function of the hour (0..24).
import * as THREE from 'three';

// glow: how much windows/lamps light up · stars: star visibility · bloom: post fx
const KEYS = [
  { h: 0.0, top: '#0b1430', hor: '#24335f', light: '#9fb4ff', li: 0.55, sky: '#40528f', ground: '#1b1a2e', hi: 0.75, glow: 1, stars: 1, bloom: 0.5, phase: 'night' },
  { h: 4.8, top: '#0e1838', hor: '#2c3a69', light: '#9fb4ff', li: 0.5, sky: '#40528f', ground: '#1b1a2e', hi: 0.75, glow: 1, stars: 0.95, bloom: 0.5, phase: 'night' },
  { h: 6.4, top: '#5a6aa0', hor: '#f0b39a', light: '#ffb48f', li: 0.8, sky: '#8d93c4', ground: '#5d4a50', hi: 0.85, glow: 0.55, stars: 0.15, bloom: 0.4, phase: 'dawn' },
  { h: 8.5, top: '#84afd8', hor: '#f1dfc6', light: '#ffdcb4', li: 1.3, sky: '#b4c7d8', ground: '#7d6a56', hi: 0.86, glow: 0, stars: 0, bloom: 0.1, phase: 'morning' },
  { h: 13.0, top: '#7eabd6', hor: '#ece3d3', light: '#ffeacf', li: 1.55, sky: '#b9cadb', ground: '#83705a', hi: 0.86, glow: 0, stars: 0, bloom: 0.06, phase: 'noon' },
  { h: 16.0, top: '#7ba5d2', hor: '#efdec4', light: '#ffe0bc', li: 1.5, sky: '#b6c6d6', ground: '#857058', hi: 0.85, glow: 0, stars: 0, bloom: 0.08, phase: 'afternoon' },
  { h: 17.6, top: '#7f9fc9', hor: '#f6cfa3', light: '#ffc58a', li: 1.35, sky: '#bfc3d6', ground: '#8a6a50', hi: 0.84, glow: 0.05, stars: 0, bloom: 0.18, phase: 'golden' },
  { h: 18.5, top: '#7b9ac6', hor: '#f4c59a', light: '#ffc590', li: 1.5, sky: '#c4bfd0', ground: '#8a6a50', hi: 0.92, glow: 0.14, stars: 0, bloom: 0.22, phase: 'golden' },
  { h: 19.2, top: '#5a63a6', hor: '#f0a080', light: '#ff9b6b', li: 1.05, sky: '#a294c4', ground: '#6a4a4e', hi: 0.82, glow: 0.45, stars: 0.08, bloom: 0.42, phase: 'sunset' },
  { h: 20.7, top: '#26305f', hor: '#6d4f82', light: '#b4a6ff', li: 0.7, sky: '#5c5a95', ground: '#2a2338', hi: 0.75, glow: 0.9, stars: 0.6, bloom: 0.48, phase: 'dusk' },
  { h: 22.0, top: '#0f1836', hor: '#28366a', light: '#9fb4ff', li: 0.55, sky: '#40528f', ground: '#1b1a2e', hi: 0.75, glow: 1, stars: 1, bloom: 0.5, phase: 'night' },
  { h: 24.0, top: '#0b1430', hor: '#24335f', light: '#9fb4ff', li: 0.55, sky: '#40528f', ground: '#1b1a2e', hi: 0.75, glow: 1, stars: 1, bloom: 0.5, phase: 'night' },
];
const COLS = ['top', 'hor', 'light', 'sky', 'ground'];
const NUMS = ['li', 'hi', 'glow', 'stars', 'bloom'];
const parsed = KEYS.map((k) => {
  const o = { ...k };
  for (const c of COLS) o[c] = new THREE.Color(k[c]);
  return o;
});

const out = {};
for (const c of COLS) out[c] = new THREE.Color();
out.sunDir = new THREE.Vector3();
out.moonDir = new THREE.Vector3();
out.lightDir = new THREE.Vector3();

const smooth = (t) => t * t * (3 - 2 * t);
const SUNRISE = 6.3, SUNSET = 19.6;

export function sampleTime(hour) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < parsed.length - 2 && parsed[i + 1].h <= h) i++;
  const a = parsed[i], b = parsed[i + 1];
  const t = smooth((h - a.h) / (b.h - a.h));
  for (const c of COLS) out[c].copy(a[c]).lerp(b[c], t);
  for (const n of NUMS) out[n] = a[n] + (b[n] - a[n]) * t;
  out.phase = t < 0.5 ? a.phase : b.phase;
  out.hour = h;

  // sun travels east -> west on a tilted arc; the moon is opposite
  const day = (h - SUNRISE) / (SUNSET - SUNRISE); // 0..1 during daytime
  const th = day * Math.PI;
  // rises at -x, sets at +x: the low evening sun comes from the camera side and lights the facades
  out.sunDir.set(-Math.cos(th) * 0.9, Math.sin(th), 0.55 + 0.2 * Math.sin(th)).normalize();
  const nh = ((h - SUNSET + 24) % 24) / (24 - (SUNSET - SUNRISE));
  const tm = nh * Math.PI;
  out.moonDir.set(Math.cos(tm) * 0.85, Math.sin(tm) * 0.9, 0.55).normalize();

  const sunUp = out.sunDir.y > -0.02;
  out.lightDir.copy(sunUp ? out.sunDir : out.moonDir);
  // keep shadows readable: never let the light skim the horizon
  if (out.lightDir.y < 0.28) {
    out.lightDir.y = 0.28;
    out.lightDir.normalize();
  }
  out.isDay = sunUp;
  return out;
}

export function realHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

// Art direction: no flat white midday light. During the day the world stays in its
// late-afternoon look (18:30: low warm sun, long shadows, the first windows lighting up);
// from 18:30 on it follows the real clock into sunset, dusk and night, then dawn.
export const DAY_LOOK = 18.5;
const DAY_START = 6.6;
export function lookHour(h) {
  const x = ((h % 24) + 24) % 24;
  return x >= DAY_START && x < DAY_LOOK ? DAY_LOOK : x;
}
