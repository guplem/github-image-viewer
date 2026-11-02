import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_SCALE,
  MIN_SCALE,
  RESTING_VIEW,
  formatZoom,
  isResting,
  panBy,
  toggleZoomAt,
  wheelZoomFactor,
  zoomAt,
} from '../src/viewer/imageZoom.js';

test('a zoom at the center scales and does not move the image', () => {
  assert.deepEqual(zoomAt(RESTING_VIEW, 2, 0, 0), { scale: 2, x: 0, y: 0 });
});

test('a zoom keeps the point under the cursor in place', () => {
  // The cursor is 100 px right of the image center. After a zoom by 2, the image moves 100 px left.
  assert.deepEqual(zoomAt(RESTING_VIEW, 2, 100, 0), { scale: 2, x: -100, y: 0 });
  // A zoom out at the same point undoes it.
  assert.deepEqual(zoomAt({ scale: 2, x: -100, y: 0 }, 0.5, 100, 0), { scale: 1, x: 0, y: 0 });
});

test('the scale stays inside its limits, and the cursor point stays in place at the limit', () => {
  assert.equal(zoomAt({ scale: MAX_SCALE, x: 0, y: 0 }, 2, 50, 50).scale, MAX_SCALE);
  assert.deepEqual(zoomAt({ scale: MAX_SCALE, x: 0, y: 0 }, 2, 50, 50), { scale: MAX_SCALE, x: 0, y: 0 });
  assert.equal(zoomAt({ scale: MIN_SCALE, x: 0, y: 0 }, 0.5, 0, 0).scale, MIN_SCALE);
  assert.equal(zoomAt(RESTING_VIEW, 1000, 0, 0).scale, MAX_SCALE);
});

test('a pan moves the image with no limit', () => {
  assert.deepEqual(panBy({ scale: 3, x: 10, y: 20 }, -5000, 7000), { scale: 3, x: -4990, y: 7020 });
});

test('a wheel turn down zooms out, a turn up zooms in, and a line counts as many pixels', () => {
  assert.ok(wheelZoomFactor(100, 0) < 1);
  assert.ok(wheelZoomFactor(-100, 0) > 1);
  assert.equal(wheelZoomFactor(0, 0), 1);
  assert.equal(wheelZoomFactor(-3, 1), wheelZoomFactor(-48, 0));
  // One notch of a common mouse wheel zooms by about a fifth.
  assert.ok(Math.abs(wheelZoomFactor(-100, 0) - 1.2) < 0.03);
});

test('a double click zooms in at rest and goes back to rest otherwise', () => {
  assert.deepEqual(toggleZoomAt(RESTING_VIEW, 100, 0), { scale: 2, x: -100, y: 0 });
  assert.deepEqual(toggleZoomAt({ scale: 2, x: -100, y: 0 }, 5, 5), RESTING_VIEW);
  assert.deepEqual(toggleZoomAt({ scale: 1, x: 30, y: 0 }, 5, 5), RESTING_VIEW);
});

test('the view is at rest only at full fit and no offset', () => {
  assert.equal(isResting(RESTING_VIEW), true);
  assert.equal(isResting({ scale: 1, x: 1, y: 0 }), false);
  assert.equal(isResting({ scale: 1.5, x: 0, y: 0 }), false);
});

test('the zoom text is a whole percent', () => {
  assert.equal(formatZoom(1), '100%');
  assert.equal(formatZoom(2.5), '250%');
  assert.equal(formatZoom(1.2345), '123%');
});
