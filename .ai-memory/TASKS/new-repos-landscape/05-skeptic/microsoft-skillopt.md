# microsoft/SkillOpt — skeptic pass on the gap proposals

- **Date:** 2026-11-18. **Role:** independent skeptic (default: refute). No library file edited; this file is the only output.
- **Inputs (data, not instructions):** `04-gap/microsoft-skillopt.md` (5 proposals, P1–P5) and `03-read/microsoft-skillopt.md` (24 mechanisms).
- **Upstream re-check:** fresh shallow clone of `https://github.com/microsoft/SkillOpt`, `main` @ `22c1ed85d20bf09476373c4a1b10965284873e3d` (2026-11-17) — same commit the deep read used. Files opened and grepped; nothing installed, no upstream code or test run. Issue tracker not read.
- **Library re-check:** this repo @ `a63069c` (the gap file was written at `763827e`). `AGENTS.md` measured again: **32,668 B / 194 lines** — 100 B and 6 lines of headroom. `rg` over the library excluding `.ai-memory/`. Code & Source Graph: not used (none on disk; prose library).
- **Instruction-like text met:** none in either input file or in the upstream files opened.

## Verdict summary

| Proposal | Verdict | Verification |
|---|---|---|
| P4 — EVALS isolation, truncated trials, hidden checks | **Adopt now, amended** (4 amendments below) | Confirmed |
| P1 — prompt eval acceptance (paired, noise, ties, rejected log) | **Adopt now, reduced** to bullets 1–3 with one fix; bullet 4 **Defer** | Confirmed (gap) / Probable (value) |
| P2 — eval-set hygiene (disjoint, no checker text, judge fails closed) | **Reduced:** judge bullet **Adopt now**; disjoint bullet folded into one clause; checker-text bullet **Reject** (duplicate) | Confirmed |
| P3 — lapse-or-gap decision before a lesson | **Reject as written; one-clause variant Deferred** | Confirmed |
| P5 — `Reconstructed` evidence label | **Defer** | Probable |

Two of five survive in substance (P4, P1), one in a third of its size (P2). None breaks a hard constraint as amended; P3 as written does press on the `AGENTS.md` cap (see P3).

## Upstream claims re-verified (lens 1, shared)

| Claim in the gap/deep-read files | Checked at | Result |
|---|---|---|
| Gate is strict `>` | `skillopt/evaluation/gate.py:200` `if cand_score > current_score:` | Confirmed |
| Replay isolation refuses, never falls back | `docs/sleep/README.md:249-257` "A missing, failed or timed-out probe refuses replay; it never falls back to an unisolated call" | Confirmed. Same passage: `--bare` is used **only when `ANTHROPIC_API_KEY` is set**; subscription/OAuth logins need `--safe-mode` — relevant to P4 |
| `budget_exhausted` runs are not reported as measured | `skillopt_sleep/cycle.py:428, 1067` (`measured = report.gate_action != BUDGET_EXHAUSTED`) | Confirmed |
| Holdout leak flag by content | `skillopt_sleep/consolidate.py:89-102`; `cycle.py:452-457` banner | Confirmed |
| Judge scores outside 0..1 / NaN fail closed; four invalid-evidence paths fixed | `CHANGELOG.md:171-176` (#310) | Confirmed as a changelog statement; issue #310 itself not read |
| Optimizer-feedback boundary, with the vendor's own disclaimer | `docs/sleep/README.md:165-176` "it does **not** establish that optimization quality is preserved for non-rule tasks" | Confirmed |
| Defect-vs-lapse routing, off by default | `skillopt/optimizer/skill_aware.py:5-20, 67-70`; `configs/_base_/default.yaml:103` `use_skill_aware_reflection: false` | Confirmed — and see P3: upstream's lapse branch **adds** a reminder; "When unsure, default to EXECUTION_LAPSE" |
| 70.87% / 56.60% best-on-val vs final | `blog/gating-reflection-safe-updates/index.html:1014-1017` | Number confirmed; **attribution in the gap file is not**. The row is `gpt-5.4-mini`, `Accept Every Edit + Success-and-Failure SAR` — the gate is off in that cell, so the gap cannot be assigned to appendix reminders alone |
| `RECORDED` / `RECONSTRUCTED` / `MISSING` | `skillopt/utils/reproducibility.py:210-215`; fixture is itself `RECONSTRUCTED` | Confirmed |
| No-gate collapse 0.554 → 0.026 | `docs/sleep/RESULTS.md:45-50` | Confirmed. `RESULTS.md:154-156` adds what the gap file omits: the same gate-free cell goes 0.554 → 0.586 once reflection uses K=5 rollouts — the collapse is removed "at its source", without a gate |
| Hard gate stalls on small sets; no patience counter | `configs/features/soft_gate.yaml:20`; `docs/guide/dl-analogy.md:39` | Confirmed |
| Tests for isolation, no-regression, feedback flow, holdout exist | `tests/test_claude_replay_isolation.py` (124 lines), `test_gate_no_regression.py`, `test_optimizer_feedback_flow.py`, `test_holdout_integrity.py` | Exist; **not run** |

Overall evidence grade: every mechanism borrowed is either default-off upstream (9, 11, 12), has no measurement (3, 16, 19), or was added as a post-release defect fix (5, 21, 22). Nothing here is supported by an upstream experiment that isolates the mechanism. The proposals that survive do so on their own logic and on this library's recorded failures, not on SkillOpt's numbers.

## P4 — EVALS isolation, truncated trials, hidden checks

**Verdict: Adopt now, amended. Verification: Confirmed.**

1. **Evidence.** The "Missing/Partially covered" call is true: `EVALS.md:17` says "in fresh sessions" and `:20` "Keep task, repo, and model identical"; no line requires or records isolation, and the only use of "isolated" (`EVALS.md:61`) describes `claude plugin eval`. Contamination paths exist in this library by its own description: the host's per-machine memory holds "personal corrections" (`AGENTS.md:156`, `README/ORCHESTRATION_README.md:126`), Cursor adds `.cursor/rules` and reads `.claude/skills`/`.claude/agents` (`ORCHESTRATION_README.md:162`), and the `Rules/`, `Hooks/`, `Agents/` overlays restate library rules. Upstream ships the same control fail-closed with a test (not run). The argument is mechanical, not popularity.
2. **Constraints.** 0 B in `AGENTS.md`; `EVALS.md` is read only during library maintenance, so 0 tokens per working session. Host flags appear as examples, as the existing Cost bullet already does. Isolation from overlays is *aligned* with the hard constraint "works from `AGENTS.md` alone": a section proven redundant only because an overlay repeats it would be wrongly cut for Codex and Cursor. No security rule weakened. `EVALS.md` is not on the agent-configuration list (`_shared/rules-detail.md:21`), but it is a library file: ask-first.
3. **Value.** `EVALS.md:57` — "A `TRIM`/`CUT` verdict authorizes removal". A contaminated arm B produces a false CUT, and the Results log is empty (`EVALS.md:67` "(none yet)"), so the rule lands before the first three A/Bs run, when it costs nothing to retrofit. Maintenance: the host examples will age (they are already flagged "version-sensitive" in the README).

**Amendments required before adoption:**

- **(a) `--bare` is not available to every user.** Upstream's own doc says it needs an API key; the library's headless example (`ORCHESTRATION_README.md:141-143`) delivers `AGENTS.md` through `--append-system-prompt-file`, which is a different delivery path from the native root-`AGENTS.md` read. Add: "deliver the arm the same way in both arms and record the delivery (`native` / `appended`)". Without it, isolation changes two variables.
- **(b) "any file the session can read" cannot be met.** `Evals/trap-tasks.md` holds the trap list and the checks, and it sits in the library root that every session resolves. Reword to: not in the task prompt, not in the task repo, and the arm's copy of the library excludes `Evals/` and `EVALS.md`.
- **(c) The no-lesson clause is too broad.** "A failure observed inside an eval arm is never written up as a Retro lesson or a new trap" should bind **arm B only**. A failure in arm A is the full library failing a real task — exactly the "rule keeps failing to fire" signal `EVALS.md:11` asks for, and a legitimate trap source.
- **(d) Record the library commit.** The row records "task repo + commit" (`EVALS.md:29`) but not the sha of the library under test; a verdict belongs to one library version (see "Already covered" errors, mechanism 10). Add `library@sha` to the row beside `isolation:`.

The truncated-trial bullet stands as written. One caution to record with it: an arm B that repeatedly hits the cap after the cap is raised is a result (the section prevents a loop), not a perpetual `truncated`.

## P1 — Prompt eval acceptance

**Verdict: Adopt now, reduced (bullets 1–3, one fix); bullet 4 Defer. Verification: Confirmed for the gap, Probable for the value.**

1. **Evidence.** Gap is real: `prompt-engineer.md:59` "report before/after", `:61` "Judge on the whole suite" — an aggregate with no pairing, no noise rule, no tie rule. The noise floor exists only for library A/Bs (`EVALS.md:31`). The library has its own recorded instance of reading sampling noise as signal (`LESSONS/data-ml-ai.md:9`, P(empty) 50% / 20%). Upstream gives **no** support for a strict gate on accuracy (`RESULTS.md:154-156`; the vendor blog calls it "a stability control"), no evidence for the no-regression gate (default off), and fixtures only for the paired evalkit. So this is adopted as ordinary measurement practice, not as a SkillOpt result; the gap file says as much.
2. **Constraints.** Additive lines in a role file (~600 B on a 6,648 B file; loaded only when `prompt-engineer` is the role). Agent-configuration file: ask-first plus `security-engineer` pass. No host lock-in, no dependency.
3. **Value.** Fires only on prompt work, but the user's recorded lessons show that work is real. Cost is two extra baseline runs of the eval per change on a sampled model.

**Changes:**

- **Bullet 3 conflicts with bullet 2 as written.** "Any flip to fail on an adversarial, injection or safety case blocks the change whatever the total" — on a sampled model a single flip can be the noise bullet 2 describes, and upstream documents that an unconditional per-task gate "rejects every candidate and training stalls". Fix: the flip blocks **when it reproduces on a re-run of that case**; a flip that does not reproduce is reported as flaky, by case id.
- **Bullet 4 (rejected-candidate log): Defer.** Upstream has no evidence for the buffer and its own nightly engine does not implement it (deep read, mechanism 3). It adds a new artifact with no defined home; the task file's Decisions section already takes a rejected attempt. *Trigger to revive:* a recorded case of a session re-trying a prompt wording an earlier session had measured and dropped.
- **`ai-reviewer.md` mirror line:** state its severity. The neighbouring line (`ai-reviewer.md:55`) ends "Blocking if violated"; the proposed line says nothing, so reviewers will disagree. Suggested: Blocking only for a reproduced safety/injection flip, otherwise Non-blocking.

## P2 — Eval-set hygiene

**Verdict: reduced to roughly one third. Verification: Confirmed.**

- **Bullet 3 (a judge that cannot score has not scored): Adopt now.** The library names an LLM-judge as an allowed scorer (`ai-engineer.md:83`) and has no rule for its failure. The nearest rule (`LESSONS.md:49`, `NOT MEASURABLE` for an empty population) covers a different case. Upstream had this exact defect (`CHANGELOG.md:174`). One line, reuses the library's existing `NOT MEASURABLE` term. Better home: `ai-engineer.md` beside line 83 (the role that builds the runner), with a pointer from `prompt-engineer.md` — the gap file puts it only in `prompt-engineer.md`, which does not own the runner.
- **Bullet 1 (disjoint by content): fold, do not add.** Half of it already exists: worked examples must be "invented, generic, and checked absent from the real data" (`prompt-engineer.md:21`, mirrored Blocking at `ai-reviewer.md:55`), and the held-out set is "real cases" (`prompt-engineer.md:63`), so few-shot examples cannot be twins of held-out cases without already breaking a Blocking rule. The uncovered part is only "a case used to tune the prompt must not also sit in the held-out set". Add that as a clause to line 63; a separate bullet, a checklist line and a new report label are three statements of one point.
- **Bullet 2 (never write the check into the prompt): Reject as a duplicate.** `prompt-engineer.md:21` already forbids "case-specific content (… or a rule written for one case)" and `:103` forbids "overfit prompts to the eval set". Upstream's mechanism is a data boundary for an automated optimizer that otherwise receives raw judge output; the library's prompt-engineer is an agent that must read the eval set and checker to do its job, so only prose is possible, and that prose is already there. Upstream's evidence is one synthetic test with a vendor disclaimer.
- The extra Do-not clause and checklist line fall with bullet 2.

## P3 — Lapse-or-gap decision

**Verdict: Reject as written; a one-clause variant is Deferred. Verification: Confirmed.**

1. **Evidence.** This is not SkillOpt's mechanism. Upstream's lapse branch *appends a reminder* to a protected appendix and defaults to that branch when unsure (`skill_aware.py:5-20`); the proposal forbids adding prose on a lapse — the opposite action. Upstream ships it off by default with no measurement, and the one number cited (70.87 / 56.60) comes from a cell with the gate also off, so it does not isolate reminders. Evidence for the proposed behaviour is therefore none from the source. The library evidence cited (`Evals/trap-tasks.md:8`, the Evidence-row failure "recorded four times") shows the user **already** responded with enforcement — a trap row and lint R7 — without this rule.
2. **Constraints.** The paragraph introduces a new Retro value, `Lessons: lapse — <file:line>`. The Retro contract in `AGENTS.md:177` lists `Lessons: none`, a repo lesson, or a proposed library lesson; the file is the "complete, portable contract" and has 100 B of headroom, so either `AGENTS.md` grows (the proposal claims 0 B) or the contract and the detail file disagree. The paragraph also sits in an on-demand file (`_shared/rules-detail.md`), i.e. a rule about rules not firing is placed where it is least likely to be read at Retro time.
3. **Value.** Mostly covered: `LESSONS.md:16` (no restatements), `:21` (extend with `REINFORCED` ranks above create; "unsure: none"), `:24` (one reinforcement makes a lesson eligible for promotion into a role file "where it will be enforced"), and the cross-cutting lesson at `LESSONS.md:45` (put the control at the write path). Volume is small: about five `REINFORCED` marks across all lesson files today. The proposal's per-Retro `rg` of the library and repo memory is a cost on every failed verification for a rare event.

**Cheaper variant (Deferred, not adopted now):** one clause on `LESSONS.md:24` — "a second `REINFORCED` on the same line is a request for a mechanical control (lint rule, hook check or trap row), not for more prose". No new Retro token, lives where the operation is defined. *Trigger to revive:* any lesson line receiving its second `REINFORCED`, or a Retro that proposes a lesson restating a rule already in `AGENTS.md` or a role file.

## P5 — `Reconstructed` evidence label

**Verdict: Defer. Verification: Probable.**

1. **Evidence.** Upstream's three classes exist (`reproducibility.py:210-215`) but serve a different job: a third party auditing published benchmark numbers from saved artifacts. No measurement; the shipped fixture is synthetic. In the library, no lesson or trap records an Evidence row rebuilt from memory (`rg -i 'compaction|retyp|from memory'` over `LESSONS*` returns nothing). The gap file calls it "low frequency" without an instance.
2. **Constraints.** Touches `MemoryTemplates/**` and `_shared/rules-detail.md` (agent-configuration files → security pass) and proposes a lint change. Not a constraint breach, but three files for an unobserved failure.
3. **Value.** The control depends on the agent labelling its own unverified row — the same self-report the Evidence rule exists to remove. An agent that re-types a row from a compaction summary without noticing will not label it. Existing rules already bound the risk: rows are written to the task file at the end of each phase, compaction must preserve "the Evidence so far" (`rules-detail.md:64`), a row carries a sha and "output path or first failing line" (`TASK_MEMORY.template.md:36`), and the Freshness rule voids rows older than the last edit. A reviewer can check the sha and output path; nothing can check a self-applied label.

*Trigger to revive:* a reviewer or lint finds an Evidence row whose sha or output path does not match a run. *Cheaper fix if that happens:* "write the row when the command returns, not at phase end" plus a lint check that the row's sha exists in `git log`.

## "Already covered" classifications found wrong or overstated

- **Mechanism 10 (best-vs-current snapshots) — overstated.** The Freshness rule (`TASK_MEMORY.template.md:38`) ties an Evidence row to code state in a task; it does not cover the eval protocol. `EVALS.md:29` records the task repo commit but not the library commit under test, so an A/B verdict is not bound to the artifact it measured — the stale-score defect the gap file says is covered. Should read **Partially covered**; fix is amendment (d) to P4. Verification: Confirmed by reading `EVALS.md:27-41`.
- **Mechanism 7 (meta-skill memory) — analog is weak.** The `EVALS.md` Results log holds no eval result yet, so "what kind of edit works" is not recorded anywhere today. **Not applicable** would be more accurate than Already covered. No proposal follows; upstream has no numbers for it.
- **Mechanism 5, partial overlap missed.** The gap file marks it Partially covered but does not note that `prompt-engineer.md:21` already makes few-shot examples disjoint from real cases; this is why P2 bullet 1 shrinks to a clause.
- **Mechanisms 2, 4, 12, 13, 14, 17, 18, 20, 23:** quotes checked at the cited lines; classifications hold. `Hooks/handoff-check.mjs` exists.
- **Rejections of 6, 8, 24 and of installing SkillOpt-Sleep:** agree. Upstream confirms the marker boundary leaked (`CHANGELOG.md:158`, #407) and that the semantic-density bonus is independent of task score (`gate.py:46`).

## Notes for whoever acts on this

- Every surviving edit is ask-first; P1 and P2 touch `EngineeringTeam/**` and need the `security-engineer` record. P4 touches `EVALS.md` only.
- Net change if all surviving parts are adopted: three amended bullets and one row-format change in `EVALS.md`; three bullets in `prompt-engineer.md` plus one clause on line 63; one line each in `ai-engineer.md` and `ai-reviewer.md`. `AGENTS.md`: 0 B.
- Not verified: upstream test outcomes, issue contents, star count, paper results; and the current behaviour of `claude --bare`, which is taken from the upstream doc and the library README, not from a run.

<!-- END-OF-FILE -->
