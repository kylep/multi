---
title: "Bluesky Auto-Post from RSS"
tags: ["wiki", "blog-distribution"]
---

# Bluesky Auto-Post from RSS (PER-67)

Auto-post new blog entries from kyle.pericak.com to Bluesky.

## Approach

Same pattern as the X/Twitter auto-poster: a K8s CronJob polls
`/feed.xml`, dedupes against a PVC-stored GUID file, and posts any
new items. ArgoCD-managed via the shared cronjob Helm chart.

Each destination runs in its own CronJob with its own PVC, so one
destination failing has no effect on the others — "fail open" is
automatic.

## Post format

Short text (title + truncated description) plus an external-link
embed card that renders title, description, and the domain:

```
Building an AI Agent Org Chart

Experimenting with multi-agent setup with named roles, a shared wiki,
and an orchestration agent that coordinates between them.
```

The link lives in the embed card, not the text body, so the card
isn't visually duplicated. Bluesky's 300-grapheme limit is enforced
conservatively by character count.

## UTM parameters

Every embedded link gets `utm_source=bluesky&utm_medium=social&utm_campaign=blog_post`
so GA4 attributes it to "bluesky / social".

## Deduplication

Persistent file on a PVC tracking posted item GUIDs
(`/cache/posted-guids`). See `x-twitter-auto-post.md` for the rationale
— timestamp filtering is brittle, GUIDs are stable.

## Architecture

```
CronJob (every 15 min)
  → GET /feed.xml
  → diff against /cache/posted-guids
  → for each new item:
      → login(handle, app_password) → accessJwt + did
      → POST com.atproto.repo.createRecord with external embed
      → append GUID to posted-guids
  → exit
```

### Components

- **Script**: `infra/ai-agents/cronjobs/scripts/bluesky-rss.py`
- **Shared helpers**: `infra/ai-agents/cronjobs/scripts/crosspost_common.py`
  (RSS parsing, GUID dedup, UTM injection — shared with tweet-rss.py)
- **CronJob template**: `infra/ai-agents/cronjobs/helm/templates/bluesky-rss.yaml`
- **PVC**: `bluesky-rss-state` (10Mi)
- **Secrets**: Bluesky handle + app password in Vault at
  `secret/ai-agents/bluesky`
- **Image**: `kpericak/ai-agent-runtime` (already has `requests`; no new
  dependency — the script calls Bluesky's XRPC endpoints directly)

### Auth

Bluesky's AT Protocol uses an **App Password**, not the account
password. Generate one at Settings → Privacy and Security → App
Passwords in the Bluesky app.

The script posts to `com.atproto.server.createSession` once per run
to exchange handle + app-password for a short-lived `accessJwt`, then
to `com.atproto.repo.createRecord` for each new post. No SDK needed.

### Bot self-label

On every run, after login and before posting, the script ensures the
account profile carries the `bot` self-label via `getRecord` +
`putRecord` on `app.bsky.actor.profile`. Idempotent — if the label
is already there, it's a single GET and no writes. If the profile
doesn't exist yet, it's created with just the label. Bluesky's UI
does not expose a toggle for this; it's a profile record write.

### Vault secrets

Store at `secret/ai-agents/bluesky`:

```
handle         # e.g. kylep.bsky.social
app_password   # xxxx-xxxx-xxxx-xxxx (NOT the account password)
```

### CronJob schedule

Every 15 minutes, matching the Twitter job. RSS polling is cheap.

## Enabling

1. Create (or pick) a Bluesky account. Handle is your `@...` address.
2. Bluesky app → Settings → Privacy and Security → App Passwords →
   generate one for this bot.
3. Store the credentials in Vault:
   ```
   vault kv put secret/ai-agents/bluesky handle=... app_password=...
   ```
   (The helm template exports these as `BLUESKY_HANDLE` and
   `BLUESKY_APP_PASS`.) The bot self-label is applied automatically
   on every run — no UI step needed.
4. Enable in `infra/ai-agents/environments/pai-m1.yaml`:
   ```yaml
   cronjobs:
     blueskyRss:
       enabled: true
       schedule: "*/15 * * * *"
   ```
6. ArgoCD will create the CronJob automatically.

## Local testing

```
STATE_FILE=/tmp/bluesky-rss-state \
  RSS_URL=https://kyle.pericak.com/feed.xml \
  python3 infra/ai-agents/cronjobs/scripts/bluesky-rss.py --dry-run
```

Dry-run mode skips login and the POST, but still parses the feed,
applies UTMs, formats the post body, and shows the embed URL that
would be sent.

## Risks

- **App password leak**: stored only in Vault; pod reads via agent-inject.
- **Rate limits**: Bluesky permits roughly 1,500 points / 5 min; each
  post is cheap. Not a concern for ~weekly blog posts.
- **Feed format changes**: same risk as Twitter job. GUID dedup uses
  the canonical link URL, which is stable.

## Cost

$0/month. Free Bluesky account + existing K8s infra.

## References

- https://docs.bsky.app/docs/starter-templates/bots
- https://docs.bsky.app/blog/create-post
- https://atproto.com/specs/xrpc
