/**
 * The floating viewer. It lives in a shadow root on `<html>`, so GitHub's
 * styles cannot reach it, and GitHub's page changes, which swap `<body>`,
 * cannot remove it.
 *
 * Every piece of page text goes in through `textContent`, never `innerHTML`:
 * the alt text and the address come from a comment that anyone can write.
 *
 * The mouse wheel zooms at the cursor, a drag moves the image freely, and a
 * double click zooms in or goes back to the fitted view.
 */

import { describeImageFile, formatImageFacts, formatPosition, stepIndex } from './imageDetails.js';
import { RESTING_VIEW, formatZoom, isResting, panBy, toggleZoomAt, wheelZoomFactor, zoomAt } from './imageZoom.js';

/**
 * @typedef {object} ViewerImage
 * @property {HTMLImageElement} element The image in the page. It, or the link around it, gets the focus back when the viewer closes.
 * @property {string} src
 * @property {string} alt
 */

const HOST_ID = 'github-image-viewer-host';

/** A pointer that moves less than this between press and release is a click, not a drag. */
const DRAG_THRESHOLD_PX = 4;
/** The zoom step of the `+` and `-` keys. */
const KEY_ZOOM_FACTOR = 1.25;

/** Octicon paths (16 by 16): x, chevron-left, chevron-right, link-external. */
const ICON_PATHS = {
  close:
    'M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z',
  previous:
    'M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z',
  next: 'M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z',
  external:
    'M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z',
};

/**
 * @param {CSSStyleSheet} styleSheet The rules of `imageViewer.css`.
 */
export function createImageViewer(styleSheet) {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.hidden = true;
  const root = host.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = [styleSheet];

  // `draggable="false"` stops the browser drag of the image, which would fight the pan.
  const image = createElement('img', { className: 'image', attributes: { draggable: 'false' } });
  const stage = createElement('div', { className: 'stage' }, [image]);
  const closeButton = createIconButton('close', 'Close (Esc)', () => close());
  const previousButton = createIconButton('previous', 'Previous image (Left arrow)', () =>
    show(stepIndex(index, -1, images.length)),
  );
  const nextButton = createIconButton('next', 'Next image (Right arrow)', () => show(stepIndex(index, 1, images.length)));
  const position = createElement('span', { className: 'position' });
  const zoomLevel = createElement('span', { className: 'zoom', attributes: { title: 'Double-click or press 0 to fit' } });
  const altText = createElement('p', { className: 'alt' });
  const facts = createElement('p', { className: 'facts' });
  const originalLink = createElement('a', {
    className: 'original',
    text: 'Open original',
    attributes: { target: '_blank', rel: 'noopener noreferrer' },
  });
  originalLink.prepend(createIcon('external'));
  const panel = createElement('div', { className: 'panel' }, [
    createElement('div', { className: 'panel-row' }, [
      createElement('span', { className: 'status' }, [position, zoomLevel]),
      originalLink,
    ]),
    altText,
    facts,
  ]);
  const dialog = createElement('div', { className: 'viewer', attributes: { role: 'dialog', 'aria-modal': 'true' } }, [
    stage,
    previousButton,
    nextButton,
    closeButton,
    panel,
  ]);
  root.append(dialog);

  /** @type {ViewerImage[]} */
  let images = [];
  let index = 0;
  let previousOverflow = '';
  /** @type {import('./imageZoom.js').ZoomView} */
  let view = { ...RESTING_VIEW };
  /** @type {{ pointerId: number, lastX: number, lastY: number, startX: number, startY: number } | null} */
  let drag = null;
  // A drag that ends outside the image must not count as a click outside the image, which closes the viewer.
  let dragMoved = false;

  // A click on the dark area around the image closes the viewer. The image, the buttons, and the panel keep their clicks.
  dialog.addEventListener('click', (event) => {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    if (event.target === dialog || event.target === stage) close();
  });
  dialog.addEventListener('pointerdown', () => {
    dragMoved = false;
  });
  // `passive: false` lets the listener stop the page scroll that the wheel would start.
  dialog.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      if (!image.getAttribute('src')) return;
      const [pointX, pointY] = pointFromCenter(event);
      setView(zoomAt(view, wheelZoomFactor(event.deltaY, event.deltaMode), pointX, pointY));
    },
    { passive: false },
  );
  image.addEventListener('dblclick', (event) => {
    event.preventDefault();
    const [pointX, pointY] = pointFromCenter(event);
    setView(toggleZoomAt(view, pointX, pointY));
  });
  image.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    image.setPointerCapture(event.pointerId);
    drag = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    };
    image.classList.add('dragging');
  });
  image.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    setView(panBy(view, event.clientX - drag.lastX, event.clientY - drag.lastY));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_THRESHOLD_PX) dragMoved = true;
  });
  image.addEventListener('pointerup', endDrag);
  image.addEventListener('pointercancel', endDrag);
  image.addEventListener('load', () => renderFacts());
  image.addEventListener('error', () => {
    facts.textContent = 'The image did not load.';
  });

  /** @param {PointerEvent} event */
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    image.classList.remove('dragging');
  }

  /**
   * The cursor, relative to the image center before the transform, which is what `imageZoom.js` expects.
   * @param {MouseEvent} event
   * @returns {[number, number]}
   */
  function pointFromCenter(event) {
    // The scale keeps the center in place, so the transform moves the center only by the offset.
    const box = image.getBoundingClientRect();
    return [event.clientX - (box.left + box.width / 2 - view.x), event.clientY - (box.top + box.height / 2 - view.y)];
  }

  /** @param {import('./imageZoom.js').ZoomView} nextView */
  function setView(nextView) {
    view = nextView;
    const resting = isResting(view);
    image.style.transform = resting ? '' : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    zoomLevel.textContent = resting ? '' : formatZoom(view.scale);
    zoomLevel.hidden = resting;
  }

  /** @param {number} factor */
  function zoomAtCenter(factor) {
    setView(zoomAt(view, factor, 0, 0));
  }

  /** @param {KeyboardEvent} event */
  function onKeyDown(event) {
    // While the viewer is open, no key reaches GitHub, so its shortcuts cannot act on the page behind.
    event.stopImmediatePropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft' && images.length > 1) {
      event.preventDefault();
      show(stepIndex(index, -1, images.length));
    } else if (event.key === 'ArrowRight' && images.length > 1) {
      event.preventDefault();
      show(stepIndex(index, 1, images.length));
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomAtCenter(KEY_ZOOM_FACTOR);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomAtCenter(1 / KEY_ZOOM_FACTOR);
    } else if (event.key === '0') {
      event.preventDefault();
      setView({ ...RESTING_VIEW });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      moveFocus(event.shiftKey ? -1 : 1);
    }
  }

  /**
   * Keeps the focus inside the viewer: Tab cycles through its controls only.
   * @param {number} step
   */
  function moveFocus(step) {
    /** @type {HTMLElement[]} */
    const controls = [previousButton, nextButton, originalLink, closeButton].filter((control) => !control.hidden);
    const current = controls.indexOf(/** @type {HTMLElement} */ (root.activeElement));
    controls[stepIndex(current < 0 ? 0 : current, current < 0 ? 0 : step, controls.length)]?.focus();
  }

  /** @param {number} nextIndex */
  function show(nextIndex) {
    const current = images[nextIndex];
    if (!current) return;
    index = nextIndex;

    drag = null;
    image.classList.remove('dragging');
    setView({ ...RESTING_VIEW });
    image.src = current.src;
    image.alt = current.alt;
    position.textContent = formatPosition(index, images.length);
    altText.textContent = current.alt.trim() || 'No alt text';
    altText.classList.toggle('missing', current.alt.trim() === '');
    originalLink.href = current.src;
    dialog.setAttribute('aria-label', `Image ${formatPosition(index, images.length)}`);
    renderFacts();
  }

  function renderFacts() {
    const current = images[index];
    if (!current) return;
    // Until the viewer copy loads, the page copy already knows the size.
    const source = image.complete && image.naturalWidth > 0 ? image : current.element;
    facts.textContent = formatImageFacts(describeImageFile(current.src), source.naturalWidth, source.naturalHeight).join(' · ');
  }

  /**
   * @param {ViewerImage[]} nextImages The images of one comment, in page order.
   * @param {number} startIndex The image that the user clicked.
   */
  function open(nextImages, startIndex) {
    images = nextImages;
    const single = images.length < 2;
    previousButton.hidden = single;
    nextButton.hidden = single;

    if (!host.isConnected) document.documentElement.append(host);
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown, true);
    host.hidden = false;
    show(startIndex);
    closeButton.focus();
  }

  function close() {
    if (host.hidden) return;
    host.hidden = true;
    window.removeEventListener('keydown', onKeyDown, true);
    document.documentElement.style.overflow = previousOverflow;
    image.removeAttribute('src');
    // An image cannot take the focus. The link around it can, which puts a keyboard user back where they were.
    const clicked = images[index]?.element;
    (clicked?.closest('a') ?? clicked)?.focus({ preventScroll: true });
    images = [];
  }

  return {
    open,
    close,
    /** @returns {boolean} */
    isOpen: () => !host.hidden,
  };
}

/** @typedef {ReturnType<typeof createImageViewer>} ImageViewer */

/**
 * @template {keyof HTMLElementTagNameMap} TagName
 * @param {TagName} tagName
 * @param {{ className?: string, text?: string, attributes?: Record<string, string> }} [options]
 * @param {Node[]} [children]
 * @returns {HTMLElementTagNameMap[TagName]}
 */
function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);
  if (options.className !== undefined) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attributes ?? {})) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

/**
 * @param {keyof typeof ICON_PATHS} name
 * @returns {SVGSVGElement}
 */
function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}

/**
 * @param {keyof typeof ICON_PATHS} name
 * @param {string} label The tooltip and the name a screen reader reads.
 * @param {() => void} onClick
 * @returns {HTMLButtonElement}
 */
function createIconButton(name, label, onClick) {
  const button = createElement(
    'button',
    { className: `button ${name}`, attributes: { type: 'button', title: label, 'aria-label': label } },
    [createIcon(name)],
  );
  button.addEventListener('click', onClick);
  return button;
}
