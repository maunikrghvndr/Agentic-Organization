# Agentic Organization Role Library

A portable role library for coding agents (Claude Code, Codex, Cursor). Drop `AGENTS.md` into any repo; the agent routes each task to one specialized role and follows that role's discipline.

## Structure

```text
Agentic-Organization/
  AGENTS.md                master copy of the drop-in file (router + universal rules)

  EngineeringTeam/
    planner.md             decompose big/vague/cross-stack tasks, design, acceptance criteria
    backend-engineer.md    implement backend changes
    frontend-engineer.md   implement frontend changes
    devops-engineer.md     CI/CD, Docker, IaC, deployments
    debugger.md            reproduce + root-cause (diagnosis only)
    backend-reviewer.md    review backend diffs
    frontend-reviewer.md   review frontend diffs
    qa-engineer.md         test plans, coverage, QA scripts, release readiness
    security-engineer.md   security audits (audit only; fixes route to engineers)

  MemoryTemplates/
    PROJECT_MEMORY.template.md
    TASK_MEMORY.template.md
    HANDOFF.template.md
    REFERENCE.template.md

  Router/                  optional: ticket-classification prompt (unused in drop-in workflow)
  Scripts/                 optional: headless ticket runners (unused in drop-in workflow)
  _archive/                pre-restructure originals
```

## Workflow

1. Copy `AGENTS.md` into the target repo.
2. Ask for a task. The agent infers one role, loads only that role file, and works under its rules plus the universal rules in `AGENTS.md`.
3. Per-repo memory lives in `.ai-memory/` (created automatically): `PROJECT_MEMORY.md` for stable facts, `TASKS/` for per-task files, `TASKS/_archive/` for completed ones, `wiki/` topic pages once memory outgrows one file, and `sources/` for read-only papers/specs distilled into `ref-` pages.

## Key Rules

- **One role file per session.** Never load two.
- **Phases run in fresh sessions** reading task memory — especially review/QA/security, so a reviewer never reviews its own reasoning.
- **Rework loop:** reviewer/security/QA findings go back to the original engineer role; loop ends when no blocking issues remain.
- **Cross-stack:** planner → backend-engineer → frontend-engineer → reviewer(s) → qa-engineer, each a fresh session.
- **Memory is compact and compounding:** bullets only, omit empty sections, promote durable learnings to PROJECT_MEMORY, archive finished task files. Knowledge is updated or reorganized (index + `wiki/` topic pages, distilled `ref-` pages for papers/specs) — never deleted for size.

## Maintaining The Library

- `AGENTS.md` owns routing + universal rules. Role files own role behavior. Do not restate role content in `AGENTS.md` (drift risk).
- The role library path appears exactly once, at the top of `AGENTS.md` — edit that one line if the library moves.
- Coding-style rules (explicit types / no `var` abuse, no `any`, `Constants.cs` / `FrontendConstants` patterns, structured logging with constant templates, no hardcoding) live in the engineer role files and are enforced by the reviewer roles — keep both sides in sync when changing a style rule.
