

<!-- Source: .ruler/branching.md -->

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



<!-- Source: .ruler/monorepo.md -->

# Monorepo rules

This git repo is a monorepo. It contains multiple sub-projects.
Do not look for context or cross-reference calls between sub-projects.
Each directory within apps/ and games/ is a sub-project. They shouldn't share code.
