# New-repos landscape sweep (started 2026-11-18)

Deep research on new/best repos for agentic coding organizations since 2026-04. Every stage writes one file here, commits it and pushes it, so nothing is lost if a session dies.

- `01-discover/<lens>.md` — eight finders
- `02-shortlist.md` — the 16 items chosen, plus the long tail
- `03-read/<slug>.md` — deep read of each item
- `04-gap/<slug>.md` — each mechanism checked against this library, with proposals
- `05-skeptic/<slug>.md` — independent attempt to refute each proposal
- `06-report.md` — final report: adopt / defer / reject

A file is complete only when its last line is `<!-- END-OF-FILE -->`.

## Resume (cloud or local)

1. `git pull` this branch.
2. In Claude Code, from the repo root, say: "run the workflow at `.ai-memory/TASKS/new-repos-landscape/sweep.workflow.js` with args `{"today": "<date>"}`".
3. Each agent first checks whether its file is already complete and returns at once if so; only missing stages do real work.

Without the Workflow tool: open `sweep.workflow.js`, and do the missing stages by hand in the order above using the prompts in it.

Nothing here changes the library. Proposals are applied only after Maunik approves them.
