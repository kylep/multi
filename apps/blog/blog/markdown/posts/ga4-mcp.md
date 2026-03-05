---
title: "GA4 and Its MCP Server"
summary: Adding Google Analytics 4 to a statically-exported Next.js blog, then
  connecting the official GA4 MCP server so Claude can query the data directly.
slug: ga4-mcp
category: dev
tags: GA4, Google-Analytics, MCP, Claude-Code, Next-js
date: 2026-03-04
modified: 2026-03-05
status: published
image: ga4-mcp.png
thumbnail: ga4-mcp-thumb.png
imgprompt: three rounded bar chart columns stepping upward left to right, flat colour, shades of orange to bright yellow-orange, minimal, white background
---

Two things in this post. First, wiring up GA4 on this blog, which turns out to
be pretty straightforward on Next.js. Second, connecting the official GA4 MCP
server so Claude Code can query the analytics data directly in natural language.

Once the MCP is connected, you can ask
Claude things like "which posts got the most traffic last month" or "what are
my top referral sources" and it queries GA4 and tells you. No dashboard required.


# Setting Up GA4

## Create the Property

Go to [analytics.google.com](https://analytics.google.com). Hit Create →
Property, fill in a name and your timezone, click through the business details
screens (mostly irrelevant for a personal blog), then choose Web as the
platform and enter your domain. GA4 creates the property and a web data stream
in one flow.

Once the stream is created, click it to open the stream details. The
measurement ID is right there. It looks like `G-XXXXXXXXXX`.


## Add Tracking to Next.js

This blog is statically exported Next.js. The right place to add the tracking
script is `_app.js`, using `next/script` with `afterInteractive` so it doesn't
block rendering:

```jsx
// pages/_app.js
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </Script>
      {/* rest of your app */}
    </>
  );
}
```

Replace `G-XXXXXXXXXX` with your actual measurement ID. Deploy, open the GA4
realtime report, and visit your site to confirm hits are coming in. Takes a
couple minutes to show up.

Note: if you're serving via a CDN with aggressive caching (this blog uses GCS),
make sure the HTML is being revalidated, not served stale. The script tag needs
to actually make it into the page.


# The GA4 MCP Server

Google ships an [official MCP server](https://github.com/googleanalytics/google-analytics-mcp)
for GA4. It's read-only, which is fine for querying data. It wraps the GA4
Admin API and Data API and exposes a handful of tools Claude can call.


## Auth Setup

The server uses Google Application Default Credentials. Before you can log in,
you need to enable two APIs in your GCP project. Check which project your
gcloud CLI is using:

```bash
gcloud config get-value project
```

Then enable the APIs:

```bash
# Required for get_account_summaries, get_property_details
gcloud services enable analyticsadmin.googleapis.com

# Required for run_report, run_realtime_report
gcloud services enable analyticsdata.googleapis.com
```

Then log in:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform
```

The `cloud-platform` scope is required alongside `analytics.readonly`. Without
it you get a deprecation error and the auth fails.

That stores credentials at
`~/.config/gcloud/application_default_credentials.json`. No service account
file needed.

If you'd rather use a service account (better for shared environments), create
one in Google Cloud Console, grant it Viewer access on your GA4 property, and
download the JSON key. Set `GOOGLE_APPLICATION_CREDENTIALS` to point at it.


## Add to Claude Code

Add it to `.mcp.json` at the project root to share it with the team:

```json
{
  "mcpServers": {
    "analytics-mcp": {
      "command": "pipx",
      "args": ["run", "analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/you/.config/gcloud/application_default_credentials.json"
      }
    }
  }
}
```

Or add it for yourself only:

```bash
claude mcp add analytics-mcp --env GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json -- pipx run analytics-mcp
```

Restart Claude Code and run `/mcp` to confirm `analytics-mcp` is listed.


## What It Exposes

Five tools:

- `get_account_summaries`: lists your GA4 accounts and properties. Good first
  call to confirm auth is working and grab your property ID.
- `get_property_details`: details for a specific property.
- `run_report`: the main one. Queries the GA4 Data API with dimensions and
  metrics of your choice.
- `run_realtime_report`: same thing but against the realtime endpoint.
- `get_custom_dimensions_and_metrics`: lists any custom dimensions you've
  defined on the property.

The server is read-only. It can't modify your GA4 configuration.


# Querying Data

Once connected, you can ask in plain English. Claude figures out which dimensions and
metrics to use and calls `run_report` for you.

Some things I've asked it:

**Traffic overview:**
> What were my total users and sessions last week, broken down by day?

**Top content:**
> Which pages got the most views in the last 30 days?

**Referrals:**
> What are my top traffic sources this month?

**Realtime:**
> How many people are on the site right now and what pages are they on?

For anything beyond basic questions, it helps to know a few GA4 concepts.
"Sessions" and "users" mean what you'd expect. "Engaged sessions" are ones
where the user spent more than 10 seconds, viewed more than one page, or
triggered a conversion. The distinction matters when you're trying to tell real
readers from bots.

Claude will sometimes ask for your property ID before running a report. Either
give it the `G-XXXXXXXXXX` measurement ID or the numeric property ID from the
GA4 UI. If you add the property ID to your `CLAUDE.md` or project context,
it'll stop asking.


# What It's Actually Good For

The dashboard is fine for browsing. The MCP is better for specific questions,
comparing time periods, and anything you'd normally have to build a custom
report for.

The bigger thing I have in mind though is eventually having like OpenClaw or similar
using it in an ideation loop. Some sort of PM agent that adds potential tickets to a
Jira or Linear board and uses this data as an input.

I'm also just starting to love being back in tmux and not having to operate websites
as much.

Lastly I figure I can hook this up to voice commands somehow for a really custom voice
assistant.

