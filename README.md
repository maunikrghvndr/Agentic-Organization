# Agentic Organization

A software team for your coding agent: 24 roles that take a task from idea to release, under your own coding standards. Works with any coding agent that reads `AGENTS.md`, on Windows, macOS and Linux.

## Quick start

1. Copy [`AGENTS.md`](AGENTS.md) into the root of your repository.
2. Open the repository in your coding agent and ask for what you want.
3. Say yes when the agent asks to fetch this library. That happens once per machine.

That is the whole setup. The agent picks the right role for each step and asks before anything risky.

## What to say

| You say | Who takes it |
|---|---|
| "I have an idea for…" / "let's spec this out" | `analyst`, then `architect` and `planner` if the work needs them |
| "Build / add / change…" | the engineer for that area (backend, frontend, DevOps, data, ML, AI) |
| "Why is this failing?" | `debugger` finds the cause, then the engineer fixes it |
| "Review this" | the reviewer for that area, in a fresh context |
| "Is this ready to ship?" | `qa-engineer`, then `security-engineer` |
| "What is the best way to do X?" | `researcher` |

You never have to name a role. The full list is the table in [`AGENTS.md`](AGENTS.md).

## What you can count on

- **Your standards are enforced.** Explicit types, structured logging and no hardcoding are checked by the reviewers.
- **Nothing is called done without proof.** Every check is recorded with its command and result.
- **The author does not review its own work.** Reviews run in a fresh context, on a different model family when one is available.
- **You stay in control.** The agent asks before adding a dependency, changing a schema, deleting anything or pushing, and it never merges.
- **It is observable.** Services are traced with OpenTelemetry, and every model call is recorded with its inputs, output and reasoning, with sensitive data kept to stores you approve.
- **It remembers.** Project facts and progress are kept in `.ai-memory/` inside your repository.

## Optional

- **Skills:** `node Skills/install-skills.mjs` installs the reviewed third-party skills on the list. See [`Skills/README.md`](Skills/README.md).
- **Many repositories:** `pwsh Scripts/Sync-AgentsMd.ps1 -DryRun` previews copying `AGENTS.md` into every repository under one folder.

## More

Everything else (folder layout, the full workflow, release audit, unattended runs, maintaining the library) is in the [full guide](README/ORCHESTRATION_README.md).
