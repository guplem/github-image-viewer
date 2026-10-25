/**
 * Finds the images of one comment in the GitHub page. This is the only file
 * that knows GitHub's markup. The decisions it needs about addresses live in
 * `githubPages.js`, where they are tested.
 */

import { isImageLink } from './githubPages.js';

/** Images that GitHub draws inside a comment body that are not part of the content. */
const DECORATIVE_IMAGES = 'img.emoji, g-emoji img, img.avatar';

/**
 * Finds the image behind a click, or `null` when the click was not on an image.
 * GitHub turns an animated GIF into an `<animated-image>` player that holds two
 * copies of the image and swaps them. Both map to the first copy, so a GIF
 * counts once, and the play and pause controls keep working.
 * @param {EventTarget | null} target
 * @returns {HTMLImageElement | null}
 */
export function findClickedImage(target) {
  if (!(target instanceof Element)) return null;

  const player = target.closest('animated-image');
  if (player) {
    if (target.closest('.AnimatedImagePlayer-controls')) return null;
    return player.querySelector('img');
  }
  return target instanceof HTMLImageElement ? target : null;
}

/**
 * Finds the body of the comment or description that holds an image. GitHub
 * nests one `.markdown-body` in another on some pages, so the outermost one is
 * the whole comment.
 * @param {Element} image
 * @returns {Element | null}
 */
export function findCommentBody(image) {
  let body = image.closest('.markdown-body');
  while (body?.parentElement) {
    const outer = body.parentElement.closest('.markdown-body');
    if (!outer) break;
    body = outer;
  }
  return body;
}

/**
 * @param {HTMLImageElement} image
 * @returns {boolean} `true` when the viewer can show the image and take over its click.
 */
export function isViewerImage(image) {
  if (image.matches(DECORATIVE_IMAGES)) return false;
  const link = image.closest('a[href]');
  return isImageLink(link instanceof HTMLAnchorElement ? link.href : null, imageAddress(image));
}

/**
 * Lists the images of one comment body, in page order, one entry per GIF player.
 * @param {Element} body
 * @returns {HTMLImageElement[]}
 */
export function collectCommentImages(body) {
  /** @type {Set<Element>} */
  const seenPlayers = new Set();
  /** @type {HTMLImageElement[]} */
  const images = [];

  for (const image of body.querySelectorAll('img')) {
    const player = image.closest('animated-image');
    if (player) {
      if (seenPlayers.has(player)) continue;
      seenPlayers.add(player);
    }
    if (isViewerImage(image)) images.push(image);
  }
  return images;
}

/**
 * The address the image shows. `currentSrc` stays empty until a lazy image
 * starts to load, so `src` is the fallback.
 * @param {HTMLImageElement} image
 * @returns {string}
 */
export function imageAddress(image) {
  return image.currentSrc || image.src;
}
