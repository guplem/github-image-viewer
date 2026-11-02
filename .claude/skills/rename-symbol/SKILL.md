---
name: rename-symbol
description: Rename or refactor a symbol safely by searching every naming-case variant across code, tests, docs, configs, and JSON. Use when renaming any identifier so no reference is missed.
---

# Rename a symbol safely

When you rename or refactor any symbol, search **all** naming variants (camelCase, PascalCase, snake_case, kebab-case, UPPER_CASE) across the whole project (code, tests, docs, configs, and JSON), not just the obvious code references. A missed variant in a config key or a data file is the usual cause of a rename that compiles fine but breaks at runtime.

Extra traps in this repo:

- **GitHub's names are not ours.** `.markdown-body`, `animated-image`, `.AnimatedImagePlayer-controls`, `img.emoji`, `img.avatar`, and the `turbo:visit` event name GitHub's own markup and events, in `commentImages.js` and `contentEntry.js`. Never rename them as part of a refactor. They change only when GitHub changes.
- **File paths are named in more than one place.** `manifest.json` names `src/bootstrap/contentBootstrap.js`, the icons, and `src/*` in `web_accessible_resources`; `contentBootstrap.js` names `src/contentEntry.js`; `contentEntry.js` names `src/viewer/imageViewer.css`; `scripts/packageExtension.ps1` and `.github/workflows/release.yml` name the shipped folders; `jsconfig.json` names the checked folders. Search all six after you move a file. A wrong path fails only in Chrome, never in the type check.
- **The host id `github-image-viewer-host` is on the page.** A user style or a test can select it. Keep it stable.
