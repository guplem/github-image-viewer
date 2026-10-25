# Plain JavaScript with JSDoc types, checked by tsc, and no build step

## Context

The user's standard requires explicit types on every parameter, return type, and non-trivial variable. TypeScript is the obvious way to get them, but it needs a compiler, so the folder a developer edits stops being the folder Chrome loads.

The development loop for this extension is: edit a file, press the reload arrow on the extension card, reload the GitHub tab, click an image. A build step adds a watcher that must be running and correct, and it puts the shipped code one transformation away from the code under the cursor.

A content script listed in the manifest cannot be an ES module. Without a bundler, the code still needs `import` to stay split into testable files.

## Decision

Write plain JavaScript with JSDoc type comments. Check them with the TypeScript compiler in no-emit mode: `tsc --noEmit -p jsconfig.json`, with `checkJs`, `strict`, and `noUncheckedIndexedAccess` on. TypeScript is a development dependency and a checker only; it never produces output.

The repository root is the extension folder. `manifest.json`, `src/`, and `icons/` sit next to `package.json`, `test/`, and `node_modules/`. Chrome ignores the files it does not reference.

The manifest content script is `src/bootstrap/contentBootstrap.js`, a classic script with one job: `import(chrome.runtime.getURL('src/contentEntry.js'))`. Every other file in `src/` is a real ES module. `web_accessible_resources` lists `src/*` for `https://github.com/*`, because Chrome loads a module from the extension only when the page may reach it.

Use a `/** @type {X} */ (value)` cast only at a real boundary, such as a DOM lookup or a test fake. A cast inside logic is a sign the types are wrong.

**Rejected alternative:** TypeScript with a bundler (esbuild or Vite). It gives nicer syntax for the same guarantees, but it puts a build between the editor and Chrome for a project that has no dependencies to bundle and no syntax to downlevel.

## Consequences

**Positive:**

- Load unpacked, edit, reload. Nothing sits between the source and the browser.
- `npm ci --ignore-scripts` plus `npm run check` is the whole CI job, and the same command runs locally.
- The type check reads every file, including the DOM files that carry no unit tests.

**Trade-offs and follow-up:**

- The GitHub page can fetch any file under `src/` from the extension, because `web_accessible_resources` must list it. Nothing secret lives there.
- `node_modules/` sits inside the folder Chrome loads. Chrome ignores it because nothing references it. `scripts/packageExtension.ps1` ships only `manifest.json`, `src/`, and `icons/`.
- If the project ever gains a runtime dependency from npm, revisit this decision, because a content script cannot resolve a bare module specifier.
