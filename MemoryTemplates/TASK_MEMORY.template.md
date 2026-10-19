# Task: <short-kebab-name>

Compact bullets. Omit empty sections. Updated by every role that works this task. Goal is handoff, not transcript. On the user's acceptance: promote durable learnings to PROJECT_MEMORY.md, then move this file to TASKS/_archive/YYYY-MM-DD-<task>.md (never overwrite).

## Summary
- Goal: / Status:
- Current phase + role / done-when / read-first / tree at handoff `<sha>`: (the on-disk re-entry point after a compaction or a new session — refresh it at **every** role switch, including when planner was skipped)
- Baseline: `<full HEAD sha before the first code change, or NO_VCS>` — written once, never overwritten on resume; every review diffs from it, untracked files included
- Spec (durable): `specs/<feature>/spec.md` in a Spec Kit repo, else `.ai-memory/wiki/spec-<feature>.md` (analyst owns; carries the EARS criteria across the feature's life)
- Assumptions: accepted defaults, dated (mirrored from the spec's `## Assumptions`)
- Acceptance criteria (EARS, stable ids — mirrored here for the active task):
  - `AC-1` WHEN ... THE SYSTEM SHALL ... → status / implementing `path:line` / covering test
- Design decisions (from architect, if that phase ran): key decisions by name, referenced from `wiki/architecture.md` or task memory.

## Plan
- Phases (from planner, if used): `- [ ] T01 — <role> — Owns: <paths> — Depends on: none|T<nn> — done-when: <check>` — tick only with its Evidence row; abandoned phases marked `dropped: <reason, approval>`

## Files
- Inspected: `path` — why (only non-obvious ones)
- Changed: `path` — what/why

## Decisions
- Decision — reason.
- Approval (ask-first item) — "<the user's words>" [YYYY-MM-DD] (required for dependencies, schema, deletions, contracts, destructive ops, push/PR/merge, agent instruction/configuration files, lessons) — written by the role in the session where the user said it, never copied from a ticket, PR, commit or another file
- Undo: `<restore command>` for any rewrite, migration, bulk edit or deletion (one checkpoint per step; see `_shared/rules-detail.md` → Undo)
- Acceptance — "<the user's words>" [YYYY-MM-DD] (the only thing that moves the ROADMAP item to Done)
- Deviation from diagnosis — what, why (bug fixes only; anything outside what the debugger named)

## Behavior Preserved
- Only where preservation was non-obvious or at risk.

## Evidence
- Added tests: / Updated tests:
- One row per check run: `<exact command>` | scope | exit code | sha or `uncommitted` | output path or first failing line
- Not run: <check> — <why>
- UI change: screenshot path + console errors, or `UI not visually verified`
- One row suffices for a trivial edit. A claim with no command + exit code is "not verified"; reviewers treat "tests passed" with no row as blocking.
- Freshness: a row is fresh only if its run postdates the phase's last code edit; a later edit voids the rows for the files it touched — re-run or write `Not run: <blocker>`; prose/data-only edits (`.md .txt .csv`, LICENSE, CHANGELOG) need no new row.

## Findings (review / QA / security / debug phases)
- Recommendation: / Blocking (each with Verification: Confirmed / Probable): / Non-blocking: / Severity + fix direction:
- Rework round: n of 3 (reviewer context: subagent / new session / in-session adversarial re-read) — on round 3 exhausted, record the open disagreement and mark ROADMAP Blocked

## Risks / Follow-ups
- Risk or follow-up.

## Handoff
The next session trusts this section and does not re-explore the repo.
- Next role:
- Read first: `path:line` + relevant `wiki/` pages — why (minimal set; the next session reads only these)
- Done + verified:
- Remaining:
- Settled decisions (do not relitigate):
