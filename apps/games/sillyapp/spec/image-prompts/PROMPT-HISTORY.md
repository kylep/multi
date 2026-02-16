# Prompt History

This docment should not be used during ai/agentic app development. 

This is a record of prompts I used while building this, for sharing, learning, and review purposes.

--

## Spec Init
I'd written just about 25 lines in README.md as a rough spec of what I wanted the app to be at this point. Bullet points of key features and a sort of mission statement.

```text
Review @multi/apps/games/sillyapp/spec/README.md. In /Users/kp/gh/multi/apps/games/sillyapp/spec/, write up a full detailed implementation spec that will next be used to modify the current Silly App.

Include  Gherkin syntax test definitions in /Users/kp/gh/multi/apps/games/sillyapp/spec/tests that cover each capability.

Include ARCHITECTURE.md that uses markdown and mermaid flow diagrams to outline the design choices that should be made for the app. 
- Major frameworks/libraries and languages
- Project directory structure (images, code, build scripts, tests, etc)
- Test stack & execution approach
- Agent instructions for iterative build-verify loop that follows current claude-4.6 best practices.
- Image-generation strategy (use nano banana)
- Build tools process (including env vars needed)

Understand that this output is intended to be consumed by the claude coding agent and when that agent is done.

Add an index to all generated fileds in the README.md

For each image that the app needs, define the prompt in /Users/kp/gh/multi/apps/games/sillyapp/spec/image-prompts.  Also write image-prompts/README.md that defines a prompt that wil define the script that will transform these prompts into actual images. 
```

---

## Build Setup: Env Vars

I'm going to need to go assemble access keys for this to work. I need the verify I have them.

```text
Write a build pre-checks script that looks up all environment variables that I'm going to need and verifies they're good. Put it somewhere sensible and make sure that the ARCHITECTURE doc calls it out as part of the build process. Run it, it should fail with a helpful list of all of the correctly configured and incorrectly configured env vars. Exit code nonzero on missing env vars.
```

Trying this out, I'd usually use ChatGPT for this part or a straight Google search:
```text
Write PREFLIGHT-ENV-SETUP.md such that for each of the checks that preflight-check.sh runs, there's a section outlining how to set it up. Look online for each and use only the most current information.
```

While we're in the neighbourhood:
```text
make an appropriate env file to store the dev env vars. Add it to gitignore and architecture doc.  Add build instructions to README.md including sourcing the file and running the pre-flight checks. Each line of the env file should be commented.
```

---


