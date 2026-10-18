# AGENTS.md rules — full text, relocated verbatim

Lossless progressive disclosure (2026-10-18): `AGENTS.md` keeps a compact form of each rule below and points here. The text here is the complete, authoritative wording; nothing in `AGENTS.md` contradicts it. Read a section when the compact line leaves a question open.

## Research before you build (Universal Rule)

- **Research before you build — do not reinvent solved problems.** Before hand-rolling any non-trivial functionality (retries/backoff, parsing, validation, date/time, serialization, crypto, HTTP, auth, caching, rate limiting, PDF/CSV/image handling, etc.), first check whether the project already depends on something that does it, then whether a mature, widely-used, well-maintained library solves it. If a battle-tested library exists, prefer it over custom code — writing your own version of a solved problem is a defect (more bugs, less secure, unmaintained). Use `researcher` to find and compare options when the choice is real. Adding a dependency is "ask first" (see Boundaries) and must be evaluated for maintenance, security, license, and weight — so also do not pull in a heavy dependency for something genuinely trivial, and never introduce one with known critical vulnerabilities. Confirm a proposed package exists on its registry with real history and maintainers before proposing it, and pin the exact version — model-suggested package names are often fictional and squatted. State the build-vs-reuse decision you made and why. Custom code is right only when no good library fits, the dependency is not justified, or the problem is genuinely novel to this domain. Every reviewer flags custom code that reinvents a solved problem a mature library handles well.

## Cross-stack features (Phase Protocol)

- **Cross-stack features:** (`researcher` when an external approach/tech/paper must be chosen first) → `analyst` (grill + spec) → `architect` (design, when needed) → `planner` (sequence + gate) → `backend-engineer` → `frontend-engineer` → reviewer(s) → `qa-engineer` as needed. Skip roles that add nothing (a straightforward change may go analyst → engineer → review, no researcher/architect/planner).

## Handoff contract (Phase Protocol)

- **Handoff contract (for work that DOES span sessions).** When a phase genuinely hands off to a later session — because the user chose to split it, or the review runs as a separate task — the task file's Handoff section lists: next role; the exact files (`path:line`) and `wiki/` pages to read first; what is done and verified; what remains; settled decisions not to relitigate. The next session trusts this list and does not re-explore. Within a single session, this context is already in hand — just continue, unless a compaction occurred (see Compaction / re-entry).

## Measure before you trim (Self-Learning)

- **Measure before you trim.** The library also holds `EVALS.md` at its root — a lightweight A/B protocol for checking whether a role or section actually improves output and what it costs. Before removing or trimming any role/section for weight, run (or ask the user to run) an eval to confirm it is not load-bearing, and record the verdict there. This is library-maintenance, not per-task work — do it when deliberately improving the library, not on every task.

## Self-Learning — when to write a lesson

When a non-trivial task teaches you a durable, generalizable engineering lesson — a mistake never to repeat, or a principle that clearly applies beyond this one repo (e.g. "never ship mock data in production code paths") — append a one-line takeaway to the library `LESSONS.md` (cross-cutting) or the matching `LESSONS/<area>.md`. Rules:

## Rework loop (Phase Protocol)

- **Rework loop:** reviewer/security/QA findings route back to the engineer role. The first review follows the independence rule above; **every re-review after a fix runs in a fresh context** — a reviewer subagent when the host has one, else a new session (`claude -p` or `--worktree` with the role, `codex review --base`, a new chat), cross-model when available; the floor every host can meet is a new chat that re-reads the diff from scratch and reviews adversarially. Feed it the diff, the AC ids, the constitution and the task file's Decisions — **never the implementer's transcript**. Every Blocking finding carries `Verification: Confirmed` (reproduced, ran, or traced to a failing test) or `Probable` (a concrete `path:line` chain, not executed); `Unverified` is reported but cannot block. Blocking stays as each role defines it, the style rules included. **Cap: 3 rounds**; on exhaustion the engineer records the open disagreement in the task file, marks the ROADMAP item Blocked, and the user decides. On Claude Code, `/code-review` and `/security-review` are an optional first pass, never the independent review.

## Parallelism: one writer (Phase Protocol)

- **Parallelism: one writer.** Default is one session, sequential roles, one writer. The only sanctioned parallelism is read-only fan-out: the matching reviewer, `security-engineer` and `qa-engineer` may review the same frozen diff concurrently when the host can run subagents or parallel sessions, otherwise one after another (same outcome, only wall-clock differs). Writer phases never run concurrently on overlapping files; a planner phase marked `[P]` may run in a separate worktree or session only when its `Owns:` paths are disjoint from every other `[P]` phase. After fan-out the engineer merges and deduplicates all findings into the task file before fixing; any one reviewer's Blocking is blocking. A phase running in a worktree does not write `TASKS/`, `ROADMAP.md` or `PROJECT_MEMORY.md` — it reports, and the parent records after merge (memory stays single-writer).
