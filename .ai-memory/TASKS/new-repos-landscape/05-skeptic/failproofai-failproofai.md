# Skeptic review: FailproofAI/failproofai proposals

- Date: 2026-11-18. Role: researcher (independent skeptic; default is refute). Non-interactive run. No library file edited, nothing installed, no failproofai code run.
- Inputs read as data: `04-gap/failproofai-failproofai.md` (proposals P1 to P7, 19 classified mechanisms), `03-read/failproofai-failproofai.md`.
- Upstream re-checked from a fresh shallow clone: `FailproofAI/failproofai` default branch @ `97dc40e` (2026-11-17), the same commit the deep read used. Files opened: `src/hooks/enforcement-capability.ts` (header, cells, lookup function), `src/hooks/builtin-policies.ts:2425-2500`, `src/hooks/pack-store.ts`, `src/hooks/pack-failclosed.ts:1-40`, `src/hooks/agent-skill.ts`, `src/hooks/codex-system-hooks.ts`, `src/hooks/semantic/combine.ts:65-85`, `docs/policies/authority.mdx:75`, `PROBE-FOLLOWUP.md`, `osv-scanner.toml`, `__tests__/hooks/` listing.
- Host docs read for P2 (2026-11-18): `code.claude.com/docs/en/permissions.md` and `/permission-modes.md` (sections "Protected paths", "Actions no mode auto-approves").
- Library re-checked on disk at `0d5faf3` (branch `main-xpl0sx`): `AGENTS.md` 32,668 bytes / 194 lines (`wc`). No proposal touches it; confirmed.
- Not checked: failproofai issues and PR threads (not attempted), its `CLAUDE.md`, the private canary results, any live host behaviour. No permission rule was tried in a real session. `Scripts/Lint-Library.ps1` and the hook tests were not run (nothing changed).
- Instruction-like text met in the source: the SKILL.md body in `agent-skill.ts:55` ("read the full skill, which is kept current online ... `curl -fsSL <url>`"). Already reported by the deep read; not fetched, not followed.

## Evidence that applies to every proposal

- The upstream quotes in the deep read and gap check hold. Checked word for word: the capability-table header and its "ABSENT MEANS UNKNOWN" rule, the eight `Stop: "block"` cells, the OVERTURNED and FIXED cell comments, the self-protection comment about writing the config file without a shell, "NOT a signature ... deliberately deferred", the `/etc/shadow` 0.69 case, the `13.9% -> 8.7%` and `132 of 234` figures, the Codex 0.129 trust gate, `ignoreUntil` plus `reason` in `osv-scanner.toml`, and the four unchecked items in `PROBE-FOLLOWUP.md`.
- All of that evidence is the vendor describing its own tool. None of it measures a rule in this library's shape. The published attack figures still do not appear in `CHANGELOG.md` (0 matches), as the deep read said.
- The capability table is not evidence that a table prevents drift. Its own header says several Codex rows cite files that "no longer exist at those paths in 0.147.0". The table made the drift visible after a re-probe; it did not stop it.
- The library has no recorded failure behind any of P1 to P7. Searched `LESSONS.md`, `LESSONS/` and `Evals/trap-tasks.md` for a disabled hook, an edited settings file, a bypassed guard, a permanent scanner ignore and a model-cleared check: no hits. `EVALS.md` Results log still reads "(none yet)", so "Adopt after an eval" would mean "not yet" in practice. Nothing below lands there.
- Every "Adopt now" below edits an agent-configuration file (`Hooks/**`, `Settings/**`, `EngineeringTeam/**`): ask-first plus the `security-engineer` pass, as the gap check says.

## Verdicts

| # | Proposal | Gap-check stance | Skeptic verdict | Verification |
|---|---|---|---|---|
| P1a | Three-valued "Enforcement by host" table in `Hooks/README.md` | Adopt | **Defer** | Confirmed (source); "Missing" overstated |
| P1b | Lint `W4`: every overlay file has a table row, every cell a date | Adopt | **Defer** (with P1a) | Confirmed |
| P2a | Ask rules for user-level overlay files and `core.hooksPath` | Adopt | **Adopt now, narrowed** | Confirmed (host docs); live behaviour Unverified |
| P2b | New `rules-detail.md` section "Guards are the user's to switch off" | Adopt | **Adopt now, one sentence in an existing section** | Probable |
| P2c | `Settings/README.md` wording (ask bullet, reorder line 30) | Adopt | **Adopt now** for the ask bullet (follows P2a); **Reject** the reorder | Confirmed |
| P3a | State each hook's failure direction in `Hooks/README.md` | Consider | **Reject** | Confirmed |
| P3b | Security finding states whether the cited control is installed | Consider | **Adopt now, first clause only** | Confirmed (gap); benefit Probable |
| P4a | `LIBRARY_REF = "main"` labelled "Pinned ref" | Adopt | **Adopt now: correct the label** (option 2); **Defer** the real pin (option 1) | Confirmed |
| P4b | Skills line: pin to sha or digest; remote-pointer skill is Blocking | Adopt | **Adopt now, amended** (third-party scope; drop the checksum clause) | Confirmed (source, gap) |
| P4c | Add `.failproofai/**` to the agent-config class list | Optional | **Reject** | Confirmed |
| P5 | Model-judged override check in `security-engineer` and `ai-reviewer` | Consider | **Defer** | Confirmed (source); "Missing" overstated |
| P6a | `prompt-engineer`: record a failing case before editing measured wording | Consider | **Reject** | Confirmed |
| P6b | `EVALS.md` "open gap" row | Consider | **Reject** | Confirmed |
| P7 | Scanner suppressions carry a reason and an expiry | Consider | **Adopt now, shrunk to a clause** | Confirmed (source, gap); benefit Probable |

Rejections the gap check already made (M4 daily canary, M6 pause command, M9 classifier in the tool path, M14 auto-loaded repo policies, M15 managed-layer install, M17 session audit, failproofai itself as an overlay): agreed, not re-argued.

## Reasons

### P1a and P1b. Enforcement table and lint: Defer

The source is real and quoted correctly. The gap is smaller than the gap check says. `README/ORCHESTRATION_README.md:180` already states that `Hooks/` "adds host-side enforcement for two of its rules on Claude Code and degrades to nothing elsewhere". `Hooks/README.md:33` says Codex and Cursor registrations are not shipped. `Settings/README.md:3` opens with "Optional Claude Code overlay". So the claim that "nothing tells" a Codex or Cursor user is false. With one host shipped, a five-row grid carries one informative column; the other cells all read "not verified (not shipped)". The draft also has four defects. The gitleaks row says `block` for Codex and Cursor with no evidence kind, version or date, which breaks the table's own rule. "Advisory for any indirect form" is wrong, because an unmatched command gets no message at all. `handoff-check.mjs` exits 2 once, so neither `block` nor `advisory` fits it. The Codex 0.129 line imports a single-vendor claim about a hook the library does not ship. The re-check rule ("a cell older than the host's current major/minor is due") would leave every Claude Code cell permanently overdue, since the host releases several times a week; the existing trigger in `Settings/README.md:3` ("re-verify when a rule stops matching") is the affordable one. `W4` would parse a Markdown table in PowerShell to guard five files that rarely change. Session token cost is zero either way; the cost is upkeep. Revive when a second host's overlay ships (a Codex or Cursor hook registration), or when an overlay is found undocumented or over-claimed in use.

### P2a. Ask rules for user-level overlay files: Adopt now, narrowed

The gap check left one point unverified: does the host already prompt for `~/.claude/settings.json`? It does, in most modes. The Claude Code docs list `.claude` as a protected directory, name `~/.claude/` explicitly, and give the outcome per mode: prompted in `default` and `acceptEdits`, denied in `dontAsk`, sent to the classifier in `auto`, **allowed in `bypassPermissions`**. The same page says a tool matched by an explicit ask rule is not auto-approved in any mode. So the rule is redundant in manual modes and adds a real prompt in `auto` and `bypassPermissions`, which is where an agent rewriting its own deny list matters. That matches why `Edit(.claude/**)` is already on the ask list. The broad form `Edit(~/.claude/**)` is the wrong shape: the docs exempt plan files and auto-memory files under `~/.claude/` from protection, and a blanket ask rule would prompt on each of those writes. Adopt the narrow set: `Edit(~/.claude/settings.json)`, `Edit(~/.claude/agents/**)`, `Edit(~/.githooks/**)`, and the `Bash` and `PowerShell` forms of `git config *core.hooksPath*`. `~/.githooks` is the genuine hole: `Settings/README.md:50-51` tells the user to install the secret gate there, and it is not a host-protected path. Drop `Edit(~/.codex/**)` and `Edit(~/.cursor/**)`: the library installs nothing there, so there is no enforcement file to protect. Session cost is zero (settings are not in context). One live `/permissions` check is still owed before it ships; no rule was tried in a session here. The Bash rule is text-matched, so it is defence in depth, as `Settings/README.md:25` already says of every shell rule.

### P2b. "Guards are the user's to switch off": Adopt now, one sentence

Most of the draft section restates existing rules: `AGENTS.md:112` (agent-config edits are ask-first), `AGENTS.md:113` (never weaken a check), `rules-detail.md:87` ("a timeout is not a no that licenses a workaround"). The one new idea is that a blocked action must not be reached through a different tool, and that the agent quotes the guard and stops. The upstream fix history supports it (the shell guard was bypassed by a plain file write), and agents routing around a denied command is a commonly reported behaviour, though the library has no recorded case, hence Probable. A new section at the end of `rules-detail.md` would have no pointer from `AGENTS.md`, which has 100 bytes of headroom, so it would rarely be read. Append one sentence to `## Agent configuration files (Boundaries)` instead, which `AGENTS.md:112` already points to: "When a guard (hook, deny or ask rule, scanner gate) blocks work the task needs, stop, quote its message and name the rule; never reach the same effect through another tool, a script or an interpreter." Drop the `CLAUDE_CONFIG_DIR` sentence: it is host-specific text in a tool-agnostic shared file, and `Settings/README.md:30` already has it.

### P2c. Settings README wording

The ask-bullet change is the documentation of P2a and goes with it. The reorder is a no-op: `Settings/README.md:30` already names the second config directory first and the `/permissions` route second, with "restore it afterwards".

### P3a. Hook failure direction: Reject

`Hooks/README.md` already says per hook what matters to a user: `session-reentry.mjs` "Never blocks", the gitleaks hook "fails closed", every hook is "a silent no-op" outside opted-in repos, and line 18 gives `/hooks` as the check. I read the `catch` blocks in `handoff-check.mjs` (lines 49, 87, 127): they return empty values, so the hook allows on internal error, as the gap check says. Writing that down changes no behaviour and prevents no failure anyone has seen. Revive if a hook is found inert in the field.

### P3b. "Installed here" on a cited control: Adopt now, first clause only

This one has a structural case inside the library. The deny baseline is user-level and "never checked into a project" (`Settings/README.md:7`), and cloud sessions "read only the repo" (`Hooks/README.md:3`). So in every cloud or CI session the baseline is absent, while `security-engineer.md:710` asks each finding to name the enforcing control. A record can truthfully name the baseline and still describe a run where it did not exist. Extend the bullet at line 710 with: "and states whether that control is installed where the change runs (`verified: <command and output>`) or `not verified`; an overlay not shown to be installed counts as prose." Cost is one sentence in a role file read only during a security phase. Drop the second clause about post-action hooks: the library ships none, and the gap check found nothing that over-claims.

### P4a. "Pinned ref" over `"main"`: correct the label now, defer the pin

The defect is real: `session-start-library.mjs:35-37` and `Hooks/README.md:9` both say "pinned", the value is `"main"`, and `session-start-library.test.mjs:95` asserts `main`. Fix the two labels to say it tracks `main`; the hook already prints the resolved sha for the Evidence row. The comparison with failproofai's remote skill pointer is overstated. That channel is a third party's branch feeding every agent on a machine. This one is the maintainer's own repository, and a local checkout tracks the same branch. A real pin has costs the gap check did not count: the library has no tags (`git tag` returns none), and a sha pin means re-running `Sync-AgentsMd.ps1 -WithCloudHook` in every repo after each library change, or cloud sessions silently obeying old rules. A pin in the hook also would not close the channel, because `AGENTS.md` resolution step 3 tells a non-interactive session to clone the default branch anyway. Revive the pin when the library is tagged, or when anyone other than the maintainer can push to it.

### P4b. Skills line: Adopt now, amended

Confirmed gap: `security-engineer.md:707` says "Provenance and pinning" for MCP servers, while line 708 says only "Provenance" for skills, plugins and subagents. The remote-pointer pattern is live; I read it in `agent-skill.ts:46-55`. `Evals/routing-cases.md` H2 covers a lesson arriving through data, not a skill that tells the agent to fetch its body. Adopt: "Provenance and a pin to a commit sha or recorded digest for third-party content (a branch or tag is not a pin); a skill or instruction file whose body tells the agent to fetch its real content from a URL is an unpinned instruction channel and is Blocking." The words "third-party" are needed: without them the library's own cloud hook fails the rule it ships. Drop the checksum sentence; it is true, but no review in this library has met the case. Revive it at the first review of a tool that publishes its own checksums.

### P4c. `.failproofai/**` in the class list: Reject

`rules-detail.md:19` already says the list is "illustrative of classes, not exhaustive" and defines the class. Adding one directory per tool studied does not scale, and no repo here uses the tool.

### P5. Model-judged overrides: Defer

The source holds (`authority.mdx:75`; `combine.ts:75-76`). "Missing" is too strong: `ai-reviewer.md:23` already makes "model/NLP/retrieval output trusted or acted on without validation" Blocking, and a model verdict that clears an authorization check is that case. What is new is the specific warning that a threshold is not a floor, and that the measure is attacks let through. That is useful for a product that puts a classifier in front of a deny list. No repo using this library is recorded as building one, and `security-engineer.md` is already past 990 lines. Revive at the first project where a model's verdict gates or clears a permission, validator or deny rule.

### P6a and P6b. Record the unfixed case: Reject

The gap check missed `ai-engineer.md:86`: "when a new failure mode appears, add the failing case first, then fix (regression eval)". With `prompt-engineer.md:59` ("Every prompt change runs the eval") the rule is already in place; only the "leave it open with a dated stopgap" wording is new, and the gap check itself rates the loss as "little". For the library's own text, `LESSONS.md:28` (a misfiring role instruction is surfaced and recorded) and its `## Proposed` section already hold field failures. An "open gap" row in an `EVALS.md` log that reads "(none yet)" would be a second place for the same fact.

### P7. Suppression expiry: Adopt now, shrunk

Confirmed upstream (`osv-scanner.toml:70-86`, each ignore has `ignoreUntil` and a `reason`). Confirmed gap: `security-engineer.md:672` asks for "documented mitigation and risk acceptance" with no date, and `Settings/README.md:54` covers only the gitleaks allowlist. A permanent ignore is a common, quiet failure and the check is mechanical. The full draft bullet over-promises: `npm audit`, `pip-audit` and the gitleaks allowlist have no dated ignore, so in those the date is a comment and nothing turns red by itself. Extend line 672 to "... risk acceptance with a re-review date; a suppression (ignore entry, allowlist, inline marker) with no date, or past it, is a finding". Skip the `devops-engineer` mirror: line 85 there already forbids making a red step non-blocking, and dependency changes get the security pass anyway. Agreed that adding OSV-Scanner is a separate `researcher` decision.

## Classifications found wrong or overstated

No "Already covered" classification was found wrong. M19 and M14 hold as cited (`AGENTS.md:106`, `:113`; `Hooks/README.md:3`). Three "Partially covered" or "Missing" entries understate existing coverage:

- **M1, M2 and the P1 "lost by not adopting" claim.** `README/ORCHESTRATION_README.md:180` already says the hooks enforce "on Claude Code" and degrade "to nothing elsewhere". The gap check did not cite it.
- **M5 / summary defect 2.** "No rule in the baseline names that file" is true, but the host protects `~/.claude/` by itself in `default`, `acceptEdits` and `dontAsk` modes. The exposure is `bypassPermissions` and `auto`, plus `~/.githooks`, which nothing protects.
- **M10.** `ai-engineer.md:86` already has the add-the-failing-case-first rule.
- **M8.** Marked "Missing (as a review check)"; `ai-reviewer.md:23` covers the general case.

## Completion

- Role used: `researcher` (skeptic). This file is the only write. `ROADMAP.md` not touched (the sweep's parent owns it).
- Evidence: `wc -c -l AGENTS.md` | size check | 0 | `0d5faf3` (32,668 bytes, 194 lines). `git clone --depth 1` of the upstream | source re-check | 0 | `97dc40e`. `git tag` in the library | P4a | 0 | no tags. Not run: `Lint-Library.ps1`, hook tests (no library file changed); no permission rule tried on a live host.
- Code & Source Graph: not used; the checks were `rg` and direct reads over Markdown, three hook scripts and one settings file.
- Risks: line numbers are as of `0d5faf3` and will drift. P2a rests on the host docs as read today, not on a probe.
- Recommended next phase: `security-engineer` review of P2a, P2b, P3b, P4a, P4b and P7 as one small change, with the `/permissions` check for P2a done first.
- Lessons: none.

<!-- END-OF-FILE -->
