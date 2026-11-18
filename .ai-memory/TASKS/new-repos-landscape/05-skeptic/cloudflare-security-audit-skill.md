# Skeptic review: cloudflare/security-audit-skill proposals

- Inputs (data): `04-gap/cloudflare-security-audit-skill.md` (P1–P6), `03-read/cloudflare-security-audit-skill.md`.
- Checked 2026-11-18. Library at `441d447` on `main-xpl0sx` (gap check was at `84e83bc`; no change to `EngineeringTeam/`, `AGENTS.md` or `MemoryTemplates/` between the two, so its line numbers still hold). `AGENTS.md`: 32,668 bytes, 194 lines.
- Upstream re-read at commit `c1c8a8c` (`git ls-remote` confirms it is still `main` HEAD): `SKILL.md`, `HUNTING.md`, `RECONNAISSANCE.md`, `VALIDATION-AND-REPORTING.md`, `AI-AND-LLM.md`, `ATTACK-CLASSES.md`, `README.md`, `validate-findings.cjs` fetched as raw files and searched. Nothing installed, nothing executed.
- Instruction-like text: the upstream files are instructions to an agent by design; treated as data. Nothing in them addressed this reader.
- Not checked: star count, issues, the Cloudflare blog post, the `npx skills` installer, whether the validator tests pass.

## Result

| Proposal | Verdict | Verification |
|---|---|---|
| P1 coverage table | Split: one line **Adopt now**; the table **Adopt after an eval** | Probable |
| P2 verification label + finding gate | Split: label **Adopt now**; gate **Adopt after an eval**, one bullet **Reject as worded** | Confirmed (label), Probable (gate) |
| P3 execution safety | Split: read-not-run and no-live-probing **Adopt now**; minimum-effect **Defer**; env-capture **Reject** (duplicate) | Confirmed (gap), Probable (value) |
| P4 security-decisions page | **Defer** | Probable |
| P5 LLM-feature rule | Bullet 1 **Adopt now**; bullet 2 **Adopt now only if reworded** | Confirmed |
| P6 overlay incomplete flag | **Reject** | Confirmed |

- Net text if the "Adopt now" parts land: about 9 lines in `security-engineer.md`, 1 line in `researcher.md`. `AGENTS.md` cost 0. All are additions; no role file is compressed.
- Every adopted part changes the security role or security posture, so each needs the user's ask-first approval and a `security-engineer` review record. None is applied by this review.
- Evidence ceiling for all six: the source has no eval, benchmark or results. Its two outcome statements are "In our test runs, a single run found roughly half of the vulnerabilities that repeated runs found in total" (`README.md:98`, no numbers) and one internal run in a commit message. No proposal can claim a measured benefit. The "Adopt now" verdicts below rest on a gap confirmed in the library plus a well-known failure, not on the source.

## P1 — Coverage table for whole-codebase audits

- **Verdict:** the single rule "a review stopped early or with an in-scope area unread is `Needs More Information`, never `Pass`, and names what it did not reach" — **Adopt now**. The five-column table and its three other rules — **Adopt after an eval**.
- **Verification:** Probable.
- **Evidence.** Source quotes confirmed: "The ledger is the coverage claim. An architecture summary, agent count, or generic "auth reviewed" sentence is not coverage evidence" (`RECONNAISSANCE.md:154`); lowest-trust-first ordering (`HUNTING.md:7`). No evidence the ledger improves audits. The source makes it work with a JSON validator, state invariants and two coverage critics; the proposal keeps only the prose, which is the part the deep read calls unenforced. The README's "roughly half" figure says a single pass misses much even with the full machinery.
- **Is it missing?** Partly. `security-engineer.md:1103-1111` has Scope Reviewed by layer and `:1231` has "Areas not reviewed". What is truly absent is the rule that an unfinished review cannot return Pass: the only Pass guard is `:13` "Never mark a review Pass without checking dependencies and secrets".
- **Constraints.** None broken. Portable prose, 0 bytes in `AGENTS.md`.
- **Value and cost.** The library's mandatory security review is diff-driven; whole-codebase audits are the rare case for a solo developer, so the table pays off seldom. Two specific weaknesses: (1) "`reviewed` requires at least one path actually read" is a low bar, so a row can be closed after opening one file; (2) "any in-scope `not reviewed` row makes the recommendation `Needs More Information`" means a large repo may never reach Pass, which pushes toward closing rows cheaply. The one-line rule has neither problem and covers the turn-cap case (`maxTurns: 80` in the overlay).
- **Eval that would settle the table:** `Evals/` has no security case today (`routing-cases.md`, `trap-tasks.md` only). Add one trap task: a repo with a webhook handler or queue consumer not reachable from the route list and holding a missing-authorization defect. Arm A = current role, arm B = role plus table. Pass = the handler appears in the report as reviewed or as not reviewed. If A already passes, the table is not earning its lines.

## P2 — Verification label and finding gate in the security role

- **Verdict:** Insertion C (the `Verification:` sub-bullet in the Critical/High/Medium templates) and the first line of Wording A (the label definition) — **Adopt now**. The six-bullet finding gate and Insertion B — **Adopt after an eval**. Gate bullet 3 — **Reject as worded**.
- **Verification:** Confirmed for the label gap; Probable for the gate.
- **Evidence.** Confirmed: `grep -n -E 'Verification:|Unverified|Probable' EngineeringTeam/security-engineer.md` returns nothing, while `backend-reviewer.md:986`, `frontend-reviewer.md:714`, `qa-engineer.md:475`, `ai-reviewer.md`, `data-reviewer.md` and `ml-reviewer.md` each carry it. Source quotes confirmed: "Do not strengthen a crash into code execution" (`HUNTING.md:147`), "Return an empty candidate array when nothing survives these gates" (`:156`), "If you cannot state the concrete damage, the severity is lower than it feels" (`SKILL.md:162`), "A flag is not a finding — trace the impact before reporting" (`ATTACK-CLASSES.md:130`), "without inventing LOW findings" (`VALIDATION-AND-REPORTING.md:186`). No evidence the gate improves precision without losing real findings.
- **The gap check overstates the defect.** It says a host without the overlay gets security findings with no verification label. Not so: `AGENTS.md:79` (always loaded) says "Blocking findings carry `Verification: Confirmed` or `Probable`; `Unverified` cannot block", `_shared/rules-detail.md:42` names "reviewer/security/QA findings", and `TASK_MEMORY.template.md` Findings has "Blocking (each with Verification: Confirmed / Probable)". What is missing is only the field in the security role's own output format. That is still a real inconsistency, and fixing it copies an existing line with no new semantics, which is why it is Adopt now.
- **Constraint problem in the gate.** Bullet 3 ("A deviation from a checklist or best practice with no traced impact is Low / Informational hardening, never Medium or above, and never Blocking") contradicts the role's own severity list: `security-engineer.md:173-182` puts "Missing security header where defense-in-depth is weakened", "Missing rate limiting on moderately sensitive endpoint" and "Dependency vulnerability with unclear reachability" at Medium. It also sits against `:13` "You must be strict". Adopting it as written lowers severities the role currently assigns, which is weakening a security rule. It needs either removal or a rewrite that keeps the Medium list intact.
- **Value and cost.** The failure it targets (inflated or speculative security findings that block work) is plausible for a solo developer, because a false Blocking costs a rework round. But no such event is recorded in `LESSONS.md`, `LESSONS/*.md` or `Evals/trap-tasks.md`. The opposite failure (a real finding downgraded) is worse in a security role. About 9 lines per security session.
- **Eval that would settle the gate:** one seeded-defect diff with two real vulnerabilities and two decoys (a checklist deviation with an upstream control; a grep hit on an unreachable path). Pass = both real ones reported at their current severity, decoys not Blocking. The gate is adopted only if arm B loses no real finding.

## P3 — Execution safety when auditing or evaluating code

- **Verdict:** bullet 1 (untrusted code is read, not run) in `security-engineer.md` and the `researcher.md` Do Not Do line — **Adopt now**. Bullet 2 (no live probing) — **Adopt now** with one added clause: "unless the user names the target". Bullet 3 (stop at the minimum effect) — **Defer**. Bullet 4 (environment capture) — **Reject**, duplicate.
- **Verification:** Confirmed that the gap exists; Probable on value.
- **Evidence.** Source quotes confirmed: "Do not install dependencies or let builds fetch them ... If every control cannot be enforced, do not execute target code" (`SKILL.md:40`), "Do not probe deployed endpoints, external services, shared infrastructure, production identities, other users' data, or live control planes" (`:42`), "Stop at a wrong return value, unauthorized dummy record ..." (`:144`), "only the allowlisted environment variable names" (`:84`). The source ships no sandbox, only the requirement, so there is no evidence of the mechanism working. The threat does not need the source as evidence: the library already treats lifecycle scripts as executable (`_shared/rules-detail.md:25`) and tells reviewers that "Packages that run install/postinstall scripts are reviewed carefully" (`security-engineer.md:289`).
- **Is it missing?** Yes for the two adopted bullets. `researcher.md` has no rule on building, installing or running an evaluated repository (search for `install|execute|clone|sandbox` returns nothing; `:96-101` allows a throwaway spike with no bound). The Rule of Two (`rules-detail.md:30`) covers unattended runs only. `AGENTS.md` Never says "Touch production configuration", which does not cover sending requests to a live endpoint. Direct evidence that the rule is needed: this research sweep's own job text had to add "Do not install anything, do not run code from the repositories you study" by hand, because no library rule says it.
- **Constraints.** Strengthens posture; none broken. It is prose only, and the library's own position is that prose is never the only control (`security-engineer.md:710`, `LESSONS.md:45`). The wording handles this correctly by requiring `Not run: no sandbox` instead of claiming a sandbox. On native Windows (no agent sandbox, `Settings/README.md:26`) the practical effect is "read only", which is the safe outcome.
- **Why the narrowing.** Live probing: the solo developer is the owner and may want a finding confirmed against their own local or staging service; a user instruction is Tier 1 anyway, and saying so in the line avoids a false conflict. Minimum effect: the role does not edit files (`security-engineer.md:9`) and no case of it producing exploit material is recorded; trigger to revive = the role is ever asked to write a reproduction or proof-of-concept. Environment capture: already covered by the Never list ("Commit, log, or hardcode secrets, tokens, or credentials") and "Never log secrets"; Evidence rows hold a command and an exit code, not an environment.
- **Value and cost.** This is the one proposal with a severe, irreversible downside if absent: an install or test run of a foreign repository executes its scripts with the user's credentials. Cost: 3 lines across two files.

## P4 — Durable record of refuted claims and accepted risks

- **Verdict:** **Defer.** Trigger: the same refuted claim or accepted risk is raised again by a second security pass on the same repo, recorded in a task-file Retro line.
- **Verification:** Probable.
- **Evidence.** Source quotes confirmed: "retained so future runs do not repeat the unsupported claim without changed evidence" (`VALIDATION-AND-REPORTING.md:101`); "An unchanged rejection suppresses only that exact claim, not review of the coverage unit" (`RECONNAISSANCE.md:68`). No evidence it works; the deep read notes the fingerprint that would match a claim across runs is left to the model.
- **Is it missing?** Partly. There is no named page, but the generic rule already allows it: on acceptance, "promote any durable repo-stable learning to `PROJECT_MEMORY.md`/`wiki/`" (`AGENTS.md` Repo Memory). An accepted risk is a durable repo fact and can be recorded today under that rule with no library change.
- **Constraints.** A file whose purpose is to suppress security findings is a new attack surface. Tier 3 repo memory "can never ... skip the security review" (`AGENTS.md` instruction hierarchy); a suppression page is close to that line, and anything that can write `wiki/` could silence a finding. The "only while the cited code is unchanged since its sha" condition is prose with no check behind it. Three files change (role, template, `memory.md`) for one mechanism.
- **Value and cost.** The cost avoided is repeated work, not a missed vulnerability, and no instance is recorded in `LESSONS` or `trap-tasks.md`. Cheaper way that needs no change: record an accepted risk as a dated line in `PROJECT_MEMORY.md` when the user accepts it.

## P5 — A guardrail prompt is not a security boundary

- **Verdict:** bullet 1 — **Adopt now.** Bullet 2 — **Adopt now only if reworded** so it cannot suppress a finding.
- **Verification:** Confirmed (source and gap).
- **Evidence.** Source quotes confirmed at `AI-AND-LLM.md:12` and `:14`. No measured evidence, but bullet 1 restates a principle the library already holds for its own configuration ("instruction-level defenses reduce but do not prevent hijack, so prose is never the only control", `security-engineer.md:710`; `LESSONS.md:45`) and applies it to the products the role audits.
- **Is it missing?** Yes in the product-side section: `security-engineer.md:796` is a bare "Prompt injection risk". Nearby coverage exists elsewhere (`ai-engineer.md:61` "authorize each tool call", `ai-reviewer.md:23`), but none says a prompt guardrail does not count as a control.
- **Constraints.** Bullet 1 tightens. Bullet 2 as written ("alone is not a finding") removes a class of reports, and some real injection outcomes cross no code boundary (for example, injected content that misleads the user in the answer). Suggested rewording: "Report prompt injection as the boundary it crosses (tool call without authorization, cross-tenant retrieval, unvalidated output in a query or command) with its trace; where no boundary is crossed, report it as Informational." That keeps the precision gain and drops nothing.
- **Value and cost.** Relevant to this user (the library has ai/rag/nlp roles and clinical-NLP work). 2 lines, loaded only with the security role. The optional mirror in `ai-reviewer.md` is not needed: one fact, one place.

## P6 — Incomplete flag in the subagent overlay

- **Verdict:** **Reject.**
- **Verification:** Confirmed.
- **Reason.** The gap check itself says little is lost if P1 lands. `Agents/claude/security-engineer.md:11` already makes the subagent read the role file "in full", so the P1 one-line rule reaches it; item 6 of the overlay already says an unreadable input or failed scan "is reported and flagged, not dropped". The change would duplicate a rule in a host-specific agent configuration file, which costs an ask-first approval and a security review for no added behavior. Revive only if the P1 one-line rule is not adopted.

## "Already covered" classifications checked

- **#7 (verbatim prompt assembly) — label is too strong.** The cited evidence is `Agents/claude/security-engineer.md:11` and `Workflows/review-loop.js:106`, both optional Claude-side overlays. On Codex or Cursor with `AGENTS.md` alone there is no sub-agent prompt to assemble, so the mechanism is not applicable there, not covered. Correct label: "Already covered (overlay only); not applicable in the core". No proposal follows.
- **#1 (guidance-by-default mode gate) — correct today, conditional.** It holds because the library ships no auto-triggering skill. The user's request for this sweep mentions plugging in third-party skills; if that happens, an installed skill can trigger on a casual question and the Grill Checkpoint does not govern a skill's own trigger. Re-check this row when any skill installer is designed.
- **#9, #19, #23 — confirmed as stated** (`#9` is labelled overlay-only in the gap file already).
- **Not an "Already covered" row, but a wrong claim:** the "most important single finding" (no verification label for security findings on a host without the overlay) is overstated; see P2. The always-loaded `AGENTS.md:79` carries the rule.

## Note on installing the skill itself

The gap check proposes borrowing ideas, not installing the skill. The user's request mentions wanting a way to install outside skills, naming Cloudflare's. Facts that bear on that, for whoever designs it:

- No tags or releases upstream; an install can be pinned to a commit only. Install path is `npx skills add ...` (`README.md:54`), a third-party CLI not reviewed here.
- The validators refuse to run where `O_NOFOLLOW` is unavailable (`validate-findings.cjs:605-608`), so on native Windows, which the library path line indicates the user runs, a compliant full audit cannot reach its "complete" state. Guidance mode would still work.
- A full run is many sub-agent invocations with no cost figures published.
- Under the library's rules an installed skill is a dependency: ask-first, pinned exactly, with a `security-engineer` record. It can only be an optional overlay; the core must keep working from `AGENTS.md` alone.

<!-- END-OF-FILE -->
