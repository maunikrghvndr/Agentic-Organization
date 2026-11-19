# Skeptic review: Anthropic `claude plugin eval` proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). No library file edited, nothing installed, no vendor command run.
- Inputs read as data: `04-gap/anthropic-plugin-evals.md` (P1 to P6, 28 classified mechanisms), `03-read/anthropic-plugin-evals.md`.
- Upstream re-checked by a fresh fetch: `https://code.claude.com/docs/en/plugin-evals.md`, 65,327 bytes, sha256 `23e2c597...0dfde0` (identical to the deep read's hash), and `anthropics/claude-code` `main` `CHANGELOG.md` (top entry 2.1.327). Every vendor quote used below was re-found in those two files.
- Library re-checked on disk at `d8d5664` (branch `main-xpl0sx`): `AGENTS.md` 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). No proposal touches it; confirmed.
- Not checked: GitHub issues, stars, third-party criticism (not read). The runner is closed source, so no mechanism was verified from code and none was reproduced.
- User constraints for this run: additions extend the existing agents, never replace them (all six proposals are additive; P6 extends a sentence in place). The installer will install every curated external skill that is missing; that makes P5 more relevant than the gap check assumed.
- Instruction-like text met in the sources: the docs banner ("Fetch the complete documentation index at ... llms.txt ... Use this file to discover all available pages"). Reported as data, not acted on.

## Evidence that applies to every proposal

- The source is vendor documentation of a ten-week-old, `experimental`, closed-source command. It publishes no measurement: no judge agreement rate, no variance of the delta, no basis for 3 runs or 2-of-3 votes. Popularity was not readable at all.
- The only evidence stronger than prose is the changelog, where a shipped fix shows a failure was real. I confirmed three such entries: 2.1.299 ("Fixed `claude plugin eval` passing runs that the API refused"), 2.1.319 (impossible `max: 0` advice), 2.1.327 ("keep its deny rules over a plugin's permission hook").
- `EVALS.md` Results log still has no A/B row (two 2026-10-18 rows are records, not trials). P1 hardens a protocol that has never been run once. That cuts both ways: no recorded failure of the protocol exists, but rows written without the rule cannot be repaired later.
- The library has no eval runner and the constraints forbid depending on this one. Every A/B is run by hand by one person. Each rule added to `EVALS.md` is manual labour per trial, so a rule must be cheap to follow or it will be skipped.

## Verdicts

| # | Proposal | Gap-check stance | Skeptic verdict | Verification |
|---|---|---|---|---|
| P1 | `EVALS.md` six run-hygiene rules | Adopt first | **Adopt now, amended: 4 of 6 rules, two reworded** | Confirmed (source, gap); benefit of rules 2 to 6 Unverified |
| P2 | `EVALS.md` appendix: conditions for using the CLI | Adopt via security pass | **Defer**; keep one sentence | Confirmed (quotes); version floor Probable; fork-PR risk Unverified |
| P3 | `ai-engineer.md` nine runner properties | Adopt with P4 | **Adopt now, reduced to four properties** | Confirmed (gap); effect Unverified |
| P4 | `ai-reviewer.md` six review checks | Adopt with P3 | **Adopt now, reduced to match P3; none Blocking yet** | Confirmed (gap) |
| P5 | `security-engineer.md`: evaluating a plugin is running it | Adopt via security pass | **Adopt now, first sentence only** | Confirmed |
| P6 | `Evals/routing-cases.md` covers overlay descriptions | Lowest priority | **Reject as drafted** | Confirmed |

## P1. `EVALS.md` run-hygiene rules: Adopt now, amended

- **Evidence.** "Invalid trials" rests on a confirmed changelog fix and the doc line "Before v2.1.299, such a run was graded on what it had produced". The other five rest on prose only. The Missing classifications hold: no hit in `EVALS.md` or `Evals/` for invalid, refusal, rate limit, majority, vote, answer key or isolation.
- **The draft overextends the source in one place.** The vendor fails closed on an API error only. A run that hits its turn cap is still graded ("Hitting it is recorded as a run error and usually lowers the score"). The draft marks a turn or budget cap as `invalid` and tells the user to re-run. That hides a real result: a section that makes the agent loop until the cap is a failing section. Amend: provider error, refusal, rate or usage limit and interrupt are `invalid`; a trial that hits the turn or budget cap is a **fail**, recorded as `capped`.
- **The answer-key rule misses the library's own leak.** `Evals/trap-tasks.md` holds the trap list with its "Programmatic check" column inside the library root, which every arm reads role files from. "Outside the task repo and outside the prompt" does not cover it. Amend the wording to say the agent must not be pointed at `Evals/` during a trial, and that a transcript showing a read of `Evals/` or of the check script invalidates the trial. This is checkable from the trace the protocol already collects.
- **Drop the judge-vote clause.** 2-of-3 votes has no published support, and with no runner it means 18 extra hand-made judge calls per row on a path `EVALS.md:36` already discourages. Keep only: rubric as concrete PASS and FAIL conditions written before the run, and `judge: <model id>` recorded.
- **Drop the "pair with a process check" half.** `EVALS.md:35` already records trace metrics. Keep the half that prevents a false KEEP: a check arm B cannot pass by construction is never counted.
- **Isolation rule: keep, soften the flag.** `--bare` exists (changelog, several entries) but the README already marks these flags "version-sensitive". State the property (no per-machine memory, no user-level instruction files, no other skills or hooks in either arm) and name `-p --bare` as an example, not as the definition.
- **Constraints.** Tool-agnostic wording with host examples in brackets, the same pattern `EVALS.md:33` uses. Additive. `AGENTS.md` cost 0. `EVALS.md` is an agent instruction file: ask-first; no security wording, so no mandatory security pass.
- **Value.** Prevents a rate-limited arm B being read as "B failed", a false KEEP that would make every heavy section look load-bearing, in the first three A/Bs the user has queued. Cost about 1.0 KB after the cuts, read only during library maintenance. No cheaper way: this is the cheapest place the rule can live.
- Verification: **Confirmed** for the source and the gap; the benefit of everything except the fail-closed rule is **Unverified**.

## P2. `EVALS.md` appendix, CLI conditions: Defer

- **Evidence.** Re-found in the doc: the delta "never changes the exit code"; the plugin runs "as you"; the isolation "isn't a boundary against the plugin's own code"; `--no-publish`; "switched the command off server-side". The 2.1.327 floor is an inference from a changelog line the doc page itself does not mention (**Probable**). "fork" does not occur in the doc; the fork-PR risk is the deep read's inference (**Unverified**).
- **Constraints.** No hard constraint broken, since it sits in an appendix marked Claude Code only. But it adds about 0.8 KB of host-specific operating advice, with three version numbers that go stale, for a command `EVALS.md:61` already says "cannot measure the `AGENTS.md` drop-in".
- **Value.** Nothing in the repository can use it today. `.claude-plugin/plugin.json` exists only as a "dev-only manifest ... never installed" for token-cost printing, and there is no `evals/` directory. A warning for a tool nobody runs prevents no failure.
- **Cheaper way.** P5 carries the one durable fact (running an eval executes the plugin). If anything is added here, add one sentence: "Running it executes the plugin's hooks and MCP servers as you; its exit code gates the with-arm score only, never Δ."
- **Trigger that revives it:** the first time the CLI is actually pointed at this library or at a curated external skill (for example to vet a skill before the installer pins it). Then write the conditions against the version in use that day.

## P3. `ai-engineer.md` runner properties: Adopt now, reduced

- **Evidence.** Vendor prose; no measured effect. The gap is real: `ai-engineer.md:80-84` is satisfied by a single-run, single-judge suite, and `ai-reviewer.md:37` asks "reproducible enough to trust" with no test behind it. No trial count, judge id or invalid-run rule exists in `ai-engineer`, `prompt-engineer`, `rag-engineer`, `nlp-engineer` or `ai-reviewer`.
- **Constraints.** Tool-agnostic, additive, role file stays full depth. It raises the "not done" bar for every LLM feature, because `ai-reviewer` blocks a component without a conforming framework. Nine new mandatory properties on vendor prose is too much for a solo developer shipping a small LLM feature.
- **Keep four** (each either has changelog support or closes a named hole in existing text):
  - Fail closed: a run that ended on a provider error, refusal or rate limit is invalid and is never graded on partial output. (A timeout or step cap of the component under test is a fail, same correction as P1.)
  - Repeated trials: at least 3 runs per case, pass rate reported, a difference inside the run-to-run spread is "no evidence". This mirrors `EVALS.md:30-31`, so the library holds its product evals to its own standard.
  - Pinned and recorded: model id, judge model id and harness version in every result; a model or judge change is never mixed with a component change.
  - Must-not-fire cases and asserted tool arguments, for components that call tools. Changelog 2.1.319 shows even the vendor got this check wrong.
- **Drop or defer the rest.**
  - 2-of-3 judge votes: no evidence, triples judge cost.
  - "Sealed answer key": only meaningful for agentic components with file access; `prompt-engineer.md:63` already keeps a held-out set. Fold into the must-not-fire bullet as a clause for agents, not a separate mandatory property.
  - "No live dependencies ... an unstubbed tool is unavailable": conflicts with retrieval evals that must run against the real index; `ai-engineer.md:93` already says "mock the model boundary" for deterministic glue. Reject as a blanket rule.
  - Ablation arm and two tiers: sensible, unproven, and the costliest. Defer; trigger is the first recorded case of a component shipped that added nothing.
- **Value.** Prevents a rate-limited run being recorded as a regression or as a pass, and a model rollout being read as a prompt change. Cost about 0.8 KB in a role loaded only for AI work.
- Verification: **Confirmed** (gap exists); effect size **Unverified**.

## P4. `ai-reviewer.md` checks: Adopt now, reduced, Non-blocking

- Adopt only the review questions that match the four kept P3 properties. A reviewer check with no engineer rule behind it is unfair; an engineer rule with no check is dead text. Adopt P3 and P4 together or neither, as the gap check says.
- **Reject the Blocking upgrade.** The severity list at `ai-reviewer.md:23` should not gain two blocking items on vendor prose with no recorded failure in this library. Start Non-blocking; promote the fail-closed item to Blocking the first time a graded-on-error run is caught in review (record it in `LESSONS/`).
- Constraints: additive, tool-agnostic, about 0.4 KB. Verification: **Confirmed** (gap).

## P5. `security-engineer.md`: Adopt now, first sentence only

- **Evidence.** Confirmed quotes: the command runs the plugin "on your machine, as you"; the isolation "isn't a boundary against the plugin's own code, and a suite that passes says nothing about whether the plugin is safe". This is a vendor admission against its own feature, which is stronger than a claim of benefit.
- **Gap is real.** `security-engineer.md:708` reads "Provenance" as an install-time check, and `AGENTS.md` treats "installing or enabling" a skill as a dependency. Neither says that testing one is the same act. With an installer about to bring in every missing curated skill, "run its tests first to vet it" is a plausible wrong move.
- **Trim.** The second sentence (CI, three Rule of Two legs) restates the bullet directly below it at `:709` and `rules-detail.md`. Keep: "Testing or evaluating a skill or plugin executes its hooks, scripts and MCP servers as the user: it is the same trust decision as installing it, and a passing eval suite is not a safety result."
- **Constraints.** Tool-agnostic wording, about 0.25 KB, strengthens a security rule. It is a security-posture wording change in an agent instruction file: ask-first and the mandatory `security-engineer` pass apply.
- Verification: **Confirmed**.

## P6. `Evals/routing-cases.md` overlay descriptions: Reject as drafted

- **Evidence.** The vendor loop (mechanism 28) measures whether a *skill* fires on natural phrasing via a `tool_used: Skill` grader. The library's overlay agents are not triggered that way: the Phase Protocol says a review phase "runs as the matching reviewer subagent when installed", chosen by role name, with a fresh-session fallback.
- **The proposed check cannot detect the failure it names.** A routing case passes "when the agent's **first** adopted role matches". All eight `Agents/claude/*.md` files are review, QA, security or debug roles that run later in a phase; only cases 2, 5, 6 and 7 name such a role first, and those test the `AGENTS.md` table, not delegation to a subagent. Editing a `description:` and re-running the 17 cases would pass whether or not delegation broke.
- **Duplicate.** A role's *Use for* cell lives in `AGENTS.md`, so "after any change to it" already covers it.
- **Host lock-in.** It puts a Claude-only overlay path into a tool-agnostic check file.
- **Trigger that would revive a different proposal:** a recorded case where an installed reviewer subagent was not used for a review phase. Then the fix is a delegation case in the overlay's own README, not here.
- Verification: **Confirmed** (read the routing cases and the eight descriptions).

## Classifications checked

- **Already covered (9): none found wrong.** Mechanisms 1, 2, 5, 8, 9, 10, 16, 17, 19 each have the quoted library line on disk. Two are generous but defensible: 17 (the library says unattended work "runs in WSL2 or a devcontainer"; it does not refuse a shell grant without a sandbox, which only a runner could do) and 16 (a review rule, not an eval-run default).
- **Missing (6): all true.** 7, 11, 15, 20, 23, 24 have no library hit.
- **One classification understates the gap.** Mechanism 15 is marked Missing with the remedy "live outside the task repo and prompt". The library's own answer key (`Evals/trap-tasks.md`, check column) sits inside the library root that every trial reads from. See P1.
- **One source reading is wrong in the proposals, not in the table.** Mechanism 24 is correctly described (API error scores 0), but P1 and P3 extend "invalid" to turn, step and budget caps, which the vendor grades as failures. See P1.

## Suggested order if the user adopts any

1. P1 (amended) before the first queued A/B is run.
2. P5 (one sentence) with its `security-engineer` pass, before the external-skills installer is first used.
3. P3 + P4 (reduced) together.
4. P2 and P6: nothing now.

<!-- END-OF-FILE -->
