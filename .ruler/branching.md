# Repo Guidelines

## Branching

Never commit directly to `main`. Always create a new branch and open a PR against
`main` for review instead.

## One PR per effort

A feature, fix, or Linear issue is ONE branch and ONE pull request. Never split a
single effort into multiple PRs — no PR-per-task, no PRs stacked on other feature
branches. Decompose the work into commits on one branch, not into separate
branches and PRs.

- Branch off `main`, never off another in-progress feature branch.
- A design-doc / plan task breakdown becomes commits on the one branch, not a PR
  per task.
- Open a second PR only for genuinely independent, separately-mergeable work.

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
