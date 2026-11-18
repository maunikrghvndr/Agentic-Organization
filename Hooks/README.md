# Hooks (optional enforcement pack)

`AGENTS.md` prose is the complete, portable contract. These hooks only enforce two of its rules on hosts that run hooks; without them the library behaves exactly as before. Node-only, no dependencies, one-time user-level install for the Stop and SessionStart hooks below; the cloud hook is the exception — `Sync-AgentsMd.ps1 -WithCloudHook` writes it into each repo's `.claude/` because cloud sessions read only the repo, and a committed `.claude/settings.json` hook then runs for every developer after one trust dialog, and for every `-p`/SDK session with no dialog at all (headless runs treat the folder as trusted; re-read 2026-11-18, the vendor page does not state trust behaviour for cloud sessions) (protect `.claude/**` with CODEOWNERS/branch protection; review every change to it as code). Every hook is a silent no-op in a repo whose root `AGENTS.md` does not mention `.ai-memory`.

| File | Event | What it does | Can | On its own error |
|---|---|---|---|---|
| `handoff-check.mjs` | `Stop` | Blocks the stop (exit 2, reason on stderr) when the working tree has changed source files but the newest `.ai-memory/TASKS/*.md` is older than that work, has no `## Handoff` section, or has no Evidence row (`- \`<command>\` \| scope \| exit code \| sha`). Prose-only turns (`.md .txt .csv`, LICENSE, CHANGELOG, `.json` under `.ai-memory/`) are exempt. Exits 0 when `stop_hook_active` is true, so it nudges once; the platform's 8-consecutive-continuation cap is the backstop. Works in linked worktrees (`.git` as a file). | Block the stop; reads `git status` and task files. | A failed `git status` and an uncaught exception (Node exit 1) allow the stop. Unparseable input is not an error: it is read as `{}`, so the check still runs against `CLAUDE_PROJECT_DIR` or the process cwd, without the `stop_hook_active` guard (observed 2026-11-18: exit 0 outside a repo, exit 2 inside one with unrecorded work). |
| `session-reentry.mjs` | `SessionStart` (`compact`, `resume`) | Prints the newest open task file's path, `## Summary` and `## Handoff` to stdout, which the host adds to context — the on-disk re-entry point AGENTS.md → Compaction / re-entry asks for. Never blocks. | Add text to context (the task file's Summary and Handoff, Tier 3). | Silent, exit 0. |
| `session-start-library.mjs` | `SessionStart` (cloud/CI only, `CLAUDE_CODE_REMOTE`) | Shallow-clones the library (tracks `main`, resolved sha printed) into `../Agentic-Organization` when the `AGENTS.md` path line does not resolve; installed per repo by `Sync-AgentsMd.ps1 -WithCloudHook`. | Network (shallow `git clone`); writes `../Agentic-Organization`. | Exit 0 always; a failed clone is one stderr line and `AGENTS.md` falls back to Universal Rules. |
| `pre-commit.gitleaks.sh` | git `pre-commit` | Secret gate: `gitleaks git --pre-commit --staged --redact`; fails closed when gitleaks (≥ 8.19) is absent. A global `core.hooksPath` install disables each repo's own `.git/hooks` (husky etc.) — install per repo instead when a repo has its own hooks. | Block a commit. | Blocks (scanner absent, or any non-zero scanner exit). |
| `settings.snippet.json` | — | The `hooks` block to paste into the **user-level** `~/.claude/settings.json`. | — | — |
| `handoff-check.test.mjs` | — | `node --test "Hooks/*.test.mjs"` from the library root (Node ≥ 22; a bare directory is not accepted) — temp git repos, incl. a linked worktree. | — | — |

None sends session content to a model or a remote service; none edits source files (true of the four files on 2026-11-18; re-check when a hook is added).

## Install (Claude Code)

1. Open `~/.claude/settings.json` (create it if missing) and merge in the `hooks` block from `settings.snippet.json`.
2. Replace `<library-root>` with this library's absolute path (the same path as the fenced line at the top of `AGENTS.md`). Keep the quotes around the path; on Windows the shell form runs under Git Bash, so forward slashes or escaped backslashes both work.
3. Verify in-session with `/hooks`, or run `echo '{"cwd":"<a repo>"}' | node "<library-root>/Hooks/handoff-check.mjs"; echo $?`.

The install is machine-wide; repos opt in through their `AGENTS.md` (the `.ai-memory` mention), nothing is written to any repo by this install (the cloud hook is a per-repo overlay — see `Sync-AgentsMd.ps1 -WithCloudHook`). Remove the two entries to uninstall. Rollback is the same edit.

After a library move or a host upgrade, re-run the install check (step 3) and confirm a non-zero exit on a repo with changed source and no Evidence row. A check that has only been seen to pass has not been seen to work.

## Hook contract (checked 2026-10-19)

Against the Claude Code hooks reference and guide (`code.claude.com/docs/en/hooks`, `/hooks-guide`; the pages carry no "last updated" date and reference Claude Code v2.1.296):

- Stop input carries `session_id`, `cwd`, `stop_hook_active`; exit 2 with stderr blocks the stop and the stderr is fed back to Claude; a Stop hook that blocks eight times in a row with no tool call in between is overridden (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it).
- SessionStart matchers are `startup`, `resume`, `clear`, `compact`, `fork`; `compact|resume` is a plain `|`-separated list; plain-text stdout is added to Claude's context; SessionStart cannot block.
- Settings schema: `hooks.<Event>[].{matcher, hooks[].{type:"command", command, timeout(seconds)}}`; user-level file `~/.claude/settings.json`.
- Stop decision JSON: `{"decision":"block","reason":"..."}`. `handoff-check.mjs` writes this to stdout as well as the stderr reason. **Claimed, not verified on a Kiro host:** Kiro's `Stop` hook documents the same `{"decision":"block","reason"}` stdout shape, but reads it on exit 0 and treats exit 2 on `Stop` as non-blocking (Kiro CLI hooks reference, read via the KiroCrew mirror dated 2026-09-06; `kiro.dev` was unreachable). So the body serves both, the exit code does not — a Kiro registration would need a thin exit-0 wrapper.
- **Hooks fail open (re-read 2026-11-18).** Exit 2 is the only blocking exit code; exit 1 and every other non-zero code is a non-blocking error and the action proceeds (no hook in this pack sets `onFailure`). A missing script, a crash or a timeout also lets the action through.
- **`handoff-check.mjs` is a nudge, not a gate.** A `Stop` hook cannot be made fail-closed (`onFailure` has no effect on `Stop`). The gates are the permission baseline (`Settings/`) and the git pre-commit hook.
- **Windows.** Without Git Bash a failing shell-form `PreToolUse` or `PermissionRequest` hook blocks, and stops blocking once Git for Windows is installed: the same config fails closed or open by machine.
- Matcher and debug detail: `code.claude.com/docs/en/hooks` → Matcher patterns, Debug hooks.

## Not shipped

Codex (`.codex/hooks.json`) and Cursor (`.cursor/hooks.json`) registrations wait until a verified schema is in hand. Check, in this order: `https://developers.openai.com/codex/hooks` (and `codex --help` on the installed version) and `https://cursor.com/docs/agent/hooks` (and the Cursor changelog). Deferred by design (F23): a PreCompact flush and a SubagentStop findings gate.
