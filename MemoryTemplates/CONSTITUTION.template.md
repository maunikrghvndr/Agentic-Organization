# Project Constitution

The highest-authority, project-specific rules for this repository. Every spec, plan, design, change, and review must comply. When a task would violate the constitution, flag it and stop — do not silently violate it. A change to the constitution is deliberate and dated, never casual.

This is distinct from:
- The role library's `AGENTS.md` universal rules (cross-project engineering discipline).
- `PROJECT_MEMORY.md` (stable *facts* about the repo, not binding principles).

Spec Kit repos: this lives at `.specify/memory/constitution.md` and is owned by `/speckit.constitution`. Non–Spec Kit repos: `.ai-memory/CONSTITUTION.md`. Keep one, not both.

Compact and binding. Omit sections that do not apply. Every line is a rule someone must be able to check.

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

## Amendments
- YYYY-MM-DD — what changed and why.
