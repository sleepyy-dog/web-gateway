# CDP Extension Transport

`web-gateway` includes an optional CDP extension transport for Chrome / Edge.
It is not a second browser backend. It is a Chrome DevTools Protocol transport
implemented with the extension `chrome.debugger` API so normal use can avoid
Chrome remote-debugging authorization prompts.

## Model

- The extension is a Manifest V3 service worker under `extension/`.
- The local daemon is `scripts/cdp-proxy.mjs` with `CDP_TRANSPORT=extension`.
- The extension connects outward to `ws://127.0.0.1:3456/ext`.
- The daemon exposes the Web-Gateway CDP-mode HTTP API on `http://127.0.0.1:3456`.
- Browser control is performed by sending CDP commands through `chrome.debugger`;
  `chrome.tabs` is used only where the extension transport needs to locate,
  create, navigate, or close browser tabs.

This follows the same broad architecture as OpenCLI's Browser Bridge: one-time
extension installation, then local daemon communication. It does not require
Chrome's `chrome://inspect/#remote-debugging` toggle during normal use.

## One-Time Setup

This repository contains two independent unpacked extensions:

1. `${CLAUDE_SKILL_DIR}/extension` for the Web-Gateway CDP extension transport.
2. `${CLAUDE_SKILL_DIR}/extension/opencli` for OpenCLI Browser Bridge.

Chrome / Edge cannot load both from one `manifest.json`; load the two
directories separately when both Web-Gateway browser fallback and OpenCLI
browser-backed adapters are needed.

Start the daemon and check CDP extension transport connectivity:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-cdp.mjs"
```

If the extension is not connected, do not immediately switch to the CDP
fallback. The extension service worker or local daemon may need a few seconds
to reconnect after startup. Wait 10 seconds and re-run `check-cdp.mjs`, up
to two retries, for three total checks.

If all three checks still report that the extension is not connected, and the
user has not already confirmed that the extension is installed and enabled,
load it once:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select `${CLAUDE_SKILL_DIR}/extension`.
5. If OpenCLI Browser Bridge is also needed, choose "Load unpacked" again and select `${CLAUDE_SKILL_DIR}/extension/opencli`.
6. Re-run `node "${CLAUDE_SKILL_DIR}/scripts/check-cdp.mjs"` for Web-Gateway and `opencli doctor` for OpenCLI.

After this one-time browser permission, future `web-gateway` CDP-mode operations
can use the extension transport without the remote-debugging authorization prompt.

If all three `check-cdp.mjs` checks still fail after the extension is known
to be installed, use native CDP transport as the fallback. Native CDP may require Chrome's
`chrome://inspect/#remote-debugging` authorization prompt.

## API

The extension transport mirrors the common Web-Gateway CDP-mode endpoints:

```bash
curl -s http://127.0.0.1:3456/health
curl -s http://127.0.0.1:3456/targets
curl -s -X POST --data-raw 'https://example.com' http://127.0.0.1:3456/new
curl -s -X POST --data-raw 'https://example.com' "http://127.0.0.1:3456/navigate?target=ID"
curl -s -X POST "http://127.0.0.1:3456/eval?target=ID" -d 'document.title'
curl -s -X POST "http://127.0.0.1:3456/click?target=ID" -d 'button.submit'
curl -s -X POST "http://127.0.0.1:3456/clickAt?target=ID" -d 'button.upload'
curl -s -X POST "http://127.0.0.1:3456/setFiles?target=ID" -d '{"selector":"input[type=file]","files":["C:\\path\\file.png"]}'
curl -s "http://127.0.0.1:3456/scroll?target=ID&direction=bottom"
curl -s "http://127.0.0.1:3456/screenshot?target=ID&file=C:\\temp\\shot.png"
curl -s "http://127.0.0.1:3456/close?target=ID"
```

For URL-carrying endpoints, use POST body. This avoids truncating URLs that
contain `?`, `&`, or `#`.

## Capability Notes

The extension transport supports the common Web-Gateway CDP-mode actions:

- create / navigate / close tabs
- evaluate JavaScript
- click by selector
- dispatch mouse clicks at element centers
- set files on file inputs
- scroll
- screenshot

`chrome.debugger` is an alternate transport for Chrome DevTools Protocol
commands, but it is not a perfect replacement for a browser-level DevTools
WebSocket in every edge case. Keep native CDP transport as fallback when the
extension cannot attach to a target, a page is not debuggable, a workflow needs
an unsupported CDP domain or method, or a hidden/background target capability
must be verified against the current Chrome version.

## Security Notes

- The daemon binds only to `127.0.0.1`.
- The extension connects only to `127.0.0.1:3456`.
- The daemon rejects HTTP requests with ordinary web page `Origin` headers and
  only accepts WebSocket bridge connections from extension origins such as
  `chrome-extension://...`.
- The extension asks for `debugger` permission, which is powerful. Install it
  only from this local skill directory you control.
- Do not expose the daemon port beyond localhost.
