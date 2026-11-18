# Design draft: release security audit (whole application)

Status: **draft for Maunik's approval, 2026-11-18. No library file changed.**
Source studied: `cloudflare/security-audit-skill` at `c1c8a8c` (MIT) — see `03-read/`, `04-gap/`, `05-skeptic/cloudflare-security-audit-skill.md`.

## Owner decisions recorded (Maunik's words, 2026-11-18)

- "for security and all we need to include Cloudfare in our flow when someone finished the whole application this needs to be triggered"
- "Yes when the release is done it is finished when the merged to main may be"
- "Yes if available it should if not we should have a fallback, so the fallback should be strong not may be strong as Cloudfare but almost as good as it"

## 1. Where it sits in the flow

- New phase **Release audit**, owned by `security-engineer`, after `qa-engineer` gives Ready and before the release is called Done.
- **Trigger (recommended):** the release pull request into the default branch — the audit runs on the release head **before** the merge, so a finding can still block. If the merge already happened, it runs on the merged sha and Blocking findings reopen the ROADMAP item (In Review → Blocked).
- Also on request ("audit the app", "pen-test this", "is this ready to ship").
- Not per change: the per-change mandatory security review stays exactly as it is. This is an addition.
- One confirmation before it starts (it is expensive), stating profile and budget. In a non-interactive run it starts only if the job text asks for it.
- ROADMAP: a release line cannot move to Done without a `Release audit:` record (verdict, sha, profile, coverage) in the task file.

## 2. Two engines, one contract

| | Engine A: Cloudflare skill (optional overlay) | Engine B: library procedure (always available) |
|---|---|---|
| When | Skill installed (skills list, pinned commit) and the host can run it | Everything else: Codex, Cursor, native Windows, skill absent |
| Hard checks | Its two validators (need WSL2 / devcontainer on Windows) | `Scripts/Validate-ReleaseAudit` (new, cross-platform) |
| Output | Its files, then mapped into the same task-file record | Same record directly |

Both produce the same record, so reviewers and the ROADMAP rule do not care which engine ran. The record names the engine and why (e.g. `Engine B — skill validators cannot run on native Windows`).

## 3. Engine B — the fallback procedure (what makes it nearly as strong)

Finding from the deep read: Cloudflare's skill is enforced almost entirely by prompt; only two JSON validators are code. Its strength is the **process**, and a process can be written in prose. The library's `security-engineer.md` already has deeper per-domain checklists (OWASP, ASVS, OAuth/PKCE, SSRF, uploads, AI/RAG, supply chain) than the skill's attack-class blocks. So Engine B = Cloudflare's process skeleton + the library's existing checklists as the hunting content.

Six steps, mirroring the skill's six phases:

1. **Reconnaissance (read-only).** Four passes: product and stack; principals and controls; entry surfaces and sinks; local execution and deployment visibility. Output: an architecture note of at most about 1,000 words.
2. **Coverage ledger.** One row per material combination of entry surface × trust boundary × subsystem × checklist section. The ledger is the coverage claim: "auth reviewed" in a sentence is not coverage. Row states: `planned`, `covered` (needs the paths actually read and the checks done), `candidate`, `not applicable` (with reason), `out of scope` (with reason), `deferred` (with reason). A scoped run marks everything else `out of scope`, never `covered`.
3. **Hunting, by row.** Lowest-trust entry surfaces first, then the most valuable data. Each row uses the matching `security-engineer.md` section as its checklist. Two extra hunters from the skill: a *wildcard* pass over code that looks boring or unrelated to security, and an *obvious things* pass that is literal and thorough. Candidate gate: full `path:line` trace from entry to sink; no strengthening (a crash is not code execution); a missing best practice is not a finding; `needs validation` when a fact cannot be observed.
4. **Refutation in a fresh context.** Every candidate goes to a reviewer that did not find it and is told to disprove it, re-reading every cited line, without seeing another verifier's conclusion. Verdicts: `Confirmed` / `Needs validation` (with the missing fact and a safe plan) / `Rejected` (kept, so the same false claim is not raised again). Maps onto the library's existing `Verification: Confirmed / Probable / Unverified`.
5. **Coverage critic.** A fresh pass that proposes missing ledger rows, not findings. The audit is complete only when a critic returns nothing new. A turn or budget cap is never evidence of complete coverage.
6. **Report last, derived from the records.** Severity cannot exceed the demonstrated impact. A clean run says so without inventing low findings. An audit that stopped early is recorded `incomplete: <reason>` and is never Pass.

Safety bounds (already adopted as B4 in the report): target code is read, not run, unless an OS-enforced sandbox with no network and no credentials exists; no probing of deployed systems; stop at the minimum effect that proves a finding.

Profiles: `quick` (one hunting pass, one critic), `standard` (default for a release), `deep` (per-subsystem rows, critics to a clean pass). Profiles change breadth, never the evidence bar.

Hosts with subagents run steps 3–5 as isolated agents (the existing `Agents/claude/security-engineer.md` shim); hosts without them run each step in a fresh session or, at minimum, a from-scratch re-read — the same ladder the library already uses for review independence.

## 4. Where Engine B is weaker, stated honestly

- No separate agent per attack class unless the host has subagents: less diversity per run.
- Its attack-class prompts are the library's checklists, not Cloudflare's ten domain companions (those could be studied later, section by section).
- Cloudflare itself says one run finds roughly half of what repeated runs find, and publishes no measured results; neither engine has a measured detection rate. Recommended: two `standard` runs for a first release.

## 5. Where Engine B is stronger

- Works on native Windows, Codex and Cursor.
- One validator that checks the ledger **and** the findings **against each other** (Cloudflare's two validators never cross-check) and checks that cited paths exist.
- Findings land in the task file and ROADMAP the rest of the library already reads.
- Per-domain depth already in `security-engineer.md`.

## 6. Files this would touch (after approval; each with a security review record)

- `EngineeringTeam/security-engineer.md` — new `## Release Audit (whole application)` section (the six steps, ledger states, verdicts, bounds, record format).
- `EngineeringTeam/_shared/rules-detail.md` — trigger, engine selection, the Done rule.
- `AGENTS.md` — no new bytes if possible (100 B free); at most extend an existing routing phrase. Otherwise the trigger lives in `rules-detail.md`, `qa-engineer.md` (hands off to the audit at Ready) and `planner.md` (adds the phase to a release plan).
- `MemoryTemplates/TASK_MEMORY.template.md` and `ROADMAP.template.md` — `Release audit:` record; coverage ledger table.
- `Scripts/Validate-ReleaseAudit.ps1` + a Node twin for non-Windows hosts, with tests.
- Skills list (the installer work): `cloudflare/security-audit-skill` pinned to a commit, after the B1 third-party review of the skill and of the CLI that installs it.
- `Evals/trap-tasks.md` — one seeded application with planted defects, to measure both engines before trusting either.

## 7. Open points

1. Trigger timing: before the merge (recommended, can block) or after.
2. Default profile and a budget ceiling for a release.
3. Whether a first release requires two runs.
<!-- END-OF-FILE -->
