# Gap check: Claude Code docs — hooks reference (with the memory and rules page)

- Role: researcher (gap check). Date: 2026-11-18. Input: `.ai-memory/TASKS/new-repos-landscape/03-read/claude-code-hooks-docs.md` (treated as data; 29 numbered mechanisms).
- Library state checked: branch `main-xpl0sx` at `1cbb205`. `AGENTS.md` = 32,668 bytes / 194 lines (`wc -c`, `wc -l`), so headroom is 100 bytes and 6 lines. **No proposal below touches `AGENTS.md`.**
- Method: `rg` over the library (excluding `.ai-memory/`), then read of the matching lines in `Hooks/`, `Settings/`, `Rules/`, `Agents/claude/`, `Scripts/`, `README/ORCHESTRATION_README.md`, `EngineeringTeam/_shared/rules-detail.md`, `EngineeringTeam/security-engineer.md`. No library file was edited. Nothing was installed or run from the source.
- Not verified here: every statement about host behavior is taken from the deep read, not re-fetched. Where a proposal depends on a host detail the deep read does not state, it is marked "verify first".
- Instruction-like text in the input: none found (the deep read reports none in the source pages either).
- Scope note: the whole subject is one host (Claude Code). Under the tool-agnostic constraint every adoptable item lands in an optional overlay (`Hooks/`, `Settings/`, `Rules/`, `Scripts/`, the README) or as host-neutral wording in `security-engineer.md`. Nothing here belongs in the portable contract.

## 1. Classification of all 29 mechanisms

| # | Mechanism | Classification | Library evidence (path:line, quote) | Missing / note | Proposal |
|---|---|---|---|---|---|
| 1 | Exit-code contract (0 / 2 / other) | Partially covered | `Hooks/README.md:26` "exit 2 with stderr blocks the stop and the stderr is fed back to Claude"; `Hooks/handoff-check.mjs:19` "Exit 0 = allow stop. Exit 2 + stderr = block" | Nowhere stated that exit 1 (and any other code) is a non-blocking error, so a future guard hook written with the Unix convention would fail open. `Hooks/pre-commit.gitleaks.sh:13` uses `exit 1`, which is right for git and wrong if anyone copies it into a host hook | P1 |
| 2 | `onFailure: "block"` (fail closed) | Missing | `rg onFailure` = 0 hits. Fail-closed exists only as product guidance (`EngineeringTeam/backend-engineer.md:483` "Fail closed, not open") and for the git hook (`Settings/README.md:34` "It **fails closed**") | No shipped host hook can use it today: the `Stop` hook is on an event where the field has no effect, `SessionStart` cannot block. It matters the day a `PreToolUse` guard is added, and for reviewing a project's own hooks | P1, P2 |
| 3 | JSON output / decision control | Partially covered | `Hooks/README.md:29` "Stop decision JSON: `{"decision":"block","reason":"..."}`. `handoff-check.mjs` writes this to stdout as well as the stderr reason" | Only the `Stop` shape is used and recorded; the rest (`hookSpecificOutput`, `updatedInput`, `updatedToolOutput`) is unused. Enough for what ships. The security side (a hook that rewrites input or output) is in P2 | none (P2 covers the review angle) |
| 4 | `PreToolUse` gate | Partially covered | `Settings/README.md:25` "A `PreToolUse` hook can inspect the full command when you need more than text matching." | No `PreToolUse` hook ships; hard enforcement is the permission baseline, which is what the docs recommend ("use the permission system rather than a hook to enforce a hard allow or deny"). Not recorded: the coverage gaps (`@`-mentioned files, Bash-side writes, validation-rejected calls) and that the choice of rules over hooks is deliberate | P1 (one contract bullet) |
| 5 | `PermissionRequest` auto-approver | Missing (as a mechanism); the risk is partially covered | `EngineeringTeam/security-engineer.md:706` "permission widening (`bypassPermissions`, allow-lists, `dangerously-*` flags), and persistence via a hook or settings edit that a later session will execute"; `:713` "Block any of: … a permission widening the user did not approve under ask-first" | The list does not name a hook that answers prompts or writes permission rules (`updatedPermissions`, `setMode`) as a widening. Adopting the mechanism itself would weaken ask-first: Reject | P2 (review wording only) |
| 6 | `Stop` / `SubagentStop` completion gate with loop cap | Already covered | `Hooks/README.md:7` "Exits 0 when `stop_hook_active` is true, so it nudges once; the platform's 8-consecutive-continuation cap is the backstop"; `:26` "`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it" | `SubagentStop` findings gate is "Deferred by design (F23)" (`Hooks/README.md:33`). One unrecorded limit: a `Stop` gate cannot be made fail-closed (see P1) | P1 (one clause) |
| 7 | `TaskCreated` / `TaskCompleted` gates | Missing | `rg TaskCompleted` = 0 hits outside `.ai-memory/` | Host-specific, fire only when the Task tools exist, and `onFailure` has no effect on them. The library's unit of completion is the task file, already gated by the `Stop` hook. Reject | none |
| 8 | `TeammateIdle` gate | Conflicts with a hard constraint (one writer per session) | `AGENTS.md:84` "One session, sequential roles, one writer." | Agent-team teammates are concurrent writers. Reject | none |
| 9 | `InstructionsLoaded` (audit only) | Missing | `rg InstructionsLoaded` = 0 hits outside `.ai-memory/` | Blind to a natively read `AGENTS.md`, and this library has no `CLAUDE.md` by constraint, so the event would report only `.claude/rules/` loads. Reject the hook; adopt the manual check the docs offer instead | P4 |
| 10 | `PreCompact` / `PostCompact` / `SessionStart` `compact` | Partially covered | `Hooks/README.md:8` "`session-reentry.mjs` \| `SessionStart` (`compact`, `resume`) \| Prints the newest open task file's path, `## Summary` and `## Handoff` to stdout"; `:33` "Deferred by design (F23): a PreCompact flush" | `SessionStart compact` is shipped. Not used: `PreCompact` stdout as compaction-summary instructions, which is the host's direct lever for the preserve list in `AGENTS.md:85`. Not recorded: blocking a recovery compaction fails the request, so such a hook must never exit 2 | P5 (Defer, re-open F23 with a measurement) |
| 11 | Context injection (`additionalContext`, stdout) caps | Missing | `Hooks/session-reentry.mjs:94-99` builds Summary + Handoff and writes it with no size limit; `:20-22` `REENTRY_LINE` is phrased as a command ("re-read the task file Summary and the incoming role file before continuing") | Over 10,000 characters the host writes the text to a file and shows a 2,000-character preview it does not ask the model to read, so a long Handoff silently loses its tail. The docs also advise factual statements over imperative ones | P3 |
| 12 | `UserPromptSubmit` / `UserPromptExpansion` gates | Missing | 0 hits | The Grill Checkpoint is prose by design and must work on every host. A blocked prompt is still written to disk, so it is not a secret filter either. Reject | none |
| 13 | `ConfigChange` tamper guard | Missing (the need is partially covered) | `Settings/claude-baseline.settings.json:45` `"Edit(.claude/**)"` under `ask`; `Settings/README.md:16` "**Ask** … writes under `.git/`, `.claude/`, `.codex/`, `.cursor/`" | The ask rule already gates agent-side edits. `ConfigChange` blocks silently, skips changes made through the prompt's own "don't ask again", and cannot block policy settings. Reject | none |
| 14 | `FileChanged` / `CwdChanged` watchers, `CLAUDE_ENV_FILE` | Missing | 0 hits | Observational events: not needed. `CLAUDE_ENV_FILE` (a hook writes shell code that runs before every later Bash call) is a persistence path the security checklist does not name | P2 (review wording only) |
| 15 | `WorktreeCreate` / `WorktreeRemove` | Missing | Worktree conventions are prose: `EngineeringTeam/_shared/rules-detail.md:83` "`[P]` worktree phases: branch `task/<task-file>/<T-id>` cut from the parent's current commit" | The hook replaces the host's `git worktree` logic, does not fire for `git worktree add` in Bash, and has an open Desktop bug. Prose plus plain git is portable. Reject | none |
| 16 | Prompt hooks (`type: "prompt"`) | Conflicts with a library rule if used as a review gate | `AGENTS.md:83` "reviewers, QA and security never on a small model" | Default model is the small background model; no accuracy data. Reject | none |
| 17 | Agent hooks (`type: "agent"`) | Missing | Reviewer subagents fill the role: `Agents/claude/security-engineer.md:5-8` (`tools: Read, Grep, Glob, Bash`, `maxTurns: 80`) | Marked experimental by the vendor, 60 s default timeout, returns only `{ok}`. Reject | none |
| 18 | Async hooks (`async`, `asyncRewake`) | Missing | 0 relevant hits | Cannot block; killed at teardown in `-p`. No use in an enforcement pack. Reject | none |
| 19 | Matchers and `if` filters | Partially covered | `Hooks/README.md:27` "SessionStart matchers are `startup`, `resume`, `clear`, `compact`, `fork`; `compact\|resume` is a plain `\|`-separated list" | The silent-failure traps are not recorded: exact match versus regex switches on one character, a matcher on an event without matcher support is ignored, `if` on a non-tool event never runs. The `Stop` entry in `settings.snippet.json:3-12` correctly has no matcher | P1 |
| 20 | Managed-settings controls | Missing | 0 hits | Organization feature; the library is a single-user, user-level install (`Hooks/README.md:20` "The install is machine-wide"). Only `disableAllHooks` is useful, as a headless mitigation | P6 (one clause) |
| 21 | Workspace trust gate | Partially covered, with one inaccurate sentence | `Hooks/README.md:3` "a committed `.claude/settings.json` hook then runs for every developer and every `-p`/cloud session after one trust dialog"; same claim at `README/ORCHESTRATION_README.md:180` and `Scripts/Sync-AgentsMd.ps1:29-30`. The library's own headless example already uses `claude -p --bare` (`README/ORCHESTRATION_README.md:141`) | Per the docs, `-p`/SDK runs never show the dialog and treat the folder as trusted, so committed hooks run with no dialog at all. The library text implies a dialog protects `-p` runs | P6 |
| 22 | Skill and subagent frontmatter hooks | Missing | `Agents/claude/*.md` frontmatter has `name`, `description`, `tools`, `disallowedTools`, `model`, `maxTurns` only (`Agents/claude/security-engineer.md:1-9`); the library ships no skills | Nothing to adopt. Review angle: a skill's hooks stay registered for the rest of the session after one invocation, including a model-initiated one; `security-engineer.md:708` covers skills by provenance and tool scope, not by their hooks | P2 (review wording only) |
| 23 | Timeouts | Already covered (for what ships) | `Hooks/settings.snippet.json:9` `"timeout": 15`, `:21` `"timeout": 10`; `Scripts/Sync-AgentsMd.ps1:135` `"timeout": 120` | Every shipped hook sets an explicit timeout far below the 600 s default. The rule "a timed-out guard does not block" goes into P1 | P1 (one clause) |
| 24 | Debug surface | Partially covered | `Hooks/README.md:18` "Verify in-session with `/hooks`, or run `echo '{"cwd":"<a repo>"}' \| node "<library-root>/Hooks/handoff-check.mjs"; echo $?`" | Not mentioned: `claude --debug` per-hook status lines (v2.1.296+) and the `/status` list of matchers that never match (2.1.327) | P1 (one clause) |
| 25 | Native `AGENTS.md` reading | Already covered, two small gaps | `README/ORCHESTRATION_README.md:159` "Root `AGENTS.md`, as a fallback only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists (the user-level `claude-md-and-agents-md` setting loads both)"; `Scripts/Sync-AgentsMd.ps1:155,167` shadow-file check per target repo | (a) The shadow check tests only the repo root; the docs say "in the working directory or above", so a `CLAUDE.md` in the repos folder or home shadows every repo unseen. (b) Not recorded: `AGENTS.md` is not loaded from `--add-dir` directories; v2.1.281+ needed on Bedrock/Vertex/telemetry-off | P7 |
| 26 | `.claude/rules/` with `paths:` frontmatter | Partially covered | `Rules/csharp.md:1-4` (`paths:` / `- "**/*.cs"`); `Scripts/Sync-AgentsMd.ps1:13` "`-WithRules` also copy Rules/*.md verbatim into <repo>\.claude\rules\"; `Scripts/Lint-Library.ps1:19` hidden-text scan covers `Rules/**` | No check that the frontmatter parses. Broken YAML makes the rule load unscoped in every session (costs context, drops nothing). The four files are 430–851 bytes, far under the per-file cap | P8 (low priority) |
| 27 | `@path` imports | Conflicts with a hard constraint (no `CLAUDE.md` shim) | `AGENTS.md:15` "Do not look for, create, or reference a `CLAUDE.md`"; role files are loaded by `Read` (`README/ORCHESTRATION_README.md:159` "Role files are loaded by `Read`, so they are not re-injected after compaction") | The only use would be a `CLAUDE.md` containing `@AGENTS.md`, which is the shim. Imports also "don't reduce its context cost", so importing role files would load all of them. Reject | none |
| 28 | Auto memory (`MEMORY.md`) | Already covered | `AGENTS.md:156` "The host's per-machine memory (Claude Code auto memory, Codex memories) is the third store for machine-local facts and personal corrections: a convenience layer, never a source of truth" | The deep read's correction (200 lines / 25 KB truncates `MEMORY.md` only) does not contradict the library: `Scripts/Lint-Library.ps1:23` words the 200-line limit as "W1 AGENTS.md over 200 lines (Anthropic guidance)" and `ORCHESTRATION_README.md:159` as "~200-line guidance". The 200-line cap is the library's own constraint, not a host truncation | none |
| 29 | Instruction-file hygiene tooling | Partially covered | `README/ORCHESTRATION_README.md:173` "Optionally, from a synced repo on Claude Code, run `/doctor prompt-audit` once per release (Claude-only; degrades to nothing elsewhere)" | `/context all` and `/memory` (confirm which instruction files actually loaded) are not mentioned; this is the only load check available to an `AGENTS.md`-only repo (see #9) | P4 |

Totals: Already covered 4 (6, 23, 25, 28) · Partially covered 9 (1, 3, 4, 10, 19, 21, 24, 26, 29) · Missing 13 (2, 5, 7, 9, 11, 12, 13, 14, 15, 17, 18, 20, 22) · Conflicts 3 (8, 16, 27).

## 2. Proposals

All eight are edits to optional overlays, scripts, the README or one role file. Each one changes an agent-configuration file as the library defines it (`_shared/rules-detail.md:21` lists `EngineeringTeam/**`, `Scripts/**`, `Hooks/**`), so each is ask-first and needs the `security-engineer` pass before merge. `AGENTS.md` byte cost: 0 for every proposal.

### P1. Record the fail-open contract in `Hooks/README.md` (mechanisms 1, 2, 4, 6, 19, 23, 24) — Adopt

- Target: `Hooks/README.md`, section `## Hook contract (checked 2026-10-19)`. Insert after the last bullet (line 29), and change the heading date when the contract is re-read.
- Proposed wording (five bullets, about 1.3 KB):

```markdown
- **Hooks fail open (re-read 2026-11-18, hooks reference citing up to v2.1.319).** Exit 2 is the only blocking exit code; exit 1 and every other non-zero code is a non-blocking error and the action proceeds. A guard hook therefore denies with `exit 2`, never `exit 1`. A missing script, a crash or a timeout also lets the action through.
- **`onFailure: "block"` (Claude Code ≥ v2.1.295, `command` and `http` handlers only)** turns a hook failure into a block. Every guard hook added to this pack on `PreToolUse`, `PermissionRequest` or `UserPromptSubmit` sets it and states that minimum version. It has no effect on `Stop`, `SubagentStop`, `TaskCompleted` or `TeammateIdle`: `handoff-check.mjs` cannot be made fail-closed and is a nudge, not a gate. The gates are the permission baseline (`Settings/`) and the git pre-commit hook.
- **Hard allow/deny belongs in permission rules, not hooks.** A `PreToolUse` hook does not fire for `@`-mentioned files, an `Edit|Write` matcher does not see a file written through Bash, and a call rejected by validation fires no hook. That is why this pack ships no `PreToolUse` guard and `Settings/` carries the denies.
- **Matcher traps.** A matcher made only of letters, digits, `_`, `-`, space, `,` and `|` is an exact match; any other character makes it an unanchored regex (`Edit.*` also matches `NotebookEdit`). A matcher on an event without matcher support is silently ignored (`Stop` has none: the snippet's `Stop` entry carries no matcher on purpose). `if` works on tool events only; on any other event the hook never runs.
- **Debug.** `claude --debug` prints one `Hooks: <event>:<match> [cmd] finished with status N (ms)` line per hook (≥ v2.1.296); `/status` lists matchers that never match (≥ v2.1.327).
```

- Lost by not adopting: the next hook added to the pack (F23 already lists two deferred ones) is likely to be written with `exit 1` or without `onFailure`, and will silently enforce nothing. The README currently reads as if `handoff-check.mjs` were an enforcement gate; it is a best-effort nudge and the file should say so.

### P2. Name hook-specific escalation paths in the security checklist (mechanisms 2, 3, 5, 14, 22) — Adopt

- Target: `EngineeringTeam/security-engineer.md`, section `## Agent Configuration And Supply Chain Review`. Insert one new bullet after the `**Skills, plugins, subagents.**` bullet (line 708), before `**Unattended runs…**`. Additive only; no existing text changes (role files stay full-depth).
- Proposed wording (host-neutral, with the Claude Code names as examples; about 1.1 KB):

```markdown
- **Hooks are code that runs with the user's full rights, outside any sandbox.** For every added or changed hook, on any host: (1) it fails closed where it is meant to enforce — on a host whose hooks fail open by default the blocking exit code and the fail-closed switch are both set (Claude Code: `exit 2`, `onFailure: "block"`), and a hook on an event that cannot fail closed is recorded as a nudge, not a control; (2) it does not answer permission prompts, add allow rules, change the permission mode or persist either to a settings file (Claude Code: a `PreToolUse` `allow`, `PermissionRequest` `updatedPermissions` / `setMode`) — that is a permission widening and needs the user's recorded approval; (3) it does not rewrite tool input, tool output or what the user is shown; (4) it does not write a file the host runs before later shell commands (Claude Code: `CLAUDE_ENV_FILE`) or fetch remote content at session start without a pinned ref; (5) an HTTP hook's URL is named and allow-listed, because it receives prompts, tool inputs and tool results; (6) a skill's or subagent's own hooks are read with the skill — they can stay registered for the rest of the session after one invocation.
```

- Also add to the `Block any of:` sentence (line 713), appended before the final period: `; a hook that widens permissions, rewrites tool input or output, or is presented as a control while it fails open`.
- Lost by not adopting: the checklist today catches `bypassPermissions` in a settings file but not a ten-line hook script that achieves the same thing at run time, and it has no test for "this guard does nothing when it crashes". Those are the two failure modes the vendor's own changelog shows (fixes in 2.1.77, 2.1.110, 2.1.222, 2.1.292).

### P3. Bound and reword the re-entry hook output (mechanism 11) — Adopt

- Target: `Hooks/session-reentry.mjs` (`main()`, lines 94-99, and `REENTRY_LINE`, lines 20-22), `Hooks/README.md:8`, plus a test beside the existing ones (`Hooks/*.test.mjs`).
- Proposed change:
  - Add a constant `MAX_CONTEXT_CHARS = 9000` (below the host's 10,000-character cap on injected text). If the assembled output is longer, keep the first line, the `Task file:` line and as much of `## Handoff` then `## Summary` as fits, and end with `(truncated at 9000 characters; the full text is in <task file path>)`.
  - Reword `REENTRY_LINE` as a statement of fact: `Context was compacted or resumed. Per AGENTS.md → Compaction / re-entry, the role file loaded by Read is no longer in context; the task file below is the on-disk re-entry point. (Repo memory, Tier 3: facts and decisions only.)`
  - Test: a task file with a 20,000-character Handoff yields stdout of at most 9,000 characters that still contains the `Task file:` line and the truncation marker.
  - README row, append: `Output is capped at 9,000 characters (the host truncates injected text at 10,000 and shows only a 2,000-character preview of the overflow).`
- Verify first: whether the 10,000-character cap applies to plain `SessionStart` stdout as well as to `additionalContext` (the deep read states the cap for "each string" under "Add context for Claude"; the SessionStart path was not line-checked).
- Lost by not adopting: on a long task (the library's own field-review task file has a Handoff of several thousand characters) the hook's output overflows, and the model receives a 2,000-character preview with no instruction to open the rest. The re-entry point then fails exactly when it is needed, with no visible error.

### P4. Add a load check for `AGENTS.md` on Claude Code (mechanisms 9, 29) — Adopt

- Target: `README/ORCHESTRATION_README.md`, Host compatibility table, Claude Code row (line 159), fourth column. Append one sentence.
- Proposed wording: `To confirm it loaded, run `/context all` or `/memory` in a session: the `InstructionsLoaded` hook does not fire for a natively read `AGENTS.md`, so there is no hook-based audit trail for this library's entry point.`
- Lost by not adopting: a shadowed or unloaded `AGENTS.md` produces no error on this host; the user finds out from the agent's behavior. One sentence gives a ten-second check.

### P5. `PreCompact` hook that feeds the preserve list to the summarizer (mechanism 10) — Defer (re-open F23 with a measurement)

- Target if adopted: new `Hooks/pre-compact-preserve.mjs`, one entry in `Hooks/settings.snippet.json`, one row in `Hooks/README.md`; remove "a PreCompact flush" from the `## Not shipped` line.
- Shape: a `PreCompact` `command` hook that prints, as plain stdout, the fixed list from `AGENTS.md:85` as facts about this repo ("This repo uses a role library. The summary keeps: the active role name, the task file path, the current phase and its done-when, the AC ids in play, settled decisions, pending blocking findings, Evidence rows so far."). It always exits 0. It never exits 2: the docs state that blocking an automatic compaction that is recovering from a context-limit error fails the request.
- Why Defer and not Adopt: F23 deferred it once already; `session-reentry.mjs` covers the same need from disk after the fact; and there is no measurement that summaries drop these items. The library rule is to measure before changing weight (`EVALS.md`). Proposed gate: run one long task twice (with and without) and compare what the post-compaction summary retains; record the verdict in `EVALS.md`.
- Lost by not adopting: the summary is written by the host with no knowledge of the library's preserve list, so the role name and AC ids survive only if the model happened to keep them or the task file Summary was fresh. The `SessionStart` hook repairs this only when the task file is current.

### P6. Correct the "one trust dialog" claim for headless runs (mechanisms 20, 21) — Adopt

- Targets and exact replacements:
  - `Hooks/README.md:3`: replace `runs for every developer and every `-p`/cloud session after one trust dialog` with `runs for every developer after one trust dialog, and for every `-p`/SDK/cloud session with no dialog at all (headless runs treat the folder as trusted)`.
  - `README/ORCHESTRATION_README.md:180`: replace `runs for every developer and every cloud session after one trust dialog` with the same wording.
  - `Scripts/Sync-AgentsMd.ps1:29-30` (comment only): same wording.
  - `README/ORCHESTRATION_README.md`, `## Headless / CI use`, after the Rule of Two paragraph (line 135), add: `A headless Claude Code run executes the hooks committed in the target repo's `.claude/settings.json` without a trust dialog. On a repository you do not control, pass `--bare` (as in the example below) or `--settings '{"disableAllHooks": true}'`, and read `.claude/` first.`
- Verify first: that `--bare` skips project hooks in the installed version (the deep read cites it as the page's own mitigation; the library example at line 141 already relies on it).
- Lost by not adopting: the current sentence tells the reader a dialog stands between a committed hook and a `-p` run. It does not. The library's own cloud hook is the benign case; a hook in someone else's repository is the unsafe one, and the Rule of Two text does not mention it.

### P7. Widen the `CLAUDE.md` shadow check and note two loading limits (mechanism 25) — Adopt

- Target A: `Scripts/Sync-AgentsMd.ps1`, the shadow check at lines 155-168. Proposed behavior: besides each target repo's root, test `$RepoRoot` and each of its ancestors up to the drive root (and the user profile folder) once for `CLAUDE.md`, `CLAUDE.local.md` and `.claude\CLAUDE.md`; when one is found print a single warning: `! <path> — sits above every repo under <RepoRoot>; Claude Code will ignore AGENTS.md in all of them unless the user-level 'claude-md-and-agents-md' setting is on`. Warn only, never block (matches the script's existing behavior).
- Verify first: whether the user-level `~/.claude/CLAUDE.md` counts as a shadowing file. The deep read's quote covers "the working directory or above"; it does not say whether the user-memory file is included. If it does not count, exclude `~/.claude/` from the walk.
- Target B: `README/ORCHESTRATION_README.md:159`, third column, append: `A `CLAUDE.md` or `CLAUDE.local.md` in any parent folder shadows it as well. Not loaded from `--add-dir` directories. Bedrock, Vertex and telemetry-off sessions need ≥ v2.1.281.`
- Lost by not adopting: a single stray `CLAUDE.local.md` in the repos folder turns the whole library off on this host for every repo, and the sync script reports all repos as healthy.

### P8. Lint the `Rules/` frontmatter (mechanism 26) — Adopt, low priority

- Target: `Scripts/Lint-Library.ps1`. Add warning `W4` to the header list (after line 25) and a check near the other per-file loops: for each `Rules/*.md`, line 1 is `---`; a closing `---` exists within the first 20 lines; between them the only key is `paths:` followed by one or more lines matching `^\s+-\s+"[^"]+"\s*$`.
- Header wording: `#   W4  a Rules/*.md file whose frontmatter is not exactly a `paths:` list of quoted globs between two `---` lines (Claude Code loads a rule with unparseable frontmatter unscoped, in every session)`.
- A regex check, not a YAML parser: PowerShell 5.1 has none built in and the library takes no dependencies.
- Lost by not adopting: a typo in one of four small files makes that rule load in every session of every synced repo. The cost is context only (the rule text duplicates `AGENTS.md`), so this is hygiene, not safety.

## 3. Rejected or not proposed, with the reason

| # | Mechanism | Verdict | Reason |
|---|---|---|---|
| 3 | Wider JSON decision control | No action | Only the `Stop` shape is needed and it is recorded. |
| 7 | `TaskCreated` / `TaskCompleted` | Reject | Host task tools are not the library's unit of completion; the events cannot fail closed. |
| 8 | `TeammateIdle` | Reject | Breaks one writer per session. |
| 9 | `InstructionsLoaded` hook | Reject | Does not fire for a natively read `AGENTS.md`; making it fire needs a `CLAUDE.md` that imports `AGENTS.md`, which breaks the no-shim constraint. P4 gives the manual check. |
| 12 | `UserPromptSubmit` gate | Reject | The Grill Checkpoint must behave the same on every host; a prompt gate would exist on one. |
| 13 | `ConfigChange` | Reject | The `ask` rule on `Edit(.claude/**)` covers agent-side edits; the hook blocks silently and has documented bypasses. |
| 15 | `WorktreeCreate` / `WorktreeRemove` | Reject | Replaces git logic on one host; prose conventions plus plain git are portable. |
| 16 | Prompt hooks | Reject | Small-model verdict as a gate contradicts "reviewers, QA and security never on a small model". |
| 17 | Agent hooks | Reject | Experimental per the vendor; reviewer subagents already exist in `Agents/claude/`. |
| 18 | Async hooks | Reject | Cannot block; no enforcement use. |
| 20 | Managed-settings controls | Reject (except the `disableAllHooks` clause in P6) | Organization feature; the library is a user-level install. |
| 27 | `@path` imports | Reject | Requires the `CLAUDE.md` shim; would also load every imported role file up front. |

## 4. Risks and open points

- Version drift: the deep read counts 443 releases and version gates from v2.1.199 to v2.1.319 on one page. P1, P3 and P6 each pin a minimum version in the text; the `Hooks/README.md` contract heading still says "checked 2026-10-19" and should be re-dated only when someone re-reads the page against the shipped hooks.
- P2 adds about 1.3 KB to a 36,870-byte role file. This is an addition, not a compression, so the full-depth constraint holds.
- P3 and P7 change executable overlay code (`Hooks/*.mjs`, `Scripts/*.ps1`): tests before and after, and the mandatory security pass, apply.
- Three host details are marked "verify first" (P3, P6, P7). They were not re-fetched in this gap check.
- Code & Source Graph: not used. The library is Markdown prose plus a few scripts; `rg` and direct reads answered every lookup.

<!-- END-OF-FILE -->
