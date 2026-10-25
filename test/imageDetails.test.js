import test from 'node:test';
import assert from 'node:assert/strict';

import { describeImageFile, formatImageFacts, formatPixelSize, formatPosition, stepIndex } from '../src/viewer/imageDetails.js';

test('the position counts from one', () => {
  assert.equal(formatPosition(0, 7), '1 / 7');
  assert.equal(formatPosition(2, 7), '3 / 7');
  assert.equal(formatPosition(6, 7), '7 / 7');
});

test('a step wraps around at both ends', () => {
  assert.equal(stepIndex(0, 1, 3), 1);
  assert.equal(stepIndex(2, 1, 3), 0);
  assert.equal(stepIndex(0, -1, 3), 2);
  assert.equal(stepIndex(0, 1, 1), 0);
  assert.equal(stepIndex(0, -1, 1), 0);
});

test('the pixel size needs both sides, because a broken image reports zero', () => {
  assert.equal(formatPixelSize(1926, 474), '1926 × 474 px');
  assert.equal(formatPixelSize(0, 0), null);
  assert.equal(formatPixelSize(10, 0), null);
});

test('reads the file name and the format of an uploaded image', () => {
  assert.deepEqual(
    describeImageFile('https://private-user-images.githubusercontent.com/13074644/683195560-f9d70fac.png?jwt=eyJ0eXAi'),
    { fileName: '683195560-f9d70fac.png', format: 'PNG' },
  );
  assert.deepEqual(describeImageFile('https://user-images.githubusercontent.com/1/my%20shot.jpg'), {
    fileName: 'my shot.jpg',
    format: 'JPEG',
  });
});

test('names every common image format', () => {
  const formatOf = (/** @type {string} */ name) => describeImageFile(`https://example.com/${name}`).format;
  assert.equal(formatOf('a.jpeg'), 'JPEG');
  assert.equal(formatOf('a.GIF'), 'GIF');
  assert.equal(formatOf('a.webp'), 'WebP');
  assert.equal(formatOf('a.svg'), 'SVG');
  assert.equal(formatOf('a.avif'), 'AVIF');
  assert.equal(formatOf('a.txt'), null);
});

test('an upload address with no extension gives a name but no format', () => {
  assert.deepEqual(describeImageFile('https://github.com/user-attachments/assets/719974f0-4295-4ab4-bfcf-756ebe6cc970'), {
    fileName: '719974f0-4295-4ab4-bfcf-756ebe6cc970',
    format: null,
  });
});

test('reads the original address out of a camo proxy address', () => {
  const original = 'https://example.com/images/diagram.svg';
  const hex = Buffer.from(original).toString('hex');
  assert.deepEqual(describeImageFile(`https://camo.githubusercontent.com/0123abcd/${hex}`), {
    fileName: 'diagram.svg',
    format: 'SVG',
  });
});

test('a camo address that does not decode keeps its own last segment', () => {
  assert.deepEqual(describeImageFile('https://camo.githubusercontent.com/0123abcd/zz'), { fileName: 'zz', format: null });
});

test('a data address gives its format and no file name', () => {
  assert.deepEqual(describeImageFile('data:image/png;base64,iVBORw0KGgo='), { fileName: null, format: 'PNG' });
});

test('an address that does not parse gives nothing', () => {
  assert.deepEqual(describeImageFile('not a url'), { fileName: null, format: null });
  assert.deepEqual(describeImageFile('https://example.com/'), { fileName: null, format: null });
});

test('the facts line lists only what is known', () => {
  assert.deepEqual(formatImageFacts({ fileName: 'a.png', format: 'PNG' }, 800, 600), ['800 × 600 px', 'PNG', 'a.png']);
  assert.deepEqual(formatImageFacts({ fileName: null, format: null }, 0, 0), []);
  assert.deepEqual(formatImageFacts({ fileName: 'abc', format: null }, 0, 0), ['abc']);
});
