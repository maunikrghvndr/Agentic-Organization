# Deep read: Anthropic `claude plugin eval` (Test plugins with evals)

- **Read on:** 2026-11-18 (fetched 01:32 UTC), role `researcher`, primary sources only.
- **Source A (the doc):** `https://code.claude.com/docs/en/plugin-evals.md` (Markdown form of the shortlisted page), 65,327 bytes, sha256 `23e2c59772e287522f48c0b42d97bff37e31cbf4ddf1ab40e9e620c9550dfde0`. The page carries no version or last-updated stamp; the fetch date and hash are the only pin.
- **Source B (related doc pages, same fetch):** `plugins/cli-reference.md` (sections `plugin eval`, `plugin eval init`), `plugins/manifest-reference.md` (`experimental.evals`), `plugins/measure.md`, `skills.md` (skill-creator comparison), `changelog.md`.
- **Source C (repo):** `https://github.com/anthropics/claude-code` shallow clone, `main` @ `409fbf374c124a421a1bcf928064c5e5ee176bf4` (commit date 2026-11-18T00:12:02Z). `CHANGELOG.md` top entry is 2.1.327 (2026-11-17). 1,564 tracked files.
- **What the repo does and does not contain:** the only files mentioning `plugin eval` are `CHANGELOG.md` and `feed.xml`. **The runner's source code is not in the repository** (`LICENSE.md`: "© Anthropic PBC. All rights reserved."). Everything in sections 2 and 3 is therefore the vendor's description of behaviour, not behaviour read from code. Nothing was installed or executed; no claim below was reproduced.
- **Not reachable from this session:** GitHub REST API for `anthropics/claude-code` (403, repository not attached). Stars, forks, contributor count, issues and PRs were **not read**.
- Quotes are from Source A unless a different page is named. "§" names a heading in Source A.

## 1. What it is, who maintains it, adoption signals

- A subcommand of the Claude Code CLI: `claude plugin eval [target] [options]` and `claude plugin eval init [name]`. It "runs your plugin against a suite of test cases and scores the results. Each case is a realistic prompt plus one or more graders."
- Maintainer: Anthropic (first party, closed source, ships inside the `claude` binary). Not a separate package or repository.
- Scope: Claude Code plugins and skills-directory plugins only. Requires "A plugin directory with a `plugin.json` or `.claude-plugin/plugin.json` manifest, or a skills-directory plugin" (§Requirements). It does not evaluate a bare `AGENTS.md`/`CLAUDE.md` or other harnesses' instruction files; in fact project `CLAUDE.md` is deliberately not loaded in a run (mechanism 14).
- Age: added in 2.1.269, dated 2026-09-11 in the docs changelog ("Added `claude plugin eval`: run a plugin's eval suite against Claude Code and get scored, reproducible results (JSON + HTML report)"). About ten weeks old on the read date.
- Change history from `CHANGELOG.md` (all entries naming the command; dates from the docs changelog):
  - 2.1.269, 2026-09-11: added.
  - 2.1.283, 2026-09-25: requires git 2.31+ when git is installed.
  - 2.1.289, 2026-10-03: fixed stale copy of a plugin installed from a local folder marketplace.
  - 2.1.293, 2026-10-07: fixed "refusing every Bash-granting run on Macs with Docker Desktop".
  - 2.1.299, 2026-10-14: added `--disallow-tools` / `disallowed_tools`; fixed "passing runs that the API refused".
  - 2.1.319, 2026-11-06: fixed warnings "suggesting `max: 0` for a tool that must not be called, which could never pass".
  - 2.1.325, 2026-11-13: fixed `--output-dir ''` writing into the current folder.
  - 2.1.327, 2026-11-17: "keep its deny rules over a plugin's permission hook, and to flag calls the hook let through".
- Maturity markers in the docs: the manifest key is `experimental.evals` ("whose manifest shape may still change", manifest reference); troubleshooting lists "plugin eval is currently in early access" and "plugin eval is currently unavailable" states.
- Stars, forks, contributors, open issues for `anthropics/claude-code`: **Unverified** (API blocked). Number of public plugins that ship an `evals/` suite in this format: **Unverified**, no figure in any source read.
- Sibling tool, not the same thing: the `skill-creator` plugin "runs a similar comparison with its own `evals/evals.json` format, and neither tool reads the other's case files."

## 2. How it actually works

**Files.** A suite is a directory `evals/` inside the plugin (§Eval suite reference):

```text
evals/
├── <case>/prompt.md        # frontmatter: case and run fields; body: the prompt
├── <case>/case.yaml        # optional: context.* fields, or the whole case
├── <case>/graders/<name>.md  # one grader per file
├── <case>/mocks/           # per-case MCP mocks
├── mocks/<server>/<tool>.md, _server.md, _tools.json, fixtures/, .replay/<server>/
└── results/<timestamp>/aggregate-result.json, report.html, mock-recordings/
```

"A directory counts as a case when it holds a `prompt.md` or a `case.yaml`, and a case without at least one grader fails to load".

**One run.** "Claude Code starts a fresh, isolated non-interactive session with only your plugin loaded, sends the prompt, and lets Claude work until it finishes or hits the case's turn or time limit. Each grader then checks the final reply, the transcript, or a file Claude created, and passes or fails." The agent under test "runs there as a `claude -p` child process" with "a temporary home directory, working directory, and Claude Code configuration".

**Scoring.** "each case runs three times by default. A run's score is the fraction of its graders that passed, weighted if you set weights, and the case's score is the mean across its runs. A case passes when its score meets the `--threshold`, `1.0` by default."

**Baseline.** "a case's runs are repeated with no plugin loaded, and you get two scores, `WITH` and `W/OUT`. Their difference, `Δ`, is what the plugin contributed."

**Cost shape.** "a suite makes roughly cases × runs agent runs with the plugin and the same number again for the no-plugin baseline, plus three short judge calls per `llm` or `baseline` grader per run." One case at defaults is six agent runs. The example table shows one case at `$0.41` (illustrative figure in the doc, not a measurement).

**Authoring.** `claude plugin eval init` opens an interactive session in which "Claude reads your plugin and asks you what a good result looks like, proposes prompts that should and shouldn't trigger the plugin, designs graders for each, runs them once as a trial to check they behave, and writes one case directory per prompt". `init --bare <name>` writes a blank template and "runs nothing".

**Outputs.** Terminal summary table (`CASE WITH W/OUT Δ RUNS COST NOTES`), `aggregate-result.json` (`schemaVersion: 1`, camelCase, additive-only), `report.html` ("a single self-contained file that makes no external requests"), and, for claude.ai-subscription sign-ins where artifacts are available, an automatically published private artifact (`Published: <url>`).

**CI recipe given by the doc** (§Run evals in CI):

```bash
claude plugin eval . --trust-plugin --json results.json --threshold 0.8 \
  --model claude-sonnet-5 --judge-model claude-haiku-4-5 --no-publish --max-cost-usd 20
```

## 3. Mechanisms

Evidence labels: **Doc-only** = described by the vendor, no measurement published. **Changelog** = a fix or change in `CHANGELOG.md` shows the mechanism existed and misbehaved or was hardened. No source read contains a measured result (false-positive rate, score variance, judge agreement) for any mechanism below; where nothing at all supports it, the entry says "no evidence found".

1. **With/without ablation (two-arm run).** Repeats each case's runs with no plugin loaded and reports `WITH`, `W/OUT`, `Δ`. Lives in: `--ablation with-without|none`, default "Decided per case" (§Score against the no-plugin baseline). Problem: "A high score on its own doesn't tell you the plugin helped, because Claude might do as well without it ... If a case scores 1.0 both with and without the plugin, the plugin isn't what made it pass." Evidence: Doc-only. No published variance or significance treatment of `Δ`; see weakness W1.

2. **Repeated runs, mean score.** Default 3 runs per case per arm; `runs` field 1 to 50; `--runs` overrides. Lives in: `prompt.md` frontmatter `runs`, `--runs`. Problem: "One run of a non-deterministic agent tells you little". Evidence: Doc-only. The doc itself warns "A single run is noisy, so confirm any change at the default three runs before you trust it." No basis given for why 3 is enough.

3. **Threshold gate with exit code.** "A case passes when its with-arm score is at least this. Any case below it makes the command exit 1." Default `1.0`. Lives in: `--threshold <0..1>`; exit-code table in §Run evals in CI (0 pass; 1 fail/load error/untrusted/API error/invalid option; 2 partial; 130 interrupted; 143 terminated). Problem: CI gating on behaviour. Evidence: Changelog 2.1.299 fixed a hole in the gate ("passing runs that the API refused"). Note the gate is on the with-arm score only: "The with-minus-without delta is reported but never changes the exit code".

4. **Cost ceiling.** `--max-cost-usd`: "A ceiling on the run's list-price cost estimate, not on plan usage. Checked before each run starts. Once spent, nothing further starts; runs that already started finish, so spend can pass the ceiling by those runs. If any run is left unstarted, the command exits 2 with partial results". Result carries `partial: true`, `partialReason: cost_ceiling`, and per-run `skippedPaidGraders`. Problem: unbounded spend in CI. Evidence: Doc-only. It is a soft ceiling by the doc's own wording.

5. **Pinned agent model.** `--model` / case `model`: "Pin it in CI so a model rollout isn't mistaken for a plugin regression". Default otherwise is the case's model, else `ANTHROPIC_MODEL`, else Claude Code's default. Problem: confounding a plugin change with a model change. Evidence: Doc-only.

6. **Separate judge model.** `--judge-model` sets the model for `llm` and `baseline` graders and for `type: agent` mocks; default is "the model Claude Code uses for background tasks". Problem: judge drift and judge weakness. Evidence: Doc-only, but the doc admits the failure mode: "A small judge model can mark a correct answer wrong because it's formatted differently from what the rubric describes. Re-run with `--judge-model sonnet`".

7. **Three-vote judge majority.** `llm` grader: "A judge model votes PASS on the rubric in at least two of three votes." The report shows "the judge's votes and the evidence it was shown". Problem: single-call judge noise. Evidence: no evidence found (no agreement figures).

8. **Six fixed grader types, no code graders.** `regex`, `tool_used`, `tool_order`, `file_exists` ("computed from the transcript and files and cost nothing"), `llm`, `baseline` (judge compares against a reference transcript `.jsonl`). "There are no custom-code graders." Lives in: `graders/<name>.md` frontmatter `type`, or `graders:` in `case.yaml`. Problem: cheap deterministic checks separated from paid judged ones. Evidence: Doc-only.

9. **Grader targets.** `target`/`focus` values: `last_message` (default), `trace` (JSON per line; "A `regex` grader sees every message; an `llm` judge sees the first 12 and the last 12"), `files` (paths created, not contents), `{ source: file, path }` (file contents; images shown to the judge), `mock_calls`. Problem: grading the outcome versus the process. Evidence: Doc-only; two troubleshooting entries exist because authors confuse `files` with file contents and trace JSON escaping.

10. **Must-not-trigger grader.** `tool_used` with `min: 0` and `max: 0` asserts a tool was never called; with `arm: both` it is scored in both arms, "which is what you want for a 'must not invoke the skill' check". `regex` has `match: not_contains`. `init` proposes "prompts that should and shouldn't trigger the plugin". Problem: over-triggering skills. Evidence: Changelog 2.1.319: the tool's own warnings used to suggest `max: 0` alone, "which could never pass" (default `min` is 1).

11. **Plugin-fired indicator excluded from score.** In a two-arm run, every `tool_used: Skill` grader, mock-call graders on plugin-declared servers, and anything marked `arm: with-only` are reported `scored: false`: "A check like 'the skill was invoked' can never pass without the plugin, so counting it would push the without-arm toward zero and inflate `Δ`." Exceptions: if all graders would be excluded they are scored normally; `arm: both` forces scoring; under `--ablation none` nothing is excluded. Problem: inflated delta from checks that are impossible in the baseline. Evidence: Doc-only. Side effect stated by the doc: "the same suite can produce a different absolute score in the two modes."

12. **Outcome + process grader pairing (authoring rule).** "Give each case one grader on the result ... and one on the steps Claude took to produce it, such as `tool_used` or `tool_order`. Together they tell you both whether the answer was right and whether your plugin produced it." Lives in: §Choose graders that give a stable signal. Evidence: no evidence found.

13. **Stable-signal authoring rules.** Grade long output with `regex` over file contents; keep `llm` graders for short outputs "with rubrics written as concrete PASS and FAIL conditions"; if `tool_used: Skill` passes but `Δ` is negative "suspect the judge before the plugin"; to check a build, have the prompt write the outcome to a file and grade the file. Lives in: same section. Evidence: no evidence found.

14. **Run isolation.** Temporary home, working directory and configuration per run; "Your user settings, hooks, `CLAUDE.md` files, MCP servers, other installed plugins, memory, and skills are absent"; no `.claude/`, `CLAUDE.md` or `.mcp.json` loads "even one a `scaffold_script` wrote"; shell environment is an allowlist plus `EVAL_*`. Lives in: §How runs are isolated. Problem: results that depend on the author's machine. Evidence: Doc-only. Exception stated: managed settings still apply, "so results on a managed machine can differ from an unmanaged one".

15. **Case definitions hidden from the agent.** "A run can't read the eval directory, so Claude can't see the case's prompt, its graders, or sibling cases." Problem: the agent reading the answer key. Evidence: Doc-only.

16. **Default-deny tools with explicit grants.** "Runs never stop to ask for permission." A case's `allowed_tools` can only request read-only tools (`Read`, `Glob`, `Grep`, `NotebookRead`, `Skill`, `AskUserQuestion`, `Agent`, `TodoWrite`, task tools); `Bash`, `Write`, `Edit`, `WebFetch`, `WebSearch` need `--allow-tools` from the operator and are otherwise "removed from the session". "A case's `allowed_tools` and a skill's own `allowed-tools` frontmatter can't widen any of them." Changelog 2.1.299 adds the inverse (`--disallow-tools`, `disallowed_tools`). Problem: a suite or plugin escalating its own permissions. Evidence: Changelog 2.1.327 ("keep its deny rules over a plugin's permission hook, and to flag calls the hook let through") implies that before 2.1.327 a plugin's permission hook could override the eval's deny rules.

17. **Mandatory OS sandbox for shell grants.** Granting `Bash` runs every command under the OS sandbox (writes confined to workspace, home unreadable, network limited to granted domains). "If you grant Bash or PowerShell on a machine with no sandbox backend, Claude Code refuses each run rather than running it unconfined". "Native Windows has no backend, so run shell-granting suites under WSL2; on Linux, install `bubblewrap` and `socat` first." Problem: unattended shell execution. Evidence: Changelog 2.1.293 (false refusals on Macs with Docker Desktop).

18. **Trust prompt and `--trust-plugin`.** First run asks `Trust this plugin directory?`; non-TTY or `--json` runs are "refused with exit 1" unless `--trust-plugin`. "Inside a git repository, answering yes trusts the whole repository, for interactive sessions too." Named installed plugins skip the prompt. Problem: loading unknown plugin code silently. Evidence: Doc-only.

19. **Opt-in scaffold script.** `context.scaffold_script` (Bash, in `case.yaml`) seeds files or a git repo; runs only with `--scaffold`, with a minimal environment, 120-second limit, non-zero exit scores the run 0. "The script runs as you, outside the agent's sandbox". Problem: repeatable fixtures. Evidence: Doc-only.

20. **Transcript resume.** `context.history_file` (`.jsonl`): "the case's prompt becomes the next user turn". With a path target these cases run single-arm by default "on the assumption that the recorded conversation already reflects the plugin". Problem: testing mid-conversation behaviour. Evidence: Doc-only.

21. **MCP mocks, fixed.** `evals/mocks/<server>/<tool>.md`; body is the tool result with `{{input.<field>}}` and `{{file:fixtures/...}}` substitution; `error: true` returns a tool error. "A run never starts your plugin's real MCP servers unless you ask." Unmocked tools are unavailable. Problem: evaluating MCP-calling skills without the live service. Evidence: Doc-only.

22. **Mock input assertions (`expect:`).** Map of dotted input paths to a type, `/regex/`, literal or list of literals. "If a call violates it, the run aborts with score 0 and records why". The regex dialect is restricted (no groups, alternation, backreferences, lookaround; length-capped), checked at load. Problem: asserting what the plugin asked the server to do. Evidence: Doc-only.

23. **Agent mocks with budget and record/replay.** `type: agent` has the judge model answer as the server; budget is "four times the case's `max_turns`", exceeding it aborts with score 0. Clean runs save answers to `results/<ts>/mock-recordings/` with `ADOPT.txt`; copying into `mocks/.replay/<server>/` makes later identical calls answer "with no model call". "Commit `mocks/.replay/` ... so CI runs are repeatable." Problem: nondeterministic simulated servers. Evidence: Doc-only.

24. **API-error runs fail closed.** A run whose last request got an HTTP error (rate limit, usage limit) "scores 0 with no grader results, and the command exits non-zero whatever the scores and `--threshold` are." Includes baseline runs. Evidence: Changelog 2.1.299; "Before v2.1.299, such a run was graded on what it had produced."

25. **Git hook neutralisation.** Per run, "Claude Code switches off git hooks, credential helpers, and other programs a repository's git configuration can start" via `GIT_CONFIG_COUNT`; git older than 2.31 is refused. Evidence: Changelog 2.1.283; "Before v2.1.283 ... on an older git the suite ran with those programs left on."

26. **Partial-result flags for trend hygiene.** `partial`/`partialReason` (`cost_ceiling`, `interrupted`, `auth_failed`) and `skippedPaidGraders`; doc rule: "leave `partial: true` documents and runs with `skippedPaidGraders` out of any trend you chart." `claudeVersion` is recorded in the result. Problem: mixing incomparable runs into a history. Evidence: Doc-only.

27. **Tag and glob selection for tiered suites.** `--case <glob>`, `--tag <tag>`; doc advice: "give quick every-change suites only graders that don't call a judge, use `--ablation none` where you don't need `Δ`". Problem: cost of running everything on every change. Evidence: Doc-only.

28. **Trigger-rate loop for skill descriptions.** Workflow, not a flag: when `Δ` is near zero with `tool_used: Skill` failing, "Claude isn't choosing your skill on natural phrasing. Adjust the skill's `description`, run `claude plugin eval .` again, and compare." Cross-referenced from `plugins/measure.md`: after trimming descriptions for context cost, "check triggering with a `tool_used: Skill` grader". This is the documented vendor form of measure-before-you-trim for plugin skills. Evidence: Doc-only.

## 4. Known weaknesses, open issues, criticisms

- **W1. No statistics on the delta.** `Δ` is a difference of two means over 3 runs each by default. No confidence interval, variance, or minimum-effect guidance is described. In the doc's own example, `0.33` vs `1.00` at n=3 is one baseline pass in three.
- **W2. The gate ignores the ablation.** Exit code depends on the with-arm score only; a plugin that adds nothing (or `Δ` negative) passes CI if the with-arm clears the threshold. A consumer wanting "fail if the section stopped helping" must parse `aggregates.meanDelta` / `cases[].aggregates.delta` itself.
- **W3. Only whole-plugin ablation.** The baseline is "no plugin at all". No documented way to ablate one skill, one section of a skill, or one hook while keeping the rest. A/B of two versions of the same text means two separate runs compared by hand.
- **W4. Plugin-shaped inputs only; project instruction files excluded.** `CLAUDE.md` and project config never load in a run. Content delivered as `AGENTS.md`/role files is not testable unless repackaged as a plugin or skills-directory plugin. Other hosts (Codex, Copilot) are out of scope.
- **W5. Judge limits.** `trace` focus shows an `llm` judge only "the first 12 and the last 12" messages; non-image binaries (`.pptx`, PDF) are refused; the default judge is the background-task model, which the doc says can fail correct answers on formatting. Agent mocks also use the judge model, so changing the judge changes mock behaviour.
- **W6. No custom-code graders.** Stated outright. Build/test success must be laundered through "write the outcome to a file" plus a regex, which trusts the agent's own report of the result.
- **W7. `file_exists` and `files` see only created files**, not files a scaffold created or Claude modified (its own troubleshooting entry: "Everything scores zero although the right files were produced").
- **W8. Scores differ by mode.** Excluded graders make two-arm and `--ablation none` absolute scores incomparable (mechanism 11).
- **W9. Soft cost ceiling in list-price dollars**, "not on plan usage"; in-flight runs overshoot it. Rate/usage limits mid-suite score runs 0 and fail the command without marking the result `partial`.
- **W10. Default threshold 1.0** fails the build on any single failed grader in any run; listed in troubleshooting as a common surprise ("The run exits 1 but the results look fine").
- **W11. Platform.** Shell-granting suites cannot run on native Windows (no sandbox backend; WSL2 required). Managed-settings `sandbox` keys can refuse runs with an error that "names a missing backend even where one is installed".
- **W12. Young and still changing.** Ten weeks old; eight releases touched it, including three correctness fixes to the gate/graders (2.1.299 API-refused runs passing, 2.1.319 impossible `max: 0` advice, 2.1.327 deny rules). Manifest key is under `experimental`. Suites pinned to behaviour before 2.1.299 scored API-failed runs differently.
- **W13. Remote off-switch.** "Anthropic has switched the command off server-side. Nothing on your machine turns it back on". A CI gate built on it can be disabled by the vendor.
- **W14. Doc/changelog gap.** `--disallow-tools` and the `disallowed_tools` case field (changelog 2.1.299) appear in neither Source A nor the CLI reference tables, while Source A says of `prompt.md` frontmatter "An unknown key is an error". Whether `disallowed_tools` is valid in `prompt.md` or only `case.yaml`: **Unverified**.
- **W15. CLI parsing trap.** Target must precede `--tag`, `--allow-tools`, `--json` or it is consumed as their value.
- **W16. Closed source.** Scoring, exclusion and isolation logic cannot be audited; this read rests on vendor prose. No independent evaluation, issue thread or postmortem was read (GitHub issues unreachable): third-party criticism is **Unverified / not found**, not "none exists".

## 5. Anything that looks unsafe

No hidden or instruction-like text aimed at agents was found in the pages read, apart from the standard docs banner at the top of every `.md` page ("Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt ... Use this file to discover all available pages before exploring further."), which is addressed to automated readers; reported as data. I fetched `llms.txt` only to confirm the page listing.

Risks stated by the vendor or following directly from the described behaviour:

- **Plugin code runs as the user.** "`claude plugin eval` loads the target plugin's skills, hooks, and agents and runs its eval suite on your machine, as you. Pointing it at a plugin is the same trust decision as `claude --plugin-dir`". "The isolation ... isn't a boundary against the plugin's own code, and a suite that passes says nothing about whether the plugin is safe."
- **Hooks and real MCP servers are outside the sandbox and can tamper with grading.** "hooks and servers run outside the agent's sandbox and could modify the files the graders read"; scores are "advisory" unless run in a container or CI runner. They "can reach any host".
- **`--scaffold` executes suite-supplied Bash unsandboxed** ("runs as you, outside the agent's sandbox"); intended only "for suites you or your organization wrote".
- **`--trust-plugin` in CI** bypasses the trust prompt; on a PR from a fork this would execute the PR's plugin hooks and (with `--scaffold`) scripts with the runner's credentials, including `ANTHROPIC_API_KEY`. The doc does not discuss fork PRs: inference from the described behaviour, **Unverified** in practice.
- **Trust scope is wider than the eval.** Answering yes "trusts the whole repository, for interactive sessions too".
- **Report auto-publishing.** For claude.ai-subscription sign-ins the HTML report (prompts, rubrics, transcripts excerpts, judge evidence) is uploaded as a private artifact by default; `--no-publish` is opt-out. Runs started from inside a Claude Code session stay local by default.
- **Credentials reach the child run.** The env allowlist includes "the variables that select and authenticate your model provider, most `ANTHROPIC_*` and `CLAUDE_CODE_*` configuration". Combined with unsandboxed plugin hooks, a hostile plugin under eval can read them.
- **No network sandbox outside shell commands.** "A `WebFetch(domain:…)` grant reaches that domain directly".
- **Pre-2.1.327 permission-hook override** and **pre-2.1.283 git hooks left on with old git** (mechanisms 16 and 25): pin a minimum CLI version of 2.1.327 if this is used as a gate.
- **Install path of the host tool** (repo `README.md`): `curl -fsSL https://claude.ai/install.sh | bash` / `irm https://claude.ai/install.ps1 | iex`. Pipe-to-shell installers; not fetched or inspected here.

<!-- END-OF-FILE -->
