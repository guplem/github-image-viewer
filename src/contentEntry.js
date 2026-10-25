/**
 * Entry point of the extension. Runs in the isolated world of every GitHub
 * page: GitHub changes pages without a reload, so a script that ran only on
 * pull requests and issues would miss a pull request opened from the list.
 *
 * One click listener on `window` serves every image, including the images of a
 * comment that arrives after the page loaded, because it reads the page at
 * click time instead of at load time.
 */

import { collectCommentImages, findClickedImage, findCommentBody, imageAddress, isViewerImage } from './github/commentImages.js';
import { isConversationPath } from './github/githubPages.js';
import { createImageViewer } from './viewer/imageViewer.js';

/**
 * Reads the viewer stylesheet from the extension package once, at start, so
 * the first open already has its styles.
 * @returns {Promise<CSSStyleSheet>}
 */
async function loadViewerStyleSheet() {
  const response = await fetch(chrome.runtime.getURL('src/viewer/imageViewer.css'));
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(await response.text());
  return styleSheet;
}

export async function start() {
  const viewer = createImageViewer(await loadViewerStyleSheet());

  // Capture phase on `window`, so this runs before GitHub's own handlers and can stop them.
  window.addEventListener(
    'click',
    (event) => {
      // A modifier or a middle button means "open it my way". Leave that to the browser.
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (viewer.isOpen() || !isConversationPath(location.pathname)) return;

      const image = findClickedImage(event.target);
      if (!image || !isViewerImage(image)) return;
      const body = findCommentBody(image);
      if (!body) return;
      const images = collectCommentImages(body);
      const index = images.indexOf(image);
      if (index < 0) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      viewer.open(
        images.map((element) => ({ element, src: imageAddress(element), alt: element.alt })),
        index,
      );
    },
    true,
  );

  // The page behind the viewer changes on Back and on a GitHub page change. Never leave a viewer of the old page open.
  window.addEventListener('popstate', () => viewer.close());
  document.addEventListener('turbo:visit', () => viewer.close());
}
