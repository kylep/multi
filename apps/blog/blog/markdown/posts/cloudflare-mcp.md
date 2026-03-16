---
title: "Cloudflare MCP: Query DNS and the Full API"
summary: Connecting Cloudflare's remote MCP server to Claude Code so it can
  query DNS records, zone configs, and the full Cloudflare API from the
  terminal.
slug: cloudflare-mcp
category: dev
tags: Cloudflare, MCP, Claude-Code, DNS
date: 2026-03-12
modified: 2026-03-15
status: published
image: cloudflare-mcp.png
thumbnail: cloudflare-mcp-thumb.png
imgprompt: a cloud with a small orange shield icon in front of it, flat
  minimal vector style, white background
---

This is a companion to the [GA4 MCP post](/ga4-mcp.html). Same idea,
different service. Cloudflare ships a remote MCP server that covers
their entire API. You connect it to Claude Code, authenticate via
OAuth in your browser, and then Claude can query your Cloudflare
account directly.

I [moved my DNS to Cloudflare](/dns-xfer-godaddy-cloudflare.html) a
while back and use the CDN proxy on
[kyle.pericak.com](https://kyle.pericak.com). The MCP server lets me
check DNS records, zone settings, and account details without opening
the dashboard. Read-only access is fine for this.


# How it works

Cloudflare's MCP server is different from most. It has
[thousands of API endpoints](https://developers.cloudflare.com/api/),
but instead of exposing one tool per endpoint, it exposes two:
`search` and `execute`.

`search` queries the OpenAPI spec to find the right endpoint.
`execute` runs JavaScript code server-side against the Cloudflare
API using a
[`cloudflare.request()`](https://github.com/cloudflare/mcp)
function. Claude writes the code, the server runs it, and the
result comes back.

Cloudflare calls this
"[Code Mode](https://blog.cloudflare.com/code-mode-mcp/)."
The full Cloudflare API (2,500+ endpoints) fits in about 1,000
tokens of tool definitions instead of 1.17 million for native
MCP with full schemas.


# One command to connect

```bash
claude mcp add --transport http cloudflare-api \
  https://mcp.cloudflare.com/mcp
```

This adds the server to your `~/.claude.json` under the current
project. Restart Claude Code and run `/mcp` to confirm it shows up.


## OAuth

The first time Claude calls a Cloudflare tool, your browser opens to
an authorization page. You pick an access level:

- **Read Only** (recommended): view resources without making changes
- **Workers Full Access**: full access to Workers, KV, D1, R2
- **DNS Full Access**: full access to DNS records and zone settings
- **Advanced**: pick individual permissions

You can always re-auth later with broader
permissions if you need to manage Workers or edit DNS from the
terminal.

After you log in and grant access, the OAuth token is cached
in `~/.mcp-auth/` (by the
[mcp-remote](https://github.com/geelen/mcp-remote) transport
layer). Delete that directory to force re-authentication or
change access levels.


# Querying my account

## List zones

```
> What zones do I have in Cloudflare?
```

Claude called `execute` with code that hit `GET /zones` and returned:

| Zone | Status |
|------|--------|
| example.com | active |
| example.info | active |

## DNS records

```
> Show me the DNS records for example.com
```

This one appears the most useful. Sanitized sample from the
full output:

| Type | Name | Content | Proxied |
|------|------|---------|---------|
| A | example.com | 198.51.100.1 | No |
| CNAME | blog.example.com | c.storage.googleapis.com | Yes |
| MX | example.com | example-com.mail.protection.outlook.com | No |
| TXT | example.com | v=spf1 include:spf.protection.outlook.com -all | No |

The blog subdomain is proxied through Cloudflare (the orange cloud),
pointing at a GCS bucket. The root domain has A records from a
previous setup. The MX and TXT records are for email.

Useful when debugging
[certificate issues](/cloudflare-https-frontend.html) or verifying
propagation after a change.

## Zone details

```
> What are the nameservers for example.com?
```

It returned the two Cloudflare nameservers assigned to the zone,
plus the creation date and plan tier.


## What else to ask it

DNS lookups are the obvious use, but the full API means you can
ask about things you'd otherwise dig through the dashboard for:

- "Is Cloudflare proxying blog.example.com or is it DNS-only?"
- "Do I have any DNS records still pointing at my old hosting
  IP?"
- "Show me all TXT records across all my zones"
- "What Workers do I have deployed?"
- "Compare the DNS records for example.com and example.info"
- "Are there any firewall events for my zone?"
- "What countries is my traffic coming from right now?"



# Product-specific servers

The main `mcp.cloudflare.com/mcp` endpoint covers the entire API,
but Cloudflare also ships
[focused MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/)
for individual products:

- **DNS Analytics**: `dns-analytics.mcp.cloudflare.com/mcp`
- **Observability**: `observability.mcp.cloudflare.com/mcp`
- **Workers Builds**: `builds.mcp.cloudflare.com/mcp`
- **Radar**: `radar.mcp.cloudflare.com/mcp` (internet traffic
  data)
- **Browser Rendering**: `browser.mcp.cloudflare.com/mcp`

Same transport, same `claude mcp add --transport http` setup.
The main server is enough for general use.


# Compared to the GA4 MCP server

The [GA4 MCP server](/ga4-mcp.html) runs locally via `pipx`, uses
Google Application Default Credentials, and exposes five specific
tools. Setting it up requires enabling GCP APIs and running
`gcloud auth`.

The Cloudflare MCP is a remote server. No local install, no API
keys to manage. OAuth in the browser and you're done. The tradeoff
is you need network access to `mcp.cloudflare.com` and the
server's availability depends on Cloudflare.

The two-tool design (search + execute) is interesting. It means Claude
has to write JavaScript to query the API. But it
also means the responses are raw API output rather than pre-formatted
tool results. For most queries that's fine.
