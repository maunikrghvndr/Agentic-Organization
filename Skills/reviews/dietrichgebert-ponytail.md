# Review record: DietrichGebert/ponytail (`ponytail`)

- **Verdict: Pass with conditions** (conditions C1 to C8 below).
- Listed in `Skills/skills.manifest.json` as `ponytail` (area `engineering-discipline`). The owner asked for it on 2026-11-25 ("install all these extensions like pony tail").
- Reviewed: 2026-11-25. Role: `security-engineer` (checks: `EngineeringTeam/Quality/security-engineer.md` → Agent Configuration And Supply Chain Review, "Reviewing a skill, plugin or MCP server before it is installed or enabled").
- Reviewer: an isolated, read-only context that did not see the requester's transcript. Model family: Claude (Anthropic), the same family as the library's author. This is not a cross-family review.
- Source: `https://github.com/DietrichGebert/ponytail`
- Reviewed commit: `ebd8654c2c627f721eb8f9c0d1bd4090a29f9e10` (confirmed with `git rev-parse HEAD`; committed 2026-11-22, "fix(hooks): decode stdin across UTF-8 chunk boundaries (#1495)"). The checkout is shallow (one commit, no tags), so the pin is this sha. The repository states its version as 5.3.3 (`package.json:3`, `plugin.yaml:2`, `.claude-plugin/plugin.json:3`, `gemini-extension.json:3`).
- Installed path: `skills/ponytail/` (one file, `SKILL.md`: 52 lines, 3,496 bytes, pure ASCII, mode `100644`, git blob `d64edd32265ba21cbf5270158f04e97d96925f27`, sha256 `9badd22a32e19cb884e46dfa8d3aae82bb81dfa5484105b8b4f0262df823a509`). No script, no symlink, no executable bit, no submodule. Nothing else is copied: not `hooks/`, `scripts/`, `commands/`, `.opencode/`, `pi-extension/`, `__init__.py`, the root `AGENTS.md`, any plugin manifest, or the other five `skills/ponytail-*` folders.
- License: MIT, Copyright (c) 2026 DietrichGebert (`LICENSE:1-3`). The skill folder carries no licence file of its own, only `license: MIT` in the frontmatter (`skills/ponytail/SKILL.md:10`). MIT asks that the copyright and permission notice travel with copies: see C8.
- Hosts it targets: any. The file is plain prose with no host-specific tool call. The repository ships loaders for many hosts; none is installed here.
- Method: the fetched tree was read with file reads and `git` read commands only. **Nothing from it was run**: no script, hook, test, installer or package manager.
  - Read in full: `skills/ponytail/SKILL.md`, `LICENSE`, `package.json`, `plugin.yaml`, `plugin.json`, `skills/plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `gemini-extension.json`, `hooks/claude-codex-hooks.json`, `hooks/claude-band.json`.
  - Skimmed by listing every process, file-write, network, environment and home-folder call and reading the hits in context: `hooks/*.js`, `hooks/band/register.tsx`, `hooks/band/metrics.ts`, `.opencode/plugins/ponytail.mjs`, `scripts/uninstall.js`, `scripts/cursor-hooks.js`.
  - Verification: Confirmed for everything said about `SKILL.md`; Probable for the description of the uninstalled plugin code, which was skimmed.
- All `path:line` references below are relative to the repository root at the reviewed commit.

## Recommendation

List it, under the conditions below. Risk Level: **Low**. Blocking: **none**.

The installed content is one short prose file. It tells the agent to run nothing except a read-only search for callers, and to install, fetch, send and configure nothing. It carries no hidden text and depends on nothing outside itself. Its aim (the smallest complete change, reuse first, no unrequested features) is the same as `AGENTS.md` → "Smallest change that does the job".

The risk is fit, not security: several lines are looser than the library's rules on tests, deletion, preserved behaviour and workarounds. If an agent followed them over `AGENTS.md`, quality bars would drop. The conditions state which rule wins.

The rest of the repository is a different matter. Installed as a plugin it adds hooks, home-folder writes and an optional outbound webhook (F6). This record does not cover that route.

## Conditions

- **C1. Install by pinned git fetch of `skills/ponytail/` only.** Never use the upstream routes (`/plugin marketplace add DietrichGebert/ponytail`, `/plugin install ponytail@ponytail`, `grok plugin install ... --trust`; `INSTALL.md:10-13`, `:161`), the npm package `@dietrichgebert/ponytail` (`package.json:2`), or `scripts/cursor-hooks.js`. Each one installs the hooks described in F6. A settings or hook edit is an agent configuration change: ask-first, security pass, recorded approval.
- **C2. `AGENTS.md`, the constitution and the role file outrank the skill, including on tests.** The skill asks for "one small test or an assert-based self-check" on new non-trivial logic and says "Trivial changes need none" (`skills/ponytail/SKILL.md:41`). The library's rule stands: a test for every behaviour change, failing before and passing after, with an Evidence row. An in-code assert is not a test.
- **C3. Nothing existing is removed on the skill's word.** "Deletion beats addition" (`skills/ponytail/SKILL.md:35`) does not lift the ask-first Boundary on deleting files, tests or behaviour, and does not override "mention other dead code, never delete it".
- **C4. The skill's "Never cut" list is a floor, not the whole list.** It protects "validation at trust boundaries, error handling that prevents data loss, security, accessibility" (`skills/ponytail/SKILL.md:44`). The library protects more: all existing validation, authorization, logging, telemetry, tracing, retries, idempotency, error handling and public contracts. Anything outside the skill's list is still preserved.
- **C5. Library-required code is not "boilerplate".** "No abstraction, wrapper, type conversion, option, config, boilerplate" and "Keep values in the form the platform already gives you" (`skills/ponytail/SKILL.md:35`) do not remove structured logging, observability, constants or configuration in place of hardcoded values, explicit types, or localization for code a change adds or edits.
- **C6. No shortcut in place of the proper fix.** The skill allows "A shortcut with a known limit" marked with a `shortcut:` comment (`skills/ponytail/SKILL.md:42`). Under the library a workaround in place of the proper fix is a Blocking review finding; a known limit goes to the user and the task file, not only into a comment.
- **C7. Scope of use.**
  - It is guidance for engineer phases. It is not applied in reviewer, `security-engineer`, `qa-engineer` or `debugger` phases to shorten a review or drop a finding, although its description claims "any coding task (writing, fixing, refactoring, reviewing, choosing dependencies)" (`skills/ponytail/SKILL.md:5-6`).
  - "Active for the whole session" (`skills/ponytail/SKILL.md:17`) does not hold across a role switch.
  - "A vague request ... gets the smallest version that does the core job" (`skills/ponytail/SKILL.md:27`) does not replace the Grill Checkpoint: an ambiguous request is asked about, not silently narrowed.
  - The closing "one or two lines" (`skills/ponytail/SKILL.md:15`) is added to the Completion report, not a substitute for it.
  - The `/ponytail lite|full|ultra` command (`skills/ponytail/SKILL.md:17`) exists only with the plugin and is not available here.
- **C8. Licence notice and re-pin.** Keep the source URL, the commit and "MIT, Copyright (c) 2026 DietrichGebert" in the manifest entry and this record, because the installed folder has no `LICENSE` file. Any change of `commit` is a new review of the new sha. The project moves fast (version 5.3.3, issue numbers near 1,500); do not follow its head.

## Findings

Blocking: **none**.

Non-blocking:

| id | check | severity | finding | evidence | Verification |
|---|---|---|---|---|---|
| F1 | (a) declared versus actual | Informational | Frontmatter declares `name`, `description`, `argument-hint`, `license`; no `allowed-tools`, no network or permission declaration, and the body needs none. The only action it directs beyond reading and editing code for the task is "grep every caller of the function you touch", a read-only search inside the working repository. No instruction to install, fetch a URL, edit settings or hooks, send data, or write outside the repository. | `skills/ponytail/SKILL.md:1-11`, `:21`, `:38` | Confirmed |
| F2 | (b) description versus behaviour | Low | The description matches the body. It is broad ("Use on any coding task ... reviewing, choosing dependencies") and the body claims the whole session ("Active for the whole session until the user says \"stop ponytail\" or \"normal mode\""). That is self-activation and persistence, not concealment or a claim to outrank project rules; the file never says to ignore a project's instruction files. Covered by C7. | `skills/ponytail/SKILL.md:5-8`, `:17` | Confirmed |
| F3 | library fit: tests | Medium | Weaker test bar than the library: "new non-trivial logic (a branch, a loop, a parser, money or security, or a whole new script or app) leaves one small test or an assert-based self-check. Trivial changes need none." It does not tell the agent to remove or weaken an existing test, and line 34 requires fixing "the callers, tests and fixtures your change breaks". Covered by C2. | `skills/ponytail/SKILL.md:41`, `:34` | Confirmed |
| F4 | library fit: deletion and preserved behaviour | Medium | "Deletion beats addition" reads as leave to delete without asking. The "Never cut" list is narrower than the library's preservation rule, and omits logging, telemetry, retries, idempotency and authorization by name ("security" may be read to include the last). Partly offset by "Code you move or merge keeps its error handling and validation" and by the instruction to check "data it would destroy or expose, callers that stop working". Covered by C3 and C4. | `skills/ponytail/SKILL.md:35`, `:44`, `:39`, `:21` | Confirmed |
| F5 | library fit: required code and shortcuts | Low | "No ... type conversion, option, config, boilerplate" and "The shortest working diff wins" can be read against structured logging, constants or configuration and explicit types. The sanctioned `shortcut:` comment conflicts with "no workaround in place of the proper fix". Line 38 ("fix the root cause once in the shared code") and line 40 ("take the one that is correct on edge cases") pull the right way. Covered by C5 and C6. | `skills/ponytail/SKILL.md:35-36`, `:42`, `:38`, `:40` | Confirmed |
| F6 | not installed: the plugin (warning) | Medium if the whole plugin were installed; not applicable to this install | The plugin is a different product from the skill file. It would: (1) run Node hooks on `SessionStart`, `SubagentStart` and every `UserPromptSubmit`; (2) write flag files and a statusline script into the tool's config folder and read `settings.json`; (3) put text in the model's context telling it to "Proactively offer" a `statusLine` edit to `settings.json`, on Windows as `powershell -ExecutionPolicy Bypass -File ...`; (4) add a `git ls-files` based map of the repository to the context; (5) after every turn write a row per task (name or first prompt, cost, tokens, model, project) to `~/.config/ponytail/band/<project>.csv`, on by default; (6) POST that row as JSON, with an optional Bearer token, to a user-set webhook URL (empty by default; https or localhost only; task names sent by default); (7) on `/ponytail band import`, start a detached process that reads past session transcripts under `~/.claude/projects`; (8) via `scripts/cursor-hooks.js`, edit `~/.cursor/hooks.json`. No fixed third-party endpoint or telemetry host was found. None is needed for `SKILL.md` to work. | `hooks/claude-codex-hooks.json:3-39`; `hooks/ponytail-activate.js:6`, `:29`, `:66-67`, `:125`, `:134`, `:141-162`; `hooks/ponytail-map.js:42`; `.claude-plugin/plugin.json:9-12`, `:15-19`, `:21-25`, `:33-36`; `hooks/band/register.tsx:154-180`; `hooks/band/metrics.ts:299-310`; `hooks/ponytail-mode-tracker.js:86`; `hooks/ponytail-band-import.js:213`, `:216-217`, `:267`; `scripts/cursor-hooks.js:27`, `:56` | Probable |
| F7 | (c) deferred content, dependencies | Informational | The skill folder references nothing outside itself: no hook, CLI, npm package, statusline, telemetry or URL, and it tells the agent to fetch nothing later. The only outside reference is the `/ponytail` level command, which the plugin provides (C7). The repository's own README says the same: "Ponytail is one prompt: `skills/ponytail/SKILL.md` ... Everything else in this repo loads that prompt into different agents." | `skills/ponytail/SKILL.md:17`; `README.md:152` | Confirmed |
| F8 | licence | Low | MIT at the root; no licence file inside the installed folder, only the frontmatter field. Covered by C8. | `LICENSE:1-3`; `skills/ponytail/SKILL.md:10` | Confirmed |
| F9 | safety text in the bundle | Informational | The file's own protective lines ("Never cut: validation at trust boundaries ... security", "Never add a dependency for a few lines", the closing disclosure of "what you skipped or did not check") are prose addressed to the model and are not counted as a control. | `skills/ponytail/SKILL.md:44`, `:30`, `:15` | Confirmed |

Checked, nothing found (in `skills/ponytail/SKILL.md`):

- Bytes outside ASCII (`grep -nP '[^\x00-\x7F]'`: no hit; `file` reports ASCII text), so no zero-width, bidirectional or look-alike characters.
- Control characters other than newline; HTML comments (`grep -n '<!--'`: no hit); encoded blobs or lines over 400 characters.
- Links or URLs; pipe-to-shell, `curl`, `wget`, `npm`, `npx`, `pip` or `uvx` steps.
- Instructions to edit settings, hooks or permissions, or to send prompts, code or environment anywhere.
- Instructions to hide an action, to refuse or skip a review, to ignore or outrank a project's instruction files, or to add a dependency.
- A `.gitattributes` file hiding anything from diff (the repository has none).

## Library fit

- **(a) Conflict with library rules.** The direction matches `AGENTS.md` (reuse first, no unrequested features, follow how the repository already does it, fix the root cause). The five places where its wording is looser are F3 to F5, settled by C2 to C6. It never tells the agent to weaken a security or authorization check.
- **(b) Token weight.** 3.5 KB, about 900 tokens, one file. The lightest entry on the list.
- **(c) Overlap.** It largely restates the first Universal Rule and `_shared/rules-detail.md` → Proportional complexity. What it adds is the ordered ladder at `skills/ponytail/SKILL.md:25-32` and the `lite` / `full` / `ultra` levels. The owner should weigh whether that is worth a listed entry.

## Tests Needed

- `node --test "Skills/*.test.mjs"` covers the installer (pin check, traversal, symlink refusal, no execution). Not run in this review.
- After install: `node Skills/install-skills.mjs --list` should show `ponytail` present at the pinned commit, with exactly one file beside the marker.
- Searches run, read-only:
  - Over `SKILL.md`: non-ASCII, control-character, HTML-comment and long-line scans; `https?://`, `www.`, `curl`, `wget`, `npm`, `npx`, `pip`, `bash`, `hook`, `settings`, `statusline`, `telemetry`, `base64`.
  - Over `hooks/`, `.opencode/plugins/`, `scripts/uninstall.js`, `scripts/cursor-hooks.js`, `__init__.py`: `fetch(`, `http`, `child_process`, `exec`, `spawn`, `writeFile`, `unlink`, `rmSync`, `settings.json`, `homedir`, `.config`, `.claude`, `statusLine`, `webhook`, `process.env`.

## Not checked

- Repository history, tags, releases, issues, stars and the maintainer's identity: the checkout is one shallow commit and the review was offline. Provenance rests on the pinned sha and the repository's own claims only.
- Whether the npm package `@dietrichgebert/ponytail` matches this tree; the registry was not consulted.
- The other five skills (`skills/ponytail-audit`, `-debt`, `-gain`, `-help`, `-review`), `commands/`, `pi-extension/`, `__init__.py` (Hermes plugin), `benchmarks/`, `tests/`, `docs/`, `i18n/`, `examples/`, and the per-host folders (`.cursor`, `.kiro`, `.windsurf`, `.qoder`, `.openclaw`, `.agents`, `.clinerules`, `.github`): not installed, not reviewed.
- `hooks/` and `.opencode/plugins/` beyond the calls listed in F6. `hooks/band/board.ts`, `hooks/ponytail-instructions.js` and `hooks/ponytail-subagent.js` were not read line by line.
- Behaviour on any host: nothing was executed, so every statement about the plugin is read from source.
- The effect of the skill on output quality, and the repository's benchmark claims.

## Final Notes

- Maintainer as stated by the repository: Dietrich Gebert (`package.json:7-10`). Reputation and popularity were not used to lower any finding.
- Adding this skill is a dependency decision (ask-first) and needs the owner's approval. This record is the security pass for this one entry at this one commit.
- Suggested manifest note: "Pass with conditions. One prose file, about 900 tokens. Install the `skills/ponytail` folder only; never the plugin, npm package or hooks (they edit tool settings, write to the home folder and can post task rows to a webhook). `AGENTS.md` outranks it on tests, deletion (ask-first), preserved validation, logging and authorization, and no-workaround. Engineer phases only."
