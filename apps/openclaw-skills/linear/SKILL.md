---
name: linear
description: Manage Linear issues, projects, and comments via the Linear GraphQL API.
metadata: {"openclaw": {"emoji": "📐", "requires": {"bins": ["curl", "jq"], "env": ["LINEAR_API_KEY"]}}}
---

# Linear Skill

Manage Linear issues, projects, and comments from OpenClaw.

## Setup

1. Go to Linear Settings > Account > Security & Access > Personal API keys
2. Create a new personal API key
3. Set the environment variable:
   ```bash
   export LINEAR_API_KEY="lin_api_..."
   ```

## Usage

All commands use `curl` to hit the Linear GraphQL API.

### List teams

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ teams { nodes { id name key } } }"}' \
  | jq '.data.teams.nodes'
```

### List issues

Filter by team key (e.g. `PER`):

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issues(filter: { team: { key: { eq: \"PER\" } } }, first: 25) { nodes { id identifier title state { name } priority labels { nodes { name } } } } }"}' \
  | jq '.data.issues.nodes'
```

### Get issue by ID

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issue(id: \"ISSUE_UUID\") { id identifier title description state { name } assignee { name } labels { nodes { name } } } }"}' \
  | jq '.data.issue'
```

### Create issue

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "mutation { issueCreate(input: { teamId: \"TEAM_UUID\", title: \"Issue title\", description: \"Issue description\", priority: 3 }) { success issue { id identifier url } } }"}' \
  | jq '.data.issueCreate'
```

### Update issue (change status)

Look up the target state ID with "List workflow statuses" first.

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "mutation { issueUpdate(id: \"ISSUE_UUID\", input: { stateId: \"STATE_UUID\" }) { success issue { id identifier state { name } } } }"}' \
  | jq '.data.issueUpdate'
```

### List workflow statuses

Get the available statuses for a team:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ workflowStates(filter: { team: { key: { eq: \"PER\" } } }) { nodes { id name type position } } }"}' \
  | jq '.data.workflowStates.nodes | sort_by(.position)'
```

### List labels

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issueLabels(filter: { team: { key: { eq: \"PER\" } } }) { nodes { id name color } } }"}' \
  | jq '.data.issueLabels.nodes'
```

### Create label

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "mutation { issueLabelCreate(input: { teamId: \"TEAM_UUID\", name: \"Suggestion\", color: \"#0ea5e9\" }) { success issueLabel { id name } } }"}' \
  | jq '.data.issueLabelCreate'
```

### List comments on issue

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ comments(filter: { issue: { id: { eq: \"ISSUE_UUID\" } } }) { nodes { id body createdAt user { name } } } }"}' \
  | jq '.data.comments.nodes'
```

### Add comment

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "mutation { commentCreate(input: { issueId: \"ISSUE_UUID\", body: \"Comment text here\" }) { success comment { id body } } }"}' \
  | jq '.data.commentCreate'
```

## Notes

- **IDs**: Linear uses UUIDs internally. Use `identifier` (e.g. `PER-42`)
  for display, but API mutations need the UUID `id`. List commands return both.
- **Rate limits**: 1,500 requests per hour per API key. Complex queries
  count as one request.
- **Auth**: Personal API keys use `Authorization: $LINEAR_API_KEY` directly
  (no `Bearer` prefix).
- **Pagination**: Add `after: \"CURSOR\"` and use `pageInfo { hasNextPage
  endCursor }` for large result sets.

## Examples

Find all Suggestion issues in Backlog and move one to Todo:

```bash
# Get the team ID
TEAM_ID=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ teams { nodes { id name key } } }"}' \
  | jq -r '.data.teams.nodes[0].id')

# Find Suggestion issues in Backlog
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "{\"query\": \"{ issues(filter: { labels: { name: { eq: \\\"Suggestion\\\" } }, state: { name: { eq: \\\"Backlog\\\" } } }) { nodes { id identifier title } } }\"}" \
  | jq '.data.issues.nodes'

# Get the Todo state ID
TODO_ID=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "{\"query\": \"{ workflowStates(filter: { team: { id: { eq: \\\"$TEAM_ID\\\" } }, name: { eq: \\\"Todo\\\" } }) { nodes { id name } } }\"}" \
  | jq -r '.data.workflowStates.nodes[0].id')

# Move the first issue to Todo
ISSUE_ID="<paste issue UUID from above>"
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "{\"query\": \"mutation { issueUpdate(id: \\\"$ISSUE_ID\\\", input: { stateId: \\\"$TODO_ID\\\" }) { success } }\"}" \
  | jq '.data.issueUpdate'
```

Create an issue and add a comment:

```bash
# Create issue
RESULT=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "{\"query\": \"mutation { issueCreate(input: { teamId: \\\"$TEAM_ID\\\", title: \\\"Audit blog post SEO metadata\\\", description: \\\"Check all posts for missing or outdated meta descriptions.\\\" }) { success issue { id identifier } } }\"}" )
echo "$RESULT" | jq '.data.issueCreate'

# Add a comment to the new issue
NEW_ID=$(echo "$RESULT" | jq -r '.data.issueCreate.issue.id')
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "{\"query\": \"mutation { commentCreate(input: { issueId: \\\"$NEW_ID\\\", body: \\\"Created by nightly audit agent. Priority: low.\\\" }) { success } }\"}" \
  | jq '.data.commentCreate'
```
