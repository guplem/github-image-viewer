/**
 * The release workflow publishes a release after each change to `main`. The
 * conventional-commit types since the last release decide its version, so no
 * person picks a number. Pure logic: no git and no file access, so Node tests
 * it directly.
 */

/**
 * @typedef {object} ReleaseCommit
 * @property {string} subject
 * @property {string} body
 * @property {string} [hash] The short commit hash. GitHub links it in a release body.
 * @property {{ number: number, title: string }} [pullRequest] The pull request that merged this commit, if any.
 */

/** @typedef {'breaking' | 'feature' | 'fix'} ReleaseChange How much a commit changes the extension. */

const FEATURE_TYPES = new Set(['feat']);
const SILENT_TYPES = new Set(['docs', 'test', 'chore', 'ci', 'style']);
const CONVENTIONAL_SUBJECT = /^(\w+)(?:\([^)]*\))?(!)?: \S/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE: /m;
const VERSION_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const PULL_REQUEST_MERGE = /^Merge pull request #(\d+) from /;

/**
 * @param {ReleaseCommit} commit
 * @returns {ReleaseChange | null} `null` for a commit that changes nothing in the extension.
 */
export function commitChange(commit) {
  const match = CONVENTIONAL_SUBJECT.exec(commit.subject);
  if (match?.[2] === '!' || BREAKING_FOOTER.test(commit.body)) return 'breaking';
  const type = match?.[1];
  if (type !== undefined && FEATURE_TYPES.has(type)) return 'feature';
  if (type !== undefined && SILENT_TYPES.has(type)) return null;
  // An unknown subject, or a `git revert`, reached `main`. A release is safer than a lost change.
  return 'fix';
}

/**
 * @param {string} subject
 * @returns {number | null} The number of the pull request that a GitHub merge commit merges.
 */
export function mergedPullRequest(subject) {
  const number = PULL_REQUEST_MERGE.exec(subject)?.[1];
  return number === undefined ? null : Number(number);
}

/**
 * @param {string} candidate Such as `0.10.0`.
 * @param {string} reference
 * @returns {boolean} `true` when `candidate` is a higher version than `reference`.
 */
export function isNewerVersion(candidate, reference) {
  const a = candidate.split('.').map(Number);
  const b = reference.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

/**
 * @param {readonly string[]} tags
 * @returns {string | null} The highest `vX.Y.Z` tag without its `v`, or `null` when there is none.
 */
export function latestVersionTag(tags) {
  /** @type {string | null} */
  let latest = null;
  for (const tag of tags) {
    if (!VERSION_TAG.test(tag)) continue;
    const version = tag.slice(1);
    if (latest === null || isNewerVersion(version, latest)) latest = version;
  }
  return latest;
}

/**
 * @param {{ lastVersion: string | null, manifestVersion: string, commits: readonly ReleaseCommit[] }} inputs
 *   `lastVersion` is `null` before the first release. `manifestVersion` is the first release, or a step that a person sets by hand.
 * @returns {string | null} The next version, or `null` when nothing since the last release changes the extension.
 */
export function nextReleaseVersion({ lastVersion, manifestVersion, commits }) {
  if (lastVersion === null || isNewerVersion(manifestVersion, lastVersion)) return manifestVersion;
  const changes = commits.map(commitChange);
  const [major = 0, minor = 0, patch = 0] = lastVersion.split('.').map(Number);
  if (changes.includes('breaking')) return `${major + 1}.0.0`;
  if (changes.includes('feature')) return `${major}.${minor + 1}.0`;
  if (changes.includes('fix')) return `${major}.${minor}.${patch + 1}`;
  return null;
}

/** @type {readonly { change: ReleaseChange, title: string }[]} */
const NOTE_SECTIONS = [
  { change: 'breaking', title: 'Breaking changes' },
  { change: 'feature', title: 'New features' },
  { change: 'fix', title: 'Fixes and other changes' },
];

/** @type {Readonly<Record<ReleaseChange, number>>} */
const CHANGE_RANK = { fix: 0, feature: 1, breaking: 2 };

/**
 * Lists each pull request that changes the extension under its largest change,
 * then each such commit in a collapsed block.
 * @param {readonly ReleaseCommit[]} commits
 * @returns {string} Markdown for the release body.
 */
export function releaseNotes(commits) {
  const changed = commits.flatMap((commit) => {
    const change = commitChange(commit);
    return change === null ? [] : [{ commit, change }];
  });
  if (changed.length === 0) return 'No change to the extension.\n';

  /** @type {{ text: string, change: ReleaseChange }[]} */
  const entries = [];
  /** @type {Map<number, { text: string, change: ReleaseChange }>} */
  const byPullRequest = new Map();
  for (const { commit, change } of changed) {
    const pullRequest = commit.pullRequest;
    if (pullRequest === undefined) {
      entries.push({ text: commit.subject, change });
      continue;
    }
    const entry = byPullRequest.get(pullRequest.number);
    if (entry === undefined) {
      const created = { text: `${pullRequest.title} (#${pullRequest.number})`, change };
      byPullRequest.set(pullRequest.number, created);
      entries.push(created);
    } else if (CHANGE_RANK[change] > CHANGE_RANK[entry.change]) {
      entry.change = change;
    }
  }

  /** @type {string[]} */
  const parts = [];
  for (const { change, title } of NOTE_SECTIONS) {
    const lines = entries.filter((entry) => entry.change === change).map((entry) => `- ${entry.text}`);
    if (lines.length > 0) parts.push(`## ${title}\n\n${lines.join('\n')}\n`);
  }
  const commitLines = changed.map(({ commit }) =>
    commit.hash === undefined ? `- ${commit.subject}` : `- ${commit.subject} (${commit.hash})`,
  );
  parts.push(`<details>\n<summary>Commits</summary>\n\n${commitLines.join('\n')}\n\n</details>\n`);
  return parts.join('\n');
}
