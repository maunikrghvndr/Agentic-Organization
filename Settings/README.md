# Settings: user-level permission baseline and secret gate

Optional Claude Code overlay (Decision A, 2026-10-19). `AGENTS.md` prose is the complete, portable contract; this folder adds hard enforcement where the host supports it and changes nothing when absent. Rule syntax below was verified against https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/settings and https://code.claude.com/docs/en/sandboxing on 2026-10-19 (the pages show no "last updated" date; re-verify when a rule stops matching).

## Install

`claude-baseline.settings.json` is a copy-paste reference for the `permissions` block of the **user-level** file `~/.claude/settings.json` (Windows: `%USERPROFILE%\.claude\settings.json`). It is never checked into a project: project and local settings files cannot override a user-level deny, and keeping the baseline out of repos keeps it out of the diffs the agent can edit.

1. Replace `<library-root>` in `Edit(//<library-root>/**)` with the absolute path of your library checkout, written as the docs require for absolute paths: `//` prefix, and on Windows the drive as a lowercase segment with forward slashes. `C:\Users\mauni\source\repos\Agentic-Organization` becomes `Edit(//c/Users/mauni/source/repos/Agentic-Organization/**)`. On macOS or Linux: `Edit(//home/mauni/repos/Agentic-Organization/**)`.
2. Merge the `deny` and `ask` arrays into your existing `permissions` block (keep any `allow` rules you already have), or paste the whole object into an empty file.
3. Run `/permissions` in a session to confirm every rule is listed and attributed to the user settings file. A rule naming an unknown tool prints a startup warning.

## What the baseline enforces

- **Deny** (blocked outright, in every project): force-push (`--force`, `--force-with-lease`, `-f`, `+refspec`), `git reset --hard`, recursive `rm` / `Remove-Item -Recurse`, reads of `.env` and `.env.*` (except `.env.example` / `.env.sample`), reads under `~/.ssh/` and `~/.aws/`, edits under any `node_modules/`, `bin/` or `obj/` directory, and edits anywhere under the library checkout (see below).
- **Ask** (always prompts, even under an allow rule or auto mode): writes under `.git/`, `.claude/`, `.codex/`, `.cursor/`, `.mcp.json` and `.github/workflows/`; package installs (npm, pnpm, yarn, pip, `dotnet add package`, nuget, `Install-Package`); `dotnet ef migrations`; any command carrying `--no-verify`; every `git push`.

Both the `Bash(...)` and the `PowerShell(...)` form of each shell rule are included. The permissions doc confirms a separate PowerShell tool with rules of the same shape (`*` anywhere, `:*` as a trailing-wildcard alias, case-insensitive, common aliases canonicalized so `Remove-Item` rules also match `rm`, `del`, `ri`), and compound commands split per subcommand on `|`, `;`, `&&`, `||`. Sessions on Windows that run the PowerShell tool need the second form; sessions in WSL2 need the first.

## How the rules are evaluated

- **Deny beats ask beats allow.** Rules are evaluated deny, then ask, then allow; the first match wins and specificity does not matter. An allow rule cannot carve an exception out of a deny, and a user-level deny blocks a project-level allow.
- **Only `Edit(path)` and `Read(path)` are consulted for file rules.** A `Write(path)` or `NotebookEdit(path)` rule is accepted but never checked (startup warning). `Edit` rules cover every built-in editing tool, recognised file commands in Bash (`sed`, `tee`, redirects such as `> file`), and a `Read` deny also blocks Edit and Write on the same path.
- **Path anchors differ by prefix.** `//path` is absolute; `~/path` is home-relative; a bare `path` is relative to the session's working directory and, as a deny or ask rule with a single directory segment, matches that directory name at any depth (so `Edit(bin/**)` also hits `src/tools/bin/`). A single leading slash (`/path`) anchors at the settings file's own directory, which in user settings means `~/.claude/path`, so the baseline never uses it.
- **Text-matched shell rules are defense in depth, not a boundary.** A `Bash(...)` or `PowerShell(...)` rule matches the command text as written. `/bin/rm -rf`, `sh -c 'rm -rf x'`, `git -C . push --force`, a script that deletes files, or a Python one-liner that writes through a path are not matched. The prose rules in `AGENTS.md` still govern those forms; OS-level enforcement that does not depend on the command text is the sandbox. A `PreToolUse` hook can inspect the full command when you need more than text matching.
- **Native Windows has no agent sandbox (as of 2026-10).** The sandboxing doc states it runs on macOS, Linux and WSL2 and that on native Windows commands run unsandboxed. Interactive Windows sessions rely on this baseline plus the prompts; unattended work (`-p`, CI, scheduled tasks) runs in WSL2 or a devcontainer where the sandbox can hold the line.

## The library write-deny (H1)

The F9/F10 security review (task file `library-field-review-2026-10.md`, Progress log 2026-10-18, finding H1, Verification: Confirmed) found that an agent in any project could write to the library's `LESSONS.md` / `LESSONS/**` and role files with only a prose gate between it and the shared instruction set, so a prompt injection in one repo could rewrite the rules every other repo obeys. The review named the architectural fix: project sessions get **no write access to the library checkout**. `Edit(//<library-root>/**)` is that control. Reads stay open (every role file is read from there), writes are blocked for every editing tool and recognised file command, and lessons are proposed into the project's own task file for a human to carry across. Because a deny cannot be overridden from a project, maintaining the library itself needs a session whose user settings omit the rule: start it with `CLAUDE_CONFIG_DIR` pointing at a second config directory that holds the same baseline minus this line, or remove the rule through `/permissions` for that session and restore it afterwards. The rule is text-matched on paths, so a subprocess that writes without naming the path (a script, a package manager) is outside it; that residual is covered by the ask rules on `.git/**` and the agent directories, by `git status` before every commit, and by the prose.

## Secret gate: gitleaks pre-commit hook

A tool-agnostic gate that runs on every commit from any agent or human, independent of the host: `gitleaks git --pre-commit --staged --redact` (gitleaks ≥ 8.19; the older `protect --staged` form is a deprecated alias) as a git pre-commit hook, shipped as `Hooks/pre-commit.gitleaks.sh` (POSIX `sh`). It **fails closed**: if `gitleaks` is not on `PATH`, the hook prints one line and exits 1, so a machine without the scanner cannot commit until it is installed (the prose rule "never commit secrets" is then enforced, not assumed). Pass-through of the scanner's own exit code means a real finding blocks the commit and the redacted report shows where.

Install gitleaks (verify the current release at https://github.com/gitleaks/gitleaks before pinning):

```text
winget install gitleaks        # Windows
brew install gitleaks          # macOS
# Linux / WSL2: download the release archive for your arch from the GitHub releases page and put `gitleaks` on PATH
```

Install the hook, per repo or globally:

```sh
# one repo
cp <library-root>/Hooks/pre-commit.gitleaks.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# every repo on this machine
mkdir -p ~/.githooks && cp <library-root>/Hooks/pre-commit.gitleaks.sh ~/.githooks/pre-commit && chmod +x ~/.githooks/pre-commit
git config --global core.hooksPath ~/.githooks
```

On Windows, git runs `sh` hooks through its bundled MSYS shell, so the same file works from PowerShell sessions. `git commit --no-verify` skips every pre-commit hook, which is why the baseline puts `--no-verify` on the ask list: the human sees the bypass. False positives are handled with a `.gitleaks.toml` allowlist in the repo or an inline `gitleaks:allow` comment, both reviewed as code (they weaken a security check).
