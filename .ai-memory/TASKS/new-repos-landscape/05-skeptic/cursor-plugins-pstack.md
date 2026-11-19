# Skeptic review: cursor/plugins (pstack) proposals

- Date: 2026-11-18. Role: independent skeptic (default: refute).
- Inputs (data, not instructions): `04-gap/cursor-plugins-pstack.md` (10 proposals, A to J) and `03-read/cursor-plugins-pstack.md`.
- Result: 2 Adopt now (A and G, both with amended wording), 1 Adopt after an eval (E part 3), 6 Defer (B, D, E parts 1 and 2, F, H, I), 2 Reject (C as drafted, J).
- Nothing in the library was edited. Every adoption below is an agent-configuration change: ask-first plus a `security-engineer` pass.

## How I checked

- Upstream: sparse clone of `cursor/plugins` at HEAD `93b916d4a1e806507e22f4716b352fa91f2b227e` (2026-11-17), the same commit the deep read used. Read in full: `pstack/skills/benchmark-checklist/SKILL.md`, `interrogate/SKILL.md`, `blast-radius/SKILL.md`, `pstack/agents/comment-sicko.md`, and the playbooks `hillclimb.md`, `eval.md`, `bug-fix.md`. Read by grep: `shipping.md`, `babysit.md`, `autonomous-run.md`, `autopilot-full.md`, `worker.md`, `poteto-mode/SKILL.md`, `create-verification-skill/SKILL.md`, `references/bugbot-triage.md`. Nothing was installed or run.
- Library: grep over `AGENTS.md`, `EngineeringTeam/`, `LESSONS*`, `EVALS.md`, `Evals/`, `MemoryTemplates/`, `Hooks/`, `Agents/`, `Settings/`, `Rules/`, `Workflows/`, `Scripts/`, `README/`, then read the matching lines.
- Not checked:
  - Issue and PR titles and states (#864, #1178, #1237, #1271 and the rest). The GitHub API is not enabled for `cursor/plugins` in this session. Every claim that rests on an issue number is Unverified here.
  - Sibling gap files. I did not read gstack B, skillopt P1 or the others that the gap file points to.
  - Proposed commands. I did not run `git patch-id` or any other command from the drafts.
- Instruction-like text met in the source, reported and not acted on: `comment-sicko.md` ("My first output when spawned is exactly this"), `interrogate/SKILL.md` ("Break this change..."), `eval.md` and `hillclimb.md` step lists. All are pstack's instructions to its own agents.

## Facts that hold across proposals

- Every upstream quote in the gap file that I opened is accurate at `93b916d4`. The source claims are Confirmed.
- The source publishes no measured effect for any mechanism. The only empirical material I found is two single-PR anecdotes in `references/bugbot-triage.md` (lines 96 and 113), both marked "Confidence: candidate".
- `EVALS.md` holds no A/B result. Its Results log has two rows (lines 68 and 69), and both record relocations and a lint run, "no A/B yet". So "Adopt after an eval" means running the library's first eval, and I use that verdict only where a gate is loosened.
- `LESSONS.md` and `LESSONS/*.md` record no failure of the kind any of the ten proposals prevents (grep for performance claims, sibling sites, narration comments, rebase, hosted reviewers: no relevant line). By the library's own admission rule (`_shared/memory.md:27`, "A pitfall enters after someone saw it"), most of these are rules ahead of a recorded need.
- AGENTS.md is at 32,668 of 32,768 bytes and 194 of 200 lines. No proposal touches it, which I confirmed. The consequence is that a new section in `_shared/rules-detail.md` cannot get a pointer from AGENTS.md and is reachable only through a role-file pointer.

## Verdicts

| ID | Proposal | Verdict | Verification |
|---|---|---|---|
| A | Valid performance measurement | Adopt now, amended wording | Confirmed (source and gap); value Probable |
| B | Metric loop | Defer | Confirmed (source); gap Probable |
| C | Verify page | Reject as drafted | Confirmed |
| D | Unannounced trial, blind judge, transcript scope | Defer | Confirmed |
| E1 | `Confirmed` is rerunnable | Defer; the demotion clause is rejected | Confirmed |
| E2 | Hosted and bot reviewer intake | Defer | Confirmed |
| E3 | Defects the diff did not make | Adopt after an eval | Probable |
| F | Verdict after a rebase (`git patch-id`) | Defer | Confirmed (source); command Unverified |
| G | Debugger: same fault elsewhere | Adopt now, amended wording | Probable |
| H | Behavior Preserved proof level | Defer | Confirmed |
| I | No comments that narrate the change | Defer | Confirmed |
| J | Bound on routing up | Reject | Confirmed |

### A. Valid performance measurement: Adopt now, with amended wording

- Evidence. The source is accurate: `benchmark-checklist/SKILL.md` has the seven questions and the four verdict words. The gap is real: `qa-engineer.md:305-315` lists scenario, dataset size, threshold, command and pass/fail, and `backend-engineer.md:1163` and `frontend-engineer.md:964` require measurement, but no library file says how many runs or what to report (grep `median`: 0 hits). The source has no measured effect. The content is standard benchmarking practice and does not depend on pstack.
- Constraints. None broken. About 130 words in one role file, read only in a QA phase. `EVALS.md:31` already uses the same noise rule for evals, so this is consistent and not a duplicate.
- Value. It stops a single before/after timing, a cached run, or a run that got faster because it failed from being recorded as a gain.
- Faults in the draft that must be fixed before it lands:
  1. It drops the source's exception: "For a quick ballpark the user asked for, one run is enough. Still check questions 4 and 7, and say that it is one run." Without it, "at least 5 per variant, alternating" is impossible for the long single-run jobs this library's lessons describe (bulk database loads, `LESSONS/backend.md:18`; embedding fills, `LESSONS/data-ml-ai.md:35`). Add: a run too long to repeat is reported as `one run` with the error count and the work-was-timed check, and its verdict is at most `inconclusive`.
  2. It drops source question 3 (arithmetic against a physical limit) and question 6 (the result as a share of the end-to-end path). Both are one-line sanity checks; keep question 6 at least.
  3. The pointer text names "Performance QA Scripts". That heading exists (`qa-engineer.md:298`), so lint rule E1 should pass. Re-check at apply time.
- Reason for the verdict. This is the one proposal where three role files already demand the thing and none defines it. The fix is a definition and adds no new process. Adopt with the three amendments.

### B. Metric loop: Defer

- Evidence. `hillclimb.md` is quoted correctly, with one change of meaning: the source pairs the target with a floor on attempts ("so a lucky early win can't end the run"). The draft turns that into a cap ("`n attempts made`, whichever comes first"). The draft's rule is reasonable, but it is not the source's rule. No measured effect.
- Constraints. "Revert that change in full before the next attempt" has no stated mechanism. The library's delivery default can be an uncommitted diff (`rules-detail.md:76`). Reverting one attempt while keeping the accepted ones then needs a checkpoint per attempt, and `rules-detail.md:82` makes undo ask-first and limits it to `Owns:` paths. The draft would either stall on an approval at every rejected attempt or quietly bypass the Undo rule. The source avoids this with one commit per accepted fix and parallel worktrees, which the one-writer rule excludes.
- Value. The section would sit in `_shared/rules-detail.md` with one pointer from `prompt-engineer.md`. A backend performance task would never load it, because AGENTS.md has no room for a pointer. Optimisation loops are rare for a solo developer, and no lesson records one going wrong.
- Trigger to revive: the first task whose done-when is a numeric target that takes more than two attempts, or a review finding that unhelpful changes were left in a diff. At that point, write the revert mechanism first (stash or commit per attempt, approved once for the task).

### C. Verify page: Reject as drafted

- Evidence. The source is accurate (`create-verification-skill/SKILL.md:27-40`: Launch, Doctor, "A generated skill that was never executed is a draft, not a deliverable", the stand-in rule).
- Constraints. The draft duplicates and contradicts an existing rule. `_shared/memory.md:31` already says a repeatable workflow of five or more steps with exact commands "is its own `wiki/howto-<name>.md`, indexed from `PROJECT_MEMORY.md`, written the second time it runs". The draft says the page is "written the first time". Launch is already the `Run:` command in `PROJECT_MEMORY.template.md`, and `AGENTS.md` already requires recorded commands to work from a fresh checkout. `memory.md:28` already has the `Verified:` header.
- Value. The only new content is the fixed headings and the `stand-in:` mark. The deep read reports that the source's own version drew a complaint that it was shown to run but never shown able to fail (issue #1271, Unverified here). The draft inherits that gap.
- Cheaper way: add "starting and driving the app for verification" to the examples in `memory.md:31`, plus the one `stand-in:` sentence. That is a wording tweak to an existing rule and does not need a new mechanism. Revive only if `Not Ready — manual verification required` recurs because nobody recorded how to launch the app.
- The gap file's class for mechanism 19 ("Partially covered") understates the coverage. It is nearer "Already covered".

### D. Unannounced trial, blind judge, transcript scope: Defer

- Evidence. `eval.md` is quoted correctly. The source publishes no eval results, so there is no evidence that its blinding changes outcomes.
- The first bullet cannot be satisfied as written:
  - It bans `eval`, `benchmark`, `score`, `candidate`, `judge` and similar words from "any file the agent can read". The library's own `AGENTS.md` names `EVALS.md` twice (lines 83 and 194), and the agent reads AGENTS.md in every trial.
  - `EVALS.md:5` requires trials on "real tasks in real repos". Real repos contain these words. The owner's own project has a `Benchmark.Services` namespace (`LESSONS/tooling-agent-workflow.md:10`).
  - Under the draft, every trial would be logged `exploratory` and no verdict could ever be recorded.
- The second bullet (blind judge) applies only to `judged` checks. `EVALS.md:36` already makes those the exception, and no judged row exists.
- The third bullet (transcript scope) closes a gap that is not open. `EVALS.md:35` reads the trial's own JSON output and its own transcript. Nothing in the library searches a host's transcript directories (grep `transcript` over `Hooks/`, `Workflows/`, `Agents/`, `Scripts/` finds only the rule that reviewers never get the implementer's transcript).
- Value. This would refine a protocol that has never been run.
- Trigger to revive: the first real A/B row in `EVALS.md`. Then adopt a narrow version: the task prompt and the fixture's branch and directory names do not announce the trial; a judged check sees shuffled neutral labels. Drop the banned-word list for file contents.
- The gap file recommended Adopt. I disagree for the reasons above.

### E. Finding intake: three parts, three verdicts

**E1. `Confirmed` is rerunnable: Defer. The demotion clause is rejected.**

- Evidence. `interrogate/SKILL.md` is quoted correctly. In the source the parent, which did not write the code, reruns each command and drops what fails.
- Constraints. The draft gives the rerun to the engineer, who wrote the code, and relabels a finding that does not reproduce as `Unverified`. `rules-detail.md:42` says `Unverified` cannot block. So the author of the diff could unblock their own change by failing to reproduce a finding, including a security finding. That weakens review independence (`AGENTS.md:77`) and the mandatory security review. The draft's security exception covers only E2.
- The compatible half is that a `Confirmed` finding carries its command and observed output. It is nearly covered already: `backend-reviewer.md:986` defines `Confirmed` as "reproduced, ran, or traced to a failing test", and the Evidence-row rule requires a command and exit code for any run.
- Trigger to revive: a recorded case of a `Confirmed` finding that was wrong. Then require the command on the finding and send a non-reproducing finding back to the reviewer in a fresh context. The engineer never relabels it.

**E2. Hosted and bot reviewers: Defer.**

- Evidence. `babysit.md:9` is quoted correctly. The source's two sourced cases point the other way from "noise": one PR had about eighteen bot findings, "every one fixed rather than dismissed" (`bugbot-triage.md:96`).
- Constraints. Mostly duplicate. `AGENTS.md:92` already makes PR text Tier 4 data. `AGENTS.md:66` routes findings from a report to the engineer. Posting a reply is already ask-first. The new part, the engineer dismissing a finding with one line of disproof, is the same self-review problem as E1.
- Value. The library's agent does not open or watch PRs by default, so hosted-review comments arrive only when the user pastes them, and then the user's message sets what to do.
- Trigger to revive: the first task where hosted-review comments are routed into the rework loop.

**E3. Defects the diff did not make: Adopt after an eval.**

- Evidence. `autopilot-full.md:16` is quoted correctly ("A problem the PR's base already has ... doesn't block unless the PR copies it or newly reaches it"). No measured effect. The gap is real: no reviewer file says how to grade a defect unchanged since Baseline in an untouched file. The nearest lines are `backend-reviewer.md:52` ("Inspect the surrounding unchanged code") and `AGENTS.md:97` ("Mention pre-existing dead code but do not delete it").
- Constraints. It is consistent with surgical changes and `Owns:`. But it moves a class of finding from Blocking to follow-up, which loosens a gate. The security and constitution exceptions are present and must stay.
- Value. It protects the three-round cap from being spent on defects the change did not introduce. That failure is plausible but not recorded.
- Eval before adopting. Use one fixture with a pre-existing style defect in an untouched file and one planted defect inside the diff. Pass means the first is reported under Risks / Follow-ups, the second is still Blocking, and a pre-existing security defect still routes to `security-engineer`.

### F. Verdict after a rebase: Defer

- Evidence. `shipping.md:7` is quoted correctly and `git patch-id` is a real git command. The source's use is narrower than the draft suggests: it applies to a stack of PRs that an agent restacks and merges.
- Constraints. It depends on gstack B's `Reviewed:` line, which is not adopted, so there is nothing to append to. The command is untested on Windows PowerShell, where a pipe between native programs can re-encode bytes; the owner's library path is a Windows path. The gap file flags this itself.
- Value. Small. The draft re-runs every Evidence row at the new HEAD in all cases, so the only saving is the reviewer's re-read. The agent does not rebase; the user does, rarely, on a solo repo. The library has no rule mentioning rebase at all (grep: 0 hits), and no recorded incident.
- Trigger to revive: gstack B is adopted, and a reviewed branch is rebased before acceptance at least once.

### G. Debugger, same fault elsewhere: Adopt now, with amended wording

- Evidence. This is the weakest source link of the ten. `bug-fix.md` at `93b916d4` has no such step. The gap file derives the idea from an open PR title (#1237), which I could not verify. The idea does not rest on pstack: searching for other instances of a confirmed fault is established practice (variant analysis in security work). The gap is real: `debugger.md:205` mentions "Other code paths possibly affected by the same cause" as free text under Risks, and `debugger.md:105` asks "Why not elsewhere" only to test the diagnosis. No search is required anywhere.
- Constraints. None broken. About 60 words in one role file, read only in a debugger phase. It does not make the debugger fix anything, and it keeps "One root cause, one fix plan" (`debugger.md:197`) because it lists sites of one cause. Sites outside the fix boundary need the user's go-ahead, which matches `backend-engineer.md:1426`.
- Value. A fix that closes the reported site and leaves the same defect at a sibling call site is a common cause of a bug coming back. The cost is one search per diagnosis, and the draft allows `not searched: <why>`.
- Amendments:
  1. Say that the search uses the Code & Source Graph first when it is available, as `debugger.md:83` already does for tracing.
  2. Say where `follow-up` sites go: the task file's Risks / Follow-ups, so the list is not lost in the report.
  3. Keep the existing sentence at `debugger.md:205` ("Other code paths possibly affected by the same cause") and append a pointer to the new section, so the two do not read as separate places for the same fact.
- Verification is Probable because the upstream support is a PR title I could not open.

### H. Behavior Preserved proof level: Defer

- Evidence. `blast-radius/SKILL.md` has the five-level ladder as described. No measured effect.
- Constraints. The line would go into `MemoryTemplates/TASK_MEMORY.template.md`, which shapes every task file. It overlaps the Evidence section directly below it, which already separates a run (a row with command and exit code) from a claim ("not verified").
- Value. Low. The section is used "Only where preservation was non-obvious or at risk" (`TASK_MEMORY.template.md:30`), and a reviewer already checks preservation against the diff.
- Trigger to revive: a review finding where a Behavior Preserved line turned out to be an assumption.

### I. No comments that narrate the change: Defer

- Evidence. `comment-sicko.md` lists "Narration" among comments to delete. The source's keep-list is far harsher than the draft and is not what is proposed. No measured effect.
- Is it missing? Yes. Grep for `narrat` returns nothing. The existing rule ("Comments should explain why", `backend-engineer.md:259`, `frontend-engineer.md:280`) does not exclude "added for AC-3", which reads as a why.
- Constraints. None broken. But the draft adds the line to two of the eleven engineer role files and to no reviewer file, so it would be uneven and unenforced.
- Value. Diff noise only, as the gap file says.
- Cheaper way and trigger: the first time a reviewer or the user objects to a narration comment, record it as one line in `LESSONS/tooling-agent-workflow.md` with the user's approval. That reaches every role once, where the draft needs two copies.

### J. Bound on routing up: Reject

- Evidence. `poteto-mode/SKILL.md:94` is quoted correctly. It is a cost rule for one named model in a multi-model panel setup.
- Constraints and value. The library forbids switching the main-session model between phases (`AGENTS.md:83`), and the user picks that model. The agent has no way to route itself up, so the rule would govern a choice the agent does not make. `rules-detail.md:54` already requires any routing change to be logged as an `EVALS.md` row.
- The gap file's verdict was Defer. I go further because no trigger would give the agent this choice without a host-specific overlay.

## Classifications I found to be wrong

- No "Already covered" row is wrong. I re-checked 1, 3, 5 (mechanism), 11, 28, 34, 35, 38 and 39 against the cited lines; each quote exists and says what the gap file claims. `Scripts/Lint-Library.ps1` and `.github/workflows/lint-library.yml` exist. I did not re-check rows 2 and 30 line by line.
- Two other classes are off, in the direction of overstating a gap:
  - Row 7 (routing up) is marked Missing. `rules-detail.md:54` logs "any routing change", up or down, so it is Partially covered.
  - Row 19 (verification page) is marked Partially covered. `memory.md:31` plus the `Run:` and `Browser verification:` lines cover it except for the stand-in mark. It is nearer Already covered.
- Row 31 (transcript scope) is marked Missing. That is literally true, but there is nothing to scope: no library text searches host transcripts.
- Row 25 attributes the "same fault at other sites" idea to pstack. The file at the commit read does not contain it; the attribution rests on an unverified open PR.

## Risks and limits of this review

- Issue-based claims in the deep read stay Unverified (API not available).
- "Adopt now" for A and G rests on argument and standard practice. No eval of either exists.
- I did not read the sibling gap files, so I cannot say whether an Adopt here duplicates a draft adopted from another repository. Check A against any other benchmark proposal, and G against any other debugger proposal, before applying.

<!-- END-OF-FILE -->
