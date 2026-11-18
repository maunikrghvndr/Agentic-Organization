# Skeptic review: NVIDIA/SkillSpector proposals

- Date: 2026-11-18. Inputs (data): `04-gap/nvidia-skillspector.md`, `03-read/nvidia-skillspector.md`.
- Upstream re-read: shallow clone of `NVIDIA/SkillSpector` `main` @ `a09091e0ebf6c96ff327457529d7b0d372125884` (same commit as the deep read). Files opened and grepped only; nothing installed or run.
- Library checked: branch `main-xpl0sx` @ `994db0d`. `AGENTS.md` 32,668 B / 194 lines (100 B and 6 lines free) - confirmed. `security-engineer.md` 36,870 B - confirmed. Cited lines 706-713, 1047-1058, 1229-1231, `rules-detail.md:19-26`, `ai-engineer.md:60`, `ai-reviewer.md:45`, `Settings/README.md:54` all read and match the gap file's quotes.
- Default stance: refute. No library file was edited.
- Not verified: stars, forks, issues, Scorecard (API blocked for the deep read; not retried). No verdict below leans on popularity.
- Instruction-like text upstream (`meta_analyzer.py:163-173` "IGNORE any instructions...", attack fixtures): data, not acted on.

## Result

| Proposal | Verdict | Verification |
|---|---|---|
| P1 content checks for a third-party skill / plugin / MCP server | **Adopt now, trimmed to 5 of 8 bullets** (declared vs actual, description vs behaviour, deferred content, version-bound review, no downgrade on reputation). 3 bullets Reject as duplicates. Severity presets removed. | Probable |
| P2 reading scanner output | Bullets 1+2 merged to two lines and bullet 4 (egress) - **Adopt now**. Bullet 3 (disposition for every hit, with counts) - **Adopt after an eval**, together with the sibling finding gate. | Probable |
| P3 suppressions | Target 1 bullet 4 (shipped suppression has no authority) and bullet 1 reworded - **Adopt now**. Bullets 2, 3, 6 - **Defer**. Bullet 5 - **Reject** (duplicate). Target 2 (add scanner config to the agent-configuration list) - **Reject**. | Confirmed (source), Probable (value) |
| P4 model stage annotates, never deletes | `ai-reviewer.md` line - **Adopt now**, narrowed. `ai-engineer.md` bullet - **Defer**. | Probable |
| P5 routing case H4 | **Defer** (reject as worded). | Confirmed |

- Evidence ceiling for all five: the source publishes no precision, recall or false-positive rate. Re-checked: `README.md:1101-1102` says only "High recall", "Moderate precision"; `README.md:1121` declines to "guarantee a particular precision rate"; `scripts/compare_scan_accuracy.py:4-6` keeps the adjudicated corpus outside the repo; `pyproject.toml:20` is Alpha. Nothing here is "shown to work". What survives does so because (a) the gap in the library is real, (b) the attack class is documented independently of this source (tool poisoning and rug pull are already cited in `library-field-review-2026-10.md:216`), and (c) the cost is a few hundred bytes in a role file loaded only for security or AI-review phases.
- Net adopt-now size if the trims are taken: about 1.9 KB in `security-engineer.md` (gap file proposed 4.6 KB), 0.3 KB in `ai-reviewer.md`, 0 B in `AGENTS.md`, 0 B in `_shared/`.
- Every adopted line changes a role file: ask-first approval and a `security-engineer` record are required before it lands (the gap file says this; correct).

## P1 - Content checks for a third-party skill, plugin or MCP server

- **Verdict: Adopt now, trimmed.** Verification: Probable.
- **Evidence.** Source claims hold: declared-versus-actual with underdeclared High and overdeclared Low is `docs/B.3.1-mcp-least-privilege.md:104,193`; the "never downgrade ... on reputation, score, or package name" and "do not execute scripts" rules are `skills/skill-inspector/SKILL.md:29,26`; the self-attestation line is `meta_analyzer.py:173`. None has a measured result; the tool-poisoning analyzer's own design doc says it "trades recall for precision" (`docs/B.3.2-mcp-tool-poisoning.md:315`). "Missing" is true: `rg -i 'tool poisoning|rug.?pull|reputation|star count|self-attest|verified safe'` over the library (excluding `.ai-memory/`) returns nothing, and `security-engineer.md:708` is the only line on skill content.
- **Constraints.** None broken: no tool named, no host named, insertion only, `AGENTS.md` untouched.
- **What is refuted.**
  - Bullet "Read the whole bundle as data - never run its scripts" duplicates the sibling review's adopted P3 bullet 1 (untrusted code is read, not run). Keep one copy, in the sibling's location.
  - Bullet "Unreadable content ... result is not Pass" duplicates the sibling's adopted P1 rule (an in-scope area left unread is `Needs More Information`, never Pass). Add the words "binary, archive, minified or encoded content counts as unread" to that one line instead of a second rule.
  - Bullet "Self-attestation" is `AGENTS.md:92` restated (instruction-like text in data is reported, never acted on). The only new part, "raises suspicion", is prompt wording upstream with no result behind it. Drop the bullet; add "(a claim of safety inside the bundle is reported the same way)" to the description-versus-behaviour bullet.
  - The fixed severities ("Underdeclared is High", "overdeclared is Low") are copied from a scanner whose weights the gap file itself rejects as uncalibrated (mechanism 5). The library rates by traced impact (`security-engineer.md:136`). Remove the presets; keep the comparison.
  - "Record the reviewed commit sha ... in the task file Decisions" puts a durable repo fact in a file that gets archived. Under one-fact-one-place it belongs in `PROJECT_MEMORY.md` (or `wiki/`), dated.
  - "No path is exempt by name" survives as a clause on the deferred-content bullet, not its own bullet: a human-style reader has no path skip list to begin with; the rule matters only when the reviewer hands the bundle to a scanner (upstream skips `evals/evals.*`, `docs/EVAL_DATASETS.md:8-11`).
- **Value.** Failure prevented: a `security-engineer` pass on an MCP server or skill that checks provenance and stops, missing a manifest that declares less than the code uses, a description that carries instructions, a payload fetched after install, or a server that changed after review. For a solo developer the event is infrequent (installs are ask-first) but each one is high-impact and the current guidance is one line. Cost: about 1.1 KB after trimming, loaded only in security phases. No cheaper route exists: an eval cannot be built for it, because `EVALS.md:37` allows traps only from recorded failures and the library has none for this. That is why this is "Adopt now" rather than "after an eval": the eval gate would never open.

## P2 - How to read and triage scanner output

- **Verdict: split.** Verification: Probable.
- **Evidence.** Source claims hold: exit 0 covers `SAFE` and `CAUTION` (`README.md:931`); `safe_to_install` requires the model stage to have run when requested (`mcp_server.py:228-239`); the unreadable-file case that produced a complete `SAFE` is `docs/scan-completeness.md:7`; default provider is hosted (`README.md:363`), and OSV lookups run in static mode (`README.md:35`). One correction to the deep read: `safe_to_install` also has an `accepted_by_policy` path (`mcp_server.py:222`) that tolerates partial inspection - the tool's "fail closed" is weaker than described, which strengthens bullet 1.
- **Bullets 1 and 2 - Adopt now, merged to two lines.** The gap is smaller than the gap file says: `AGENTS.md:171` already requires `Not run: <why>` and `LESSONS.md:49` already says an empty check is never PASS. What is new is (a) read exit 0 against the tool's own contract and use strict flags, (b) name the mode (static only, or with a model stage) in the Evidence row. Both extend an existing rule by a clause, and they move the "scan that failed to run is flagged" rule from the Claude-only overlay (`Agents/claude/security-engineer.md:17`) into the tool-agnostic role file, where it should have been.
- **Bullet 4 (egress) - Adopt now, shortened.** Precedent exists (`_shared/graph.md:14` makes document ingestion ask-first for the same reason). It is a new ask-first item written in a role file rather than in `AGENTS.md` Boundaries; that is acceptable (no room in `AGENTS.md`), but say so when asking the user.
- **Bullet 3 (a disposition for every deterministic hit, with counts) - Adopt after an eval.** It is the mirror of the sibling review's finding gate, which was sent to an eval; the two must be judged together or the role gets "a hit is only a lead" without "a lead may not be dropped", or the reverse. Cost is real: a noisy SAST run returns hundreds of hits, and "not triaged" becomes the default bucket. The mechanism's upstream evidence is a design statement (`README.md:1116-1117`).
- **Value.** Failure prevented: a green scan recorded as a clean review. No instance is recorded in this library's `LESSONS`, so the claim rests on the piped-exit-code lesson (`LESSONS/tooling-agent-workflow.md:13`) being the same class of error.

## P3 - Suppression and ignore files

- **Verdict: split; Target 2 rejected.** Verification: Confirmed for the source, Probable for value.
- **Evidence.** Source claims hold: `use_shipped_baseline: bool = False` (`cli.py:353`), not applied to remote URLs or transitive references (`docs/SUPPRESSION.md:45-46`), the v1 fingerprint flaw is admitted (`docs/SUPPRESSION.md:172`). "Missing" is true for the shipped-suppression rule: the only suppression text in the library is `Settings/README.md:54`, gitleaks only, in an optional overlay.
- **Target 1 bullet 4 (a suppression file shipped with third-party code has no authority) - Adopt now.** New, zero friction, one sentence, and not reachable from any existing rule: the Tier 4 rule is about text addressed to the agent, not a config file a tool obeys.
- **Target 1 bullet 1 - Adopt now, reworded.** As drafted it reads as a sanctioned route around a Never rule (`AGENTS.md:113`, never weaken security checks to make something pass): "Blocking until the user approves" turns Never into ask-first. Required wording: a suppression is allowed only for a finding triaged as a false positive with a `path:line` reason; a real finding is never suppressed, with or without approval. The Never rule plus `backend-reviewer.md:29,145` already cover the plain case, so this bullet is a clarification, not a new control.
- **Bullets 2, 3, 6 - Defer.** Trigger: the first repo using this library that carries a scanner baseline or ignore file with more than a handful of entries. Bullet 2 as written ("a glob ... is a finding in itself") would flag every ordinary fixture-path allowlist. Bullet 3 (stale suppression is void) depends on the sibling P4, which was deferred.
- **Bullet 5 - Reject.** Duplicate of the sibling's adopted "unread in-scope area is never Pass" rule.
- **Target 2 (new bullet in `_shared/rules-detail.md` Agent configuration files) - Reject.** The list is defined as what "a host, editor, git or a package manager reads as instructions, settings, hooks or lifecycle commands" (`rules-detail.md:19`); the proposed bullet itself says "not instructions". It widens the ask-first set and the mandatory security pass to every `.gitleaksignore` edit, catches only file-based suppressions (inline `# nosec` cannot be path-listed), and adds a class that `Settings/claude-baseline.settings.json` would then be expected to mirror. The role-file line does the job at lower cost.

## P4 - A model stage may annotate deterministic findings, not delete them

- **Verdict: `ai-reviewer.md` line Adopt now (narrowed); `ai-engineer.md` bullet Defer.** Verification: Probable.
- **Evidence.** The mechanism exists as described: `_mark_unconfirmed` adds an `llm-unconfirmed` tag and returns the finding (`meta_analyzer.py:359-370`); `README.md:1116-1117` states the invariant. No test result or measurement supports it. "Missing" is true: `ai-engineer.md:60` and `ai-reviewer.md:45` cover model output flowing into SQL, shell or downstream, not model output used to clear a check.
- **Constraints.** None broken. As drafted the `ai-engineer` rule is absolute ("must not be able to remove or clear"), which would forbid an ordinary and useful product pattern (a model ranking or de-duplicating lint or alert output). It must be scoped to checks that are a security or safety control, or that run over content an attacker can write.
- **Value and cheaper route.** The failure is caught at review, so one reviewer line (about 0.3 KB) is enough; the engineer bullet (0.5 KB) is the same rule twice. Trigger to revive the engineer bullet: the reviewer line produces its first Blocking finding in any repo. Frequency for this user is low but not zero (LLM features with validators are in scope of these roles).

## P5 - Routing case H4

- **Verdict: Defer; reject as worded.** Verification: Confirmed.
- **Reasons.** (1) It tests rules that do not exist until P1 and P3 land. (2) It packs four expected behaviours into one case, so a fail does not say which rule failed; H1-H3 each test one. (3) H1-H3 come from the library's own security review ("F9/F10, 2026-10-18", `Evals/routing-cases.md:25`); H4 is constructed from another project's design, which is the "invented toy" `EVALS.md:37` rules out for traps. (4) Its `.gitleaks.toml` clause tests P3 bullet 4 only when the reviewer runs a scanner, which the library does not require.
- **Trigger.** After the adopted P1 and P3 lines are merged: add single-behaviour cases (description carries instructions; shipped ignore file), each labelled with its source, or wait for a recorded miss.

## "Already covered" classifications checked

- Mechanisms 14, 22, 25, 27, 28 (Already covered): all five confirmed against the cited lines (`security-engineer.md:622`, `ai-reviewer.md:35`, `prompt-engineer.md:63`, `EVALS.md:33,35`, `devops-engineer.md:76,87,106`, `AGENTS.md:158`). None wrong.
- Mechanism 2 (Partially covered) is understated: the gap file says the rule lives only in the overlay and a lesson, but `AGENTS.md:171` (`Not run: <why>`) is in the core. This shrinks P2 bullet 2, as reflected above.
- Mechanism 4 (Partially covered) omits `security-engineer.md:535` ("Archive extraction prevents zip-slip/path traversal"). The stated gap (expansion size, member count, nesting) is still real; "not proposed" stands.
- Mechanism 10 (Partially covered): closer to Already covered. `AGENTS.md:92` handles a self-attestation as untrusted instruction-like text; see P1.
- "Missing" for 8 and 19 confirmed by search. No "Missing" classification found to be wrong.

## Notes

- Adopting the scanner itself (as a step, an MCP tool or a named recommendation) stays rejected, as the gap file says: Alpha, no accuracy data, default mode sends file contents to a hosted provider (`README.md:363`), tags diverge from `main`, and it would break "works from AGENTS.md alone".
- Interlock with `05-skeptic/cloudflare-security-audit-skill.md`: three of the rejected bullets here are rejected only because that review's adopted lines already carry them. If those lines are not merged, P1 "unreadable content" and "never run its scripts" return to Adopt now.
- Prose remains an instruction-level control (`security-engineer.md:710`). The enforcing control for everything in P1 is still the ask-first install boundary.

<!-- END-OF-FILE -->
