# Browser Extension Backend

`web-gateway` now includes an optional browser-extension backend for Chrome / Edge.
It is meant to avoid Chrome remote-debugging authorization prompts during normal
use.

## Model

- The extension is a Manifest V3 service worker under `extension/`.
- The local daemon is `scripts/webext-proxy.mjs`.
- The extension connects outward to `ws://127.0.0.1:3457/ext`.
- The daemon exposes a CDP-proxy-like HTTP API on `http://127.0.0.1:3457`.
- Browser control is performed through extension APIs, mainly `chrome.debugger`
  and `chrome.tabs`.

This follows the same broad architecture as OpenCLI's Browser Bridge: one-time
extension installation, then local daemon communication. It does not require
Chrome's `chrome://inspect/#remote-debugging` toggle.

## One-Time Setup

This repository contains two independent unpacked extensions:

1. `${CLAUDE_SKILL_DIR}/extension` for the Web-Gateway browser backend.
2. `${CLAUDE_SKILL_DIR}/extension/opencli` for OpenCLI Browser Bridge.

Chrome / Edge cannot load both from one `manifest.json`; load the two
directories separately when both Web-Gateway browser fallback and OpenCLI
browser-backed adapters are needed.

Start the daemon and check extension connectivity:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-webext.mjs"
```

If the extension is not connected, do not immediately switch to the CDP
fallback. The extension service worker or local daemon may need a few seconds
to reconnect after startup. Wait 10 seconds and re-run `check-webext.mjs`, up
to two retries, for three total checks.

If all three checks still report that the extension is not connected, and the
user has not already confirmed that the extension is installed and enabled,
load it once:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select `${CLAUDE_SKILL_DIR}/extension`.
5. If OpenCLI Browser Bridge is also needed, choose "Load unpacked" again and select `${CLAUDE_SKILL_DIR}/extension/opencli`.
6. Re-run `node "${CLAUDE_SKILL_DIR}/scripts/check-webext.mjs"` for Web-Gateway and `opencli doctor` for OpenCLI.

After this one-time browser permission, future `web-gateway` browser operations
can use the extension backend without the remote-debugging authorization prompt.

If all three `check-webext.mjs` checks still fail after the extension is known
to be installed, use CDP as the fallback. CDP may require Chrome's
`chrome://inspect/#remote-debugging` authorization prompt.

## API

The extension backend mirrors the common CDP proxy endpoints:

```bash
curl -s http://127.0.0.1:3457/health
curl -s http://127.0.0.1:3457/targets
curl -s -X POST --data-raw 'https://example.com' http://127.0.0.1:3457/new
curl -s -X POST --data-raw 'https://example.com' "http://127.0.0.1:3457/navigate?target=ID"
curl -s -X POST "http://127.0.0.1:3457/eval?target=ID" -d 'document.title'
curl -s -X POST "http://127.0.0.1:3457/click?target=ID" -d 'button.submit'
curl -s -X POST "http://127.0.0.1:3457/clickAt?target=ID" -d 'button.upload'
curl -s -X POST "http://127.0.0.1:3457/setFiles?target=ID" -d '{"selector":"input[type=file]","files":["C:\\path\\file.png"]}'
curl -s "http://127.0.0.1:3457/scroll?target=ID&direction=bottom"
curl -s "http://127.0.0.1:3457/screenshot?target=ID&file=C:\\temp\\shot.png"
curl -s "http://127.0.0.1:3457/close?target=ID"
```

For URL-carrying endpoints, use POST body. This avoids truncating URLs that
contain `?`, `&`, or `#`.

## Capability Notes

Extension backend supports the common web-gateway browser actions:

- create / navigate / close tabs
- evaluate JavaScript
- click by selector
- dispatch mouse clicks at element centers
- set files on file inputs
- scroll
- screenshot

It is not a complete replacement for raw CDP in every edge case. Keep CDP proxy
as fallback when the extension backend cannot attach to a tab, a page is not
debuggable, or a workflow needs an unsupported CDP method.

## Security Notes

- The daemon binds only to `127.0.0.1`.
- The extension connects only to `127.0.0.1:3457`.
- The daemon rejects HTTP requests with ordinary web page `Origin` headers and
  only accepts WebSocket bridge connections from extension origins such as
  `chrome-extension://...`.
- The extension asks for `debugger` permission, which is powerful. Install it
  only from this local skill directory you control.
- Do not expose the daemon port beyond localhost.
