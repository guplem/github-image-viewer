# Publish a GitHub release after each merge to `main`, and let the commit prefixes pick the version

## Context

The Chrome Web Store needs a zip with a higher `version` in `manifest.json` for each update. The build script `scripts/packageExtension.ps1` runs on Windows only, and a person had to raise the version by hand. The sister project Eva already publishes its releases from CI, with the version taken from the commit prefixes.

## Decision

**Copy the release flow of Eva.**

- `.github/workflows/release.yml` runs when the "Pull request checks" workflow completes on a push to `main`. It releases only the tip of `main`, and only when its checks passed.
- `scripts/release/nextRelease.js` reads the commits since the highest `vX.Y.Z` tag. `scripts/release/releaseVersion.js` turns them into the next version and the release notes. It is pure logic with unit tests.
- The prefixes pick the version: `!` or a `BREAKING CHANGE:` footer raises the first number, `feat` the middle one, and every other type the last one. `docs`, `test`, `chore`, `ci`, and `style` make no release.
- A `manifest.json` version above the last tag wins. That is how a person sets a number by hand, and how the first release takes `0.2.0`.
- The workflow writes the new version into the `manifest.json` of the zip only. `main` keeps its own number.
- The workflow builds the zip with `zip` on Linux, from the same files as `packageExtension.ps1`: `manifest.json`, `src`, and `icons`. It publishes the zip in a GitHub release tagged `v<version>`.
- The upload to the Chrome Web Store stays manual.

**A person's login merges every pull request.** GitHub starts no workflow for a push made with the `GITHUB_TOKEN`. A merge by a workflow token therefore runs no checks on `main` and makes no release. The agent turns on auto-merge with the user's login (`gh pr merge --auto --merge`), as Eva does.

**Rejected alternative:** an `auto-merge.yml` workflow that turns on auto-merge with the `GITHUB_TOKEN`. It merged pull request 1 with no push run on `main`, so no release could follow.

## Consequences

**Positive:**

- Each merge that changes the extension gives a ready zip with a higher version. No person picks a number, and no Windows machine is needed.
- The release notes list the pull requests under "Breaking changes", "New features", and "Fixes and other changes".

**Trade-offs and follow-up:**

- A wrong commit prefix gives a wrong version. The `write-commit` skill and the review keep the prefixes right.
- `manifest.json` on `main` can show an older number than the latest release.
- Without the "Requirements for merge" ruleset, auto-merge merges at once, before the checks finish. A failed check on `main` then stops only the release.
