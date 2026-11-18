# Deep read: Claude Code docs — hooks reference (with the memory and rules page)

- Role: researcher. Read date: 2026-11-18.
- Primary sources read (all fetched 2026-11-18 as the site's raw-markdown variants, `<url>.md`):
  - `https://code.claude.com/docs/en/hooks` — full page, 294,386 bytes, about 4,350 lines, sha256 `452d58e1…564a5b`, HTTP `last-modified: Wed, 18 Nov 2026 02:06:55 GMT`. Read in full this time (the earlier pass stopped at 100k chars); per-tool `tool_input` schema tables for PreToolUse (lines ~1802–2000) and the PreModelSwitch/PostModelSwitch/Elicitation bodies were skimmed, not line-read.
  - `https://code.claude.com/docs/en/memory` — full page, 55,486 bytes, sha256 `4186f2be…d8de88f`.
  - `https://code.claude.com/docs/en/hooks-guide` — 66,876 bytes, sha256 `2076ece8…f3166e9`; read the outline plus "Block edits to protected files", "Re-inject context after compaction", "Combine results from multiple hooks", and "Limitations and troubleshooting".
  - `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` — 1,325,890 bytes, 443 version headings, top entry `2.1.327`; repo `HEAD` = `c8ced2bb82f8fe33c91787da68e4507e137e144b` (`git ls-remote`, 2026-11-18). Grepped for hook/AGENTS.md/onFailure entries, not read end to end.
- The docs site carries no version stamp of its own. "Version read" = the page as served on the date above; the newest version the hooks page cites is v2.1.319, the changelog's newest is 2.1.327.
- Nothing was installed and no code from the pages was run.

## 1. What it is, who maintains it, adoption signals

- What: the vendor reference for Claude Code's hook system (user-defined handlers the host runs at fixed lifecycle points) and the companion page for instruction files (`CLAUDE.md`, `AGENTS.md`, `.claude/rules/`) and auto memory. It is documentation of a closed-source host, not a library; the behavior it describes ships inside the `claude` CLI.
- Maintainer: Anthropic (docs at `code.claude.com`; public issue tracker and changelog in `github.com/anthropics/claude-code`).
- Adoption signals observed:
  - Release cadence: 443 version headings in `CHANGELOG.md`, newest `2.1.327`. Release dates: Unverified (the changelog carries no dates; the GitHub releases API was not reachable from this session).
  - Issue volume: GitHub search `repo:anthropics/claude-code is:issue is:open hook in:title` returned 508 open issues on 2026-11-18.
  - Stars, forks, contributor count: Unverified (GitHub REST API for this repo was refused in this session; not taken from memory).
  - Feature age: `InstructionsLoaded` added in 2.1.69; native `AGENTS.md` reading added in 2.1.277; `onFailure: "block"` added in 2.1.295 (all from `CHANGELOG.md`).

## 2. How it actually works

### 2.1 Shape of a hook

- Three nesting levels in a JSON settings file: hook event → matcher group → handler(s). Quote: "Choose a hook event to respond to … Add a matcher group to filter when it fires … Define one or more hook handlers to run when matched."
- Five handler types: `command` (shell or exec form), `http` (POST of the event JSON), `mcp_tool`, `prompt` (single-turn LLM verdict), `agent` (subagent verifier, "experimental and may change").
- Input: one JSON object on stdin (or POST body) with common fields `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode`, `effort`, `hook_event_name`, plus `agent_id`/`agent_type` inside subagents, plus event-specific fields.
- Output: exit code and/or one JSON object on stdout. Exit 0 = success; exit 2 = blocking error on events that can block; any other code = non-blocking error.
- Concurrency: "When an event fires, its matching hooks run in parallel." More than 12 prompt/agent hooks are throttled to 12 at once. Identical handlers defined in several settings files run once.
- All matching hooks run to completion before results merge (hooks-guide): "One hook returning `deny` doesn't stop sibling hooks from executing." PreToolUse precedence: `deny` > `defer` > `ask` > `allow`.

### 2.2 The 33 events (count verified against the lifecycle table)

`SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `MessageDisplay`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`, `SessionEnd`.

Can block on exit 2 (from the "Exit code 2 behavior per event" table): `PreToolUse`, `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `SubagentStop`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `ConfigChange` (not `policy_settings`), `PostToolBatch`, `PreCompact`, `PreModelSwitch`, `Elicitation`, `ElicitationResult`, `WorktreeCreate`, `WorktreeRemove`. Cannot block: `PermissionRequest` (exit 2 ignored; deny via the JSON `decision` object), `PostToolUse`/`PostToolUseFailure` (stderr shown to Claude only), `PermissionDenied`, `Notification`, `SubagentStart`, `SessionStart`, `Setup`, `SessionEnd`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `PostCompact`, `PostModelSwitch`, `InstructionsLoaded`, `MessageDisplay`, `StopFailure`.

Handler-type support: all five types on `PermissionDenied`, `PostToolBatch`, `PostToolUse`, `PostToolUseFailure`, `PreToolUse`, `Stop`, `SubagentStop`, `TaskCompleted`, `TaskCreated`, `TeammateIdle`, `UserPromptExpansion`, `UserPromptSubmit`. `PermissionRequest`: no `agent`. `Setup`: `command` only. `SessionStart`: `command` and `mcp_tool` only. The remaining events: `command`/`http`/`mcp_tool` only.

### 2.3 Where hooks live (page section "Hook locations")

| Location | Scope |
|---|---|
| `~/.claude/settings.json` | all projects, local |
| `.claude/settings.json` | project, committable |
| `.claude/settings.local.json` | project, gitignored |
| Managed policy settings | organization |
| Plugin `hooks/hooks.json` | while plugin enabled |
| Skill frontmatter `hooks:` | "the rest of the session once the skill is invoked" |
| Subagent frontmatter `hooks:` | while that subagent runs (`Stop` is converted to `SubagentStop`) |

- "Hook entries merge across settings levels rather than replacing each other."
- Settings/managed/plugin hooks also fire inside subagents, with `agent_id`/`agent_type` in the input.
- Cloud sessions "don't read your local `~/.claude/settings.json`".

### 2.4 Fail-open is the default

- "On most events, when a hook fails or times out, Claude Code still carries out the action. A policy hook with a wrong path or a crashing script then lets everything through."
- "Exit code 1 without valid JSON output is a non-blocking error … even though 1 is the conventional Unix failure code. If your hook is meant to enforce a policy, use `exit 2`."
- "On `PreToolUse`, a timed-out `command`, `http`, or `mcp_tool` hook doesn't block the tool call … so don't count on a stalled hook to act as a gate."
- `if` filters are best-effort: "use the permission system rather than a hook to enforce a hard allow or deny."

### 2.5 Instruction files and memory (memory page)

- "Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead."
- "CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself."
- Native `AGENTS.md`: read by default only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or above (setting value `claude-md-or-agents-md`). Requires v2.1.277+; v2.1.281+ for Bedrock/Vertex/telemetry-off sessions.
- Compaction: "Project-root CLAUDE.md survives compaction: after `/compact`, Claude re-reads it from disk and re-injects it into the session. Nested CLAUDE.md files … and rules with `paths:` frontmatter load again on demand."

## 3. Mechanisms

Evidence note: these pages are a reference, so they contain no measured results. "Evidence" below means changelog fixes or tracker issues that show the mechanism exists and has (or had) defects; otherwise "no evidence found".

1. **Exit-code contract (0 / 2 / other).**
   - Does: 0 = success and JSON applied; 2 = block on blockable events with stderr as the reason; anything else = non-blocking error and the action proceeds.
   - Where: hooks page, "Exit code output" and "Exit code 2 behavior per event".
   - Problem solved: a single cross-language way for a script to veto an action.
   - Evidence: changelog "Improved the error when a PreToolUse hook exits 127, saying its check may not have run" shows the fail-open path was a real source of silent non-enforcement. No measured results.

2. **`onFailure: "block"` (fail closed).**
   - Does: on a `command` or `http` hook, a failure blocks the action. Failures counted: can't start, exit code other than 0/2 (even with allow JSON), HTTP connection error or non-2xx, timeout, unparseable or schema-invalid JSON. On `PermissionRequest` a failure denies.
   - Where: hooks page, "Block the action when a hook fails"; field in the command and HTTP hook tables. Requires v2.1.295 (SDK callbacks: 2.1.317).
   - Problem solved: mistyped path or crashing guard script letting every call through.
   - Limits stated on the page: "The field has no effect on … `Stop`, `SubagentStop`, `TaskCompleted`, and `TeammateIdle` hooks: exit code 2 on these events sends Claude back to keep working, and Claude can't repair a hook that won't run", and none on `async`/`asyncRewake` hooks. Not available on `mcp_tool`, `prompt` or `agent` handlers (field is only listed for command and HTTP).
   - Evidence: changelog 2.1.295 entry. No measured results.

3. **JSON output / decision control.**
   - Does: universal fields `continue`, `stopReason`, `systemMessage`, `terminalSequence` (`suppressOutput` "Has no effect"); top-level `decision: "block"` + `reason` for most blockable events; `hookSpecificOutput` for PreToolUse (`permissionDecision` allow/deny/ask/defer, `updatedInput`, `additionalContext`), PermissionRequest (`decision.behavior`, `updatedInput`, `updatedPermissions`, `message`, `interrupt`), PostToolUse (`updatedToolOutput`, `classifierContext`).
   - Where: "JSON output", "Decision control".
   - Problem solved: finer control than block/allow (rewrite input, ask the user, add context).
   - Evidence: changelog "Changed a hook's `"decision": "block"` to hold in more cases, so a hook that always prints one may start blocking calls" (behavior shifted between versions). Tracker #17088 "PreToolUse hook shows 'error' label even for successful (exit 0) hook runs" (open, +28).

4. **`PreToolUse` gate.**
   - Does: runs before every tool call in every permission mode; `deny` holds "even in `bypassPermissions` mode or with `--dangerously-skip-permissions`"; `allow` does not override deny/ask rules.
   - Where: "PreToolUse"; hooks-guide "Hooks and permission modes".
   - Problem solved: policy that the user's permission mode cannot switch off.
   - Stated gaps: does not fire for `@`-mentioned files ("no PreToolUse hook fires for them, including hooks matching `Read`") unless `CLAUDE_CODE_DISABLE_FILE_MENTIONS=1`; an `Edit|Write` guard does not stop Bash from writing the file ("Claude can still change the protected files with shell commands"); validation-rejected calls fire no hook; a mod can approve a call a hook blocked on machines without managed settings and Team/Enterprise login.
   - Evidence: changelog security fixes — 2.1.77 "Fixed PreToolUse hooks returning `"allow"` bypassing `deny` permission rules, including enterprise managed settings"; 2.1.222 "Fixed PreToolUse auto-allow hooks bypassing tool restrictions in background agent tasks"; 2.1.292 "Security: Fixed PreToolUse hook approvals and auto mode bypassing the permission prompt for file reads from network (UNC) paths".

5. **`PermissionRequest` auto-approver.**
   - Does: answers a permission prompt on the user's behalf; can persist rules or change the permission mode via `updatedPermissions` (`addRules`, `replaceRules`, `removeRules`, `setMode`, `addDirectories`, `removeDirectories`) to `session`, `localSettings`, `projectSettings` or `userSettings`.
   - Where: "PermissionRequest decision control", "Permission update entries".
   - Problem solved: unattended runs where no human can click.
   - Evidence: changelog 2.1.110 "Fixed `PermissionRequest` hooks returning `updatedInput` not being re-checked against `permissions.deny` rules; `setMode:'bypassPermissions'` updates now respect `disableBypassPermissionsMode`".

6. **`Stop` / `SubagentStop` completion gate with loop cap.**
   - Does: exit 2 or `decision: "block"` sends Claude back to work with the reason; `stop_hook_active` flags a continuation; "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn" (raise with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`); `additionalContext` gives non-error feedback under the same cap.
   - Where: "Stop", "Stop decision control"; hooks-guide "Stop hook hits the block cap".
   - Problem solved: "done" claimed before a verifiable condition holds.
   - Limits: fires "whenever Claude finishes responding, not only at task completion"; does not fire on user interrupt; `onFailure` has no effect; a missing-script exit 2 is downgraded to non-blocking.
   - Evidence: changelog "Fixed a Stop hook that failed to run being shown as having reported a problem". No measured effectiveness data.

7. **`TaskCreated` / `TaskCompleted` gates.**
   - Does: `TaskCompleted` fires when a task is marked completed via `TaskUpdate` or when an agent-team teammate ends a turn with in-progress tasks; exit 2 or `decision: "block"` keeps the task open and feeds the message back. `TaskCreated` can roll back a creation (naming/description rules).
   - Where: "TaskCreated", "TaskCompleted". No matcher. Do not fire in sessions without the Task tools.
   - Problem solved: completion criteria (tests, lint) enforced at the moment a task is closed.
   - Evidence: no evidence found.

8. **`TeammateIdle` gate.** Keeps an agent-team teammate working until a condition holds (exit 2 / `decision: "block"`). Where: "TeammateIdle". Problem: teammates stopping before artifacts exist. Evidence: no evidence found.

9. **`InstructionsLoaded` (audit only).**
   - Does: fires asynchronously when a `CLAUDE.md` or `.claude/rules/*.md` file loads; input has `file_path`, `memory_type`, `load_reason` (`session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact`), `globs`, `trigger_file_path`, `parent_file_path`. "They can't block or modify instruction loading."
   - Where: "InstructionsLoaded".
   - Problem solved: knowing which instruction files actually reached context, and why.
   - Stated gap: "This event doesn't fire when Claude reads `AGENTS.md` directly through the **Project instructions** setting. It does fire when a `CLAUDE.md` imports your `AGENTS.md`."
   - Evidence: changelog 2.1.288 "Fixed the InstructionsLoaded hook omitting agent_id and agent_type when a subagent's file access loads a rule or nested CLAUDE.md".

10. **`PreCompact` / `PostCompact` and `SessionStart` matcher `compact`.**
    - Does: `PreCompact` can block compaction, and on exit 0 "Claude Code uses its stdout as instructions for the compaction summary" (10,000-char cap). `PostCompact` receives `compact_summary`, no control. `SessionStart` with `source: "compact"` can re-inject context (stdout or `additionalContext`).
    - Where: "PreCompact", "PostCompact", "SessionStart"; hooks-guide "Re-inject context after compaction".
    - Problem solved: state lost when the conversation is summarized.
    - Stated risk: blocking an auto-compaction that was recovering from a context-limit error makes "the current request fail".
    - Evidence: no evidence found.

11. **Context injection (`additionalContext`, plain stdout).**
    - Does: text is wrapped in a system reminder at the point the hook fired; capped at 10,000 characters per string, overflow written to a file with a 2,000-char preview that "Claude Code doesn't ask Claude to read".
    - Where: "Add context for Claude", "JSON output".
    - Problem solved: dynamic, state-dependent context that a static file can't hold.
    - Stated caveats: "Write the text as factual statements rather than imperative system instructions … Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses"; on resume the saved text is replayed, "so values like timestamps or commit SHAs become stale".
    - Evidence: tracker #12151 "[BUG] Plugin hook output not captured or passed to agent (UserPromptSubmit, SessionStart)" (open, +31).

12. **`UserPromptSubmit` / `UserPromptExpansion` gates.**
    - Does: block or annotate a prompt before the model sees it; also fires on scheduled tasks, background-subagent reports and cross-session messages. `UserPromptExpansion` covers typed `/skill` invocations, which bypass `PreToolUse` on the `Skill` tool. Default timeout 30 s; timed-out hook is discarded and the prompt goes through unless `onFailure: "block"`.
    - Where: "UserPromptSubmit", "UserPromptExpansion".
    - Stated limit: a blocked prompt is still written to the transcript and prompt history — "a blocking hook isn't a way to keep a secret off disk". The prompt cannot be rewritten (tracker #27365 requests `updatedPrompt`, open, +24).

13. **`ConfigChange` (configuration tamper guard).**
    - Does: fires when user/project/local settings, managed settings files, or `.claude/skills/` files change mid-session; exit 2 or `decision: "block"` keeps the new settings from applying to the running session.
    - Where: "ConfigChange".
    - Limits: `policy_settings` can't be blocked; changes saved through "Yes, and don't ask again", `/permissions` or `/model` in the same session do not run the hooks; server-managed settings refreshes do not run them; "A blocked change surfaces no message to you or to Claude."
    - Evidence: no evidence found.

14. **`FileChanged` / `CwdChanged` watchers.** Filesystem-watcher event (fires whatever wrote the file, including Bash and external processes), observational only; `watchPaths` extends the list; `CLAUDE_ENV_FILE` persists env vars. Where: "FileChanged", "CwdChanged". Problem: `PostToolUse` on `Edit|Write` misses Bash/external writes. Stated hazard: a hook that rewrites the file it watches "loops forever" without an idempotence guard. Evidence: no evidence found.

15. **`WorktreeCreate` / `WorktreeRemove`.** Replaces the default `git worktree` logic; the hook must print the worktree path; any non-zero exit fails creation; paths through symlinks below the repo root are refused; `.worktreeinclude` is not processed. Does not run for `git worktree add` through Bash. Subagent/workflow worktrees made by the hook are never auto-removed. Evidence: tracker #29716 "WorktreeCreate / Remove hooks not called in Claude Desktop" (open, +30); changelog 2.1.325 fix for a skipped plugin `WorktreeCreate` hook.

16. **Prompt hooks (`type: "prompt"`).** Single-turn LLM verdict `{ok, reason, impossible}`; default model is the background ("small") model; 30 s timeout; `continueOnBlock` chooses between ending the turn and feeding the reason back. `ok: false` has no effect on `PermissionRequest` and `PermissionDenied`. Where: "Prompt-based hooks". Problem: judgment-type conditions a script can't check. Evidence: no evidence found (no accuracy data published).

17. **Agent hooks (`type: "agent"`).** Subagent verifier with Read/Grep/Glob, up to 50 turns, 60 s default timeout, returns `{ok}`. Page warning: "Agent hooks are experimental … For production workflows, prefer command hooks." Evidence: no evidence found.

18. **Async hooks (`async`, `asyncRewake`).** Background command hooks; cannot block ("response fields like `decision`, `permissionDecision`, and `continue` have no effect"); output delivered next turn; `timeout` not enforced on `async`; killed at teardown in `-p` runs. `asyncRewake` wakes Claude on exit 2. Where: "Run hooks in the background".

19. **Matchers and `if` filters.** Matcher is exact-string (letters, digits, `_`, `-`, space, `,`, `|`) or an unanchored JavaScript regex if any other character appears; `if` takes one permission-rule pattern on tool events only. Traps stated on the page: `mcp__memory` (no `.*`) "matches no tool"; `Edit.*` also matches `NotebookEdit`; a matcher on an event without matcher support "is silently ignored"; a hook with `if` on a non-tool event "never runs"; matchers are case-sensitive. Evidence: changelog 2.1.327 added a `/status` list of "hook matchers that never match".

20. **Managed-settings controls.** `allowManagedHooksOnly` (blocks user/project/local/plugin hooks), `strictPluginOnlyCustomization`, `allowedHttpHookUrls`, `httpHookAllowedEnvVars`, `disableAllHooks` (cannot disable managed hooks from a lower level). Where: "Hook locations", "Limit HTTP hooks", "Disable or remove hooks". Evidence: changelog "Fixed PreToolUse hooks in managed settings leaving no OpenTelemetry `tool_decision` event … when they refused a direct tool call".

21. **Workspace trust gate.** Interactive: all settings-file hooks are held until the trust dialog is accepted. `-p`/SDK: "Claude Code never shows the dialog and treats the folder as trusted, so hooks committed in a repository's `.claude/settings.json` run in a folder you've never trusted". Project subagent frontmatter hooks need real trust acceptance even in `-p`. Where: "Security considerations → Workspace trust".

22. **Skill and subagent frontmatter hooks.** Skill hooks register on invocation and stay "for the rest of the session"; `once: true` removes after first success (skill frontmatter only). Limits: 1,024 hooks and 16,384 matcher characters per skill source per session (v2.1.304+); over the limit a skill "registers none of its hooks" (debug log only). Where: "Hooks in skills and agents", "Limits on skill hooks".

23. **Timeouts.** Defaults: 600 s for `command`/`http`/`mcp_tool`; 30 s on `UserPromptSubmit`, `PreModelSwitch`, `PostModelSwitch`; 10 s on `MessageDisplay`; `prompt` 30 s; `agent` 60 s; `SessionEnd` hooks share a 1.5 s budget (raisable to 60 s). Evidence: tracker #5186 "Notification Hook 10 second delay" (+33), #19627 "High latency in hook invocation for Notification events" (+25).

24. **Debug surface.** `/hooks` (read-only browser with source labels), `claude --debug` / `--debug-file`, per-hook `Hooks: <event>:<match> [cmd] finished with status N (ms)` lines (v2.1.296+), `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose`. Where: "The `/hooks` menu", "Debug hooks".

25. **Native `AGENTS.md` reading (memory page).** Default `claude-md-or-agents-md`; other values `claude-md-and-agents-md`, `claude-md`, `managed-only`; set in `/config` or `pluginConfigs` under `cc-plugin-agents-md@builtin` (ignored in project/local settings). Not read: `AGENTS.local.md`, `AGENTS.override.md`, `.agents/`. A `CLAUDE.local.md` anywhere on the path silently stops `AGENTS.md` loading under the default. Differences from `CLAUDE.md`: no `InstructionsLoaded`; not loaded from `--add-dir` directories; external `@path` imports load only if already approved, with no prompt. Evidence: changelog 2.1.277, 2.1.281, 2.1.290 ("Fixed a subdirectory's AGENTS.md not being attached when a file under it is @-mentioned").

26. **`.claude/rules/` with `paths:` frontmatter.** Rules without `paths` load at launch; with `paths` they load when Claude reads/writes/edits a matching file. `paths` is the only frontmatter field read. Fail-open on bad YAML: "If the YAML between the markers doesn't parse, Claude Code ignores the frontmatter and loads the rule as if it had no `paths`." Symlinked rules pointing outside the working directory need the external-imports approval. On-demand files have a per-file cap (40,000 chars on a 200K window; 150,000–200,000 on 1M) beyond which Claude "receives only the start". Evidence: changelog 2.1.211 note that on-demand rules previously loaded even with `project` excluded from `--setting-sources`.

27. **`@path` imports.** Expanded into context with the importing file, max depth four hops, skipped inside code spans/blocks; external paths need a one-time approval dialog. "Imports … don't reduce its context cost." Block-level HTML comments are stripped before injection.

28. **Auto memory (`MEMORY.md`).** Claude-written notes at `~/.claude/projects/<project>/memory/`, machine-local, shared across worktrees; "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation." Off by default in self-hosted environments. Not loaded into subagents (except forks).
    - Correction to the shortlist note: the 200-line / 25KB limit applies to `MEMORY.md` only. "This limit applies only to `MEMORY.md`. Claude gets the whole of each CLAUDE.md file that loads at launch, as long as the file is 4 MiB or smaller." The 200-line figure for `CLAUDE.md` is a recommendation ("target under 200 lines"), with a startup and `/status` warning, not a truncation.

29. **Instruction-file hygiene tooling.** `/context all` (lists loaded memory files), `/memory`, `/doctor prompt-audit` (v2.1.283+, finds outdated/conflicting instructions, proposes edits), `claudeMdExcludes`, managed `CLAUDE.md` / `claudeMd` key. Evidence: no evidence found.

## 4. Known weaknesses, open issues, criticisms

- Fail-open by default; `onFailure: "block"` is opt-in, recent (2.1.295), limited to `command`/`http`, and has no effect on `Stop`, `SubagentStop`, `TaskCompleted`, `TeammateIdle` — the events a "definition of done" gate would use. A missing script on those events is a non-blocking error.
- `Stop` gates are capped at eight consecutive blocks, then overridden.
- `PreToolUse` coverage gaps: `@` file mentions, Bash-side file writes, validation-rejected calls, `EndConversation`. The docs themselves point to permission deny rules and sandboxing for hard enforcement.
- Silent misconfiguration paths, each documented: matcher on a non-matcher event ignored; `if` on a non-tool event never runs; decision fields at the wrong JSON level ignored without error; shell-profile `echo` output before the JSON turns it into plain text; exact-match vs regex switch depends on a single character.
- Platform divergence: on Windows without Git Bash a failing shell-form `PreToolUse`/`PermissionRequest` hook blocks, and "stops doing so once Git for Windows is installed" unless `onFailure` is set — the same config fails closed or open depending on the machine.
- `InstructionsLoaded` is blind to natively-read `AGENTS.md`, so a repo that uses only `AGENTS.md` gets no load audit trail from it.
- `AGENTS.md` loading is displaced without warning by any `CLAUDE.md` or `CLAUDE.local.md` on the path.
- Instruction files are advisory: "there's no guarantee of strict compliance".
- Multiple `PreToolUse` hooks returning `updatedInput`: "Claude Code doesn't merge the rewrites or guarantee which rewrite the tool runs with."
- `updatedToolOutput` changes only what Claude sees; telemetry keeps the original; "Stripping error details that Claude needs can cause it to proceed on a false assumption."
- Surface is large and moves quickly (443 releases; version gates on the page run from v2.1.199 to v2.1.319), so overlays pinned to one version drift.
- Open tracker requests showing gaps (reaction counts as of 2026-11-18): #9516 User Interrupt Hook (+73); #14259 PrePlanMode/PostPlanMode events (+60); #11008 token usage and cost in hook inputs (+35); #27365 `updatedPrompt` for `UserPromptSubmit` (+24).
- No published measurements of hook reliability, prompt-hook accuracy, or instruction adherence versus file length. The "200 lines" guidance is asserted, not evidenced, on these pages.

## 5. Anything that looks unsafe

- No hidden or instruction-like text aimed at agents was found in the pages. The only reader-directed boilerplate is the header "Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt", which is navigation, not an instruction acted on here.
- Command hooks run unsandboxed with full user rights: "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access." `DirectoryAdded` section: "Hook commands themselves run unsandboxed."
- Headless trust bypass: in `-p`/SDK runs, hooks committed in an untrusted repository's `.claude/settings.json` run without any dialog. The page's own mitigation: review `.claude/`, use `--bare`, or `--settings '{"disableAllHooks": true}'`. Project skill frontmatter hooks follow the same rule.
- Privilege escalation through a hook: `PermissionRequest` `updatedPermissions` can add allow rules or `setMode` and persist them to `projectSettings`/`userSettings`; `PreToolUse` `allow` skips prompts. `bypassPermissions` via `setMode` only works if the session was launched with bypass available.
- `CLAUDE_ENV_FILE`: "Each Bash command runs the file's contents as shell code before the command itself" — a SessionStart/Setup/CwdChanged/FileChanged hook can inject code into every later Bash call.
- HTTP hooks POST the full event JSON (prompts, tool inputs, tool results, transcript path) to a URL; unrestricted unless `allowedHttpHookUrls` is set. Header env interpolation is limited to `allowedEnvVars`.
- Hook processes inherit the parent environment, credentials included, unless `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` or the HIPAA configuration applies.
- Doc examples pass `-ExecutionPolicy Bypass` to PowerShell and include a SessionStart hook that syncs a remote skills repository then sets `reloadSkills` — a pattern that pulls executable content at session start.
- `MessageDisplay` and `updatedToolOutput` let a hook show the user, or the model, something other than what was produced; a malicious hook can hide output from one side.
- Skill frontmatter hooks persist for the rest of the session after one invocation, including a model-initiated one.
- `classifierContext` is read by the auto-mode classifier as host-provided context; the page warns "don't copy untrusted tool output or third-party text into it".

## Implications for the optional overlays (researcher inference, not from the source)

- Guard hooks shipped in `Hooks/` should set `onFailure: "block"`, use exec form (`args`), and exit 2 (never 1) to deny; state the minimum host version (v2.1.295).
- A done-gate on `Stop`/`TaskCompleted` cannot be made fail-closed by `onFailure`; a missing script fails open there. Pair it with a `PreToolUse` gate on the action that matters (for example `git commit`/`git push`).
- This repo uses `AGENTS.md` only, so `InstructionsLoaded` will not report it; use `/context all` or `/memory` to confirm loading, and note that a stray `CLAUDE.local.md` disables `AGENTS.md` under the default setting.
- Role files are not re-injected after compaction by the host (only the project-root instruction file is); a `SessionStart` `compact` hook or `PreCompact` stdout is the documented way to carry the active role and task-file path across.
- `.claude/rules/` files with broken `paths:` YAML load unscoped — validate frontmatter in CI if `Rules/` is shipped.
- The "200-line / 25KB" figure belongs to auto memory's `MEMORY.md`, not to `AGENTS.md`/`CLAUDE.md`.

<!-- END-OF-FILE -->
