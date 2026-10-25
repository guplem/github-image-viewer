/**
 * The text the viewer shows about an image. Pure logic: no DOM and no
 * `chrome.*`, so Node tests it directly.
 */

/**
 * @typedef {object} ImageFile
 * @property {string | null} fileName The last segment of the address, decoded, or `null` when there is none.
 * @property {string | null} format A readable format name such as `PNG`, or `null` when the address does not say.
 */

/** @type {Readonly<Record<string, string>>} */
const FORMAT_BY_EXTENSION = {
  apng: 'APNG',
  avif: 'AVIF',
  bmp: 'BMP',
  gif: 'GIF',
  ico: 'ICO',
  jpeg: 'JPEG',
  jpg: 'JPEG',
  png: 'PNG',
  svg: 'SVG',
  webp: 'WebP',
};

/** @type {Readonly<Record<string, string>>} */
const FORMAT_BY_MIME_SUBTYPE = { ...FORMAT_BY_EXTENSION, 'svg+xml': 'SVG' };

/**
 * @param {number} index Zero-based position of the current image.
 * @param {number} total Number of images in the comment.
 * @returns {string} Such as `3 / 7`.
 */
export function formatPosition(index, total) {
  return `${index + 1} / ${total}`;
}

/**
 * Moves through the images and wraps around at both ends.
 * @param {number} index Zero-based position of the current image.
 * @param {number} step `1` for the next image, `-1` for the previous one.
 * @param {number} total Number of images in the comment.
 * @returns {number}
 */
export function stepIndex(index, step, total) {
  return (((index + step) % total) + total) % total;
}

/**
 * @param {number} width The `naturalWidth` of the image.
 * @param {number} height The `naturalHeight` of the image.
 * @returns {string | null} Such as `1926 × 474 px`, or `null` for an image that did not load, which reports zero.
 */
export function formatPixelSize(width, height) {
  if (width <= 0 || height <= 0) return null;
  return `${width} × ${height} px`;
}

/**
 * Reads the file name and the format out of an image address. GitHub keeps no
 * original upload name, so the name is whatever the address ends with.
 * @param {string} src The address the image shows (`currentSrc`).
 * @returns {ImageFile}
 */
export function describeImageFile(src) {
  /** @type {URL} */
  let url;
  try {
    url = new URL(src);
  } catch {
    return { fileName: null, format: null };
  }

  if (url.protocol === 'data:') {
    const subtype = /^image\/([^;,]+)/i.exec(url.pathname)?.[1]?.toLowerCase();
    return { fileName: null, format: (subtype && FORMAT_BY_MIME_SUBTYPE[subtype]) ?? null };
  }

  const segments = (url.hostname === 'camo.githubusercontent.com' && decodeCamoPath(url.pathname)) || url.pathname;
  const lastSegment = segments.split('/').filter(Boolean).pop();
  if (!lastSegment) return { fileName: null, format: null };

  const fileName = safeDecode(lastSegment);
  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase();
  return { fileName, format: (extension && FORMAT_BY_EXTENSION[extension]) ?? null };
}

/**
 * Lists what is known about an image, in reading order: size, format, name.
 * @param {ImageFile} file
 * @param {number} width The `naturalWidth` of the image.
 * @param {number} height The `naturalHeight` of the image.
 * @returns {string[]}
 */
export function formatImageFacts(file, width, height) {
  /** @type {(string | null)[]} */
  const facts = [formatPixelSize(width, height), file.format, file.fileName];
  return facts.filter((fact) => fact !== null);
}

/**
 * A camo address is `/<digest>/<original address in hex>`. Camo is the proxy
 * GitHub puts in front of every image from another site.
 * @param {string} pathname
 * @returns {string | null} The path of the original address, or `null` when the address does not decode.
 */
function decodeCamoPath(pathname) {
  const hex = pathname.split('/').filter(Boolean)[1];
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  try {
    return new URL(new TextDecoder().decode(bytes)).pathname;
  } catch {
    return null;
  }
}

/**
 * @param {string} segment
 * @returns {string}
 */
function safeDecode(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
