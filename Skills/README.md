# Skills (optional overlay: curated third-party skills)

`AGENTS.md` prose is the complete, portable contract, and every role works with no skill installed. This folder adds one thing on top: a short, reviewed list of third-party agent skills and an installer that brings a machine up to that list. Node only, no dependencies; needs `git` on PATH.

| File | What it is |
|---|---|
| `skills.manifest.json` | The curated list. Each entry is pinned to a full commit sha and points to its review record. |
| `install-skills.mjs` | Installs every listed skill that is missing from the target folder. Idempotent. |
| `install-skills.test.mjs` | `node --test "Skills/*.test.mjs"` from the library root (Node >= 22). Local git fixture, no network. |
| `reviews/` | One security review record per listed skill, at the pinned commit. |

## Run

From the library root:

```text
node Skills/install-skills.mjs --dry-run    # print what would be installed, change nothing
node Skills/install-skills.mjs              # install every missing skill
node Skills/install-skills.mjs --list       # the list, with each skill's state in the target
node Skills/install-skills.mjs --upgrade     # also replace a skill that is installed at another commit
```

- There is no per-skill selection: the installer installs **every** skill on the list that is not already present, so re-running it on any machine brings it up to the full list. Review happens when a skill is added to the list, not at install time.
- A skill already present at the pinned commit is skipped. One installed by this script at a different commit is reported, and replaced only with `--upgrade`.
- **Target folder.** Default: `~/.claude/skills` (Claude Code's personal skills folder, `~/.claude/skills/<skill-name>/SKILL.md`; Claude Code skills documentation, read 2026-11-18). For any other host or location, pass `--target <dir>`: the skills folders of other hosts were not confirmed from their documentation, so none is built in. The personal folder is not read by Claude Code cloud sessions; there, pass `--target .claude/skills` inside the repository if the project wants the skill (a committed skill is an agent configuration file: ask-first, reviewed as code).
- Exit code: `0` nothing failed; `1` at least one skill failed (the others are still processed); `2` bad arguments or an invalid manifest (nothing is installed). A name clash or a skill left at another commit is reported in the summary table and is not a failure.
- Uninstall: delete `<target>/<name>`. Nothing else is written anywhere.

## How a skill gets onto the list

Adding a skill is adding a dependency: **ask-first, and it needs the owner's approval.**

1. `security-engineer` reviews it at one commit, read-only, with the checks in `EngineeringTeam/security-engineer.md` → Agent Configuration And Supply Chain Review ("Reviewing a skill, plugin or MCP server before it is installed or enabled"): declared versus actual, description versus behaviour, deferred content, one version, no lowering on reputation. Nothing from the candidate is run during the review.
2. The record goes under `Skills/reviews/<name>.md` with a verdict (Pass / Pass with conditions / Fail), `path:line` evidence and the reviewed sha.
3. Only on Pass or Pass with conditions, and with the owner's approval, an entry is added to `skills.manifest.json`: `name`, `area`, `source` (https git URL), `commit` (full 40-character sha; a branch or tag is not a pin), `path` (the folder that holds `SKILL.md`, or `.`), `license`, `reviewed`, `review` (path to the record, relative to this folder), `hosts`, `notes`. The installer refuses a manifest whose review record is missing.
4. Changing a `commit` is a new review of the new sha, then the manifest edit.

## What the installer will never do

- Run anything from a fetched repository: no `npm install`, no scripts, no hooks, no upstream installer or `npx` CLI. It only copies files.
- Fetch anything but the pinned commit, over anything but https, or install when `git rev-parse HEAD` differs from the pin.
- Copy anything outside the skill's `path`, follow a symlink that leaves the skill folder, or accept `..` or an absolute path in `name` or `path`.
- Touch a folder it did not install: a folder without its marker file (`.agentic-skill.json`) is the user's own skill; it is reported as a name clash and skipped, with or without `--upgrade`.
- Prompt for credentials, use a shell, change host settings, hooks or permissions, or write outside the target folder and a temp directory it removes.

Limits, stated plainly: the marker records which commit was installed, not a hash of the files, so local edits to an installed skill are not detected; and the installer checks the pin, not the content: the review record is the safety check.

## Listed skills

| Skill | Area | Source | Review |
|---|---|---|---|
| `security-audit` | security | `cloudflare/security-audit-skill` at `c1c8a8c` | `reviews/cloudflare-security-audit-skill.md` (Pass with conditions) |

**Windows note for `security-audit`.** Its two validators refuse to run on native Windows (they require an OS no-follow open that Node does not provide there), so a full audit cannot reach its "complete" state. Run full audits in WSL2 or a devcontainer; guidance mode (security questions, focused reviews) works on native Windows. It is installed by pinned git fetch, not by the upstream `npx skills add` CLI, which is unreviewed. A full audit starts many sub-agents with no published cost: set a budget first.

## Candidates not yet reviewed

- hallmark (UI) — repository to be confirmed by the owner
