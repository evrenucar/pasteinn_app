# Paste Inn

A quiet place for links, thoughts, screenshots, and other things worth keeping. Copy it. Paste it inn. Find it when you need it.

**Status:** product discovery and interactive visual prototypes. This repository contains a landing page, a session-only app preview, and the discovery interview. Durable capture and encrypted sync are not implemented yet.

## Try the discovery interview

No installation or build is required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open these routes on the server's port:

- `/landing.html` — landing page, interactive format examples, product intentions, and FAQ.
- `/concept.html` — simplified app preview with a draggable category wheel, session-only text/link capture, recents, search, category filtering, and two appearances.
- `/index.html` — original discovery interview, with browser-local saved answers.

If another preview is already using port 4173, use 4174. The current project preview runs on port 4174; the earlier interview remains on port 4173. They have separate browser storage.

The interview includes 20 multi-select questions, editable options, custom answers, three visual directions, source-linked competitor/Reddit research, and a generated brief. Answers are stored in browser local storage and can be copied or downloaded. They are not stored in this repository or automatically synced between devices. Changing the preview origin or port gives it separate browser storage.

## Working direction

- One simple personal capture inbox, with quick saving and dependable retrieval.
- Full vision: links, short notes, images with OCR, voice recordings, photos, and video.
- Start with a clean web experience; prioritize native iOS, Android, and desktop capture based on actual needs.
- Explore optional synchronization through the user's private GitHub repository using a repository URL and a narrowly scoped token.
- Keep sharing and group inns in future work.
- Maintain portability and a replaceable storage layer. Media limits, conflicts, offline saves, and token handling need design before implementation.

The source-code repository is separate from each user's eventual private content repository. Never commit tokens, personal saved content, or browser answer data here.

## Design direction

See [the completed discovery answers](docs/discovery-answers.txt), [the design notes](docs/design-direction.md), and [first-build scope](docs/product-scope.md).

The selected direction is an installable web app, After hours styling, and end-to-end encrypted optional sync. The scope document distinguishes confirmed requirements from proposed resolutions for exports, media storage, and recovery.

The latest inspiration adds subtle analog noise, occasional pixel handwriting, simple icons and categories, and possible “chests” for collections. These are exploratory directions rather than approved final UI decisions. The existing three theme previews predate that reference.

## Project contents

- `dist/` — self-contained landing page, app prototype, interview, and assets; these are authored source files, not generated build output.
- `docs/` — current product and design notes.
- `references/` — user-supplied visual inspiration, for reference rather than redistribution as product artwork.

## Validation

```sh
node --check dist/app.js
node --check dist/concept.js
node --check dist/landing.js
```

The discovery UI has been manually checked for multiple selections, option editing, appearance changes, and brief read-back. The app preview has been checked for category selection, drag/flick snapping, keyboard alternatives, note capture into the chosen category, filtering, and narrow/wide layouts. Landing-page example switching was checked. Touch-device inertia still needs testing on real phones. Production storage, OCR, recording, GitHub sync, authentication, and native clients are not implemented.
