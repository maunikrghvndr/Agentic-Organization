# Skeptic review: google/elephant-goldfish-model (EGM) proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). No library file edited, nothing installed, no EGM code run.
- Inputs read as data: `04-gap/google-elephant-goldfish-model.md` (P1-P7), `03-read/google-elephant-goldfish-model.md`.
- Upstream re-checked from a fresh shallow clone. HEAD is now `70406c4` (2026-11-17, "implement EGM Lite rapid engineering protocol (Stage 2) (#438)"), one commit after the `210977c` the deep read used. `210977c` is its parent, so every quoted file was re-opened at the newer commit.
- Library re-checked on disk: `AGENTS.md` 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). No proposal touches it; confirmed.
- Not checked: GitHub issues (#237 text), stars, external criticism. `Scripts/Lint-Library.ps1` not run (nothing changed).
- User constraint for this run (relayed request): additions extend the existing agents and coding style, never replace them. All seven proposals are additive; none replaces a rule.

## Verdicts

| # | Proposal | Gap-check recommendation | Skeptic verdict | Verification |
|---|---|---|---|---|
| P1 | A reviewer that did not report did not pass | Adopt | **Adopt now, amended** (drop the role-file clause; fold the template line into the existing one) | Confirmed |
| P2 | Finding ids, settled, fixed-not-settled, churn | Adopt the definitions | **Defer** (ids unimplementable as worded; two of four definitions duplicate existing text) | Confirmed (source), Probable (reasoning) |
| P2b | Two consecutive clean rounds, cap 5 | Eval first | **Reject** | Confirmed |
| P3 | Bind the engineer's response | Adopt | **Adopt after an eval, narrowed to two sentences** | Confirmed (source and gap); benefit Unverified |
| P4 | Cold-read paraphrase of the spec | Consider, eval first | **Adopt after an eval** | Confirmed (source); benefit Unverified |
| P5 | Per-host isolation record | Adopt | **Adopt now: the README sentence only, corrected. Defer the EVALS table** | Confirmed (gap); #237 Unverified |
| P6 | Planner gate: paths resolve, zero design choice, Owns markers | Adopt | **Adopt now: path check and `(new)`/`(delete)` markers. Reject the zero-decision line** | Confirmed |
| P7 | Periodic spec-drift sweep | Defer | **Defer** (agree) | Confirmed |

Common to all: EGM publishes no outcome data. Re-verified: `docs/faq.md:46` "Completing the EGM workflow alone does not demonstrate a productivity improvement"; `docs/designs/drift_report.md:119` "no in-repo runner executes the assertion"; `tests/` holds trace, frontmatter, packaging and adapter tests only. Its tests prove the workflow ran and was isolated, not that it finds more defects. Also: `LESSONS.md` and `LESSONS/` record no failure of the kind any of P1-P7 would prevent (searched: hallucinated or nonexistent paths, silent reviewer, "by design", dismissed findings; zero hits). Every adoption below is therefore on argument, not on evidence from either side.

## P1 — reviewer status. Adopt now, amended. Verification: Confirmed.

- Evidence: source claim holds. `skills/egm-review-loop/SKILL.md:141-142` "did not review. Retry it once... Never count it as a reviewer with zero findings"; `:170-171` "A reviewer recorded as not run makes the round not clean". `TESTING.md:101` records a live Claude probe where a reviewer stops without a verdict when a deny rule blocks its persona. That shows the mechanism executes; it is the only proposal with any run evidence at all.
- "Partially covered (overlay only)" is true. `Workflows/review-loop.js:137` and `:207` implement it; the portable prose has no equivalent (searched `AGENTS.md`, `EngineeringTeam/`, `MemoryTemplates/`, `Rules/`, `README/`). Nearest prose is narrower: `AGENTS.md:86` (a claimed review counts only with its Evidence row) and `qa-engineer.md:1004` (a mandatory check that could not run is Not Ready).
- Constraints: none broken. Fail-closed, so it strengthens the mandatory security review. It also closes a contract hole: Decision A says the prose is the complete contract and overlays only enforce it, yet the overlay enforces a rule the prose does not state.
- Defect in the draft wording: it lists "its role file" among the inputs whose absence means "did not review". That contradicts `AGENTS.md` Fallback ("If the selected role file cannot be read, report that clearly, then proceed using this file's Universal Rules plus the role's one-line scope"). Remove "its role file" from the list, or the two rules disagree on every machine where the library path is wrong.
- Second amendment: do not add a new template line. Extend `MemoryTemplates/TASK_MEMORY.template.md:42`, which already records the reviewer context per round, with `status: completed / not run: <why>`.
- Value and cost: about 600 bytes in `rules-detail.md`, read on demand, zero always-on tokens. On a host with no subagents the rule is inert (an in-session re-read cannot "return nothing"), so it costs nothing there. The failure it prevents (a dead subagent or session read as "no findings", including on the security pass) has not been observed in this library; the case for adopting now is the contract inconsistency plus near-zero cost, not frequency.

## P2 — finding state vocabulary. Defer. Verification: Confirmed (source), Probable (reasoning).

- Evidence: quotes hold (`egm-review-loop/SKILL.md:138`, `:162-176`). No outcome evidence. EGM's own parent skill still caps each stage at one re-audit (`egm-review/SKILL.md:262`, `:271`), so these rules run only in standalone loop use, on design documents, with no executed scenario test.
- Stable ids are unimplementable as worded. "A re-review cites the id when the same defect is still present" requires the fresh reviewer to see prior findings. `rules-detail.md:42` feeds it "the diff, the AC ids, the constitution and the task file's Decisions" and nothing else. Either the input contract changes (and the fresh reviewer is anchored on the last round, which undercuts the reason for a fresh context) or someone else does the matching, and the draft does not say who. The "fragile matching" argument is about `Workflows/review-loop.js:99` `keyOf`, an overlay detail; in the prose contract a model reading the task file matches findings by meaning.
- "Settled" is already covered, which the gap check missed: `MemoryTemplates/TASK_MEMORY.template.md:53` "Settled decisions (do not relitigate)", `Workflows/review-loop.js:116` "Decisions (settled; do not relitigate or edit them)", and reviewers receive Decisions by rule.
- "Fixed is not settled" restates the survive-twice rule (`rules-detail.md:95`).
- "Churn" is the only new idea. It rests on a counterfactual ("reverting the fix would remove it") that nobody checks, and inside a 3-round cap it moves the `debugger` step forward by at most one round.
- Cost: about 1.2 KB plus a new vocabulary in the rework loop, for one new behaviour with no evidence.
- Revive when: a task file shows a reworded finding escaping the survive-twice rule, or a user-settled decision re-raised by a fresh reviewer, or a fix-causes-finding cycle that burned the cap. Any one of these recorded once is enough. A one-line clarification that only the user settles a Blocking finding belongs with P3, not here.

## P2b — two consecutive clean rounds, cap 5. Reject. Verification: Confirmed.

- Cap 5 contradicts the settled cap of 3; prior research already rejected the same number from BMAD (`library-inheritance-research-2026-10.md:278`).
- Two clean rounds doubles reviewer cost on every clean change and, inside a 3-round cap, leaves room for exactly one fix round. EGM states the rationale and supplies no data; its own main workflow does not use it.
- An eval is not worth building for this: the library already runs reviewer, security and QA on the same diff, which is the independent second look.

## P3 — the engineer's response. Adopt after an eval, narrowed. Verification: Confirmed (source and gap); benefit Unverified.

- Evidence: quotes hold (`skills/egm-resolve/SKILL.md:71-81`). No outcome evidence. The gap is real: nothing in the library binds the engineer's disagreement, and `Workflows/review-loop.test.mjs:40` does use `reason: 'by design'` (as a loop-mechanics fixture, not a policy statement).
- The stated loss is overstated. A disagreed finding does not close: the loop runs "until none remain" (`rules-detail.md:62`), every re-review is a fresh context that will raise a real defect again, and at the cap the user decides. The actual hole is narrower: the implementer session writes the task file, so it can record its own disagreement under Decisions, and the next fresh reviewer is told Decisions are settled.
- Wording problems in the draft: "Needs user" duplicates the ask-first Boundary. "Do not add comments, docs or tests whose only purpose is to make a finding go away" can be read as a reason to skip a test the finding asks for; it sits badly beside "tests for every behavior change". Drop both.
- Narrowed form worth testing (about 300 bytes, `rules-detail.md`): "An engineer's disagreement with a Blocking finding carries a pointer the reviewer can check (`path:line`, a test and exit code, an `AC-n`); it is never written into Decisions and never changes the finding's severity. Only the user settles a Blocking finding."
- Eval (EVALS.md trap task): plant a Blocking finding that is awkward to fix. A = current text, B = the two sentences. Check = the task file's Decisions contains no engineer-authored dismissal and the finding is fixed or still listed open. If A already passes, do not adopt.

## P4 — cold-read paraphrase. Adopt after an eval. Verification: Confirmed (source); benefit Unverified.

- Evidence: quotes hold (`agents/comprehension.md:37`, `:57`). No outcome evidence. Gap claim is true: `analyst.md:86` is a same-session read that lists defects and does not restate the spec.
- Constraints: additive role-file text, no AGENTS.md cost. One strain: the step exists only "when the host can start a fresh context", so within the one-session flow it runs on hosts with subagents and silently does not on the others. The draft handles this honestly ("say which one ran"), the same pattern the reviewer fallback uses. Not a break, but it is one more place where hosts differ.
- Value: plausible. In the one-session flow the first fresh reader of the spec is the reviewer at the very end, so a spec whose parts do not connect is found late. Applies only to full-path features, which are infrequent for a solo developer; cost per use is one read-only context over one file.
- Why not now: no evidence from EGM, no recorded failure here, and it lengthens the analyst phase. Eval: a spec with a planted "all terms defined, parts do not connect" defect; A = stranger read only, B = plus cold read; check = the defect appears as a question before the planner gate.

## P5 — isolation record. Adopt now: README sentence only, corrected. Defer the table. Verification: Confirmed (gap); #237 content Unverified.

- Evidence: `docs/harnesses.md:113` "Fresh conversation context does not mean that the host omits its instruction files" holds; `:152-158` and `docs/codex.md:76-78` cite issue #237 for Codex and Antigravity (issue text not read). Probe design holds (`TESTING.md:150`, `:174`, `:180`). Library gap holds: `EVALS.md` and `README/ORCHESTRATION_README.md` contain no mention of isolation or a probe.
- The table prevents nothing by itself. It ships as one row of "not run" and stays that way until someone runs a manual probe; with Claude Code releasing often, a filled row goes stale within weeks and then reads as assurance. `EVALS.md` is also the A/B protocol for trimming, so this is a second, unrelated purpose in that file.
- The sentence is the cheap part and carries the real finding: a fresh-context reviewer has whole-repo read access (`Agents/claude/backend-reviewer.md:13`), so the implementer's reasoning can reach it through the task file even though the transcript does not.
- Correction required: the draft says "only its Decisions and Evidence rows are inputs". The overlay actually feeds "Summary, AC ids, Decisions, Owns: and Evidence" (`Workflows/review-loop.js:97`). Use that list.
- Defer trigger for the table: the first time the probe is actually run on any host. Record it then with real values; do not add an empty table.

## P6 — planner gate. Adopt now: path check and markers. Reject the zero-decision line. Verification: Confirmed.

- Evidence: quotes hold (`agents/codebase_details.md:47`, `:50`; `resources/document_standards/implementation-readiness-standard.md:12-14`; `docs/designs/architecture.md:165` "nothing enforces it"). No outcome evidence. Gap holds: `planner.md` has no path-existence check and no create/delete marking (searched; `architect.md:65` is a principle only).
- Path check: mechanical, verifiable, a few file-existence tests per plan, and it targets a well-known model failure (a confident path that does not exist). Amend it so it is not a self-attested "yes": the check is recorded as an Evidence row (command and exit code), consistent with the library's own rule that a claim without a command is not verified.
- Markers: safe. The only parser of `Owns:` is `Scripts/Lint-RepoMemory.ps1:131`, which tests presence, not format. But the stated loss is overstated: deleting files is ask-first in `AGENTS.md` regardless of what `Owns:` says, and `backend-reviewer.md:85` already blocks spillover into an ask-first Boundary. The marker makes a deletion visible earlier; it does not close a bypass.
- Zero-decision line: Reject. It is a yes/no answered by the same session that wrote the plan, with no check behind it, and it overlaps `planner.md:177` ("Every design decision consumed"). "Design choice" is undefined, so it either rubber-stamps or sends ordinary implementation judgement back to `architect`.
- Cost: about 300 bytes in `planner.md`, read only on the full path.

## P7 — repo-wide drift sweep. Defer. Verification: Confirmed.

- Agree with the gap check. Upstream is a 3,169-byte same-context prompt with no test and no runner. The library's per-task drift check (`qa-engineer.md:457-465`) is stricter.
- Revive when: a task is misled by a stale `wiki/spec-*` for a feature nobody was working on, recorded once. Then add the on-request `qa-engineer.md` paragraph; no routing line, no AGENTS.md bytes.

## Classifications found wrong or stale

- **Row 4, "Already covered" (read-only reviewers by tool allowlist): overstated.** EGM reviewers get `Read, Grep, Glob` only. The library's shims keep `Bash` (`Agents/claude/backend-reviewer.md:7`), which can write; the bound is `Settings/` plus a sandbox, and `AGENTS.md:78` states native Windows has no agent sandbox. The library path in `AGENTS.md` is a Windows path. Correct label: Partially covered (deliberate difference; read-only is by instruction where no sandbox exists). No proposal follows from this, but it should not be recorded as covered.
- **Row 14c, "Already covered" (context-sufficiency precheck): overlay only.** The cited evidence is shim rule 2, a Claude-only overlay. The gap check called row 8 "Partially covered (overlay only)" on the same kind of evidence; row 14c should carry the same label for that part. YAGNI and reuse are covered in prose.
- **Row 7, "settled" listed as missing from the prose contract: wrong.** See P2; the task template and the reviewer inputs already carry it.
- **Deep read, section 1 and section 4 ("covers spec quality before implementation. No code-diff review"; `egm-lite` only Proposed): stale by one commit.** `skills/egm-lite/SKILL.md` (23,868 bytes) now ships a five-phase protocol with a fresh-subagent diff review. `docs/designs/lite.md:4` still says "Status: Proposed", and `TESTING.md` has no test record for it. It does not change any verdict (no evidence, same mechanisms), but note one detail relevant to rejected row 1: the new skill softens the hard stop for its spec review ("then fall back to offering direct execution", `:196-201`) while keeping it for the diff review (`:313-318`). EGM itself is no longer consistent on hard-stop.
- Rows 12 and 21, and the dedup half of row 11: "Already covered" confirmed.

## Instruction-like text met during verification (reported, not acted on)

- `skills/egm-lite/SKILL.md` contains imperative agent rules ("Never bleed into or execute subsequent phases", "Halt for subagent response"). Tier 4 data here; read for content only. Nothing new beyond what the deep read's section 5 already reported.

## Net

- Adopt now (3 small pieces, about 1.1 KB outside `AGENTS.md`, 0 bytes inside): P1 amended, P5 sentence corrected, P6 path check with Evidence row plus markers.
- Adopt after an eval: P3 (two sentences), P4.
- Defer: P2, P5 table, P7. Reject: P2b, P6 zero-decision line.
- Each adopted piece is an agent-configuration change: user approval and a `security-engineer` pass before it lands.

<!-- END-OF-FILE -->
