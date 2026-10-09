# Storage and synchronization v1

## Local records

IndexedDB database `pasteinn-saves`, version 1, object store `saves`, key `id`. Records contain `title`, `body`, `url`, `category`, `type`, `createdAt`, `updatedAt`, `revision`, `ancestors`, optional `metadata`, `ocrText`, `tags`, `pinned`, `deleted`, `localOnly`, plus `images` and `media` descriptors. Locally available descriptors contain a Blob. IDs are random UUID-derived values; filenames are preserved separately.

Each local mutation generates a revision UUID and carries forward up to 1,000 ancestor revisions. A descendant supersedes its ancestor. Concurrent versions are retained deterministically as the original and a `-conflict-<revision>` copy. A concurrent deletion keeps a tombstone and preserves an edited copy. This favors extra recoverable copies over silently dropping data when ancestry is incomplete.

Categories are stored under `pasteinn-preview-categories-v1` in localStorage and use the same revision scheme for synchronization. Built-in default categories are seeded locally. A custom drawing is a 256-character monochrome bitmap; its color is stored separately. Category choice is never required before saving.

## Backup format

ZIP root `pasteinn.json` has `format: pasteinn-backup-v1`, `exportedAt`, `categories`, and `records`. Attachment descriptors use relative `path` values under `attachments/<record-id>/<file-id>-<filename>`, with MIME types, names, and compression/original-name flags. `notes/<record-id>.md` provides readable note text, attachment links, and OCR output. A README explains plaintext handling.

Import checks format, shape, URLs, IDs, category icons/colors, attachment MIME types, and file existence. ZIP expansion has explicit limits. The archive never contains authentication tokens or the recovery key. Unknown future formats fail rather than silently changing content.

## Encrypted personal vault

GitHub path: `pasteinn/vault.json`, on the content repository's default branch. The transport currently requires a private GitHub.com repository. It never uses the Paste Inn source repository.

Envelope fields:

```json
{"format":"pasteinn-vault-v1","iv":"<base64 12 random bytes>","ciphertext":"<base64 AES-GCM ciphertext including tag>"}
```

A fresh 96-bit IV is generated for every encryption operation. AES-256-GCM uses `pasteinn-vault-v1` as authenticated additional data and the browser's default 128-bit tag. Keys are 32 cryptographically random bytes, represented as `pi1_` plus unpadded base64url. Web Crypto imports a non-extractable key. The exportable recovery string exists during setup and in the user's explicitly downloaded key file; neither key nor token is written to browser persistence by the app.

The decrypted payload has `format: pasteinn-sync-v1`, `records`, and `categories`. Small image bytes are base64 inside the encrypted payload. Large animated images may become a still WebP preview; the original remains on the capture device. Audio/video only have encrypted descriptors; no remote media bytes are implied. The outer format, ciphertext size, Git commit author/time, repository access, and update activity are not hidden. TLS remains necessary. This scheme has no independent audit and no sender signatures or rollback protection.

Before writing, the browser authenticates to GitHub, verifies repository privacy, fetches the file, and decrypts/validates it. Wrong-key failures prevent any overwrite. Reads over GitHub's 1 MB embedded-content threshold use the API's raw media type on the fixed API host, never an arbitrary authenticated download URL.

Writes supply the fetched blob SHA. A 409/422 causes a bounded refetch/merge/retry; failure is shown without discarding local records. Local storage is reread after upload so edits made during a network request remain queued. A successful response or a verified unchanged remote revision set can update the last-success label. Transport failures are not labeled synced.

`localOnly` produces an encrypted redaction tombstone for that record's current remote state and preserves the full local copy. It cannot remove prior Git history or another device's previously saved/exported copies. Ordinary trash is recoverable and is not permanent purge.

## Link previews and OCR

Clipboard images and image OCR stay on device. Tesseract 7, its matching 7.0.0 core builds, and English model data are self-hosted. OCR currently assumes English and can be inaccurate, especially for handwriting or stylized text.

The development metadata helper receives only a link URL. It fetches public HTTP(S) HTML without cookies or credentials, pins validated public DNS addresses for each request, revalidates redirects, disallows nondefault ports, limits bytes/time, requires a same-origin custom header, and avoids logging URLs. It is not a production metadata service. Thumbnail requests go directly to the advertised public image URL with no referrer. No third-party preview SaaS is used.

## Sources

- [GitHub repository contents API](https://docs.github.com/en/rest/repos/contents)
- [Web Crypto AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [Clipboard paste events](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Open Graph metadata](https://ogp.me/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [fflate](https://github.com/101arrowz/fflate)
