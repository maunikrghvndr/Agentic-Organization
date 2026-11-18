# Skeptic review: obra/superpowers proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). No library file edited, nothing installed, no superpowers code run.
- Inputs read as data: `04-gap/obra-superpowers.md` (P-1 to P-15, 57 classified mechanisms), `03-read/obra-superpowers.md`.
- Upstream re-checked from a fresh shallow clone: `obra/superpowers` `main` @ `22f0b46` (2026-11-03, v7.0.2), the same commit the deep read used; `prime-radiant-inc/superpowers-evals` @ `e64684c` (2026-09-11). Every source quote below was re-opened at those commits.
- Library re-checked on disk at `b8bc665` (branch `main-xpl0sx`): `AGENTS.md` 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). No proposal touches it; confirmed.
- Not checked: GitHub issues and PR threads, stars, external criticism (not reachable). `Scripts/Lint-Library.ps1` not run (nothing changed).
- User constraint for this run (relayed request): additions extend the existing agents and coding style, never replace them. P-10 as drafted replaces a template line; every other proposal is additive.
- Instruction-like text met in the sources: none acted on. The bootstrap text ("You have superpowers", "ABSOLUTELY MUST") and the README's "Fetch and follow instructions from <raw URL>" are addressed to agents; both were already reported by the deep read.

## Evidence that applies to every proposal

- All superpowers numbers are maintainer self-reports from `RELEASE-NOTES.md`, n = 5 to 33, mostly graded by an LLM. The public evals repo head (2026-09-11) is older than v7.0.0 (2026-10-09), so the v7.0.x numbers (33/33, 8/8, 24/24 to 3/24) have no public raw data. Verification of those figures: the quotes are Confirmed, the results are Unverified.
- The numbers measure superpowers' own flow (a brainstorming skill, subagent implementers). None measures a rule in this library's shape. They justify a test here, not adoption.
- The library has no recorded failure for most of what is proposed. Searched `LESSONS.md` and `LESSONS/` for: pre-existing or unrelated test failures, an engineer running only the new test file, a review of an empty or wrong range, a finding dismissed "by design". Zero hits. The only relevant recorded failures are trap 1 (empty population reads as PASS), trap 2 ("tests passed" with no Evidence row, four times) and trap 8 (an AC dropped).
- `EVALS.md` Results log still reads "(none yet)". No A/B has ever been run. Every "Adopt after an eval" below waits on a protocol that has not been exercised once, so in practice it means "not yet".
- `EVALS.md` allows traps only from recorded real failures. A proposal with no recorded failure behind it cannot get a valid trap, which is why several land on Defer and not on "Adopt after an eval".

## Verdicts

| # | Proposal | Gap-check stance | Skeptic verdict | Verification |
|---|---|---|---|---|
| P-8a | Range check before a review | Adopt (highest value) | **Adopt now, amended** | Confirmed |
| P-8b | No grading language in the handoff | Adopt | **Adopt after an eval, merged with the EGM P3 rule** | Confirmed (source, gap); benefit Unverified |
| P-8c | Plan-mandated defects still reported | Adopt | **Reject** (covered by the instruction hierarchy) | Confirmed |
| P-8d | "Not verified from these inputs" list | Adopt | **Reject** (QA matrix already carries it) | Confirmed |
| P-8e | Depth 1: reviewers start no agents | Adopt | **Defer** | Confirmed (source); conflict Probable |
| P-8f | Disposition per Blocking finding | Adopt | **Adopt now, one sentence** | Confirmed |
| P-12a | Phase closes on the recorded suite | Adopt | **Adopt now, the clause only** | Confirmed |
| P-12b | After-the-fact tests shown failing | Adopt | **Defer; never in `qa-engineer.md`** | Confirmed |
| P-1 | Rejected-rationalization rows for engineers | Eval first | **Adopt after an eval, rewritten; else Reject** | Confirmed (source); benefit Unverified |
| P-13 | Baseline test row | Adopt | **Adopt now, amended** | Confirmed (source, gap); benefit Probable |
| P-6 | Spec confirmation before building | User decision | **Defer** | Confirmed |
| P-3 | Ask the reason first, alone | Adopt | **Reject as drafted; cheaper form after an eval** | Confirmed (source); benefit Unverified |
| Side | Question-cadence contradiction | Fix with P-3 | **Real, but the drafted fix is wrong; needs the user's ruling** | Confirmed |
| P-14a | RED before adding a rule | Adopt | **Defer** | Confirmed |
| P-14b | `library@sha` in the eval row | Adopt | **Adopt now** | Confirmed |
| P-14c | `indeterminate` trial outcome | Adopt | **Adopt now** | Confirmed |
| P-14d | Transcript-order checks | Adopt | **Defer** | Confirmed (source) |
| P-9 | New-host smoke test | Adopt | **Defer** | Confirmed |
| P-2 | Read before you ask, every role | Adopt | **Defer** | Confirmed |
| P-7 | Contract line on phases | Adopt (lower) | **Defer** | Confirmed |
| P-5 | Step up a size mid-task | Adopt | **Reject** (already covered) | Confirmed |
| P-4 | A design question carries its options | Adopt (small) | **Adopt now** | Confirmed |
| P-11 | Evidence-row helper script | Optional, lowest | **Defer** | Confirmed |
| P-10 | Cost-if-wrong on solo decisions | Low | **Reject** | Confirmed |
| P-15 | Lint warning for role-file length | Adopt | **Adopt now, labelled host-specific** | Confirmed (library); host fact Probable |

Net of the "Adopt now" set: about 1.3 KB across `rules-detail.md`, `EVALS.md`, two engineer files, `architect.md`, the task template and one lint check. Zero bytes in `AGENTS.md`, zero always-on tokens. Every one is an agent-configuration edit: ask-first, with the `security-engineer` pass, as the gap check already says.

## P-8 — review-handoff hygiene (six separate rules, judged separately)

The gap check bundles six rules under one "highest value" label. They do not stand or fall together.

### P-8a — range check. Adopt now, amended. Verification: Confirmed.

- Evidence: `skills/subagent-driven-development/scripts/review-package:40-41` runs `git merge-base --is-ancestor` and a commit count and exits 3; `RELEASE-NOTES.md:193` gives the motive ("an implementer that committed to the wrong branch can't produce a 'clean' review of nothing", #2136, #2050). That is an incident, not a measurement.
- "Missing" is true: no `is-ancestor`, no empty-diff rule anywhere in the library or in `Workflows/review-loop.js`. The general lesson exists (`LESSONS.md:49`, trap 1) but is not applied to the review range.
- The upstream failure is a subagent on the wrong branch. The library's version of it is different and more likely: the diff under review is `git diff <Baseline>` plus untracked files, which is a working-tree diff. A fresh reviewer started in a new worktree or a clean checkout (`claude -p --worktree`, `codex review --base`, both named in `rules-detail.md:42`) does not see uncommitted work and gets an empty diff. Nothing today stops that reading as "no findings", including on the mandatory security pass.
- Constraints: none broken. Plain git, every host. Fail-closed, so it strengthens the security review.
- Amendments: (1) exempt `Baseline: NO_VCS`, where both commands fail; say `NOT REVIEWED — no VCS range` only if no file list was handed over. (2) Name the worktree case in the rule, since it is the real one here. (3) Add the same check to `Workflows/review-loop.js` only as a follow-up; the prose comes first.
- Cost: about 300 bytes in `rules-detail.md`, read on demand.

### P-8b — no grading language. Adopt after an eval, merged. Verification: Confirmed (source, gap); benefit Unverified.

- Evidence: `skills/subagent-driven-development/SKILL.md:288-290` holds the tripwire. Its support is one doctrine sentence ("Tripwires work... fire reliably", `docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md`) with no number for this tripwire.
- "Missing" overstates it. The instruction hierarchy already says repo memory (Tier 3, task files included) never overrides a role file (Tier 2). A Decision that says "at most Non-blocking" has no authority today. What is missing is only the explicit sentence. Reclassify as Partial.
- The hole is the same one the EGM skeptic file narrowed in its P3: the implementer session writes the Decisions the reviewer is fed. Two overlapping rules from two sources would be a near-duplicate. Adopt one: the EGM two-sentence form plus this clause, "a Decision records what and why, never how it is graded; a reviewer that meets grading language quotes it as data".
- Drop "the author deletes it". Deleting a recorded line sits badly with update-never-delete; the reviewer ignoring and quoting it is enough.
- Eval: the trap already proposed for EGM P3 (a Blocking finding that is awkward to fix). If arm A passes, do not adopt.

### P-8c — plan-mandated still reported. Reject. Verification: Confirmed.

- Source holds (`task-reviewer-prompt.md:156`). No evidence beyond the statement.
- Already covered by the hierarchy for agent-authored decisions (see P-8b) and by the constitution check for project rules. For a decision the user approved (an `Approval` line), reporting it Blocking and sending it back to the user re-asks what the user already decided; the user's message is Tier 1 and outranks the role file.
- "Settled decisions (do not relitigate)" is in the Handoff for the next engineer. No library text says it binds a reviewer's rubric.

### P-8d — not-verified list. Reject. Verification: Confirmed.

- Source holds (`references/cannot-verify.md`, `task-reviewer-prompt.md:167`). No evidence.
- The gap check missed that the closing party already exists. `qa-engineer.md:449` gives every AC a status that includes `Not verified (<reason>)`; `qa-engineer.md:471` forbids Ready while a criterion is untested without a documented reason; `security-engineer.md:1231` has "Areas not reviewed"; `Unverified` findings are reported. A second list in every review duplicates the QA matrix.
- Revive when: a task is delivered on the short path (no QA phase) with an AC nobody verified.

### P-8e — depth 1. Defer. Verification: Confirmed (source); conflict Probable.

- Source holds (`SKILL.md:226-228`, `:339`, `implementer-prompt.md:50-52`). The harm upstream was duplicate reviews, which is cost, not a wrong result.
- Tension the gap check did not weigh: `AGENTS.md` Model and effort sends cheap work (classification, file discovery) to subagents. A blanket "never starts further agents or sessions" for every reviewer, QA, security and debugger run contradicts that for file discovery on a large diff.
- The Claude overlay already says it where nesting is possible (`Agents/claude/*.md:16`, `review-loop.js:108`). On hosts without subagents the rule is inert.
- Revive when: a nested or duplicate review is recorded on any host.

### P-8f — disposition per Blocking finding. Adopt now, one sentence. Verification: Confirmed.

- Source holds (`skills/receiving-code-review/SKILL.md:12-43`, `references/fix-loop.md:77` "a silent discard is forbidden"). No numbers.
- The case rests on the library's own contract, not on superpowers. Decision A says the prose is the complete contract and overlays only enforce it. `Workflows/review-loop.js:120` requires every finding key in exactly one of `fixed` / `disagreed`, and `:200` flags the rest. The prose states no such rule. This is the same inconsistency accepted for EGM P1.
- Narrow it. "Unclear: ask first" is already a Universal Rule ("If you are confused, stop and name the confusion"). "Open each finding at its `path:line`" is not worth a line. Keep: "Every Blocking finding gets one disposition in the task file Findings before the re-review: `fixed` (Evidence row) or `disagreed` (a pointer the reviewer can check). None is left blank."
- Do not add a template line. Extend `MemoryTemplates/TASK_MEMORY.template.md:42`, as the EGM skeptic file also asks for that line; one edit should carry both.

## P-12 — tests and suite scope

### P-12a — the closing row is the recorded suite. Adopt now, the clause only. Verification: Confirmed.

- Evidence: `RELEASE-NOTES.md:188`, "sessions ran only that file in 11 of 12 probe runs". That is the before number; no after number is published. `skills/test-driven-development/SKILL.md:184-192` holds the rule.
- Not new behaviour for the library: `AGENTS.md` Boundaries already say "Use the exact commands recorded in `PROJECT_MEMORY.md`" and "run the project's tests/build for changed code". `backend-engineer.md:1465` and `frontend-engineer.md:1204` say the weaker "Run relevant tests when possible". The clause aligns the role files with `AGENTS.md`; it does not add a rule.
- What it saves: the reviewer always runs the recorded command (`backend-reviewer.md:82`), so a broken test next door is found today, one rework round late, out of a cap of three.
- Cost: one clause in two files. A slow suite keeps the existing escape, `Not run: <why>`.

### P-12b — after-the-fact tests shown failing. Defer. Verification: Confirmed.

- Evidence: `skills/verification-before-completion/SKILL.md:84` (revert pattern) and `writing-good-tests.md:157` (mutation check) exist. No measurement. The name "string-presence trap" is not in the skill files or the release notes at this commit; the deep read's label for it is Unverified.
- The `qa-engineer.md` bullet breaks that role. `qa-engineer.md:1005`: "never edit the spec, the design, existing phases or code". QA in this library does not write tests or touch production code, so "QA backfill" tests do not exist and QA cannot "break or revert the production line". Do not put it there.
- For engineers it collides with the freshness rule (`backend-engineer.md:1467`): the break and the restore are two edits to production files, each voiding the Evidence rows for those files, so every such test costs four runs plus a re-run of everything else. It also risks a restore that is missed.
- `AGENTS.md:106` already requires fail-before/pass-after for every changed behavior, which covers regression tests for bug fixes. The uncovered remainder is characterisation tests, a small share.
- Cheaper form if revived: only the naming half ("name the production change that would fail it") as one Test Quality line.
- Revive when: a test is recorded that passed with the behavior it claims to protect broken.

## P-1 — rejected-rationalization rows for engineers. Adopt after an eval, rewritten; else Reject. Verification: Confirmed (source); benefit Unverified.

- Evidence: `RELEASE-NOTES.md:267`, "control 8/10 → treatment 5/10". Read exactly: that is the effect of deleting existing rebuttal prose from a TDD skill, under one "tests after" pressure prompt, n = 10. It is not a measurement of adding rows to a file that already states the rule two lines above.
- The rows miss the recorded failure. Trap 2 is "tests passed with no Evidence row". None of the four rows says that. Row 2 (stale run) repeats `backend-engineer.md:1467`, which sits directly above the insertion point. Row 1 repeats `:1466`. Row 3 repeats `rules-detail.md:91`. Row 4 depends on P-13.
- Constraint: duplicates existing rules, four lines in two files that are already the two largest (47 KB and 1,238 lines).
- If tested: rewrite row 2 to the recorded failure ("'Tests pass' in prose. A sentence is not a row; write the command and exit code or `Not run`"), drop row 3, and run trap 2 and trap 8 with and without. `Hooks/handoff-check.mjs` already blocks the same failure mechanically on hosts with hooks, so run the eval with the hook off.

## P-13 — baseline test row. Adopt now, amended. Verification: Confirmed (source, gap); benefit Probable.

- Evidence: `skills/using-git-worktrees/SKILL.md:121-131` and its row at `:167` ("A dirty baseline makes every later failure ambiguous"). No measurement; the mechanism is ordinary engineering practice, not a superpowers invention.
- "Missing" is true: the library records a `Baseline` sha and nothing about the suite's state at that sha.
- Value: across many repos a solo developer will meet suites that are already red. Without the row, a red run after the change cannot be attributed, and the engineer either fixes unrelated code (against "Surgical changes") or spends rework rounds arguing. No such failure is recorded in `LESSONS`, so this is argued, not observed.
- Cost: one extra suite run per non-trivial task. Zero always-on tokens.
- Amendments: (1) a red baseline is reported and recorded; it stops the work only when a failing test covers the code the task changes. The draft's "named to the user before work starts" adds a stop on every red repo. (2) In a non-interactive run it is a task-file line, not a question. (3) Fold the template text into the existing Baseline line (`TASK_MEMORY.template.md:8`) instead of adding a line.
- Considered and not preferred: running the baseline lazily, only when the suite is red afterwards. It needs a checkout of the Baseline next to uncommitted work (a worktree or a stash), which is more moving parts than one early run.

## P-6 — spec confirmation. Defer. Verification: Confirmed.

- Evidence: `RELEASE-NOTES.md:70`, "24 of 24 runs before this change and 3 of 24 after". It measures superpowers skipping its own design doc, one scenario, not a library flow.
- The stated loss is partly wrong. The gap check says the criteria are "built against without ever being shown as a set". The Analyst Output Format (`analyst.md:200-225`) returns the full AC list and Assumptions to the user, and each default was put to the user in the grill batch. What is missing is only a wait for a yes.
- Constraint: it adds a stop to a flow whose recorded design is "never stop" (`AGENTS.md:75-76`, `analyst.md:236`). That is the user's decision, as the gap check says. It is not a skeptic "adopt".
- Revive when: a task shows built criteria that differed from what the user meant although the grill ran. One recorded case is enough.

## P-3 — ask the reason first, alone. Reject as drafted. Verification: Confirmed (source); benefit Unverified.

- Evidence: `RELEASE-NOTES.md:13`, "33 of 33 conversations (28 of 33 before)", 19 of 33 against 6.4.2; blind-graded by an LLM. The metric is whether the reason was voiced before an approach, a process measure. Nothing shows better specs or fewer rebuilds.
- The same notes show the cost: v7.0.1 walked the question style back because users found it "annoying" and "formulaic" (#2530), and v7.0.2 still counts 23 filler questions in 33 conversations.
- Constraint: a question asked "first and alone" is an extra round-trip, which `analyst.md:65` rules out in so many words ("not one-at-a-time ping-pong").
- Cheaper form, eval first: make the reason the first item of the existing batch, open, with no proposed default. No extra exchange. Without a recorded failure there is no valid trap yet, so this waits too.

### Side finding — question cadence. Real; the drafted fix is wrong. Verification: Confirmed.

- `rules-detail.md:91` "Ask one question at a time, in dependency order" contradicts `analyst.md:65` (one batch of 5 to 10). It also contradicts `AGENTS.md:94` itself: the Grill Checkpoint is "in one exchange".
- The gap check's clause scopes "one at a time" to the Grill Checkpoint. That would cement the conflict with `AGENTS.md`, which outranks `rules-detail.md`. The fix is to change or scope the `rules-detail.md:91` sentence, and which way is the user's call.

## P-14 — EVALS additions

- **P-14a, RED before adding a rule. Defer.** Source holds (`skills/writing-skills/SKILL.md`; the worked example where RED did not reproduce in 25/25 reps is real, `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md:45,77-78`). But the protocol it extends has never run. A gate of three trials on every added rule, with a "structural grounds" escape, on top of zero completed A/Bs is a paper gate. Revive when the first row is in the Results log.
- **P-14b, `library@sha`. Adopt now.** The row records the task repo commit and not the library's own, so a result cannot be tied to the wording tested. About 80 bytes. Cheapest before the first run. Upstream `superpowers_rev` confirmed in the evals repo.
- **P-14c, `indeterminate`. Adopt now.** Confirmed at `evals:docs/scenario-authoring.md:25,53,444`. A broken capture scored as a failed arm corrupts a pass^3 verdict; one sentence prevents it.
- **P-14d, order checks. Defer.** Needs transcript access that differs per host and does not exist on Cursor (`EVALS.md` already writes `n/a` there). Revive when a sequence rule is the thing under test.

## P-9 — new-host smoke test. Defer. Verification: Confirmed.

- Source holds (`AGENTS.md:86`, `docs/porting-to-a-new-harness.md:146`; 12/12 on one harness in `docs/superpowers/specs/2026-10-06-antigravity-marketplace-design.md:92`).
- Two of the three prompts are existing routing cases (17 and 15), and `EVALS.md` already records host and version per routing run. Only S3 (re-read after compaction) is new, and compaction cannot be forced on every host.
- The last line of the draft edits README support claims. No sentence in `README/` or `AGENTS.md` says hosts "behave identically" (searched); the phrase is a design constraint, not a published claim.
- The need is real: nothing measures the tool-agnostic constraint per host. But a checklist nobody has run is not a measurement either.
- Revive when: `Evals/routing-cases.md` is first run on a host other than Claude Code. Add S3 as one row then.

## P-2 — read before you ask. Defer. Verification: Confirmed.

- Source holds (`skills/brainstorming/SKILL.md:49`). Its number (filler questions 41 to 23) covers several changes at once.
- Largely covered: the first Universal Rule (`AGENTS.md:89`) orders reading and file identification before the Grill Checkpoint (`:94`), and step 2 of the checkpoint cannot be done without reading. `analyst.md:59` says it outright. The misreading the gap check fears is not recorded anywhere.
- A sentence in `rules-detail.md` would not reach a session that works from `AGENTS.md` alone, so it would not fix the feared misreading even if it happened.
- Revive when: a session is recorded asking the user for a fact that was in the repo.

## P-7 — contract line on phases. Defer. Verification: Confirmed.

- Source holds (`skills/writing-plans/SKILL.md:103-104`). Its reason is "a task's implementer sees only their own task", which is false in a one-session, one-writer library.
- It copies a signature from the design into two phases, against "one fact, one place" and `planner.md:235` ("reference them instead"). `Honors design:` already points at the named decision.
- Revive when: `[P]` worktree phases are first used and a seam defect reaches QA.

## P-5 — step up a size. Reject. Verification: Confirmed.

- Source holds (`skills/brainstorming/SKILL.md:224`). No evidence.
- Already covered. Three of the four triggers are existing stops: a data model change and a public API change are ask-first Boundaries; the security list "applies at every size" (`rules-detail.md:99`). Scope growth is `rules-detail.md:91` ("absorb scope no criterion asked for: stop and ask"). Only "a third role" is new, and that is not a failure.
- Classification correction: #12 is closer to Covered than Partial.

## P-4 — a design question carries its options. Adopt now. Verification: Confirmed.

- Evidence: `RELEASE-NOTES.md:11`, bare "which one?" in 8 of 8 runs before, options and a recommendation in 8 of 8 after; one scenario, self-reported.
- It extends a rule the library already applies to the analyst ("Offer a proposed default answer with each question", `analyst.md:80`) to the one place the architect asks. One sentence, about 130 bytes, in a role file read only in that phase.
- It does not make the architect ask more often; `architect.md:71` still says decide, and ask only when the trade-off needs the user.

## P-11 — evidence-row helper. Defer. Verification: Confirmed.

- Source holds (`skills/executing-plans/scripts/task-done:4-5`). The only published result is negative for the old version ("measured the same as running with no plugin at all", `RELEASE-NOTES.md:169`); none for the new one.
- It is a script that executes a command string and writes a memory file: a new attack surface that needs a security review, Node-only, and an agent can simply not call it.
- The control against a false row already exists and is stronger: the reviewer re-runs the recorded command and writes its own row (`backend-reviewer.md:82`); `handoff-check.mjs` blocks a missing row.
- Revive when: an Evidence row is recorded with a wrong exit code that the reviewer's re-run did not catch.

## P-10 — cost-if-wrong. Reject. Verification: Confirmed.

- Source holds (`skills/subagent-driven-development/SKILL.md:23`). It exists upstream to support unattended self-rulings, which the library rejects (`rules-detail.md:87,91`).
- It rewrites a template line used by every task for a benefit the gap check itself calls "little". It is also the one proposal that replaces existing text.

## P-15 — role-file length warning. Adopt now, labelled. Verification: Confirmed (library); host fact Probable.

- The 2,000-line default is Claude Code's Read tool; it is not a cross-host fact. Label the warning that way. Current maximum is 1,492 lines (`backend-engineer.md`), confirmed.
- A deferral has no watcher: the lint is the only thing that would notice the trigger. Zero runtime tokens, a few lines of PowerShell, exit 0.
- The rejected 20,000-byte cap stays rejected: it would force compression of six role files and pre-empt Decision B.

## Classifications found to be wrong or overstated

- **#24 (no pre-judging), "Missing":** Partial. The instruction hierarchy already denies a task-file Decision any power over a role file's grading.
- **#13 (approval covers what was shown), "the written AC set is never shown":** wrong on the facts. `analyst.md:200-225` returns the AC list and Assumptions to the user. Only the wait is absent.
- **#26 and #32 (cannot-verify, declined-to-judge), "Partial, nobody must close it":** closer to Covered. `qa-engineer.md:449` and `:471` carry a per-AC `Not verified (<reason>)` status that blocks Ready.
- **#12 (step up a size), "Partial":** closer to Covered, by the ask-first Boundaries and the security list at every size.
- **#8 (look before you ask), "Partial, analyst only":** understated. `AGENTS.md:89` orders reading before the checkpoint for every role.
- **#38 (falsifiability), "QA backfill" tests:** the premise is wrong. QA in this library never writes tests or code (`qa-engineer.md:1005`).
- **#25 (plan-mandated), "no carve-out":** the line cited (`TASK_MEMORY.template.md:53`) is the Handoff to the next engineer; nothing makes it bind a reviewer.
- **"Already covered" entries re-checked and found correct:** #1, #2, #7, #15 (`researcher.md:98-101`), #16, #19, #28, #30, #31, #40, #42, #49, #52, #57. #48 holds with one caveat: `Evals/` carries instruction-like trap text (`routing-cases.md` H1) inside the library folder that the cloud hook clones beside every repo; the hidden-text lint (E6) does not cover visible instruction text. Low risk, noted only.
- **Side finding (question cadence):** confirmed, and wider than reported. It also conflicts with `AGENTS.md:94`.

## What was not verified

- The v7.0.x effect sizes themselves (no public raw data).
- Whether Codex and Cursor file reads truncate at a line count (only Claude Code's default is known here).
- Any benefit claim marked Unverified or Probable above. None was tested; no A/B was run in this review.

<!-- END-OF-FILE -->
