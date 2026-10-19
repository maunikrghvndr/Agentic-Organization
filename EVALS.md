# Evals — does the library earn its tokens?

A lightweight, markdown-only way to check whether a role, rule, or section actually improves output — and what it costs. This is the missing feedback the system needs: everything in the library was added on judgment, and only measurement tells you what to keep versus trim.

Be honest about what this is: **directional, not rigorous science.** LLM output is noisy, so one comparison proves little. But a structured A/B on real tasks beats guessing, and it is the only thing that turns "feels better" into evidence. Runs on real tasks in real repos; results accumulate here (library-level, beside `EngineeringTeam/`, like `LESSONS.md`).

## When to run one

- **Before trimming or cutting** a role/section — prove it is not load-bearing (or prove it is, and keep it).
- When a role or section feels heavy — is it earning its tokens?
- When a rule keeps failing to fire — is it actually changing behavior?

## The A/B protocol

1. Pick a **real, representative task** from an actual repo — not a toy.
2. **Define the success check up front:** what does a good result look like? (Met the acceptance criteria? Caught the bug/vuln it should? Reused instead of reinventing? Correct and complete?)
3. Run it **two ways, in fresh sessions, changing only one thing:**
   - **A** = with the role/section as-is.
   - **B** = without it (or with the trimmed version).
   Keep task, repo, and model identical.
4. Record for each: quality vs the success check (**pass / partial / fail** + what differed), approximate **token/context cost**, and iterations/time.
5. If the first task is ambiguous, repeat on **2–3 tasks** — noise is real; look for agreement across them.
6. **Verdict:** `KEEP` (B clearly worse) · `TRIM` (B roughly equal but cheaper) · `CUT` (no measurable difference).

## What every run records (added 2026-10-18 — the protocol above is unchanged)

An eval row without these fields is an anecdote, not a result:

- **Date**, **host + version** (e.g. Claude Code 2.1.302, Codex CLI x.y, Cursor x.y), **model id** (exact, e.g. `claude-opus-5-5`), **effort** level, **task repo + commit** the task ran against.
- **Trials:** at least **3 per arm**, each in a fresh session, reported as pass^3 (all three pass) — not best-of-3. A single trial per arm is logged as `exploratory`, never as a verdict.
- **Noise floor:** run arm A twice more than you think you need; a delta between A and B smaller than A's own run-to-run spread is logged as `no evidence`, whatever it looks like.
- **TRIM is conditional:** a TRIM verdict requires the trimmed variant to pass the same pre-registered checks as the full one on every trial; otherwise it is KEEP.
- **Cost:** `total_cost_usd` from Claude Code's JSON output (`claude -p --output-format json`), or `ccusage` (reads local logs for Claude Code and Codex), or `/cost` in-session; always with a `cost source:` field. On Cursor write `cost: n/a`. Figures are list-price estimates, not invoices.
- **Routing checks:** a run of `Evals/routing-cases.md` records `cases passed / total` with the failing case numbers.
- **Trace metrics, never self-report (added 2026-10-19, Hermes):** per trial `num_turns`, `duration_ms`, `total_cost_usd` from `claude -p --output-format json` (Codex: `exec --json` events; Cursor: n/a), tool-error and retry counts from the transcript, and the pre-registered check run as a command with its exit code. A verdict quoting the agent's own "tests passed" is an anecdote.
- **Mechanical success check first:** a marker, an on-disk artifact or a test/lint exit code wherever one can be defined; a judged pass/fail only when no mechanical check exists, and then labelled `judged`.
- **Trap tasks:** build each task so it contains the exact failure the section under test exists to prevent (a helper to reuse, a message to externalise, a secret in a fixture, an AC that is easy to drop), so pass/fail is observable in the diff. Draw traps only from the library's recorded real failures (`Evals/trap-tasks.md`), never invented toys — they must still be real, representative tasks.

Row format (replaces the shorter one below for new rows):

`- [YYYY-MM-DD] <what was tested> — host/model/effort: … — repo@commit — tasks: n — trials: A pass^3 / B pass^3 — turns A→B — tool errors A→B — verdict: KEEP/TRIM/CUT/no evidence — cost A→B (source) — note.`

## The first three A/Bs, in this order

1. **`backend-engineer.md` full file vs a scratch core + references variant.** The scratch variant lives outside the library (never committed as a role file); 2–3 real backend tasks in a real repo, each built as a trap from `Evals/trap-tasks.md`; success check defined before the run (ACs met, constitution and style rules obeyed, Evidence rows present). This run informs Decision B (whether the six large role files may be split) — until it has run, no role file is split.
2. **`LESSONS.md` whole (pre-2026-10-18 flat file, from git history) vs the index + area-file layout.** Validates F4: same task, does the area-filtered read lose anything a role needed?
3. **`AGENTS.md` with vs without the Code & Source Graph section** (the four-line summary that remains). Validates F2(B)/(C): did moving the procedure to `_shared/graph.md` change whether the agent uses the graph?

Plus one negative routing case from `Evals/routing-cases.md` (#17: a trivial fix must not trigger the analyst grill), recorded on the same host/model.

## Honesty rules

- Same task, same model; change exactly one variable.
- Judge against the **pre-defined** success check, not a vibe formed after seeing the output.
- One eval is weak evidence — agree across 2–3 tasks before acting.
- Record failures and surprises, not just confirmations.
- A `TRIM`/`CUT` verdict authorizes removal (with the cross-role coverage rule still applying); a `KEEP` verdict is the evidence to leave it and stop second-guessing it.

## Optional appendix — `claude plugin eval` (Claude Code only)

`claude plugin eval` (Claude Code ≥ 2.1.269) runs each case 3× in isolated `-p` sessions with and without a plugin and prints WITH / W/OUT / Δ / cost with six grader types. It cannot measure the `AGENTS.md` drop-in and it ablates a whole plugin, not one section, so it is an optional cross-check for a packaged role, never the protocol above. `/skill-doctor` and `claude plugin details` print always-on vs on-invoke token cost and are useful for the cost column only.

## Results log

Legacy format (rows before 2026-10-18): `- [YYYY-MM-DD] <what was tested> — tasks: <n> — verdict: KEEP/TRIM/CUT — note (token delta, quality delta).`

- (none yet) — Prior trims this far (within-file dedup, cross-role security dedup) were done on the coverage principle *without* a formal eval. They are the first candidates to validate here.
- [2026-10-18] **Lossless relocations, logged for the record (no A/B yet):** AGENTS.md procedure detail moved verbatim to `EngineeringTeam/_shared/{graph,memory,rules-detail}.md` (33,379 B / 236 lines → 32,167 B / 193 lines after Tier 1 additions; the always-on file would be ~38 KB without the moves); LESSONS.md split into index + 4 area files (26,888 B always-on → 6,751 B + the role's area file, 2.2–13.2 KB). Verdict: **pending A/B #2 and #3 above**; no content removed, so KEEP is the floor.
- [2026-10-18] **Duplicate-block detector (F22), `Lint-Library.ps1` W2, ≥8 identical consecutive lines, run on commit `004f929`:** backend-reviewer↔frontend-reviewer 19 blocks; backend-engineer↔frontend-engineer 11; ai-reviewer↔data-reviewer 2; ai-reviewer↔ml-reviewer 2; data-reviewer↔ml-reviewer 2; backend-engineer↔backend-reviewer 2; frontend-engineer↔frontend-reviewer 2. These are the only trim candidates; each is gated on its own A/B. The OAuth/PKCE, OWASP, WCAG, EARS and never-log blocks are role-shaped variants (implement / review / test), not verbatim copies, and are **not** candidates. First A/B to run from this list: the July 2026 cross-role security dedup named in the row above (does an engineer role still build it right with security depth living only in `security-engineer`?).
