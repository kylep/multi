# X/Twitter Auto-Post from RSS (PER-26)

Auto-tweet new blog posts when they're published to kyle.pericak.com.

## Approach: custom script as K8s CronJob (ArgoCD-managed)

Build a lightweight script that polls the RSS feed and posts to X.
Runs as a CronJob in the ai-agents namespace, managed by ArgoCD
like everything else. No GitHub Actions dependency.

## Tweet format

Title + description + hashtags + UTM link:

```
Building an AI Agent Org Chart

How I organized 10 Claude Code agents into a functional team with
specialized roles and delegation patterns.

#AI #LLM

https://kyle.pericak.com/agent-org-chart.html?utm_source=twitter&utm_medium=social&utm_campaign=blog_post
```

- Description pulled from RSS `<description>` field
- Hashtags mapped from RSS `<category>`: ai→#AI #LLM, dev→#Dev
  #SoftwareEngineering, cloud→#Cloud #DevOps
- Fully automated, no per-post work needed

## UTM parameters

Append to every link posted:

```
?utm_source=twitter&utm_medium=social&utm_campaign=blog_post
```

- `utm_source=twitter` — matches GA4 Default Channel Grouping for
  "Organic Social" (lowercase, consistent)
- `utm_medium=social` — required for GA4 to classify as social traffic
- `utm_campaign=blog_post` — groups all auto-posted tweets together

GA4 picks these up automatically — no configuration needed. Traffic
shows up in Reports > Acquisition > Traffic Acquisition under
"twitter / social". UTM values are case-sensitive so always lowercase.

Optional: add `utm_content=<post-slug>` per tweet to track which
specific posts drive traffic.

## Deduplication (critical)

Use a persistent file on a PVC tracking posted item GUIDs:

```
# /cache/posted-guids
https://kyle.pericak.com/agent-org-chart.html
https://kyle.pericak.com/ai-security-toolkit.html
```

On each run:
1. Parse RSS feed, extract all item GUIDs (usually the post URL)
2. Load posted-guids from PVC
3. For each item not in posted-guids: post tweet, append GUID
4. Save updated posted-guids

This is more robust than timestamp-based filtering because:
- Survives RSS feed regeneration (timestamps can shift)
- Survives CronJob gaps (won't re-post old items after downtime)
- Handles RSS feeds that don't guarantee chronological order
- Simple to inspect and manually edit if needed

## Architecture

```
CronJob (every 2h)
  → curl RSS feed
  → diff against /cache/posted-guids
  → for new items:
      → format tweet (title + desc + UTM link)
      → POST to X API v2
      → append GUID to posted-guids
  → exit
```

### Components

- **Script**: `infra/ai-agents/cronjobs/scripts/tweet-rss.sh`
  (or Python if OAuth 1.0a signing is painful in shell)
- **CronJob template**: `infra/ai-agents/cronjobs/helm/templates/tweet-rss.yaml`
- **PVC**: `tweet-rss-state` (10Mi, stores posted-guids)
- **Secrets**: X API OAuth 1.0a credentials in Vault at
  `secret/ai-agents/twitter`
- **Image**: `kpericak/ai-agent-runtime:0.5` (has curl, jq, python3)

### X API v2 auth

OAuth 1.0a signature is required for `POST /2/tweets`. This is
complex in shell (HMAC-SHA1 signing). Two options:

1. **Python script** using `requests-oauthlib` — clean, well-documented
2. **Shell with openssl** — possible but fragile

Recommend Python. The runtime image already has python3 + pip.
Add `requests-oauthlib` to the image or pip install at runtime.

### Vault secrets

Store at `secret/ai-agents/twitter`:
```
twitter_api_key
twitter_api_key_secret
twitter_access_token
twitter_access_token_secret
```

### CronJob schedule

Every 2 hours (`0 */2 * * *`). Blog posts publish infrequently,
so sub-hour latency buys nothing and every run burns a pod cold-start.

## X API setup

1. Go to developer.x.com, create a project + app
2. Select Free tier (500 tweets/month — more than enough)
3. Set permissions to "Read and Write"
4. Generate OAuth 1.0a credentials (4 tokens)
5. **Important**: regenerate Access Token after any permission change
6. Store all 4 in Vault

## Risks

- **X API free tier rate limits**: 500 tweets/month is plenty.
  The 1-req/24h limit on some endpoints may not apply to tweet
  creation — needs verification during implementation.
- **OAuth 1.0a complexity**: every request needs HMAC-SHA1 signed
  headers. Use a library, don't hand-roll.
- **Feed format changes**: if the RSS feed structure changes (e.g.,
  GUID format), dedup could break. Use the canonical link URL as
  GUID for stability.
- **Token expiry**: X API tokens don't expire by default but can
  be revoked. Monitor for 401 errors.

## Cost

$0/month. X API free tier + existing K8s infra.

## Dependencies

- RSS feed at kyle.pericak.com/feed.xml (exists)
- X Developer account with free tier API access (need to set up)
- Vault secret for API credentials (need to create)
- `requests-oauthlib` Python package (add to runtime image or
  pip install in CronJob)

## Implementation status

Script and CronJob template are built and tested (dry run locally
and in K8s pod). Disabled by default until X API credentials exist.

**To enable:**

1. Create X Developer account, generate credentials
2. Store in Vault: `vault kv put secret/ai-agents/twitter api_key=... api_key_secret=... access_token=... access_token_secret=...`
3. Add to `environments/pai-m1.yaml`:
   ```yaml
   cronjobs:
     tweetRss:
       enabled: true
       schedule: "0 */2 * * *"
   ```
4. ArgoCD will deploy the CronJob automatically

**Files:**
- Script: `infra/ai-agents/cronjobs/scripts/tweet-rss.py`
- CronJob: `infra/ai-agents/cronjobs/helm/templates/tweet-rss.yaml`
- Values: `infra/ai-agents/cronjobs/helm/values.yaml` (tweetRss section)
