# Agentic Organization Role Library

A portable role library for coding agents (Claude Code, Codex, Cursor). Drop `AGENTS.md` into any repo; the agent routes each task to one specialized role and follows that role's discipline.

## Setup

Nothing manual. `AGENTS.md` points at this library by absolute path (the fenced line near the top). When that path does not resolve — a new machine, WSL, a clone, a teammate's checkout — the agent self-heals per the **Role library resolution** block in `AGENTS.md`: it looks in likely locations, and if it cannot find the library it offers to clone it from GitHub, then updates the path line itself. It always **asks permission** before writing the path or cloning, and falls back to `AGENTS.md`'s universal rules if you decline. You never edit the path by hand.

## Structure

```text
Agentic-Organization/
  AGENTS.md                master copy of the drop-in file (router + universal rules)

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
    PROJECT_MEMORY.template.md
    TASK_MEMORY.template.md
    HANDOFF.template.md
    REFERENCE.template.md

  Router/                  optional: ticket-classification prompt (unused in drop-in workflow)
  Scripts/                 optional: headless ticket runners (unused in drop-in workflow)
  _archive/                pre-restructure originals
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

## Key Rules

- **One role file per session.** Never load two.
- **Phases flow in one session** — the agent adopts each role in turn (analyst → architect → planner → engineer) and carries through to a working implementation. Only review/QA/security is *preferred* as a fresh session so a reviewer doesn't rubber-stamp its own code; if reviewed in-session, it must re-read and review adversarially.
- **Rework loop:** reviewer/security/QA findings go back to the original engineer role; loop ends when no blocking issues remain.
- **Cross-stack:** analyst (grill + spec) → architect (design, when needed) → planner (sequence + gate) → backend-engineer → frontend-engineer → reviewer(s) → qa-engineer, in one session. Skip roles that add nothing.
- **Universal Grill Checkpoint:** every role, before any work, restates intent in one line and asks any question that would change what gets built. Never skipped — trivial tasks are one line and 15 seconds; feature-sized ambiguity routes to `analyst` for full grill and durable spec production.
- **Memory is compact and compounding:** bullets only, omit empty sections, promote durable learnings to PROJECT_MEMORY, archive finished task files. Knowledge is updated or reorganized (index + `wiki/` topic pages, distilled `ref-` pages for papers/specs) — never deleted for size.
- **Graph accelerator:** AGENTS.md drives the agent to build a Graphify knowledge graph and query it instead of grepping. Code extraction uses `--code-only` (local tree-sitter AST, no API calls); ingesting documents/PDFs needs an LLM backend and is gated on the user's approval. The graph lands under `.ai-memory/` (gitignored, regenerable) alongside the rest of what the agent consults. It checks for the tool, asks once to install if missing, and falls back to normal file reading if the tool is absent or declined — never a hard dependency, so the drop-in stays one file.

## Maintaining The Library

- `AGENTS.md` owns routing + universal rules. Role files own role behavior. Do not restate role content in `AGENTS.md` (drift risk).
- The role library path appears exactly once, at the top of `AGENTS.md`. The agent self-heals it (Role library resolution block) with the user's permission; no manual edit needed.
- Coding-style rules (explicit types / no `var` abuse, no `any`, `Constants.cs` / `FrontendConstants` patterns, structured logging with constant templates, no hardcoding) live in the engineer role files and are enforced by the reviewer roles — keep both sides in sync when changing a style rule.
