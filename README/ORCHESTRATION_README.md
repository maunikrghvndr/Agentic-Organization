# Agentic Organization Role Library

A portable, provider-agnostic role library for coding agents: it depends on no AI tool or vendor. Drop `AGENTS.md` into any repo; the agent routes each task to one specialized role and follows that role's discipline.

## From idea to release: the whole team, as agents

This library is a complete software organization run by agents: every stage a product team has between "I have an idea" and "it is released" has a named role with its own full-depth rule file, and the work moves through them in order, in one session, with written evidence at every step.

| Stage | Who (role) | What comes out |
|---|---|---|
| Research | `researcher` | Current options compared with dated, cited evidence; runs at fixed trigger moments for every department (before a new dependency, service, model or unfamiliar pattern); for work outside this team, scouts and suggests the best outside skill |
| Requirements | `analyst` | Your intent grilled into testable acceptance criteria (EARS) and a durable spec |
| Design and oversight | `architect` | Data model, API shape, boundaries, technology choices, reuse map; then the technical owner of the whole: the role map, the escalation point when areas do not fit, and a design conformance pass before release |
| Planning | `planner` | Role-scoped phases with a done-when that can fail, and a completeness gate before any code |
| Build | `backend-`, `frontend-`, `devops-`, `data-`, `ml-`, `mlops-`, `ai-`, `prompt-`, `rag-`, `nlp-engineer`, `data-scientist` | The change, with a test seen failing first and an Evidence row for every check |
| Diagnosis | `debugger` | Root cause only; the engineer fixes in the next phase |
| Review | `backend-`, `frontend-`, `devops-`, `data-`, `ml-`, `ai-reviewer` | An independent review in a fresh context, on a different model family than the one that wrote the code whenever one is available (a model does not judge its own work); findings go back to the engineer (3 rounds at most) |
| Test | `qa-engineer` | Each criterion traced to code and a covering test; Ready / Not Ready |
| Security | `security-engineer` | A mandatory review of every sensitive change, and the **release audit** of the whole application before a release is done |
| Memory and learning | every role | Repo facts in `.ai-memory/`, the roadmap board, and cross-project lessons you approve in `LESSONS.md` |

What holds it together: one entry file (`AGENTS.md`) that reads the same in any coding agent that loads it; your own coding standards (explicit types, structured logging, no hardcoding) enforced by the reviewers; the agent never marks its own work Done, never merges, and asks before anything risky.

**How this differs from the large agent bundles** (for example `affaan-m/ECC`, studied in `.ai-memory/TASKS/new-repos-landscape/`): the aim is the same loop — plan, test, implement, review from a fresh context, verify, remember, improve — but this library is a small set of full-depth roles and one portable contract instead of hundreds of skills and a hook runtime tied to one host; third-party skills are an optional, reviewed, pinned list, never the core; and a rule is added only when it names the failure it prevents (`EVALS.md` is the test method). Honest limit: that test method has not yet been run, so the rules here rest on judgment and review, not measured results.

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

**Your only step is dropping `AGENTS.md` into a repo root.** The agent does the rest, asking first each time: it finds or clones the library; if the repo's copy of `AGENTS.md` has fallen behind the library's master (for example after roles moved into department folders) it offers to refresh the copy; and once per machine it offers to fetch the optional curated skills into the library's own `Skills/installed/` folder, running only the steps you accept. The installer is what the agent runs for you; you can also run it yourself. Unattended runs never change anything: they report what is stale and continue. Detail: `EngineeringTeam/_shared/rules-detail.md` → Setup.

## Structure

```text
Agentic-Organization/
  AGENTS.md                master copy of the drop-in file (router + universal rules)
  LESSONS.md               shared, cross-project self-learned engineering takeaways: rules, index, cross-cutting lessons (read by all repos)
  LESSONS/                 area files the index maps to roles: backend.md, frontend.md, data-ml-ai.md, tooling-agent-workflow.md
  EVALS.md                 A/B protocol + log for measuring whether roles/sections earn their tokens
  SHARED_LIBRARIES.md      cross-project register: shared libraries and candidates seen in more than one project (owner-approved; read at the trigger only)
  STRUCTURE.md             the owner's own project layout patterns per stack: the fallback when a repository's organization has no pattern (owner-approved; gaps are marked)

  EngineeringTeam/         24 role files — single-file roles at the root, the rest in department folders — the catalog (role, folder, use-for) is the AGENTS.md role table:
    architect.md           the technical owner: system design, area design checks, role map, escalations, design conformance before release
    researcher.md          research for every department (triggers) and the skill scout
    Product/               analyst, planner
    Backend/               backend-engineer, backend-reviewer
    Frontend/              frontend-engineer, frontend-reviewer
    DevOps/                devops-engineer, devops-reviewer
    Data/                  data-engineer, data-scientist, data-reviewer
    ML/                    ml-engineer, mlops-engineer, ml-reviewer
    AI/                    ai-engineer, prompt-engineer, rag-engineer, nlp-engineer, ai-reviewer
    Quality/               qa-engineer, debugger, security-engineer
    _shared/               on-demand detail relocated verbatim from AGENTS.md: graph.md (graph procedure), memory.md (Repo Memory detail), rules-detail.md (long-form rules); plus work-loop.md (inner work loop habits, added 2026-11-18, read on demand)

  Evals/
    routing-cases.md       one-line tickets with the expected role (incl. near-misses and the negative trivial case) + hierarchy cases; results go in EVALS.md
    trap-tasks.md          recorded real failures to build A/B tasks around, each with a programmatic check

  .github/workflows/
    lint-library.yml       CI: runs both lints on push/PR (read-only permissions, SHA-pinned checkout)

  MemoryTemplates/
    CONSTITUTION.template.md
    ROADMAP.template.md
    PROJECT_MEMORY.template.md
    TASK_MEMORY.template.md
    REFERENCE.template.md

  Scripts/
    Lint-Library.ps1       static library lint: dead heading refs, role catalog, README vs disk, relics, LESSONS format, hidden text, size cap
    Lint-RepoMemory.ps1    optional lint for a repo's .ai-memory/: wiki index contract, links, roadmap vs archive, Evidence rows, EARS, hidden text
    Sync-AgentsMd.ps1      copy/refresh AGENTS.md into every repo under a parent folder (warns past the library's size limit)
    pre-commit.gitleaks.sh plain git pre-commit secret gate (fails closed when gitleaks is absent); optional, no AI tool involved
    tests/
      Lint-Library.Tests.ps1   positive controls for both lints: each error rule (E1-E7, R1-R10) fires on a planted violation; clean fixtures stay clean
      release-audit/         fixtures for the release-audit validator tests
    validate-release-audit.mjs       checks a task file's Release Audit record (ledger vs findings vs verdict); Node, any OS
    validate-release-audit.test.mjs  its tests (node --test Scripts/validate-release-audit.test.mjs)

  Skills/
    README.md              optional: curated third-party skills, how one gets on the list
    skills.manifest.json   the list: each skill pinned to a full commit sha with a review record
    install-skills.mjs     fetches every listed skill that is missing into the library's own Skills/installed/ (git-ignored; pinned git fetch; --dry-run, --list, --upgrade, --with-optional)
    install-skills.test.mjs  its tests (node --test "Skills/*.test.mjs")
    reviews/               one security review record per listed skill

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
- Warns when the source exceeds 32,768 bytes (the library keeps `AGENTS.md` at or under 32,768 bytes and 200 lines), naming the sections that fall past the limit.
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
- **Self-learning (closed loop):** repo-specific knowledge goes in that repo's `.ai-memory/`; **general, transferable takeaways** ("never ship mock data in production") go in the library's shared `LESSONS.md` (cross-cutting) or `LESSONS/<area>.md` (its index maps areas to roles), which every repo reads and every agent proposes to (written only after the user approves). Stable universal lessons graduate into the role files. Inspired by Hermes' and Multica's skill-compounding, done in markdown with no runtime.
- **One writer, read-only fan-out:** phases run sequentially in one session; the only parallelism the library sanctions is concurrent *review* of a frozen diff (reviewer + security + QA) when the host can run subagents or parallel sessions, plus planner `[P]` phases with disjoint `Owns:` paths. The sequential fallback is always correct.
- **Three memory stores, no overlap:** the library (`AGENTS.md`, roles, `LESSONS.md`) is the shared contract; the repo's `.ai-memory/` holds repo facts; the tool's per-machine memory (whatever the tool offers) holds machine-local facts and personal corrections and is never a source of truth — a durable repo property it captures gets promoted to `PROJECT_MEMORY.md`.
- **Progress board:** `.ai-memory/ROADMAP.md` is the per-repo glance view — every feature/task grouped Backlog / In Progress / In Review / Blocked / Done, linking to task files and specs. Read it to re-orient after a context switch; roles keep it current; delivery moves an item to In Review and only your recorded acceptance moves it to Done (the agent never marks its own work Done). It's the index over `TASKS/`, the way `PROJECT_MEMORY` indexes `wiki/`.
- **Measure before trimming:** the library's `EVALS.md` is a lightweight A/B protocol — run a real task with vs. without a role/section, compare quality and token cost, and let the verdict (KEEP / TRIM / CUT) drive what stays. Directional, not rigorous, but it turns "feels heavy" into evidence and is the honest antidote to a library that only ever grows.
- **Graph accelerator:** the Graphify git hook (above) keeps the graph fresh on every commit, and `AGENTS.md` drives the agent to *query* it instead of grepping — it builds the graph only when no hook maintains it. Code extraction uses `--code-only` (local tree-sitter AST, no API calls); ingesting documents/PDFs needs an LLM backend and is gated on the user's approval. The graph lands under `.ai-memory/` (gitignored, regenerable) alongside the rest of what the agent consults. It checks for the tool, asks once to install if missing, and falls back to normal file reading if the tool is absent or declined — never a hard dependency, so the drop-in stays one file.
- **Proportional complexity:** before code, one task-file line `Simplest design: …`; every new abstraction, option, pattern, dependency or module needs a `Ledger:` reason tied to an AC or decision, and a trivial change adds none. A missing reason is a Blocking review finding (`_shared/rules-detail.md` → Proportional complexity).
- **Shared code and structure:** code that is not product-specific is checked against `SHARED_LIBRARIES.md` before it is written (never copied between repositories; extraction is its own ask-first task), and a file goes where `STRUCTURE.md`, then the repository's recorded structure, then its siblings say (`_shared/rules-detail.md` → Shared code across projects, Project structure).
- **Inner work loop:** the habits for lookups, edits, the compaction checkpoint and side contexts live in `_shared/work-loop.md` (the checkpoint in `_shared/rules-detail.md` → Compaction / re-entry addendum), read on demand through one pointer line in the engineer roles and `debugger`; nothing is added to the always-loaded `AGENTS.md`.

## Headless / CI use

The library ships no headless runner (`Router/classify-ticket.md`, the old ticket-classification prompt, is deprecated and kept only for reference). Piping untrusted ticket text into an agent with repo write access and ambient credentials, with no turn, budget, sandbox or permission limits, is the failure to avoid. When a real unattended run exists in one of your repos, follow this, in whatever tool runs it.

**Rule of Two (Meta, 2025-10-31; Microsoft's prescription after the 2026 CI agent-action incidents).** An unattended run holds at most two of (A) untrusted input, (B) secrets, credentials, private data or sensitive systems, (C) any state change or external communication; the single definition and the enforcing controls (token scopes, sandbox, approval gate) are in `EngineeringTeam/_shared/rules-detail.md` → Rule of Two. Treat ticket/issue/PR text as data, not instructions — see `AGENTS.md` → Universal Rules (instruction source hierarchy). Run unattended work in a sandbox (a container or a virtual machine), with hard turn and budget limits, read-only token scopes by default, and never an unattended write to the library, to agent configuration or to a remote. Read tickets through the tracker's own read-only interface rather than pasting ticket text into the prompt.

Fresh context is not filesystem isolation: a reviewer can read any file in the workspace, including the task file's notes; only its Summary, AC ids, Decisions, `Owns:` and Evidence are inputs.

## Measuring cost

EVALS.md rows need a cost figure with its source: the tool's machine-readable run output or its usage log. Where the tool exposes none, write `cost: n/a`. All figures are list-price estimates.

## Maintaining The Library

- **Before every library commit run `.\Scripts\Lint-Library.ps1`** (CI runs it too via `.github/workflows/lint-library.yml`; `Scripts\Lint-RepoMemory.ps1 -RepoRoot <repo>` is the optional sibling for a project's `.ai-memory/`, pasted as an Evidence row at the completion sweep) (errors: dead `AGENTS.md → Heading` references, roles missing from the table, README Structure vs disk, relic strings, undated LESSONS lines; warnings: AGENTS.md size, duplicate blocks across role files, hardcoded `wiki/spec-`, a role file of 1,800 lines or more). After changing either lint, run `.\Scripts\tests\Lint-Library.Tests.ps1` (plain PowerShell, temp fixtures only): a lint that has only been seen to pass has not been seen to work.
- `AGENTS.md` owns routing + universal rules. Role files own role behavior. Do not restate role content in `AGENTS.md` (drift risk).
- The role library path appears exactly once, at the top of `AGENTS.md`. The agent self-heals it (Role library resolution block) with the user's permission; no manual edit needed.
- Coding-style rules (explicit types / no `var` abuse, no `any`, `Constants.cs` / `FrontendConstants` patterns, structured logging with constant templates, no hardcoding) live in the engineer role files and are enforced by the reviewer roles — keep both sides in sync when changing a style rule.

## Release audit (whole application)

When a release is finished, and before it merges into the default branch, `security-engineer` audits the whole application — not just the last change. A release cannot move to Done without a passing audit record.

- **Two engines, one record.** Engine A is Cloudflare's `security-audit` skill, used when it is present and unmodified under the library's `Skills/installed/` and its validators can run. Engine B is the library's own procedure in `EngineeringTeam/Quality/security-engineer.md` → Release Audit (whole application), used everywhere else (the skill absent, native Windows). Both write the same record into the task file.
- **The procedure:** map the application; build a coverage table (only the table counts as proof an area was reviewed); hunt area by area with the role's checklists; hand every suspected issue to a fresh reviewer told to disprove it; a fresh critic looks for missed areas; the report is written last. An unfinished audit is never a pass.
- **The checker:** `node Scripts/validate-release-audit.mjs <task file> --repo <root> --release --head <40-character head sha>` exits 0 only for a complete, unambiguous passing record (standard or deep profile, full scope, two clean critics, no open confirmed finding). It proves the record is consistent, not that the audit was honest; the fresh reviewer and critic steps cover that.
- **Native Windows:** Cloudflare's own validators do not run there, so Engine B is used unless you work in WSL2 or a devcontainer.
- Trigger, confirmation before starting (it is expensive) and the Done rule: `EngineeringTeam/_shared/rules-detail.md` → Release audit.

## Skills (optional, curated third-party skills)

The roles are complete without any skill. `Skills/` is an optional list of third-party skills that passed a security review and are pinned to an exact commit, with an installer that fetches them into the library's own `Skills/installed/` folder in one command. An installed skill is read by path as reviewed third-party guidance, ranked below the role file, by whatever tool is in use; no tool's own folder is written, and the fetched copies are git-ignored, never committed.

```powershell
node Skills/install-skills.mjs --dry-run        # show what would be installed, change nothing
node Skills/install-skills.mjs                  # install every listed skill that is missing
node Skills/install-skills.mjs --with-optional  # also install the skills marked optional
node Skills/install-skills.mjs --list           # show each skill's state (present / modified / missing)
node Skills/install-skills.mjs --skill <name>   # install one listed skill by name (used after the skill scout suggests one)
```

- **On the list today:** `security-audit` (Cloudflare, the release audit), `wrangler` and `workers-best-practices` (Cloudflare), and `hallmark` (UI for a new page or site built from nothing; optional because it is heavy).
- **How a skill gets on the list:** a `security-engineer` review of the skill at one commit, read and never run; the record goes under `Skills/reviews/`; you approve the entry. Only skills that pass are listed.
- **What the installer never does:** run anything from a fetched repository, use an upstream install tool, touch a skill folder it did not install, or write outside the target folder and a temporary folder. Default target is the library's own `Skills/installed/`; `--target <dir>` overrides it.
- **Skill scout:** ask for work this team does not cover (for example market research) and the `researcher` searches for the best outside skill, opens every candidate, and suggests at most three with stars (dated), last commit, licence and visible risks. It never installs: on your yes the skill gets its security review, goes on the list as optional, and is installed alone with `--skill <name>`.
- An installed skill never overrides `AGENTS.md`, the project constitution or a role file. Details and per-skill conditions: `Skills/README.md`.
