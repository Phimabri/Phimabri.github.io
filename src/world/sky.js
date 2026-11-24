// Gradient sky dome with a pixel sun, a pixel moon, twinkling stars and shooting stars.
import * as THREE from 'three';

export function createSky() {
  const uniforms = {
    uTop: { value: new THREE.Color() },
    uHor: { value: new THREE.Color() },
    uSun: { value: new THREE.Vector3(0, 1, 0) },
    uMoon: { value: new THREE.Vector3(0, -1, 0) },
    uSunCol: { value: new THREE.Color() },
    uStars: { value: 0 },
    uTime: { value: 0 },
    uResY: { value: 800 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHor, uSunCol, uSun, uMoon;
      uniform float uStars, uTime, uResY;
      varying vec3 vDir;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        // gradient with a soft band near the horizon, and a slightly darker underside
        // mostly a screen-space backdrop (always shows the full gradient), nudged by view direction
        float sy = gl_FragCoord.y / uResY;
        float t = clamp(sy * 0.85 + y * 0.6 + 0.08, 0.0, 1.0);
        vec3 col = mix(uHor, uTop, smoothstep(0.18, 1.0, t));

        // sun: disc + warm halo
        float s = dot(d, normalize(uSun));
        col += uSunCol * pow(max(s, 0.0), 24.0) * 0.35;
        col = mix(col, vec3(1.0, 0.97, 0.88), smoothstep(0.9988, 0.9992, s));

        // moon: disc with a little crater
        float m = dot(d, normalize(uMoon));
        float disc = smoothstep(0.9990, 0.9993, m);
        col += vec3(0.6, 0.68, 0.9) * pow(max(m, 0.0), 60.0) * 0.18 * uStars;
        col = mix(col, vec3(0.93, 0.94, 1.0), disc * uStars);

        // stars on a coarse grid -> they render as crisp pixels
        vec2 sp = vec2(atan(d.z, d.x), asin(clamp(y, -1.0, 1.0)));
        vec2 cell = floor(sp * vec2(110.0, 110.0));
        float r = h21(cell);
        float tw = 0.55 + 0.45 * sin(uTime * (1.0 + r * 3.0) + r * 40.0);
        float star = step(0.9935, r) * tw * smoothstep(0.02, 0.3, y);
        col += vec3(1.0, 0.96, 0.86) * star * uStars;

        // occasional shooting star
        float period = 9.0;
        float k = floor(uTime / period);
        float ph = fract(uTime / period);
        vec2 start = vec2(h21(vec2(k, 1.0)) * 6.28 - 3.14, 0.35 + h21(vec2(k, 2.0)) * 0.6);
        vec2 dir = normalize(vec2(-1.0, -0.45));
        vec2 head = start + dir * ph * 1.1;
        vec2 rel = sp - head;
        float along = dot(rel, -dir);
        float across = abs(dot(rel, vec2(-dir.y, dir.x)));
        float trail = step(0.0, along) * (1.0 - smoothstep(0.0, 0.18, along)) * (1.0 - smoothstep(0.0, 0.006, across));
        col += vec3(1.0, 0.95, 0.85) * trail * step(ph, 0.25) * uStars * 1.2;

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}
