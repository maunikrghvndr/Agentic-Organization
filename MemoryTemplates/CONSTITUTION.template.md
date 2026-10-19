# Project Constitution

The highest-authority, project-specific rules for this repository. Every spec, plan, design, change, and review must comply. When a task would violate the constitution, flag it and stop — do not silently violate it. A change to the constitution is deliberate and dated, never casual.

This is distinct from:
- The role library's `AGENTS.md` universal rules (cross-project engineering discipline).
- `PROJECT_MEMORY.md` (stable *facts* about the repo, not binding principles).

Spec Kit repos: this lives at `.specify/memory/constitution.md` and is owned by `/speckit.constitution`. Non–Spec Kit repos: `.ai-memory/CONSTITUTION.md`. Keep one, not both.

Compact and binding. Omit sections that do not apply. Every line is a rule someone must be able to check — write each as `- <rule> — Why: <one line> — Enforced by: <analyzer / lint / CI script / ratchet baseline that may only shrink / review check / prose-only>`. Prose-only is a review item, not a gate. Never dilute or reword a principle to pass a check: a change is a dated amendment the user approves.

## Non-Negotiables
- Rules that must never be broken (e.g. "no PII in logs", "all money math in decimal", "auth enforced server-side").

## Architecture Principles
- Binding structural rules for this system (layering, boundaries, allowed/forbidden patterns, dependency direction).

## Quality Bars
- Test coverage/expectations, review gates, definition of done, performance/latency budgets that gate release.

## Security & Compliance
- Data classification and handling (PII/PHI/financial), authz model, secret handling, regulatory constraints (HIPAA, SOC2, etc.).

## Technology Constraints
- Approved languages/frameworks/stores/versions; what may not be introduced without approval.

## Delivery Rules
- Branching, PR, release, and deployment rules that are binding for agents and humans alike.
- Delivery default: `branch + PR` / `direct commit` / `uncommitted diff` — in every case the agent never pushes, merges or opens a PR without the user's go-ahead.
- Spec persistence: `living spec` (default — the spec is amended as the feature evolves; nothing reconciles spec/design/plan automatically: QA appends convergence rows, analyst amends criteria, planner re-syncs) or `flow-forward` per area.
- Optional complexity ratchet: `<metric> (e.g. cyclomatic complexity, file length, nesting) — baseline <value> — may only shrink — waiver: <syntax, who approves>`.

## Rules By Artifact (optional)
- spec: <rules the analyst must obey when writing specs for this project>
- plan/design: <rules the architect must obey>
- tasks: <rules the planner must obey>

## Amendments
- YYYY-MM-DD — vX.Y.Z — what changed and why (MAJOR: a principle removed or redefined; MINOR: a principle added; PATCH: wording).

**Version** X.Y.Z | **Ratified** YYYY-MM-DD | **Last Amended** YYYY-MM-DD
