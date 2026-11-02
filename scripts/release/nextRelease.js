/**
 * Picks the version of the next release from the commits since the last `v*`
 * tag, and writes its release notes. It prints the version, or a message when
 * no commit changes the extension. In GitHub Actions it also sets the
 * `version` step output.
 *
 * Usage: node scripts/release/nextRelease.js <notes file>
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

import { latestVersionTag, mergedPullRequest, nextReleaseVersion, releaseNotes } from './releaseVersion.js';

/** @typedef {import('./releaseVersion.js').ReleaseCommit} ReleaseCommit */

const notesPath = process.argv[2];
if (notesPath === undefined) {
  process.stderr.write('Usage: node scripts/release/nextRelease.js <notes file>\n');
  process.exit(2);
}

/**
 * @param {string[]} args
 * @returns {string}
 */
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

/**
 * @param {string[]} args
 * @returns {{ hash: string, parents: string[], subject: string, body: string }[]}
 */
function log(args) {
  // Unit and record separators keep a commit body with blank lines in one piece.
  return git(['log', '--format=%h%x1f%p%x1f%s%x1f%b%x1e', ...args])
    .split('\x1e')
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const [hash = '', parents = '', subject = '', body = ''] = record.split('\x1f');
      return { hash, parents: parents.split(' ').filter((parent) => parent.length > 0), subject, body };
    });
}

const lastVersion = latestVersionTag(git(['tag', '--list', 'v*', '--merged', 'HEAD']).split(/\r?\n/));

// Each commit on the first-parent line of main is a pull request merge or a direct commit.
// A merge brings the commits between its first parent and its other parents.
/** @type {ReleaseCommit[]} */
const commits = [];
for (const entry of log(['--first-parent', lastVersion === null ? 'HEAD' : `v${lastVersion}..HEAD`])) {
  const [mainParent, ...mergedParents] = entry.parents;
  if (mainParent === undefined || mergedParents.length === 0) {
    commits.push({ subject: entry.subject, body: entry.body, hash: entry.hash });
    continue;
  }
  const merged = log(['--no-merges', ...mergedParents, `^${mainParent}`]);
  const number = mergedPullRequest(entry.subject);
  // GitHub writes the pull request title as the first line of the merge body.
  const firstBodyLine = entry.body.split(/\r?\n/)[0]?.trim() ?? '';
  const title = firstBodyLine === '' ? (merged.at(-1)?.subject ?? entry.subject) : firstBodyLine;
  for (const { subject, body, hash } of merged) {
    commits.push(number === null ? { subject, body, hash } : { subject, body, hash, pullRequest: { number, title } });
  }
}

const manifestVersion = /** @type {{ version: string }} */ (JSON.parse(readFileSync('manifest.json', 'utf8'))).version;
const version = nextReleaseVersion({ lastVersion, manifestVersion, commits });

writeFileSync(notesPath, releaseNotes(commits));
const outputPath = process.env['GITHUB_OUTPUT'];
if (outputPath !== undefined) appendFileSync(outputPath, `version=${version ?? ''}\n`);
process.stdout.write(
  version === null ? `No commit since v${lastVersion ?? '?'} changes the extension. Nothing to release.\n` : `${version}\n`,
);
