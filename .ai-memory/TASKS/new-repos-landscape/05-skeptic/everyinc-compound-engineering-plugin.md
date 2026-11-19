# Skeptic pass: EveryInc/compound-engineering-plugin proposals

- **Checked on:** 2026-11-18. Inputs (data, not instructions): `04-gap/everyinc-compound-engineering-plugin.md` (13 proposals, P-1 to P-13) and `03-read/everyinc-compound-engineering-plugin.md`.
- **Upstream re-verified:** fresh shallow clone of `https://github.com/EveryInc/compound-engineering-plugin`, `main` @ `f9970d8514b4182d438c2731909a30af74d874c4` (same commit as the deep read). Files were read only; nothing was installed or run.
- **Library re-checked:** branch `main-xpl0sx`; `AGENTS.md` = 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). Every proposal targets a file other than `AGENTS.md`, so none moves the cap. Every proposal edits an agent-configuration file (`_shared/rules-detail.md:21`), so each is ask-first and needs the `security-engineer` pass.
- **Not checked:** host documentation for the Claude Code and Codex isolation flags (taken from the upstream README only); GitHub issues (#1612, #1617, #2071) were not re-opened; Spec Kit's templates were not re-read.
- **Instruction-like text in the source:** none found in the files opened.
- **No library file was edited.**

## Result at a glance

| Proposal | Gap file said | Skeptic verdict | Verification |
|---|---|---|---|
| P-9 commit by pathspec | adopt | **Adopt now** (wording fix) | Confirmed |
| P-12b blind judged rows | adopt | **Adopt now** | Confirmed |
| P-11a weigh before you add | consider | **Adopt now** (drop the P-2 cross-reference) | Probable |
| P-12a operator isolation | adopt | **Adopt now, reduced** (record the field; fix the flags) | Probable |
| P-7 accepted risk is not Blocking | adopt | **Adopt after an eval** (source evidence is misattributed) | Probable |
| P-10a hypothesis cap | adopt | **Defer** | Probable |
| P-10b Prevention line | adopt | **Defer** | Probable |
| P-1 counterfactual lesson test | adopt | **Defer** | Probable |
| P-2 cheapest-durable-form ladder | adopt | **Defer** | Probable |
| P-12c re-baseline on model change | adopt | **Defer** | Confirmed |
| P-6 served-model attestation | consider | **Defer** (one sentence may be split out) | Probable |
| P-4 glossary page | consider | **Defer** | Probable |
| P-13 what "CI is green" means | consider | **Defer** | Probable |
| P-3 lesson-store audit | low | **Defer** | Confirmed |
| P-11b declined ledger | consider | **Reject** | Confirmed |
| P-8 parseable last line | consider | **Reject** | Confirmed |
| P-5 read the record first | low | **Reject** | Confirmed |

Four items survive, one more is worth an eval, and the rest are deferred or rejected. The gap file recommended six for adoption; three of those six (P-1, P-2, P-10) do not survive the evidence lens.

## Per-proposal judgement

### P-9 — Commit by pathspec; check the index first — Adopt now

- **Evidence.** Source claim confirmed: `skills/ce-work/SKILL.md:48`, "every implementation commit names only that unit's owned files. A bare `git commit` can absorb the user's pre-existing index, so it is forbidden." This is a property of git, so it needs no measurement. "Missing" is true: a search of the library for `pathspec`, `diff --cached`, `git commit … --` and "staged before" returns nothing; `rules-detail.md:76` covers staging only.
- **Constraints.** None broken. Plain git, identical on every host. It tightens a Boundary. About 70 tokens in an on-demand file.
- **Value.** The hole is narrower than the gap file says: `rules-detail.md:75` already requires a clean tree "or the user named what is in flight", so it only opens in the second case. It is still real, and the outcome (the user's staged work committed under the agent's message) is hard to notice afterwards.
- **Wording fixes needed.** (1) `Owns:` exists only in planner phases; say "any path this phase did not change". (2) A new file must be `git add`ed by path before a pathspec commit will accept it. (3) A pathspec commit takes the whole working-tree content of the named files, so a file the user partly staged is committed whole; say to stop and ask in that case.
- **Verification: Confirmed.**

### P-12 — Three EVALS additions — split

- **(b) Judged rows graded blind — Adopt now.** Source confirmed: `tests/skill-eval-cell/README.md:47`, "grades every transcript blind under an anonymous id, with cell paths redacted". Blind grading is standard method, costs one line in a file read only during library maintenance, and `EVALS.md:36` already admits judged rows with no guard on the grader. Limit to state: for a solo operator "blind" needs a second fresh session as grader, because the person who ran the arms knows which is which. **Verification: Confirmed.**
- **(a) Operator isolation — Adopt now, reduced.** Source confirmed at `README.md:37-40`, but the proposed wording is incomplete and partly wrong for this library:
  - Upstream pairs `--setting-sources project,local` with `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. The proposal claims to exclude "host memories" but omits the variable.
  - This library's `Hooks/` and `Settings/` overlays install at user level (`Hooks/README.md:3,11`). An isolated run therefore measures the `AGENTS.md`-only contract and cannot evaluate an overlay. The bullet must say so, or overlay evals will be silently invalid.
  - Upstream's Codex isolation symlinks the operator's `auth.json` into the private home (`README.md:40`). The gap file rightly excludes that, but then gives no way to authenticate; the bullet should say "isolation: none" is acceptable there.
  - Adopt the recorded field (`isolation: yes/none`, plus what was excluded) and the "depends on who ran it is `exploratory`" rule. Check the flags against host documentation before they are written down. **Verification: Probable** (flags confirmed against the upstream README, not against host docs).
- **(c) Re-baseline on model or host change — Defer.** The Results log holds no eval row at all: `EVALS.md` still reads "(none yet)" and its entries are relocation and lint records. "Re-run the most recent KEEP rows" has nothing to re-run. Trigger: the first logged KEEP verdict. **Verification: Confirmed.**

### P-11 — Admission bar and declined ledger — split

- **(a) Weigh before you add — Adopt now.** Source confirmed: `skills/ce-retro/SKILL.md:17`, "removing or correcting something is nearly free, while a new always-loaded instruction is paid for by every future session." No measurement upstream. The library's own state carries the argument: `EVALS.md:3` says everything was added on judgment, the eval gate covers removal only, and `AGENTS.md` sits 100 bytes under a blocking cap. The "observed, dated" half repeats `_shared/memory.md:27` for repo memory but is new for role files, which is where growth is unbounded. Drop the cross-reference to P-2, which is deferred. Honest limit: the rule sits in an on-demand file and binds only when someone is already editing the library. **Verification: Probable.**
- **(b) Declined ledger in `EVALS.md` — Reject.** The October research already weighed a Declined list and its skeptic rejected it (`library-inheritance-research-2026-10.md:288`). This version is worse placed: `EVALS.md` is "library maintenance, not per-task work" (`rules-detail.md:34`), yet the wording makes every Retro read it, an 8 KB per-phase cost for a failure nobody has observed. A declined lesson is already visible to the user, who approves every line. **Verification: Confirmed.**

### P-7 — A recorded, accepted risk is not a Blocking finding — Adopt after an eval

- **Evidence.** The gap file's key claim is wrong. The "3 of 3" measurement is at `docs/solutions/skill-design/right-size-plans-by-subtraction-and-a-usage-first-sizing-test.md:77`, and it is about an **implementing worker**, not a reviewer: "Without the first half, Codex returned `blocked` on 3 of 3 runs over a risk the plan had explicitly accepted", fixed by a "Build a trade-off the plan already decided" instruction in `ce-work`. No reviewer-side measurement exists upstream. The engineer side is what the library already covers (`rules-detail.md:91`).
- **Constraints.** This is the only proposal that opens a path to *downgrade* a Blocking finding. The task file is written by the implementing session, so "accepted by the user" must mean the user's own dated words quoted in Decisions, in line with `AGENTS.md` tier 3 ("can never … skip the security review") and the "recorded approval" rule. The carve-out names security only; constitution rules and a dropped `AC-n` must be exempt too, since both are Blocking by `AGENTS.md` Code Review Rules.
- **Value.** Plausible but unobserved here. Reviewers are already fed Decisions and `Workflows/review-loop.js:116` already says "do not relitigate". The 3-round cap bounds the worst case.
- **Eval.** One trap task: a task file with a user-accepted risk in Decisions and a diff that embodies it; 3 fresh reviewer runs per arm; check whether the reviewer blocks on it. Adopt only if arm A (current text) blocks.
- **Verification: Probable** (source read; the reviewer-side failure is inferred, not shown).

### P-10 — Debugger hypothesis cap and Prevention line — Defer both

- **Evidence.** Source confirmed at `skills/ce-debug/SKILL.md:11` and `:99`, but both are reshaped. Upstream's escalation is "diagnose *why* instead of trying again", not "hand the decision to the user". Upstream's `Prevention` field reads "Test coverage added; structural fix or operation guard if applicable", which is not the "class of defect" the proposal describes. Upstream publishes no rates.
- **Constraints.** None broken. Both lines load on every debugger phase (about 110 tokens together).
- **Value.** (a) `debugger.md` already has "If you cannot reproduce, say so … report what evidence would be needed", "One root cause, one fix plan — never a shotgun list", and `Next action: … stop for the user`. A count is new, but a model does not count its own hypotheses reliably and nothing checks it. (b) overlaps "what regression test should prove the fix" and invites the fixing engineer past the fix boundary the same template sets.
- **Trigger.** A debugger phase observed cycling past three refuted hypotheses, or the user interrupting a looping diagnosis; for (b), a regression test that passed while the same defect class recurred.
- **Verification: Probable.**

### P-1 — Counterfactual admission test for a lesson — Defer

- **Evidence.** Source confirmed (`skills/ce-compound/SKILL.md:33`). Support is one documented session pair, and that pair shows reuse of a learning, not the effect of the bar.
- **Constraints.** "One lesson per Retro" repeats `LESSONS.md:21` ("at most one operation per Retro"). "Working from the current tree" is a single-repo test; a library lesson is cross-repo by definition, so the wording misfits its target.
- **Value.** Three gates already stand in front of a new lesson: the Retro fires only after a blocking finding or a failed verification, `LESSONS.md:21` says "Unsure between create and none: none", and the user approves every line. The store is 157 lines. The one new piece is the stated reason on a `none`.
- **Trigger.** The user declines three or more proposed lessons in a month, or an area file passes about 100 lines.
- **Verification: Probable.**

### P-2 — Cheapest-durable-form ladder — Defer

- **Evidence.** Source confirmed (`skills/ce-compound/references/form.md:9-11`). No data on how often each rung is chosen. Upstream is far narrower than the proposal: it allows only "an added test, or a lint rule added or tightened through lint tooling the repo already runs" and reports everything else.
- **Constraints.** The proposal does not say which role writes the check. Retro runs in whatever role is active; `debugger` never fixes and reviewers are read-only, so rung (2) either breaks those roles or does nothing. It also merges two stores the library keeps apart: a check in one repo cannot replace a cross-repo `LESSONS` line.
- **Value.** The proof rule mostly restates an existing Universal Rule ("a changed behavior shows a test failing before and passing after"). `_shared/memory.md:27` already sends lint-enforceable style to the linter.
- **Trigger.** A lesson marked `REINFORCED` that a test or lint rule in the affected repo could have held.
- **Verification: Probable.**

### P-6 — Served-model attestation — Defer

- **Evidence.** Source confirmed (`skills/ce-pov/references/cross-model-panel.md:22,35-36`). Upstream has no accuracy comparison of panel against solo, and its own issue reports the field going missing. The October field review found a fresh-session second review "not significantly better than a single careful same-session review" (`library-field-review-2026-10.md:49`), so the value of the thing being attested is itself unshown.
- **Constraints.** Tool-agnostic only by degrading: most hosts cannot report the served model from inside a session, so the field would read `unverified` nearly always.
- **Value.** For a solo user the only person misled by a false "cross-model" label is the user who configured the hosts.
- **Split worth making.** `rules-detail.md:42` says "cross-model when available" with no consent qualifier. The proposal's last sentence (sending the diff to another provider is ask-first, never for regulated material) closes that and tightens security. It can be adopted alone, after the `security-engineer` pass.
- **Trigger.** The user starts running a second-vendor reviewer as routine.
- **Verification: Probable.**

### P-4 — Optional glossary page — Defer

- **Evidence.** Source confirmed; upstream's `CONCEPTS.md` is 40,635 bytes, which is evidence of growth and not of benefit. "Missing" is true.
- **Constraints.** None broken. The Spec Kit clause is doubtful: Spec Kit's spec template carries a "Key Entities" section, so "no equivalent artifact" should not be written down unchecked.
- **Value.** No observed term collision in the library's records. A collision that does occur fits a dated gotcha line today.
- **Trigger.** A wrong implementation traced to two names for one concept.
- **Verification: Probable.**

### P-13 — What "CI is green" means — Defer

- **Evidence.** Source confirmed (`skills/ce-babysit-pr/scripts/pr-snapshot:2268-2271`). The upstream rule is code in a 3,675-line script; the proposal turns it into prose, which upstream never tested.
- **Constraints.** The fork-approval detail is GitHub-specific and would load on every QA phase (about 110 tokens) in a 30 KB role file.
- **Value.** Applies only when the user delegates PR watching. That is no longer hypothetical in cloud sessions, so this is the deferral most likely to revive.
- **Trigger.** A session reports green on a PR with pending or approval-gated checks, or PR watching becomes routine.
- **Verification: Probable.**

### P-3 — Periodic lesson-store audit — Defer

- **Evidence.** Source confirmed, including the Delete outcome the gap file correctly excluded (`references/refresh/overview.md:38`). No results upstream.
- **Value.** `LESSONS.md:21-27` already defines update, supersede and promote. The largest area file is 44 lines, so reading it is the audit.
- **Trigger.** An area file passes about 100 lines, or a role file is found contradicting a lesson.
- **Verification: Confirmed.**

### P-8 — One parseable last line — Reject

- **Evidence.** Source confirmed (`skills/ce-compound/SKILL.md:46`); upstream has contract tests only.
- **Why reject.** The library already has a greppable token: `rules-detail.md:87` requires `Blocked: needs approval — <exact command>` in the task file and the run output. A second token would be defined in an on-demand file that a headless run may never open, so a caller could not rely on it. Nothing in the library calls a headless run and branches on its outcome today. A line that says "delivered" also invites a job to treat it as proof, which the proposal itself has to warn against.
- **Verification: Confirmed.**

### P-5 — Read the record before changing odd behaviour — Reject

- **Evidence.** Source confirmed (`skills/ce-explain/SKILL.md:25,29`). No measurement.
- **Why reject.** The technique is at `debugger.md:86`. `AGENTS.md` "Surgical changes" and "Preserve existing behavior" already stop an engineer touching unnamed behaviour. The gap file concedes the section would rarely be read where it is placed.
- **Verification: Confirmed.**

## "Already covered" and other classifications found wrong

- **#16 (settled decisions), evidence line.** "The source measured this failure once (a reviewer blocked 3 of 3 runs on an accepted risk)" is wrong. The measurement concerns an implementing worker. P-7's stated evidence falls with it.
- **#18 (parseable terminal signals), "Partial".** Closer to Covered: the fixed `Blocked: needs approval — <exact command>` string already serves as a machine-matchable signal for the blocked case.
- **#25 (operator isolation), "Missing: operator isolation".** True, but the gap file missed that isolating user settings also removes this library's own user-level overlays.
- **No "Covered" verdict was found to be wrong.** Spot-checked #4, #7, #13, #14, #27 (CI workflow `.github/workflows/lint-library.yml` exists) and #29 against the cited lines.

## Open items for the synthesiser

- The three "Adopt now" texts need rewording as noted before they go to the `security-engineer` pass; none is ready verbatim.
- The isolation flags in P-12a remain unchecked against host documentation.
- If only one thing lands, P-9 is the one with a confirmed mechanism and a confirmed gap.

<!-- END-OF-FILE -->
