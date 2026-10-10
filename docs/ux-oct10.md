# Crates and appearance — 10 October 2026

The landing page now keeps only the founder's welcome line, rotating cozy greeting, entry link, and paper customizer. The original wordmark and app heading remain; arbitrary interface text uses the new self-hosted Inn Hand pixel handwriting font.

## Capture and browsing

- The 50 px drag/flick wheel lives inside the composer, with a wider, wrapping name area. Selecting it also browses that crate. All crates restores the combined recent list without changing the capture destination.
- Crate chips offer direct navigation. Customize first shows an overview with New crate, then the name, color, Lucide library, or drawn-icon editor. Drawings support 8, 16, and 32 px grids; changing resolution resamples the drawing, and Undo also restores its resolution.
- Retiring a crate asks whether to move its saves to another crate or recoverable trash. The crate itself can be restored under Retired crates. Tombstones participate in encrypted sync so an old device cannot silently resurrect a retired crate. Concurrent orphaned saves remain visible under All crates/Inbox.
- Notes copy their text; image cards copy a PNG representation; URL cards open their source and have a separate Copy link action. The bottom-left ellipsis opens info/edit, original attachments, date added, copy actions, and transcript. Original non-PNG files remain available for download.
- Clipboard capture reads and saves on a deliberate click. If browser permission is unavailable, ordinary paste remains available. On-device saving is automatic; the composer has no storage checkbox. Excluding a record from optional GitHub sync is an info setting.

## Appearance

`surface.js` draws deterministic irregular angular paper strokes and a separate grain layer with varying density. Colors, coverage, spread, position, arrangement, grain, drift speed, and motion are editable. Reduced-motion preferences are respected; stationary scenes stop repainting after transition.

Global defaults apply to landing and crates without overrides. Crates can derive their colors from their icon, or override paper and card settings. Backgrounds interpolate as navigation changes. Card layout supports compact, small, and large, with independent URL preview, title, subtext, media, domain, date, crate, and transcript visibility. Hidden fields remain searchable. Per-crate settings sync as part of the crate; global defaults are device preferences included in recovery backups.

Dialogs support backdrop/Escape dismissal and Save/Discard/Keep editing for changed drafts. Native dialog focus containment is retained.

## Voice

Recording and attached audio automatically use quantized Whisper tiny through vendored Transformers.js 3.8.1 and its pinned ONNX runtime. Only model files are downloaded from Hugging Face; audio is decoded and transcribed on the device in a module worker. The runtime/model download is about 65 MB on first use and is cached. Transcription can be turned off in Storage.

The original recording stays attached. Transcripts appear in the draft or saved record, are searchable/copyable, and persist through reload, backup, and encrypted sync. Saving can finish before recognition; the worker then updates the latest record without replacing a user's edits. Unfinished local jobs resume on reload, and failed recognition has a retry action in info. Audio/video bytes remain local under the existing sync rules.

Physical phone microphone/camera capture and mobile transcription performance still require device verification. Browser clipboard and media codec support vary. If the local model fails to load, the original audio stays saved.

## Validation

- 14 Node tests and 5 Python tests passed, including encrypted retention of crate appearance, retired-crate metadata, 32 px drawings, and transcripts.
- Real browser saves/reload, direct text and image copying, image clipboard capture, one-click text capture, all/one-crate filtering, long last-slot names, 8/32 px drawing, per-crate layout/title settings, Save on unsaved-dismissal, backdrop dismissal, crate retirement and restoration were exercised.
- A public [Transformers.js JFK speech fixture](https://huggingface.co/datasets/Xenova/transformers.js-docs/blob/main/jfk.wav) was transcribed by the browser model; its transcript survived saving/reload and appeared in info.
- Desktop 1280 px and phone 375 px layouts had no horizontal document overflow. The exact HTTPS Tailscale origin returned the app and metadata previews successfully. This is same-Mac verification, not a physical phone test.

References: [Transformers.js pipeline API](https://huggingface.co/docs/transformers.js/api/pipelines), [Whisper tiny model](https://huggingface.co/Xenova/whisper-tiny), [Gaegu source and SIL OFL](https://github.com/google/fonts/tree/main/ofl/gaegu).
