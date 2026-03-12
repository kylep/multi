# Repo Guidelines

## Branching

Never commit directly to `main`. Always create a new branch and open a PR against
`main` for review instead.

## Branch naming

If the work relates to a Linear issue, the branch name **must** use Linear's
format so the PR auto-links to the issue:

```
kyle/<ISSUE-ID>-short-description
```

Example: `kyle/per-39-blog-building-an-ai-agent-org-chart`

To get the correct branch name, check the Linear issue's `gitBranchName` field
or use `git checkout -b $(linear issue PER-XX --branch)`.

If there is no Linear issue, use a descriptive kebab-case name.

```bash
git checkout -b kyle/per-39-blog-agent-org-chart
# make changes
git push -u origin kyle/per-39-blog-agent-org-chart
gh pr create --base main
```
