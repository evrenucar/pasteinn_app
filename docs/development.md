# Paste Inn

A little space for links, images, thoughts, and loose ends.

**Status:** working local-first web build with experimental encrypted GitHub sync. Installable PWA with independent encrypted crate connections. Hosting and pasteinn.com setup still require the publishing step; native clients and production security review remain future work.

## Use as a web app

`dist/` is a complete static web app: no Python process or backend is required for capture, retrieval, local speech/OCR, backups, or GitHub sync. Publish this directory to HTTPS static hosting. Chrome can install it from General preferences → Install Paste Inn, or its app-install menu. The shared icon is the angled pixel p with an orange dot, supplied as SVG and 180/192/512 px PNGs. The offline shell includes the landing page and app. On first use the speech model still downloads from Hugging Face.

A new hosted origin has a separate browser database: export/restore a backup or unlock GitHub sync to move existing saves. Rich remote link metadata currently uses the optional development helper; plain static hosting falls back to domain/URL previews.

## Optional local development preview

```sh
python3 -B server.py --port 4174
```

- `http://127.0.0.1:4174/concept.html` — app.
- `http://127.0.0.1:4174/landing.html` — landing page.
- `http://127.0.0.1:4174/discovery.html` — original discovery interview; `/` opens the landing page.

No npm install or build is required. Vendored dependencies and licenses are in `dist/vendor/`. `dist/` contains authored source, not generated output. The Python server is a **loopback-only development preview**, not a production server. A plain static server supports local capture but cannot fetch link metadata.

## Save and retrieve

Paste a note, URL, or clipboard image; drag in a file; or use **＋**. Pick a crate and press **Paste inn** (Cmd/Ctrl+Enter). Saves commit to IndexedDB before reporting success. Crates and global/general appearance preferences use localStorage. Data belongs to the browser origin: changing host or port creates a separate store; clearing browser data removes it.

- Images: thumbnails, original-file download, automatic local English OCR and searchable recognized text.
- Links: non-blocking title/domain/thumbnail previews, an original-link fallback, duplicate recognition, and an optional note/screenshot.
- Media: images up to 20 MB; audio/video up to 50 MB; up to eight attachments per save. Audio/video play directly on cards when the browser supports their codec; generated filenames are hidden. Transcripts have their own copy button, and an additional note can be edited independently.
- Photo input invokes the camera on supporting mobile browsers. Voice recording uses a permission prompt and a five-minute cap. Automatic on-device Whisper transcription retains the recording and searchable transcript. First use downloads about 65 MB of runtime/model files; Storage can disable transcription.
- Use the bottom-left info button to edit its title, note, crate, or tags; pin it; exclude it from sync; or move it to recoverable trash. Filters include dates, pinned saves, and trash.
- Crates include To do, custom names/colors, 1,800+ bundled Lucide icons, and an 8×8 / 16×16 / 32×32 drawn-icon editor with eraser and undo. Customize opens a crate overview; retiring a crate offers moving its contents or recoverable trash, and the crate can be restored.

The app shell is cached by a service worker after the first online visit. OCR engine/model files cache on first use. A manifest supplies standalone-app metadata and a GET text/link share target where supported. Install/share integration, camera, microphone, and codecs still need real-device verification. Native background clipboard logging is not implemented.

## Appearance and card actions

The wheel defaults to the right beside the input, with up/down arrows on the left; it moves below the capture buttons on narrow screens. General preferences can change its side or keep it below at every width. Search spans Storage room and includes URLs, link notes, OCR and transcripts regardless of card display toggles; date/pinned/trash filters still apply.

Use **Make it yours** for paper colors, patch distribution, grain, and optional drift. Apply settings globally or to one crate. Crate colors can follow their icons and backgrounds blend while switching. Cards support compact/small/large layouts and separate preview, title, subtext, media, domain, date, crate, and transcript toggles. Global defaults are local preferences included in backups; per-crate settings are included in GitHub sync.

Click a URL card to open its source; click text or an image to copy it. Each card’s bottom-left ellipsis opens info/edit and copy actions. The small clipboard button pastes and saves in one click, subject to browser permission.

## Backups

Open the storage icon → **Export backup**. The ZIP includes `pasteinn.json`, readable Markdown in `notes/`, and original locally available attachments in `attachments/`. **Restore backup** validates and merges it; divergent revisions become separate copies. Backups contain plaintext and no GitHub token or encryption recovery key. Keep them somewhere safe.

Browser persistent-storage permission is optional and is not a backup guarantee. Exports are capped at 190 MB to stay inside the import limit; larger libraries need individual attachment downloads until streaming archives are implemented. Imported archives are capped at 200 MB expanded, with a 60 MB per-file cap and 20 MB manifest cap in this first implementation. Local media received through sync may be a compressed image or an unavailable-original placeholder; export originals from the capture device.

## Optional GitHub sync · Storage room or individual crates

**Sync it** (connection icon) or Storage → **Connect GitHub**:

1. Create a separate private content repository. Do not use this source repository.
2. Create a fine-grained token scoped to that repository with **Contents: read and write**.
3. Create/download a recovery key, save it somewhere safe, and confirm that you have done so.
4. Connect. On another device enter the same repo, token, and recovery key.

The token and key stay only in the open page's memory. Reloading requires unlocking again; the non-secret repo name and last-success time are remembered. AES-256-GCM encrypts the entire sync payload before GitHub receives it. Local browser data and exports remain unencrypted. There is no recovery-key reset.

Sync includes notes, URLs, metadata, OCR text, transcripts, crates and their appearance settings, and small images. Images over 512 KB are converted to WebP with a 1,600 px maximum edge, then capped at 2 MB each. Originals are retained locally. Audio/video bytes remain on their capture device. The encrypted vault file has an early 20 MB cap; capacity or network errors leave local saves intact and show an explicit failure.

The implementation fetches and merges revisions, retries conditional-write conflicts, preserves concurrent edits, queues changes while the page is open, retries when connectivity returns, and avoids uploading unchanged revisions. Opening/unlocking another device fetches its remote changes. Open pages refresh every 30 seconds. A device name can be assigned in General preferences or the sync dialog; the encrypted device registry shows known writer devices and their last sync, not a claim that they are online. Read-only public clients cannot register their presence without a writer credential. GitHub history is not purged by moving an item to trash or marking it device-only.

Select a crate in Sync scope to connect it independently, including when Storage room already has a private sync connection. Another connection adds an additional repo destination. A crate uses `pasteinn/crates/<crate-id>.json` with an independent key, and only that crate's records and metadata are serialized. Public repositories contain encrypted content; their visibility is shown as `(public repo · encrypted)`. **Copy crate invite** includes only repo, crate ID, and crate key in the URL fragment. It never includes a GitHub token. Public readers can leave the token blank; private readers need repo access, and contributors need their own scoped write token. Local changes on read-only connections stay local.

The personal all-crate vault remains `pasteinn/vault.json` in a private repository. Shared crate invites must use separate keys; never reuse or share the personal recovery key. Audio/video bytes still remain on the capture device; their transcripts sync. Revocation/key rotation, membership management, and signed authorship are future work.

This is **experimental, unaudited encryption/sync code**. Automated tests use a mocked GitHub transport; no real user content repository has been connected during development. See [storage protocol](docs/storage-protocol.md) and [validation](docs/validation.md).

## Validation

```sh
node --test tests/*.test.cjs
python3 -B tests/server_test.py
```

Node 20+ with Web Crypto and Python 3.11+ are suitable for the test suite. The app itself uses standard browser APIs.

## Product/design references

- [Founder discovery answers](docs/discovery-answers.txt)
- [Scope and deferred work](docs/product-scope.md)
- [Design direction](docs/design-direction.md)
- [Generated asset provenance](docs/design-assets.md)
- [Crates, appearance, voice and validation](docs/ux-oct10.md)
- [Independent shared crates and limits](docs/shared-chests.md)

Never commit tokens, recovery keys, private captures, or exported personal backups into this source repository.

## Cross-device testing with Tailscale

Use the Mac's Tailscale HTTPS hostname for device tests. The current development mapping uses **HTTPS 8443 → local 4174**, preserving the other app on HTTPS 443.

```sh
tailscale status --json
tailscale serve status --json
python3 -B server.py --port 4174 --allowed-origin https://YOUR-MAC.YOUR-TAILNET.ts.net:8443
# In another terminal, once the server is running:
tailscale serve --bg --https=8443 http://127.0.0.1:4174
```

Open `https://YOUR-MAC.YOUR-TAILNET.ts.net:8443/concept.html` from devices connected to the tailnet. The Mac must remain running/awake. Serve is tailnet-only; no public Funnel is enabled. Use the HTTPS hostname rather than a raw HTTP Tailscale IP for [secure browser APIs](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts). [Tailscale Serve reference](https://tailscale.com/docs/reference/tailscale-cli/serve).

This origin has its own browser database. Existing `http://127.0.0.1:4174` saves remain there; export/restore a backup or configure GitHub sync to move them. The local preview server still binds only to loopback; the explicit origin flag allows its metadata endpoint behind the trusted proxy.

To remove only this test mapping when requested: `tailscale serve --https=8443 off`. Do not reset all Serve routes.
