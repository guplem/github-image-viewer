/**
 * What the extension knows about GitHub addresses. Pure logic: no DOM and no
 * `chrome.*`, so Node tests it directly.
 */

/** `/<owner>/<repo>/pull/<number>` or `/<owner>/<repo>/issues/<number>`, with any tab after it. */
const CONVERSATION_PATH = /^\/[^/]+\/[^/]+\/(?:pull|issues)\/\d+(?:\/|$)/;

/** Hosts that GitHub serves images from. A link to one of them opens an image, never a page. */
const IMAGE_HOSTS = new Set([
  'private-user-images.githubusercontent.com',
  'user-images.githubusercontent.com',
  'camo.githubusercontent.com',
  'raw.githubusercontent.com',
  'media.githubusercontent.com',
]);

const IMAGE_EXTENSION = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;

/**
 * Tells whether a path is a pull request or an issue, the only pages where the
 * viewer opens. The content script runs on every GitHub page, because GitHub
 * changes pages without a reload, so each click checks the path again.
 * @param {string} pathname The `location.pathname` of the page.
 * @returns {boolean}
 */
export function isConversationPath(pathname) {
  return CONVERSATION_PATH.test(pathname);
}

/**
 * Tells whether the link around an image only opens that image. GitHub wraps
 * every image in a comment in such a link, and the viewer replaces it. A link
 * to anything else, such as a CI badge that points to a workflow, must keep
 * working, so the viewer leaves that click alone.
 * @param {string | null} linkHref The absolute `href` of the closest link, or `null` when there is none.
 * @param {string} imageSrc The address the image shows.
 * @returns {boolean}
 */
export function isImageLink(linkHref, imageSrc) {
  if (!linkHref) return true;
  if (linkHref === imageSrc) return true;

  /** @type {URL} */
  let url;
  try {
    url = new URL(linkHref);
  } catch {
    return false;
  }
  if (IMAGE_HOSTS.has(url.hostname)) return true;
  if (url.hostname === 'github.com' && url.pathname.startsWith('/user-attachments/assets/')) return true;
  return IMAGE_EXTENSION.test(url.pathname);
}
