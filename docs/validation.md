# Core-build validation — 9 October 2026

## Automated

`node --test tests/*.test.cjs` — 13 passing tests:

- AES-GCM round trip, unique IVs, wrong-key rejection and authenticated-ciphertext tamper rejection.
- Descendant and concurrent revisions; idempotent conflict copies; concurrent delete/edit preservation.
- Repository and record input guards.
- Mocked GitHub integration: encrypted upload; no persisted tokens/keys; wrong key and public repo cannot write; conditional-write retry preserving both devices' records; exclusion redactions and local media originals; offline state never claims a successful upload.

`python3 -B tests/server_test.py` — 5 passing tests:

- Public-address pinning; private/loopback/link-local and mixed DNS rejection.
- Scheme, credentials, port and control-character rejection. Explicit HTTPS reverse-proxy origins accepted; unrelated origins rejected.
- Metadata extraction as text.

The mock transport uses inert test tokens and does not contact a real content repository.

## Browser verification

- A real PNG was written to the browser clipboard and pasted with Cmd+V. The pending thumbnail and saved image appeared; the save survived reload.
- A public Paste app URL produced a real title, domain, description and thumbnail and persisted after reload.
- Custom category creation, icon search, color choice, pixel drawing, undo, save and reload were exercised.
- A screenshot was captured/pasted/saved. Self-hosted Tesseract extracted text on device; searching a word only present inside the image retrieved it.
- Editing a saved title and tags persisted and updated the grid.
- Backup export produced a ZIP with three JSON records, three Markdown files and two original image attachments. ZIP CRC validation passed. Import restored/merged those records without duplicates.
- The preview server was stopped and the app reloaded from its service-worker cache with saved images intact; the server was restored afterward.
- The GitHub connection form fit a 375 px viewport without horizontal overflow.

## Remaining validation

- Live GitHub setup and two independent devices, including reconnection after token expiry and a prolonged offline period. The source repository was not connected as a content store.
- Real-device camera, microphone, media codecs, installability and platform share target support. No microphone/camera permission was granted during automated UI work.
- Storage quota failures on representative mobile browsers and large-library performance.
- Independent security review, threat modeling, migration/recovery exercises and cryptographic rollback/sender-authenticity design before production claims.
- Domain deployment, HTTPS metadata-service hosting, native clients, permanent purge and shared chests remain outside this build.

Tailscale follow-up: the HTTPS app and metadata endpoint returned successfully through Serve on port 8443 with normal certificate validation. The pre-existing HTTPS 443 mapping remained intact. This verifies the local tailnet endpoint, not connectivity from an actual second device.


## October 10 web-app pass

See [web-app verification](web-app-oct10.md): 24 Node tests and 5 Python tests now pass. Independent crate connections and public encrypted sharing replace the former shared-chests deferral. Production publication, real-device install/media checks, live two-device sync and independent security review remain pending.
