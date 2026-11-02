# Image Viewer for GitHub: Chrome Web Store listing

Everything to paste into the Developer Dashboard, in the order the dashboard asks for it. Keep it true: when a feature, the site access, or the size changes, update this file and the images in the same change.

- The upload zip: build it with `scripts/packageExtension.ps1`. It lands in `dist/`.
- The images: `store/images/`. Their sources are the HTML pages in `store/graphics/`. Render them again with `scripts/renderStoreImages.ps1`.
- `store/graphics/screenshots/viewer.png` is a capture of the real viewer on `store/graphics/demo/pullRequest.html`, a made-up pull request with made-up images. To capture it again, serve that page at a `https://github.com/<owner>/<repo>/pull/<number>` address (for example with Playwright request routing), load the extension unpacked, click the second image, and take a 1280×800 screenshot.

---

## 0. Before you start

- Store page: https://chromewebstore.google.com/detail/ciejgnmafcdnpabcaiadepcicplllnpj
- Item ID: `ciejgnmafcdnpabcaiadepcicplllnpj`. The dashboard and the store address use this ID.
- Dashboard: https://chrome.google.com/webstore/devconsole
- Upload file: `dist/github-image-viewer-<version>.zip`
- Google account: the one that owns the other extensions. It needs 2-Step Verification.

---

## 1. Package (upload)

Press **New item** and choose the zip. For an update, open the item, go to **Package**, and upload the new zip.

The dashboard reads the name, the version, the summary, and the icon from the zip.

---

## 2. Store listing tab

### Name (comes from the zip)

Image Viewer for GitHub

The name puts "GitHub" after "for", as "Instant Swap for Google Photos" does with "Google Photos". The store accepts a brand name that describes what the extension works with, but not a name that looks like the brand's own product.

### Summary (comes from the zip: the `description` in `manifest.json`, at most 132 characters)

Click an image in a GitHub pull request or issue to open it in a floating viewer. Arrow keys move between the comment's images.

### Description (paste this whole block)

See every image in a pull request or an issue without leaving the page.

On GitHub, a click on a screenshot opens it in a new tab. Review a pull request with ten screenshots, and you end up with ten tabs. Image Viewer for GitHub opens the image in a viewer on top of the page instead, and the page stays where it was.

HOW IT WORKS

1. Open a pull request or an issue on github.com.
2. Click an image in the description or in a comment.
3. Move with the left and right arrow keys. Zoom with the mouse wheel, and drag to move the image. Close with Esc.

FEATURES
• Opens in place: no new tab, and the page does not scroll away.
• One comment at a time: the viewer holds only the images of the comment that you clicked, and shows where you are, such as 3 / 7.
• The details that matter: the alt text, the size in pixels, the format, and the file name of each image.
• Zoom and pan: the mouse wheel zooms at the cursor, a drag moves the image freely, and a double click fits it back to the screen.
• Keyboard first: left and right arrows to move, + and - to zoom, Esc to close. On-screen arrows and a close button do the same.
• Stays out of the way: a click with Ctrl, Shift, or the middle button still opens the image the normal way, and a badge that links to another page keeps its link.
• Works with GitHub's fast page changes and with comments that appear after the page loads.

PRIVATE BY DESIGN
• No permissions. It runs on github.com only.
• It shows the image from the same GitHub address that the page already uses. It contacts no other server.
• No account, no analytics, no ads, and no tracking. It stores nothing.
• The whole extension is about 23 KB.

Open source: https://github.com/guplem/github-image-viewer

### Category

Developer Tools

### Language

English

### Graphic assets

| Field (files in `store/images/`) | File                                              |
| -------------------------------- | ------------------------------------------------- |
| Store icon (128×128)             | Comes from the zip. If asked: `icons/icon128.png` |
| Screenshot 1                     | `1-click-to-open.png`                             |
| Screenshot 2                     | `2-one-comment.png`                               |
| Screenshot 3                     | `3-light-fast-private.png`                        |
| Small promo tile (440×280)       | `small-promo-tile-440x280.png`                    |
| Marquee promo tile (1400×560)    | Leave empty. It is optional.                      |
| Promo video                      | Leave empty. It is optional.                      |

### Additional fields

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Official URL   | Leave "None" (it needs a verified domain)            |
| Homepage URL   | https://github.com/guplem/github-image-viewer        |
| Support URL    | https://github.com/guplem/github-image-viewer/issues |
| Mature content | No                                                   |

---

## 3. Privacy tab

### Single purpose description

Image Viewer for GitHub opens the images of a GitHub pull request or issue comment in a viewer on top of the page, so the user can look through them without leaving the page.

### Permission justifications

**Permissions**
None requested.

**Host permissions (the content script on https://github.com/\*)**
The content script must run on every github.com page, because GitHub opens most pull requests and issues without a full page load, and Chrome injects a content script only on a full page load. On every page, the script waits for a click. It acts only when the user clicks an image inside a comment on a pull request or an issue page. It then reads the images of that one comment and shows them in a viewer. It changes nothing else on the page and sends nothing anywhere.

### Remote code

Select: **No, I am not using remote code.**

Justification (if asked): All JavaScript ships inside the package. The extension loads no external script.

### Data usage

Tick only:

- **Website content** (the images, their addresses, and their alt text, read from the comment that the user clicks, and shown only in the viewer)

Leave every other category unticked (personally identifiable information, health, financial, authentication, personal communications, location, web history, user activity).

Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

https://github.com/guplem/github-image-viewer/blob/main/PRIVACY.md

---

## 4. Distribution tab

| Field      | Value                                                            |
| ---------- | ---------------------------------------------------------------- |
| Payments   | Free                                                             |
| Visibility | Public. Pick Unlisted instead to share it only by link at first. |
| Regions    | All regions                                                      |

---

## 5. Submit

Press **Submit for review**. Leave "Publish automatically after review" on, unless you want to press Publish yourself.

Google sends an email when the review is done. It usually takes a few days. A content script on a whole site can make the review take longer.
