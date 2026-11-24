# Malo's little world

Personal site: a floating voxel world (pixel art in 3D) with a real-time day/night cycle.
Art direction lives in [DA.md](DA.md).

## Develop

```bash
npm install
npm run dev
```

Handy URL parameter: `?h=21.5` forces the time of day (here 21:30).
The site opens on the computer desktop; `#education` in the URL opens the island world directly.
In the console: `__jump(3)` jumps straight to a stop (0 = hero … 4 = outro), once in the island world.

## Structure

| Path | Role |
|---|---|
| `src/world/voxel.js` | voxel grid, mesher with ambient occlusion, glow + water materials |
| `src/world/builders.js` | island base, trees, lamps, fences, clouds… |
| `src/world/islands/*.js` | one file per island (home, saclay, ensae, oxford) |
| `src/world/timeOfDay.js` | the day/night palette |
| `src/world/world.js` | renderer, lights, post-processing, scroll-driven camera |
| `src/room/art.js`, `src/room/room2d.js` | the illustrated room (SVG layers) and its 2D view |
| `src/main.js` | UI: scroll, reveals, time control, language, hover |
| `src/i18n.js` | every FR / EN string |

## Deploy (GitHub Pages)

1. Create a GitHub repo (e.g. `Phimabri.github.io` for a root URL) and push this folder on `main`.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push.
