import test from 'node:test';
import assert from 'node:assert/strict';

import { isConversationPath, isImageLink } from '../src/github/githubPages.js';

test('a pull request and an issue are conversation pages, with or without a tab', () => {
  assert.equal(isConversationPath('/guplem/margin-notes/pull/12'), true);
  assert.equal(isConversationPath('/guplem/margin-notes/pull/12/files'), true);
  assert.equal(isConversationPath('/guplem/margin-notes/pull/12/'), true);
  assert.equal(isConversationPath('/guplem/margin-notes/issues/7'), true);
});

test('other GitHub pages are not conversation pages', () => {
  assert.equal(isConversationPath('/'), false);
  assert.equal(isConversationPath('/guplem/margin-notes'), false);
  assert.equal(isConversationPath('/guplem/margin-notes/pulls'), false);
  assert.equal(isConversationPath('/guplem/margin-notes/issues'), false);
  assert.equal(isConversationPath('/guplem/margin-notes/issues/new'), false);
  assert.equal(isConversationPath('/guplem/margin-notes/blob/main/README.md'), false);
  assert.equal(isConversationPath('/guplem/margin-notes/pull/12abc'), false);
});

test('an image with no link around it counts as an image link', () => {
  assert.equal(isImageLink(null, 'https://camo.githubusercontent.com/abc/def'), true);
  assert.equal(isImageLink('', 'https://camo.githubusercontent.com/abc/def'), true);
});

test('a link to the image itself counts as an image link', () => {
  const src = 'https://private-user-images.githubusercontent.com/1/2-abc.png?jwt=x';
  assert.equal(isImageLink(src, src), true);
});

test('a link to a GitHub image host or an upload counts as an image link', () => {
  const src = 'https://example.com/a.png';
  assert.equal(isImageLink('https://private-user-images.githubusercontent.com/1/2-abc.png?jwt=y', src), true);
  assert.equal(isImageLink('https://user-images.githubusercontent.com/1/2-abc.png', src), true);
  assert.equal(isImageLink('https://camo.githubusercontent.com/abc/def', src), true);
  assert.equal(isImageLink('https://raw.githubusercontent.com/o/r/main/shot.png', src), true);
  assert.equal(isImageLink('https://github.com/user-attachments/assets/8d0853c0-9a7d-4882-8740-236da4b41340', src), true);
});

test('a link to a file with an image extension counts as an image link', () => {
  assert.equal(isImageLink('https://example.com/pictures/Shot.JPEG', 'https://example.com/x'), true);
  assert.equal(isImageLink('https://github.com/o/r/blob/main/docs/diagram.svg', 'https://example.com/x'), true);
});

test('a link to a page is not an image link, so a badge keeps its link', () => {
  const badge = 'https://camo.githubusercontent.com/abc/def';
  assert.equal(isImageLink('https://github.com/o/r/actions/workflows/ci.yml', badge), false);
  assert.equal(isImageLink('https://codecov.io/gh/o/r/pull/3', badge), false);
  assert.equal(isImageLink('https://github.com/user-attachments/files/123/report.pdf', badge), false);
  assert.equal(isImageLink('not a url', badge), false);
});
