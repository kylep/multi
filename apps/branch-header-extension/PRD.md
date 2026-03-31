---
title: "Branch Header Chrome Extension"
summary: "Minimal Chrome extension to inject an X-Branch HTTP header for Traefik branch preview routing"
status: draft
owner: kyle
date: 2026-03-31
hidden: false
related: []
---

## Problem

Kyle uses Traefik-based branch preview routing that relies on an `X-Branch`
HTTP header to route requests to feature-branch deployments. The current
solution is ModHeader, a third-party Chrome extension that has had malware
and data-exfiltration incidents. ModHeader also requests broad permissions
and includes analytics/tracking that are unnecessary for this use case.

The requirement is simple -- inject a single custom header on requests to
a small set of known domains -- but no trustworthy, minimal tool exists
for it.

## Goal

Replace ModHeader with a self-controlled, minimal Chrome extension that
injects the `X-Branch` header on matching domains with no external
dependencies, no analytics, and no unnecessary permissions.

## Success Metrics

- ModHeader is uninstalled from Chrome and the new extension handles all
  branch-preview routing without workflow disruption.
- The extension requests only the permissions required to modify headers
  on the configured domain list (no `<all_urls>`, no host permission
  beyond the allow-list).
- Zero external network calls made by the extension (verifiable via
  DevTools network tab).

## Non-Goals

- **Not a general-purpose header editor.** This extension manages exactly
  one header (`X-Branch`). It does not support arbitrary header names,
  multiple headers, or request/response header inspection.
- **No per-tab or per-site configuration.** The header value is global.
  If it is set, it applies to all matching-domain requests.
- **No automatic branch detection.** The user types the branch name
  manually. There is no git integration, no API polling, no magic.
- **No Chrome Web Store publishing.** This is loaded as an unpacked
  extension for personal use.
- **No Firefox/Safari/other-browser support** in v1.

## User Stories

### Story: Set a branch for preview routing

As a developer, I want to type a branch name into the extension popup and
click Save so that all subsequent requests to my preview domains include
the `X-Branch` header with that value.

**Acceptance criteria:**
- [ ] After saving branch name "feature-xyz", requests to pai.pericak.com
      include the header `X-Branch: feature-xyz` (verifiable in DevTools).
- [ ] The saved value persists after closing and reopening the browser.
- [ ] The popup text input displays the currently saved value on open.

### Story: Clear the branch header

As a developer, I want to click Clear so that the `X-Branch` header is no
longer sent on any request.

**Acceptance criteria:**
- [ ] After clicking Clear, the text input is empty and the value in
      storage is cleared.
- [ ] Subsequent requests to matching domains do NOT include an `X-Branch`
      header (not even an empty one).
- [ ] Saving with an empty text field behaves identically to clicking Clear.

### Story: Domain-scoped header injection

As a developer, I want the header to only be injected on requests to
domains I control so that the extension does not leak branch information
to third-party sites.

**Acceptance criteria:**
- [ ] The header is injected only on requests matching domains in a
      configurable allow-list.
- [ ] The default allow-list contains: `pai.pericak.com`, `localhost`,
      `127.0.0.1`.
- [ ] Requests to domains not in the allow-list never include the
      `X-Branch` header.
- [ ] The allow-list is defined in a single location in the code,
      easy to update without touching business logic.

## Scope

**In v1:**
- Chrome Manifest V3 extension (service worker + popup).
- Popup with text input, Save button, Clear button.
- `chrome.storage.local` for persistence.
- `chrome.declarativeNetRequest` (or equivalent MV3 API) to inject the
  header on matching domains only.
- Configurable domain allow-list (code-level constant, not UI-editable).

**Deferred:**
- UI for editing the domain allow-list.
- Badge or icon state change to indicate when a branch is active.
- Any form of distribution or packaging beyond unpacked loading.

## Open Questions

- Should subdomains of allow-listed domains also match (e.g.,
  `api.pai.pericak.com`)? Current assumption: exact match only, but
  worth confirming during implementation.
- Does `chrome.declarativeNetRequest` in MV3 support the needed
  dynamic rule updates, or will `onBeforeSendHeaders` via
  `webRequest` be required? This is an implementation detail to
  resolve in the design doc.

## Risks

- **Manifest V3 API limitations.** Chrome's MV3 header modification APIs
  have more restrictions than MV2. If `declarativeNetRequest` cannot
  dynamically add/remove a header based on storage, a workaround using
  `webRequest` (which requires broader permissions) may be needed.
- **Localhost matching.** Chrome extensions sometimes treat `localhost`
  and `127.0.0.1` differently for permission scoping. Needs testing
  during implementation.
