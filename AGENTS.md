# Project Agent Instructions

This repository uses Maunik's external Agentic Organization role library.

Role library root (single source of truth — edit this one line if the library moves):

```text
C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\
```

This file (`AGENTS.md`) is the single entry point. Do not look for, create, or reference a `CLAUDE.md` — this project uses `AGENTS.md` only.

Load exactly **one** role file per phase from the folder above. Do not copy role files into this repository.

**Role library resolution (the agent runs this before loading any role — the user never edits the path by hand):**

1. Try the path above: can you read `EngineeringTeam/planner.md` there? If yes, proceed.
2. If not (new machine, moved library, fresh clone), check a few likely locations quickly — the user's home and usual repo folders — for an `EngineeringTeam/` folder containing the role files. If found, ask the user to confirm, then update the path line above to match.
3. If it is still not found, ask the user for permission to clone it from `https://github.com/maunikrghvndr/Agentic-Organization` to a standard location, then set the path line to the cloned `EngineeringTeam/` folder.
4. If the user declines, proceed with this file's Universal Rules only (see Fallback) and say so.

Ask permission before writing the path line or cloning. Once the path is correct, later sessions skip this.

---

## Available Roles

| Role | File | Use for |
|---|---|---|
| `planner` | `planner.md` | Decompose large/vague/multi-area tasks, design decisions, phase sequencing, acceptance criteria |
| `backend-engineer` | `backend-engineer.md` | APIs, controllers, services, domain logic, repositories, DB, migrations, queues, workers, backend auth/validation/logging/tests |
| `frontend-engineer` | `frontend-engineer.md` | UI, components, pages, forms, routing, state, hooks, API clients, styling, accessibility, frontend tests |
| `devops-engineer` | `devops-engineer.md` | CI/CD pipelines, Dockerfiles, IaC, deployments, environments, build tooling |
| `debugger` | `debugger.md` | Reproduce bugs, diagnose failures, root-cause analysis (diagnosis only, no fixes) |
| `backend-reviewer` | `backend-reviewer.md` | Review backend diffs/PRs/architecture |
| `frontend-reviewer` | `frontend-reviewer.md` | Review frontend diffs/PRs/UI changes |
| `qa-engineer` | `qa-engineer.md` | Test plans, coverage analysis, QA scripts, release validation |
| `security-engineer` | `security-engineer.md` | Security audits, vulnerability/dependency/secret reviews |

---

## Routing

Infer one primary role per phase. The user does not need to name it.

- Implementation task clearly in one area → that engineer role.
- "Review this ..." → the matching reviewer role. Never review code with the same session/role that wrote it.
- "Why is this broken / failing / crashing?" → `debugger`.
- Pipelines, Docker, IaC, deploy, build tooling → `devops-engineer`.
- Test plan, coverage, release readiness → `qa-engineer`.
- Audit, vulnerabilities, OWASP, secrets, dependency scan → `security-engineer`.
- Task spans backend + frontend, is vague, or needs design decisions first → `planner` first.
- "Grill me" / a vague product idea needing requirements interrogation → `planner` in grill mode (it interviews you first, then plans).
- Fixing findings from a review/audit/QA report → the matching **engineer** role, with the findings as input.

If the role is unclear, ask one concise clarifying question before proceeding.

---

## Phase Protocol

- **One role per session.** Complete the phase, update task memory, recommend the next phase, and stop.
- **Never load a second role file in the same session.** Review, QA, and security phases run in a fresh session so the reviewer is not reviewing its own reasoning.
- **Rework loop:** reviewer/security/QA findings route back to the original engineer role as a new phase. Blocking issues must be fixed and re-reviewed. The loop ends when the reviewer returns no blocking issues.
- **Cross-stack features:** `planner` → `backend-engineer` → `frontend-engineer` → reviewer(s) → `qa-engineer` as needed. Each phase is a fresh session that reads task memory first.
- **Handoff contract:** at the end of a phase, the task file's Handoff section lists — next role; the exact files (with `path:line` anchors where useful) and relevant memory `wiki/` pages the next session must read; what is done and verified; what remains; settled decisions that must not be relitigated. The next session trusts this list: it reads those files first and does not re-explore the repo unless the list proves insufficient. Re-discovery of already-mapped context is wasted tokens.

---

## Universal Rules (all roles)

- Read this file and the task memory first. Identify the 5–12 files most relevant to the task; read only those; expand only when needed. Use the Code & Source Graph (below) to locate them whenever it is available.
- Think before coding: state assumptions explicitly. If the task is ambiguous, present the interpretations instead of silently picking one. If you are confused, stop and name the confusion — do not proceed on a guess.
- Define success criteria before starting: what verifiable check proves this works. Verify against them before finishing — do not stop at "it compiles" or "it looks right".
- Surgical changes: clean up only your own mess. Remove imports, variables, and functions that YOUR change orphaned. Mention pre-existing dead code but do not delete it unless asked. Match existing style even where you would choose differently.
- Do not handle impossible error scenarios or add unrequested flexibility/configurability. If 200 lines could be 50, simplify before finishing.
- Make the smallest safe change. Reuse existing methods, components, hooks, services, repositories, validators, constants, configuration, and utilities before creating anything new. No parallel architecture. No unrelated refactors or rewrites.
- Preserve existing behavior, validation, logging, telemetry, tracing, retries, idempotency, security checks, authorization checks, accessibility, error handling, tests, and public contracts unless the task explicitly changes them.
- **No hardcoding:** log messages, exception messages, validation messages, UI labels, routes, API paths, queue/provider names, configuration keys, thresholds, styling values where design tokens exist, business constants, magic strings/numbers. Stable internal values → the project's constants structure (`Constants.cs` / `constants.ts`). Environment-varying values → configuration. User-facing text → localization when the project supports it. Visual values → design tokens.
- **Structured logging only:** constant message templates with named placeholders. Never string interpolation or concatenation for logs. Never log secrets, tokens, passwords, connection strings, or sensitive payloads.
- **C#:** explicit types by default. `var` only for simple primitive locals where the type is obvious. Never `var` for class instances, DTOs, entities, collections, or query/API/repository results.
- **TypeScript:** no `any`. Explicit types for API responses, DTOs, domain objects, props, and state.
- Add or update tests for behavior changes. Never claim tests passed if they were not run.
- Update documentation/tracker files when behavior, configuration, architecture, security, or testing changes.

---

## Boundaries

**Always:**

- Use the exact commands recorded in `PROJECT_MEMORY.md`; run the project's tests/build for changed code when they exist and report results honestly.
- Update task memory at the end of every phase.

**Ask first:**

- Adding a dependency.
- Database schema changes or migrations.
- Deleting files, tests, or existing behavior.
- Changing public API contracts.
- Destructive or irreversible operations (data deletion, force push, infra teardown).

**Never:**

- Commit, log, or hardcode secrets, tokens, or credentials.
- Touch production configuration or deploy to production unless explicitly the task.
- Hand-edit vendor or generated directories (`node_modules`, `bin`, `obj`, `dist`, generated migration history).
- Weaken tests, validation, or security checks to make something pass.

---

## Repo Memory

Use `.ai-memory/` in this repository; create it if missing:

```text
.ai-memory/
  PROJECT_MEMORY.md      stable facts; becomes an index of wiki/ pages as the project grows
  wiki/                  topic pages (created only when PROJECT_MEMORY outgrows one file)
  sources/               immutable reference sources: papers, specs, RFCs (or pointer files)
  graphify-out/          generated code/source graph — gitignored, regenerable, never hand-edited
  TASKS/                 one compact file per non-trivial task
  TASKS/_archive/        completed task files
```

Rules:

- Write compact bullets, not prose or transcripts. Omit empty template sections. Every line must earn its tokens.
- First use in a repo: discover the exact build/test/lint/run commands (with flags) and record them at the top of `PROJECT_MEMORY.md`. Later sessions use and maintain these instead of rediscovering them.
- `PROJECT_MEMORY.md` holds only stable repo facts: stack, structure, commands, established patterns, hard rules, architecture decisions. Never task details.
- **Grow by reorganizing, never by deleting.** While small, `PROJECT_MEMORY.md` is a single flat file. When it outgrows ~100 lines, split content into `wiki/` topic pages (`architecture.md`, `backend-patterns.md`, `frontend-patterns.md`, `testing.md`, `gotchas.md`, ...) and turn `PROJECT_MEMORY.md` into an index: commands at the top, then one line per page. Sessions read the index first and open only the pages relevant to the task.
- **Update, don't delete.** Remove a fact only because it is wrong or no longer true — and record that as an update with a short note (`updated 2026-07-20: was X, now Y — reason`). If two sources genuinely conflict and it cannot be resolved yet, flag the contradiction explicitly instead of silently picking one.
- **Reference sources.** Papers, specs, and RFCs the implementation follows go in `sources/` (or a pointer file with URL/DOI when the original cannot be committed). Sources are read-only. On first use, ingest once: write a `wiki/ref-<name>.md` page distilling only what the implementation needs, with section/equation/page citations, the source version/date, a map from concepts to implementing files (`path:line`), and every intentional deviation ("source says X, we do Y because Z"). Sessions read the reference page, not the source; open the source only when the page cannot answer, then update the page.
- **Lint on completion.** When a task that touched memory heavily completes, sweep for duplicate facts to merge, superseded claims to update, contradictions to flag, and index lines that no longer match their pages. Reconcile — never trim for length.
- Task files use short kebab-case names (`backend-upload-validation.md`). At the end of each phase, update the task file: files touched, decisions, tests run, risks, recommended next phase.
- When a task fully completes: promote any durable repo-stable learning to `PROJECT_MEMORY.md`/`wiki/`, then move the task file to `TASKS/_archive/`.
- One fact, one place: facts already in `PROJECT_MEMORY.md`/`wiki/` are not repeated in task files. When updating, merge and dedup overlapping facts instead of appending near-duplicates.
- Do not read `TASKS/_archive/` files unless explicitly investigating past work.
- Templates live in the role library's `MemoryTemplates\` folder.

---

## Code & Source Graph

Graphify (MIT) turns a codebase and its documents/papers into a queryable graph, so the agent queries a map instead of grepping every file. This file drives it; the agent runs the commands.

- **Bootstrap (the agent runs this):** check `graphify --version`. If present, build or refresh the graph incrementally with `graphify extract . --code-only --update`. `--code-only` keeps extraction local and deterministic (tree-sitter AST, no API calls) — use it by default; add `--no-cluster` on rapid iteration and cluster periodically. If missing, ask the user once to install it with `uv tool install graphifyy` (a one-time global dependency, per the Boundaries rule); once installed it is available to all later sessions. If the user declines or the install is not possible (offline, sandboxed, no `uv`), take the normal route below.
- **Where it is written:** the graph belongs under `.ai-memory/` with everything else the agent consults. Graphify has no output-path flag — it writes a fixed `graphify-out/` folder (`graph.json`, `graph.html`, `GRAPH_REPORT.md`, `cache/`) — so run it with `.ai-memory/` as the working directory, pointing at the repo root, e.g. from `.ai-memory/`: `graphify extract .. --code-only --update`. Then confirm where `graph.json` actually landed, record that path in `PROJECT_MEMORY.md`, and add it to the repo's `.gitignore`. Keep it regenerable: it is a derived artifact, so never hand-edit it and never treat it as the durable record — if it is lost, rebuild it. Knowledge that cannot be regenerated from code still lives in `PROJECT_MEMORY.md`, `wiki/`, and `sources/`.
- **Documents and papers cost more than code:** ingesting PDFs/images/non-code sources requires an LLM backend (`--backend ...`), which sends that content to an external provider and costs tokens. Ask the user before ingesting any document, and never send sensitive or regulated material (clinical, legal, financial, PII/PHI) to an external backend without explicit approval. Code parsing with `--code-only` stays fully local.
- **Query before grepping:** `graphify query "..."`, `graphify path A B`, `graphify explain X` to locate relevant files and concept→code paths.
- **With `sources/`:** the graph gives fast concept→code lookup; the `wiki/ref-<name>.md` page still holds the intent and deviations the graph cannot derive. Complementary — the graph never replaces the ref page.
- **Fallback (the normal route):** Graphify is an accelerator, never a dependency. Whenever it is absent, declined, or erroring, read and grep files directly. The workflow must always work from `AGENTS.md` alone.

---

## Completion

At the end of a phase, report: role used, task memory file updated, files changed, tests added/run, documentation/tracker updates, risks/assumptions, and the recommended next phase (or "done").

---

## Fallback

If the selected role file cannot be read, report that clearly, then proceed using this file's Universal Rules plus the role's one-line scope from the table above.
