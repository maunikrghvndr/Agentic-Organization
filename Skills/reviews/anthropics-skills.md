# Review record: anthropics/skills (`frontend-design`)

- **Verdict: Pass with conditions** (conditions C1 to C3 below).
- Listed in `Skills/skills.manifest.json` as `frontend-design` (area `ui-design`).
- Reviewed: 2026-11-18. Role: `security-engineer` (checks: `EngineeringTeam/security-engineer.md` → Agent Configuration And Supply Chain Review, "Reviewing a skill, plugin or MCP server before it is installed or enabled").
- Source: `https://github.com/anthropics/skills`
- Reviewed commit: `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` (committed 2026-11-16; it was the default-branch head on 2026-11-18). No tags upstream, so the pin is this commit sha.
- Installed path: `skills/frontend-design/` (2 files, about 20 KB: `SKILL.md` and `LICENSE.txt`). No script, no executable bit, no symlink. Nothing else from the repository is copied: this record covers this one skill only, not the other 18 skills in the repository (several of those ship Python scripts and were not reviewed).
- License: Apache License 2.0 (`skills/frontend-design/LICENSE.txt:1-4`; `SKILL.md:4` points to it).
- Hosts it targets: any host that reads the Agent Skills format; nothing in it is host-specific.
- Method: the default-branch head was fetched shallowly with `git` (hooks disabled) into a new empty temp directory. Both files were read in full, every line. Nothing was run; there is nothing to run. The role file's hidden-text, non-ASCII and hidden-Markdown scans were run over both files. Verification: Confirmed for everything below.
- All `path:line` references below are relative to the upstream repository at the reviewed commit.

## Recommendation

List it, as an optional overlay. Risk Level: **Low**. Blocking: **none**.

## Conditions

- **C1. The project's design system comes first.** The skill has the agent plan "a compact token system" with 4 to 6 named hex values and pick typefaces for the brief (`skills/frontend-design/SKILL.md:47-51`). In a repository that already has design tokens, a theme or a brand, those are the brief: use the existing tokens and add none without the project's convention (the no-hardcoding rule in `AGENTS.md` → Universal Rules; `EngineeringTeam/frontend-engineer.md:70`). The skill agrees in its own words ("Where the brief pins down a visual direction, follow it exactly", `SKILL.md:45`); this condition makes the project's tokens part of that brief.
- **C2. "Confirm with the client" does not replace the Grill Checkpoint.** The skill asks the agent to propose a subject, audience and job and confirm them (`SKILL.md:13`). That is compatible with the library's checkpoint and is done inside it, once.
- **C3. A new pin is a new review.** Any change of `commit` in the manifest needs this record redone against the new sha (a diff of the two files is enough) before the manifest changes.

## Findings

| id | check | severity | finding | evidence |
|---|---|---|---|---|
| F1 | (a) declared versus actual | Informational | The frontmatter declares `name`, `description` and `license`; no `allowed-tools`, and the body needs none beyond ordinary editing. The one tool-like suggestion is to take screenshots of the work "if your environment supports it". | `skills/frontend-design/SKILL.md:1-5`, `:59` |
| F2 | (b) description versus behaviour | Informational | The description ("Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one") matches the body, which is design and copywriting guidance only. No instruction reaches beyond that job. | `skills/frontend-design/SKILL.md:3`, `:9-71` |
| F3 | library fit | Low | The body mentions using "information in your memory about the client's preferences" and jotting notes about what was tried. On a host with a memory feature that is the host's own store; in this library, repo facts go to `.ai-memory/` and nowhere else. No conflict, noted so it is not read as permission to write memory files unasked. | `skills/frontend-design/SKILL.md:13`, `:59` |

Checked, nothing found: any URL, fetch, install or package-manager step; scripts or other executable content; changes to settings, hooks, permissions or instruction files; instructions to hide anything from the user, skip review or ignore project rules; data sent anywhere; telemetry; hidden or bidirectional control characters; HTML comments or collapsed blocks; look-alike letters (the non-ASCII characters are typographic dashes, a middle dot, an arrow and one accented letter used as examples); license problems.

## Library fit

- **(a) Conflict with library rules.** None that survives C1. The skill names example hex values only as things to avoid by default, and tells the agent to build responsive, keyboard-visible, reduced-motion-aware and accessible pages (`SKILL.md:59`), which agrees with the frontend role.
- **(b) Token weight.** `SKILL.md` is 9.4 KB (about 2,300 tokens) and loads nothing else. It is the lightest UI skill on the list.
- **(c) Overlap.** Same job as `hallmark` (nutlope/hallmark). Prefer `frontend-design` as the default for everyday UI work and for work inside an existing design system; prefer `hallmark` for a new marketing page or site built from nothing when a full guided run with its linter is wanted. Both may be installed; when both trigger, use one for the task and say which.

## Tests Needed

- `node --test "Skills/*.test.mjs"` covers the installer.
- Searches run over the two files (read-only): the role file's control-character scan, `[^\x00-\x7F]`, hidden-Markdown patterns, and `https?://`, `curl`, `npx`, `npm`, `settings`, `permission`.
- Not reviewed: the other skills, the `spec/` and `template/` folders and the plugin manifest of the same repository (not installed).

## Final Notes

- Maintainer: Anthropic. Reputation was not used to lower any finding; there was none to lower.
- Installing this skill is a dependency decision (ask-first). The owner approved a list of the best UI and platform skills on 2026-11-18; this record is the security pass for this one entry at this one commit.
