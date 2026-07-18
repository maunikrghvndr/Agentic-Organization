# Project Memory

Stable repo facts only. Compact bullets. Omit empty sections. Keep under ~100 lines — prune stale facts when updating. Never task details.

## Commands
Exact invocations with flags — agents use these verbatim, never rediscover them.
- Build:
- Test (all / single project / single test):
- Lint:
- Run:

## Overview
- Name / domain / app type / critical workflows:

## Stack
With versions — "React 18 + TypeScript 5 + Vite", not "React project".
- Backend: <language+version, framework, DB, ORM, queue, auth, logging, tests>
- Frontend: <framework+version, build, state, routing, styling/tokens, API client, auth, tests>
- Infra: <hosting, CI/CD, containers, IaC, observability>

## Structure
- Key folders (backend / frontend / infra / tests / docs / QA):

## Hard Rules
- <e.g. no `var` for class/DTO/entity/result types; no hardcoded messages; constants/config; update tracker; preserve validation/logging/telemetry/retries/idempotency/security checks>

## Established Patterns
- Backend: <controllers, services, repos, validation, error handling, logging, constants, config, tests — one line each, only the non-obvious>
- Frontend: <components, hooks, API clients, state, forms, styling, localization, auth, tests>
- QA: <test locations, script locations, report locations>
- Security: <auth mechanism, token storage, CSRF/CORS/CSP, secrets, scanning>

## Architecture Decisions
- <date> — decision — reason.

## Known Risks / Gotchas
- Risk — why it matters — how not to break it.
