# Engineering Lessons — self-learning, cross-project

This is the library's self-improving loop. Every agent, in every repo, reads these takeaways and applies them. When an agent learns a durable, generalizable lesson from real work, it adds one here — so the whole system gets wiser everywhere at once, not one repo at a time.

This file lives in the **role library** (beside `EngineeringTeam/`), read from the library by path like the role files — it is **not** per-repo. Do not put a copy in any repo's `.ai-memory/`.

## What belongs here

- **General, transferable takeaways** that apply across projects — e.g. "never ship mock data in production code paths." One-line, checkable, reusable.
- A hard reinforcement of a principle that keeps getting violated in practice.

## What does NOT belong here

- **Repo-specific facts** (build commands, this project's patterns, a particular gotcha) → those go in that repo's `.ai-memory/` (`PROJECT_MEMORY.md` / `wiki/`), never here.
- **Restatements of rules already in `AGENTS.md` or a role file** → don't duplicate. Capture what experience taught that isn't already written down.

## Rules for this file

- One line per lesson, phrased as a checkable takeaway with a one-line why and a date.
- Update or merge existing lessons; never add a near-duplicate.
- When a lesson becomes stable and clearly universal, **promote it into the relevant role file** (where it will be enforced) and remove it here — this file is the on-ramp, the roles are the destination.
- Keep it short. If it grows large, group by area (backend / frontend / data-ml-ai / process) with a one-line index at the top.

Format: `- <takeaway> — <why, one line>. [YYYY-MM-DD]`

## Lessons

- Never use mock, fake, or placeholder data in production code paths — it ships silently and corrupts real behavior; gate it behind tests/fixtures only. [2026-07-30]
- Research before building: do not hand-roll a solved problem (retries, parsing, validation, crypto, dates, HTTP, caching) when a mature, well-maintained library exists — custom versions are buggier, less secure, and unmaintained. Evaluate the dependency (maintenance/security/license/weight) and ask before adding, but reinventing is a defect. [2026-07-30]
- SDK "smart enum" types (a struct/class exposing static members, e.g. Google.GenAI's `Type.Object`) are not C# enums — you cannot `switch` on them or use them as `case`/const labels; map via equality or `ToString()`. Verify whether an SDK "enum" is a real enum before writing a switch. [2026-07-30]
- Bulk DB loaders MUST set a generous per-command timeout — DB driver defaults are short (Npgsql = 30s) and silently kill long single statements like CREATE INDEX/COPY/ANALYZE on large tables, failing mid-load after the data streamed in. Set it on the connection string (covers COPY, DDL, counts), not per-command. [2026-08-01]
- Console/CLI apps must root configuration at the binary dir (`ContentRootPath = AppContext.BaseDirectory`), not the default current-directory — else `appsettings.json` silently fails to load when run from another cwd, and config (connection strings, keys) comes back empty. [2026-08-01]
- Before "freeing space" by deleting a downloaded artifact mid-workflow, check the tool re-fetches it — a resumable loader re-downloads a deleted zip on its next run, wasting the bandwidth you tried to save. Delete derived staging only after the consuming step is done. [2026-08-01]
