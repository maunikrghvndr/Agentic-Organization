# Gap check: Anthropic `claude plugin eval` vs the Agentic-Organization library

- **Date:** 2026-11-18. Role: `researcher` (gap check, read-only on the library). Input: `.ai-memory/TASKS/new-repos-landscape/03-read/anthropic-plugin-evals.md` (treated as data).
- **Library state checked:** branch `main-xpl0sx`; `AGENTS.md` = 32,668 B / 194 lines (headroom 100 B / 6 lines); `EVALS.md` = 8,167 B.
- **Method:** `rg` over the library (excluding `.ai-memory/`), then the matching lines read. Nothing installed, nothing run, no library file edited.
- **Prior research not repeated:** `library-field-review-2026-10.md:61` already summarised the command and produced F21 (EVALS.md run fields), which is implemented at `EVALS.md:25-41` and `EVALS.md:59-61`. This file only covers what F21 left open.
- **Instruction-like text:** none new. The deep read reports the docs banner ("Fetch the complete documentation index at ... llms.txt") as data; not acted on here.
- **Evidence caveat carried from the deep read:** every mechanism is vendor prose (closed source, no measurements). "Changelog" below means a shipped fix shows the failure was real. No proposal here rests on a measured effect size.

## Headline

- The **tool itself** cannot be adopted as the library's protocol: it conflicts with *tool-agnostic*, *no plugin dependency* and *works from AGENTS.md alone*, and it does not load `AGENTS.md`/`CLAUDE.md` in a run. `EVALS.md:61` already says exactly this: "It cannot measure the `AGENTS.md` drop-in and it ablates a whole plugin, not one section, so it is an optional cross-check for a packaged role, never the protocol above." No change to that verdict.
- The **ideas** split two ways: (a) the library's own A/B protocol (`EVALS.md`), already ahead of the tool on statistics (pass^3, noise floor, self-report ban, code checks) but missing five hygiene rules; (b) the eval-framework standard the AI roles impose on product code (`ai-engineer.md:76-86`, `ai-reviewer.md:32-38`), which is generic and lacks the same rules.
- 28 mechanisms: **9 Already covered, 13 Partially covered, 6 Missing, 0 Conflict as an idea** (adopting the CLI as a required gate would conflict; see row 0).
- **6 proposals, 0 bytes in `AGENTS.md`.** All are ask-first (library role files / EVALS.md are agent instruction files); P2 and P5 change security wording and need the `security-engineer` pass.

## Table: every mechanism

| # | Mechanism | Classification | Library evidence (path:line, quote) | Gap / action |
|---|---|---|---|---|
| 0 | The CLI as the library's eval runner or CI gate | **Conflicts** (tool-agnostic; no plugin dependency; works from AGENTS.md alone) | `EVALS.md:61` "an optional cross-check for a packaged role, never the protocol above" | Keep as appendix only. Vendor can switch it off server-side (deep read W13). |
| 1 | With/without ablation | **Already covered** (library A/B); Partial for product evals | `EVALS.md:17-19` "Run it **two ways, in fresh sessions, changing only one thing:** A = with the role/section as-is. B = without it"; `ai-engineer.md:84` "Recorded results against a baseline" (baseline = previous version, not "component off") | P3/P4 adds the "without the component" arm for product evals. |
| 2 | Repeated runs, mean score | **Already covered** (stricter); Partial for product evals | `EVALS.md:30` "at least **3 per arm**, each in a fresh session, reported as pass^3 (all three pass) — not best-of-3"; `EVALS.md:31` noise floor; `ai-reviewer.md:38` "reproducible enough to trust (given nondeterminism...)" names no trial count | P3/P4. |
| 3 | Threshold gate with exit code | **Partially covered** | `EVALS.md:35` "the pre-registered check run as a command with its exit code"; `mlops-engineer.md:51` "a regression blocks promotion"; `ai-engineer.md:84` "a regression blocks" | No numeric gate for the library's own A/B, by design (`rules-detail.md:34` "library-maintenance, not per-task work"). Not proposed. The with-arm-only caveat goes into P2. |
| 4 | Cost ceiling | **Partially covered** | `README/ORCHESTRATION_README.md:144` "`--max-turns 40 --max-budget-usd 5`"; `ai-engineer.md:52` "token budgets, max steps for agents"; `EVALS.md:33` records cost, sets no cap | P1 (cap per trial; a capped-out trial is invalid, not a fail). |
| 5 | Pinned agent model | **Already covered** | `EVALS.md:20` "Keep task, repo, and model identical"; `EVALS.md:29` "**model id** (exact, e.g. `claude-opus-5-5`), **effort** level" | None. |
| 6 | Separate, named judge model | **Partially covered** | `EVALS.md:36` "a judged pass/fail only when no mechanical check exists, and then labelled `judged`"; `ai-engineer.md:83` "an LLM-judge on a fixed rubric only where human-like judgment is genuinely required" | Judge model id is never recorded; a judge change is a confound. P1, P3/P4. |
| 7 | Three-vote judge majority | **Missing** | no hit for `majority`/`vote` in an eval context | Cheap; one clause in P1/P3/P4. Evidence: none published. |
| 8 | Six fixed grader types, no code graders | **Already covered** (library is stronger) | `EVALS.md:36` "a marker, an on-disk artifact or a test/lint exit code wherever one can be defined"; `Evals/trap-tasks.md:5` column "Programmatic check (pass = exit 0)" | Do not adopt the no-code restriction (deep read W6). |
| 9 | Grader targets (reply / trace / files / file content) | **Already covered** | `Evals/trap-tasks.md:3` "pass/fail is observable in the diff or by a command, never by the agent's own report"; `EVALS.md:35` "tool-error and retry counts from the transcript" | None. |
| 10 | Must-not-trigger check | **Already covered** (routing); Partial for product evals | `Evals/routing-cases.md:3` "the last case is the negative test — a trivial fix must **not** trigger the analyst grill"; `:23` case 17; `EVALS.md:49` | Product eval sets ask for "adversarial" cases but not "must not call the tool". P3/P4. |
| 11 | Process-only checks excluded from the delta | **Missing** | none | Real hole in the A/B: a check such as "the task file cites the section" cannot pass in arm B and fakes a KEEP. P1. |
| 12 | Outcome + process grader pairing | **Partially covered** | `EVALS.md:35` trace metrics beside the check; `ai-engineer.md:82` "task success ... tool-call correctness" (listed, not paired) | P1, P3/P4. |
| 13 | Stable-signal authoring rules | **Partially covered** | `EVALS.md:36` mechanical first; `EVALS.md:35` "A verdict quoting the agent's own 'tests passed' is an anecdote" (stricter than the doc's "have the prompt write the outcome to a file") | Missing: concrete PASS/FAIL rubric, judge only short outputs. P1 clause. Do **not** adopt the write-outcome-to-a-file trick; it is self-report. |
| 14 | Run isolation (no user settings, memory, other plugins) | **Partially covered** | `EVALS.md:17` "in fresh sessions"; `README/ORCHESTRATION_README.md:141` "`claude -p --bare`" | Nothing says both arms must exclude host per-machine memory, user-level instruction files and other skills. `AGENTS.md:156` names that memory as a third store, so it can carry the "removed" section into arm B. P1. |
| 15 | Case definitions hidden from the agent | **Missing** | none (`prompt-engineer.md:63` "keep a held-out set" is about overfitting, not about the agent reading the check) | Trap checks and success criteria must live outside the task repo and prompt. P1, P3/P4. |
| 16 | Default-deny tools, explicit grants | **Already covered** (general, not eval-specific) | `security-engineer.md:708` "`allowed-tools`/`disallowedTools` as narrow as the job"; `ai-reviewer.md:23` blocks "agent with unbounded steps/budget/tools or excessive privileges"; `Settings/claude-baseline.settings.json` | None. |
| 17 | Mandatory OS sandbox for shell grants | **Already covered** | `AGENTS.md:78` "native Windows has no agent sandbox (as of 2026-10): unattended work runs in WSL2 or a devcontainer"; `Settings/README.md:26`; `rules-detail.md:30` | None. |
| 18 | Trust decision before loading a plugin; `--trust-plugin` | **Partially covered** | `security-engineer.md:708` "Provenance"; `:713` block "an MCP server or skill of unknown provenance"; `devops-engineer.md:83` "Fork PRs must not access secrets" | Missing: *evaluating* a plugin executes it, as the user. P5. |
| 19 | Opt-in scaffold script (repeatable fixture) | **Already covered** by other means | `EVALS.md:29` "**task repo + commit** the task ran against" | Fixture = pinned repo@commit; no script needed. Unsandboxed-scaffold risk noted in P2. |
| 20 | Transcript resume (`history_file`) | **Missing** | none | Host-specific `.jsonl`; the tool-agnostic equivalent already exists as the Handoff contract (fresh session + task file). Not proposed. |
| 21 | Fixed MCP/tool mocks | **Partially covered** | `LESSONS.md:54` "gate it behind tests/fixtures only" (mock data stays out of production); no rule that an eval stubs external tools | P3/P4 clause. |
| 22 | Mock input assertions | **Partially covered** | `ai-engineer.md:82` "tool-call correctness" | P3/P4 clause (assert the arguments, not only that the call happened). |
| 23 | Agent mocks with record/replay | **Missing** | none | Low value, no evidence; folded into P3/P4 as "recorded and committed" only. |
| 24 | API-error / refused runs fail closed | **Missing** | nearest kin: `LESSONS/tooling-agent-workflow.md:13` "Never judge a long-running job by a PIPED exit code"; `Evals/trap-tasks.md:7` trap 1 (empty scope reads PASS) | Strongest evidence in the deep read (Changelog 2.1.299: such runs used to be graded). P1, P3/P4. |
| 25 | Git hooks / credential helpers off per run | **Partially covered** | `rules-detail.md:24` lists tracked hook dirs and `core.hooksPath` as agent configuration; `security-engineer.md:706` | Classified as config to review, not neutralised at run time. Rule of Two already bounds the unattended case. Not proposed. |
| 26 | Partial-result flags, trend hygiene | **Partially covered** | `EVALS.md:29` "**host + version**"; `EVALS.md:30` "A single trial per arm is logged as `exploratory`, never as a verdict" | No rule for an interrupted or capped run. P1 (same line as 24). |
| 27 | Tag/glob selection, tiered suites | **Partially covered** | `ai-engineer.md:83` "runnable on demand and in regression"; `qa-engineer.md:50` "Smoke tests" | P3/P4 clause: deterministic checks on every change, judged checks before release. |
| 28 | Trigger-rate loop for descriptions | **Partially covered** | `Evals/routing-cases.md:3` "Use these to check `AGENTS.md` → Routing after any change to it"; `EVALS.md:11` "When a rule keeps failing to fire" | The `description:` field of the `Agents/claude/*.md` overlays also drives delegation and has no check. P6. |

## Proposals

All wording is a draft for the user to approve; none is applied. Byte cost in `AGENTS.md` is **0** for every proposal (it has 100 B of headroom, so nothing goes there).

### P1. `EVALS.md`: five run-hygiene rules (mechanisms 4, 6, 7, 11, 12, 13, 14, 15, 24, 26)

- **Target:** `EVALS.md`, section "What every run records", inserted after line 37 (the "Trap tasks" bullet) and before the "Row format" line. The protocol core (lines 13-23) stays verbatim.
- **Proposed wording:**

```markdown
- **Invalid trials fail closed (added 2026-11, plugin-eval changelog 2.1.299):** a trial that ended on a provider error, a refusal, a rate or usage limit, a turn or budget cap, or an interrupt is `invalid` — never graded on what it had produced, never counted as pass or fail. Re-run it; a row with fewer than 3 valid trials in either arm is `exploratory`.
- **Cap every trial:** the same turn and budget cap on both arms (Claude Code `--max-turns`, `--max-budget-usd`; Codex: the job timeout), recorded in the row.
- **Isolate both arms identically:** no host per-machine memory, no user-level instruction files, no other skills, plugins or hooks in either arm (Claude Code: `-p --bare`); otherwise the "removed" section can re-enter arm B from memory. Record how isolation was done; `not isolated` makes the row `exploratory`.
- **Keep the answer key out of reach:** the success check, the trap list and the other arm's output live outside the task repo and outside the prompt. A check the agent could read is not a check.
- **Outcome check plus process check:** pair the pre-registered outcome check with one process check from the transcript (role file read, rule cited, tool called). A process check that arm B cannot pass by construction is reported but never counted in the verdict — it only inflates the delta.
- **Judged checks:** rubric written as concrete PASS and FAIL conditions before the run; short outputs only; a fixed judge model, never the model under test's own session, at least 2 of 3 votes; record `judge: <model id>`. A judge change is a variable — do not compare rows across it.
```

  Row format (line 41): append ` — valid trials A/B — judge: <id or none>` after `trials: A pass^3 / B pass^3`.
- **Cost:** about 1.6 KB in `EVALS.md` (read only for library maintenance, not always-on). `AGENTS.md`: 0 B.
- **Lost by not adopting:** (1) a rate-limited or refused arm-B trial is read as "B failed" and yields a false KEEP, the exact bug the vendor shipped and fixed in 2.1.299; (2) the first three A/Bs (`EVALS.md:45-47`) can be contaminated by auto memory holding the section under test; (3) "rule was cited" checks make every section look load-bearing.
- **Evidence strength:** rule 1 Changelog; rules 2-6 vendor prose only. The 2-of-3 vote has no published agreement figure; it is included because it costs two extra short calls on a path the library already discourages.

### P2. `EVALS.md` appendix: conditions for using the CLI at all (mechanisms 0, 3, 16, 18, 19; deep read section 5)

- **Target:** `EVALS.md:61`, appended to the existing appendix paragraph (no text removed).
- **Proposed wording:**

```markdown
If used: Claude Code ≥ 2.1.327 (earlier versions graded API-refused runs, 2.1.299; let a plugin's permission hook override the eval's deny rules, 2.1.327; left git hooks on with git < 2.31, 2.1.283). Its exit code gates the with-arm score only — Δ never fails a build, so read `aggregates.meanDelta` yourself. Running it executes the plugin's hooks and MCP servers as you, outside the sandbox; a passing suite says nothing about safety. Pass `--no-publish` (the HTML report with prompts and transcripts is otherwise uploaded as a private artifact on subscription sign-ins). Never `--trust-plugin` or `--scaffold` on a fork PR or any plugin you did not write (Rule of Two). The manifest key is `experimental.evals` and the vendor can switch the command off server-side: never a required gate.
```

- **Cost:** about 0.8 KB in `EVALS.md`. `AGENTS.md`: 0 B. Needs the `security-engineer` pass (it recommends flags and a version floor).
- **Lost by not adopting:** the appendix currently invites use with no version floor and no warning that the eval run is itself code execution with credentials in the environment.
- **Caveat:** the fork-PR risk is the deep read's inference from documented behaviour, marked Unverified there; version numbers are from the vendor changelog, not reproduced.

### P3. `ai-engineer.md`: make the mandatory evaluation framework specific (mechanisms 1, 2, 6, 7, 10, 12, 15, 21, 22, 23, 24, 27)

- **Target:** `EngineeringTeam/ai-engineer.md`, inserted after line 84 ("**Recorded results against a baseline**...") and before line 86 ("Document it: ..."). Additive; the four existing bullets stay.
- **Proposed wording:**

```markdown
The runner must also hold these properties (each one is a recorded failure mode of real eval harnesses):

- **Repeated trials.** Each case runs at least 3 times; report the pass rate per case, not one run. A before/after difference smaller than the run-to-run spread is "no evidence".
- **Ablation, not only before/after.** For a component that is supposed to add something (a tool, a retrieval step, a skill, a prompt section), also run the suite with it switched off. A case that passes both ways does not test the component.
- **Outcome and process.** Each case has one check on the result and one on the path (the expected tool was called, with asserted arguments, in the expected order). Include cases where the tool or component must **not** fire.
- **Fail closed.** A run that ended on a provider error, refusal, rate limit, timeout or step cap scores as invalid and fails the suite — it is never graded on partial output. Interrupted or cost-capped suite runs are marked partial and kept out of any trend.
- **Pinned and recorded.** Model id, judge model id and harness version are pinned in the suite and written into every result; a model or judge change is never mixed with a component change.
- **Judge discipline.** Deterministic checks first. A judge gets a rubric of concrete PASS and FAIL conditions, short outputs, a different call from the one under test, and at least 2 of 3 votes; the votes and what the judge saw are stored.
- **Sealed answer key.** The agent under test cannot read the cases, the checks or reference outputs.
- **No live dependencies.** External tools and services are stubbed with fixed (or recorded and committed) responses; an unstubbed tool is unavailable in the run.
- **Two tiers.** Deterministic checks run on every change; judged and ablation runs before release, under a stated cost cap.
```

- **Cost:** about 1.9 KB in a role file (full-depth role files are a hard constraint; this adds, removes nothing). `AGENTS.md`: 0 B.
- **Lost by not adopting:** the standard at `ai-engineer.md:80-84` is satisfied by a single-run, single-judge, live-API suite that grades a rate-limited run as a regression or a pass. `ai-reviewer.md:38` asks "reproducible enough to trust" with nothing checkable behind it.
- **Build-vs-reuse note:** `ai-engineer.md:86` already says "Reuse the project's existing eval harness/framework; never build a second one"; these are properties to require of whichever harness is used, not a spec for a new one.
- **Ownership check:** prompt eval sets belong to `prompt-engineer` (`ai-engineer.md:7`). If the user prefers one home, put the block in `ai-engineer.md` and add to `prompt-engineer.md` after line 63 a single pointer line: "The eval runner meets the runner properties in `ai-engineer.md` → evaluation framework."

### P4. `ai-reviewer.md`: the matching review checks (same mechanisms as P3)

- **Target:** `EngineeringTeam/ai-reviewer.md`, inserted after line 38 ("Are results reproducible enough to trust ...") and before line 40 ("Block changes to prompts ...").
- **Proposed wording:**

```markdown
- Does each case run at least 3 times, and is a provider error, refusal or cap scored as invalid rather than graded (fail closed)?
- Is there a "component off" run, so a case that passes without the component is not counted as proof of it?
- Does the suite include a must-not-fire case, and does each case check both the result and the path (tool called, arguments asserted)?
- Are the model id, judge model id and harness version pinned and recorded with the results?
- Can the agent under test read the cases, checks or reference outputs? (Blocking if yes.)
- Are external tools stubbed, or does the suite depend on a live service?
```

  Severity: the answer-key and fail-closed items join the existing Blocking list at `ai-reviewer.md:23` only if the user wants them blocking; default proposal is Blocking for those two, Non-blocking for the rest.
- **Cost:** about 0.7 KB in a role file. `AGENTS.md`: 0 B. P3 without P4 leaves the standard unreviewed; adopt together or neither.
- **Lost by not adopting:** the reviewer keeps a rule ("mandatory evaluation framework") with no test for whether the framework can produce a false pass.

### P5. `security-engineer.md`: evaluating a plugin is running it (mechanisms 18, 19; deep read section 5)

- **Target:** `EngineeringTeam/security-engineer.md:708`, appended to the "**Skills, plugins, subagents.**" bullet (no text removed).
- **Proposed wording:**

```markdown
Testing or evaluating a skill or plugin executes its hooks, scripts and MCP servers as the user: it is the same trust decision as installing it, a harness's run isolation is not a boundary against the plugin's own code, and a passing eval suite is not a safety result. In CI, an eval of contributed plugin code with a provider key in the environment holds all three Rule of Two legs — run it without secrets, or after a human approval.
```

- **Cost:** about 0.5 KB in a role file. `AGENTS.md`: 0 B. This is a security-posture wording change: mandatory `security-engineer` review and ask-first.
- **Lost by not adopting:** "Provenance" at `:708` is read as an install-time check; "just run its evals first" looks like a safe way to vet an unknown plugin and is the opposite.

### P6. `Evals/routing-cases.md`: cover overlay descriptions (mechanism 28)

- **Target:** `Evals/routing-cases.md:3`, first sentence, extended in place.
- **Proposed wording:** replace "after any change to it" with "after any change to it, to a role's *Use for* cell, or to a `description:` in `Agents/claude/*.md` (the overlay description decides delegation the same way the table decides routing)".
- **Cost:** about 0.15 KB. `AGENTS.md`: 0 B.
- **Lost by not adopting:** little; a subagent description edited for length can stop firing with no check. Lowest priority of the six.

## Considered and not proposed

- **Mechanism 3 as a numeric CI gate for the library's own A/B.** There is no runner to gate; writing one reinvents the vendor tool for one host. `EVALS.md:30` (pass^3) already is a threshold of 1.0.
- **Mechanism 8 (no code graders) and the mechanism 13 trick "have the prompt write the outcome to a file".** Both are weaker than `EVALS.md:35-36`; adopting them would regress the self-report ban.
- **Mechanism 20 (transcript resume).** Host-specific `.jsonl`; would live only as an overlay and duplicates the Handoff contract's fresh-session re-entry.
- **Mechanism 25 (neutralise git hooks per run).** Useful only for unattended runs on untrusted repos, which the Rule of Two (`rules-detail.md:30`) already forbids from holding secrets. Could be one clause in `ORCHESTRATION_README.md` "Headless / CI use" if a real headless run is ever set up (`:133` "Nothing new executes until a real headless run exists").
- **Packaging roles as a plugin to make them evaluable.** Conflicts with *no plugin marketplace dependency* and *works from AGENTS.md alone*; also measures a different delivery path than the one users run (deep read W4). Reject.

## Suggested order if the user adopts any

1. P1 before the first of the three pending A/Bs (`EVALS.md:45-47`) is run, because rows recorded without it cannot be upgraded later.
2. P3 + P4 together.
3. P5, then P2 (both via `security-engineer`).
4. P6 whenever `Agents/claude/` is next touched.

<!-- END-OF-FILE -->
