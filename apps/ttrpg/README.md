# ttrpg

This project lives in its own repo: [kylep/ky-ttrpg](https://github.com/kylep/ky-ttrpg).

ky-ttrpg is an engine, scripts, and Claude Code skills for running tabletop
RPGs, with Claude as game master. It needs its own repo because each game
world is a separate private git repo instantiated from the engine's
templates, and GM sessions launch Claude with a constrained agent/skillset
independent of this monorepo's tooling.
