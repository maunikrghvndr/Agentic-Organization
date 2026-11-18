# Gap check: cloudflare/security-audit-skill vs the role library

- Input (data): `.ai-memory/TASKS/new-repos-landscape/03-read/cloudflare-security-audit-skill.md` (source commit `c1c8a8c`, read 2026-11-18).
- Library state checked: branch `main-xpl0sx` at `84e83bc`, 2026-11-18. Searched with `rg`, then read the matching lines. No library file was edited.
- `AGENTS.md` headroom at this sha: 32,668 of 32,768 bytes (100 free), 194 of 200 lines. **No proposal below touches `AGENTS.md`** (byte cost 0 for all).
- Evidence caveat carried from the deep read: the source ships no eval, benchmark or results table. Every proposal here rests on the mechanism's logic and on a gap observed in the library, not on measured benefit from the source. Per `EVALS.md`, additions do not need an A/B (only trims do), but none of this is proven to improve review quality.
- Instruction-like text: the source is by design instructions to an agent; treated as data. Nothing in the deep read addressed this reader.

## Summary

- 34 mechanisms: 6 Already covered, 19 Partially covered, 9 Missing, 0 direct conflicts with a hard constraint (three would conflict if placed in the core rather than an overlay; marked).
- Worth adopting: 6 proposals (P1–P6), all in `EngineeringTeam/security-engineer.md`, `EngineeringTeam/researcher.md` or `MemoryTemplates/`. All are additions; nothing is compressed or deleted.
- Most important single finding (library defect, found while checking mechanisms 8 and 13): `EngineeringTeam/security-engineer.md` never mentions `Verification: Confirmed / Probable / Unverified` (`rg -n 'Verification:|Unverified|Probable'` returns nothing in that file), although `_shared/rules-detail.md:42`, `Agents/claude/security-engineer.md:13` and every other reviewer role's output format require it. On a host without the overlay, the security role's own output format carries no verification label. P2 fixes this.
- Every proposal changes the security role or security posture, so each needs the user's ask-first approval (library role files) and a `security-engineer` review record before it lands.

## Mechanism table

| # | Mechanism | Classification | Library evidence (path:line, quote) | Gap / verdict |
|---|---|---|---|---|
| 1 | Guidance-by-default mode gate | Already covered | `AGENTS.md:94` "Grill Checkpoint (mandatory, every role, every task)... do not proceed until the user answers or accepts the restatement"; `EngineeringTeam/security-engineer.md:9` "Do not edit files unless explicitly asked." | The library has no auto-triggering skill, so the failure the gate solves cannot occur. Nothing to add. |
| 2 | Coverage ledger as the coverage claim | Partially covered | `security-engineer.md:225` "Do not simply state "OWASP checked." Map findings to specific risk classes"; `:1103` "## Scope Reviewed"; `:1231` "- Areas not reviewed:"; `AGENTS.md:175` "`Checked, nothing found: <categories>`" | Coverage is stated by layer (Backend / Frontend / ...) and by category, not per entry surface with the paths actually read. A whole-codebase audit can still say "auth reviewed" without naming what was read. → P1 |
| 3 | Canonical, collision-checked unit ids | Missing | Nearest analogue: stable `AC-n` ids (`MemoryTemplates/TASK_MEMORY.template.md:12`) | Reject. Needs a JSON ledger plus a validator; the library records coverage in Markdown in one task file by one writer. No cross-run id matching is done. |
| 4 | Per-state field invariants | Partially covered | `TASK_MEMORY.template.md:32-36` Evidence rows: "A claim with no command + exit code is "not verified"", "Not run: <check> — <why>" | Exists for checks, not for audit coverage rows. Folded into P1 as two prose invariants (reviewed needs paths; not reviewed needs a reason). |
| 5 | Check ownership (per-agent evidence) | Missing | — | Reject. Solves many concurrent writers claiming each other's evidence; the library has one writer and read-only fan-out (`AGENTS.md:84`). |
| 6 | Append-only attempts archive with fresh owner | Partially covered | `_shared/rules-detail.md:42` "every re-review after a fix runs in a fresh context"; `TASK_MEMORY.template.md:42` "Rework round: n of 3 (reviewer context: subagent / new session / in-session adversarial re-read)"; update-never-delete memory | Round and reviewer context are recorded; per-finding attempt history is not. Not worth adding: 3-round cap keeps history short and the task file is append-style already. |
| 7 | Verbatim prompt assembly from named blocks | Already covered (different mechanism) | `Agents/claude/security-engineer.md:11` "Read and obey `EngineeringTeam/security-engineer.md` there in full; it is your role file."; `Workflows/review-loop.js:106` "Read EngineeringTeam/${role}.md there in full and obey it." | The sub-agent reads the role file itself, so the parent cannot paraphrase or drop the checklist. Stronger than copy-by-parent. |
| 8 | Candidate gate (trace, no strengthening, best practice is not a finding, empty result allowed) | Partially covered | `_shared/rules-detail.md:42` "`Verification: Confirmed` (reproduced, ran, or traced to a failing test) or `Probable` (a concrete `path:line` chain, not executed); `Unverified` is reported but cannot block" | Missing in `security-engineer.md` itself (no `Verification` text at all), and no rule against strengthening impact or reporting a checklist deviation as a vulnerability. The role leans the other way: `:13` "You must be strict", `:142` "could plausibly cause". → P2 |
| 9 | Structured-only results; malformed output discarded, not repaired | Already covered (overlay; stricter on loss) | `Agents/claude/security-engineer.md:16` "Never discard or skip a result... output that does not fit the requested shape, is reported and flagged, not dropped."; `Workflows/review-loop.js:137` "'nonconforming output kept verbatim'" and "this reviewer did not clear the diff" | Same no-repair principle; the library keeps and flags instead of discarding, which loses less. Host-specific by nature, correctly an overlay. |
| 10 | Coverage-critic loop, two-critic stop rule | Missing | — | The two-critic loop is a multi-agent budgeted design: Reject for the core. The useful kernel (re-derive the surface list by search and compare with what was reviewed) is one prose line in P1. |
| 11 | Fresh adversarial verifier per candidate | Partially covered | `AGENTS.md:77` "re-read the changed code from scratch and review adversarially"; `Workflows/review-loop.js:120` engineer returns `"disagreed"` | Independence protects the code under review, not the reviewer's own findings; the Verification label is self-assigned by the finder. Prior research (`library-field-review-2026-10.md:49-50`) already weighed refute passes; a per-finding fresh agent is costly and unmeasured. Cheap part (re-read every cited `path:line` before reporting a Critical/High) is in P2. |
| 12 | Second fresh verification of final records, incl. `needs_validation` | Missing | Nearest: `backend-reviewer.md:986` "`Unverified` (cannot block; report it and say what would confirm it)" | Reject the second round (cost, no evidence). The "say what would confirm it" half exists for other reviewers and is added to the security role by P2. |
| 13 | Three-verdict schema with mutually exclusive fields | Partially covered | `Workflows/review-loop.js:71` `enum: ['Confirmed', 'Probable', 'Unverified']`; `:141-142` "blocking finding demoted: Verification Unverified cannot block" | Confirmed/Probable/Unverified is the same split minus a `rejected` state (see 15). Absent from the security role file → P2. A JSON schema in the core would break "works from AGENTS.md alone"; the overlay already has one. |
| 14 | Severity capped at demonstrated impact | Partially covered | `security-engineer.md:138` "Classify every issue."; `:142`, `:157` "Use Critical/High when exploitation could plausibly cause"; `:181` "Dependency vulnerability with unclear reachability" (Medium) | Severity is assigned on plausible impact; nothing ties it to what was shown. Reachability is considered only for dependencies. → P2 |
| 15 | Rejected records retained as memory | Partially covered | `_shared/rules-detail.md:42` "the engineer records the open disagreement in the task file"; `security-engineer.md:672` "documented mitigation and risk acceptance" | No durable place for a refuted claim or an accepted risk. Task files are archived and "Do not read `TASKS/_archive/`" (`AGENTS.md`), so the next audit re-raises it. → P4 |
| 16 | Prior-run carry rules | Partially covered | `TASK_MEMORY.template.md:36` "Freshness: a row is fresh only if its run postdates the phase's last code edit; a later edit voids the rows for the files it touched"; `:8` Baseline sha | The freshness rule is the same idea for Evidence rows. Not applied to prior security conclusions; P4 carries the "only while the cited code is unchanged" condition. |
| 17 | Hunter exclusion list limited to fingerprint/title/root cause | Partially covered | `Workflows/review-loop.js:103` "re-check each from scratch against the current diff; report it again only if it is still present" | Prior findings are passed to re-reviewers to re-check, not to exclude. Anchoring risk is theoretical here. No proposal. |
| 18 | Stable source-derived fingerprint | Partially covered | `Workflows/review-loop.js:99` `keyOf = f => file::summary.slice(0, 80)`; `:103` "with the same file and summary wording so it can be matched" | Overlay only, wording-based. The source leaves derivation to the model too (deep read §4), so there is nothing better to copy. No proposal. |
| 19 | Run profiles (breadth changes, evidence bar does not) | Already covered | `AGENTS.md` Phase Protocol → Spec-driven flow: "**Sizing:** the full path... otherwise `analyst` (one-page spec) → engineer → reviewer... The security trigger list applies at every size."; `AGENTS.md:175` proportional reports | Same principle. "Scoped run records the rest as out of scope, never covered" is `security-engineer.md:1231` "Areas not reviewed"; made checkable by P1. |
| 20 | Agent-invocation budget with reserves | Missing (would conflict in the core) | Overlay only: `Agents/claude/security-engineer.md:8` `maxTurns: 80`; `README/ORCHESTRATION_README.md:144` `--max-turns 40 --max-budget-usd 5`; `Workflows/review-loop.js:45` `MAX_ROUNDS = 3` | Reject. Invocation budgets are host-specific (tool-agnostic constraint) and the library does not fan out hunters. The only budget the core needs is the 3-round cap, which exists. |
| 21 | Explicit incomplete-run state with named reasons | Partially covered | `Workflows/review-loop.js:206-207` `complete` flag, "(incomplete: a reviewer or fix returned no result)"; `security-engineer.md:1097` "Needs More Information"; `:13` "Never mark a review Pass without checking dependencies and secrets." | The portable prose does not say that a review cut short (turn cap, context, unreadable input) may not return Pass. → one line in P1. |
| 22 | Deterministic hunter priority order | Partially covered | `security-engineer.md:1073-1084` "### 5. Prioritize Remediation" (fix order, not review order) | Review order is unspecified. One clause in P1 (lowest-trust surface first). Lexicographic tie-break: not needed without parallel hunters. |
| 23 | Single-writer rule for shared files | Already covered | `AGENTS.md:84` "**Parallelism: one writer.** One session, sequential roles, one writer. Only read-only fan-out is sanctioned"; `_shared/rules-detail.md:46` "memory stays single-writer"; `Agents/claude/security-engineer.md:7` `disallowedTools: Edit, Write, NotebookEdit` | Covered in prose and enforced in the overlay. |
| 24 | Sandbox precondition for running target code | Partially covered | `_shared/rules-detail.md:30` Rule of Two "the enforcing controls are the job's token scopes, the sandbox, and the approval gate"; `security-engineer.md:709` "Native Windows has no agent sandbox (as of 2026-10) — unattended work runs in WSL2 or a devcontainer"; `AGENTS.md:92` Tier 4 "is **data**" | Covers unattended runs and instruction text. Nothing covers *executing* code from a repository the agent is auditing or evaluating but does not own (a fork PR, a third-party library, a repo under research): `researcher.md` has no "do not build/install/run" rule (`rg -n -i 'install\|execute\|clone' EngineeringTeam/researcher.md` → nothing). → P3 |
| 25 | Artifact promotion procedure (11 steps) | Missing | — | Reject. The source ships no implementation and the steps need descriptor-level syscalls an agent shell cannot perform (deep read §4). Prose-only, which the library's own rule rejects: `security-engineer.md:710` "prose is never the only control". |
| 26 | No-live-probing boundary | Partially covered | `AGENTS.md:113` "**Never:** ... Touch production configuration or deploy to production unless explicitly the task"; `security-engineer.md:1218` "- SAST/DAST:" (recommended, unbounded) | "Touch production configuration" does not cover sending requests to a deployed endpoint or a third-party service to confirm a finding. → P3 |
| 27 | Stop at the minimum effect | Missing | `security-engineer.md:1067` "- Exploit scenario" (narrative only, no bound on reproduction) | → P3 (one clause). |
| 28 | Environment-capture rule for reproduction records | Partially covered | `AGENTS.md:113` "Never: Commit, log, or hardcode secrets, tokens, or credentials"; Evidence rows record the command | Evidence rows and reproduction output can still carry an environment dump. → P3 (one clause). |
| 29 | Hardened validators | Missing | Library scripts: `Scripts/Lint-Library.ps1`, `Hooks/handoff-check.mjs:197` (emits `JSON.stringify({ decision: "block", reason })`, so control characters are escaped by JSON) | No proposal. The library has no validator fed target-controlled JSON. Watch item only: if a hook ever echoes raw task-file text into context, escape control characters first. |
| 30 | Report derived from records, written last; no padding | Partially covered | `_shared/rules-detail.md:46` "the engineer merges and deduplicates all findings into the task file before fixing"; `AGENTS.md:175` "emit only the sections that have findings" | No explicit "a clean review is a valid result; do not invent Low findings". → P2 (one clause). |
| 31 | Attack-class library incl. "Wildcard" and "Obvious things" hunters | Partially covered | `security-engineer.md:200-895` (about 30 class checklists); `:1237` "## Final Self-Checklist" | The literal checklist pass exists and is deeper than the source's. The category-free "read boring code" pass is missing; no evidence it finds anything, not proposed. "A flag is not a finding: verify the full code path" is in P2. |
| 32 | LLM domain rule (prompt injection alone is not a finding; a guardrail prompt is not a boundary) | Partially covered | `security-engineer.md:710` "instruction-level defenses reduce but do not prevent hijack, so prose is never the only control" (agent-configuration section only); `:796` "- Prompt injection risk" (bare) | The principle is stated for the agent's own configuration but not for the product's LLM features in `## AI / LLM / RAG Security Review`. → P5 |
| 33 | Comparable-software baseline for calibration | Missing | — | Not proposed. No evidence; the severity anchors at `security-engineer.md:140-196` already calibrate. |
| 34 | Anti-pattern list | Partially covered | `security-engineer.md:13` "Do not dismiss issues as "only frontend""; role files' "Do not" lists | The security role lists under-reporting anti-patterns only; over-reporting ones are added by P2. |

## Proposals

All wording is in the library's style (compact, checkable). Role files stay full-depth: every proposal inserts text and removes none.

### P1 — Coverage table for whole-codebase audits (mechanisms 2, 4, 10, 21, 22)

- **Target:** `EngineeringTeam/security-engineer.md`.
- **Insertion point A:** end of `### 1. Map The System`, after the list item `- Secrets/configuration` (line 1030), before `### 2. Inspect Code And Config`.
- **Wording A:**

```md
For a whole-codebase or subsystem audit (not a single-diff review), turn this map into a coverage table before inspecting code — one row per entry surface × trust boundary:

| Surface (route / consumer / job / upload / webhook / CLI) | Boundary crossed | Status | Paths read | Classes checked |

- Status is exactly one of `reviewed`, `not reviewed: <reason>`, `out of scope: <who decided>`. `reviewed` requires at least one path actually read; a row with no path is `not reviewed`.
- Review order: lowest-trust surfaces first (unauthenticated, then cross-tenant, then authenticated), so a review that is cut short has covered the most exposed rows.
- Before reporting, re-derive the surface list by search (route attributes, handler registrations, queue/topic subscriptions, scheduled jobs) and add any surface missing from the table as `not reviewed`.
- The table is the coverage claim. "Auth reviewed" without rows is not coverage. Any in-scope `not reviewed` row makes the recommendation `Needs More Information`, never `Pass`; a review stopped early (turn cap, context limit, unreadable input) says so and lists the rows it did not reach.
```

- **Insertion point B:** output format, under `## Scope Reviewed` (line 1103), after `- Tests/security tooling:` (line 1111). Add one line: `- Coverage table (whole-codebase or subsystem audits): rows reviewed / not reviewed / out of scope — table in the task file Findings`.
- **AGENTS.md byte cost:** 0.
- **Lost by not adopting:** the security report keeps stating coverage by layer and category; an audit that never opened the webhook handlers can still return Pass with "Authorization: checked". This is the source's central idea and the only one that makes a skipped area visible.

### P2 — Finding gate and verification label in the security role (mechanisms 8, 11, 12, 13, 14, 30, 31, 34)

- **Target:** `EngineeringTeam/security-engineer.md`.
- **Insertion point A:** `### 4. Classify Findings`, after `- Test/verification` (line 1071), before `### 5. Prioritize Remediation`.
- **Wording A:**

```md
- Verification: `Confirmed` (reproduced, ran, or traced to a failing test) / `Probable` (a complete `path:line` chain from entry point to sink, not executed) / `Unverified` (cannot block; say exactly what fact is missing and how the owner can check it)

Finding gate — apply before a finding enters the report:

- Complete trace: entry point → propagation → sink, each a `path:line` you re-read after forming the finding. A scanner hit or a grep match is a lead, not a finding, until the path is traced.
- No strengthening: report the impact the trace shows. A crash is not code execution; self-impact is not cross-user impact; a missing header is not a data breach.
- A deviation from a checklist or best practice with no traced impact is Low / Informational hardening, never Medium or above, and never Blocking.
- Deployment facts not in the repository (proxy rules, cloud policy, network exposure) are not guessed: the finding is `Unverified` with the missing fact named.
- Critical and High: before reporting, re-read every cited location from scratch and try to refute the finding (is there an upstream check, a framework default, an unreachable path?). Record what you checked.
- A clean review is a valid result. Do not add Low findings to fill the report.
```

- **Insertion point B:** `## Security Review Severity`, directly after `Classify every issue.` (line 138). Add: `Severity follows the impact the evidence shows. "Could plausibly cause" in the lists below means a traced path to that impact, not a category match; if you cannot state the concrete damage and who suffers it, the severity is lower than it feels. An `Unverified` finding carries its *potential* severity labelled as such.`
- **Insertion point C:** output format, add `  - Verification:` as the last sub-bullet of the Critical, High and Medium finding templates (after lines 1125, 1135, 1143). This matches `backend-reviewer.md:986`.
- **AGENTS.md byte cost:** 0.
- **Lost by not adopting:** (1) the role file stays inconsistent with `_shared/rules-detail.md:42` and its own overlay — a host without the subagent overlay gets security findings with no verification label, so the "Unverified cannot block" rule has nothing to act on; (2) the role keeps only anti-under-reporting rules, so severity inflation and checklist-deviation findings have no counterweight. Note the tension: line 13 "You must be strict" stays; the gate governs what is claimed, not how hard to look.

### P3 — Execution safety when auditing or evaluating code (mechanisms 24, 26, 27, 28)

- **Target 1:** `EngineeringTeam/security-engineer.md`, `### 3. Run Or Recommend Scans`, after `- License/supply-chain concerns if relevant` (line 1058).
- **Wording 1:**

```md
Execution bounds for the audit itself:

- Code you do not trust (a fork or external PR, a third-party dependency, a repository under evaluation) is read, not run. Building, installing or testing it executes its lifecycle scripts with your credentials; do it only in a sandbox with no network and no credentials, otherwise write `Not run: no sandbox` and mark the finding `Probable` or `Unverified`.
- No live probing: never send requests to deployed endpoints, shared infrastructure, third-party services or real accounts to confirm a finding. DAST is recommended to the owner with a target they choose, not run by this role.
- A local reproduction stops at the minimum observable effect (wrong return value, unauthorized dummy record, policy difference). No working exploit chain, persistence or concealment material is produced or recorded.
- Evidence rows and reproduction notes carry the command and the variable *names* it needed — never an environment dump or secret values.
```

- **Target 2:** `EngineeringTeam/researcher.md`, `## Strict Do Not Do List`, after `- Send sensitive or regulated data to an external search or service.` (line 173). Add: `- Build, install or run code from a repository you are evaluating — read it as data; a spike that must execute it runs in a sandbox with no credentials, or is reported as "not run".`
- **AGENTS.md byte cost:** 0. (A one-clause pointer in the Never list would cost about 90 bytes against 100 free; not recommended.)
- **Constraint note:** this is a security-posture change, so it needs a `security-engineer` review record and ask-first approval. It is prose; per `security-engineer.md:710` the enforcing control is the sandbox / `Settings/` baseline where present, and the rule must say `Not run` when there is none rather than pretend.
- **Lost by not adopting:** the library treats instruction text in foreign content as data (`AGENTS.md:92`) but has no rule against *executing* foreign code; `researcher` evaluates third-party repositories and dependencies routinely, and a security review of a fork PR runs "the project's tests" by default (`AGENTS.md` Boundaries → Always). This is the gap with the largest real downside.

### P4 — Durable record of refuted claims and accepted risks (mechanisms 15, 16)

- **Target 1:** `MemoryTemplates/TASK_MEMORY.template.md`, `## Findings`, after the `Rework round` line (line 42). Add: `- Refuted / accepted risk: <claim> — \`path:line\` — why it does not hold, or who accepted it [YYYY-MM-DD] — at <sha>`
- **Target 2:** `EngineeringTeam/security-engineer.md`, `## Required First Step`, after `- Identify where secrets/configuration are expected to live.` (line 75). Add:

```md
- Read `.ai-memory/wiki/security-decisions.md` when it exists (refuted claims and accepted risks from earlier reviews). An entry suppresses only that exact claim, and only while the cited code is unchanged since its sha; changed code is reviewed again from scratch. It never marks an area as covered.
```

- **Target 3:** `EngineeringTeam/_shared/memory.md`, new bullet after the `Re-sync` bullet (line 30): `- **Security decisions.** On acceptance of a task whose Findings hold a `Refuted / accepted risk` line, promote it to `wiki/security-decisions.md` (claim, `path`, reason or approver, date, sha). Update with dated notes; never delete — a reopened claim is superseded, not removed.`
- **AGENTS.md byte cost:** 0.
- **Lost by not adopting:** every security pass re-raises the same disproved claim or already-accepted risk, because the only record is in an archived task file that roles are told not to read. Lower priority than P1–P3: the cost is repeated work, not a missed vulnerability.

### P5 — LLM-feature rule: a guardrail prompt is not a security boundary (mechanism 32)

- **Target:** `EngineeringTeam/security-engineer.md`, `## AI / LLM / RAG Security Review`, under `Additional checks:`, after the `Unbounded consumption` bullet (line 818), before `Block AI-related security risks...` (line 820).
- **Wording:**

```md
- A guardrail prompt is not a security boundary. Count only deterministic controls: resource-scoped authorization on every tool call, isolation, input/output validation in code, constrained credentials.
- "The model can be prompt-injected" alone is not a finding. Report the code-level boundary the injected text crosses (a tool call without authorization, cross-tenant retrieval, output used unvalidated in a query or command) with its trace.
```

- **AGENTS.md byte cost:** 0.
- **Lost by not adopting:** the product-side AI section keeps a bare "Prompt injection risk" checkbox, which invites generic findings; the stronger principle exists only in the agent-configuration section (line 710) and is not applied to the systems the role audits. Optional mirror: one line in `EngineeringTeam/ai-reviewer.md` Safety block (line 103).

### P6 — (optional, overlay only) incomplete flag in the subagent prompt (mechanism 21)

- **Target:** `Agents/claude/security-engineer.md`, numbered list item 6 (line 16), append: ` If you stop before finishing (turn cap, unreadable input), your recommendation is Needs More Information and you list what you did not reach.`
- **Why separate:** P1 puts the rule in the portable role file; this repeats it where `maxTurns: 80` can actually cut a review short. Agent configuration file → ask-first plus security review.
- **Lost by not adopting:** little if P1 lands; the subagent reads the role file in full.

## Not proposed (with reason)

- **3, 5, 6, 17, 18 (ids, ownership, attempts, exclusions, fingerprints):** bookkeeping for many concurrent agents writing a JSON ledger across runs. The library has one writer, a 3-round cap and Markdown task files; the machinery would cost more than the problem.
- **10 (two-critic loop), 12 (second verification round), 20 (invocation budget):** multi-agent, host-dependent and unmeasured. In the core they would conflict with the tool-agnostic constraint; as an overlay they would be a new workflow with no evidence behind it. `Workflows/review-loop.js` already carries the fresh-context re-review that the library's prior research supported.
- **25 (artifact promotion):** unimplementable as prose; the source ships no code for it.
- **29 (hardened validators):** no library script reads target-controlled input. Watch item recorded in the table.
- **31 wildcard hunter, 33 comparable-software baseline:** no evidence; the role's checklists and severity anchors already cover the intent.

## What would be lost overall by adopting nothing

- The security role's portable file stays without a verification label (a present inconsistency, independent of the source).
- Whole-codebase audits keep an unfalsifiable coverage statement.
- No rule stops a role from building or running untrusted repository code, or from probing a live system to confirm a finding.

## Risks of adopting

- `security-engineer.md` grows by roughly 35 lines (1,272 → about 1,307); it is already the largest role file. No AGENTS.md impact.
- P2 could be read as lowering strictness. The wording keeps line 13 and limits only what is claimed; a before/after run on an `Evals/` security case would show whether real findings are being downgraded.
- P1 adds work to every whole-codebase audit; it is scoped out of single-diff reviews on purpose.

<!-- END-OF-FILE -->
