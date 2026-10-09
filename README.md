# Paste Inn

A quiet place for links, thoughts, screenshots, and other things worth keeping. Copy it. Paste it inn. Find it when you need it.

**Status:** product discovery. This repository contains a working interview and design-direction preview, not the capture/sync application yet.

## Try the discovery interview

No installation or build is required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173/. If another preview is already using this port, use 4174.

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

See [the design notes](docs/design-direction.md) and [product scope](docs/product-scope.md).

The latest inspiration adds subtle analog noise, occasional pixel handwriting, simple icons and categories, and possible “chests” for collections. These are exploratory directions rather than approved final UI decisions. The existing three theme previews predate that reference.

## Project contents

- `dist/` — self-contained discovery interview; these are authored source files, not generated build output.
- `docs/` — current product and design notes.
- `references/` — user-supplied visual inspiration, for reference rather than redistribution as product artwork.

## Validation

```sh
node --check dist/app.js
```

The discovery UI has been manually checked for multiple selections, option editing, appearance changes, and brief read-back. Production capture, OCR, recording, GitHub sync, authentication, and native clients are not implemented.
