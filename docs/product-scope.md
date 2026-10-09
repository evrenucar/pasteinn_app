# Product scope and open decisions

## Core concept

Save things intentionally into one personal inbox, with minimal effort and dependable retrieval. The product should replace scattered self-messages, screenshots, bookmarks, and loose notes without growing into a task manager or social feed.

## Current deliverable

A discovery interview and illustrative design previews. Choices still need to be made; unselected interview answers must not be treated as approval or rejection of a feature.

## Initial sync direction

Explore a private GitHub repository connected using its URL and a narrowly scoped token. This is a user-content store, distinct from the private `evrenucar/pasteinn_app` source repository.

Before building sync, resolve:

- Which formats and attachment sizes belong in GitHub.
- Offline saves and a retry queue with accurate status.
- Concurrent edits, conflicts, duplicate handling, and recovery.
- Token setup, storage, expiry, revocation, and reconnect flow.
- Exported file format and migration to a different storage provider.
- Deletion from current state versus permanent erasure from Git history.
- Whether readable private files or end-to-end encryption is the intended privacy model.

A private repo is not end-to-end encryption. GitHub's file and repository constraints make large or frequently changing videos a poor default workload. Avoid promising video-library sync before choosing a suitable media store or explicit limits.

## Capability vision

Links (including Instagram and YouTube), short notes, images/OCR, voice recordings, photo capture, and video capture. A responsive web app first is a proposed route, not a decision to remove native clients. Background system clipboard history would require platform-specific work and explicit opt-in; a normal website cannot silently monitor the system clipboard.

## Future work already deferred

Sharing, group paste inns, and shared collections. Do not reintroduce these into the initial build by treating the new chest metaphor as authorization for collaboration features.

## Research-informed priorities

The interview's research section links the underlying sources. The small qualitative scan suggests emphasizing usable exports, predictable search, and low-effort capture. Some people want to revisit saves; others want reliable retrieval only when needed. These observations are hypotheses to validate, not quantified market research or a reason to copy every competitor feature.

## Next decision

Review the founder's interview answers and incoming references, then choose a bounded first prototype. Test it with real saves before widening the feature set.
