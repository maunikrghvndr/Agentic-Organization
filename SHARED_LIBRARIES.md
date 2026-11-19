# Shared Libraries — code the owner's projects share instead of rewriting

The register of shared libraries and of code seen in more than one project.
It lives in the role library (beside `LESSONS.md`), is read by path, and is never copied into a repository.

## Rules

- **Read it at the trigger only,** not on every task: when about to write something that is not specific to the product (`EngineeringTeam/_shared/rules-detail.md` → Shared code across projects).
- **The owner approves every entry** (ask-first, like lessons). An agent proposes a line in the task file Retro as `Shared-library candidate: <what> — seen in <repo:path>, <repo:path>`; an unattended run only proposes and never writes this file.
- **A listed shared library is used, never re-implemented or copied.** A Candidate is not pasted between repositories: build the local piece behind a narrow seam until it is extracted.
- **Extraction is its own ask-first task** (`architect` decides home, API and versioning; ROADMAP Backlog), never a side effect of a feature.
- **Format:** one table row per entry, dated; update a row instead of adding a near-duplicate; a declined Candidate stays, with its date, so it is not proposed again.

## Shared libraries

| Name | What it provides | Repository / package and how to consume it | Stack | Owner-approved |
|---|---|---|---|---|

- (none yet)

## Candidates (seen in more than one project)

| What | Where seen (repo:path, at least two) | Proposed home | Status (proposed / approved / extracted / declined, dated) |
|---|---|---|---|

- (none yet)

## Proposed (pending owner review)

Owner-moved only: lines arrive here from task-file Retro proposals; the owner moves an approved line into a table above. This stays the last section.

- (none yet)
