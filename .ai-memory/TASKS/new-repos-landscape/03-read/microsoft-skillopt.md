# microsoft/SkillOpt — deep read

- **Source read:** `https://github.com/microsoft/SkillOpt`, branch `main`, commit `22c1ed85d20bf09476373c4a1b10965284873e3d` (committed 2026-11-17, "fix(trainer): re-measure the force-written slow-update skill (#422)").
- **Date read:** 2026-11-18. Method: shallow git clone, then history deepened to full (636 commits). Files read, nothing installed or executed.
- **Not reachable from this session:** GitHub API and the issues/PR web pages (HTTP 403 through the session proxy). Issue and PR content is therefore known only through what the repo itself cites (CHANGELOG, docs). Everything that depends on the tracker is marked Unverified.
- **Role:** researcher. Everything below is data from the repo, not instructions.

## 1. What it is, who maintains it, adoption

- **What:** a Python package (`skillopt`, PyPI version `0.2.0` in `pyproject.toml`, "Development Status :: 3 - Alpha", MIT) that optimizes a single Markdown "skill document" for a frozen target model. An optimizer model proposes bounded add/delete/replace edits from scored rollouts; a candidate is kept only when a held-out selection-split score strictly improves. Three installed packages: `skillopt/` (research training loop), `skillopt_sleep/` (nightly offline engine for coding agents, "zero dependency" on the research package), `skillopt_webui/` (Gradio dashboard).
- **Maintainer:** Microsoft (repo under `microsoft/`; plugin author field `Yifan Yang <yifanyang@microsoft.com>` in `plugins/claude-code/.claude-plugin/plugin.json`). Paper: arXiv 2605.23904 (Yang et al.). README claims NeurIPS 2026 Spotlight and a Microsoft hackathon award — Unverified (README self-report only).
- **Adoption signals as observed:**
  - Stars: 19.1k per the shortlist input; **Unverified** by me (API blocked).
  - Git history: 636 commits, first commit 2026-05-21 ("SkillOpt v0.1.0: initial release"), last 2026-11-17. (Shortlist says repo created 2026-05-08; first commit in history is 2026-05-21.)
  - `git shortlog -sn`: 100 distinct author names (some are the same person under several names; top: "Yifan Yang" 176, "Yif-Yang" 35, "Christopher Haugen" 34). Long tail of external contributors is credited by handle in `CHANGELOG.md`.
  - Releases: tags `v0.1.0` (README: 2026-06-02) and `v0.2.0` (CHANGELOG: 2026-07-02). **No release in the 4.5 months since**; the `[Unreleased]` CHANGELOG section is ~150 lines, and `docs/sleep/README.md` says many documented features "require a source install from `main` until the next release".
  - README lists third-party integrations (gbrain, gbrain-evals, darwin-skill) — Unverified beyond the README links.
  - CI: `.github/workflows/ci.yml` runs pytest on Python 3.10/3.11/3.12, a Gradio matrix, and `mkdocs build --strict`; actions are pinned by commit sha. ~200 test files under `tests/`.

## 2. How it actually works

### 2a. Research training loop (`skillopt/`)

`docs/guide/training-loop.md` gives the loop: per step `Rollout → Reflect → Aggregate → Select → Update → Gate`; per epoch boundary `Slow Update` and `Meta Skill`. Orchestrated by `skillopt/engine/trainer.py` (2,596 lines).

- **Rollout:** target model runs a batch of train tasks with the current skill as prompt; each task yields a trajectory plus `hard` and `soft` scores (`skillopt/envs/<bench>/rollout.py`, `evaluator.py`).
- **Reflect:** optimizer model reads minibatches of trajectories and emits JSON patches. Prompt `skillopt/prompts/analyst_error.md`: "Propose skill edits that address the COMMON patterns — not individual edge cases", "do not hardcode task-specific values", "Produce AT MOST L edits". Edit ops: `append`, `insert_after`, `replace`, `delete`.
- **Aggregate:** hierarchical merge of patches (`skillopt/gradient/aggregate.py`, prompts `merge_*.md`).
- **Select:** `skillopt/optimizer/clip.py` `rank_and_select` — if the pool exceeds the budget, an optimizer LLM call ranks edits and the top-L are kept; on any exception it falls back to "simple truncation" (`edits[:max_edits]`).
- **Budget schedule:** `skillopt/optimizer/scheduler.py` — "The 'learning rate' in ReflACT is the maximum number of skill edits allowed per optimization step"; `constant`/`linear`/`cosine`/`autonomous` (`NO_LIMIT = 999`). Defaults in `configs/_base_/default.yaml`: `learning_rate: 4`, `min_learning_rate: 2`, `lr_scheduler: cosine`, `num_epochs: 4`, `batch_size: 40`.
- **Update:** `skillopt/optimizer/skill.py` applies edits by exact text match; edits whose target overlaps a protected region are skipped.
- **Gate:** `skillopt/evaluation/gate.py` is a pure function. Core: `if cand_score > current_score:` accept (and `accept_new_best` if also `> best_score`), else `reject`. Metric `hard` (default), `soft`, or `mixed` = `(1 - w) * hard + w * soft`. Selection scores are cached by skill-text hash (`sel_cache` in `trainer.py`).
- **Slow update / meta skill:** see mechanisms 6 and 7.
- **Output:** `best_skill.md`; README: "typically 300–2,000 tokens", "zero inference-time model calls at deployment". Checked-in reference skills in `ckpt/*/gpt5.5_skill.md` are 306–2,034 words.

### 2b. Nightly engine (`skillopt_sleep/`)

`skillopt_sleep/cycle.py` docstring: `harvest -> mine -> replay -> consolidate(gate) -> stage (-> optional adopt)`.

- **Harvest** (`harvest*.py`): reads local transcripts read-only (Claude Code `~/.claude/projects/*/*.jsonl`, Codex, VS Code Copilot, Copilot CLI, Cursor, Pi, OpenCode SQLite). Drops engine-generated sessions by a producer prefix (`[skillopt-sleep:claude-engine:v1]`).
- **Mine** (`mine.py`, `llm_miner.py`): turns session digests into `TaskRecord`s with checkable references (rule checks such as regex / `section_present`, exact, rubric). `assign_splits` hashes task ids into train/val/test.
- **Replay** (`replay.py`, `backend.py`, 2,939 lines): re-runs tasks through a backend (`mock` default, or `claude`, `codex`, `copilot`, `cursor`, `pi`, `opencode`, `handoff`) under the current skill + memory.
- **Consolidate** (`consolidate.py`): "proposes bounded edits from replayed failures, applies them to a candidate skill/memory, then **gates** the candidate on a held-out slice of the user's own tasks. Only a candidate that strictly improves the held-out score is accepted". Skill and memory are gated as separate trials.
- **Stage / adopt** (`staging.py`, 3,285 lines): "the cycle never mutates the user's live CLAUDE.md / SKILL.md. It writes proposals + a human-readable report into a staging directory; a separate, explicit `adopt` step copies them over the live files after taking a backup."
- Sleep defaults (`skillopt_sleep/config.py`): `backend: mock`, `gate_mode: on`, `gate_metric: mixed`, `edit_budget: 4`, `val_fraction: 0.34`, `test_fraction: 0.0`, `max_tasks_per_night: 40`, `max_tokens_per_night: 400_000`, `auto_adopt: False`, `redact_secrets: True`, `dream_rollouts: 1`, `recall_k: 0`.

## 3. Mechanisms

1. **Strict-improvement validation gate.**
   - What: a candidate skill replaces the current one only if its selection-split score is strictly greater; ties are rejected.
   - Where: `skillopt/evaluation/gate.py` (`evaluate_gate`); vendored copy `skillopt_sleep/gate.py`; called from `skillopt/engine/trainer.py` and `skillopt_sleep/consolidate.py` (`_gate_apply`).
   - Problem: an optimizer that accepts its own edits unconditionally can adopt a plausible but wrong rule.
   - Evidence: `docs/sleep/RESULTS.md` §1 — GPT-5.4-nano on SearchQA, same nights and candidate edits: no gate `0.554 → 0.026` (−52.8 pt), gate on `0.570 → 0.570`. Single seed, degraded single-sample reflection, vendor-run. Counter-evidence from the vendor's own blog (`blog/gating-reflection-safe-updates/index.html`): "Accept Every Edit" scored higher than the fully gated baseline for gpt-5.5 on all three benchmarks (+0.9/+3.2/+1.4 pt on an oracle diagnostic); the blog calls hard gating "a stability control rather than assuming one policy dominates". Raw artifacts for those 499 runs "are not included in the public repository".

2. **Edit budget as "learning rate" with a decay schedule.**
   - What: caps edits applied per step (default 4, cosine decay to 2); LLM ranking picks which edits survive the cap.
   - Where: `skillopt/optimizer/scheduler.py`, `skillopt/optimizer/clip.py`; Sleep: `edit_budget` in `skillopt_sleep/config.py` ("textual learning rate (max edits/night)").
   - Problem: unbounded rewrites make a regression impossible to attribute and let the document drift.
   - Evidence: `docs/guide/dl-analogy.md` asserts "Cosine schedule > constant" and "Moderate LR (4-16) > very high/low" "from our experiments" — no numbers in the repo; paper ablations Unverified (paper not read, not a repo source).

3. **Rejected-edit buffer (step buffer).**
   - What: within an epoch, each step appends failure patterns and, on reject, the rejected edits with `score_before`/`score_after`; this is formatted into the optimizer's context: "Use it to avoid repeating ineffective edits and to prioritise failure patterns that remain unsolved." Also persisted as `trajectory_digest.json` per step. Reset each epoch.
   - Where: `skillopt/engine/trainer.py` (`_format_step_buffer`, `_extract_failure_patterns`, `step_buffer`).
   - Problem: the optimizer re-proposing the same edit the gate already rejected.
   - Evidence: no evidence found in the repo. Note: **the Sleep engine does not have this feedback loop** — in `skillopt_sleep/` rejected edits are only reported (`report.md`, `--json`), not fed back to the optimizer (no reference in `prompts.py`, `dream.py`, `rollout.py`).

4. **Three-way split with a held-out test never used for selection.**
   - What: train drives reflection, val/selection gates, test is scored only at the end. Split manifests with ID lists and SHA-256 digests are checked in.
   - Where: `data/*/split_manifest.json`, `skillopt/datasets/`; Sleep: `mine.py` `assign_splits` (stable hash of task id keeps a task in the same split across nights; synthetic "dream" tasks only ever go to train).
   - Problem: selection on the data you report on.
   - Evidence: tests `tests/test_holdout_integrity.py`, `test_split_exposure.py`, `test_split_hardening_2x3.py` exist (not run by me). Sleep default `test_fraction: 0.0`, so by default there is no final held-out measure in nightly use.

5. **Holdout-leak detection and fail-closed evidence checks (Sleep).**
   - What: `_split` returns `holdout_leaked=True` when val is not disjoint from train by id or by normalized content ("a non-disjoint comparison cannot detect overfitting, so the caller must not treat it as validation"); judge scores outside 0..1 or non-finite fail closed; recall cannot bring a content twin of a held-out task into training; a self-reported `TOOL_CALL:` marker is not credited.
   - Where: `skillopt_sleep/consolidate.py` (`_split`, `task_content_key`), `judges.py`, `dream.py` (`recall_similar`).
   - Problem: with tiny per-user task sets, a gate can silently score the tasks the edits came from.
   - Evidence: CHANGELOG `[Unreleased] Fixed`: "Close four ways invalid evidence could reach the SkillOpt-Sleep gate" (#310) — i.e. these were real defects found after release.

6. **Slow update (epoch-level longitudinal guidance in a protected region).**
   - What: from epoch 2, rolls out previous-epoch and current skill on the same 20 train samples, classifies improved / regressed / persistent-fail / stable-success, and writes a guidance block between `<!-- SLOW_UPDATE_START -->` and `<!-- SLOW_UPDATE_END -->`. The prompt makes the optimizer first evaluate whether its previous guidance "helped or hurt".
   - Where: `skillopt/optimizer/slow_update.py`, `skillopt/prompts/slow_update.md`; Sleep: `skillopt_sleep/slow_update.py`.
   - Problem: cross-epoch forgetting / drift from many local patches.
   - Evidence: mixed. `docs/guide/training-loop.md`: paper numbers used the gated mode (`slow_update_gate_with_selection: true`), but **the current default is `false`** — guidance is written without a gate. CHANGELOG fix #404 (the HEAD commit, #422, is a follow-up): in that default mode the current score was stale and the cache stored a soft score of `0.0` for the new skill, so later gates compared against a number the skill never achieved.

7. **Meta-skill memory (optimizer-side strategy notes).**
   - What: from the end of epoch 2 the optimizer writes a compact memory comparing epochs; it is injected as context into later reflect/rank/update calls. It is not part of the deployed skill.
   - Where: `skillopt/optimizer/meta_skill.py`, `skillopt/prompts/meta_skill.md`.
   - Problem: the optimizer has no memory of what kinds of edit worked.
   - Evidence: `dl-analogy.md` claims "Meta skill memory improves reflection"; no numbers in the repo.

8. **Protected regions in the skill document.**
   - What: step-level edits cannot target text inside `SLOW_UPDATE` or `APPENDIX` markers; appends are inserted before the earliest protected region; markers are stripped from edit content. Sleep equivalent: all learned content lives between `<!-- SKILLOPT-SLEEP:LEARNED START -->` / `END -->`, "Hand-edits outside this block are never touched."
   - Where: `skillopt/optimizer/skill.py` (`_PROTECTED_REGIONS`, `_is_in_protected_region`); `skillopt_sleep/memory.py`.
   - Problem: one writer clobbering another's section, or the tool clobbering hand-written content.
   - Evidence: three post-release bug fixes in CHANGELOG show the boundary leaked: a `replace`/`delete` straddling the start marker could expose protected content; `insert_after` with a newline-terminated target could land inside a protected region (#407); an orphan start marker used to truncate the rest of the user's document (#412, comment in `memory.py`).

9. **Skill-aware reflection (defect vs lapse routing) with appendix consolidation.** Off by default.
   - What: classifies a failure as `SKILL_DEFECT` (edit the body) or `EXECUTION_LAPSE` (add a reminder to a protected appendix); optional LLM consolidation when the appendix exceeds N notes.
   - Where: `skillopt/optimizer/skill_aware.py`, `appendix.py`; config `optimizer.use_skill_aware_reflection`.
   - Problem: adding rules for failures where the skill already said the right thing.
   - Evidence: blog Part II (descriptive, no public raw data). Blog caveat: "SAR appendix reminders are not separately governed by the validation gate"; unconsolidated success-and-failure SAR showed a best-on-val/final gap of 70.87% / 56.60% (gpt-5.4-mini, SearchQA).

10. **Best-vs-current snapshots and "best-on-val vs final" reporting.**
    - What: keeps a validation-best snapshot separate from the last current skill; final evaluation reports both. Blog warns that `max(best-on-val, final)` "is an oracle diagnostic ... not a deployable selection rule".
    - Where: `skillopt/engine/trainer.py`, `docs/guide/training-loop.md` ("Why current and best are separate").
    - Problem: ungated paths (gate off, default slow update) can degrade the final skill after a good checkpoint.
    - Evidence: blog §1.3 endpoint-gap table (vendor data, not reproducible from the repo).

11. **No-regression gate option (Sleep).** Off by default.
    - What: with `gate_no_regression: true`, "every validation task must preserve or improve its score"; a missing or non-finite task score also blocks.
    - Where: `skillopt_sleep/consolidate.py` (`_task_deltas`, `blocked_by_regression`); `tests/test_gate_no_regression.py`.
    - Problem: an aggregate gain hiding a per-task regression.
    - Evidence: no evidence found.

12. **Leave-one-out edit ablation (Sleep, report-only).** Off by default.
    - What: after all gate decisions, replays each accepted candidate minus each edit and records `higher_with_edit` / `no_change` / `lower_with_edit` / `unmeasured`.
    - Where: `skillopt_sleep/consolidate.py` (`_ablate_edits`, `run_edit_ablations`).
    - Problem: several edits accepted together; no per-edit attribution.
    - Evidence: the docs argue against over-reading it: "Read every row as an observed change on one replay, not a causal attribution"; rows "lean toward `higher_with_edit`" because the "with" score was selected for being high.

13. **Stage-then-adopt with backups, manifests and transactions (Sleep).**
    - What: a night writes `proposed_SKILL.md` / `proposed_CLAUDE.md`, `report.md`, `report.json`, `manifest.json`, `diagnostics.json` into `<project>/.skillopt-sleep/staging/<timestamp>/`; live files change only on `adopt` (or opt-in `--auto-adopt`). Adoption uses "a versioned fail-closed manifest, provenance hashes, canonical target pins, immutable backups/receipts, cross-night locking".
    - Where: `skillopt_sleep/staging.py`, `skillopt_sleep/__main__.py`, `docs/sleep/multi-skill-staging.md`.
    - Problem: an unattended optimizer writing straight into instruction files.
    - Evidence: no measured evidence; CHANGELOG records a confinement hardening (destinations now derived from the caller, manifests without `project_root` "fail closed").

14. **Evidence chain (`evidence.jsonl`).**
    - What: per-night append-only log of harvest, mining, replay, reflection and gate events with redacted, truncated prompt and reply copies.
    - Where: `skillopt_sleep/evidence.py`; `evidence_log: True` by default.
    - Problem: a night that ends 0.0→0.0 is otherwise a black box.
    - Evidence: no evidence found. The docs flag it as "sensitive local data".

15. **Optimizer-feedback boundary (verifier leakage control).**
    - What: reflection gets a semantic description of a failed check, not the raw judge evidence; for non-rule judges it gets only "The response did not satisfy the task's evaluation criteria."
    - Where: `skillopt_sleep/types.py` / `judges.py` (`optimizer_feedback`), `tests/test_optimizer_feedback_flow.py`; described in `docs/sleep/README.md`.
    - Problem: the optimizer writing a rule that imitates the checker's regex instead of the behavior.
    - Evidence: one deterministic synthetic test (score 0.0→1.0 with no regex in the proposal). Docs state this "does **not** establish that optimization quality is preserved for non-rule tasks".

16. **Token / time budget per night.**
    - What: `max_tokens_per_night` (400k) and optional minutes; checked before each replay; a skipped epoch is labelled `budget_exhausted` and its scores are not reported as results.
    - Where: `skillopt_sleep/budget.py`, `consolidate.py` (`BUDGET_EXHAUSTED`).
    - Problem: unattended runs with unbounded spend.
    - Evidence: no evidence found. Copilot and some CLI backends "report no token counts", so the budget cannot bind there.

17. **Multi-rollout contrastive reflection, dream variants, recall (Sleep, opt-in).**
    - What: run each train task K times and reflect on good-vs-bad contrast; add synthetic task variants; recall the K most similar past tasks.
    - Where: `skillopt_sleep/rollout.py`, `dream.py`.
    - Problem: single-sample reflection gives no contrast.
    - Evidence: `docs/sleep/RESULTS.md` §5, 18-cell sweep: mean Δ −2.66 (single-sample) → +0.24 (K=5) → +0.53 (K=5 + recall); in the best recipe 7/18 cells gained more than 0.5 pt and 7/18 lost more than 0.5 pt. Single seed; a 3-seed check on one cell gave −1.9 / +3.6 / +4.7. The gains come from experiment values, **not the shipped defaults** (`dream_rollouts=1`, `recall_k=0`).

18. **Paired A/B evalkit.**
    - What: McNemar's test plus percentile-bootstrap CI on a fixed task manifest, task-cluster multi-seed, `--aa` identity check. "It does not change the nightly gate."
    - Where: `skillopt_sleep/evalkit.py`, `docs/sleep/evalkit.md`.
    - Problem: claiming "B beats A" from unpaired or single-seed numbers.
    - Evidence: fixtures only (`tests/fixtures/evalkit/`). Community contribution; not applied to the published results.

19. **Offline reproducibility checker.**
    - What: reads split manifests, saved per-item scores and summaries; exit 0 PASS / 1 FAIL / 2 MISSING; an evidence sidecar must classify artifacts `RECORDED` / `RECONSTRUCTED` / `MISSING`; "missing fields remain MISSING, never inferred."
    - Where: `scripts/check_reproducibility.py`, `docs/guide/offline-reproducibility.md`.
    - Problem: an audit request (issue #158, content Unverified) about reproducing reported numbers.
    - Evidence: the shipped fixture is synthetic and itself reports MISSING.

20. **Handoff backend.**
    - What: no model subprocess or API key; the engine writes pending model calls to `PROMPTS.md` / `pending.json` (exit code 3), the user's own agent session writes `answers/<id>.md`, re-running resumes statelessly. Mined tasks are pinned per night; the Claude Code command uses "fresh-context subagents to protect the held-out gate".
    - Where: `skillopt_sleep/handoff_backend.py`, `plugins/claude-code/commands/skillopt-sleep-handoff.md`.
    - Problem: running the cycle with no separate key, without the answering session seeing held-out tasks.
    - Evidence: no evidence found.

21. **Replay isolation rules per backend.**
    - What: Claude replay uses `--bare` with an API key, else `--safe-mode` only if the CLI advertises it; "A missing, failed or timed-out probe refuses replay; it never falls back to an unisolated call." Selected modes are recorded in `diagnostics.json`.
    - Where: `skillopt_sleep/backend.py`; `docs/sleep/README.md` ("Claude replay isolation").
    - Problem: the replayed agent picking up the user's own `CLAUDE.md`, hooks, MCP and skills, which contaminates the measurement.
    - Evidence: `tests/test_claude_replay_isolation.py` (not run).

22. **Harvest self-contamination filters.**
    - What: producer-prefix markers on engine prompts; env-configurable agent markers; optional repeated-template filter.
    - Where: `skillopt_sleep/harvest.py`.
    - Problem: the engine mining its own replay sessions, or hook-generated sessions, as "user tasks".
    - Evidence: CHANGELOG — "SkillOpt-Sleep no longer harvests its own Claude replay sessions as user tasks" (#310); docs cite #319 where repeated hook sessions consumed the session cap. Both were real post-release defects.

23. **Session-end marker hook.**
    - What: Claude Code `SessionEnd` hook, async, appends a timestamp and `$PWD` to `~/.skillopt-sleep/session-end.log`. "This does NOT run the optimizer."
    - Where: `plugins/claude-code/hooks/hooks.json`, `on-session-end.sh`.
    - Problem: knowing there is fresh activity to harvest.
    - Evidence: n/a (trivial).

24. **Semantic-density gate bonus.** Off by default.
    - What: adds `weight × (count of words like MUST, ALWAYS, NEVER, CRITICAL … / total words)` to the gate score.
    - Where: `skillopt/evaluation/gate.py` (`compute_semantic_density`); `evaluation.use_semantic_density`.
    - Problem: stated only as an "optional instruction-density bonus".
    - Evidence: no evidence found. It rewards imperative wording independent of task score, so with it on, a candidate can pass the gate without improving accuracy.

## 4. Known weaknesses, open issues, criticisms

- **Issue tracker not read (Unverified).** Issue numbers referenced in the repo: #158 (reproducibility audit), #174 (edit attribution), #213 (a config option that was "parsed and logged but never reached reflection"), #310, #319, #404, #407, #412.
- **The current default does not match the paper.** Slow-update guidance is ungated by default (`slow_update_gate_with_selection: false`), while "the paper's numbers and the released `ckpt/` skills used the gated mode". The gate also had a stale-score defect in that mode until #404/#422 (HEAD, 2026-11-17).
- **Hard gate stalls on small validation sets.** `configs/features/soft_gate.yaml`: with few items and continuous rewards the default gate "rejects every candidate and training stalls". No patience or early stop: "SkillOpt does not implement a gate-patience counter".
- **Strict `>` on a small noisy validation set is selection on noise.** No significance test in the gate; the evalkit that would give one is explicitly not wired in. Sleep default `val_fraction 0.34` of at most 40 tasks, and `gate_metric: mixed` "best for tiny holdouts" — the deployment gate is weaker than the paper gate.
- **Vendor's own ablations do not show the gate winning on accuracy** for strong models (section 3, mechanism 1). Its measured value is bounding downside for weak models and degraded reflection.
- **Sleep evidence is thin:** single seed per cell, sub-1.5 pt differences declared noise, 7 of 18 cells negative in the best recipe, shipped defaults differ from the experiment recipe. The headline README numbers (+23.5 / +24.8 / +19.1 pt, "best or tied-best on all 52 cells") are paper claims; only 6 GPT-5.5 skills are released as checkpoints ("first optimized-skill artifact batch") and most datasets must be materialized from upstream.
- **gbrain-evals check:** blog — "a one-shot rewrite ties the full validation-gated loop at 100%" on the easy fixture; "not evidence of broad production coding-agent gains".
- **Correctness history of the evaluators.** `[Unreleased] Fixed` lists many scoring bugs after publication: SearchQA string gold answer scored character-by-character ("The correct answer was scored as wrong and a one-letter answer as correct"), `sub_em` matching empty answers, LiveMath `(B)` marked wrong, OfficeQA `42.` vs `42`, DocVQA stray tag giving ANLS 0, fractional hard scores coerced to binary. Published numbers predate these fixes; whether they move is Unverified.
- **Silent-failure history:** CLI spawn failures and auth failures were once scored as 0; a misspelled backend "silently fell back to the mock backend", "so a scheduled run with a typo appeared to succeed".
- **Edit application is exact-string matching;** unmatched edits are dropped (now reported as `unmatched_edits`). `rank_and_select` swallows all exceptions and truncates.
- **Requires a checkable score.** RESULTS §7: flat on "saturated tasks on strong models, or noisy tasks with a weak learning signal". For mined coding-session tasks the checks are regex / heading-shape rules or LLM rubric; docs: shape checks "should be paired with an outcome check".
- **Scale:** `backend.py` 2,939 lines, `staging.py` 3,285, `trainer.py` 2,596; ten agent integrations of uneven maturity (Cursor tool-aware replay "temporarily disabled pending live permission-boundary validation"; OpenClaw is a "reference adaptation").
- **Release lag:** PyPI 0.2.0 lacks most of what the docs on `main` describe.

## 5. Anything that looks unsafe

- **Hidden instructions:** none found. Grep for zero-width characters and for override phrasing ("ignore previous", "do not tell the user", "without asking") across `plugins/`, `skillopt_sleep/`, `docs/` returned only a README table row describing the `autoAdopt` option. The plugin `SKILL.md` files read as plain usage instructions. Not every file was read line by line.
- **Transcript exfiltration by design.** Harvest reads the user's local agent history across tools. With any real backend: "sends truncated excerpts from harvested sessions and derived tasks to the provider you select"; "Outbound prompts are not currently guaranteed to be secret-free". Redaction is regex-based "defense in depth rather than a guarantee". `--scope all` harvests every project. Default backend `mock` sends nothing.
- **`evidence.jsonl` and staging reports** keep prompt and reply copies on disk under the project tree (`.skillopt-sleep/`); risk of committing them.
- **`--auto-adopt`** lets an unattended cron run write into `CLAUDE.md` / `SKILL.md` (agent instruction files) with only the small-sample gate between a mined transcript and standing instructions. Off by default; the cron helper prints the flag as an option "for fully-autonomous adoption (power users)". Transcript text is untrusted input, so this is a persistent prompt-injection path: the docs say the feedback channel is not "an adversarial-input boundary".
- **Scheduler writes the user's crontab / Windows Scheduled Tasks** (`skillopt_sleep/scheduler.py`, `skillopt-sleep schedule`). `plugins/claude-code/scripts/install-cron.sh` only prints a line; the CLI `schedule` command installs it.
- **Permission bypass in harnesses:**
  - `skillopt/model/codex_harness.py`: Claude Code exec target defaults to `"permission_mode": permission_mode or "bypassPermissions"` with allowed tools defaulting to `["Read", "Bash"]`.
  - `skillopt_sleep/backend.py` Copilot backend always passes `--allow-all-tools` (scoped by `--available-tools`, default `bash`) in a temp cwd.
  - `skillopt_sleep/adapters/superpowers.py`: `SKILLOPT_UNSAFE=1` adds `--dangerously-skip-permissions`; `SKILLOPT_HOST_AUTH=1` exposes host credentials. `docs/superpowers/SECURITY.md` states plainly: "There is no OS-level boundary", the adapter "must not be pointed at model-generated or third-party skills", and "The verification re-run **executes agent-modified project code on the host**".
- **Benchmark code execution:** SpreadsheetBench executes model-generated openpyxl code (`skillopt/envs/spreadsheetbench/executor.py`); isolation tests exist (`test_executor_env_isolation.py`) but there is no sandbox claim.
- **Install scripts:** `plugins/codex/install.sh` copies one `SKILL.md` into `~/.agents/skills/` and renames a legacy prompt to a backup; it prints, but does not write, an `AGENTS.md` hint. `plugins/cursor/install.sh`, `plugins/devin/install.sh` and the `.ps1` variants were not read in full — Unverified. No `curl | sh` pattern found by grep.
- **Network egress options:** OfficeQA `search_mode=parallel` / `keenable` send "the generated search queries and the full task question" to third-party hosted endpoints; opt-in, default `offline`.
- **WebUI:** binds to loopback by default; `--host 0.0.0.0` or `--share` requires auth credentials (README).
- **Past credential issue:** CHANGELOG Security — "Prevent managed-identity credentials from being sent to non-Azure or non-HTTPS endpoints" (#138).

## Unverified summary

Star count, issue and PR contents, release dates on GitHub, paper results, NeurIPS acceptance, third-party integrations, and all test outcomes (no code was run).

<!-- END-OF-FILE -->
