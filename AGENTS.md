# GitHub Image Viewer

A Manifest V3 Chrome extension for GitHub pull requests and issues. A click on an image in a comment or description opens it in a floating viewer on top of the page, and the browser does not navigate away. The viewer holds only the images of that one comment. The arrow keys and on-screen arrows move between them; `Esc`, a close button, or a click outside the image closes it. There is no build step and no server, so the repository folder is the folder Chrome loads. Install, use, publishing, and troubleshooting details: `README.md`.

The extension **asks for no permission** and runs on `github.com` only. It reads the page only when the user clicks an image, and it shows the image address that GitHub already loaded. Keep it that way: it is why the store listing can promise that no data leaves the browser.

Delegate to these agents at the right moment (each agent's own description says what it does). They fall into two groups, by when they run.

**Before you implement (explore agents, launched as preparation):**

- **pattern-scout**: before implementing any non-trivial module or feature, and any time you ask "how do we do X here?". Returns real code examples with the rules distilled from them.
- **adr-checker** (consult mode): before implementing in an ADR-relevant area (the "Architecture Decision Records (ADRs)" section lists them). Returns the decisions the work must follow.

**After you implement, before you ship:**

- **docs-checker**: after a change that could affect documented content. Checks every documentation location (code comments, `README.md`, `AGENTS.md`, ADRs, and `store/listing.md`) against the code and fixes drift.
- **validate**: just before you create a PR or push. Runs the repo's checks the way CI does (format, types, tests) and reports pass or fail.
- **adr-checker** (maintain mode): after you introduce a new architectural pattern or change one an ADR records. Creates or updates the ADR.

Beyond these, spawn subagents freely: hand off research, code exploration, and parallel analysis so the files they read stay out of your own context. Give each subagent one task.

## Writing style

The people who read your output may read English as a second language and may be new to the area. Two layers apply. This section is the one home for both: no other file restates them.

**Layer 1 covers every piece of prose you write**: chat replies, PR and issue text, review comments, commit messages, and every document below. It follows Zinsser's four principles, which are simplicity, brevity, clarity, and humanity.

- **Short sentences, one idea each.** Use common words. Avoid idioms, slang, and cultural references.
- **Lead with the answer**, then only the detail that changes what the reader does. Cut filler and hedging. Do not use em dashes.
- **Assume a short attention span.** The reader usually skims to make a quick decision (which PR to review, which issue to pick), with little context and little time; put the single most important thing first, and make each part land even if they stop after the first line.
- **Gloss each jargon term, acronym, or tool/library name on first use** in one short clause, or pick a simpler word.
- **Explain a concept briefly before going deeper.** Do not assume a flow, tool, or pattern is already known.
- **Assume junior-level knowledge of the area.** Name the things you reference (files, commands, terms) instead of assuming the reader can guess.

**Layer 2 adds ASD-STE100 on top, for technical documents only**: `AGENTS.md`, ADRs, `README.md`, skills, subagents, and code comments. ASD-STE100 (Simplified Technical English) is a controlled-English standard from the aerospace industry. A maintenance manual must carry one reading and one only, and these documents have the same job.

- **Active voice only.** Name the actor: "the hook formats the file", not "the file gets formatted".
- **One meaning per word, and the same word for the same thing every time.** Never swap in a synonym for variety.
- **One instruction per sentence, and start the sentence with the verb.** Write "Run the migration", not "The migration should be run".
- **No `-ing` verb form as a noun or as a sentence opener.** Write "Use the skill to create a branch", not "Creating a branch is done with the skill".
- **About 20 words per sentence at most** (25 in descriptive text).
- **Leave out no word that guards the meaning.** Write "the file that you changed" when "the file you changed" could be misread.

Both layers cover prose only. Neither covers code identifiers or text you quote word for word.

## Commands

| Task                                   | Command                                                                  | Notes                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Install dependencies and the git hooks | `npm install`                                                            | The `prepare` script runs `lefthook install`. Run this once per clone.                         |
| Run every check, the way CI runs it    | `npm run check`                                                          | Format check, then type check, then tests. This is the umbrella script that CI calls.          |
| Format the whole repo                  | `npm run format`                                                         | Prettier.                                                                                      |
| Check the format only                  | `npm run format:check`                                                   | Fix a failure with `npm run format`.                                                           |
| Type check                             | `npm run typecheck`                                                      | `tsc --noEmit` over the JSDoc types. Success prints nothing.                                   |
| Run the tests                          | `npm test`                                                               | `node --test`. It finds `test/*.test.js` on its own.                                           |
| Build the Web Store zip                | `powershell -ExecutionPolicy Bypass -File scripts/packageExtension.ps1`  | Windows only. Writes `dist/github-image-viewer-<version>.zip` with only the files Chrome uses. |
| Render the Web Store images            | `powershell -ExecutionPolicy Bypass -File scripts/renderStoreImages.ps1` | Windows only, needs Google Chrome. Renders `store/graphics/*.html` to `store/images/`.         |
| Redraw the icons                       | `powershell -ExecutionPolicy Bypass -File scripts/makeIcons.ps1`         | Windows only. Run it only when the artwork changes.                                            |

There is no build and no code generation. To try the extension, load the repository folder unpacked in Chrome (`README.md` has the steps).

Whenever you need to confirm the code still passes, delegate to the **validate** agent (it runs the sequence above the way CI does).

## Architecture

The extension is one content script in the isolated world of every `github.com` page. There is no service worker, no toolbar page, and no options page.

### How one click becomes a viewer, end to end

1. Chrome runs `contentBootstrap.js` on every GitHub page. It imports `contentEntry.js` as a module.
2. `start` reads `imageViewer.css` into a `CSSStyleSheet`, builds the viewer with `createImageViewer`, and adds one click listener on `window`, in the capture phase.
3. The user clicks. The listener returns at once unless the click is a plain left click on a pull request or issue page (`isConversationPath`).
4. `findClickedImage` maps the click to an image. `isViewerImage` rejects an emoji, an avatar, and an image inside a link to another page (`isImageLink`).
5. `findCommentBody` finds the outermost `.markdown-body` around the image. `collectCommentImages` lists that comment's images, one per GIF player.
6. The listener stops the click, and `viewer.open` shows the clicked image with its position, alt text, size, format, and file name (`imageDetails.js`).

`popstate` and `turbo:visit` close the viewer, so it never stays open over a new page.

### File map

| File                                | Holds                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/bootstrap/contentBootstrap.js` | The classic script in the manifest. Imports `contentEntry.js`, nothing else.                            |
| `src/contentEntry.js`               | Wiring only. The click listener, the stylesheet load, and the close on page change.                     |
| `src/github/githubPages.js`         | Which paths are conversations, and which links only open an image. **All address knowledge here.**      |
| `src/github/commentImages.js`       | Which images belong to one comment. **The only file that knows GitHub's markup.**                       |
| `src/viewer/imageDetails.js`        | Position, wrap-around step, pixel size, file name, and format. Pure logic.                              |
| `src/viewer/imageZoom.js`           | Zoom at the cursor, free pan, wheel step, double-click toggle, and zoom text. Pure logic.               |
| `src/viewer/imageViewer.js`         | The viewer in its shadow root: buttons, keys, focus, scroll lock, wheel zoom, and drag.                 |
| `src/viewer/imageViewer.css`        | The viewer styles. Always dark, in both GitHub themes.                                                  |
| `store/listing.md`                  | Every text of the Chrome Web Store listing, field by field.                                             |
| `store/graphics/`, `store/images/`  | The store images: HTML sources, the demo pull request with its images, and the rendered PNGs to upload. |

## Rules

- **Ask for no permission.** The manifest has no `permissions` and no `host_permissions`. The one content script matches `https://github.com/*`. A feature that needs more changes `adr/0002-one-click-listener-on-every-github-page.md` first, and updates the privacy texts.
- **Read the page at click time, never at load time.** No `MutationObserver` and no scan on page load. That is what makes late comments and GitHub page changes work with no extra code. See `adr/0002-one-click-listener-on-every-github-page.md`.
- **Leave a click alone unless it is a plain left click on an image the viewer can show.** A modifier key, a middle button, or a link to another page means the user wants the normal link.
- **Keep GitHub's markup names in `commentImages.js`, and address rules in `githubPages.js`.** When GitHub changes its markup, one file changes.
- **Put page text into the viewer with `textContent` and attributes only.** Anyone can write a comment. Never use `innerHTML`.
- **Keep `chrome.*` and the DOM out of `githubPages.js`, `imageDetails.js`, and `imageZoom.js`.** `contentEntry.js` and `contentBootstrap.js` are the only files that call `chrome.*`.
- **Keep the viewer inside its shadow root on `<html>`.** See `adr/0004-viewer-in-a-shadow-root.md`.
- **Keep the store listing true.** `store/listing.md` and the store images state facts about the code: the site, the absence of permissions, the keys, and the zip size ("23 KB"). Update them in the same change as the code. Re-render the images with `renderStoreImages.ps1`. A false claim can get the extension rejected at review.

## Gotchas

- **Chrome injects a content script only on a full page load.** GitHub opens most pull requests without one. That is why the script matches every GitHub page and checks the path on each click.
- **GitHub nests one `.markdown-body` in another** on the new issue pages. `findCommentBody` takes the outermost one; the inner one can miss part of the comment.
- **A GIF holds two copies of the image.** GitHub's `<animated-image>` player keeps the original image and a replaced copy, and shows one of them. `collectCommentImages` counts the first copy once per player, and `findClickedImage` maps a click on either copy to it. Its play and pause controls keep their clicks.
- **`currentSrc` is empty until a lazy image starts to load.** `imageAddress` falls back to `src`.
- **An uploaded image keeps no original file name.** GitHub serves it as `<number>-<uuid>.png` from `private-user-images.githubusercontent.com`, with a short-lived token in the query. The viewer shows that name. A camo proxy address carries the original address in hex, and `describeImageFile` decodes it.
- **A drag that ends outside the image fires a `click` on the dark area**, which closes the viewer. `imageViewer.js` sets `dragMoved` and skips that one click.
- **A failed image reports a natural size of zero.** `formatPixelSize` returns `null` for it, and the facts line drops the size.
- **An image cannot take the focus.** On close, the viewer focuses the link around the clicked image instead.
- **Playwright and Puppeteer load no extension in the default headless shell.** For a local browser run, use the full Chromium (`channel: 'chromium'`), drop the `--disable-extensions` default argument, and pass `--load-extension`. Chrome also refuses an unpacked folder whose icon files are missing.
- **Windows PowerShell 5.1 `Compress-Archive` writes `\` into zip entry names.** The Web Store cannot read such a zip, so `packageExtension.ps1` writes each entry by hand with `/`.
- **`node --test test/` fails on Node 24.** It treats the folder as a module. Run bare `node --test`, which is what `npm test` does.
- **Prettier uses `endOfLine: "auto"` on purpose.** A Windows checkout with `core.autocrlf=true` holds CRLF line endings. A pinned `endOfLine: "lf"` would fail the format check on every file while the content is correct.

## Test-Driven Development (mandatory)

Develop new behavior **test-first, red-green**: write a failing test that pins the behavior you want (**red**), make it pass with the smallest change (**green**), then clean up with the test as your safety net. A bug fix starts with a test that reproduces the bug.

What is testable here, and what is not:

- **Testable, and always test-first:** which paths are conversations and which links are image links (`githubPages.js`), every text the viewer shows about an image (`imageDetails.js`), and every zoom and pan step (`imageZoom.js`).
- **Exempt, because a unit test would only restate the code:** `contentBootstrap.js`, `contentEntry.js`, `commentImages.js`, and `imageViewer.js`. Keep these thin: an adapter reads the page, calls a pure function, and draws the result.
- **The safety net for the exempt parts** is the type check (`npm run typecheck` reads every file) plus one manual run in Chrome. `adr/0005-testing-strategy.md` records this split and the steps of the manual run.

When a bug appears in an exempt file, do not test the adapter. Move the decision that failed into a pure function, and test that.

The gate: CI runs the checks on every PR and on every push to `main`.

## Git Workflow

- Branch from `main`, PR back to `main`. Whenever you create a branch, use the `create-branch` skill.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Whenever you commit, use the `write-commit` skill.
- CI runs the repo's checks (the Commands table) on every PR and on every push to `main`.
- **The merge gate is not set up yet.** The sister extensions use a ruleset "Requirements for merge" that requires the `checks` check, plus "Allow auto-merge" in the repository settings. This repo has neither yet, so `.github/workflows/auto-merge.yml` fails until "Allow auto-merge" is on. Once both exist, PRs merge automatically on a green `checks` check: there is no human review gate, the tests are the review, which is what makes the TDD protocol non-negotiable.
- Three layers enforce quality, and they overlap on purpose: the Claude Code hooks in `.claude/settings.json` run while you edit, the lefthook `pre-commit` hook runs the format and type checks when anyone commits, and CI runs the same checks on GitHub.

## Documentation Organization

Each kind of knowledge has one home. Write a change in the home that matches it; never duplicate the same content across homes. What decides the home is **when the file loads** and **how deep it goes**, not its subject.

| Home                             | Loaded                           | Holds                                                                                                                                                                        |
| -------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                      | Every session                    | The map: architecture facts, conventions, gotchas, and the ADR index. Points to the homes below; does not repeat their depth. (`CLAUDE.md` is a one-line `@AGENTS.md` shim.) |
| `.claude/skills/<name>/SKILL.md` | On demand, when the task matches | One procedure: how to do X.                                                                                                                                                  |
| `adr/NNNN-*.md`                  | On demand, via adr-checker       | One architectural decision and its why.                                                                                                                                      |
| `README.md`                      | Read by humans                   | What the project is, install, use, publish, privacy, troubleshooting.                                                                                                        |

**All of these files are living: keep them true.** When you learn something that helps future agents, update the right file in the same session. When a file holds wrong or outdated information, fix it or remove it. This covers code comments too. After implementation, the **docs-checker** agent catches drift you missed.

**Rules:**

- ADRs are agent-only: never reference or list them in `README.md`.
- Number ADRs in sequence (`NNNN-kebab-title.md`) and never renumber an existing file. Index each one as a one-line row in the ADR table below, never a summary.
- Do not duplicate content between `README.md` and `AGENTS.md`; reference it instead.
- `CLAUDE.md` is a one-line `@AGENTS.md` shim; edit `AGENTS.md` instead.

## Architecture Decision Records (ADRs)

ADRs live in `adr/`. Each records one architectural decision or cross-cutting standard and why. **One ADR per pattern, kept alive:** when a pattern changes, update its ADR in place; create a new ADR only for a genuinely new pattern. Most changes need no ADR. Conventions: `adr/AGENTS.md` (auto-loads through its `adr/CLAUDE.md` shim when you work in `adr/`).

**Before implementing** in an area that may carry a decision, delegate to the **adr-checker** agent in consult mode. These areas usually carry decisions: the manifest, the permissions, and where the content script runs; how a click is caught and when the page is read; the viewer host, its shadow root, and its stylesheet; the testing strategy and the exempt files; the toolchain, the type system, and the absence of a build step.

**After implementing**, delegate to the **adr-checker** agent in maintain mode only if you introduced a new architectural pattern or changed one an ADR already records.

| ADR                                               | Topic                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `0001-agent-docs-structure.md`                    | `AGENTS.md` map + Claude-Code-only skills, subagents, and settings                                       |
| `0002-one-click-listener-on-every-github-page.md` | One content script on all of `github.com`; one capture-phase click listener reads the page at click time |
| `0003-plain-javascript-with-jsdoc-types.md`       | JSDoc types checked by `tsc`, a classic bootstrap that imports ES modules, no build step                 |
| `0004-viewer-in-a-shadow-root.md`                 | The viewer in an open shadow root on `<html>`, with its stylesheet read from the package                 |
| `0005-testing-strategy.md`                        | Address and text logic is test-first; DOM files are exempt and covered by types and a manual run         |

## GitHub issues, PRs, and other artifacts

- **Always self-assign PRs** when you create them.
- **Always link PRs to issues** with `Closes #N` in the PR body, so the issue auto-closes on merge.
- **Always add the `waiting-for-human-check` label** when you create a GitHub issue, PR, or any other reviewable artifact. It means no human has verified the content yet; a human removes it after reviewing. The label marks state (unreviewed), not origin. The label does **not** block a merge.

If the repo has no `waiting-for-human-check` label, create it first:

```bash
gh label create "waiting-for-human-check" --description "No human has verified this yet -- direct AI output" --color "D93F0B"
```

Whenever you create a GitHub issue, use the `create-issue` skill. Whenever you implement one, use the `implement-issue` skill. Whenever you review a PR, use the `review-pr` skill (optional here, because no human review gate exists).

## Coding standards

- **Match existing patterns.** Before you write code, find similar implementations and follow their style, structure, and conventions (the **pattern-scout** agent does this).
- **Explicit type annotations** are mandatory for all parameters, return types, and non-trivial variables. This repo writes them as JSDoc comments, and `npm run typecheck` enforces them under `strict`.
- **Comment the _why_, never the _what_.** A comment must carry what the code cannot: a non-obvious constraint, an intentional divergence, a trap a future reader would reintroduce. Do not document self-explanatory names or signatures, and match the comment density of the surrounding file.

## Refactoring safety

Whenever you rename or refactor a symbol, use the `rename-symbol` skill.

## Debugging

Whenever a fix attempt fails or a bug needs root-causing, use the `debug` skill.

## Writing prompts for agents and rules

Whenever you author or edit an AI-facing file (`AGENTS.md`, skills under `.claude/skills/`, subagents under `.claude/agents/`, prompts for agents you spawn), use the `write-ai-instructions` skill.

## Self-updating rules

These instruction files are living, and keeping them current is part of the work. Persist a rule right away (in the narrowest scope that fits) instead of applying it only this session when you discover something **extremely hard to find, deeply non-obvious, and time-saving for future sessions**, hit a pattern that **diverges from what an AI would write by default**, when the user says **"every time" / "always" / "never"**, or when **feedback on your own work reveals a standard you should have followed** (a PR review comment, a user correction). Persist it in these shared, committed files, never in personal memory or the global config, so the whole team gets the lesson. For where to write it, use the `write-ai-instructions` skill.
