# Paste Inn — first-build scope

Updated 9 October 2026. The local-first core and experimental personal sync are now implemented; see [validation](validation.md) for verified behavior and remaining checks.

Originally scoped from the founder's completed [discovery brief](discovery-answers.txt). The answer file is the source of truth; proposed resolutions below are not additional user decisions.

## Product promise

Intentionally save something in a few seconds; find it when needed, ideally in under ten seconds. Replace self-messages and scattered bookmarks without requiring an organizing habit. The first audience is the founder, friends who want zero setup, and people collecting everyday life information.

Success after two weeks: fewer self-messages, daily use on phone and computer, fast retrieval, and actually using saved content. Do not measure success merely by the number of items collected.

## Confirmed first-platform direction

A responsive, installable web app. Native iPhone, Android, Mac, and Windows clients follow only after the web flow proves useful. Always-on desktop clipboard history is deferred. Capture is intentional: paste or share; ask before adding clipboard content.

## Selected launch formats and capture routes

Must-work formats selected in the interview:

- Links, including Instagram reels and YouTube URLs.
- Short notes.
- Pasted images and screenshots.
- Searchable text inside images (OCR).
- Taking a photo.
- Uploading existing audio and video.

Selected routes: one paste box, sharing from another app, dragging in files/images, a desktop keyboard shortcut, photo capture, and recording a voice note. Voice recording was selected as a capture route but not in the must-work format question: its first-release priority remains open. Native video capture is explicitly deferred. A browser shortcut should be scoped to the open app; a system-wide shortcut is a separate native capability.

For reels and videos, a link is sufficient for the first version. Preserve the original URL, optional user note, and optional attached screenshot. Fetch titles/previews when available without blocking capture. Offline copies are a later enhancement where technically permitted; do not promise preservation of inaccessible social content.

## Retrieval and organization

- Search by remembered words and OCR text.
- Filter or browse by approximate save date.
- Offer a visual grid.
- Recognize content type automatically.
- Support editable suggested tags and optional manual tags.
- Never require a folder or tag before saving.
- Support optional personal collections; “chests” is a design candidate, not a required vocabulary decision.
- Provide a small pinned area and quiet in-app revisit view.
- Surface the existing save on a duplicate; merging suggestions can follow later.
- No unsolicited notifications. User-requested reminders are desired; a weekly digest is explicitly later and opt-in.

## Privacy and ownership requirements

End-to-end encryption is required for sync. No advertising or analytics by default. Prefer OCR and transcription on device. Let users exclude sensitive items from sync.

Export requirements: readable Markdown and JSON, useful original filenames, original attachments, a complete archive, and a documented format. Provide a clear permanent-purge workflow for sensitive historical content; ordinary deletion is not enough.

**Proposed resolution:** encrypt content before uploading it to GitHub, and decrypt only on clients. Plaintext Markdown/JSON is an explicit local export, not a readable remote repository. Search and OCR should run on unlocked client data. Encryption scope should include notes, URLs, titles, tags, OCR output, filenames, and attachments; necessary protocol metadata can still reveal activity and approximate sizes. Do not present this as an implemented or audited security guarantee.

**Resolved in the working build:** downloadable random recovery key, saved-safe confirmation, the same token/key usable on multiple devices, and session-memory-only credentials. Local browser data remains unencrypted and is explicitly labeled. **Still to decide:** encrypted local storage and how permanent purge accounts for other devices and copies. Encryption cannot recall previously exported plaintext or copies another party already holds.

## GitHub sync

Optional setup via a private repository URL and token, with guided repository/token creation. The app must be usable locally before setup. The user's content repository is separate from the source repository, `evrenucar/pasteinn_app`.

Selected remote content: notes, links, metadata, small compressed images, and video links with notes. Large original audio/video was not selected for initial repo storage.

**Proposed resolution:** accept audio/video uploads locally and visibly label them “On this device” while syncing eligible records and small encrypted image payloads. Do not imply that an attachment is available on another device merely because its metadata has synced. Original image exports may depend on the original capture device if only a compressed version was synced; explicitly disclose that distinction.

A repo URL and token authenticate storage access; they are not an encryption recovery key. Friends can begin without GitHub setup, but cross-device use will require both storage connection and a secure way to unlock the vault. This is the principal tension between zero setup and user-owned encrypted sync.

Reliability requirements:

- Save locally before attempting network sync.
- Queue and retry when connectivity returns.
- Show the last successful sync.
- Keep both edits when devices conflict.
- Never report “synced” until confirmed.
- Separate current deletion from erasure of repository history.

Still to decide: attachment size cap, original-image preservation, local browser-storage durability and backup behavior, recovery flow, and a purge design whose limits are honestly stated.

## Visual direction selected

After hours; comfortable spacing; quiet corners. Curated themes rather than an extensive theme editor. Carry forward the analog grain, pixel handwriting accents, simple icons, and optional chest imagery from [the design notes](design-direction.md).

Plain verbs for actions, warm empty states and confirmations, with room for character in greetings and optional spaces. “Guests” and “concierge” are tonal references at this stage, not authorization for sharing or an AI assistant.

## Explicitly deferred

Sharing and group inns; public profiles and feeds; AI chat; task/calendar/project management; native video capture; background clipboard logging; native clients until the web experience is validated. Weekly digests and duplicate merging are later enhancements.

## Proposed implementation sequence

1. Prove capture and retrieval locally: text/links/images, camera photo capture, audio/video uploads, OCR, search/date filtering, grid, edit/delete, and export. Include clear attachment availability and storage status.
2. Finish the small personal organization layer: pinning, optional collections/tags, duplicate recognition, and a quiet revisit view. Keep reminders out of the initial engineering slice unless reprioritized.
3. Add encrypted GitHub sync after agreeing on recovery, attachment limits, and purge semantics. Validate offline queues, failure recovery, conflicts, and exports against real multi-device use.
4. Evaluate native capture conveniences only after the first two-week usage test.

These are engineering slices of the selected scope, not a decision to remove selected capabilities. The core web build now implements local capture, English image OCR, media/photo/voice controls, editing, tags, pinning, trash, backup/restore, and experimental encrypted personal GitHub sync. This is not a production security or cross-device validation claim. Reminders, a dedicated revisit view, permanent purge, native clients and shared chests are not implemented.

## Research context

The interview links official product information and public discussions. Research-informed priorities are dependable search, usable exports, and low capture friction. The Reddit sample is qualitative and time-bound; it is not market validation or a reason to expand the feature set.

## Later founder additions

Custom category icons can be chosen from Lucide or drawn on a pixel canvas. Shared chests should eventually have independent encryption secrets and may use public encrypted storage; repository write credentials must stay separate from shared chest keys. See [shared-chest direction](shared-chests.md). Visual refinement was explicitly paused to prioritize core functionality.
