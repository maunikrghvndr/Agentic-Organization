# Agentic Organization Role Library

A portable role library for coding agents (Claude Code, Codex, Cursor). Drop `AGENTS.md` into any repo; the agent routes each task to one specialized role and follows that role's discipline.

## Code graph auto-refresh (recommended)

Agents skip the graph-build step on quick tasks, so the graph can silently never get built. The robust fix is Graphify's git hook, which rebuilds the graph on every commit — code-only, no tokens, in the background:

```powershell
# one-time per machine (installs into your global hooks path if you use one)
graphify hook install
# make the graph land under .ai-memory/ (not the repo root) on every commit
setx GRAPHIFY_OUT ".ai-memory\graphify-out"
```

With the hook in place, git keeps the graph fresh and agents only *query* it — they never need to build it. `graphify-out/` is gitignored (bare, any level), so the derived graph is never committed. Check status with `graphify hook status`; remove with `graphify hook uninstall`; skip for one commit with `GRAPHIFY_SKIP_HOOK=1`.

## Setup

Nothing manual. `AGENTS.md` points at this library by absolute path (the fenced line near the top). When that path does not resolve — a new machine, WSL, a clone, a teammate's checkout — the agent self-heals per the **Role library resolution** block in `AGENTS.md`: it looks in likely locations, and if it cannot find the library it offers to clone it from GitHub, then updates the path line itself. It always **asks permission** before writing the path or cloning, and falls back to `AGENTS.md`'s universal rules if you decline. You never edit the path by hand.

## Structure

```text
Agentic-Organization/
  AGENTS.md                master copy of the drop-in file (router + universal rules)
  LESSONS.md               shared, cross-project self-learned engineering takeaways: rules, index, cross-cutting lessons (read by all repos)
  LESSONS/                 area files the index maps to roles: backend.md, frontend.md, data-ml-ai.md, tooling-agent-workflow.md
  EVALS.md                 A/B protocol + log for measuring whether roles/sections earn their tokens

  EngineeringTeam/
    researcher.md          discover the best current approach/tech/paper, challenge the status quo, cite evidence
    analyst.md             grill user intent, produce EARS acceptance criteria, promote durable spec
    architect.md           system design decisions (data model, APIs, boundaries, tech choice)
    planner.md             sequence a settled feature into phases + pre-implementation gate
    backend-engineer.md    implement backend changes
    frontend-engineer.md   implement frontend changes
    devops-engineer.md     CI/CD, Docker, IaC, deployments
    debugger.md            reproduce + root-cause (diagnosis only)
    data-engineer.md       pipelines, ETL/ELT, data quality, warehousing
    data-scientist.md      EDA, stats, feature engineering, model selection, offline eval
    ml-engineer.md         productionize models: training pipelines, serving, feature parity
    mlops-engineer.md      ML platform: tracking, registry, model CI/CD, drift/monitoring
    ai-engineer.md         LLM app logic: integration, agents, tool calling, guardrails, eval
    prompt-engineer.md     prompt design, few-shot, prompt evaluation/optimization
    rag-engineer.md        retrieval: chunking, embeddings, vector search, reranking, eval
    nlp-engineer.md        NER, entity linking (UMLS), classification, clinical NLP, OCR
    backend-reviewer.md    review backend diffs
    frontend-reviewer.md   review frontend diffs
    data-reviewer.md       review data-engineer/data-scientist (quality, analysis/model integrity)
    ml-reviewer.md         review ml-engineer/mlops (reproducibility, parity, lifecycle)
    ai-reviewer.md         review ai/prompt/rag/nlp (eval rigor, LLM safety, injection, isolation)
    qa-engineer.md         test plans, coverage, QA scripts, release readiness
    security-engineer.md   security audits (audit only; fixes route to engineers)

  MemoryTemplates/
    CONSTITUTION.template.md
    ROADMAP.template.md
    PROJECT_MEMORY.template.md
    TASK_MEMORY.template.md
    REFERENCE.template.md

  Hooks/
    handoff-check.mjs      optional Stop hook: blocks a Claude Code stop once if work was not recorded in task memory

  Scripts/
    Sync-AgentsMd.ps1      copy/refresh AGENTS.md into every repo under a parent folder
    run-claude-ticket.ps1  deprecated headless runner (kept for reference; see Headless / CI use)
    run-codex-ticket.ps1   deprecated headless runner (kept for reference; see Headless / CI use)

  Router/
    classify-ticket.md     deprecated ticket-classification prompt (AGENTS.md routes instead)
```

## Syncing AGENTS.md across all your repos

Rather than dropping `AGENTS.md` into each repo by hand, use the sync script:

```powershell
# preview what would change (safe, no writes)
.\Scripts\Sync-AgentsMd.ps1 -DryRun

# copy or refresh AGENTS.md into every git repo under C:\Users\mauni\source\repos
.\Scripts\Sync-AgentsMd.ps1
```

Behavior:

- Idempotent — repos whose `AGENTS.md` already matches are skipped.
- Overwrites customized copies (the library treats `AGENTS.md` as the single source of truth).
- Skips the library repo itself and any non-git folder.
- Descends one level under the parent folder (standard "repos folder" layout).

Options: `-RepoRoot <path>` to point at a different parent, `-Source <path or URL>` to sync from anywhere else. Run after any change to `AGENTS.md` in this library and every repo picks up the update.

## Workflow

1. Copy `AGENTS.md` into the target repo.
2. Ask for a task. The agent infers one role, loads only that role file, and works under its rules plus the universal rules in `AGENTS.md`.
3. Per-repo memory lives in `.ai-memory/` (created automatically): `PROJECT_MEMORY.md` for stable facts, `TASKS/` for per-task files, `TASKS/_archive/` for completed ones, `wiki/` topic pages once memory outgrows one file, and `sources/` for read-only papers/specs distilled into `ref-` pages.

## Spec-Driven Development (GitHub Spec Kit aligned)

The library is spec-first for features and interoperates with GitHub Spec Kit rather than duplicating it:

- **Constitution** — the project's highest-authority principles. `.specify/memory/constitution.md` in a Spec Kit repo, else `.ai-memory/CONSTITUTION.md`. Every role complies; the planner gate and every reviewer verify compliance.
- **If a repo uses Spec Kit** (`.specify/` present), the roles read/write its artifacts — `specs/<feature>/spec.md` (`analyst`), `plan.md` (`architect`), `tasks.md` (`planner`) — never a parallel `.ai-memory/wiki/spec-*`. No second source of truth.
- **Flow:** constitution → `analyst` (specify + clarify, EARS) → `architect` (plan) → `planner` (tasks + analyze gate) → engineers (implement) → reviewers/qa — the same artifact sequence Spec Kit produces (`constitution → specify → clarify → plan → tasks → analyze → implement`, plus its optional `checklist` and `converge` gates, covered here by the planner gate and `qa-engineer` traceability), driven by the role system.

## Key Rules

- **One role file per phase.** Load the role for the current phase and switch in-session by loading the next role file when the phase changes (`AGENTS.md` → Phase Protocol). Never hold two at once.
- **Phases flow in one session** — the agent adopts each role in turn (analyst → architect → planner → engineer) and carries through to a working implementation. Only review/QA/security is *preferred* as a fresh session so a reviewer doesn't rubber-stamp its own code; if reviewed in-session, it must re-read and review adversarially.
- **Rework loop:** reviewer/security/QA findings go back to the original engineer role; loop ends when no blocking issues remain.
- **Cross-stack:** analyst (grill + spec) → architect (design, when needed) → planner (sequence + gate) → backend-engineer → frontend-engineer → reviewer(s) → qa-engineer, in one session. Skip roles that add nothing.
- **Universal Grill Checkpoint:** every role, before any work, restates intent in one line and asks any question that would change what gets built. Never skipped — trivial tasks are one line and 15 seconds; feature-sized ambiguity routes to `analyst` for full grill and durable spec production.
- **Memory is compact and compounding:** bullets only, omit empty sections, promote durable learnings to PROJECT_MEMORY, archive finished task files. Knowledge is updated or reorganized (index + `wiki/` topic pages, distilled `ref-` pages for papers/specs) — never deleted for size.
- **Self-learning (closed loop):** repo-specific knowledge goes in that repo's `.ai-memory/`; **general, transferable takeaways** ("never ship mock data in production") go in the library's shared `LESSONS.md` (cross-cutting) or `LESSONS/<area>.md` (its index maps areas to roles), which every repo reads and every agent contributes to. Stable universal lessons graduate into the role files. Inspired by Hermes' and Multica's skill-compounding, done in markdown with no runtime.
- **Progress board:** `.ai-memory/ROADMAP.md` is the per-repo glance view — every feature/task grouped Backlog / In Progress / Blocked / Done, linking to task files and specs. Read it to re-orient after a context switch; roles keep it current and completion moves items to Done. It's the index over `TASKS/`, the way `PROJECT_MEMORY` indexes `wiki/`.
- **Measure before trimming:** the library's `EVALS.md` is a lightweight A/B protocol — run a real task with vs. without a role/section, compare quality and token cost, and let the verdict (KEEP / TRIM / CUT) drive what stays. Directional, not rigorous, but it turns "feels heavy" into evidence and is the honest antidote to a library that only ever grows.
- **Graph accelerator:** the Graphify git hook (above) keeps the graph fresh on every commit, and `AGENTS.md` drives the agent to *query* it instead of grepping — it builds the graph only when no hook maintains it. Code extraction uses `--code-only` (local tree-sitter AST, no API calls); ingesting documents/PDFs needs an LLM backend and is gated on the user's approval. The graph lands under `.ai-memory/` (gitignored, regenerable) alongside the rest of what the agent consults. It checks for the tool, asks once to install if missing, and falls back to normal file reading if the tool is absent or declined — never a hard dependency, so the drop-in stays one file.

## Headless / CI use

The old runners (`Scripts/run-claude-ticket.ps1`, `Scripts/run-codex-ticket.ps1`, `Router/classify-ticket.md`) are deprecated and kept only for reference: they pipe untrusted ticket text into an agent with repo write access and ambient credentials, with no turn, budget, sandbox or permission limits. Nothing new executes until a real headless run exists in one of your repos; when it does, follow this.

**Rule of Two (Meta, 2025-10-31; Microsoft's prescription after the 2026 claude-code-action incidents).** An unattended run must never combine all three of: (1) untrusted input (ticket, issue, PR, web or file content), (2) access to secrets or credentials, and (3) the ability to write somewhere external (push, comment, deploy, send). Pick two. Treat ticket/issue/PR text as data, not instructions — see `AGENTS.md` → instruction source hierarchy. Native Windows has no agent sandbox; run unattended work in WSL2 or a devcontainer.

Examples (flag: version-sensitive — check the host's current flags before use):

```powershell
# Claude Code, one role, hard limits, JSON result, no interactive prompts
claude -p --bare `
  --append-system-prompt-file AGENTS.md `
  --append-system-prompt-file "<library>\EngineeringTeam\backend-engineer.md" `
  --max-turns 40 --max-budget-usd 5 `
  --permission-mode acceptEdits --permission-prompts none `
  --output-format json `
  "<ticket text or path>"

# Codex, sandboxed to the workspace, structured output
codex exec --sandbox workspace-write --output-schema .\schema.json "<ticket text>"
```

Preferred GitHub path: [claude-code-action](https://github.com/anthropics/claude-code-action) (`label_trigger` or `assignee_trigger` plus `claude_args` for the same flags; no PR by default; write-access and bot checks) and [openai/codex-action](https://github.com/openai/codex-action). Read tickets through the vendor's official MCP server (Linear has a read-only endpoint; Atlassian MCP v2) rather than pasting ticket text into the prompt.

## Maintaining The Library

- `AGENTS.md` owns routing + universal rules. Role files own role behavior. Do not restate role content in `AGENTS.md` (drift risk).
- The role library path appears exactly once, at the top of `AGENTS.md`. The agent self-heals it (Role library resolution block) with the user's permission; no manual edit needed.
- Coding-style rules (explicit types / no `var` abuse, no `any`, `Constants.cs` / `FrontendConstants` patterns, structured logging with constant templates, no hardcoding) live in the engineer role files and are enforced by the reviewer roles — keep both sides in sync when changing a style rule.
