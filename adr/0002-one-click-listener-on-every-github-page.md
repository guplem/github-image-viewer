# One content script on every GitHub page, with one click listener that reads the page at click time

## Context

The viewer must open on pull requests and issues only. GitHub is a single-page app in most places. A click from a repository page or from the pull request list loads the pull request without a full page load (GitHub uses Turbo and a React router for this). Chrome injects a content script only on a full page load whose address matches the manifest pattern.

So a content script that matches only `/pull/*` and `/issues/*` never starts when the user arrives from another GitHub page. Comments also arrive after the page loads: a new comment, a "Load more" click, a hidden comment that the user expands.

## Decision

- `manifest.json` injects one content script on `https://github.com/*`. That is the only site, and the extension asks for no permission at all.
- `contentEntry.js` adds **one click listener on `window`, in the capture phase**. It does nothing until a click arrives. At click time it checks `isConversationPath(location.pathname)` (`githubPages.js`), finds the clicked image, and collects the images of that comment.
- The listener reads the page at click time. There is no `MutationObserver`, no scan on page load, and no marker on GitHub's images. A comment that arrived late therefore works with no extra code.
- The capture phase on `window` runs before GitHub's own handlers. The listener calls `preventDefault` and `stopImmediatePropagation`, so neither the browser nor GitHub opens the image.
- A click with a modifier key or a middle button passes through untouched. A click on an image inside a link to another page (a CI badge, for example) passes through too: `isImageLink` decides.
- `popstate` and `turbo:visit` close the viewer, so a viewer of the old page never stays open over a new page.

**Rejected alternative:** match only pull request and issue addresses in the manifest. The script then misses every page that GitHub opens without a reload, which is the usual way to open a pull request.

**Rejected alternative:** a `MutationObserver` that marks or wraps each image. It costs work on every DOM change of a busy page, and it must undo its marks when GitHub re-renders. A click-time read costs nothing until the user clicks.

## Consequences

**Positive:**

- No permission, no service worker, and no work on pages where nobody clicks an image.
- GitHub page changes and late comments need no special code.

**Trade-offs and follow-up:**

- The Chrome Web Store shows that the extension can read and change data on `github.com`. The store listing must explain why: the content script must run on every GitHub page to survive GitHub's page changes.
- The listener depends on GitHub's markup: `.markdown-body` for a comment body and `<animated-image>` for a GIF player. `commentImages.js` is the only file that holds these names. When GitHub changes its markup, fix that file.
