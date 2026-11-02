import test from 'node:test';
import assert from 'node:assert/strict';

import {
  commitChange,
  isNewerVersion,
  latestVersionTag,
  mergedPullRequest,
  nextReleaseVersion,
  releaseNotes,
} from '../scripts/release/releaseVersion.js';

test('the commit type decides the change', () => {
  assert.equal(commitChange({ subject: 'feat: zoom the image', body: '' }), 'feature');
  assert.equal(commitChange({ subject: 'fix: keep the focus', body: '' }), 'fix');
  assert.equal(commitChange({ subject: 'refactor(viewer): split the file', body: '' }), 'fix');
  assert.equal(commitChange({ subject: 'docs: describe the zoom', body: '' }), null);
  assert.equal(commitChange({ subject: 'chore: raise the version', body: '' }), null);
  assert.equal(commitChange({ subject: 'test: pin the step', body: '' }), null);
});

test('a bang or a BREAKING CHANGE footer marks a break', () => {
  assert.equal(commitChange({ subject: 'feat!: drop the old keys', body: '' }), 'breaking');
  assert.equal(commitChange({ subject: 'fix: rename', body: 'Text.\n\nBREAKING CHANGE: new name' }), 'breaking');
});

test('an unknown subject counts as a fix, so that no change gets lost', () => {
  assert.equal(commitChange({ subject: 'Update imageViewer.js', body: '' }), 'fix');
  assert.equal(commitChange({ subject: 'Revert "feat: zoom"', body: '' }), 'fix');
});

test('the latest tag is the highest version tag', () => {
  assert.equal(latestVersionTag(['v0.2.0', 'v0.10.0', 'v0.9.1', 'other', '']), '0.10.0');
  assert.equal(latestVersionTag([]), null);
});

test('versions compare by number, not by text', () => {
  assert.equal(isNewerVersion('0.10.0', '0.9.0'), true);
  assert.equal(isNewerVersion('1.0.0', '1.0.0'), false);
  assert.equal(isNewerVersion('0.2.0', '0.2.1'), false);
});

test('the first release takes the manifest version', () => {
  assert.equal(nextReleaseVersion({ lastVersion: null, manifestVersion: '0.2.0', commits: [] }), '0.2.0');
});

test('a manifest version above the last release wins, so a person can set the next number', () => {
  const commits = [{ subject: 'fix: a', body: '' }];
  assert.equal(nextReleaseVersion({ lastVersion: '0.2.0', manifestVersion: '1.0.0', commits }), '1.0.0');
});

test('the largest change since the last release raises the version', () => {
  /** @param {string[]} subjects */
  const next = (subjects) =>
    nextReleaseVersion({
      lastVersion: '1.2.3',
      manifestVersion: '0.2.0',
      commits: subjects.map((subject) => ({ subject, body: '' })),
    });
  assert.equal(next(['fix: a', 'docs: b']), '1.2.4');
  assert.equal(next(['fix: a', 'feat: b']), '1.3.0');
  assert.equal(next(['feat!: a', 'fix: b']), '2.0.0');
  assert.equal(next(['docs: a', 'chore: b']), null);
  assert.equal(next([]), null);
});

test('reads the number of a merged pull request', () => {
  assert.equal(mergedPullRequest('Merge pull request #12 from guplem/some-branch'), 12);
  assert.equal(mergedPullRequest('feat: zoom'), null);
});

test('the notes group pull requests under their largest change and skip silent commits', () => {
  const pullRequest = { number: 4, title: 'feat: zoom the image' };
  const notes = releaseNotes([
    { subject: 'fix: keep the focus', body: '', hash: 'aaa1111', pullRequest },
    { subject: 'feat: zoom', body: '', hash: 'bbb2222', pullRequest },
    { subject: 'docs: describe the zoom', body: '', hash: 'ccc3333', pullRequest },
    { subject: 'fix: direct fix', body: '', hash: 'ddd4444' },
  ]);
  assert.equal(
    notes,
    [
      '## New features',
      '',
      '- feat: zoom the image (#4)',
      '',
      '## Fixes and other changes',
      '',
      '- fix: direct fix',
      '',
      '<details>',
      '<summary>Commits</summary>',
      '',
      '- fix: keep the focus (aaa1111)',
      '- feat: zoom (bbb2222)',
      '- fix: direct fix (ddd4444)',
      '',
      '</details>',
      '',
    ].join('\n'),
  );
});

test('notes with no change to the extension say so', () => {
  assert.equal(releaseNotes([{ subject: 'docs: a', body: '' }]), 'No change to the extension.\n');
});
