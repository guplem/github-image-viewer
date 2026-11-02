/**
 * The zoom and the pan of the viewer image. Pure logic: no DOM and no
 * `chrome.*`, so Node tests it directly.
 *
 * The viewer draws a view as `translate(x, y) scale(scale)` around the center
 * of the image. Every point in this file is in pixels, relative to that center
 * before the transform.
 */

/**
 * @typedef {object} ZoomView
 * @property {number} scale `1` is the size that fits the screen.
 * @property {number} x The horizontal offset of the image, in screen pixels.
 * @property {number} y The vertical offset of the image, in screen pixels.
 */

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 20;

/** @type {Readonly<ZoomView>} */
export const RESTING_VIEW = Object.freeze({ scale: 1, x: 0, y: 0 });

/** One notch of a common mouse wheel reports 100 pixels; this rate turns it into a zoom of about a fifth. */
const ZOOM_RATE_PER_PIXEL = 0.0018;
/** `WheelEvent.deltaMode` 1 counts lines, and Chrome uses 16 pixels for one line. */
const PIXELS_PER_LINE = 16;
const PIXELS_PER_PAGE = 800;
const DOUBLE_CLICK_SCALE = 2;

/**
 * Scales the image and keeps the point under the cursor in place.
 * @param {ZoomView} view
 * @param {number} factor Such as `2` to double the size.
 * @param {number} pointX The cursor, relative to the image center before the transform.
 * @param {number} pointY
 * @returns {ZoomView}
 */
export function zoomAt(view, factor, pointX, pointY) {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const ratio = scale / view.scale;
  return { scale, x: pointX - ratio * (pointX - view.x), y: pointY - ratio * (pointY - view.y) };
}

/**
 * Moves the image. There is no limit, so the user can move the image anywhere.
 * @param {ZoomView} view
 * @param {number} deltaX
 * @param {number} deltaY
 * @returns {ZoomView}
 */
export function panBy(view, deltaX, deltaY) {
  return { scale: view.scale, x: view.x + deltaX, y: view.y + deltaY };
}

/**
 * @param {number} deltaY The `deltaY` of a wheel event. A positive value is a turn down, which zooms out.
 * @param {number} deltaMode The `deltaMode` of the wheel event: `0` pixels, `1` lines, `2` pages.
 * @returns {number} The factor for `zoomAt`.
 */
export function wheelZoomFactor(deltaY, deltaMode) {
  const pixels = deltaY * (deltaMode === 1 ? PIXELS_PER_LINE : deltaMode === 2 ? PIXELS_PER_PAGE : 1);
  return Math.exp(-pixels * ZOOM_RATE_PER_PIXEL);
}

/**
 * A double click zooms in at the cursor when the view is at rest, and goes back to rest otherwise.
 * @param {ZoomView} view
 * @param {number} pointX
 * @param {number} pointY
 * @returns {ZoomView}
 */
export function toggleZoomAt(view, pointX, pointY) {
  return isResting(view) ? zoomAt(view, DOUBLE_CLICK_SCALE, pointX, pointY) : { ...RESTING_VIEW };
}

/**
 * @param {ZoomView} view
 * @returns {boolean} `true` when the image fits the screen at its place.
 */
export function isResting(view) {
  return view.scale === 1 && view.x === 0 && view.y === 0;
}

/**
 * @param {number} scale
 * @returns {string} Such as `150%`.
 */
export function formatZoom(scale) {
  return `${Math.round(scale * 100)}%`;
}
