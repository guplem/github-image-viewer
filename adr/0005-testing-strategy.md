# Test the address and text logic test-first; leave the DOM files to the type check and a manual run

## Context

The repo mandates red-green TDD. A content script resists it in one place: the code that reads a live GitHub page and draws the viewer. A unit test for that code needs a fake GitHub page that this repo itself invents. It would pass while the real GitHub markup had changed, which is the one failure that actually happens here.

The rest is different. Which pages count, which links are image links, and what the viewer says about an image are decisions with clear inputs and outputs.

## Decision

**Split the code so the decisions are testable, then test all of them test-first.**

- `githubPages.js` is pure and fully tested: `isConversationPath` and `isImageLink`.
- `imageDetails.js` is pure and fully tested: the position text, the wrap-around step, the pixel size, the file name and format of an address (including a camo proxy address and a `data:` address), and the facts line.
- `imageZoom.js` is pure and fully tested: the zoom at the cursor and its limits, the free pan, the wheel step, the double-click toggle, and the zoom text.

**Exempt from unit tests:** `contentBootstrap.js`, `contentEntry.js`, `commentImages.js`, and `imageViewer.js`. Keep them thin. They read the page, call a pure function, and draw the result. When a bug appears in one of them, move the decision that failed into a pure function and test that, rather than test the file.

**The safety net for the exempt files** is two things. `npm run typecheck` reads every file under `strict`. One manual run in Chrome covers the rest.

The manual run is short and always the same:

1. Load the extension unpacked, and open a pull request and an issue with several images in one comment.
2. Click an image. The viewer opens, the address does not change, and no tab opens.
3. Check the position (`2 / 3`), the alt text, the size, and the format. Press the left and right arrow keys, and use the on-screen arrows.
4. Zoom with the mouse wheel; the point under the cursor stays in place. Drag the image, and release the button outside the image; the viewer stays open. Double-click, then press `0`; the image fits the screen again.
5. Close with `Esc`, with the close button, and with a click outside the image.
6. Open the pull request from the pull request list, without a reload, and click an image again.
7. Click a GIF, and a badge that links to another page. The GIF counts once; the badge link still works.

**Rejected alternative:** jsdom tests for `commentImages.js`. The test markup would be a copy of today's GitHub markup, written by hand, so a green test would prove nothing about the real page.

## Consequences

**Positive:**

- The suite runs in well under a second, so the pre-commit hook and CI stay fast.
- The type check reads every file, including the exempt ones.

**Trade-offs and follow-up:**

- The file most likely to break, `commentImages.js`, has no tests. That is deliberate: the type check and the manual run cover it.
- There is no merge gate for "it still works on GitHub". Any change to an exempt file needs a manual run before it is trusted.
