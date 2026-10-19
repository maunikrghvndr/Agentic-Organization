# Roadmap — project progress board

The glance view of where this project stands. One line per feature or non-trivial task, grouped by status. Open this first after a context switch to see what is done, what is active, what is blocked, and what is next.

Keep it current and compact: the `planner` adds items; whoever works an item updates its status; delivery moves it to In Review; only the user's recorded acceptance moves it to Done with a date. Done is never written by the role that delivered or the reviewer that passed it; a consult-only turn writes no status; confirm the group matches reality before the phase ends. One line each — link to the spec and task file, do not restate them. Trivial changes are not tracked here (they have no task file either). Detail lives in the task file; this is only the index.

Spec Kit repos: this is the cross-feature progress view that sits *above* each feature's `tasks.md`.

## In Progress
- <feature/task> — current phase/role — `TASKS/<task>.md` · spec link — since YYYY-MM-DD

## In Review
- <item> — delivered YYYY-MM-DD; Evidence rows complete; review/QA verdict — awaiting the user's acceptance — `TASKS/<task>.md`

## Blocked
- <item> — what is blocking it, and who/what unblocks — `TASKS/<task>.md`

## Backlog
- <item> — one-line intent — spec link if one exists

## Done
(moved here only on the user's acceptance, recorded in the task file Decisions in their words)
- <item> — `TASKS/_archive/YYYY-MM-DD-<task>.md` — YYYY-MM-DD

## Notes
- Milestones, releases, or cross-cutting context worth a glance (optional).
