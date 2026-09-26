# tigOS

Chase Tiger Johnston's portfolio, built as a desktop: windows, a terminal, pets and an arcade.
Live at [www.chasetiger.com](https://www.chasetiger.com).

This repository is the build output, deployed by the `Deploy static content to Pages` workflow on
every push to `main`. The source, build script and test suite live in Chase's private `tigos/`
workspace; `python build.py` regenerates everything here except this README and `.github/`.
Please do not edit the generated files by hand.

Files
- `index.html`             the page shell (16 KB): head, markup, the two script/style links
- `tigos.css`              the stylesheet
- `tigos.js`               data, the Journey map, pets, the asset map and the app (live wallpaper, screensavers, easter eggs included)
- `assets/games-<hash>.js` the arcade registry and the 11 canvas games; fetched after boot, so the desktop never waits for it. Nightshift, Rounds, Tanks and Ghost Run ship as their own bundles (`assets/nightshift-<hash>.js`, `assets/rounds-<hash>.js`, `assets/tanks-<hash>.js`, `assets/ghostrun-<hash>.js`) fetched on first launch; the three Three.js games also pull `assets/three-<hash>.js` and stream their Blender `.glb` models (five for Nightshift, one each for Tanks and Ghost Run)
- `assets/`                images, the resume, the game bundles, the Three.js bundle and the models, content-hashed file names
- `manifest.webmanifest`   installable app metadata (standalone display, icons)
- `apple-touch-icon.png`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `icon-1024.png`
- `404.html`               sends unknown paths back to the desktop
- `CNAME`                  www.chasetiger.com
- `.nojekyll`              serve the folder as is
