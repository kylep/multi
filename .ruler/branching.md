# Repo Guidelines

## Branching

Never commit directly to `main`. Always create a new branch and open a PR against
`main` for review instead.

```bash
git checkout -b <branch-name>
# make changes
git push -u origin <branch-name>
gh pr create --base main
```
