# Image Viewer for GitHub privacy policy

Last updated: 25 October 2026.

Image Viewer for GitHub is a Chrome extension that opens the images of a GitHub pull request or issue comment in a viewer on top of the page.

## What the extension handles

- **The images of one comment**, with their addresses and alt text. The extension reads them from the GitHub page only when you click an image, and only from the comment that holds it.
- **The address of the current GitHub page**, to check that it is a pull request or an issue.

## Where it is stored

Nowhere. The extension keeps the images of a comment in memory while the viewer is open, and forgets them when it closes. It uses no storage.

## What the extension does not do

- It does not send any data to the developer or to any other server. It shows the image from the same GitHub address that the page already uses, and contacts no other server.
- It runs on `github.com` only, and asks for no permission.
- It does not use analytics, advertising, or tracking.
- It does not sell or transfer your data to anyone.

## Removing your data

The extension stores no data. Remove it from Chrome at `chrome://extensions` to stop it.

## Contact

Open an issue in this repository: https://github.com/guplem/github-image-viewer/issues
