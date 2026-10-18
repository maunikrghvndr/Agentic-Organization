# Lessons — Frontend — UI, DOM, i18n, styling, client auth state

Area file of the library's `LESSONS.md` (read that file first; it holds the rules, the cross-cutting lessons and the index). Lines were moved here verbatim on 2026-10-18, newest first. Same format, same rules: one checkable line with its why and date; update or merge, never near-duplicate; `REINFORCED [date]` marks a recurrence; promote into a role file when stable.

**Read by:** `frontend-engineer`, `frontend-reviewer` (always); `qa-engineer`, `security-engineer`, `planner` when the task touches frontend code.

## Lessons

- When auditing or mass-migrating CSS typography, a `font-size:` grep silently under-reports — the `font:` shorthand (`font:600 30px var(--x)`) hides a size from it, and media-query overrides hide more. Drive the migration from COMPUTED styles in a real browser, and match the shorthand too; source-only greps leave a partial migration that still looks done. [2026-08-25]
- A text-keyed i18n dictionary (translations looked up by exact rendered string) turns every copy edit into a silent localisation regression that type-checking, linting and the build all pass — changing a label's text drops it back to the source language with no error anywhere. When editing rendered strings, grep the dictionary for the OLD string and assert the translated NEW string in a test. [2026-08-25]
- Never run a blanket regex find-and-replace over a data file (i18n dictionary, config, fixture) to clean up characters: the same characters are often the file's own STRUCTURE (quote/comma delimiters) or legitimate DATA (an encoding-repair map), so the sweep silently deletes separators and corrupts it. Operate inside parsed string literals only, and syntax-check the file immediately after. [2026-08-25]
- Assigning `element.textContent` DESTROYS the child text node and creates a new one. Any layer that keyed state to that node object (i18n originals in a WeakMap, ranges, selection, observers) silently loses it, and the damage only shows up on a later interaction such as switching language back. To animate or patch text in place, mutate `node.nodeValue` and preserve node identity. [2026-08-25]
- Treat unresolved authentication as a protected state: pause authoritative interactions and account analytics until the session check resolves — initializing UI as “guest” can let a returning signed-in user act on stale device data. [2026-08-15]
