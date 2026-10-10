# Independent encrypted crates — October 10, 2026

Crate sync is now implemented separately from the personal Storage room vault. Each destination has a repo, crate ID/path, independent encryption key, optional writer credential, visibility, and encrypted device registry. Multiple destinations can coexist with the all-crate private vault. Tokens and keys remain in session memory; only connection locations, visibility and last-sync times persist locally.

## Invitation and access

Copy crate invite puts the repo, crate ID and crate key in a URL fragment. The receiving app removes that fragment immediately and pre-fills its connection form; it does not auto-connect. No GitHub token is shared. A public repo allows unauthenticated ciphertext reads; private reads require a token with repo access. Writes use each contributor's own scoped Contents-write token. There is no direct peer-to-peer device transport: devices exchange data through their selected repositories.

Public here means **public repository containing encrypted content**, not plaintext publication. Anyone who has both the ciphertext and crate key can read that crate. Do not reuse a personal vault key as a shared crate key. Device names are encrypted inside that scope. Read-only clients show the registry but cannot announce their own presence without write authorization. Open clients poll every 30 seconds; last sync does not imply live presence.

## Boundaries and merge behavior

`scope.js` validates that a scoped file has exactly the expected crate and no records from other crates. Notes, transcripts, metadata, OCR and compressed images participate; original audio/video stays local. Moving a record out of a shared crate uploads an empty redaction tombstone, without its private destination or new content. The full local record is preserved. SHA conditional writes retry from fresh remote state; concurrent revisions are retained as conflict copies.

## Limits

20 MB encrypted-file limit, session-only unlocking and a mocked-transport test suite. A real two-device private/public sync trial remains to be done. Public Git history exposes sizes, timing and contributors, and retains older ciphertext. Removing a file or moving to trash does not revoke downloaded keys/content or erase history. Key rotation, revocation, roles, rollback protection and signed authorship require further design/security review.
