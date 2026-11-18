# Review record: vercel-labs/agent-skills (`react-best-practices`)

- **Verdict: Pass with conditions** (conditions C1 to C5 below).
- Listed in `Skills/skills.manifest.json` as `vercel-react-best-practices` (area `frontend`). The installed folder is named after the skill's own frontmatter name (`skills/react-best-practices/SKILL.md:2`), not after the upstream folder.
- Not listed from the same repository: `web-design-guidelines`. It was read in full and does not pass; see "Second skill, not listed" below. This record's single passing result is for `react-best-practices` only.
- Reviewed: 2026-11-18. Role: `security-engineer` (checks: `EngineeringTeam/security-engineer.md` → Agent Configuration And Supply Chain Review, "Reviewing a skill, plugin or MCP server before it is installed or enabled").
- Source: `https://github.com/vercel-labs/agent-skills`
- Reviewed commit: `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` (committed 2026-10-27; it was the default-branch head on 2026-11-18). Upstream tags are named after commit shas (one of them is this sha); the pin is the sha.
- Installed path: `skills/react-best-practices/` (76 files, about 230 KB: `SKILL.md`, `README.md`, `metadata.json`, a 108 KB compiled `AGENTS.md`, and 72 Markdown files under `rules/`). No script, no executable bit, no symlink. The repository's `packages/`, `scripts/`, `package.json`, `skills.sh.json` and the other eight skills are not copied.
- License: MIT, stated in the skill's frontmatter (`skills/react-best-practices/SKILL.md:4`) and in the repository README (`README.md:214-216`). The repository has no `LICENSE` file and no copyright line; the grant rests on those two statements.
- Hosts it targets: any host that reads the Agent Skills format; nothing in it is host-specific.
- Method: the default-branch head was fetched shallowly with `git` (hooks disabled) into a new empty temp directory. Nothing was run; the installed folder contains nothing to run. Read in full: `SKILL.md`, `README.md`, `metadata.json`, `rules/_template.md`, `rules/_sections.md` (head), `rules/async-dependencies.md`, `rules/rendering-hydration-no-flicker.md`, `rules/server-auth-actions.md` (head), and the whole of `skills/web-design-guidelines/SKILL.md`. The other rule files (about 57 KB of prose outside code blocks) and the compiled `AGENTS.md` were searched with the patterns under Tests Needed and every hit read; they were not read line by line. The role file's hidden-text, non-ASCII and hidden-Markdown scans were run over the whole folder. Verification: Confirmed for the inventory, the quoted lines and the scans; Probable for "no agent-directed instruction beyond React guidance in the 70 rule files and the compiled document".
- All `path:line` references below are relative to the upstream repository at the reviewed commit.

## Recommendation

List `react-best-practices`, as an optional overlay, under the conditions below. Risk Level: **Low**. Blocking: **none** for this skill.

## Conditions

- **C1. A package a rule names is still a dependency decision.** Several rules solve a problem with a specific npm package: `better-all` (`skills/react-best-practices/rules/async-dependencies.md:10`, `:25`), `swr` (`rules/client-swr-dedup.md:28`), `lru-cache` (`rules/server-cache-lru.md:15`). Applying such a rule in a project that does not already depend on the package is "adding a dependency": ask-first, checked on the registry, pinned. Prefer the rule's own no-dependency alternative where it gives one (`rules/async-dependencies.md:36-38`).
- **C2. Do not run the unpinned tool in the SVG rule without approval.** `rules/rendering-svg-precision.md:27` shows `npx svgo ...`, an unpinned package run. It is an example for the developer; if the agent wants to run it, it is ask-first and pinned.
- **C3. Read single rule files, not the compiled document.** `SKILL.md:147-149` offers `AGENTS.md` (108 KB, about 27,000 tokens) as "the complete guide". Load the one or two rule files the task needs. The file is named `AGENTS.md`: if the skill is ever installed inside a repository (`--target .claude/skills`), a host that reads nested `AGENTS.md` files may treat it as project instructions for that folder. It is guidance, never instructions that outrank the project's own `AGENTS.md` (`EngineeringTeam/frontend-engineer.md:70`).
- **C4. The inline-script rule needs the security role's eye.** `rules/rendering-hydration-no-flicker.md:62-74` recommends a `<script dangerouslySetInnerHTML=...>` block. The example string is a constant and safe as written; a variant that interpolates any request or user value into that string is an XSS finding, and a strict Content-Security-Policy needs a nonce for it. A change that uses this pattern gets the mandatory security review.
- **C5. A new pin is a new review.** Any change of `commit` in the manifest needs this record redone against the new sha before the manifest changes.

## Findings

| id | check | severity | finding | evidence |
|---|---|---|---|---|
| F1 | (a) declared versus actual | Informational | The frontmatter declares `name`, `description`, `license` and `metadata`; no `allowed-tools`, and the body needs none beyond reading its own files. | `skills/react-best-practices/SKILL.md:1-8`, `:132-149` |
| F2 | (b) description versus behaviour | Low | The description matches the body: a prioritized index of 70 performance rules. Its trigger is broad ("writing, reviewing, or refactoring React/Next.js code"), so it loads on most React work; the index itself is small (F5). | `skills/react-best-practices/SKILL.md:3`, `:14-21` |
| F3 | (c) deferred content | Low | No rule tells the agent to fetch instructions. Rules link to documentation as references (react.dev, nextjs.org, vercel.com, swr.vercel.app, GitHub, MDN); `README.md:18-36` lists `pnpm install` and `pnpm build`, which are for maintainers of the upstream repository and have no build files in the installed folder to act on. The dependency and `npx` examples are C1 and C2. | `skills/react-best-practices/README.md:16-36`; `rules/rendering-svg-precision.md:27` |
| F4 | library fit | Low | Code examples use the upstream's style (no semicolons, some untyped parameters). The library's TypeScript rule (explicit types, no `any`) and the project's formatter still decide the code that is written; no example uses `any`. The rule on `suppressHydrationWarning` says in its own text not to use it to hide real bugs. | `rules/rendering-hydration-suppress-warning.md:10` |
| F5 | consistency | Informational | `metadata.json` and the compiled `AGENTS.md` describe "40+ rules" while `SKILL.md` indexes 70: the compiled document may be older than the rule files. The rule files are the source. | `skills/react-best-practices/metadata.json:5`; `SKILL.md:12` |

Checked, nothing found: instructions to fetch the skill's content from a URL; scripts or executable content in the installed folder; changes to settings, hooks, permissions or instruction files; instructions to hide anything from the user, skip review or tests, or ignore project rules; data sent anywhere; telemetry; hidden or bidirectional control characters; HTML comments or collapsed blocks; look-alike letters (the non-ASCII characters are a multiplication sign, dashes, a curly apostrophe, arrows and check and cross marks).

## Second skill, not listed: `web-design-guidelines`

`skills/web-design-guidelines/SKILL.md` is the only file in its folder (1.2 KB). It holds no guidelines. It tells the agent to "Fetch fresh guidelines before each review" from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` and states that "The fetched content contains all the rules and output format instructions" (`skills/web-design-guidelines/SKILL.md:16`, `:23-29`, `:34-37`). The real content is therefore fetched at run time from the `main` branch of another repository: an unpinned instruction channel, which the security role blocks ("a skill or instruction file whose body tells the agent to fetch its real content from a URL"). Pinning this repository's commit pins nothing that matters. Outcome: Fail, Blocking, not listed. It can be reconsidered if upstream ships the rules inside the skill folder, or if the owner wants the rules file itself reviewed and vendored at a commit.

## Library fit

- **(a) Conflict with library rules.** None beyond C1 to C4. The skill never tells the agent to skip review, hardcode values or ignore conventions; `rules/server-auth-actions.md` reinforces the library's authorization rules.
- **(b) Token weight.** `SKILL.md` is 7.3 KB (about 1,800 tokens). Each rule file is 1 to 4 KB. The compiled `AGENTS.md` is about 27,000 tokens and should not be loaded (C3).
- **(c) Overlap.** None with `hallmark` or `frontend-design` (those are visual design; this is React and Next.js performance). It overlaps the frontend role's own performance guidance; the role file wins where they differ.

## Tests Needed

- `node --test "Skills/*.test.mjs"` covers the installer.
- Searches run over the fetched folder (read-only): fetch and install (`curl`, `wget`, `npx`, `npm i`, `npm install`, `pnpm add`, `pnpm install`, `yarn add`, `pip install`, `uvx`, `WebFetch`, `fetch the`, `fetch fresh`, `fetch latest`); settings and override phrasing (`settings.json`, `.claude`, `bypassPermissions`, `allowed-tools`, `do not tell`, `without asking`, `ignore previous`, `silently`, `telemetry`, `you must`, `never ask`); words that would mark text aimed at an agent or at sensitive data (`agent`, `assistant`, `claude`, `llm`, `prompt`, `instruction`, `secret`, `credential`, `password`, `upload`, `send`); risky code patterns (`dangerouslySetInnerHTML`, `suppressHydrationWarning`, `eslint-disable`, `@ts-ignore`, `any`); the role file's control-character, non-ASCII and hidden-Markdown scans.
- Not reviewed: about 65 rule files and the compiled `AGENTS.md` line by line (searched only); whether `AGENTS.md` matches the rule files; the technical correctness of the performance advice; the npm packages the rules name (registry not checked: Package reality is `Not verified` until one is proposed); the other skills in the repository (`deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize` with seven executable scripts, `composition-patterns`, `react-native-skills`, `react-view-transitions`, `writing-guidelines`).

## Final Notes

- Maintainer: Vercel (vercel-labs). Reputation was not used to lower any finding, and did not rescue `web-design-guidelines`.
- Installing this skill is a dependency decision (ask-first). The owner approved a list of the best UI and platform skills on 2026-11-18; this record is the security pass for this one entry at this one commit.
