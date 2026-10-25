# The viewer lives in a shadow root on `<html>`, with its stylesheet read from the package

## Context

The viewer draws on top of a GitHub page. GitHub ships a large global stylesheet, and its rules for `button`, `img`, `a`, and `[hidden]` would change the viewer. The viewer's own rules must not change GitHub's page either.

GitHub's page changes replace `<body>`. An element that the extension appended to `<body>` disappears on the next page change.

## Decision

- `createImageViewer` (`imageViewer.js`) builds one host element, `#github-image-viewer-host`, and attaches an **open shadow root** to it. Every part of the viewer lives inside that root.
- The host goes on `document.documentElement`, not on `<body>`, the first time the viewer opens. `open` appends it again when it is no longer connected.
- `contentEntry.js` reads `src/viewer/imageViewer.css` once at start with `fetch(chrome.runtime.getURL(...))`, and passes it as a constructed `CSSStyleSheet`. The shadow root uses it through `adoptedStyleSheets`. The first open therefore already has its styles, with no flash of an unstyled viewer.
- `imageViewer.js` holds no `chrome.*` call. It receives the stylesheet as an argument.
- Page text (the alt text and the image address) goes into the viewer through `textContent` and attributes only, never `innerHTML`. Anyone can write a GitHub comment.
- While the viewer is open, a `keydown` listener on `window` in the capture phase stops every key from reaching GitHub, so GitHub's keyboard shortcuts cannot act on the page behind. The viewer also sets `overflow: hidden` on `<html>` and restores the old value on close.

**Rejected alternative:** a closed shadow root. It hides nothing that matters, because the page can read the same alt text and address in its own DOM, and it blocks tests and DevTools from reading the viewer.

**Rejected alternative:** the styles as a string inside `imageViewer.js`. A real `.css` file gets Prettier formatting and editor support.

## Consequences

**Positive:**

- GitHub's styles and the viewer's styles cannot affect each other.
- The viewer survives a GitHub page change, and `popstate` and `turbo:visit` close it (`0002-one-click-listener-on-every-github-page.md`).

**Trade-offs and follow-up:**

- `imageViewer.css` must stay in `src/`, because `web_accessible_resources` lists `src/*` and the `fetch` needs that entry.
- The viewer shows the same image address that the page already loaded, so GitHub's Content Security Policy allows it. An address from another host would need a check against that policy.
