# Web app and retrieval pass — 10 October 2026

- Wheel defaults right, arrows left; placement is a general preference and narrow layouts place it below capture tools. 375 px and 1100 px layouts have no horizontal overflow, and wheel geometry is contained in the composer.
- Parametric paper drifts using elapsed time. Floating-point palette interpolation replaces rounded per-frame hex steps; alternate arrangements crossfade over 1.2 seconds. Grain remains anchored and OS reduced-motion remains respected.
- Landing has 60 unique greetings in a persistent shuffled bag, including no immediate repeat at a bag boundary. Original headline stays unchanged. Entry arrow is an original chunky pixel SVG.
- Manifest uses relative scope/start URL, consistent angled-p SVG and 180/192/512 PNGs. Chrome install prompt is captured when available; other platforms receive the standard install steps. The service worker caches landing and app shells. Root opens landing; discovery is preserved at discovery.html.
- Inline audio/video controls, transcript/copy and optional separate text; automatic filenames and duplicated transcript text disappear. Title/media/date/crate settings still apply. Info/Edit keeps access to originals and editable notes.
- Search event handlers resolve the current renderer, eliminating the old bound-function bug. Search spans all crates and covers URLs, note text, transcript, attachment transcripts, OCR and metadata. Accent/whitespace normalization and word matching are covered by tests.
- Independent crate repo connections, encrypted public-repo sharing, fragment invites, session-only secrets and device registry are documented in shared-chests.md.

## Verification

24 Node tests (14 existing + 10 new) and 5 Python helper tests passed. New transport tests prove scope isolation, public read-only requests without Authorization, wrong-key/mixed-scope rejection, encrypted device registration, and conditional-write retries. Source syntax, duplicate IDs and manifest/icon asset references checked. Browser transcript search retrieved the supplied voice note while Inbox was selected; its native player changed to pause directly on the card. General side preferences saved and restored. Phone-width wheel containment was verified and screenshots saved. No live user content repo or physical second-device sync has been connected during testing.

## Deployment

Static dist has no Python requirement. Existing Tailscale preview is still Mac-hosted. Production publication needs the approved Sites source workflow, then private deployment and domain configuration. Metadata enrichments use the optional development preview helper; on plain static hosting links fall back to domain/URL. Native background clipboard capture remains outside the web app.
