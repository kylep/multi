---
title: "Mastodon Auto-Post from RSS"
tags: ["wiki", "blog-distribution"]
---

# Mastodon Auto-Post from RSS (PER-68)

Auto-post new blog entries from kyle.pericak.com to Mastodon.

## Approach

Same pattern as the Twitter and Bluesky auto-posters: a K8s CronJob
polls `/feed.xml`, dedupes against a PVC-stored GUID file, and posts
any new items. ArgoCD-managed via the shared cronjob Helm chart.

Each destination runs in its own CronJob with its own PVC, so one
destination failing has no effect on the others.

## Post format

Title + blank line + UTM-stamped URL. Mastodon's server-side crawler
fetches the page's OpenGraph tags and generates a rich link-preview
card, so we don't upload an image ourselves — `og:image` on the blog
post is what produces the image in the card.

```
@Ralph Secure My Laptop

https://kyle.pericak.com/secure-my-laptop.html?utm_source=mastodon&utm_medium=social&utm_campaign=blog_post
```

Leading `@` is stripped from titles because a status starting with
`@handle` is treated as a mention/reply and gets hidden from the
timeline of anyone not already following the mentioned account.

500-char limit (mastodon.social default) is enforced conservatively.

## UTM parameters

Every link gets
`utm_source=mastodon&utm_medium=social&utm_campaign=blog_post` so
GA4 attributes the traffic to "mastodon / social".

## Deduplication

Persistent file on a PVC tracking posted item GUIDs
(`/cache/posted-guids`). Same rationale as the Twitter and Bluesky
jobs — timestamp filtering is brittle, GUIDs are stable.

## Architecture

```
CronJob (every 2h)
  → GET /feed.xml
  → diff against /cache/posted-guids
  → for each new item:
      → POST /api/v1/statuses with Bearer <access_token>
      → Mastodon crawler fetches OG tags → renders link card
      → append GUID to posted-guids
  → exit
```

### Components

- **Script**: `infra/ai-agents/cronjobs/scripts/mastodon-rss.py`
- **Shared helpers**: `infra/ai-agents/cronjobs/scripts/crosspost_common.py`
  (RSS parsing, GUID dedup, UTM injection — shared with tweet-rss.py
  and bluesky-rss.py)
- **CronJob template**: `infra/ai-agents/cronjobs/helm/templates/mastodon-rss.yaml`
- **PVC**: `mastodon-rss-state` (10Mi)
- **Secrets**: Mastodon instance URL + access token in Vault at
  `secret/ai-agents/mastodon`
- **Image**: `kpericak/ai-agent-runtime` (has `requests`; no new
  dependency — script calls Mastodon's REST API directly)

### Auth

Mastodon uses a single Bearer access token for server-to-server
posting to the app owner's own timeline. No OAuth flow is required
because the token itself represents the bot account.

Create the token at `{instance}/settings/applications` → New
application with scope **`write:statuses`** and copy the "Your access
token" value. The client key / client secret shown on the same page
are only used for OAuth-on-behalf-of-other-users flows and are not
needed here.

### Bot flag

On every run, after reading the token, the script calls
`verify_credentials` and — if `bot` is false — PATCHes
`update_credentials` with `bot=true`. Idempotent: after the first
successful run it's one GET and no writes. Mirrors the Bluesky
`bot` self-label behavior so automated accounts are disclosed as
such per fediverse convention.

### Vault secrets

Store at `secret/ai-agents/mastodon`:

```
instance_url   # e.g. https://mastodon.social
access_token   # from Settings → Development → your app
```

Write with `bin/vault-cmd.sh`:

```
vault kv put secret/ai-agents/mastodon \
  instance_url=https://mastodon.social \
  access_token="$MASTODON_ACCESS_TOKEN"
```

The helm template injects these as `MASTODON_INSTANCE_URL` and
`MASTODON_ACCESS_TOKEN`.

### CronJob schedule

Every 2 hours (`0 */2 * * *`), matching the Twitter and Bluesky jobs.
Blog posts publish infrequently, so sub-hour latency buys nothing.

## Enabling

1. Mastodon app → Settings → Development → New application → scope
   `write:statuses` → save → copy the access token.
2. Store in Bitwarden: item name
   `Mastodon Access Token (Blog Crosspost Bot)`, password = token,
   username = instance host (e.g. `mastodon.social`).
3. `infra/ai-agents/bin/bw-to-exports.sh` — syncs the token into
   `apps/blog/exports.sh` as `MASTODON_ACCESS_TOKEN`.
4. Store in Vault:
   ```
   source apps/blog/exports.sh
   infra/ai-agents/bin/vault-cmd.sh kv put secret/ai-agents/mastodon \
     instance_url=https://mastodon.social \
     access_token="$MASTODON_ACCESS_TOKEN"
   ```
5. **Seed the dedup state** (so enabling the cron doesn't bulk-post
   50 old entries) — see below.
6. Enable in `infra/ai-agents/environments/pai-m1.yaml`:
   ```yaml
   cronjobs:
     mastodonRss:
       enabled: true
       schedule: "0 */2 * * *"
   ```
7. ArgoCD will create the CronJob automatically.

## Seeding the state file (critical)

An empty `mastodon-rss-state` PVC means the first cron run posts
every entry currently in the RSS feed. To test with just one post
(e.g. the Ralph post), pre-populate the state file with every GUID
*except* the one you want posted:

```
# 1. ArgoCD creates the PVC (after step 6 above would normally apply,
#    but you can create just the PVC ahead of enabling the cron).
# 2. Run a throwaway pod with the PVC mounted, populate it:
kubectl -n ai-agents run masto-seed --rm -it --restart=Never \
  --image=kpericak/ai-agent-runtime:0.6 \
  --overrides='{"spec":{"volumes":[{"name":"cache","persistentVolumeClaim":{"claimName":"mastodon-rss-state"}}],"containers":[{"name":"masto-seed","image":"kpericak/ai-agent-runtime:0.6","stdin":true,"tty":true,"volumeMounts":[{"name":"cache","mountPath":"/cache"}]}]}}' \
  -- sh
# Inside the pod:
python3 -c "
import urllib.request, xml.etree.ElementTree as ET
root = ET.fromstring(urllib.request.urlopen('https://kyle.pericak.com/feed.xml').read())
guids = [i.findtext('guid','').strip() for i in root.findall('.//item')]
# Keep every GUID EXCEPT the Ralph post
guids = [g for g in guids if 'secure-my-laptop' not in g]
open('/cache/posted-guids','w').write('\\n'.join(sorted(guids)) + '\\n')
print('seeded', len(guids), 'GUIDs; ralph will be posted on next cron run')
"
```

Next cron tick sees only the Ralph GUID as new → one post, one
image, one link preview.

## Local testing

```
source apps/blog/exports.sh
STATE_FILE=/tmp/mastodon-rss-state \
  RSS_URL=https://kyle.pericak.com/feed.xml \
  apps/blog/.venv/bin/python3 infra/ai-agents/cronjobs/scripts/mastodon-rss.py --dry-run
```

Dry-run skips the POST and the `bot` flag PATCH, but still parses
the feed, applies UTMs, and shows the exact status text that would
be sent.

## Risks

- **Access token leak**: stored only in Vault; pod reads via agent-inject.
  A leaked token can post to the account but cannot read private data
  (scope is `write:statuses` only).
- **Rate limits**: mastodon.social allows 300 POSTs / 5 min per account
  and per IP — many orders of magnitude above a few weekly posts.
- **Link-card rendering**: Mastodon's crawler caches OG tags; if OG
  changes after first fetch, the card may lag. Not a concern for
  new posts.

## Cost

$0/month. Free Mastodon account + existing K8s infra.

## References

- https://docs.joinmastodon.org/methods/statuses/#create
- https://docs.joinmastodon.org/client/token/
- https://docs.joinmastodon.org/methods/accounts/#update_credentials
