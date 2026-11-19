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

## Owner requirements added 2026-11-18 (Maunik) — apply when turning the report into changes

- **Extend, never replace.** The coding-style rules already in `AGENTS.md` and the role files (explicit types, structured logging, no hardcoding, etc.) stay as they are. Any adopted mechanism is added alongside them; a proposal that rewrites or drops an existing style rule is rejected.
- **External skills for UI and platforms.** Wanted: a way to plug in the best third-party skills next to the library's own roles — named examples: "hallmark" (UI; exact repo to be confirmed) and Cloudflare. Shape to evaluate after the report: an optional overlay (Decision A) — a curated, pinned skills manifest plus an installer script, each skill reviewed as a dependency (ask-first, security pass, pinned commit), with `frontend-engineer` pointing to installed UI skills when present. The prose library must still work with none installed.
- Follow-up research item: catalogue the best current skills per area (UI/design, Cloudflare, cloud, testing, data), with source, maintainer, pin and risk notes.
- **Installer behaviour (Maunik, 2026-11-18):** the installer installs **every** skill on the curated list that is not already present — no per-skill picking. It is idempotent (present and at the pinned version = skip), so re-running it brings any machine up to the full list. Review happens when a skill is added to the list, not at install time.
- **Whole-application security audit (Maunik, 2026-11-18):** when a whole application is finished, a full security audit must be triggered as a step of the flow, using Cloudflare's `security-audit-skill` (cloudflare/security-audit-skill, MIT, read at `c1c8a8c`). Not in the sweep's adopt list (the sweep borrowed its rules and advised against installing). Design constraints found by the sweep: no upstream tags (pin to a commit); installs via a third-party CLI not yet reviewed; its validators refuse to run on native Windows (needs WSL2 or a devcontainer); a full run is many sub-agents with no published cost. Proposed shape, pending approval: a release-level trigger owned by `security-engineer`, the skill as an optional pinned overlay on the skills list, and a prose whole-codebase audit procedure as the fallback so the flow works on every host.
