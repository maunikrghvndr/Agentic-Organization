# Discover — lens "verification"

- Role: `researcher`. Observed: 2026-11-18. Scope: repos created or majorly updated since 2026-04-01, plus vendor documents, on evaluation, quality gates, evidence, judge calibration, mutation testing, and cost/usage measurement for coding agents and instruction files.
- Excluded as already studied: Hermes Agent, BMAD-Method, OpenSpec, GitHub Spec Kit (+ extensions), Kiro, cc-sdd, Multica, Letta Code.

## Method and limits

- Stars / created / last-push values come from the GitHub search API, unauthenticated, on 2026-11-18: `curl -G https://api.github.com/search/repositories --data-urlencode "q=<query> created:>2026-04-01" -d sort=stars` (24 queries), or `q=repo:<owner>/<name>` for single lookups. `gh` was unusable (invalid token), and the `/repos/<owner>/<name>` endpoint was blocked by the session proxy, so no release or commit history was read.
- Mechanisms come from the first 1.5–2.6 KB of each `README.md`, fetched from `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md` (HTTP 200 for every row marked "README"). Rows marked "search only" have a description but no README read.
- **Evidence level: everything below is the project's own claim.** Nothing was installed or run. Benchmark numbers, calibration claims and "SOTA" statements in READMEs are unverified.
- Not reached: `docs.nvidia.com` (not resolvable from this session), so SkillEvaluator's tier thresholds are known only from its README and the Google post. `github.com/trending` returned 403.
- Star counts on young repos can be inflated; treat them as attention, not quality.

## Candidates

`V` column: R = README read, S = search API result only, D = vendor document fetched.

### A. Evaluating skills and instruction files (does the text change agent behaviour?)

| # | Repo / document | Stars | Created | Last push | What it does | Mechanism an instruction library could learn from | V |
|---|---|---|---|---|---|---|---|
| 1 | [NVIDIA/SkillEvaluator](https://github.com/NVIDIA/SkillEvaluator) | 3344 | 2026-06-24 | 2026-11-18 | Multi-tier checker for agent skills: static quality check, overlap detection, then live runs with and without the skill. | Cheap-first tiers (no-key `quality-check` before any model run); a `harness-check` that reports per host whether the skill loads at all (e.g. description truncated, directory not scanned); `ci init` opens a setup PR. | R |
| 2 | [UiPath/coder_eval](https://github.com/UiPath/coder_eval) | 160 | 2026-07-09 | 2026-11-17 | Runs a real coding agent (Claude Code, Codex, Gemini, OpenCode, Pi) in a sandbox against declarative YAML tasks and scores the files and commands produced. | `skill_triggered` activation criterion separate from outcome criteria; weighted 0.0–1.0 scoring with thresholds; A/B experiment layer (prompt vs prompt, harness is one field); per-tool cost telemetry in the same report. | R |
| 3 | [prime-radiant-inc/superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals) | 146 | 2026-05-13 | 2026-10-21 | "Quorum": behavioural eval lab for the superpowers skills, driving nine agent CLIs. | Evaluates workflow compliance (skill triggering, verification reflexes, review quality), not task success; user-like conversation, then a fresh assessor grading against private criteria plus deterministic post-checks; hard split between static checks (public CI) and live evals (trusted maintainers, throwaway `HOME` per run). | R |
| 4 | [darkrishabh/agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) | 817 | 2026-05-06 | 2026-11-16 | Test runner for agentskills.io skills. | Every eval runs `with_skill` and `without_skill`; a judge grades both with cited assertions; `--strict` for CI; per-iteration workspace keeps outputs, timing and gradings as artifacts. | R |
| 5 | [boheling/skillbench](https://github.com/boheling/skillbench) | 44 | 2026-05-24 | 2026-05-24 | With/without-skill benchmark graded by a script. | Both arms graded by the same deterministic script, never an LLM; security scan as a separate first step. Stale since May. | R |
| 6 | [google/skill-reach](https://github.com/google/skill-reach) | 26 | 2026-09-04 | 2026-11-16 | Evaluation suite for skill triggering and collision detection. | Per the Google post (row 30): `lint` (frontmatter and token budgets, no API calls), `overlap` (vocabulary collision with rival skills), `eval --runs 3` (cross-harness routing probes). Directly applicable to a role table with confusable pairs. | S |
| 7 | [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) | 19126 | 2026-05-08 | 2026-11-17 | Text-space optimizer that edits skills from agent trajectories. | "Validation-gated updates": an edit to the skill is kept only if a held-out validation score improves; output is one deployable `best_skill.md`. | S |
| 8 | [rpamis/comet](https://github.com/rpamis/comet) | 3304 | 2026-05-14 | 2026-11-17 | Resumable skill workflow platform with an eval component. | Comet Eval scores skills with rubric plus both Pass@k (any of k runs passes) and Pass^k (all k pass): the second measures reliability, not capability. Note: its "Classic" mode builds on OpenSpec + Superpowers. | R |
| 9 | [china-qijizhifeng/agentic-harness-engineering](https://github.com/china-qijizhifeng/agentic-harness-engineering) | 978 | 2026-04-23 | 2026-10-30 | Research code (arXiv 2604.25850): evolves the harness around a fixed model. | Harness split into seven file-level, git-tracked components so each edit is auditable and revertible; raw traces distilled into layered, sourced reports before any edit is proposed. | R |

### B. Linting instruction files (static checks, no model)

| # | Repo | Stars | Created | Last push | What it does | Mechanism | V |
|---|---|---|---|---|---|---|---|
| 10 | [alifurkangokce/driftlint](https://github.com/alifurkangokce/driftlint) | 61 | 2026-08-11 | 2026-10-13 | Finds claims in `CLAUDE.md` / `AGENTS.md` / skills that the code no longer supports. | Drift check of instruction claims against the tree; `twins` keeps `CLAUDE.md` and `AGENTS.md` in sync; "Reviewed Memory": agent proposes a fact with `--evidence file:line`, a human approves, only approved entries sync into a marked block. | R |
| 11 | [YawLabs/ctxlint](https://github.com/YawLabs/ctxlint) | 12 | 2026-04-05 | 2026-11-16 | Lints context files and MCP configs against the codebase. | Broken paths and wrong commands detected, with git-rename suggestions; token cost per file and redundancy flags; SARIF output for code scanning; hardcoded-secret check in `.mcp.json`. | R |
| 12 | [yegor256/dogent](https://github.com/yegor256/dogent) | 8 | 2026-06-11 | 2026-11-17 | Strict pass/fail prose linter for `SKILL.md`, `CLAUDE.md`, `AGENTS.md`. | Line-level rules ("not an instruction, sounds like description", line length, section-name length) as a build gate, deliberately not a 0–100 score. | R |
| 13 | [HMAKT99/Agentspec](https://github.com/HMAKT99/Agentspec) (mdpact) | 3 | 2026-04-18 | 2026-10-18 | Lints agent markdown for contradictions; GitHub Action. | PR check scoped by `paths:` to instruction files, sticky PR comment, `fail-below` score. npm package not yet published per README. | R |
| 14 | [Taiizor/agents-md-cookbook](https://github.com/Taiizor/agents-md-cookbook) | 29 | 2026-06-14 | 2026-08-08 | `AGENTS.md` templates plus a linter and migrators. | Templates are themselves linted in CI; stated size target 60–150 lines, commands first. | R |
| 15 | [jed1978/instrlint](https://github.com/jed1978/instrlint) | 8 | 2026-04-05 | 2026-04-10 | Finds dead rules and token waste in `CLAUDE.md` / `AGENTS.md`. | "Dead rule" detection as a category. Unmaintained since April. | S |
| 16 | [Katta041/asitis-agent-tools](https://github.com/Katta041/asitis-agent-tools) | 4 | 2026-10-01 | 2026-11-17 | Read-only linter reporting what each agent actually loads. | Per-host "what really loads" report, token budgets, hidden-instruction detection. | S |

### C. Evidence and completion gates ("done" must be proven)

| # | Repo | Stars | Created | Last push | What it does | Mechanism | V |
|---|---|---|---|---|---|---|---|
| 17 | [pavangupta352/stalegreen](https://github.com/pavangupta352/stalegreen) | 4 | 2026-09-03 | 2026-09-04 | Hooks that block "done" when test evidence is stale, failed or masked. | Two named failure modes: *stale green* (run predates later edits) and *masked results* (`\| tail`, `\|\| true`, `; echo done` hide the exit code). PreToolUse rewrites verification commands to capture full output and print an explicit exit line; each receipt carries a working-tree fingerprint. | R |
| 18 | [vnmoorthy/groundtruth](https://github.com/vnmoorthy/groundtruth) | 7 | 2026-04-25 | 2026-07-20 | Claude Code Stop hook refusing a completion claim without verification in the same turn. | Stop-hook `decision: block` with a reason fed back to the model, which then retracts or verifies. | R |
| 19 | [B0yko/agent-claimcheck](https://github.com/B0yko/agent-claimcheck) | 31 | 2026-09-28 | 2026-11-06 | Checks success claims in agent traces against tool results. | Deterministic claim-evidence rules first, classifier and LLM judge only for what rules leave open; three-way verdict (`verified` ≥ 0.80, `false_success` ≤ 0.20, `unverifiable` between); CI exit codes; a 300-trace labelled benchmark reporting AUROC intervals, calibration and cost per detector. | R |
| 20 | [azrtydxb/procoder](https://github.com/azrtydxb/procoder) | 212 | 2026-08-16 | 2026-11-09 | One Go binary: commit gate, hygiene checks, hooks. | "Unchecked counts as failing": a tool that did not run is never reported clean. The binary reports and never edits; forced hooks at fixed lifecycle points vs self-serve commands. | R |
| 21 | [svetdev/cleat](https://github.com/svetdev/cleat) | 32 | 2026-08-31 | 2026-11-08 | Ratchet gates that only tighten, wired into the agent loop. | Baseline existing debt once, fail on any new instance. Gates include `escapes` (new `any`, `# type: ignore`, `.skip`, `\|\| true`), `doc-size` (an agent-read document growing past its ceiling) and `doc-citations` (a document citing a missing file). Failure text says what fixes it, not how to loosen the baseline. | R |
| 22 | [r-tatarinov/codex-harness](https://github.com/r-tatarinov/codex-harness) | 40 | 2026-09-06 | 2026-10-18 | Pre/post-edit analyzer comparison for Codex. | Baseline captured in PreToolUse, findings diffed in PostToolUse, deterministic regression policy, and a retry budget. | R |
| 23 | [amElnagdy/guard-skills](https://github.com/amElnagdy/guard-skills) | 1317 | 2026-06-06 | 2026-07-04 | Second-pass review skills (`clean-code-guard`, `test-guard`, `docs-guard`). | Guards run reactively on the diff after the work, one per artifact type. Prose-only, no enforcement. | R |
| 24 | [llm-as-a-verifier/llm-as-a-verifier](https://github.com/llm-as-a-verifier/llm-as-a-verifier) | 3351 | 2026-04-09 | 2026-10-08 | Verifier framework (arXiv 2607.05391) for scoring agent outputs. | Fine-grained score scale, expectation over the logprob distribution of the score tokens instead of one sampled score, repeated evaluation and criteria decomposition; tests a weaker model verifying a stronger one. Benchmark claims unverified. | R |

### D. Mutation testing and test-quality gates

| # | Repo | Stars | Created | Last push | What it does | Mechanism | V |
|---|---|---|---|---|---|---|---|
| 25 | [KovantAI/fermut](https://github.com/KovantAI/fermut) | 4 | 2026-06-25 | 2026-11-17 | Mutation testing for Python aimed at agents. | Deterministic mutant ids, JSON report, `next` / `explain` / `score` subcommands for an agent loop, `--diff-only`, cached re-runs. | R |
| 26 | [cribro-dev/cribro](https://github.com/cribro-dev/cribro) | 5 | 2026-11-06 | 2026-11-13 | Diff coverage (JaCoCo) and diff mutation testing (PIT) for Java/Kotlin. | Scope both metrics to lines changed since the merge base; plain-text report sized for an agent; warns that a filtered test run makes the rest of the change look unexecuted. | R |
| 27 | [samzhu/topplecat](https://github.com/samzhu/topplecat) | 14 | 2026-07-19 | 2026-08-14 | Re-checks an agent's "done" for Java/JUnit. | Reviewer-held hidden case rows, a property check and mutation testing per acceptance criterion; an AC fails if a mutated program still passes its public test; generated reports never become a second spec. | R |
| 28 | [dmoka/skills](https://github.com/dmoka/skills) | 21 | 2026-09-01 | 2026-10-12 | Agent skill that runs a mutation-testing loop. | Mutation testing delivered as a skill; README shows a refund bug that a 95% mutation score missed, so the score is not sufficient. | R |

### E. Judge calibration

| # | Repo | Stars | Created | Last push | What it does | Mechanism | V |
|---|---|---|---|---|---|---|---|
| 29 | [ai-evals-course/evals-skills](https://github.com/ai-evals-course/evals-skills) | 1807 | 2026-06-23 | 2026-10-24 | Skills that guide an agent through building product evals (Husain / Shankar course). | `validate-evaluator`: calibrate a judge against human labels with data splits, TPR/TNR and bias correction; `eval-audit` with prioritized severities; `error-discovery` before any metric is written. | R |
| 30 | [Calibre-Labs/reforge-ai-evals](https://github.com/Calibre-Labs/reforge-ai-evals) | 102 | 2026-04-16 | 2026-11-07 | Similar eval-building skills from the Reforge course. | States which two steps stay human: reading traces and labelling outputs to calibrate judges. | R |
| 31 | [ankurpand3y/judicator](https://github.com/ankurpand3y/judicator) | 9 | 2026-04-30 | 2026-05-01 | Audits an LLM judge for seven bias types (~1,000 calls). | Bias audit of the judge itself, with a cost estimate and confirmation before running. Stale since May. | R |

### F. Cost and usage measurement

| # | Repo | Stars | Created | Last push | What it does | Mechanism | V |
|---|---|---|---|---|---|---|---|
| 32 | [getagentseal/codeburn](https://github.com/getagentseal/codeburn) | 11856 | 2026-04-13 | 2026-11-13 | Reads local session files of many agents and prices every token. | Cost broken down by tool, model, project and inferred task type (coding, debugging, planning). | R |
| 33 | [splunk/token-meter](https://github.com/splunk/token-meter) | 150 | 2026-06-25 | 2026-11-17 | Local usage and cost dashboard for eight agents. | "Estimates are labelled; missing evidence stays unavailable, never zero." Reports tokens of tool definitions loaded and never called, cache-write share of spend, and cost per subagent run. Its figures are one engineer's laptop. | R |
| 34 | [alibaba/loongsuite-pilot](https://github.com/alibaba/loongsuite-pilot) | 261 | 2026-06-04 | 2026-11-17 | Local telemetry collector normalizing agent activity to a shared OpenTelemetry GenAI schema. | One schema across agents; states where exact per-call usage is unavailable (transcript-only collection omits it). | R |
| 35 | [jackulau/coding.sh](https://github.com/jackulau/coding.sh) | 117 | 2026-11-07 | 2026-11-18 | Local session index (SQLite) with viewer, MCP access and evals. | Turn a failed session into an eval case; compare changes with paired statistics. Eleven days old. | R |
| 36 | [xiufengsun/TokenTracker](https://github.com/xiufengsun/TokenTracker) | 2247 | 2026-04-05 | 2026-11-18 | Local token and cost tracker for 31 tools. | — | S |
| 37 | [QuesmaOrg/awesome-ai-tokenomics](https://github.com/QuesmaOrg/awesome-ai-tokenomics) | 219 | 2026-07-17 | 2026-11-13 | Curated list: monitor / optimize / govern token spend. | Index for a second pass (sections on harness efficiency, tool-protocol overhead, budgets and caps). | R |

### G. Vendor documents

| # | Document | Date | What it says | Mechanism | V |
|---|---|---|---|---|---|
| 38 | Anthropic, [Test plugins with evals](https://code.claude.com/docs/en/plugin-evals) (`claude plugin eval`) | undated page, fetched 2026-11-18 | First-party eval runner for Claude Code plugins. | With/without-plugin ablation (`--ablation with-without`), `--runs` default 3, `--threshold` with exit 1 below it, `--max-cost-usd` ceiling, `--model` pinning "so a model rollout isn't mistaken for a plugin regression", separate `--judge-model`, MCP mocks with `expect:` guards, graders with `arm: both` for must-not-trigger checks, `experimental.evals` in `plugin.json`. | D |
| 39 | Google Cloud, [Evaluate agent skills before they bloat your context window](https://cloud.google.com/blog/topics/developers-practitioners/evaluate-agent-skills-before-they-bloat-your-context-window) (Weinmeister, Blount) | 2026-11-03 | Five rules for skill evaluation. | (1) gate trigger collisions before running anything; (2) never trust an eval run on a developer laptop (ambient credentials and history contaminate the baseline); (3) paired with/without ablation at k=3 — over a third of their tasks scored differently across identical runs; (4) keep correctness, efficiency and security orthogonal: a blended 0.95/0.05 fitness let candidates that read the answer file outrank honest ones; (5) delete any skill whose delta drops to zero, re-run on every model upgrade. | D |

Referenced by the above but outside the date window or not opened: [harbor-framework/harbor](https://github.com/harbor-framework/harbor) (7166 stars, created 2025-08-04, pushed 2026-11-18; sandboxed task format used by rows 39 and Repo2RLEnv), [agent-sh/agnix](https://github.com/agent-sh/agnix) (487 stars, created 2026-01-30, pushed 2026-11-15; linter and LSP for agent config), [huggingface/Repo2RLEnv](https://github.com/huggingface/Repo2RLEnv) (790 stars, created 2026-05-05, pushed 2026-11-16; turns merged PRs into verifiable Harbor tasks). OpenAI "Testing Agent Skills Systematically with Evals" and Vercel "AGENTS.md outperforms skills" surfaced in search but date from January 2026 and were not opened.

## Notable mechanisms

1. **Paired ablation is the consensus test for an instruction file.** Rows 1, 2, 4, 5, 38 and 39 all run the same task with and without the skill, k ≥ 3. A file with zero delta is "pure context tax" (row 39). This is the missing measurement behind this library's `EVALS.md` "measure before you trim" rule.
2. **Trigger and load are tested separately from outcome.** `harness-check` (row 1), `skill_triggered` (row 2), `reach overlap` (row 6), `arm: both` must-not-trigger graders (row 38). A role table with four "confusable pairs" is exactly a collision surface.
3. **Reliability metric, not only capability.** Pass^k alongside Pass@k (row 8); non-determinism measured at over a third of tasks (row 39, their study).
4. **Evidence hygiene has named failure modes.** Stale green and masked results (row 17), "unchecked counts as failing" (row 20), receipts with a working-tree fingerprint (row 17). The Evidence row here already records command, exit code and sha; it does not yet forbid masking pipes or require the sha to match the tree at claim time.
5. **Ratchets instead of rules.** Baseline once, fail on new instances, and the failure message never explains how to loosen the baseline (row 21). Includes ratchets on the instruction documents themselves (`doc-size`, `doc-citations`).
6. **Deterministic first, judge last, with an abstain band.** Rules, then classifier, then LLM judge, and a three-way verdict with `unverifiable` (row 19); same-script grading of both arms (row 5). Matches this library's `Unverified cannot block`.
7. **Judges are calibrated against human labels or not trusted.** TPR/TNR on a held-out split with bias correction (row 29); labelling stays human (row 30); logprob-expectation scoring (row 24).
8. **Mutation testing scoped to the diff.** Changed lines only, agent-sized text output, deterministic mutant ids (rows 25, 26); per-AC mutation plus reviewer-held hidden cases (row 27). Row 28 documents a bug surviving a 95% score.
9. **Reward-hacking controls in the eval itself.** Graders run in a separate container after the agent exits; metrics kept orthogonal so efficiency cannot offset a failed test (row 39); private criteria and a fresh assessor (row 3).
10. **Cost reported with honesty rules.** Missing usage is "unavailable, never zero" (row 33, 34); spend ceilings and pinned models in eval runs (row 38); unused tool-definition tokens as a measurable waste category (row 33).
11. **Instruction drift is lintable without a model.** Claims vs tree, twin-file sync, dead references (rows 10, 11, 15); prose discipline as pass/fail (row 12); agent-proposed memory gated by human review with `file:line` evidence (row 10).

## Instruction-like text found in sources (reported, not acted on)

- `dmoka/skills` README: tells an agent to "Fetch the raw text of …/mutation-testing/SKILL.md … (use curl, not a summarizing fetch tool), then run its loop on this project."
- `raindrop-ai/workshop` README (1126 stars, created 2026-05-01, pushed 2026-11-05; local trace debugger, not tabled): "Using an AI coding agent? Tell it to run the command above" — a `curl … | bash` installer.
- `code.claude.com` doc pages open with "Fetch the complete documentation index at …/llms.txt".
- `vnmoorthy/groundtruth` and `jackulau/coding.sh` READMEs lead with `curl … | bash` / `| sh` installers.

## Open items for the next phase

- Read tier thresholds and overlap method for row 1 once `docs.nvidia.com` is reachable.
- Rows 6, 7, 15, 16, 36 need a README read before any claim is built on them.
- No star or activity figure here says the tool works; candidates for hands-on evaluation are rows 1, 2, 17, 21, 38.

<!-- END-OF-FILE -->
