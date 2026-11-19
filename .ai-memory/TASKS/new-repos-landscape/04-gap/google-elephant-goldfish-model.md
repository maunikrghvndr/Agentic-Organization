# Gap check: google/elephant-goldfish-model (EGM) vs the Agentic-Organization library

- Date: 2026-11-18. Role: researcher (gap check only; no library file edited).
- Input: `.ai-memory/TASKS/new-repos-landscape/03-read/google-elephant-goldfish-model.md` (EGM commit `210977c`, v0.1.1), read as data.
- Library state checked on disk: `AGENTS.md` 32,668 bytes / 194 lines (headroom 100 bytes, 6 lines). Every proposal below therefore targets `_shared/`, a role file, a template, `EVALS.md`, the README or an overlay. **No proposal touches `AGENTS.md` (byte cost 0 for all).**
- Method: `rg` over the library (excluding `.ai-memory/`), then the matching lines read. Quotes are from the files at the cited `path:line`.
- Not run: `Scripts/Lint-Library.ps1` (no library file changed, nothing to lint). No EGM code executed, nothing installed.
- Not repeated from prior research: `omitClaudeMd` was already examined and rejected (`library-field-review-2026-10.md:174`: "No `omitClaudeMd: true` on subagent shims — it strips AGENTS.md and the constitution pointer"); read-only reviewer shims are F24 of the same file; Evidence rows / `Not run:` are F7.
- Evidence caveat that applies to every proposal: the deep read found **no outcome evidence** for any EGM review mechanism (only "the workflow ran and was isolated" probes). Every adoption below is on argument, not on EGM data, and is worded so an `EVALS.md` trap task can test it.

## 1. Classification table

| # | EGM mechanism | Classification | Library evidence (path:line, quote) | Gap / verdict |
|---|---|---|---|---|
| 1 | Fresh-context reviewer, hard stop when no subagent | Partially covered (deliberate difference) | `EngineeringTeam/_shared/rules-detail.md:42` "every re-review after a fix runs in a fresh context … **never the implementer's transcript**"; `:62` "Strongly prefer running the review as a fresh session/task"; `AGENTS.md:78` "fallback: fresh session → in-session adversarial re-read" | First review may fall back to in-session; EGM hard-stops. A hard stop **conflicts with "the workflow must work from AGENTS.md alone" / tool-agnostic** (hosts without subagents would get no review). Reject the hard stop; adopt only the labelling (P1: the reviewer context is already recorded, `MemoryTemplates/TASK_MEMORY.template.md:42`). |
| 2 | GoldfishContext: bounded reading list, URL/out-of-tree approval | Partially covered | `Agents/claude/backend-reviewer.md:13` "Review only the inputs handed to you: the diff from the Baseline sha plus untracked files, the spec AC ids, the constitution and the task file's Decisions. You have read access to the whole repo."; `Workflows/review-loop.js:97` (INPUTS) | Inputs are named; reading is not bounded (code review needs the repo). No rule for URLs or out-of-tree links in a spec. Low value for diff review; no proposal. |
| 3 | Instruction-file exclusion as a separate isolation property | Partially covered (opposite decision, already taken) | `Agents/claude/backend-reviewer.md:2` "Never add the omitClaudeMd field (it would strip AGENTS.md from this agent)" | The library wants `AGENTS.md` in the reviewer (it carries the rules, not the author's reasoning). Missing: a per-host record of which isolation property actually holds. See P5. |
| 4 | Read-only reviewers by tool allowlist; parent is the only writer | Already covered | `Agents/claude/backend-reviewer.md:7-8` "tools: Read, Grep, Glob, Bash / disallowedTools: Edit, Write, NotebookEdit"; `:2` "Bash is kept … it is not read-only — the user-level deny/ask baseline (Settings/) and the sandbox bound it"; `rules-detail.md:46` "one writer" | Same honesty about limits as EGM. Nothing to add. |
| 5 | Staged design-review pipeline with altitude ordering (stages 5-9) | Partially covered | Role order `AGENTS.md:82` (analyst → architect → planner gate → engineers → reviewers/qa); `EngineeringTeam/architect.md:72` "Prefer the smallest design that satisfies the acceptance criteria"; `backend-reviewer.md:246` "Simplicity And Overengineering Review" | Altitude is carried by role sequence, not by five reviewer stages. A 9-subagent design review is cost without evidence. Reject. |
| 6 | Paraphrase-first comprehension test by a zero-context reader | Partially covered | `EngineeringTeam/analyst.md:86` "read the whole AC set once as a stranger would: criteria that conflict, a concept no criterion defines, a line with two readings" | Same-session, and a list of defects, not a restatement. "Terms defined but parts do not connect" is not caught. See P4. |
| 7 | Named review loop: settled / fixed-not-settled / clean round / two clean rounds / churn / cap 5 / stable ids | Partially covered | `rules-detail.md:42` "**Cap: 3 rounds**; on exhaustion the engineer records the open disagreement"; `:95` "If the same Blocking finding survives two rounds, round 3 opens with a `debugger` diagnosis"; `Workflows/review-loop.js:99` `keyOf` = file + first 80 chars of summary | Present: cap, survive-twice rule. Missing in the prose contract: what "clean" means when a reviewer did not run, settled vs fixed, churn (a fix that creates the next finding), stable finding ids (the overlay matches on summary wording, which is fragile). Two-consecutive-clean-rounds is Missing. See P2. |
| 8 | Failed reviewer is "not run", never "zero findings" | Partially covered (overlay only) | `Workflows/review-loop.js:137` "no result (agent stopped, stalled on every attempt, or failed); this reviewer did not clear the diff"; `Agents/claude/backend-reviewer.md:17` "Never discard or skip a result: an input you could not read … is reported and flagged, not dropped" | The rule lives only in the Claude-only overlays. The portable prose (`AGENTS.md`, `rules-detail.md`, role files, task template) never says a reviewer that produced no report did not pass. Codex/Cursor users get no such rule. See P1 (highest value). |
| 9 | Resolver taxonomy constraining the author (CONTEST needs checkable evidence, no severity change, no padding) | Partially covered | `rules-detail.md:62` "never soften a finding because you wrote the code" (binds the reviewer); `Workflows/review-loop.js:120` "\"disagreed\" lists each key you did not change and why"; `Workflows/review-loop.test.mjs:40` uses `reason: 'by design'` | Nothing binds the **engineer's** disagreement: a bare "by design" is accepted (the overlay's own test fixture uses it). No rule that the fixer cannot reclassify Blocking. See P3. |
| 10 | Human gates with zero-tool yield; unranked options, no "(Recommended)" | Partially covered (deliberate difference) | `rules-detail.md:91` "An answer to a design question is never consent to proceed; silence is not acceptance."; `analyst.md:80` "Offer a proposed default answer with each question"; `architect.md:71` "Decide, do not enumerate. Pick one approach" | Gates exist. The library deliberately recommends defaults and has the architect decide; EGM's "author decides, no recommendation" is the opposite policy, with no evidence. Reject. |
| 11 | Synthesizer subagent (fan-out, dedup, one-line return; optional A/B double instances) | Already covered (dedup); Missing (A/B instances) | `rules-detail.md:46` "the engineer merges and deduplicates all findings into the task file before fixing; any one reviewer's Blocking is blocking"; `Workflows/review-loop.js:130` `mergeRound`; shim rule 5 "No nested fan-out: you are depth 1" | Dedup is covered and done by the parent, which keeps nesting off (works on hosts without nested agents). Double instances per reviewer: Reject (doubles cost, EGM offers no recall data). |
| 12 | Artifact-first delivery (reports to files, not chat) | Already covered | `AGENTS.md:153` "Task files … At the end of each phase, update the task file: files touched, decisions, tests run, risks"; `MemoryTemplates/TASK_MEMORY.template.md:40` "## Findings (review / QA / security / debug phases)" | Task file + `wiki/spec-*` are the artifacts. Nothing to add. |
| 13 | Anti-sycophancy constraints (banned adjectives, critique first) | Partially covered | `backend-reviewer.md:89` "Rejected rationalizations — none of these turns a failed check into a pass"; `rules-detail.md:62` "must not rubber-stamp" | Behavioural rules exist; word bans do not. No evidence that word bans change findings. Reject. |
| 14a | Zero-Decision Rule + exact Create/Modify/Delete file list | Partially covered | `planner.md:102` "an `Owns:` line naming the exact paths it may write"; `planner.md:177` "Every design decision consumed: yes / list gaps."; `architect.md:170` "`path` (the exact file the change lands in; the planner derives `Owns:` from these)" | Paths are exact; they are not marked existing vs new, and the gate does not ask whether a phase still leaves a design choice to the engineer. See P6. |
| 14b | Alternatives Rule (a single-path design fails) | Conflicts with library policy (not a hard constraint) | `architect.md:71` "Decide, do not enumerate"; `architect.md:90` "The alternative considered, only when the trade-off was genuinely close." | Deliberate. `researcher` covers real option comparison (`researcher.md:77`). Reject. |
| 14c | Zoom-out: context-sufficiency precheck, YAGNI, reuse | Already covered | Shim rule 2 "Spec and task state must be passed to you explicitly; if they were not, say so in your report instead of guessing"; `architect.md:74` "Do not propose speculative abstractions"; `AGENTS.md:99-100` reuse rules | Nothing to add. |
| 15 | Codebase-details reviewer: every cited file/function exists; "proposed files are not findings" | Partially covered | `architect.md:65` "Do not design against an imagined codebase. Design against the code that exists"; `qa-engineer.md:464` "checkboxes in the plan … are claims, not evidence — verify every row against the code" | A principle for the author; no mechanical check before implementation that the paths a design/plan cites as existing resolve. See P6. |
| 16 | Style reviewer with claim calibration (DROP / CALIBRATE / RELOCATE / KEEP) | Partially covered | `researcher.md:77` "Separate three things explicitly: **verified** … **claimed** … **inferred**"; `AGENTS.md:106` Evidence rows; `backend-reviewer.md:928` "Is documentation accurate?" | Calibration is enforced for research and test claims, not for spec/doc prose generally. Small; no proposal. |
| 17 | Spec-to-code drift report (periodic, whole repo, reverse coverage) | Partially covered | `qa-engineer.md:458` "Flag **drift**: implementation satisfies a different behavior than the criterion states"; `:459` superseded criteria "`Still present` is Blocking drift"; `:457` scope no criterion asked for; `_shared/memory.md:30` "Memory→Code drift is a reviewer finding" | Per-task drift (both directions) is covered and is stricter than EGM's. Missing: a periodic sweep across all specs outside a task. EGM's own version is an untested 3 KB prompt. Defer (P7, no wording proposed for adoption now). |
| 18 | Brainstorm: clarification gate, then 7-lens swarm | Partially covered | `analyst.md:65` "Ask targeted, high-value questions in one batch (5–10)"; `analyst.md:59` "Do not ask the user questions the code can answer." | Clarification is covered. A 7-subagent lens swarm is Missing; cost with no evidence, and not available on hosts without subagents. Reject. |
| 19 | Bootstrap: bottom-up README generation with safety gate | Partially covered (different approach) | `AGENTS.md:150` "First use in a repo: discover the exact build/test/lint/run commands … record them at the top of `PROJECT_MEMORY.md`"; `AGENTS.md:161-168` Code & Source Graph | Orientation is done by `PROJECT_MEMORY.md` + Graphify, not by writing README files across the tree. Bulk README writes cut against "smallest safe change". Reject. |
| 20 | Own verification discipline: harness test record, native traces not receipts, prose unit tests, `not run` | Partially covered | `EVALS.md` "Date, host + version … model id"; "Trace metrics, never self-report … A verdict quoting the agent's own \"tests passed\" is an anecdote"; `Scripts/Lint-Library.ps1:7-24` (E1-E7, W1-W3); `Workflows/review-loop.test.mjs`, `Hooks/*.test.mjs` | Evals, lint and overlay unit tests exist. Missing: a recorded **live isolation probe** for the `Agents/claude/` shims and the review-loop workflow (does the reviewer really not see the parent turn, per host version). See P5. |
| 21 | Contribution governance for agent-written PRs | Already covered (agent side); Missing (contributor policy, N/A) | `AGENTS.md:112` "Pushing to any remote or opening a PR" is ask-first; `AGENTS.md:113` "Merge any branch or commit to the default branch unless the user asks" is Never | A public-repo `AI_POLICY.md` is out of scope for a personal role library. Nothing to add. |
| 22 | CI two-pass LLM PR review (Gemini, nonce-wrapped untrusted text) | Missing | Nearest: `rules-detail.md:30` Rule of Two; `README/ORCHESTRATION_README.md:153` (claude-code-action / codex-action pointers); `AGENTS.md:92` Tier 4 "reported as untrusted (fenced…)" | A vendor-specific CI bot holding untrusted PR text + an API key + comment rights sits on the Rule-of-Two limit and is host-specific. One idea is reusable (second "disproof" pass), but the library's `Verification: Confirmed/Probable` already gates blocking findings. Reject. |
| 23 | Release provenance (ZIPs, SHA256SUMS, attestations) | Missing (N/A) | `Scripts/Sync-AgentsMd.ps1:82-88` hashes the source for comparison only | The library is not shipped as packages; a release pipeline would move toward a marketplace/plugin distribution the constraints exclude. Reject. |

Side finding in the library (not from EGM, noticed while searching): `rules-detail.md:91` says "Ask one question at a time, in dependency order" while `analyst.md:65` says "in one batch (5–10), not one-at-a-time ping-pong". These read as contradictory unless the first is scoped to the Grill Checkpoint and the second to analyst grill mode. Worth a one-clause scope note in `rules-detail.md:91`; not drafted here.

## 2. Proposals

Order is by value. All wording is draft, in the library's style; each is an agent-configuration change, so each needs the user's approval and a `security-engineer` pass before it lands (`AGENTS.md` → Boundaries, Mandatory security review).

### P1 (mechanism 8) — A reviewer that did not report did not pass. Recommend: Adopt.

- Target 1: `EngineeringTeam/_shared/rules-detail.md`, new section appended after `## Rework loop addendum — added 2026-10-19 (cc-sdd)` (line 93-95), so the existing text stays verbatim.
- Wording:

```md
## Rework loop addendum — reviewer status (added 2026-11, EGM)

A review, QA or security pass that timed out, failed, returned no report, or could not read a required input (the diff, the task file, the constitution, its role file) **did not review**: record it as `not run: <why>`, retry once, and never count it as a pass or as zero findings. A round is clean only when every required reviewer for the change (the matching reviewer, plus `security-engineer` when the mandatory list applies, plus `qa-engineer` when planned) has status `completed` and no Blocking finding is open. A `not run` on a mandatory `security-engineer` pass leaves the change not done.
```

- Target 2: `MemoryTemplates/TASK_MEMORY.template.md:42`, add one line directly below the `Rework round:` line:

```md
- Reviewer status (one per required reviewer, per round): `<role>` — completed / not run: <why> — a `not run` is never a pass
```

- Optional overlay follow-up (no behaviour change needed): `Workflows/review-loop.js:207` already computes `complete`; nothing to change.
- AGENTS.md byte cost: 0.
- Lost by not adopting: on Codex, Cursor and any host without the Claude workflow overlay, a reviewer subagent or fresh session that dies silently reads as "no findings", and the mandatory security review can be recorded as satisfied by a run that never read the diff. This is the same failure class as "tests passed" with no Evidence row, which the library already treats as blocking for tests but not for reviews.

### P2 (mechanism 7) — Loop vocabulary: settled, fixed, churn, finding ids. Recommend: Adopt the definitions; do NOT adopt "two consecutive clean rounds" or cap 5 without an eval.

- Target: `EngineeringTeam/_shared/rules-detail.md`, same new addendum area as P1 (a second short section).
- Wording:

```md
## Rework loop addendum — finding state (added 2026-11, EGM)

- Each finding keeps one id for the life of the task: `<role>-r<round>-<n>` (e.g. `backend-reviewer-r1-3`). A re-review cites the id when the same defect at the same `path` scope is still present; it never renames it.
- **Settled** = the user decided it (accepted risk, or the disagreement resolved by the user) and it is in the task file Decisions. A settled finding is not re-opened when a later fresh reviewer raises it again; the reviewer is given Decisions for this reason.
- **Fixed is not settled:** the same defect at the same scope after a fix re-opens the original id and counts toward the survive-twice rule.
- **Churn** = a new Blocking finding at the scope of an applied fix that reverting the fix would remove. On churn, stop fixing forward: record both ids, and the next round opens with the `debugger` diagnosis (same route as a finding that survived twice). The cap of 3 is unchanged.
```

- Also `MemoryTemplates/TASK_MEMORY.template.md:41`: change nothing in the existing line; the ids are written in the Blocking list it already holds.
- Optional overlay follow-up: `Workflows/review-loop.js:99` `keyOf` could take the id when the reviewer returns one; separate change, separate review.
- On two-consecutive-clean-rounds: with the 3-round cap it fits only one fix round (r1 findings → fix → r2 clean → r3 clean) and it doubles reviewer cost on every clean change. EGM states the reason ("the next fresh reviewer can find a different gap") but has no data, and EGM's own parent skill caps at one re-audit. If wanted, test it first as an `EVALS.md` row on a trap task (A = stop at first clean round, B = second confirming round; success check = a seeded defect caught only in the second round), restricted to changes on the mandatory-security list.
- AGENTS.md byte cost: 0.
- Lost by not adopting: findings are matched across rounds by summary wording (fragile; a reworded finding looks new and escapes the survive-twice → debugger rule); a decision the user already made can be re-litigated by each new fresh reviewer, burning rounds of a 3-round budget; a fix that causes the next finding is treated as progress.

### P3 (mechanism 9) — Bind the engineer's response to a finding. Recommend: Adopt.

- Target: `EngineeringTeam/_shared/rules-detail.md`, third short addendum section (kept in `_shared/` so the eleven engineer role files are not each edited; they already defer to the rework loop).
- Wording:

```md
## Rework loop addendum — the engineer's response (added 2026-11, EGM)

Every Blocking finding gets exactly one response in the task file, by id:

- **Fixed** — with its Evidence row.
- **Disagreed** — only with evidence the reviewer can check: a `path:line`, a test and its exit code, an `AC-n`, or a Decisions entry. "By design" or "intentional" with no pointer is not a disagreement; the finding stays open.
- **Needs user** — the deciding fact is outside what the reviewer was given, or the fix is an ask-first item.

The role that wrote the code never reclassifies a finding: Blocking stays Blocking until a fresh reviewer withdraws it or the user settles it. Having written the code is not evidence the reviewer is wrong. Do not add comments, docs or tests whose only purpose is to make a finding go away.
```

- Optional overlay follow-up: `Workflows/review-loop.js:120` ("disagreed … and why") could require an `evidence` field on `disagreed` items as it does on `fixed`; `review-loop.test.mjs:40` currently treats `reason: 'by design'` as a valid disagreement. Separate change.
- AGENTS.md byte cost: 0.
- Lost by not adopting: `rules-detail.md:62` stops the reviewer from softening its own findings, but nothing stops the implementer session (which holds all the context and the motive) from dismissing or downgrading one with an unverifiable reason. The only backstop today is the round-3 cap.

### P4 (mechanism 6) — Cold-read paraphrase of the spec. Recommend: Consider (optional step, full-path features only); eval before making it default.

- Target: `EngineeringTeam/analyst.md`, immediately after line 86 (the "read the whole AC set once as a stranger would" paragraph), as an addition, not a replacement.
- Wording:

```md
**Cold read (full-path features, when the host can start a fresh context):** hand only the spec file to a fresh reader (subagent or new session; no conversation, no task file) and ask for two paraphrases before any critique: what this builds, and how the existing system behaves according to the spec. A section it cannot paraphrase, or paraphrases wrongly, is a gap in the spec, not in the reader: it becomes one more question with a proposed default. Do not answer the reader by adding context it asked for unless a later implementer would need it too. Where no fresh context is available, the stranger read above is the whole check; say which one ran.
```

- Fits the constraints: optional, degrades to the existing same-session read, one extra read-only context, no new role.
- AGENTS.md byte cost: 0.
- Lost by not adopting: the existing check finds undefined terms and conflicting criteria but is run by the session that wrote the spec, which cannot see what it forgot to write down. The spec is the one artifact every later fresh-context reviewer and engineer depends on. Evidence for the benefit: none from EGM.

### P5 (mechanisms 3 and 20) — Record what reviewer isolation actually holds per host. Recommend: Adopt (documentation and eval record only).

- Target 1: `EVALS.md`, new subsection after "What every run records", before "The first three A/Bs".
- Wording:

```md
## Overlay verification record (added 2026-11, EGM)

Fresh context is two separate properties; record each per host and version, or `not run`:

1. **Parent-turn isolation.** Probe: state a random marker only in the parent conversation, then ask the reviewer subagent (or `/review-loop` reviewer) for it. Pass = it answers that it does not know. Evidence is the host's own tool trace, never the reviewer's or parent's summary.
2. **Instruction files.** Which of `AGENTS.md`, user-level instruction files and host memory the reviewer received. The library intends `AGENTS.md` to be present (rules) and the implementer's transcript absent.

| Date | Host + version | Overlay | Parent-turn isolation | Instruction files seen | Notes |
|---|---|---|---|---|---|
| — | — | `Agents/claude/*` | not run | not run | — |
```

- Target 2: `README/ORCHESTRATION_README.md`, one sentence under the Host compatibility table (after line 165): "Reviewer isolation (does a reviewer subagent see the parent turn; which instruction files it receives) is host- and version-dependent; the verified state is the Overlay verification record in `EVALS.md`. Fresh context is not filesystem isolation: a reviewer can read any file in the workspace, including the task file's notes — only its Decisions and Evidence rows are inputs."
- AGENTS.md byte cost: 0.
- Lost by not adopting: `AGENTS.md:78` and the shims assert a fresh-context review, but the library holds no record that it was ever observed on any host version. EGM's record shows the property failing in practice on other hosts (Codex and Antigravity injecting instruction files despite a no-fork setting, per its docs; issue text unverified). Without the row, "reviewer subagent" and "in-session re-read" are indistinguishable in evidence terms.

### P6 (mechanisms 14a and 15) — Planner gate: cited paths resolve; no design choice left to the engineer. Recommend: Adopt.

- Target: `EngineeringTeam/planner.md`, Pre-Implementation Gate checklist, two lines inserted after line 180 ("Handoffs complete: yes.") and before line 181; and one clause appended to the `Owns:` template line 186.
- Wording (gate lines):

```md
- Every path a design decision or phase cites as existing resolves on disk (checked, not assumed): yes / list — an unresolved path is GAP — HIGH. A path the plan creates is marked `(new)` and is not a gap.
- No phase leaves a design or architecture choice to the engineer: yes / list — an open choice routes back to `architect` before implementation.
```

- Wording (line 186): `- Owns: \`<exact paths>\`` → `- Owns: \`<exact paths>\` — mark each `(new)` or `(delete)`; unmarked = existing, modified`
- AGENTS.md byte cost: 0.
- Lost by not adopting: `architect.md:65` forbids designing "against an imagined codebase" but nothing checks it before engineers start; a hallucinated file or function name in the design surfaces only as a mid-implementation deviation. Deletions hidden inside an unmarked `Owns:` line also bypass the ask-first Boundary on deleting files until review.

### P7 (mechanism 17) — Periodic spec-drift sweep. Recommend: Defer.

- The per-task version exists and is stronger than EGM's (`qa-engineer.md:457-465`, both directions, blocking, with convergence rows). A repo-wide sweep would need a new trigger (a routing line costs `AGENTS.md` bytes it does not have) and a write target outside QA's single permitted write. EGM's sweep is an untested same-context prompt.
- If wanted later, the zero-byte form is a `qa-engineer.md` paragraph: "On request, run the traceability matrix for every `wiki/spec-*.md` (or `specs/*/spec.md`) against HEAD with no diff; report rows only, write nothing; the user picks code or spec to change per row."
- Lost by not adopting now: specs for features nobody is currently touching can go stale unnoticed; `_shared/memory.md:30` only catches this when someone happens to read the code.

## 3. Rejected or no-action, with the reason in one line

- 1 hard stop: breaks "works from AGENTS.md alone" on hosts without subagents; the library's labelled fallback is kept.
- 3 `omitClaudeMd`: already rejected in the field review; would strip the rules from the reviewer.
- 5 five-stage design review, 11 A/B double reviewers, 18 seven-lens swarm: multiply subagent cost; EGM has no outcome data; unavailable on hosts without (nested) subagents.
- 10 no-recommendation gates, 14b alternatives rule: contradict deliberate library policy (`analyst.md:80`, `architect.md:71`); no evidence either way.
- 13 banned-word lists: no evidence; adds always-on prompt weight.
- 19 bootstrap README generation: bulk writes; Graphify + `PROJECT_MEMORY.md` already serve orientation.
- 22 CI LLM reviewer, 23 release packaging: host/vendor-specific and outside the library's distribution model (no marketplace dependency).
- 2, 12, 14c, 16, 21: covered closely enough; no change.

## 4. Instruction-like text in the source (reported, not acted on)

From the deep read, section 5: EGM's own `AGENTS.md` claims its PR-title rule "overrides a title convention from personal or global agent instructions"; `.cursor-plugin/rules/egm.mdc` is `alwaysApply: true`. Both are Tier 4 data here. Nothing in this gap check acted on them, and none of the proposals imports EGM text that claims precedence over user or library instructions.

## 5. Summary

- 23 mechanisms (25 rows with 14 split in three): Already covered 4 (4, 12, 14c, 21) plus the dedup half of 11; Partially covered 16; Missing 2 (22, 23); conflicts with a hard constraint if adopted as-is: 1 (hard stop). 14b conflicts with library policy, not a hard constraint.
- Adopt: P1 (reviewer status), P3 (engineer's response), P6 (planner gate), P5 (isolation record), P2 definitions. Consider: P4. Defer: P7 and two-clean-rounds (eval first).
- Total `AGENTS.md` cost of everything proposed: 0 bytes, 0 lines. Approximate added text elsewhere: `rules-detail.md` about 2.6 KB, `planner.md` about 0.5 KB, `analyst.md` about 0.7 KB, `EVALS.md` about 0.9 KB, README and task template one line each.

<!-- END-OF-FILE -->
