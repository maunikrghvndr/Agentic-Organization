# Deep read: FailproofAI/failproofai

- Role: `researcher`. Read date: 2026-11-18.
- Source read: shallow clone of `https://github.com/FailproofAI/failproofai`, default branch, commit `97dc40edf066776b6ab109c97c1ca11206877716` (2026-11-17, "chore(deps): bump next (#1019)"). `package.json` version at that commit: `1.0.15-beta.0`. Plus the npm registry record for `failproofai` (read 2026-11-18) and commit history from a tree-less bare clone.
- Not reachable from this session: the GitHub web UI and REST API for this repository (HTTP 403 from the session proxy). So stars, forks, open-issue count, issue threads, PR discussions and the GitHub Releases page were NOT read. Everything about them below is marked Unverified.
- Nothing was installed; no code from the repository was run.

## 1. What it is, who maintains it, adoption signals

- What: an npm CLI (`failproofai`) that registers hooks/plugins in 12 agent harnesses and evaluates a policy on each hook event, returning allow / deny / instruct in the wire shape each harness reads. Also a local Next.js dashboard (port 8020) over the session logs already on disk, an offline `audit` command, a Rust daemon (`failproofaid`), a Python SDK, a TypeScript SDK, and a hosted "Cloud" side.
- Harnesses (`src/hooks/enforcement-capability.ts`): claude, codex, copilot, cursor, opencode, pi, hermes, openclaw, factory (droid), devin, antigravity, goose.
- Maintainer: ExosphereHost Inc. (`package.json` author `ExosphereHost Inc. <failproofai@exosphere.host>`; `LICENSE` copyright "2025 ExosphereHost Inc"). npm maintainer list has one account: `niveditjain`.
- Licence: MIT + Commons Clause v1.0 (`LICENSE`). Not OSI open source: the clause removes the right to "Sell", defined to include "hosting or consulting/support services related to the Software".
- Adoption signals as observed:
  - Stars: 9.6k is the figure in the task brief. Unverified here (GitHub API blocked). README carries two trendshift.io badges.
  - npm: package created 2026-04-06; 160 published versions; dist-tags `latest: 1.0.14` (published 2026-11-16), `next: 1.0.13-beta.3`. Download counts not read (Unverified).
  - Git: 785 commits since 2026-04-06; 172 tags; newest tags `v1.0.14`, `fp-cloud-cli-v0.0.3`. `CHANGELOG.md` is 1,013,104 bytes with 113 version sections.
  - Contributors: 16 author names in `git shortlog`. 277 commits are `dependabot[bot]`, 147 `github-actions[bot]`, 262 "Nivedit Jain" (+6 "NiveditJain"), 31 "Chetan Raghuvanshi", 16 "Siddartha Aralakuppe Yogesha", then bots and single-digit authors. Human authorship is concentrated in one person; several of the rest look like company accounts (`hermes-exosphere`, `yashexposphere`, `agenteye-bot`). Outside-contributor count: Unverified.
  - Release cadence: roughly one stable release every one to two weeks since September 2026 (`CHANGELOG.md` headings), with multiple betas per day at times (four betas dated 2026-10-15).
- Changelog oddity: three separate sections are all headed `1.0.14-beta.0` (2026-11-02, 2026-11-10, 2026-11-16) while npm `latest` is `1.0.14` and the tree is `1.0.15-beta.0`. The changelog heading is not a reliable version key.

## 2. How it actually works

Flow of one hook event (`src/hooks/handler.ts`, `src/hooks/policy-evaluator.ts`, `src/hooks/integrations.ts`):

1. `failproofai config` writes a hook entry (or plugin registration) into each detected harness's own config. Per README: "Setup wires the hooks and picks **no** policies".
2. The harness fires an event and passes a JSON payload to the hook command or plugin. `normalize-cli-payload.ts` and `tool-name-canonicalize.ts` map each harness's event and tool names to canonical ones (`PreToolUse`, `Bash`, `Write`, `file_path`, ...).
3. Policies registered for that event run: builtins (`builtin-policies.ts`, catalogue in `policy-catalog.ts`), policy packs (`pack-store.ts`, `pack-manifest.ts`), files in `.failproofai/policies/` (convention), explicit custom files, and Cloud-managed policies.
4. Each policy returns `allow()`, `deny(message)` or `instruct(message)` (`policy-helpers.ts`). README: "`deny(message)` | Block it — message goes back to the agent"; "`instruct(message)` | Let it through, but add context to the agent's next prompt".
5. `policy-evaluator.ts` renders the verdict in the shape that specific harness consumes (exit code 2 + stderr, or a JSON body, or a plugin return value). The shape differs per harness and per event; getting it wrong produces a deny that is logged but ignored (see mechanism 3).
6. Optional second tier ("Jev", `src/hooks/semantic/`): an LLM classifier asked fixed probes about the call and about what the user asked for. It can clear a deny from a policy marked `reviewable`; it cannot clear a `hard` one (`docs/policies/authority.mdx`).
7. Transport: either in-process (the hook command runs the bundled JS) or via `failproofaid`, a Rust supervisor with a warm bun worker, reached over a local socket (`crates/failproofaid`, `crates/PROTOCOL.md`). Daemon-configured scopes fail closed: `handler.ts:765` "Fail-closed: the failproofaid daemon could not be reached for this daemon-configured scope."
8. Every decision is appended to a local activity store (`hook-activity-store.ts`) which the dashboard reads.

Other in-tree components: `hermes-plugin/` (Python, in-process Hermes plugin), `openclaw-plugin/` (JS gateway plugin), `pi-extension/` (TS), `sdk/python`, `sdk/typescript`, `fp-cloud-cli/` (PyPI `fp-cloud-cli`), `integration-suite/` (live probes), `docs/` (Mintlify, 14 translated locales), `skills/` (git submodule to `failproofai/skills`, empty in a shallow clone).

The repository's own agent instructions: `AGENTS.md` (3.8 KB, "duplicates the most critical rules from CLAUDE.md") and `CLAUDE.md` (87.6 KB, 1,385 lines; sections Environment, Agent CLI integrations [835 lines], Workflow rules, Testing protocol, Project structure cheatsheet, Changelog, Version bumps).

## 3. Mechanisms

### M1. Per-host enforcement capability table, in code, with evidence per cell
- What: a typed map `ENFORCEMENT_CAPABILITY: Record<IntegrationType, Partial<Record<HookEventType, "block" | "observe">>>`. Each cell has a trailing comment naming its evidence: a source file and line in the vendor repo, a byte/char offset in a shipped closed-source bundle, or a numbered live probe. The header pins the vendor version probed for each harness ("claude 2.1.220 · codex fe01054a ... goose 1.43.0").
- Definitions (file header): "`block` — the verdict is read at a call site that prevents the action or forces the agent to continue/retry. `observe` — the action proceeds regardless ... ABSENT — NOT VERIFIED. The UI must stay silent, never assume `block`."
- Where: `src/hooks/enforcement-capability.ts` (274 lines). Published summary: `docs/reference/harnesses.mdx`, section "Enforcement capability".
- Counted from the table at this commit: `PreToolUse: "block"` on 12 of 12; `Stop: "block"` on 8 (claude, codex, copilot, cursor, openclaw, factory, devin, antigravity). Pi `Stop` is `observe` (next-turn instruction only); opencode, hermes, goose `Stop` are absent (unverified or not installed). This matches the README claim "verified on all twelve, turn-end gates on eight".
- Problem solved: the claim used to be prose and went stale. File header: "CLAUDE.md documented Hermes `subagent_stop` as a working gate while upstream discarded its return, so every customer policy on that event enforced nothing, silently, for months. A table a test can assert against cannot rot that way."
- Evidence: the table records its own corrections ("OVERTURNED from `block`" on claude `PostToolUse`, `PostToolUseFailure`; hermes `SubagentStop`; and "FIXED" on six cells where the emitted shape had been inert). Evidence is self-reported by the vendor; the byte offsets and probe logs were not independently re-checked here (Unverified). The file also states its own staleness: several codex rows cite files that "no longer exist at those paths in 0.147.0 ... treat them as due for a re-probe rather than as evidence."

### M2. "Absent means unknown" lookup rule
- What: `enforcementFor(cli, event)` returns `undefined` for any unverified pair; callers must render nothing. "Defaulting it to `block` would assert protection nobody confirmed; defaulting to `observe` would tell a user a working policy is inert."
- Where: `src/hooks/enforcement-capability.ts` (function at end); consumers `src/hooks/handler.ts:616`, `app/policies/hooks-client.tsx`.
- Problem solved: a three-valued capability (block / observe / not verified) instead of a two-valued one that silently over-claims.
- Evidence: unit test `__tests__/hooks/enforcement-capability.test.ts` asserts "returns undefined for an unverified pair rather than guessing" and "uses only block or observe — never a hedge value". No field evidence found.

### M3. Tests that pin the matrix and the emitted deny shapes
- What: (a) `__tests__/hooks/enforcement-capability.test.ts` asserts every integration is keyed, only canonical event names are used, every keyed `PreToolUse` is `block`, and specific historical findings stay recorded. (b) `__tests__/hooks/inert-deny-shapes.test.ts` asserts the evaluator emits the exact shape each harness parses, e.g. "copilot UserPromptSubmit uses {decision:'block'} at exit 0, not exit 2".
- Problem solved: a deny that is evaluated, logged and counted but ignored by the harness. The test file header: "Five events where failproofai emitted a deny the CLI does not read ... the policy ran, the evaluator produced a verdict, the activity store recorded `decision: "deny"` and telemetry counted one — and the CLI submitted the prompt or ran the command anyway."
- Evidence: the five inert shapes are documented as found and fixed (the "FIXED" comments in M1). These tests check the tool's output against a recorded expectation; they do not exercise the vendor CLI.

### M4. Daily live canary against every harness at @latest
- What: a Docker job installs all 12 agent CLIs at their latest version, drives each against a canary policy, and "confirms the hook log shows a **DENY**. A *silent-allow* — a blocked action that ran with no deny — means enforcement broke against that CLI". A dead daemon scores INCONCLUSIVE rather than PASS. Reports only state changes plus a heartbeat to Slack. A version gate skips CLIs whose version has not changed.
- Where: `integration-suite/` (`run.sh`, `probe-cli.sh`, `canary-policies.mjs`, `install-clis.sh`, `report.js`, `README.md`); `.github/workflows/integration-suite.yml` is dispatch-only. The scheduled run lives on a private "canary box" (`integration-suite/local/`).
- Problem solved: vendor hook schemas change under the tool; unit tests cannot see that.
- Evidence: the mechanism exists and is described in detail. Results are not public: the daily run is off GitHub Actions and reports to a private Slack, so pass/fail history could not be read (Unverified). It covers the pre-tool deny only: test comment "the one capability the daily suite exercises".

### M5. Always-on self-protection policy (`block-failproofai-commands`)
- What: one builtin with `alwaysOn: true`, `authority: "hard"`, matching `PreToolUse` and `PermissionRequest` on `Bash`, `Write`, `Edit`, `NotebookEdit`. It denies: any `failproofai` CLI invocation (including via `sudo`, `npx`, and shell-escaped spellings such as `fail\proofai`, by checking the raw and the shell-unescaped command), package-manager uninstall, deleting/moving/overwriting the state directory, and file-tool writes to state paths.
- Where: `src/hooks/builtin-policies.ts:2431-2500`; catalogue entry `src/hooks/policy-catalog.ts:232`; enable-set bypass `builtin-policies.ts:3355-3367`; `manager.ts:227-235` refuses to remove it from `enabledPolicies`; `pack-manifest.ts:423` forbids a pack from declaring `alwaysOn`.
- Stated rationale (README): "an agent that can pause enforcement can switch off every other policy." Deny text sent to the agent: "Pausing failproofai enforcement is a human action, not an agent one. If a policy is blocking legitimate work, say so and let the operator decide."
- Problem solved: an agent disabling its own guardrail. The code comments record three earlier holes: the predecessor regex was defeated by "a single `sudo`"; two predecessor policies contradicted each other; and the Bash-only surface "left the shortest way through this guard unguarded: the agent never needs a shell to overwrite `~/.failproofai/policies-config.json` with `{"enabledPolicies":[]}` — it just writes the file."
- Evidence: the fix history above; unit tests exist under `__tests__/hooks/`. No external red-team result found. Limits: see section 4.

### M6. Bounded, per-session pause that is not configuration
- What: `failproofai config --pause` suspends local policies for one agent session for a bounded time. Default 30 minutes, hard ceiling 8 hours ("Config may lower this, never raise it"). State is under `~/.failproofai/state/sessions/`, owner-only, keyed by session, with an absolute expiry evaluated at read time. It does not lift Cloud-managed policies or M5.
- Where: `src/hooks/session-pause.ts`, `session-pause-cli.ts`; `docs/reference/failproof-cli.mdx:99`.
- Problem solved: a human needs an escape hatch, but an off-switch written into committed config "would outlive the session that asked for it and travel to everyone who checks out the branch".
- Evidence: no evidence found beyond the design note.

### M7. Fail-closed on a declared-but-unloadable guard, narrowly
- What: if a pack recorded in `installed.json` will not load for a permanent reason (`module_not_found`, `file_not_found`, `syntax_error`, `runtime_error`, `path_missing`), the handler denies only the events and tools that pack's policies declared in `match`. A load timeout warns instead of denying. `UserPromptSubmit` never denies on this path; it instructs. An absent `installed.json` is a fresh machine, not a failure.
- Where: `src/hooks/pack-failclosed.ts`; `handler.ts:1097`.
- Problem solved: "zero enforcement at exit 0 on a machine that reports healthy". The `UserPromptSubmit` exemption is from an incident: "a blanket deny takes `UserPromptSubmit` with it and locks the user out of their agent entirely."
- Evidence: design notes cite a real-machine incident; no public postmortem read (Unverified).

### M8. Policy authority: `hard` vs `reviewable`, with named reviewers
- What: every policy is `hard` unless it declares `authority: "reviewable"` and a non-empty `reviewedBy` list of semantic checks that exist on the machine. A reviewable deny is cleared only when every named check was asked and none fired without the user having asked for the action. Any malformed declaration, unknown check name or `alwaysOn` flag makes the policy hard.
- Where: `docs/policies/authority.mdx`; `src/hooks/policy-authority.ts`, `policy-reviewability.ts`, `effective-reviewers.ts`, `src/hooks/semantic/combine.ts`.
- Problem solved: regex policies over-block (`block-kubectl` denies read-only subcommands; `block-rm-rf` "gets `rm -rf node_modules` wrong"), but letting an LLM override every rule removes the floor.
- Evidence: measured numbers quoted in `src/hooks/semantic/combine.ts:75` and `PROBE-FOLLOWUP.md`: on "the 1,332 labelled cases: real work blocked 13.9% → 8.7%", "132 of 234 attacks blocked", "70.8% label agreement". The corpus file is in the tree (`__tests__/hooks/two-tier/corpus.ts`). `PROBE-FOLLOWUP.md` says these numbers are in "the top CHANGELOG section"; a search of `CHANGELOG.md` at this commit for those figures found nothing, so the published source of the numbers is Unverified and they were not reproduced here. Note what the numbers say: 102 of 234 labelled attacks were not blocked.

### M9. Two-tier evaluation with an LLM classifier ("Jev")
- What: deterministic policies run first; a hard deny stops the call without waiting. Otherwise an LLM answers fixed probes (each with `instructions` and true/false `criteria`) about extracted facts (`facts.ts` resolves path operands and their relation to the project). A policy's evidence is the minimum over its probes; a check fires at evidence ≥ 0.7. User intent is captured from the prompt (`intent.ts`). Failproof ships no checks itself; the sixteen come from a separate pack `FailproofAI/jev-policies`.
- Where: `src/hooks/semantic/` (`policies.ts`, `decide.ts`, `combine.ts`, `facts.ts`, `intent.ts`, `preconditions.ts`, `redact.ts`, `jev-throttle.ts`); `docs/policies/jev.mdx`, `docs/reference/jev*.mdx`.
- Problem solved: judging what a command does and whether the user asked for it, which regex cannot.
- Evidence: see M8 for the corpus numbers. `PROBE-FOLLOWUP.md` shows one live call taking 495 ms. The docs record a failure measured live (section 4).

### M10. Written negative results kept in the repo
- What: `PROBE-FOLLOWUP.md` records a finding that was not fixed: `git clean -fdx` "was caught by **neither tier**", why (min-over-probes plus an empty `facts.paths`), two candidate probe edits, and the reason neither shipped: "The probe text is a calibrated classifier input ... the change needs a full corpus replay before it lands ... That is a measurement task with its own prereg, not a word edit." It then lists sibling commands with a measured coverage table and an open-items checklist.
- Where: `PROBE-FOLLOWUP.md` (repo root); the stopgap is builtin `warn-git-clean`.
- Problem solved: stops a prompt or classifier wording being edited without re-measuring; makes uncovered cases visible.
- Evidence: the document is itself the evidence; the four open items are unchecked at this commit.

### M11. Deny / instruct / allow as the whole policy vocabulary, plus where `instruct` degrades
- What: three verdicts. The docs state per harness what `instruct` really does. Hermes: "`deny()` blocks. `instruct()` does not stop the call: it runs, and the guidance is placed at the start of its result". Pi `Stop`: "a next-turn instruction, not a gate". Antigravity `UserPromptSubmit`: deny is rejected by the harness but `injectSteps` is honoured.
- Where: `src/hooks/policy-helpers.ts`; `docs/reference/harnesses.mdx`.
- Problem solved: one policy API across hosts whose hook contracts differ.
- Evidence: per-cell evidence in M1.

### M12. Post-tool "block" documented as result replacement, not prevention
- What: on codex and copilot a `PostToolUse` deny replaces the tool result the model sees; the side effect has already happened. Docs: "Post-tool blocking may replace the result shown to the model but cannot undo a tool side effect that already happened." README on `sanitize-*`: "it reports a secret in tool output rather than keeping it out of the context."
- Where: `docs/reference/harnesses.mdx:27`; README "What it stops".
- Problem solved: stops a post-hoc hook being read as a gate.
- Evidence: codex A/B live probe described in the M1 cell comment (Unverified independently).

### M13. Policy packs pinned by recorded digest
- What: `failproofai policies add <owner>/<repo>` fetches a release asset by constructed URL (no index), verifies it against a `SHA256SUMS` in the same release, records the digest in `installed.json`, and re-verifies before every import. The pack's tag must agree with the version its manifest declares.
- Where: `src/hooks/pack-store.ts`, `pack-manifest.ts`, `pack-cli.ts`.
- Problem solved: a pack changing under a machine after install; a retagged asset "stops loading rather than silently running something else".
- Evidence: the file states its own limit: "That manifest is NOT a signature: whoever controls the release controls both files, so this proves nothing about the publisher's identity ... Signing was considered and deliberately deferred."

### M14. Convention policies committed to the repo
- What: any file in `.failproofai/policies/` loads automatically; "Commit it and the whole team gets it on next pull."
- Where: `src/hooks/custom-hooks-loader.ts`, `loader-utils.ts`; `examples/convention-policies/`.
- Problem solved: team-shared guardrails without per-machine setup.
- Evidence: no evidence found. Safety consequence in section 5.

### M15. Codex managed-layer hook install
- What: Codex ≥ 0.129 skips user-level hooks until a person trusts them ("silently in headless `codex exec`"). With root, the tool writes its hooks into `/etc/codex/config.toml`, which Codex treats as managed and runs without a trust prompt. Without root, `config --status` stops counting Codex as enforcing until the hooks are trusted.
- Where: `src/hooks/codex-system-hooks.ts`.
- Problem solved: reporting enforcement that the host is silently skipping.
- Evidence: reasoning cites Codex source function names; not re-checked (Unverified).

### M16. Status reporting that refuses to over-claim
- What: `failproofai config --status` detects disabled, incomplete, duplicated or legacy installs (e.g. Hermes legacy shell hooks reported as "Hermes cron jobs are not checked"); the Hermes plugin writes a `heartbeat.json` recording the hooks Hermes accepted.
- Where: `src/hooks/config-status.ts`, `delivery-health.ts`, `health-probe.ts`; `docs/reference/harnesses.mdx:81-89`.
- Problem solved: an installed-but-inert hook.
- Evidence: no evidence found.

### M17. Offline audit of past sessions
- What: `failproofai audit` scans local session history with detectors, scores it and suggests policies.
- Where: `src/audit/` (`detectors/`, `scoring.ts`, `findings.ts`, `replay.ts`, `archetypes.ts`).
- Problem solved: choosing which policies to enable from observed behaviour.
- Evidence: no evidence found. `src/audit/social-proof.ts`, `archetypes.ts` and `lib/share-card.ts` indicate a shareable result card; treat scores as product output, not measurement.

### M18. Supply-chain gate for the tool's own dependencies
- What: OSV-Scanner on every PR, on pushes to `main` and daily, "block on any finding"; time-boxed ignores in `osv-scanner.toml` with `ignoreUntil`; Socket GitHub App as advisory; a test (`__tests__/ci/ts-sdk-fixture-pins.test.ts`) that fails if Dependabot moves a pinned fixture floor.
- Where: `SECURITY.md`, `.github/workflows/osv-scanner.yml`, `osv-scanner.toml`, `.github/dependabot.yml`.
- Problem solved: "A compromised dependency would therefore run on our users' machines and servers, inside their agent sessions".
- Evidence: changelog entries show the gate turning red and being cleared (e.g. RUSTSEC-2026-0538, GHSA-3jp2-3mrg-2vxc in the 2026-11-10 section).

### M19. Agent rules for the repository itself
- What: `AGENTS.md` non-negotiables include "Never edit a test to make it pass. Fix the code.", "CI must be green before you stop", "One PR per branch", a Docker clean-install smoke test after any change to `src/hooks/`, and an eight-item regression checklist.
- Where: `AGENTS.md`, `CLAUDE.md` ("Workflow rules", "Testing protocol").
- Problem solved: agent-authored changes breaking packaging (ESM/CJS resolution of custom policies).
- Evidence: no evidence found. Rule numbering in `AGENTS.md` skips from 1 to 3.

## 4. Known weaknesses, open issues, criticisms

Open GitHub issues and outside criticism could not be read (API blocked): Unverified. The items below are from the repository's own text and from reading the code.

- The default install enforces almost nothing. README: "Setup wires the hooks and picks **no** policies"; "Until a pack arrives, the only thing enforcing is `block-failproofai-commands`". The "40 built-in policies" need `failproofai policies add FailproofAI/policies`.
- Self-protection (M5) is pattern matching on tool names `Bash`, `Write`, `Edit`, `NotebookEdit` and on command strings. It depends on every harness's tools being canonicalised to those names. Not covered by anything read: an indirect write through an interpreter or script (`python -c`, `node -e`, a generated shell script run later), an MCP tool that writes files, or editing the harness's own hook config to remove the hook entry (the state-path regex `FAILPROOFAI_STATE_PATH_RE` was not read in full, so whether harness config files are included is Unverified). It is a deterrent against the direct routes, not a sandbox.
- Reading failproofai's own files is allowed on purpose, including the Cloud credential: `docs/reference/jev-cloud.mdx:133` "An agent on the machine can read it. `credentials.json` is owner-only, and the agent runs as that owner."
- The semantic tier can clear a real block. `docs/policies/authority.mdx` warning: "A check that scores just under its fire line does not keep the floor ... Measured live in enforce mode: an unrequested Read of `/etc/shadow` (`secret-exposure` 0.69, `read-outside-workspace` 0.37 ...)" — the reviewable deny was cleared.
- `git clean -fdx`, `git reset --hard`, `git checkout -- .`, `git restore .` were uncovered by either tier when `PROBE-FOLLOWUP.md` was written; only `git clean` got a stopgap, and it is `defaultEnabled: false`, instruct-only.
- Attack coverage on the project's own corpus is 132 of 234 (56%), with 8.7% of real work still blocked (M8). Published location of those numbers Unverified.
- Turn-end gates are capped or conditional on several hosts (M1 cell comments): Claude Code stop-hook block cap default 8 and discarded on end-turn paths; Cursor `loop_limit` default 5 and consumed only on `status:"completed"`; Devin `PermissionRequest` "never fires under --permission-mode dangerous ... and never for auto-approved read-only tools (L18, where a secret leaked)"; Codex `PreToolUse` "an empty reason silently degrades to Continue".
- The evidence in the matrix is fragile by construction: byte offsets into minified closed-source bundles at one version. The file admits codex rows are stale against 0.147.0. The public docs table carries no versions, only "Capabilities are version-sensitive. Re-test after upgrading an agent CLI".
- The matrix corrects the repo's own `CLAUDE.md` in three places (hermes `SubagentStop`, factory Stop exit code, "Goose has NO Stop event ... that is false at v1.43.0"), which shows the prose instruction file was wrong for months and may still be.
- Goose has a native blocking stop hook that the adapter does not install; Hermes `pre_verify` likewise; OpenCode `permission.ask` is declared upstream but never invoked, so that policy "does not even run".
- "Zero latency" (README) is contradicted for the semantic tier by the repo's own 495 ms measurement, and by a "150ms fail-closed budget" on the hook path (`lib/telemetry-enabled.ts`).
- The live canary's results are private, so the "verified on all twelve" claim cannot be audited from outside.
- Volume and churn: 87.6 KB `CLAUDE.md`, 1 MB changelog, 160 npm versions in 7 months, repeated same-day betas. Changelog headings are duplicated (three `1.0.14-beta.0` sections).
- Bus factor: one npm maintainer account; most human commits from one author.
- Licence restricts commercial hosting and paid support (Commons Clause); the README badge says "MIT + Commons Clause".
- `docs-old/` (a second full docs tree with translations) is still in the repository.

## 5. Anything that looks unsafe

- Remote, mutable agent instructions installed into every agent. `src/hooks/agent-skill.ts` writes a `failproofai` SKILL.md into each agent's user-scope skills folder. The body: "This skill is a pointer. Before acting on anything FailproofAI, read the full skill, which is kept current online (use your web fetch tool, or `curl -fsSL <url>`)" pointing at `https://raw.githubusercontent.com/FailproofAI/skills/main/skills/failproofai/SKILL.md`. The design note says "changing that repository changes what every machine reads next, with no release and no re-run of setup." That is an unpinned instruction channel from a third-party `main` branch into every agent on the machine. Reported as a finding; the remote file was not fetched or followed.
- Root and system-scope changes. `failproofai config` runs `sudo -v` then `sudo -n` (`src/hooks/daemon-service.ts:629-650`) to install a system-scope service (systemd / launchd), copies the daemon binary to `/opt/failproofai/<user>/bin/` and runs `restorecon` (changelog 1.0.13), and writes hooks into `/etc/codex/config.toml` so Codex runs them with no trust prompt (`codex-system-hooks.ts`). The last deliberately bypasses a host's own hook-trust review.
- Downloaded executable. `src/hooks/daemon-download.ts`: the daemon comes from npm `optionalDependencies` (`@failproofai/failproofaid-<os>-<arch>`) or from a GitHub Release asset verified against `SHA256SUMS` in the same release. Same-origin checksum, no signature. The file notes it "writes an executable that a service manager will then run at login".
- Third-party code execution in the hook path. Policy packs are JavaScript from any `owner/repo` release, imported into the process that gates every tool call; integrity is a self-published digest (M13). Convention policies in `.failproofai/policies/` are executed automatically on every hook event, so cloning and running an agent in an untrusted repository executes that repository's JS with the user's privileges. No trust prompt for this was found (Unverified whether one exists).
- Telemetry on by default. `src/hooks/fp-config.ts:442` `telemetry: { enabled: true }`. Events go to PostHog (`https://us.i.posthog.com/capture/`) with a hard-coded write key (`src/posthog-key.ts`). `hook_policy_triggered` sends event type, harness, tool name, policy name and decision (`handler.ts:1323`); comments say "never command or prompt text". Instance id is a hash of `/etc/machine-id` (or IOPlatformUUID / MachineGuid), falling back to a hash of hostname, home directory, platform, arch and CPU model (`scripts/install-telemetry.mjs`). Opt-out: `FAILPROOFAI_TELEMETRY_DISABLED=1` or `[telemetry] enabled = false`. A custom policy's name is user-chosen and is sent as `policy_name` / `hook_name`.
- Non-interactive auto-configuration. README: "Run `failproofai config` with no terminal — CI, a container, an agent driving it — and it applies rather than asking. On a machine that has never been set up, any other command runs the same wizard first; disable that with `FAILPROOFAI_NO_FIRST_RUN=1`." A first invocation of any subcommand in CI therefore edits every detected agent's config.
- Install scripts: the published `1.0.14` manifest has no `preinstall`/`install`/`postinstall` (`hasInstallScript` absent). It does have `prepare: bun run build`, which runs only for git-URL installs and local development. Install events are sent from the CLI on first run instead (`lib/install-check.ts`).
- Wide write surface in user config: hook entries in each of 12 harness configs, plugins linked into every Hermes and OpenClaw profile, a skill folder per agent. `failproofai uninstall` exists (`uninstall-cli.ts`); completeness of removal Unverified.
- Model-facing text injected by the tool: on Hermes, `instruct` prepends `failproof_policy_reminder` / "[FailproofAI policy reminder (...)]" to tool results, and "The model is told never to quote a reminder in its replies" (`docs/reference/harnesses.mdx:66-75`). This is instruction text the end user does not see in the transcript.
- Cloud path: optional enrolment sends session data to the vendor (`cloud-*.ts`, `otel-*.ts`, `crates/fpai-collect`); with Jev configured, tool-call facts and captured user intent go to an LLM provider or the vendor's cloud (`semantic/jev-client.ts`, `cloud-jev.ts`; a `redact.ts` exists). Exact fields sent: Unverified.
- No hidden instructions aimed at a reading agent were found in `README.md`, `AGENTS.md` or the parts of `CLAUDE.md` read. `AGENTS.md` contains a Next.js-generated block telling agents to read `node_modules/next/dist/docs/` before writing code; that is ordinary tool output, reported here as instruction-like text in data and not acted on. `CLAUDE.md` was outlined, not read in full (1,385 lines): Unverified for the unread parts.

## Relevance to this library (why it was shortlisted)

- The transferable pattern is M1 + M2 + M3: state, per host and per event, whether a rule has a hard overlay (`block`), an advisory one (`observe`), or is unverified (absent), cite the evidence and the host version per cell, and put a test behind the table so prose cannot drift from it. The three-valued cell is the part most often missing elsewhere.
- M5 is the model for "the agent may not switch its own enforcement off", including the lesson that file-write tools are a shorter path than the shell.
- M10 is a usable convention for recording a known gap with its measurement cost instead of patching a calibrated prompt.
- Caveats for anyone copying the matrix: the cells are vendor self-reports pinned to specific versions, some already stale; the live results are private.

<!-- END-OF-FILE -->
