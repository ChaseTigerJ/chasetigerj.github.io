# tigOS

Chase Tiger Johnston's portfolio, built as a desktop: windows, a terminal, pets and an arcade.
Live at chasetiger.com.

This repository is the deployable output only. `index.html` is a single self-contained page
(every image, font and the resume are inline; the one optional network call is the weather).
The source, build script and test suite live in the private `tigos/` workspace; the folder is
regenerated with `python build.py` and copied here. Please do not edit `index.html` by hand.

Files
- `index.html`             the site
- `404.html`               sends unknown paths back to the desktop
- `manifest.webmanifest`   installable app metadata (standalone display, icons)
- `apple-touch-icon.png`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `icon-1024.png`
- `.nojekyll`              tells GitHub Pages to serve the folder as is
