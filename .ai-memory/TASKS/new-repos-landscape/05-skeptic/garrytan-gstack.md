# Skeptic review: garrytan/gstack proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). No library file edited, nothing installed, no gstack code run.
- Inputs read as data: `04-gap/garrytan-gstack.md` (proposals A to H, 33 classified mechanisms), `03-read/garrytan-gstack.md`.
- Upstream re-checked from a fresh shallow clone: `garrytan/gstack` `main` @ `2373714` (2026-11-18T02:21Z, `VERSION` 1.100.0.0). This is one commit after the deep read's `29e9502`; the difference could not be diffed (shallow clone), so quotes are as of `2373714`. Files opened: `docs/evals/pr-round-count-results.md`, `docs/evals/verdict-line-replay-results.md`, `docs/designs/gate-diff-calibration.md` (the deep read had not opened it), `review/gate-integrity.md`, `docs/test-value-bar.md`, `cso/SKILL.md`, `eval-plan/SKILL.md`, `review/sections/adversarial.md`, `CLAUDE.md:435-447`.
- Library re-checked on disk at `a031ce5` (branch `main-xpl0sx`): `AGENTS.md` 32,668 bytes / 194 lines. No proposal touches it; confirmed.
- Not checked: gstack issues and PR threads, the 52 KB gate-integrity design document beyond a grep, anything outside the files named above. `Scripts/Lint-Library.ps1` not run (nothing changed).
- Instruction-like text met in the source: none acted on. The deep read already reported the paste-this-prompt install, the referral note and the PR guardrails in gstack's own `CLAUDE.md`; nothing new found in the files opened here.

## Evidence that applies to every proposal

- gstack has two measured results that bear on these proposals, both the maintainer's own, both small: the re-check result (0 of 8 real faults, from 3 PRs, so about 3 independent draws) and the gate-diff inventory over 50 PRs. Everything else rests on the logic of the mechanism.
- Neither result measures a rule in this library's shape. They justify a test here, not adoption by themselves.
- The library has no recorded failure behind A, C, D, E, G or H. Searched `LESSONS.md`, `LESSONS/` and `Evals/trap-tasks.md` for a weakened or skipped test, a stale review verdict, a partial security audit read as a pass, code sent to a second vendor, a redundant test, and a failure waved off as pre-existing: no hits. F is the exception (`library-field-review-2026-10.md:329`).
- `EVALS.md` Results log still reads "(none yet)", and it allows traps only from recorded real failures. "Adopt after an eval" therefore means "not yet" in practice, and a proposal with no recorded failure cannot get a valid trap. That is why nothing below lands on "Adopt after an eval".
- Every "Adopt now" below is an edit to a role file, `_shared/` or the task template: agent configuration, so ask-first plus the `security-engineer` pass, as the gap check says.

## Verdicts

| # | Proposal | Gap-check stance | Skeptic verdict | Verification |
|---|---|---|---|---|
| A | Gate-edit inventory in reviewer mechanical checks | Adopt | **Adopt now, rewritten** (inventory of changed and deleted existing tests; not "every hunk is a finding") | Confirmed (source, gap); benefit Unverified |
| B1 | A later edit voids the review verdict | Adopt | **Adopt now, one sentence** | Confirmed (gap); benefit Probable |
| B2 | `diff id` hash for uncommitted work | Adopt, open point | **Defer** | Confirmed |
| B3 | `review-loop.js` round 2+ reviews the whole diff | Optional | **Adopt now, one sentence** | Confirmed (source); gap smaller than stated |
| C1 | Security report states coverage first; no Pass on unassessed scope | Adopt | **Adopt now, amended** (extend the existing Scope Reviewed section) | Confirmed (source, gap); benefit Probable |
| C2 | `ran by me` / `self-reported` test status | Adopt | **Reject** | Confirmed |
| D1 | Sending code to a second vendor is ask-first | Adopt | **Adopt now** | Confirmed (gap); benefit Probable |
| D2 | `Cross-model: not run (<why>)` on every review record | Adopt | **Reject** | Confirmed |
| E1 | Three test-value questions on every test | Adopt (low risk) | **Reject** | Confirmed (source); benefit Unverified |
| E2 | No production seam only a test needs | Adopt | **Defer** | Confirmed (source) |
| E3 | No test pins prompt prose | Adopt | **Defer** | Confirmed (source); benefit Unverified |
| F1 | Eval ceiling, stop rule, partial results to disk, departures | Adopt | **Adopt now** | Confirmed |
| F2 | Mandatory zero-cost dry run, then priced pilot | Adopt | **Defer** | Confirmed (source); host fit Probable |
| G | "Lessons applied" line | Eval first | **Reject** | Confirmed |
| H | "Pre-existing failure" needs a Baseline run | Adopt | **Adopt now, only together with the baseline test row** (obra P-13); alone, Defer | Confirmed (source, gap); benefit Unverified |

Net of the "Adopt now" set: about 1.6 KB across two reviewer files, `rules-detail.md`, `security-engineer.md`, `EVALS.md`, the task template and one sentence in `Workflows/review-loop.js`. Zero bytes in `AGENTS.md`, zero always-on tokens.

## A — gate-edit inventory. Adopt now, rewritten. Verification: Confirmed (source, gap); benefit Unverified.

- Evidence: `review/gate-integrity.md:17` says "the tool inventories and tags, it never judges and never suppresses" and `:11` calls a listed hunk "inventory, never a finding". `:163` confirms the unavailable-scan rule ("missing coverage, never `none detected`").
- The calibration document the gap check left unopened does not show the mechanism works. It states its own limit: "It does **not** measure agent findings, kept/restored/open dispositions, or whether a reviewer would have wanted to read a tagged hunk." It counts hunks, nothing more.
- It also argues against the draft wording. Over 50 PRs it found a median of 40.5 listed hunks per PR and concludes this "confirms per-hunk disposition is unworkable". One tag as first specified fired on 848 hunks across 41 PRs and had to be demoted. The draft's "Every tagged hunk is a finding unless the task file Decisions carries the user's approval for that exact edit" is the per-hunk rule the source abandoned.
- "Partially covered" is true. The rule exists (`AGENTS.md:106`, `:113`); the reviewers ask "Were tests weakened?" (`backend-reviewer.md:899`, `frontend-reviewer.md:619`) as a judgement question. No mechanical step lists the hunks.
- Constraints: none broken. Plain git, every host. It adds a check for an existing Never rule, so it strengthens rather than duplicates.
- Value: the library works test-first, so every feature diff touches test files. A rule that flags every such hunk produces a finding per phase and an approval request per test, which a solo developer will learn to wave through. The failure worth catching is narrower: an existing test deleted, disabled or loosened.
- Rewrite before adopting:
  - Scope the inventory to test, snapshot, CI and runner-config files that existed at Baseline: `git diff <Baseline> --diff-filter=DM --stat -- <those paths>`. Newly added tests are not listed.
  - The list is inventory. A finding is raised only for a deleted or disabled existing test, a removed or loosened assertion, a regenerated snapshot, a relaxed threshold or timeout, or a check removed from CI, when the task file Decisions has no entry explaining it. Blocking when the edit makes a failing check pass.
  - Keep `Gate edits: none` and `Gate edits: Not run: <why>`; drop the skip-idiom catalogue to one example line (the reviewer reads the hunks anyway).
  - Keep the rationalization bullet.
- Cost after the rewrite: about 500 bytes in each of two reviewer files, one command per review.
- Cheaper way considered: rely on `backend-reviewer.md:899`. Rejected: it is the same self-judgement the proposal exists to replace.

## B — bind the review verdict to the content reviewed

### B1 — a later edit voids the verdict. Adopt now, one sentence. Verification: Confirmed (gap); benefit Probable.

- Evidence: the numbers are as quoted (`pr-round-count-results.md:16-17`, `:21-22`): 22 of 24 seeded faults, 0 of 8 real ones. Two limits the gap check omits: the 8 faults "come from 3 PRs, so they are not independent draws", and "The reader had no repository access, as preregistered, so a reader that can open files may do better; that is not measured."
- What the result supports is "re-review the whole change, not the fix hunks". The library already does that (`rules-detail.md:42`). The result says nothing about receipts; gstack's receipts predate it. So the gap check's "best-evidenced rule in the source" applies to the half the library already has.
- The gap is smaller than stated. The reviewer already writes its own Evidence row with a sha (`backend-reviewer.md:82`), the Freshness rule voids rows after a later edit (`TASK_MEMORY.template.md:38`), and QA's Ready needs the suite "at the current sha" (`qa-engineer.md:473`). What is missing is one statement that the same freshness rule applies to the Findings verdict.
- Adopt this sentence in `rules-detail.md`, next to the rework loop: a review, QA or security verdict covers the tree its own Evidence row names; a later edit to a non-prose file voids it exactly as it voids Evidence rows, and the next review reads the whole `git diff <Baseline>` again. No new section, no new template field: the reviewer's Evidence row is the `Reviewed:` line.
- Cost: about 250 bytes, no per-session tokens.

### B2 — `diff id` hash for uncommitted work. Defer. Verification: Confirmed.

- The gap check names the blocker itself: the hash must match between bash and Windows PowerShell 5, and `LESSONS.md:46` records a CR mismatch of exactly this kind that voided three runs. A receipt that mismatches on the user's own platform turns every review into "not reviewed".
- Trigger to revive: a single command shown to give the same value in bash and PowerShell 5 on a diff containing CRLF and non-ASCII bytes, or the constitution's delivery default becomes "branch + PR" (then the sha is enough and no hash is needed).

### B3 — `review-loop.js` round 2+ sentence. Adopt now, one sentence. Verification: Confirmed (source); gap smaller than stated.

- The gap check says the round 2+ prompt "only instructs re-checking the listed findings". Not quite: items 1 and 2 of the same prompt (`Workflows/review-loop.js:104-106`) still say to read the role file in full and review the whole diff. The prior-findings text is added on top.
- The added text ("re-check each ... report it again only if it is still present") can still pull attention to the old findings, which is the narrowing gstack measured. One sentence removes the ambiguity. It is executable overlay code: reviewed as code, `Workflows/review-loop.test.mjs` re-run.

## C — security report coverage

### C1 — coverage first; no Pass on unassessed scope. Adopt now, amended. Verification: Confirmed (source, gap); benefit Probable.

- Evidence: `cso/SKILL.md:154` "Every report begins with **complete**, **partial**, or **not assessed** ... Never infer a clean result from setup failure or absent scanner output." Quote confirmed. No results on whether it changes outcomes were read; the mechanism matches the library's own recorded lessons on empty scope (`LESSONS.md:46`, `:49`), which is the stronger ground.
- The gap check overstates the gap. The report already has `## Scope Reviewed` as its third section (`security-engineer.md:1103-1111`), and the Evidence convention already has `Not run: <check> — <why>`. What is true: "Areas not reviewed" is the last line of the report (`:1231`), and nothing ties the recommendation to it.
- Amend: do not add a `## Coverage` section. Add to the existing `## Scope Reviewed` block one line, `- Not reviewed / scans not run: <area or scan — why>, or none`, and one rule: the recommendation is not Pass when an area the change touches is listed there; use Needs More Information. Leave the final "Areas not reviewed" line as it is (belt and braces, already the library's stated habit).
- Constraints: fail-closed, strengthens the mandatory security review. About 250 bytes.

### C2 — `ran by me` / `self-reported`. Reject. Verification: Confirmed.

- In gstack the label exists because the audited code runs in the same process as the test reporter and "can forge reporter output" (`cso/SKILL.md:146`), in a container reproduction flow. The library has no such flow.
- The library already separates the two cases: the engineer's row "is a claim; yours is the check" (`backend-reviewer.md:82`), and Confirmed is defined as "reproduced, ran, or traced to a failing test" (`rules-detail.md:42`). The bullet restates both.

## D — cross-model review

### D1 — sending code to a second vendor is ask-first. Adopt now. Verification: Confirmed (gap); benefit Probable.

- "Missing" is true. `rules-detail.md:42` says "cross-model when available" and names `codex review --base`. The ask-first list (`AGENTS.md:112`) has no entry for sending repository content to another vendor. The Rule of Two covers it only for unattended runs.
- The library already takes this position once: the graph section allows documents to an LLM backend only with "the user's approval, never regulated material" (`AGENTS.md:167`). D1 makes the review path consistent with it.
- Value: the role table carries clinical NLP and PHI work. An agent in one vendor's host that shells out to another vendor's CLI with the diff is a real disclosure, and nothing written stops it today. Cost: one sentence in `rules-detail.md`, asked once per repository.
- Keep the wording to the consent rule and the constitution record. It tightens a security rule, so the `security-engineer` pass applies.

### D2 — `Cross-model: not run (<why>)` on every record. Reject. Verification: Confirmed.

- The gap check's supporting number is misread. "Both arms flagged a blocker in 80 of 80 blocker trials" (`verdict-line-replay-results.md:16`) compares two arms of one experiment, with and without a requested verdict line. It does not compare two vendors, and it says nothing about what a second model adds. The only support left for cross-model benefit is one anecdote in an essay.
- A mandatory line that reads "not run" on every single-vendor review presents the normal case as a shortfall. It pushes toward the outbound send D1 restricts and toward depending on a second paid tool, against "works from AGENTS.md alone".
- The template already records the reviewer context (`TASK_MEMORY.template.md:42`). A user who wants the model named can add it there.

## E — test value

### E1 — three questions on every test. Reject. Verification: Confirmed (source); benefit Unverified.

- Source text confirmed (`docs/test-value-bar.md:16-17`). gstack's own numbers in this area are about flaky paid eval lanes, not about this rule; the gap check says so.
- Cost: a name or comment answering three questions on every new or changed test, in every repo, against "Match existing style". The third answer ("why existing coverage does not already catch that") cannot be checked by a reviewer without reading the whole suite, so it becomes a sentence the agent writes to satisfy the rule.
- The measured failure in the source (tests that pin output) is already covered by the change-detector rule in three files (`qa-engineer.md:763`, `backend-reviewer.md:173`, `frontend-reviewer.md:191`).

### E2 — no test-only production seam. Defer. Verification: Confirmed (source).

- Sound, but no recorded instance here, and "do not add unrequested flexibility" (`AGENTS.md:98`) already covers a public member nobody calls.
- Trigger: a review finding in any repo of a public method, flag or constructor added only for a test.

### E3 — no test pins prompt prose. Defer. Verification: Confirmed (source); benefit Unverified.

- Source text confirmed (`docs/test-value-bar.md:28-31`). It is a special case of the change-detector rule, which already says "asserts verbatim output".
- No recorded failure in the library. Trigger: the first test in any repo that breaks on a wording-only prompt edit; then add the clause to the existing change-detector bullet, not as a new rule in `prompt-engineer.md`.

## F — eval spend

### F1 — ceiling, stop rule, partial results to disk, departures. Adopt now. Verification: Confirmed.

- This is the one proposal with a recorded failure in the library: the landscape sweep "stopped twice at Maunik's request (token cost) ... the results cache was lost with the container before synthesis" (`library-field-review-2026-10.md:329`). That was a research sweep, not an A/B, but the failure is the same: spend with no ceiling and results held only in memory.
- The source shows the departures field doing work: `pr-round-count-results.md:45-50` records that a first run's "raw output was deleted before that was noticed, so it could not be rescored".
- Cost: three short bullets in `EVALS.md`, which is not loaded in a normal session. No host dependence.
- Caution: `EVALS.md` has never been exercised. Each added field raises the bar for the first run. Keep these three and stop there.

### F2 — mandatory dry run, then pilot. Defer. Verification: Confirmed (source); host fit Probable.

- gstack's dry run uses a stub model inside its own harness (`eval-plan/SKILL.md:246`). The library's A/Bs are run by hand in Claude Code, Codex or Cursor; there is no stub model, and "the cheapest model" is not selectable the same way on every host.
- With 3 trials per arm plus the noise-floor runs, a priced pilot of one trial per arm is a third of the whole run. It protects large runs, which the library does not have yet.
- Trigger: the first A/B that passes its ceiling, or dies on a harness or check-command error after spend.

## G — "Lessons applied" line. Reject. Verification: Confirmed.

- No evidence in the source that the equivalent line changes outcomes; the gap check says so.
- The claim "A report with neither did not read the file" does not hold. An agent can write `none relevant` without opening the file. It is a self-report, and the library's own standard is "Trace metrics, never self-report" (`EVALS.md`).
- It adds a line to every completion report. It would live in `_shared/`, which an agent working from `AGENTS.md` alone never reads, and `AGENTS.md` has 100 bytes left.
- If reading LESSONS needs to be observable, check it from the transcript (a tool call that opened the file), in an eval or the optional stop hook. That is a different proposal.

## H — "pre-existing failure" needs a Baseline run. Adopt now only with the baseline test row; alone, Defer. Verification: Confirmed (source, gap); benefit Unverified.

- Evidence: `CLAUDE.md:437-446` in gstack, quote confirmed ("never claim 'not related to our changes' without proving it"). No measurement. There it covers paid E2E evals whose failures depend on prompt text; the transfer to ordinary test suites is by analogy.
- "Missing" is true: no rule in the library ties the word "pre-existing" to a run at Baseline.
- Alone it does not work. Without a suite run recorded at Baseline, proving the claim later needs a second checkout or a stash next to uncommitted work, which is the ask-first territory of `AGENTS.md:112`. And "treat the check as failing" then blocks every task in a repo whose suite is already red.
- The obra/superpowers review in this sweep already recommends a baseline test row (P-13, "Adopt now, amended"). With that row present, H costs one sentence: a failure is called pre-existing only by citing the Baseline row; with no row it is `Unverified: may be related to this change` and the check counts as failing.
- Placement: once in `rules-detail.md` beside the Baseline rule, plus the rationalization bullet in the two reviewer files. Not in `qa-engineer.md` Flaky Test Policy: a flaky test and a test red at Baseline are different things.
- If P-13 is not adopted, Defer. Trigger: a recorded case of a red check dismissed as unrelated and later traced to the change.

## Classifications in the gap check found wrong or overstated

- **#8, evidence line for Proposal D.** "both models caught the blocker in 80 of 80 trials" misreads the source. The two arms are with and without a requested verdict line, not two vendors. No cross-vendor measurement was found.
- **#12, Target 3.** "only instructs re-checking the listed findings" is overstated; the round 2+ prompt keeps the full-role and full-diff instructions. The ambiguity is real, the gap is not total.
- **#12, "best-evidenced rule".** The measured result supports the full re-review the library already has, not the receipt the proposal adds. It also rests on about 3 independent PRs and a reader without repository access.
- **#25.** "Areas not reviewed stays at line 1231" is true, but the report already opens with `## Scope Reviewed` as its third section. Partially covered is right; the size of the gap was overstated.
- **#5.** The calibration document was reported as unread evidence for A. Read: it measures hunk counts only and concludes per-hunk disposition is unworkable, which contradicts the drafted wording.
- **#26 "Already covered".** Closer to "not applicable". The library has no generated documents; the lint is a format check, not a freshness check. No proposal depends on this.
- No "Already covered" row was found to hide a real gap. Rows #1, #6, #9, #10, #13, #14, #16, #18, #20, #21, #24 and #31 were checked against the quoted library lines and hold.
- The seven rejections in the gap check (#3, #7, #11, #17 decay, #19, #30, #32) each do break a named hard constraint. Confirmed; none is reopened here.

<!-- END-OF-FILE -->
