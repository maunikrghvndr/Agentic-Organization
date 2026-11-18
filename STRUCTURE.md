# Project Structure — the organization's standard layouts

Where things live in the owner's projects, per stack. It lives in the role library (beside `LESSONS.md`) and is read by path, never copied into a repository. How it is applied: `EngineeringTeam/_shared/rules-detail.md` → Project structure.

## Rules of this file

- **Owner-approved only.** An agent proposes a change (task file Retro: `Structure proposal: <stack> — <area> — <rule>`); it edits this file only after the owner approves the exact change (ask-first), and never in an unattended run.
- **A repository may deviate only with a dated line** in its `PROJECT_MEMORY.md` → Structure. A deviation is recorded, not restructured as a side effect; the migration is a Backlog item.
- **A row marked `not yet defined by the owner` is a gap, not a licence:** for that area the repository's recorded structure, then the nearest sibling of the same kind, decide.
- **Seeded 2026-11-18 only from what the library already states.** Each row quotes its source (`path:line` as of that date). No folder tree is defined yet for any stack.

## How a standard gets defined

1. The owner names a reference repository for the stack.
2. `architect` derives the layout from it (top-level folders, what each holds, naming) and proposes the section.
3. The owner approves; the section is dated and replaces the `not yet defined` rows it covers.

## Backend

| Area | Standard | Source |
|---|---|---|
| Controllers / endpoints | "Keep controllers and endpoints thin." | `EngineeringTeam/Backend/backend-engineer.md:125` |
| Business logic | "Put business logic in services, domain services, application services, or existing orchestration layers." | `EngineeringTeam/Backend/backend-engineer.md:126` |
| Persistence | "Put persistence logic in repositories, query services, data access layers, or existing persistence seams." | `EngineeringTeam/Backend/backend-engineer.md:127` |
| External calls | "Put external API calls behind clients, adapters, gateways, or existing integration boundaries." | `EngineeringTeam/Backend/backend-engineer.md:128` |
| Constants | "place it in the project’s existing constants location, such as `Constants.cs`, following the project’s existing structure" | `EngineeringTeam/Backend/backend-engineer.md:1069` |
| Log message templates | "Place reusable or operationally important log message templates in the project’s existing constants location, such as `Constants.cs`." | `EngineeringTeam/Backend/backend-engineer.md:722` |
| Configuration | "place it in configuration such as `appsettings.json`, environment variables, secret store, or a strongly typed options class" | `EngineeringTeam/Backend/backend-engineer.md:1070` |
| Solution / project layout, folder names per layer | not yet defined by the owner | — |
| Validators, DTOs / contracts, domain entities — folder | not yet defined by the owner | — |
| Migrations — folder | not yet defined by the owner | — |
| Tests — project / folder, naming | not yet defined by the owner | — |
| File and namespace naming | not yet defined by the owner | — |

## Frontend

| Area | Standard | Source |
|---|---|---|
| Pages / routes | "Keep pages and route components focused on composition and orchestration." | `EngineeringTeam/Frontend/frontend-engineer.md:137` |
| Shared components | "Put reusable UI into shared components where the project already has that pattern." | `EngineeringTeam/Frontend/frontend-engineer.md:138` |
| Hooks | "Put reusable client behavior into hooks where the project already has that pattern." | `EngineeringTeam/Frontend/frontend-engineer.md:139` |
| API clients | "Put API integration behind existing API clients, services, generated clients, or data-fetching layers." | `EngineeringTeam/Frontend/frontend-engineer.md:140` |
| Constants | "Put constants in existing constants files." — "such as `constants.ts`, `Constants.ts`, `appConstants.ts`, or equivalent"; shape: one `FrontendConstants` object grouping `ErrorMessages`, `LogMessages` | `EngineeringTeam/Frontend/frontend-engineer.md:143`, `:557`, `:583` |
| Route constants | "Use existing route constants or route builders when available." | `EngineeringTeam/Frontend/frontend-engineer.md:526` |
| Design tokens | "Put theme values in existing design tokens or theme files." | `EngineeringTeam/Frontend/frontend-engineer.md:144` |
| Localization | "Put localization text in existing localization/i18n files when the project supports localization." | `EngineeringTeam/Frontend/frontend-engineer.md:145` |
| Configuration | "place it in configuration or environment-backed settings" | `EngineeringTeam/Frontend/frontend-engineer.md:560` |
| Folder tree (feature-based or type-based), folder names | not yet defined by the owner | — |
| Tests — location (beside the file or a test folder), naming | not yet defined by the owner | — |
| File and component naming | not yet defined by the owner | — |

## DevOps / infrastructure

| Area | Standard | Source |
|---|---|---|
| IaC modules | "Follow the existing module/resource layout and naming/tagging conventions." | `EngineeringTeam/DevOps/devops-engineer.md:123` |
| Pipelines, Dockerfiles, scripts, environment files — location | not yet defined by the owner | — |

## Data

| Area | Standard | Source |
|---|---|---|
| Layering | "naming and layering conventions (raw/staging/marts)" — named as a pattern to identify, not as a required tree | `EngineeringTeam/Data/data-engineer.md:42` |
| Pipeline, transformation, quality-check and notebook folders | not yet defined by the owner | — |

## ML

| Area | Standard | Source |
|---|---|---|
| Feature code | "Share code or a feature definition — do not reimplement transforms twice and let them drift." | `EngineeringTeam/ML/ml-engineer.md:60` |
| Training, serving, model-artifact and evaluation folders | not yet defined by the owner | — |

## AI

| Area | Standard | Source |
|---|---|---|
| Prompts | "Keep prompts in the project's managed prompt location with versioning" | `EngineeringTeam/AI/prompt-engineer.md:51` |
| Prompt location itself, eval sets, agent / tool definitions, retrieval code — folders | not yet defined by the owner | — |

## Cross-stack

| Area | Standard | Source |
|---|---|---|
| Stable internal values | "the project's constants structure (`Constants.cs` / `constants.ts`)" | `AGENTS.md` → Universal Rules, No hardcoding |
| Repository root layout (source, tests, docs, infra, scripts) | not yet defined by the owner | — |
| Shared-library repository / package layout | not yet defined by the owner | — |
