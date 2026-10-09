# Project working preferences

Before substantial implementation, extension, review, or release work, check for built-in features or a simpler existing solution. Give an early heads-up about what custom work adds; this is advice, not an extra approval gate. Respect the founder's explicit choice to continue Paste Inn.

Prioritize core capture/retrieval/recovery/sync over further visual refinements unless requested. Keep the interface sparse. Shared chests remain future work with independent chest encryption keys, separate from repository credentials.

## Cross-device test links

- Use the development Mac's Tailscale address for links intended for the founder's other devices; do not send only localhost links.
- Discover the current address with `tailscale status --json`. Prefer the Tailscale HTTPS hostname so browser encryption, clipboard, service-worker and media APIs get a secure context.
- Inspect `tailscale serve status --json` before changing routes. Preserve other applications. Paste Inn currently uses HTTPS port 8443 → loopback port 4174; port 443 is used by another app.
- Run `server.py` with an explicit `--allowed-origin https://<current-tailscale-host>:8443` for metadata requests through the reverse proxy. Do not use wildcard origin acceptance or public Funnel for device tests.
- Localhost and Tailscale HTTPS are different browser storage origins. Preserve local data; explain backup restore or GitHub sync when changing the test URL.
- Verify the HTTPS page and metadata endpoint before sharing a link. A same-Mac check does not establish that a phone's Tailscale connection or camera/microphone works.
