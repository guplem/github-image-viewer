# Image Viewer for GitHub

A Chrome extension for GitHub pull requests and issues. Click an image in a comment, and it opens in a viewer on top of the page. No new tab opens, and the page stays where it was.

The viewer holds only the images of the comment that you clicked. Move between them with the arrow keys, zoom in with the mouse wheel, and read the alt text, the size in pixels, and the format of each one. Nothing leaves your browser.

![the icon: a framed photo between a left and a right arrow](icons/icon128.png)

## Install

Install it from the Chrome Web Store: **[Image Viewer for GitHub](https://chromewebstore.google.com/detail/ciejgnmafcdnpabcaiadepcicplllnpj)**.

### Install from source

To run it from source, load it from this folder. There is no build step, so the repository folder **is** the extension folder.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Press **Load unpacked** and pick the folder that holds `manifest.json`.
5. Reload any GitHub tab that was already open.

Chrome keeps the extension until you remove it. After you pull a new version, press the reload arrow on the extension card, then reload the GitHub tab.

## How to use it

1. Open a pull request or an issue on `github.com`.
2. Click an image in the description or in a comment. The viewer opens.
3. Move to the previous or the next image of that comment with `←` and `→`, or with the arrows at the sides.
4. Zoom in and out with the mouse wheel. The point under the cursor stays in place.
5. Drag the image to move it anywhere on the screen.
6. Double-click the image to zoom in to 200% at that point. Double-click again to fit the image back to the screen. The `+`, `-`, and `0` keys do the same from the keyboard.
7. Close the viewer with `Esc`, with the `×` button, or with a click outside the image.

The next or the previous image always opens fitted to the screen.

The panel under the image shows:

- **The position**, such as `3 / 7`. It counts the images of that one comment only.
- **The alt text**, or "No alt text" when the image has none. GitHub gives a pasted screenshot the alt text "Image".
- **The size in pixels, the format, and the file name**, such as `1926 × 474 px · PNG · 683195560-f9d70fac.png`. GitHub keeps no original name for an uploaded image, so the name is the one in its address.
- **Open original**, which opens the image in a new tab.

The viewer leaves these clicks alone, so they work as before:

- A click with `Ctrl`, `Shift`, `Alt`, or `Cmd`, or with the middle button. The image opens the normal way.
- A click on an image that links to another page, such as a CI badge.
- A click on the play and pause controls of a GIF.

## Troubleshooting

**A click on an image still opens a new tab.**
Reload the GitHub tab. A tab that was open before you installed or reloaded the extension does not have it yet.

**The viewer does not open on some image.**
The viewer works on pull requests and issues only, and only on images inside a comment or a description. An image inside a link to another page keeps that link.

**The size says nothing, or "The image did not load."**
GitHub serves an uploaded image of a private repository with a short-lived token. Reload the page to get a fresh one.

## Privacy

- The extension runs on `github.com` only, and it asks for no permission.
- It reads the page only when you click an image, and only that comment.
- It shows the image from the same GitHub address that the page already uses. It contacts no other server, and it stores nothing.
- There is no server, no account, and no analytics.

The full policy for the Chrome Web Store is in [`PRIVACY.md`](PRIVACY.md).

## Publish to the Chrome Web Store

Each merge to `main` that changes the extension makes a new [GitHub release](https://github.com/guplem/github-image-viewer/releases). The release holds the zip to upload, `github-image-viewer-<version>.zip`, with only the files that Chrome uses. The commit prefixes pick the version: `feat` raises the middle number, `fix` the last one, and `!` (such as `feat!:`) the first one. A change to the docs or the tests makes no release.

1. Wait for the release of your merge, then download its zip.
2. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Press **New item** and upload the zip. For an update, open the item and upload the new zip in **Package**.
4. Fill in the **Store listing**, **Privacy**, and **Distribution** tabs. [`store/listing.md`](store/listing.md) holds every text to paste, field by field, including the reason for the site access and the privacy policy link. The images to upload are in `store/images/`.
5. Submit for review.

To set the next version by hand, such as `1.0.0`, raise `version` in `manifest.json` before the merge. On Windows, you can also build the zip yourself:

```bash
powershell -ExecutionPolicy Bypass -File scripts/packageExtension.ps1
```

The store images are rendered from HTML pages in `store/graphics/`. After you change one, render them again (Windows, needs Google Chrome):

```bash
powershell -ExecutionPolicy Bypass -File scripts/renderStoreImages.ps1
```

## Development

Requires [Node.js](https://nodejs.org). There is no build step.

```bash
npm install
npm run check
```

`npm run check` runs the format check, the type check, and the tests, which is what CI runs. Contributor and architecture notes live in `AGENTS.md`.

## Licence

MIT. See `LICENSE`.
