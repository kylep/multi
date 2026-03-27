# X/Twitter Auto-Post from RSS (PER-26)

Auto-tweet new blog posts when they're published to kyle.pericak.com.

## Recommended approach: GitHub Action + X API free tier

Use `azu/rss-to-twitter` GitHub Action on a cron schedule. The free
X API tier allows 500 posts/month which is more than enough for blog
post volume.

### Why this over alternatives

- **dlvr.it** ($0-$10/mo) — works but adds another SaaS dependency
  and brands links on the free plan. No control over tweet format.
- **Zapier** ($0-$20/mo) — overkill for a single RSS-to-tweet flow.
  Charges per task.
- **IFTTT** ($3-$9/mo) — cheap but minimal formatting control.
- **n8n self-hosted** — already on the backlog (PER-49) as an
  exploration item. Could replace this later but adds deployment
  complexity for a simple use case.
- **Buffer** ($5/mo/channel) — good for scheduling but RSS
  auto-publish needs Zapier as glue.

The GitHub Action approach costs $0, runs in existing CI infra, and
gives full control over tweet content formatting.

## Implementation plan

### 1. X API setup

- Create X Developer App at developer.x.com
- Select "Free" tier (500 posts/month, sufficient for blog volume)
- Set app permissions to "Read and Write"
- Generate OAuth 1.0a credentials:
  - API Key + API Secret
  - Access Token + Access Token Secret
- Important: if you change permissions after generating tokens,
  you must regenerate the Access Token pair

### 2. GitHub secrets

Store in the `kylep/multi` repo secrets:

```
TWITTER_API_KEY
TWITTER_API_KEY_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
```

### 3. GitHub Action workflow

Create `.github/workflows/tweet-new-posts.yml`:

```yaml
name: Tweet new blog posts
on:
  schedule:
    - cron: '*/30 * * * *'  # every 30 min
  workflow_dispatch: {}

jobs:
  tweet:
    runs-on: ubuntu-latest
    steps:
      - uses: azu/rss-to-twitter@v2
        with:
          rss_url: "https://kyle.pericak.com/feed.xml"
          twitter_api_key: ${{ secrets.TWITTER_API_KEY }}
          twitter_api_key_secret: ${{ secrets.TWITTER_API_KEY_SECRET }}
          twitter_access_token: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          twitter_access_token_secret: ${{ secrets.TWITTER_ACCESS_TOKEN_SECRET }}
```

The action tracks which items have been posted using GitHub Actions
cache, so it won't double-post on subsequent runs.

### 4. Tweet format

Default format from `azu/rss-to-twitter` is `{title} {link}`. This
is fine for blog syndication — X will render the link preview card
from the page's og:image and og:description meta tags.

If custom formatting is needed, the action supports a `format`
parameter for templates.

### 5. Account setup

- Add "Posts automatically from kyle.pericak.com" to bio (X
  automation policy recommends labeling automated accounts)
- RSS-to-tweet syndication is explicitly permitted by X's automation
  rules — no suspension risk for this use case

## Risks and gotchas

- **X API free tier rate limits**: the "1 request per 24 hours" limit
  reported on some endpoints may affect polling. The tweet-creation
  endpoint itself allows 500/month on free tier. If rate limiting
  becomes an issue, the cron can be reduced to once per hour.
- **Token regeneration**: if app permissions are changed in the X
  Developer Portal, tokens must be regenerated or auth fails silently.
- **RSS feed must exist**: depends on the RSS feed at
  kyle.pericak.com/feed.xml being up to date. The blog build already
  generates this via `generate-rss.mjs`.
- **`azu/rss-to-twitter` maintenance**: last release was April 2024.
  TypeScript-based, 42 stars. If it goes unmaintained, the fallback
  is `ethomson/send-tweet-action` combined with RSS parsing in a
  shell step.

## Cost

$0/month. Uses X API free tier + GitHub Actions (free for public repos).

## Dependencies

- RSS feed at kyle.pericak.com/feed.xml (already exists)
- X Developer account with free tier API access
