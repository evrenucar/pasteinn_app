# Future shared chests

Founder direction: a separate secret for each chest, with encrypted data potentially stored in a public repository and a simple invitation to share access. This is **future work**, not a feature of the current personal sync UI.

Use two distinct concepts:

- **Chest encryption key:** grants the ability to decrypt that chest. Generate an independent random key per chest; never reuse a personal vault key. An invitation could include repository/chest location and the key, preferably in a URL fragment that is not sent as an HTTP request parameter. Treat it as a bearer secret, and avoid leaking it into logs, previews, analytics, or referrers.
- **Repository write authorization:** grants the ability to publish changes. A personal GitHub token is repository-scoped and must not be shared as a chest invitation. Public encrypted content can be read without a GitHub token, but collaborative writes need an appropriate collaborator credential, a narrowly designed GitHub App, or a separate publishing service.

The current code separates cryptography/revision merging (`sync-protocol.js`) from GitHub transport (`sync.js`). A future chest adapter should use chest-scoped paths/manifests and independent keys. The first version still has one encrypted personal vault at `pasteinn/vault.json`; category boundaries are organizational, not cryptographic isolation. Migrating to per-chest keys requires an explicit format/migration change.

Public repositories expose history, ciphertext sizes, timestamps, contributor identities, and access to indefinite copies of encrypted material. Key rotation can protect future additions; it cannot revoke plaintext or ciphertext/key combinations already downloaded. Deleting current files does not erase Git history. Membership changes, write roles, key distribution/rotation, rollback protection, and signed authorship need design before group editing ships.

Avoid broadening the current app into a social feed or permissions dashboard. The intended surface remains a chest and an explicit, understandable share action.
