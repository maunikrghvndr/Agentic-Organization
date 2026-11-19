# Lessons — Tooling and agent workflow — scripts, shells, installs, renames, repo moves, document edits

Area file of the library's `LESSONS.md` (read that file first; it holds the rules, the cross-cutting lessons and the index). Lines were moved here verbatim on 2026-10-18, newest first. Same format, same rules: one checkable line with its why and date; update or merge, never near-duplicate; `REINFORCED [date]` marks a recurrence; promote into a role file when stable.

**Read by:** every role when the task touches tooling, scripts, moves/renames, lint config or tracked documents; `devops-engineer` always.

## Lessons

- A pip editable install (`pip install -e`) compiles an ABSOLUTE source path into its `__editable___*_finder.py`, so renaming or moving a project directory silently breaks `import <pkg>` in every environment that installed it — grep site-packages for the old path and plan a reinstall step into any directory rename, and never judge the move "done" on file presence alone. [2026-09-24]
- When the old name is a SUBSTRING of the new one (`Benchmark.Services` → `ClinicalSummarizer.Benchmark.Services`), a naive find/replace double-applies and yields `ClinicalSummarizer.ClinicalSummarizer.…`; mask already-correct occurrences with a sentinel first, rewrite, then unmask — and grep for the doubled prefix afterwards as the proof. [2026-09-24]
- Before rewriting any document, check it is tracked (`git ls-files <path>`) and extend it with dated notes instead of replacing it — an untracked design contract that gets overwritten survives only in a session transcript. [2026-09-11]
- When adding a second-language toolchain, explicitly exclude its virtual/vendor environment from every repository-wide linter; `.gitignore` alone does not define flat-config lint discovery. [2026-08-21]
- Never judge a long-running job by a PIPED exit code — `cmd | grep | tail` reports the LAST command's status, so a killed/timed-out producer looks like success. Use `set -o pipefail`, capture the producer's status directly, and never impose a wall-clock `timeout` on a load whose natural runtime you have not measured; the truncation is silent and partial data looks like complete data. [2026-08-21]
