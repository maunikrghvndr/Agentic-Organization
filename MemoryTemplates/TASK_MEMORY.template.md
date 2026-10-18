# Task: <short-kebab-name>

Compact bullets. Omit empty sections. Updated by every role that works this task. Goal is handoff, not transcript. On completion: promote durable learnings to PROJECT_MEMORY.md, then move this file to TASKS/_archive/.

## Summary
- Goal: / Status:
- Current phase + role / done-when / read-first: (the on-disk re-entry point after a compaction or a new session — refresh it at **every** role switch, including when planner was skipped)
- Spec (durable): `specs/<feature>/spec.md` in a Spec Kit repo, else `.ai-memory/wiki/spec-<feature>.md` (analyst owns; carries the EARS criteria across the feature's life)
- Assumptions: accepted defaults, dated (mirrored from the spec's `## Assumptions`)
- Acceptance criteria (EARS, stable ids — mirrored here for the active task):
  - `AC-1` WHEN ... THE SYSTEM SHALL ... → status / implementing `path:line` / covering test
- Design decisions (from architect, if that phase ran): key decisions by name, referenced from `wiki/architecture.md` or task memory.

## Plan
- Phases and roles (from planner, if used):

## Files
- Inspected: `path` — why (only non-obvious ones)
- Changed: `path` — what/why

## Decisions
- Decision — reason.

## Behavior Preserved
- Only where preservation was non-obvious or at risk.

## Evidence
- Added tests: / Updated tests:
- One row per check run: `<exact command>` | scope | exit code | sha or `uncommitted` | output path or first failing line
- Not run: <check> — <why>
- UI change: screenshot path + console errors, or `UI not visually verified`
- One row suffices for a trivial edit. A claim with no command + exit code is "not verified"; reviewers treat "tests passed" with no row as blocking.

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
