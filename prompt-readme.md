# README Generation Prompt

Run this prompt to regenerate README.md for the repo.

---

Rewrite /Users/kp/gh/multi/README.md from scratch. Use the following structure:

## Structure

### 1. Title & One-liner
- "# multi" as the title
- One sentence: Kyle's personal monorepo for hobby projects and shared infrastructure.

### 2. What's in here
A table summarizing every project. Columns: Project (linked to its directory), Description, Tech Stack. Include:
- apps/blog
- apps/kytrade
- apps/games (mention sub-projects: snake, robotext-battle, silly-app, kid-bot-battle-sim)
- apps/xmasblocks
- infra
- samples

To fill in the table accurately, read the README.md in each project directory. Keep descriptions to one sentence each.

### 3. Repo structure
A plain directory tree showing the top-level layout. Use `tree -L 2 -d` output style (dirs only, 2 levels deep). Run the actual command to get current output rather than guessing.

### 4. Dev environment setup
Only include setup steps that are still relevant. Pull info from:
- The secrets/ directory and its README
- .pre-commit-config.yaml
- Any docker-compose files
- Individual project READMEs for per-project setup

Keep it brief. Link to project READMEs for project-specific details rather than duplicating them.

## Style rules
- No emojis
- Keep it concise — the whole README should be scannable in under 60 seconds
- Use relative links for all internal paths (e.g. `apps/blog/` not absolute paths)
- Don't include vim/tmux setup, gitpods, or other stale/TODO items from the old README
