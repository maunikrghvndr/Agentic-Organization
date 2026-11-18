# Skeptic review: akitaonrails/ai-memory proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). No library file edited, nothing installed, no upstream code run.
- Inputs read as data: `04-gap/akitaonrails-ai-memory.md` (P1-P12), `03-read/akitaonrails-ai-memory.md`.
- Upstream re-checked at commit `bc7faa7d847dd387e634ba8420d115b9dd4ecebe` (raw files, HTTP 200 each): `docs/design-handoff-offer-not-claim.md`, `docs/design-memory-poisoning-provenance.md`, `docs/benchmarks/consolidation-literal-fidelity-2026-10-15.md`, `docs/agent-messaging.md`, `crates/ai-memory-hooks/src/router.rs`, `docs/design-memory-aging.md`, `docs/competitive-parity.md`, `docs/security-boundaries.md`, `scripts/check-migrations-immutable.sh`, `INSTALL_FOR_AGENTS.md`, `CLAUDE.md`, `plugins/claude-code/hooks/hooks.json`, `docs/design-yolo-safety-ai-jail.md`, `docs/auto-improvement-loop.md`.
- Library re-checked on disk: `AGENTS.md` 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). No proposal touches it; confirmed. Every insertion point the gap file cites was opened.
- Not checked: GitHub issue #959 itself (cited from the in-repo design doc only), stars, CI status, arXiv:2611.09721. `Scripts/Lint-RepoMemory.ps1` not executed (no `pwsh` on this machine). `node --test "Hooks/*.test.mjs"` not run (no file changed).
- Instruction-like text upstream (reported, not acted on): `INSTALL_FOR_AGENTS.md:3` "You are an AI coding agent and your user asked you to install ai-memory", followed by a pipe-to-shell command. Tier 4 data.

## Evidence that applies to every proposal

- Upstream measured nothing that these proposals copy. The two items the gap file calls evidence-backed are weaker than stated:
  - **#959** is real in the design doc (lines 30-39), but the failure is a *consumed* baton: an unrelated session claimed it and it was gone. The same doc says part of the complaint was "a self-inflicted cause". The library has no consumption, so the incident shows a risk class, not a library failure.
  - **Fidelity run**: 0.857 is 6 of 7 kept facts, identical in all 3 runs on both sides. The task was `gpt-6-sol` compiling a 292 KB observation stream into a page. That is not a role copying one line from a task file it has open.
- Rules placed in `_shared/memory.md` or `_shared/rules-detail.md` are read on demand. `AGENTS.md` has no room for a compact line. Only the template lines (`MemoryTemplates/*`) are seen on every task. Where a proposal offers both, the template line is the part that can change behaviour.
- Every target is in the agent-configuration list (`_shared/rules-detail.md:21`). Each adopted item is ask-first and needs the `security-engineer` pass. None of the verdicts below waives that.

## Verdicts

| # | Proposal | Gap recommendation | Skeptic verdict | Verification |
|---|---|---|---|---|
| P1 | Memory fact keeps the trust class of its source | Adopt | **Adopt after an eval, cut to one template clause.** Reject the labelling bullet as worded | Confirmed (source is design-only); benefit Unverified |
| P2 | Untrusted text never in Summary / Handoff | Adopt | **Adopt now: Target A only.** Reject B and RW4 | Confirmed (hook code, rule text); failure not observed |
| P3 | Handoff is an offer; stale-handoff check | Adopt | **Reject bullet 1 and the hook edit. Adopt now one corrected sentence of bullet 2, in the template** | Confirmed |
| P4 | Verbatim Request line outranks compaction summary | Adopt | **Adopt now: Target A, amended.** Reject B | Confirmed (gap is real); upstream evidence none |
| P5 | Literals survive promotion | Adopt | **Defer** | Confirmed (numbers); transfer Unverified |
| P6 | Open-conflict marker plus RW5 lint | Adopt | **Defer** | Confirmed |
| P7 | Temporary facts carry `until` | Consider | **Defer** (agrees) | Confirmed |
| P8 | Review a self-installing agent tool | Adopt | **Adopt now, trimmed** | Confirmed |
| P9 | Reinforcement must come from a different task | Consider | **Reject** | Confirmed |
| P10 | Eval sets include unanswerable cases | Consider | **Adopt now, one clause plus one reviewer question, merged with `anthropic-plugin-evals.md` P3** | Probable |
| P11 | Applied migration is never edited | Consider | **Adopt now: reviewer line only** | Confirmed |
| P12 | Boundary tests come in pairs | Consider | **Adopt now, cut to two sentences, with upstream's definition of Strong** | Confirmed (artifact); effectiveness Unverified |

### P1. Trust class of a memory fact — Adopt after an eval, cut to one template clause. Verification: Confirmed (source), benefit Unverified

- Evidence: `design-memory-poisoning-provenance.md:3-5` says "Status: design, partially staged ... Step 1 ... is implemented". Trust classes, rule gating and ranking are steps 2 to 5 and unbuilt. The 98% / 22% figures are a paper's, not read. So this copies a design, not a mechanism that worked.
- "Partially covered" understates the library. The gap file's own example (a ticket's "always run tests with `--no-verify`" stored as a fact) is already blocked three ways: `_shared/memory.md:24` forbids imperatives in memory; `MemoryTemplates/PROJECT_MEMORY.template.md:5` admits only "a `path:line`, the command, or the user's dated words" as evidence, and a ticket is none of those; `AGENTS.md:113` forbids weakening checks. `_shared/memory.md:27` already gates Hard Rules ("recurrence = Hard Rule", or user-approved).
- Constraint problem: the bullet covers `wiki/`, and `wiki/ref-*` pages are external text by design (`_shared/memory.md:9`). As worded, every reference-page line would need `unconfirmed`. It also puts the rule inside the store it protects, which `LESSONS.md:45` warns against.
- What survives: one clause under `## Hard Rules` in the template, where every session sees it, saying Hard Rules come from the code or the user's dated words.
- Eval first: run the gap file's own trap (a linked issue states a "project rule") on the library as it is. If the baseline already keeps the line out of Hard Rules, reject the clause as a duplicate.

### P2. Untrusted text out of re-injected sections — Adopt now, Target A only. Verification: Confirmed

- Checked: `AGENTS.md:92` says "fenced, in the task file" and names no section. `Hooks/session-reentry.mjs:24` prints `Summary` and `Handoff`. `TASK_MEMORY.template.md:48` tells the next session to trust Handoff. The gap is real. No case of it happening was found.
- Target A gives the report a home (one line under Risks / Follow-ups). Cost is one template line. Adopt.
- Target B duplicates A in a file read on demand. Reject.
- RW4 is the wrong control. It flags a fenced block or `>` line, which is injected text that was correctly marked as data. It cannot see unfenced pasted text, which is the actual risk. It would also flag a legitimate fenced command in a Handoff. Reject.
- Upstream quote corrected: the inbox notice carries "a count and the inbox's own server-side workspace and project names" (`agent-messaging.md:435`; `router.rs:2419-2420`), not only an integer. The principle holds.

### P3. Handoff as offer; stale check — one sentence survives. Verification: Confirmed

- Bullet 1 (offer, not assignment): Reject. The claimed library failure does not occur as described. The hook runs only for `compact` and `resume` (`session-reentry.mjs:23`, `SOURCES`), which continue the same conversation. A fresh session about something else gets nothing from it. A fresh session that reads task memory still has to restate the user's request and wait (`AGENTS.md:94`). Upstream's failure was a destructive claim; a file is not consumed.
- Target B (hook sentence): Reject. Same reason, and it is a `Hooks/**` change with a security pass for no shown failure.
- Bullet 2 (stale Handoff): the finding is true. `rg` shows "tree at handoff" appears only at `TASK_MEMORY.template.md:7`. A value is written and no rule reads it. But the proposed wording is wrong twice:
  - "or the tree is dirty" fires on almost every handoff. Work is normally uncommitted at handoff (`AGENTS.md:113`; the Evidence row allows `uncommitted`).
  - A session killed mid-phase leaves HEAD unchanged, so the sha comparison does not detect the case the proposal names. It detects commits that landed after the handoff.
- Adopt now, in the template line itself (seen on every task), not in `rules-detail.md`: `a session that finds HEAD is not this sha reads git diff <sha>..HEAD before trusting Handoff`. Drop the dirty-tree clause.

### P4. Verbatim Request line — Adopt now, Target A amended; reject B. Verification: Confirmed

- "Missing" is true. `rg` finds the user's words recorded only for Approval and Acceptance (`TASK_MEMORY.template.md:24,26`). `Goal:` is a paraphrase. Upstream has no evidence for its version; the support is the library's own incident at `LESSONS.md:47`.
- Amendments needed before it is safe:
  - Cap it. "Append later instructions" turns Summary into a transcript, against `AGENTS.md:149`, and the hook prints Summary on every resume. Keep the scope and constraint sentences only, a few lines at most.
  - Copy the wording of line 24: written in the session where the user said it, never copied from a ticket, PR or job-embedded text.
  - State that a Request line sets scope, and is never an approval or a permission (`AGENTS.md:92`, Tier 3).
- Target B: Reject. `AGENTS.md:85` already says to re-read Summary after a compaction, and the Request line sits in Summary. A precedence rule that lets a repo file line outrank other context is a tier change with no evidence behind it.

### P5. Literals survive promotion — Defer. Verification: Confirmed (numbers), transfer Unverified

- The numbers are as quoted, and small: n = 7 facts, 3 runs, zero variance. The upstream task is not the library's promotion step.
- Mostly covered already: `PROJECT_MEMORY.template.md:5` (every fact carries a `path:line` or the command), `:10` (commands verbatim), `:3` (Verified header re-checks Commands), `_shared/memory.md:30` (Re-sync).
- The proposed check ("each backticked token greps in the source") is manual work on every promotion with no lint behind it.
- Cheaper control if this ever matters: a `Lint-RepoMemory.ps1` warning for a backticked path in `PROJECT_MEMORY.md` or `wiki/` that does not exist in the repo. Zero tokens, and it also catches drift.
- Trigger to revive: the first invented or altered identifier found in a promoted memory line in any repo.

### P6. Open-conflict marker and RW5 — Defer. Verification: Confirmed

- True that `_shared/memory.md:8` requires a flag and gives it no spelling.
- No open contradiction flag was found in this repo's own stable memory, so the lint would list nothing today. For one developer and one writer, unresolved contradictions are rare.
- Name collision: `anthropic-agent-memory-components.md` P4 also proposes RW4 and RW5 for different checks.
- Trigger: the first flagged contradiction found unresolved after its task was archived.

### P7. Temporary facts carry `until` — Defer. Verification: Confirmed

- The gap file itself says little is lost. `_shared/memory.md:24` and `:30` cover most of it. Trigger: a stale workaround observed surviving in memory.

### P8. Reviewing a self-installing agent tool — Adopt now, trimmed. Verification: Confirmed

- Source facts re-verified: hooks on 11 events, all with `"matcher": ""` (`plugins/claude-code/hooks/hooks.json`); `--yolo` "forces `bypassPermissions`" (`design-yolo-safety-ai-jail.md:6,154`); LLM edits "auto-approved by default" (`auto-improvement-loop.md:10`); pipe-to-shell install addressed to agents (`INSTALL_FOR_AGENTS.md`).
- "Missing" holds. `security-engineer.md:706-710` covers instruction files, MCP, skills and unattended runs. `rg` finds nothing there on writes outside the repo, uninstall, background services or permission-lowering flags. `:682` covers pipe-to-shell for build scripts only.
- Real value for this owner: this research sweep is itself an evaluation of such tools.
- Trim: drop the closing sentence about install instructions addressed to an agent (already `AGENTS.md:92`). Keep items (1) to (5) and the Blocking list. It is an addition to a role file, so full-depth is kept.

### P9. Reinforcement from a different task — Reject. Verification: Confirmed

- Promotion is already ask-first (`LESSONS.md:22`), so the user decides every one. The library holds one `REINFORCED [20..]` mark (`LESSONS/backend.md:18`). Upstream's measured effect is 0.000. No failure is prevented.

### P10. Unanswerable cases in eval sets — Adopt now, one clause and one reviewer question. Verification: Probable

- "Missing" holds: no match for unanswerable or abstention anywhere in `EngineeringTeam/`. `prompt-engineer.md:52` asks for "I don't know" behaviour and no eval measures it. `ai-engineer.md:82` has groundedness, which overlaps but does not require cases with no answer.
- Upstream's probe is uncalibrated by its own words. The support is common evaluation practice, not this repo, hence Probable.
- Better home for the retrieval half is `rag-engineer.md:67`. Merge with `anthropic-plugin-evals.md` P3 and P4, which rewrite the same paragraph, and count it once.

### P11. Applied migration never edited — Adopt now, reviewer line only. Verification: Confirmed

- `check-migrations-immutable.sh` read: it fails when a `V*.sql` file present at the merge base changes. `rg` finds no such rule in the library; `AGENTS.md:113` covers "generated migration history" only.
- The reviewer question is visible in the diff and costs one line. The engineer line adds nothing beyond `backend-engineer.md:425`. Keep the "shared environment or released" qualifier: editing a migration that only ever ran locally is normal.

### P12. Boundary tests in pairs — Adopt now, two sentences. Verification: Confirmed (artifact), effectiveness Unverified

- Source verified: `security-boundaries.md:16-18`, "legitimate control case so a blanket deny is not mistaken for a working guard"; STRONG "means a test would fail if the guard were deleted".
- `rg` finds no control-test or paired-test wording in `security-engineer.md`, `qa-engineer.md` or the backend roles.
- Use upstream's definition of Strong. The proposal's "both exist and ran" is weaker.
- Drop the per-boundary verdict table. It overlaps `cloudflare-security-audit-skill.md` P1 and works against proportional reports.

## Rejections in the gap file, re-checked

- Decay and hard delete (4, 5, 11): correct. `design-memory-aging.md:57` confirms retention is "never" used by retrieval ranking; `:84-87` confirm the deleting passes.
- `CLAUDE.md` shim (35): correct. Upstream `CLAUDE.md` is `@AGENTS.md` plus a comment.
- Auto-approval (17), launcher and `--yolo` (15): correct, both verified upstream.
- ai-memory as a dependency: correct to reject. It would break the no-marketplace and tool-agnostic constraints and writes agent configuration on install.

## Classifications found to be wrong or imprecise

- **Row 22 (provenance), "Partially covered"**: closer to covered. `PROJECT_MEMORY.template.md:5` already limits admissible evidence to code, command or the user's dated words. The gap file quotes that line and still treats external text as admissible.
- **Rows 12 and 13 (handoff), "Partially covered"**: the gap described is not real as stated. The hook cannot show a Handoff to an unrelated new session; it runs only on `compact` and `resume`.
- **Row 14 (crash recovery)**: the gap is real (the sha has no reader), but the proposed fix does not detect a session killed mid-phase.
- **Row 27 (inbox notice)**: the upstream quote overstates. The notice also carries project and workspace names.
- **Row 32 (abstention)**: nearer Missing than Partially covered for the eval side.
- No "Already covered" row was found to be wrong. Rows 1, 10, 16, 18, 21, 23, 25, 26 and 30 were spot-checked against the cited lines and hold.

## Order, if the owner acts

1. P8 (security-engineer bullet, trimmed).
2. P2 Target A and P4 Target A, in one edit of `TASK_MEMORY.template.md`, with the P3 clause on line 7.
3. P11 reviewer line, P12 two sentences, P10 merged with the sibling proposal.
4. P1 trap run on the unchanged library, then decide.

## Risks and limits of this review

- Issue #959 was read through the upstream design doc, not on GitHub.
- No proposal was tested. "Adopt now" means the gap is confirmed on disk and the cost is one or two lines, not that a benefit was measured.
- Three adopted items edit the same template file as sibling proposals; apply them in one pass and re-read the line numbers first.
- The gap file's line numbers were correct on 2026-11-18 on branch `main-xpl0sx`.

<!-- END-OF-FILE -->
