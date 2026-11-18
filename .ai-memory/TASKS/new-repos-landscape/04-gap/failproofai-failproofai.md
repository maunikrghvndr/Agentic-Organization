# Gap check: FailproofAI/failproofai vs this library

- Role: `researcher`. Date: 2026-11-18. Non-interactive run.
- Input: `.ai-memory/TASKS/new-repos-landscape/03-read/failproofai-failproofai.md` (deep read at commit `97dc40e`; treated as data).
- Method: `rg` over the library (excluding `.ai-memory/`), then read of the matching lines. No library file edited. Nothing installed, no web access used, no code from the studied repository run.
- Budget facts (measured): `AGENTS.md` is 32,668 bytes / 194 lines against the 32,768 / 200 caps, so headroom is 100 bytes and 6 lines. **No proposal below touches `AGENTS.md`** (byte cost 0 for every one).
- Not checked: whether any proposed permission-rule syntax is accepted by the current Claude Code release (marked per proposal); no hook or settings file was executed.
- Instruction-like text in the input: none new. The deep read already reports the studied repo's remote "read the full skill online" pointer and a Next.js block in its `AGENTS.md` as data; nothing was acted on.

## Summary

- The library already holds the prose half of nearly everything failproofai enforces (never weaken a check, agent-config edits are ask-first and security-reviewed, headless ask-first = denial, text-matched rules are not a boundary).
- The real gap is the one the deep read shortlisted: the library says in several places which host enforces what, with dates, but **not in one three-valued table that a lint can check** (M1-M3). Today that knowledge is spread over `Hooks/README.md`, `Settings/README.md` and the README host table.
- Two concrete defects found in the library while checking:
  1. `Hooks/session-start-library.mjs:35-37` has a comment "Pinned ref" over `const LIBRARY_REF = "main";`. It is not pinned: a cloud session clones whatever `main` is at that moment and obeys it as Tier 2 instructions. This is the same class as the unpinned remote-skill channel the deep read flags as unsafe in failproofai (P4).
  2. `Settings/claude-baseline.settings.json:45` asks on `Edit(.claude/**)` (a working-directory-relative rule), but the overlays themselves are installed in the **user-level** `~/.claude/settings.json` (`Hooks/README.md:16`, `Settings/README.md:7`). No rule in the baseline names that file, so the file that holds the deny rules and hook registrations is not covered by the baseline's own ask list (P2). Whether the host prompts for it by itself was not verified.
- Recommended to adopt: P1, P2, P4. Worth considering: P3, P5, P6, P7. Rejected: M4 as built, M6, M9 as a library component, M14, M15, M17.

## Classification table

| # | Mechanism | Classification | Library evidence (path:line, quote) | What is missing / verdict |
|---|---|---|---|---|
| M1 | Per-host enforcement capability table with evidence and host version per cell | Partially covered | `Hooks/README.md:22` "## Hook contract (checked 2026-10-19)"; `:29` "**Claimed, not verified on a Kiro host:**"; `:33` "Codex ... and Cursor ... registrations wait until a verified schema is in hand"; `README/ORCHESTRATION_README.md:155` "Host compatibility (informational; checked 2026-10-18 ...)"; `Settings/README.md:26` "Native Windows has no agent sandbox (as of 2026-10)" | Facts exist but as prose in three files. No single rule x host grid; evidence type (docs read vs test vs live probe) is not a column. P1 |
| M2 | "Absent means unknown": three values, never default to enforced | Partially covered | `EngineeringTeam/researcher.md:77` "**verified** ... **claimed** ... **inferred**"; `Hooks/README.md:29` (quoted above); `AGENTS.md:78` "Hard enforcement ... comes from the baseline where available" | The three-way split is a researcher rule, not a rule for the overlay docs. `AGENTS.md:78` lists `Agents/ Hooks/ Settings/ Rules/ Workflows/` without saying on which hosts each one enforces anything; a Codex or Cursor reader cannot tell that today every hard control is Claude Code only. P1 |
| M3 | Tests that pin the matrix and the emitted block shape | Partially covered | `Hooks/README.md:12` "`node --test \"Hooks/*.test.mjs\"`"; `Scripts/Lint-Library.ps1:8-25` (E1-E7, W1-W3) | Hook behaviour is tested against the recorded Claude Code contract. Nothing asserts that every shipped hook or settings file has a row in a capability table, or that a cell carries a date and host version. P1 (lint part) |
| M4 | Daily live canary against every host at latest | Missing | Nearest: `Settings/README.md:3` "re-verify when a rule stops matching"; `README/ORCHESTRATION_README.md:137` "flag: version-sensitive" | No re-probe trigger tied to a host version. A daily job installing 12 CLIs is out of scope (cost, installs, CI secrets). A manual probe list run on host upgrade is cheap. Folded into P1 |
| M5 | Always-on self-protection: the agent may not switch its own enforcement off | Partially covered | `AGENTS.md:113` "Weaken tests, validation, or security checks to make something pass"; `AGENTS.md:112` "Any change to an agent instruction or configuration file"; `Settings/claude-baseline.settings.json:41` `"Edit(//<library-root>/**)"`, `:45` `"Edit(.claude/**)"`; `Settings/README.md:30` "project sessions get **no write access to the library checkout**"; `Settings/README.md:25` "a Python one-liner that writes through a path are not matched" | Prose is complete. Hard overlay misses the user-level settings file and `core.hooksPath`; no stated "say so and stop" response when a guard blocks legitimate work. P2 |
| M6 | Bounded per-session pause that is not configuration | Partially covered | `Settings/README.md:30` "start it with `CLAUDE_CONFIG_DIR` pointing at a second config directory ... or remove the rule through `/permissions` for that session and restore it afterwards" | The second-config-directory route is already process-scoped. The edit-and-restore route has no expiry and depends on memory. One-clause fix folded into P2. No new mechanism: Reject as a feature |
| M7 | Fail closed on a declared-but-unloadable guard, narrowly | Partially covered | `Settings/README.md:34` "It **fails closed**: if `gitleaks` is not on `PATH`, the hook prints one line and exits 1"; `Hooks/README.md:3` "Every hook is a silent no-op in a repo whose root `AGENTS.md` does not mention `.ai-memory`" | Secret gate fails closed. `handoff-check.mjs` fails open on every internal error (`:49`, `:87`, `:127` `catch` returns allow) and says nothing. That is the right default for a nudge, but it is not written down as a decision and an inert hook is invisible. P3 |
| M8 | Policy authority: `hard` vs `reviewable` with named reviewers | Missing (as a review check) | Nearest: `EngineeringTeam/security-engineer.md:710` "instruction-level defenses reduce but do not prevent hijack, so prose is never the only control"; `EngineeringTeam/ai-engineer.md:61` "make high-impact tool actions require confirmation or guardrails" | No rule that a model-based check may tighten a deterministic control but never clear it. P5 |
| M9 | Two-tier evaluation with an LLM classifier | Missing | `EngineeringTeam/ai-engineer.md:83` "with an LLM-judge on a fixed rubric only where human-like judgment is needed" (evals only) | As a library component: Conflicts with "the workflow must work from AGENTS.md alone" and adds a model call and a provider dependency to every tool call. Reject. The review lesson is P5 |
| M10 | Written negative results kept in the repo | Partially covered | `EngineeringTeam/prompt-engineer.md:59` "Every prompt change runs the eval; report before/after"; `:61` "a prompt that fixes one case and breaks three is worse"; `EVALS.md:36` "Mechanical success check first"; `Hooks/README.md:31` "## Not shipped" | The rule to measure exists. The convention to record a found-but-unfixed case, with why it is uncovered and what re-measuring costs, does not. P6 |
| M11 | allow / deny / instruct vocabulary, and where `instruct` degrades per host | Partially covered | `Hooks/README.md:7` "Exits 0 when `stop_hook_active` is true, so it nudges once; the platform's 8-consecutive-continuation cap is the backstop"; `:27` "SessionStart cannot block" | Known per hook, not summarised as block vs advisory per host. Covered by the P1 table (the "advisory" value) |
| M12 | Post-tool "block" is result replacement, not prevention | Partially covered | `Settings/README.md:25` "Text-matched shell rules are defense in depth, not a boundary"; `EngineeringTeam/_shared/rules-detail.md:80` "Host checkpoints ... track only the host's own file tools" | The library ships no post-tool hook, so nothing over-claims today. The general statement (a hook that runs after the action cannot be cited as the preventing control) is absent. One clause in P3 |
| M13 | Packs pinned by recorded digest; same-origin checksum is not a signature | Partially covered | `EngineeringTeam/security-engineer.md:707` "**MCP servers.** Provenance and pinning"; `:708` "**Skills, plugins, subagents.** Provenance"; `:711` "pinned to an exact version"; `:296` "Container/base images are pinned by digest"; `Hooks/session-start-library.mjs:35-37` (comment "Pinned ref", value `"main"`) | Skills line says provenance, not pinning. No statement that a checksum published beside the artifact proves integrity only, not publisher. The library's own cloud hook tracks a branch. P4 |
| M14 | Convention policies auto-loaded from a committed repo folder | Already covered (as a risk), Reject as a mechanism | `Hooks/README.md:3` "a committed `.claude/settings.json` hook then runs for every developer ... after one trust dialog (protect `.claude/**` with CODEOWNERS/branch protection; review every change to it as code)"; `EngineeringTeam/_shared/rules-detail.md:19` "The list is illustrative of classes, not exhaustive" | Auto-executing repo-committed JS with no trust prompt is the unsafe direction. Optional one-token addition to the class list in P4 |
| M15 | Codex managed-layer hook install under `/etc` | Missing | `Hooks/README.md:33` "registrations wait until a verified schema is in hand" | Needs root and deliberately skips the host's own hook-trust review. Breaks the spirit of "host-specific pieces only as optional overlays" plus the mandatory security review; Reject. The reported fact (Codex >= 0.129 skips untrusted user hooks, silently in `codex exec`) is single-source vendor text: record as Claimed in the P1 table, not as verified |
| M16 | Status reporting that refuses to over-claim | Partially covered | `Hooks/README.md:18` "Verify in-session with `/hooks`"; `Settings/README.md:11` "Run `/permissions` in a session to confirm every rule is listed"; `EngineeringTeam/security-engineer.md:710` "Every finding names the architectural control" | Install-time checks exist. A review may name an overlay as the enforcing control without showing it is installed on the machine in question. P3 |
| M17 | Offline audit of past sessions to suggest policies | Missing | Nearest: `EVALS.md:35` "Trace metrics, never self-report" | Needs per-host transcript parsers (host-specific) and its scores are product output, not measurement. Reject; the Self-Learning loop plus `Evals/trap-tasks.md` is the library's equivalent |
| M18 | Supply-chain gate with time-boxed ignores | Partially covered | `EngineeringTeam/security-engineer.md:292` "Vulnerability scan commands are run or recommended"; `:943-989` (`npm audit`, `pip-audit`, `trivy`); `EngineeringTeam/devops-engineer.md:85` "A red step is fixed, not deleted, skipped, or made non-blocking"; `Settings/README.md:47` "`.gitleaks.toml` allowlist ... reviewed as code (they weaken a security check)" | No rule that a scanner suppression carries a reason and an expiry. OSV-Scanner (one tool across ecosystems) is not in the command list; adding it is a `researcher` call, not made here. P7 |
| M19 | "Never edit a test to make it pass", CI green before stop | Already covered | `AGENTS.md:106` "with no existing test modified to pass"; `AGENTS.md:113` "Weaken tests, validation, or security checks to make something pass"; `EngineeringTeam/devops-engineer.md:274` "Delete, skip, or mute failing tests, scans, or quality steps to make a build pass" | Nothing. The clean-install smoke test is repo-specific |

Deep-read section 5 (unsafe items) against the library:

- Remote mutable instruction pointer: the library forbids the inbound form (`Evals/routing-cases.md:32`, case H2; Tier 4 rule at `AGENTS.md:92`). Its own cloud hook has the same shape in a weaker form (P4).
- Telemetry on by default, root installs, non-interactive auto-configuration: the library ships none of these. `Hooks/README.md:3` "Node-only, no dependencies". Nothing to adopt.

## Proposals

Every proposal changes an agent-configuration file of the library (`Hooks/**`, `Settings/**`, `Scripts/**`, `EngineeringTeam/**`), so each is ask-first and needs the `security-engineer` pass before it lands. Wording below is a draft for that review, not an approved change.

### P1. One overlay enforcement table, three-valued, lint-checked (from M1, M2, M3, M4, M11) — Adopt

- Target: `Hooks/README.md`, new section inserted between `## Hook contract (checked 2026-10-19)` (ends line 29) and `## Not shipped` (line 31). It is the file that already holds the dated contract. `README/ORCHESTRATION_README.md` Hooks section (line 184) gets a pointer of the form "per-host status: `Hooks/README.md` -> Enforcement by host".
- Proposed wording:

```markdown
## Enforcement by host

One row per rule the overlays enforce. Cell values, and only these: `block` (the host reads the verdict and the action does not happen), `advisory` (the text reaches the agent, the action can still proceed), `not verified` (no evidence in hand; treat as prose only). An empty or missing cell means `not verified`, never `block`. Every `block` or `advisory` cell names its evidence kind (`test` = this repo's test, `docs` = vendor page read, `probe` = run on a real host), the host version and the date. A cell older than the host's current major/minor is due for a re-check, not evidence.

| Rule (overlay file) | Claude Code | Codex | Cursor | Any host via git |
|---|---|---|---|---|
| Task file has Handoff + Evidence before stop (`handoff-check.mjs`) | advisory: blocks once, then allows (`stop_hook_active`); docs v2.1.296, 2026-10-19; test `handoff-check.test.mjs` | not verified (not shipped) | not verified (not shipped) | n/a |
| Re-entry context after compaction (`session-reentry.mjs`) | advisory: cannot block; docs v2.1.296, 2026-10-19 | not verified | not verified | n/a |
| Deny list: force-push, `reset --hard`, recursive delete, secret reads, library writes (`claude-baseline.settings.json`) | block for file tools and literal command text; advisory for any indirect form (script, `sh -c`, interpreter); docs 2026-10-19 | not verified | not verified | n/a |
| No secret in a commit (`pre-commit.gitleaks.sh`) | block | block | block | block; skipped by `--no-verify` (on the Claude Code ask list only) |
| Independent review in a fresh context (`Agents/claude/*.md`, `Workflows/review-loop.js`) | advisory: nothing stops an in-session review; docs 2026-10-19 | not verified | not verified | n/a |

Claimed, single vendor source, not verified here: Codex >= 0.129 skips user-level hooks until a person trusts them, silently in `codex exec` (failproofai `src/hooks/codex-system-hooks.ts`, read 2026-11-18). Kiro `Stop`: see Hook contract above.

Re-check: when a host's version moves past the one in a cell, re-run that row's probe (the install step's verify command) and update version and date; a row that no longer holds becomes `not verified` with a dated note, it is not deleted.
```

- Lint (M3), in `Scripts/Lint-Library.ps1` after the E7 block (line 147): new warning `W4`: every `*.mjs` / `*.sh` under `Hooks/`, every `*.json` under `Settings/` and every file under `Workflows/` that is not a `*.test.mjs` must be named in the `## Enforcement by host` table; a cell containing `block` or `advisory` without a `20YY-MM-DD` date is reported. Header comment line to add beside line 25: `#   W4  an overlay file missing from Hooks/README.md -> Enforcement by host, or a block/advisory cell with no date`.
- Caveats on the draft table: the cells restate what the two READMEs already claim; I did not re-probe any host. The "advisory" value for `handoff-check.mjs` is my reading of `Hooks/README.md:7` ("nudges once"); the maintainer may prefer `block (once)`. The `Agents/` and `Workflows/` row is inferred from `AGENTS.md:78`, not from reading `review-loop.js`.
- AGENTS.md byte cost: 0.
- Lost by not adopting: `AGENTS.md:78` keeps reading as if hard enforcement exists "where the host supports them" without any place that says it is currently Claude Code only; a Codex or Cursor user gets prose-only behaviour and nothing tells them. The failproofai record is the cautionary case: its prose claimed a working gate on one host for months while the host discarded the verdict.

### P2. Close the self-protection gap on the user-level overlay files (from M5, M6) — Adopt, security-posture change

- Target A: `Settings/claude-baseline.settings.json`, `ask` array, after line 49 (`"Edit(.mcp.json)"`):

```json
      "Edit(~/.claude/**)",
      "Edit(~/.codex/**)",
      "Edit(~/.cursor/**)",
      "Edit(~/.githooks/**)",
      "Bash(git config *core.hooksPath*)",
      "PowerShell(git config *core.hooksPath*)",
```

  - Not verified: that `Edit(~/.claude/**)` does not also prompt on host-internal writes made through the Edit tool (memory files, plans). `Settings/README.md:24` documents the `~/path` anchor, so the syntax is plausible; the behaviour needs one session with `/permissions` before it ships. If it prompts too often, narrow to `Edit(~/.claude/settings.json)`, `Edit(~/.claude/settings.local.json)`, `Edit(~/.claude/agents/**)`.
  - `ask`, not `deny`: the maintainer installs overlays by editing this same file.
- Target B: `Settings/README.md`, section `## What the baseline enforces`, extend the **Ask** bullet (line 16) with: "writes under the user-level `~/.claude/`, `~/.codex/`, `~/.cursor/` and `~/.githooks/` (the files these overlays are installed into) and any `git config core.hooksPath` change".
- Target C: `EngineeringTeam/_shared/rules-detail.md`, new dated section appended after `## Rework loop addendum` (line 95), same style as the 2026-10-19 additions:

```markdown
## Guards are the user's to switch off — added 2026-11 (failproofai)

Removing, pausing, editing or routing around an enforcement overlay (a hook entry, a deny/ask rule, `core.hooksPath`, `--no-verify`, a scanner allowlist) is a human action, in every run mode. When a guard blocks work the task needs, stop, quote the guard's message, and name the exact rule; never reach the same effect by another tool (a file write where the shell was blocked, a script, an interpreter one-liner). A guard lifted for maintenance is lifted for one process (`CLAUDE_CONFIG_DIR` pointing at a second config directory), not by editing the baseline and restoring it later.
```

- Target D: `Settings/README.md:30`, reorder the last sentence so the second config directory is the stated default and "remove the rule through `/permissions` ... and restore it afterwards" is the fallback, with "restore before ending the session" added.
- AGENTS.md byte cost: 0. `AGENTS.md:112` already makes the edit ask-first and `:113` forbids weakening a check; the new text is the detail behind them.
- Lost by not adopting: the failproofai fix history is direct evidence that the file-write route is the short path around a shell-only guard ("the agent never needs a shell ... it just writes the file"). The baseline currently guards the repo-level `.claude/` but not the user-level file where it tells people to install.

### P3. State each hook's failure direction, and make "installed here" part of citing a control (from M7, M12, M16) — Consider

- Target A: `Hooks/README.md`, one sentence appended to the intro paragraph (line 3): "Failure direction is a decision, stated per hook: `handoff-check.mjs` and `session-reentry.mjs` fail open (any internal error allows the stop or prints nothing, because a nudge must never lock a session); `pre-commit.gitleaks.sh` fails closed. A fail-open hook that is not registered, or errors, is silent, so `/hooks` is the only proof it is active."
- Target B: `EngineeringTeam/security-engineer.md:710`, extend the bullet "**Every finding names the architectural control**" with: "and states whether that control is installed on the machine or pipeline under review (`verified: <command and output>`) or `not verified`; an overlay that is not shown to be installed counts as prose. A control that runs after the action (a post-tool hook, a post-commit scan) reports, it does not prevent; never cite it as the preventing control."
- AGENTS.md byte cost: 0.
- Lost by not adopting: a security record can keep saying "enforced by the deny baseline" for a machine or CI runner where the baseline was never merged. This is the "installed but inert" failure failproofai built status reporting for.

### P4. Pin the library revision the cloud hook clones; say what a checksum proves (from M13, M14, section 5) — Adopt

- Target A (defect): `Hooks/session-start-library.mjs:35-37`. The comment says "Pinned ref" and the value is `"main"`. Options for the maintainer, in order of preference: (1) tag the library and set `LIBRARY_REF` to the tag, and have `Sync-AgentsMd.ps1 -WithCloudHook` write the tag it synced from; (2) keep `main` and correct the comment to "Tracks `main` (not pinned)" and add the same words to `Hooks/README.md:9`, which currently says "(pinned ref, resolved sha printed)". Option 2 is the honest minimum; option 1 removes an unpinned Tier 2 instruction channel into every cloud session. A tag is still movable by whoever controls the repository; a full sha is the only fixed pin.
- Target B: `EngineeringTeam/security-engineer.md:708`, extend "**Skills, plugins, subagents.** Provenance;" to: "Provenance and a pin to a commit sha or a recorded digest (a branch or tag is not a pin); a checksum published in the same release as the artifact shows the artifact did not change after install, not who published it; a skill or instruction file whose body tells the agent to fetch its real content from a URL is an unpinned instruction channel and is Blocking;".
- Target C (optional, one token): `EngineeringTeam/_shared/rules-detail.md:22`, add `.failproofai/**` to the "Host settings, agents, hooks, MCP" class list, since files in `.failproofai/policies/` execute on every hook event in a repo that has the tool. The list is declared illustrative, so this is a convenience, not a gap.
- AGENTS.md byte cost: 0.
- Lost by not adopting: the library's H1 finding (`Settings/README.md:30`) was about one repo rewriting the shared rules; an unpinned clone is the same exposure from the other side, for every cloud session, with a comment that says the opposite.

### P5. A model-based check may tighten a deterministic control, never clear it (from M8, M9) — Consider

- Target: `EngineeringTeam/security-engineer.md`, `## AI / LLM / RAG Security Review` → "Additional checks" list, after the "Unbounded consumption" bullet (around line 819); mirrored as one Blocking line in `EngineeringTeam/ai-reviewer.md:23`.
- Proposed wording: "- Model-judged overrides: where a deterministic rule (deny list, authorization check, validator) can be overridden by a model's judgment, the override is declared per rule, off by default, and never available for rules protecting credentials, destructive operations or the guard itself. A score just under a threshold is a pass, so a threshold is not a floor. Measure the override on a labelled set that includes attacks, and report attacks let through, not only legitimate work unblocked."
- Evidence for the wording: failproofai's own numbers as quoted in the deep read (real work blocked 13.9% -> 8.7%; 132 of 234 attacks blocked; a reviewable deny cleared at 0.69 against a 0.7 line). Those figures are vendor self-reported and their published source was Unverified in the deep read, so the proposal cites the failure shape, not the numbers.
- AGENTS.md byte cost: 0.
- Lost by not adopting: reviews of products that put an LLM in front of a deny list have no named check for it; the general line at `security-engineer.md:710` covers prose-only defenses, not model-cleared ones.

### P6. Record a found-but-unfixed case before touching measured wording (from M10) — Consider

- Target A: `EngineeringTeam/prompt-engineer.md`, `## Evaluation And Optimization Standards`, new bullet after "Do not overfit prompts to the eval set; keep a held-out set of real cases." (line 63).
- Proposed wording: "- A failing case found outside the eval set is first added to the set and written down (the case, why the current wording misses it, candidate edits, what a full re-run costs). If the re-run cannot be done now, the gap stays recorded as open with a dated stopgap; the measured wording is not edited on one example."
- Target B: `EVALS.md`, same idea for the library's own role text, one line under the trial rules (after line 37): "- A role-text failure seen in the field and not yet measured is logged as an `open gap` row (date, section, observed failure, check that would catch it), so it is visible before anyone edits the section."
- AGENTS.md byte cost: 0.
- Lost by not adopting: little today. `prompt-engineer.md:59` already forbids unmeasured edits; what is added is that the gap stays visible while unmeasured. Lowest priority of the "Consider" set.

### P7. Scanner suppressions carry a reason and an expiry (from M18) — Consider

- Target: `EngineeringTeam/security-engineer.md`, `## Dependency Vulnerability Review`, after the sentence at line 622 ("Review all ecosystems present. Run the ecosystem scan commands ..."); one matching line in `EngineeringTeam/devops-engineer.md` after line 85.
- Proposed wording: "- Every scanner suppression (ignore file entry, allowlist, inline marker) names the finding id, the reason and an expiry date, and is reviewed as code; a suppression with no expiry, or past it, is a finding. Where the scanner supports a dated ignore, use it so the gate turns red again by itself."
- Not proposed: adding OSV-Scanner to the command list. Choosing a scanner is a dependency decision (`AGENTS.md:100`) and belongs to a `researcher` pass with its own evidence.
- AGENTS.md byte cost: 0.
- Lost by not adopting: suppressions added to get a pipeline green stay forever; `Settings/README.md:47` covers the gitleaks allowlist only.

## Rejected, with the constraint or reason

| Mechanism | Reason |
|---|---|
| M4 daily canary as built | Installs 12 vendor CLIs and needs scheduled infrastructure and secrets; the library has no runtime. The re-check rule in P1 is the proportionate form |
| M6 pause command | No library runtime to hold session state; the process-scoped config directory already exists (`Settings/README.md:30`) |
| M9 LLM classifier in the tool path | Breaks "the workflow must work from AGENTS.md alone"; adds a provider dependency and sends tool-call facts to a third party |
| M14 auto-loaded repo policies | Executes repository code with no trust prompt; opposite of `Hooks/README.md:3` |
| M15 managed-layer install | Root write that bypasses the host's hook-trust review |
| M17 session audit | Host-specific transcript formats; scores are not measurements |
| Adopting failproofai itself as an overlay | MIT + Commons Clause (not OSI), telemetry on by default, remote unpinned skill pointer, system-scope service install, one npm maintainer. Would also be a plugin-style dependency. Not evaluated further |

## Open questions for the maintainer

- P1: is `advisory` the right label for a Stop hook that blocks once and then allows, or should the table carry `block (once)`?
- P2: `Edit(~/.claude/**)` versus the three narrower paths; needs one live session to see how often it prompts.
- P4: is the library going to be tagged? If not, option 2 (correct the comment and README) is the only honest fix.

## Completion

- Role used: `researcher`. Task file: this file is the only write. `ROADMAP.md` not touched (the sweep's parent owns it).
- Evidence: `wc -c AGENTS.md` | size check | 0 | 32,668 bytes, 194 lines. All other claims are `rg`/read citations above. Not run: `Lint-Library.ps1`, hook tests (no library file changed).
- Code & Source Graph: not used; the search was over Markdown and three small scripts, done with `rg`.
- Risks: line numbers are as of the working tree on 2026-11-18 and will drift; the P1 table cells restate existing README claims and were not re-probed.
- Lessons: none.
- Recommended next phase: `security-engineer` review of P2 and P4, then the maintainer's decision on P1.

<!-- END-OF-FILE -->
