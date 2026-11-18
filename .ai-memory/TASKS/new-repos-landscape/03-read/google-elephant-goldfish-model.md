# Deep read: google/elephant-goldfish-model (EGM)

- Source: https://github.com/google/elephant-goldfish-model (shallow clone, depth 50, read-only; nothing installed or executed)
- Commit read: `210977c1f76f07961d11d42b34bfd768c9267327` on `main` (2026-11-17, "Align Claude manifest author with Google LLC directory entries (#466)")
- Latest tag: `v0.1.1` -> `dea7761` (2026-11-06); earlier `v0.1.0` -> `b3a3595`. `plugin.json` version `0.1.1`.
- Date read: 2026-11-18. Role: researcher.
- Not reachable this session: GitHub REST API (issues, PRs, stars, releases page, discussions). Everything about issue content, star count and release notes is **Unverified** unless quoted from a file in the tree.

## 1. What it is, who maintains it, adoption signals

- A plugin of Markdown skills + reviewer persona prompts for coding agents. No runtime code: "EGM is a set of skills, reviewer instructions, and local documentation workflows. The runtime package does not operate a hosted service, database, analytics client, or telemetry endpoint." (`docs/privacy.md`)
- Idea: an "Elephant" (the main session, holding context) drafts a design doc; "Goldfish" (fresh-context subagents) review the document plus referenced files without the conversation; the human decides. Based on Dave Rensin's Medium essay (linked from `README.md`; essay itself not read).
- Scope is **design documents, not code diffs**. README: "The built-in draft and design-review workflow targets software specifications." Implementation is explicitly out of scope: "EGM is not opinionated here" (`docs/getting_started.md`). A code-review variant (`egm-lite`, Phase 4) is only a `Status: Proposed` design (`docs/designs/lite.md`).
- Maintainers: `google` org, Apache-2.0, "This is not an officially supported Google product" (`README.md`). `.github/CODEOWNERS` routes `.github/**` to `@google/egm-maintainers`. Design-doc authors named in `docs/designs/`: @quinnjim, @eewing314, @drensin, @briansuchy, @tearseb, @n3wth.
- Adoption as observed:
  - Stars 20.8k / created 2026-09-13: from the shortlist, **Unverified** here (API blocked).
  - Last 50 commits span 2026-11-06 to 2026-11-17 (about 4.5 commits/day). Authors in that window: n3wth / Oliver Newth 30, briansuchy 4, dependabot 3, about 11 one-off contributors. One person dominates recent work.
  - Two releases in roughly two months, both pre-1.0. `docs/releases.md`: "While EGM is pre-1.0, use patch bumps for compatible fixes and minor bumps for features or incompatible workflow changes."
  - Issue numbers referenced in-tree reach at least #376 and PRs #466, so tracker traffic is high for the age. A branch `feat/eecs481-student-contributions` exists (course-driven contributions; purpose Unverified).
  - Harnesses with a recorded end-to-end run (`TESTING.md` Harness Test Record): Antigravity CLI 1.4.5, Claude Code 2.1.308, OpenAI Codex 0.163.0 / 0.164.0-alpha, Muse 1.4.14. Partial: Claude Cowork, ChatGPT Work. Install-only: omp. Experimental: Cursor, OpenCode, Copilot, Windsurf.

## 2. How it actually works

Layout (`docs/designs/architecture.md`):
- `skills/egm-*/SKILL.md` — 7 skills: brainstorm, draft, review, review-loop, resolve, drift-report, bootstrap. All carry `disable-model-invocation: true` (user-invoked only).
- `agents/*.md` — 10 harness-neutral personas: zoom_out, inventive_catalyst, comprehension, design_critic, structural, style, implementation_readiness, codebase_details, synthesizer, bootstrap_orchestrator.
- `resources/document_standards/*.md` — 5 short rubrics (feature-spec, implementation-readiness, zoom-out, heilmeier, re-implementation), 1.1-2.9 KB each.
- Per-host adapters: `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.windsurf/`, `com.github.copilot/`, `adapters/opencode/install.py`. Rule: "No harness gets a fork of the skill text." (`docs/harnesses.md`)

Flow: `/egm-brainstorm` -> `concepts_brief.md`; `/egm-draft` -> `design_draft.md` (section by section, human gate per section); `/egm-review` -> five stages numbered 5-9, one report file per stage; `/egm-resolve` after stages 7 and 9; human PR; implement; `/egm-drift-report` periodically.

Review stages (`skills/egm-review/SKILL.md`):
- 5 Initial Zoom Out: `egm-zoom-out` + `egm-inventive-catalyst` on full file -> `zoom_out_report.md`
- 6 Comprehension: `egm-comprehension`, document only, no `GoldfishContext`, spawned directly -> `comprehension_report.md`
- 7 Critic: `egm-design`, `egm-structural`, `egm-style` on `FeatureRange` via `egm-review-loop` -> `critic_report.md`
- 8 Intermediate Zoom Out: `egm-zoom-out` again, focused on what stages 6-7 added -> `intermediate_zoom_out_report.md`
- 9 Implementation Readiness: `egm-implementation-readiness`, `egm-codebase-details`, `egm-style` on `DetailedRange` -> `implementation_readiness_report.md`

The document is split at `## Detailed Implementation Plan` (or synonyms) into `FeatureRange` and `DetailedRange`; different reviewers see different ranges.

Isolation is done by the host's subagent primitive, not by EGM. Every delegating skill repeats: "If your harness has no subagent tool, stop and tell the user: a review in the same context is not a Goldfish review." On Claude Code the adapters add frontmatter `tools: [Read, Grep, Glob]`, `model: inherit`, `omitClaudeMd: true` (`.claude-plugin/agents/zoom_out.md`), and the adapter body is a pointer: "Read `${CLAUDE_PLUGIN_ROOT}/agents/zoom_out.md` before reviewing."

## 3. Mechanisms

1. **Fresh-context reviewer, hard stop when unavailable.**
   - What: reviewers are new subagents given only task, target, persona/standard paths and an explicit reading list. No fallback to in-session review. "Do not fork the conversation or resume a previous reviewer... do not copy parent deliberation." (`docs/claude.md`)
   - Where: `## Delegation` in `skills/egm-review/SKILL.md`, `egm-review-loop`, `egm-brainstorm`; `.cursor-plugin/rules/egm.mdc` ("Do not simulate a reviewer in the parent."); `.windsurf/rules/egm.md` rule 4.
   - Problem: author session "validates its own faulty assumptions instead of detecting errors" (`architecture.md`).
   - Evidence: isolation probes only (a child asked for a parent-only marker returns `UNKNOWN`) on Claude Code, Codex, Antigravity, Muse, Devin CLI (`TESTING.md`). No measurement that isolated reviewers find more or better defects than in-session review: **no evidence found**.

2. **GoldfishContext: explicit, bounded reading list.**
   - What: reviewer context = the doc + files it links to. Links resolving inside the working directory (after following symlinks) are added automatically; links outside it and URLs need user approval; headless runs "leave them all out and keep going". URLs are saved to local files first because "Some reviewers cannot open URLs".
   - Where: `skills/egm-review/SKILL.md` Step 1.3; `egm-review-loop` Inputs.
   - Problem: reviewers need sources but not the conversation; also limits path traversal via doc links.
   - Evidence: no evidence found.

3. **Instruction-file exclusion as a separate isolation property.**
   - What: distinguishes parent-turn isolation from host-injected instruction files. Claude adapters set `omitClaudeMd: true`; requires Claude Code 2.1.271+. "Fresh conversation context does not mean that the host omits its instruction files." (`docs/harnesses.md`)
   - Where: `.claude-plugin/agents/*.md`, `docs/claude.md#reviewer-isolation`, `docs/codex.md`.
   - Problem: `CLAUDE.md`/`AGENTS.md` can carry the author's assumptions into the reviewer.
   - Evidence: Claude probe checks the reviewer "sees no parent or project `CLAUDE.md` context" (`TESTING.md`). Codex and Antigravity: explicitly unverified, with issue #237 reporting leaks (see section 4).

4. **Read-only reviewers by tool allowlist; parent is the only writer.**
   - What: Claude reviewers get `Read, Grep, Glob`; synthesizer gets `Agent, Read, Grep, Glob, Write`, no shell or MCP. OpenCode installer generates `"*": "deny"` permission blocks, denies `grep` ("grep does not enforce read rules, so it could expose .env files") and `*.env`.
   - Where: `.claude-plugin/agents/`, `adapters/opencode/install.py`.
   - Problem: a reviewer that edits the document under review or the tree.
   - Evidence: host-enforced only where the host honors it. The docs state the limits: "The adapter's rule to write only the requested report or brief is therefore an instruction, not a host-enforced limit." On Muse "Claude tool allowlists do not restrict Muse reviewers."

5. **Staged review pipeline with altitude ordering (stages 5-9).**
   - What: simplicity/scope first, then comprehension, then design critique, then a second zoom-out on what the fixes added, then implementation readiness. Single-select only, to "protect topological dependencies (5 → 6 → 7 → 8 → 9)". Four presets: interactive, uninterrupted, feature-spec only, implementation-plan only.
   - Where: `skills/egm-review/SKILL.md` Steps 2-4 and Subflows.
   - Problem: detail review of a design that should have been rejected or simplified; fixes that bloat the doc (stage 8).
   - Evidence: ordering verified by timestamps in fixtures. An "Initial stage-order failure" on Claude Code is recorded and "retained" in `TESTING.md`. Outcome quality: no evidence found.

6. **Paraphrase-first comprehension test.**
   - What: the naive reader must restate "What this proposes" and "How the existing system works, per this document" before listing findings. "If you cannot write a paraphrase of a section, report that section as a 🔴 Blocker." "A wrong paraphrase is a finding." Not routed through the synthesizer because "its report keeps only findings, and the author must see the paraphrase."
   - Where: `agents/comprehension.md`; Subflow: Comprehension Test.
   - Problem: "A list of undefined terms does not find a document whose terms are all defined but whose parts do not connect."
   - Evidence: no evidence found.

7. **Named review loop with convergence rules (`egm-review-loop`).**
   - What: re-resolve the target line range before every round; spawn reviewers; resolve; decide. Rules:
     - Settled = contested or accepted risk; not re-opened when a new reviewer raises it again.
     - Fixed is not settled: same issue at same scope after a fix re-opens it.
     - Clean round = no unsettled Blocker/Major; Nits do not block; a reviewer that did not run makes the round not clean.
     - "Converged: Two consecutive clean rounds. One clean round is not enough, because the next fresh reviewer can find a different gap in the same text."
     - Cap 5 rounds. Churn = a new finding at the scope of an applied fix that reverting the fix would resolve. On cap or churn, one question to the user: accept, continue, or return to drafting.
     - Stable finding ids `<reviewer>-<round>-<n>`.
   - Where: `skills/egm-review-loop/SKILL.md` Step 2.4.
   - Problem: fresh reviewers never return zero findings ("Fresh reviewers sample differently each round"), so "loop until clean" does not terminate.
   - Evidence: no evidence found. Inconsistency: the parent `egm-review` separately enforces "max 1 re-audit" per stage ("1-Audit Convergence Cap"), so the 5-round/two-clean-rounds rule applies only to standalone `egm-review-loop` use.

8. **Failed reviewer is "not run", never "zero findings".**
   - What: "A reviewer that times out, fails, or returns no report did not review. Retry it once... Never count it as a reviewer with zero findings." Reports carry a Reviewer Status table (`completed | not run`). Adapter rule: "If a required file cannot be read, report an incomplete review instead of a verdict."
   - Where: `egm-review-loop` 2.2.3; `agents/synthesizer.md`; `.claude-plugin/agents/*.md`.
   - Problem: silent pass when a subagent dies or cannot read its persona.
   - Evidence: Claude live probe checks the reviewer "stops without a verdict when an explicit deny rule blocks its persona" (`TESTING.md`); `tests/unit/test_claude_traces.py` requires "a matching, non-error, nonempty native tool result".

9. **Resolver taxonomy that constrains the author (`egm-resolve`).**
   - What: each finding gets exactly one of CONTEST / ESCALATE / PROPOSE FIX / DECLINE. Rules: "A contest must be checkable. 'This was intentional' is not evidence."; ESCALATE when the evidence is outside what the reviewer could read; "Do not contest a comprehension gap."; "Do not change a severity."; "You wrote the document under review. A wish to contest is not evidence that the reviewer is wrong."; "Do not add context only to satisfy a reviewer."
   - Where: `skills/egm-resolve/SKILL.md` Step 2; report `goldfish_review_report.md`.
   - Problem: the author session dismissing or downgrading findings, or padding the doc to quiet a zero-context reader.
   - Evidence: no evidence found.

10. **Human decision gates with zero-tool yield.**
    - What: after writing the report the agent must stop: "You MUST immediately yield active execution by calling zero tools in this turn payload." User picks comment-on-file / auto accept / continue / interactive breakdown. Gates carry exactly one question, no "(Recommended)" option. In drafting, "Author Decides Architecture": up to three unranked options; if asked to "just pick one", restate trade-offs and re-present the gate.
    - Where: `egm-resolve` Step 4; `egm-draft` constraint 13; `resources/execution_instructions.md`.
    - Problem: agent auto-applying fixes or making architecture choices by default.
    - Evidence: `test_scenarios.yaml` has `forbidden_pattern: "\\(Recommended\\)"` checks, but no runner executes them (see section 4).

11. **Synthesizer subagent (fan-out, dedup, report, one-line return).**
    - What: an intermediate subagent spawns reviewers, optionally "two independent instances, A and B, for each reviewer to maximize finding recall", dedups, writes the report, returns a summary "to avoid context pollution in the root conversation". Falls back to direct dispatch where nesting is unavailable (Cowork, Cursor).
    - Where: `agents/synthesizer.md`, `docs/designs/synthesizer.md`.
    - Problem: reviewer transcripts filling the Elephant's context.
    - Evidence: no evidence found for the A/B recall claim.

12. **Artifact-first delivery.**
    - What: long output goes to files (`concepts_brief.md`, `design_draft.md`, stage reports, `consolidated_review_report.md` with a Traceability Matrix), never chat. Optional `EGM artifact directory: <path>` line in prompt or instruction file; a path outside the working directory from an instruction file needs confirmation.
    - Where: Execution Constraints in each skill; `docs/harnesses.md#artifact-directory`.
    - Problem: "Chat Dump Fatigue".
    - Evidence: no evidence found.

13. **Anti-sycophancy constraints.**
    - What: "Never agree by default", "Critique First", banned adjectives ("brilliant," "great," "smart," "correct," "perfect"...), banned apologies, one question per turn, contradiction audit ("you MUST NOT modify any files" on detecting a contradiction with earlier goals).
    - Where: `egm-review`, `egm-draft`, `egm-brainstorm` constraints; `resources/execution_instructions.md`.
    - Evidence: no evidence found.

14. **Document standards as pass/fail rubrics.**
    - Zero-Decision Rule: "The plan must leave zero design or architectural choices to the implementer." Plus an exact file list (Create/Modify/Delete) "suitable for enforcing a Phase 5 write allowlist" (`implementation-readiness-standard.md`).
    - Alternatives Rule: fails if "it proposes a single path without proving that other viable designs were considered"; rejections may not be attributed to a maintainer without a link (`feature-spec-standard.md`).
    - Zoom Out: context sufficiency precheck ("the review must fail immediately with a request for context"), YAGNI, altitude control, reuse (`zoom-out-standard.md`).
    - Evidence: no evidence found. The Phase 5 allowlist is not enforced: "This is a convention, and nothing enforces it." (`architecture.md`)

15. **Codebase-details reviewer (doc vs code at review time).**
    - What: checks every cited file/function/endpoint exists; "Contradicts the Code... Report as 🔴 Blocker: every later reader inherits the false statement." Guard against false positives: "Proposed files are not findings."; if the plan does not mark files Create/Modify/Delete, report once as Major.
    - Where: `agents/codebase_details.md`.
    - Evidence: no evidence found.

16. **Style reviewer with claim calibration.**
    - What: classifies caveats and claims as `DROP | CALIBRATE | RELOCATE | KEEP`; requires "every claim about existing or tested behavior to match its evidence".
    - Where: `agents/style.md`.
    - Evidence: no evidence found. The repo's own docs follow it (hedged, limits stated).

17. **Spec-to-code drift report (`egm-drift-report`).**
    - What: for each doc in a directory, sequentially: read doc, locate source by search, read current code, report only differences in four categories (Missing Features, Incomplete Models, Logic Shortcuts, Architectural Divergence). Appends to `{YYYY-MM-DD}_DRIFT_REPORT.md` with `## <DOC>` + bullets or "No drift detected". Also reports reverse coverage: "If there is some part of the logic that is not referenced in a design or README, this is a reportable drift." Human chooses to fix doc or code. Recommended weekly, not enforced.
    - Where: `skills/egm-drift-report/SKILL.md` (3.2 KB, the smallest skill); `docs/designs/drift_report.md`.
    - Problem: stale specs misleading later agents.
    - Evidence: none, and the design doc says so: "no drift-specific tests" and "no in-repo runner executes the assertion". Note it runs in the **main context, not a Goldfish**; `.windsurf/rules/egm.md` lists it among skills run "in the active session". It is a prompt, not a tool: no parsing, no hashing, no CI hook.

18. **Brainstorm: clarification gate then 7-lens swarm.**
    - What: multi-turn open-ended questioning, no multiple choice during exploration; explicit readiness gate before any subagent spawn; then seven lenses (YAGNI, cost/tokens, UX, migration, observability, tech debt, TRIZ "Inventive Catalyst") in `Mode: BRAINSTORM`.
    - Where: `skills/egm-brainstorm/SKILL.md`; `agents/inventive_catalyst.md`.
    - Evidence: no evidence found. Count mismatch: the skill lists 7 reviewers; the Muse fixture ran "6 brainstorm" reviewers (`TESTING.md`).

19. **Bootstrap: bottom-up README generation with a safety gate.**
    - What: BFS directory discovery ("never run a recursive search such as `find` or `ls -R`"), skip symlinks, honor `.gitignore`/`.egmignore`; pause for approval above 15 directories; parallel workers return JSON `subtree_index` (path, summary, interface, invariants, side_effects); "No Code Generation"; "Do not perform any version control commits".
    - Where: `skills/egm-bootstrap/SKILL.md`, `references/worker-return.schema.json`, `agents/bootstrap_orchestrator.md`.
    - Evidence: no evidence found. `TESTING.md` records bootstrap as not tested on Antigravity and "larger than the load limit" (now guarded by mechanism 20).

20. **Repo's own verification discipline (transferable eval method).**
    - Harness Test Record table: host, version, date, install, per-skill result, limits; "Write `not run` for a check that you did not run." (`AGENTS.md`)
    - Evidence must be native tool traces: "Child-written receipts and parent summaries cannot substitute for unavailable tool records." "A persona read request alone is not a successful read."
    - Offline unit tests on prose: frontmatter schema, link integrity, manifest version parity, scenario-file structure, `test_skill_body_fits_antigravity` (SKILL.md body <= 24,000 bytes), packaging boundaries.
    - Where: `TESTING.md`, `tests/unit/`, `tests/integration/test_claude.py`, `test_codex.py`.
    - Evidence: this is the best-evidenced part of the repo; it verifies that the workflow ran and was isolated, not that it improves designs.

21. **Contribution governance for agent-written PRs.**
    - What: "No Autonomous PRs"; human accountability box; pasting model answers into review threads prohibited; two-stage track (design-doc PR then implementation PR) above 100 non-test lines or 3 core files; "No Artificial PR Splitting".
    - Where: `AGENTS.md`, `AI_POLICY.md`, `.github/workflows/pr-scope-advisory.yml`.
    - Evidence: no evidence found.

22. **CI "Stage-1 Goldfish PR Review" (Gemini, two-pass).**
    - What: `pull_request_target` workflow checks out the trusted default branch only, runs a stdlib-only planner that calls the Gemini API with a pass-1 review and a pass-2 "disproof" prompt, wraps PR text in per-call random-nonce tags (`_wrap_untrusted_block`), filters findings citing non-existent paths, neutralizes @mentions, then a separate checkout-free job posts. Max 5 comments.
    - Where: `.github/workflows/pr-triage-review.yml`, `.github/scripts/review_pr.py` (1,798 lines).
    - Problem: maintainer triage load; prompt injection from PR bodies.
    - Evidence: a bypass was already fixed, commit `72d06f5` "Fix bare-mention neutralization bypass via stray fence backtick (#439)". Finding quality: no evidence found. Repo CI only; not shipped in the plugin.

23. **Release provenance.**
    - What: per-host runtime ZIPs, `SHA256SUMS`, GitHub artifact attestation, draft-then-manual publish, tags never moved; packer refuses packages containing hooks ("Directory packages cannot contain hooks", `scripts/pack_plugin.py:84`).
    - Where: `docs/releases.md`, `.github/workflows/release.yml`, `scripts/`.
    - Evidence: the docs limit their own claim: "Attestations do not establish host support or prove that the code is safe."

## 4. Known weaknesses, open issues, criticisms

- **No outcome evidence anywhere.** No benchmark, ablation, defect-escape number or postmortem showing the fresh-context review catches more than a same-session review. `docs/faq.md` concedes: "Completing the EGM workflow alone does not demonstrate a productivity improvement." `architecture.md` asserts direct-to-code "Results in higher comment density per kLOC" with no source.
- **Behavioral scenarios are not executed.** `skills/*/test_scenarios.yaml` are regex assertions with `eval_type: "deterministic"`; `drift_report.md` states "no in-repo runner executes the assertion". `docs/designs/review.md` still describes the file as a "Benchmark test suite evaluating model review precision and recall", which overstates it.
- **Isolation is partial and host-dependent.** Issue #237 (as cited in `docs/harnesses.md`; issue text Unverified): Codex CLI 0.166.0 "supplied project and user `AGENTS.md` files despite `fork_turns: "none"`"; Antigravity injects project `AGENTS.md` and `GEMINI.md`. "No host-specific exclusion control is verified here for Codex or Antigravity." Only Claude Code has a tested instruction-file exclusion.
- **Context isolation is not filesystem isolation.** "reviewers can read accessible files" (`docs/claude.md`). A reviewer can read `concepts_brief.md`, earlier stage reports or any notes in the workspace; nothing prevents it beyond instruction.
- **Open verification gaps:** #105 Cowork (stage 8 interrupted by usage limit, stage 9 unverified), #106 ChatGPT Work (child traces outstanding), #60 exact installed-bundle verification, #252 Muse routing, #196/#220 agy prefix handling. Standalone Antigravity IDE unsupported (no `invoke_subagent`).
- **Cost and volume.** A full review spawns 9+ subagents (15-16 with brainstorm); Codex fixture took 573 s and consumes model quota. Docs warn "This will provide *a lot* of feedback by design. Take what you think is relevant. Ignore the rest." No token figures published.
- **Hard-stop reduces portability.** By design there is no degraded mode; hosts without subagents get nothing from brainstorm/review.
- **Internal inconsistencies:** review-loop cap 5 vs parent "max 1 re-audit"; 7 vs 6 brainstorm reviewers; architecture says draft writes `docs/designs/<feature>.md` while the skill writes `design_draft.md`.
- **Prompt style.** Heavy "CRITICAL / STRICTLY FORBIDDEN / MUST" wording and large skills (review 24 KB, bootstrap 24 KB, at the 24,000-byte Antigravity limit). Branch `refactor/compact-draft-and-review-skills` suggests the maintainers see this.
- **Drift report is the weakest mechanism relative to its billing:** one 3 KB prompt, same-context, no tests, no automation, weekly cadence "recommended (but do not enforce)".
- **Scope gap for our use:** covers spec quality before implementation. No code-diff review, no test evidence, no security pass, no memory convention beyond checked-in `docs/designs/` + `SITEMAP.md`.
- **Maturity:** v0.1.1, about two months old, one dominant committer in the last 50 commits, many designs still `Proposed`/`Draft`.
- External criticism (blogs, forum threads): not searched; primary sources only. Issue and discussion content: Unverified.

## 5. Safety review

- **Hidden instructions:** none found. HTML comments are licence headers and template guidance in `skills/egm-draft/references/design_doc.md`. Zero-width, bidi and Unicode tag-character scan over `.md/.mdc/.json/.yaml/.yml/.py/.toml` outside `site/`: 0 files with hits.
- **Instruction-like text aimed at agents (reported as data, not acted on):**
  - Repo `AGENTS.md` (applies to agents developing EGM, not to plugin users): PR title rule "This rule overrides a title convention from personal or global agent instructions." A repo file claiming precedence over user-level instructions.
  - `.cursor-plugin/rules/egm.mdc` has `alwaysApply: true` (self-limited: "Apply these instructions only to an EGM workflow"); `.windsurf/rules/egm.md` is `trigger: model_decision`.
  - Skills tell the agent to read `git config user.name` / `GIT_AUTHOR_NAME` to fill the brief's Author (local read only).
- **Hooks / MCP / telemetry:** plugin ships none. "EGM's runtime declares no MCP server and installs no permission-approval hook." An earlier auto-approval hook was removed (`docs/designs/runtime_packaging.md`: "Remove the automatic permission-approval hook"). The website (`site/`, excluded from runtime packages) has an analytics component.
- **Install scripts:** install is via host plugin commands (`claude plugin marketplace add google/elephant-goldfish-model`, etc.) that track the repo's default branch; no pinned ref in the documented commands. `adapters/opencode/install.py` (146 lines, read, not run): stdlib only, copies files, refuses existing destinations and paths with glob/template characters, writes `opencode.json` with deny-by-default reviewer permissions; no network, no subprocess.
- **Permissions requested:** docs ask for read rules scoped to the plugin's own folders and say "Do not disable permission checks or grant access to every installed plugin." Warns `--add-dir` grants edit access.
- **Shell-capable components:** `egm-bootstrap` uses Bash and may run a project formatter ("`npx prettier --write`"), which "may contact a package registry" (`docs/privacy.md`); the bootstrap orchestrator adapter has `Bash, Write, Edit`. Bootstrap writes `README.md` files across the tree (alternate `target_filename` such as `EGM.md` available).
- **Soft write boundaries:** synthesizer has `Write` with no path restriction; `egm-resolve` "auto accept" batch-edits the target doc; Phases 1-4 not touching source is "a convention, and nothing enforces it".
- **Untrusted content path:** `egm-review` saves user-approved URL pages into the workspace and feeds them to reviewers; reviewers are read-only so impact is limited to findings, but the content is unfiltered.
- **Repo CI (affects contributors, not users):** two `pull_request_target` workflows with `zizmor: ignore[dangerous-triggers]`; mitigations are trusted-branch checkout, `permissions: {}` at top level, `persist-credentials: false`, SHA-pinned actions, split plan/post jobs. `GEMINI_API_KEY` is present in the job that sends PR diffs to the Gemini API. OpenSSF Scorecard workflow present.
- No `SECURITY*` file anywhere in the tree at this commit.

## Takeaways for this library (researcher view, not a decision)

- Candidates worth evaluating against our rework loop: two-consecutive-clean-rounds convergence + settled/fixed/churn definitions (mechanism 7); "not run is not zero findings" with a reviewer status table (8); CONTEST-needs-reviewer-readable-evidence and no severity changes by the author (9); paraphrase-first comprehension check (6); separating parent-turn isolation from instruction-file exclusion and recording each per host (3, 20).
- Not a fit as-is: it reviews design docs only, has no outcome data, and its drift report is an untested prompt.
- Open question for a decision: whether a hard stop without fresh contexts is preferable to our current fallback (fresh session -> in-session adversarial re-read). EGM offers no data either way.

<!-- END-OF-FILE -->
