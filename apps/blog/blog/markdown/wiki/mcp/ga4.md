---
title: "GA4 MCP"
summary: "Google Analytics 4 MCP server. Provides AI agents with access to website traffic data, real-time reports, and property configuration."
keywords:
  - ga4
  - google-analytics
  - mcp
  - analytics
  - reporting
related:
  - wiki/mcp/playwright
  - ga4-mcp
scope: "Covers GA4 MCP server setup and available reports. Does not cover GA4 configuration or tag setup."
last_verified: 2026-03-10
---

# GA4 MCP

The GA4 Analytics MCP server gives AI agents access to Google Analytics
data. Used for traffic analysis, content performance review, and
SEO monitoring.

## Key Tools

- `run_report`: custom date-range reports with dimensions and metrics
- `run_realtime_report`: current active users and pages
- `get_property_details`: GA4 property configuration
- `get_account_summaries`: list available properties

## Configuration

Requires a GA4 property ID and service account credentials. The MCP
server is configured in `~/.claude.json` under the blog project scope.

- Property: kyle.pericak.com
- Property ID: 527184342
- Measurement ID: G-LF6FVVWFMN

## Related Blog Posts

- [GA4 and Its MCP Server](/ga4-mcp.html): setup and usage guide
