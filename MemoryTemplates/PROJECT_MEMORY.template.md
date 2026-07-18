# Project Memory

This file stores compact, durable project context.

Keep it short. Do not turn this into a giant architecture document.

Use this file to preserve stable project facts that help agents avoid rediscovering the same patterns.

---

## Project Overview

- Project name:
- Business/domain purpose:
- Main application type:
- Primary users:
- Critical workflows:

---

## Technology Stack

### Backend

- Language/framework:
- API style:
- Database:
- ORM/data access:
- Queue/background jobs:
- Auth/authz:
- Logging/telemetry:
- Test framework:

### Frontend

- Framework:
- Build tool:
- State management:
- Routing:
- Styling/design system:
- API client pattern:
- Auth integration:
- Test framework:

### DevOps / Infrastructure

- Hosting:
- CI/CD:
- Containers:
- IaC:
- Cloud services:
- Observability:

---

## Repository Structure

```text
project-root/
  src/
  tests/
  docs/
```

Key folders:

- Backend:
- Frontend:
- Infrastructure:
- Tests:
- Documentation:
- QA scripts:

---

## Hard Project Rules

- Rule:
- Rule:
- Rule:

Examples:

- Do not use `var` for class/DTO/entity/result types.
- Do not hardcode log messages.
- Use constants/configuration.
- Update code-change tracker for non-trivial changes.
- Preserve validation/logging/telemetry/retries/idempotency/security checks.

---

## Existing Backend Patterns

- Controllers/endpoints:
- Services:
- Repositories/data access:
- DTOs/contracts:
- Validation:
- Error handling:
- Logging:
- Constants:
- Configuration:
- Tests:

---

## Existing Frontend Patterns

- Pages/routes:
- Components:
- Hooks:
- API clients:
- State:
- Forms:
- Styling/tokens:
- Localization:
- Auth:
- Tests:

---

## Existing QA Patterns

- Unit tests:
- Integration tests:
- E2E tests:
- Smoke tests:
- Regression tests:
- Security tests:
- Accessibility tests:
- QA scripts:
- Reports:

---

## Existing Security Patterns

- Authentication:
- Authorization:
- Token/session storage:
- CSRF:
- CORS:
- CSP/security headers:
- Secrets:
- Dependency scanning:
- Security tests:

---

## Important Architecture Decisions

### Decision 1

- Date:
- Decision:
- Reason:
- Consequence:

---

## Known Risks / Gotchas

- Risk:
- Why it matters:
- How to avoid breaking it:

---

## Agent Usage Notes

- Backend tasks should use:
- Frontend tasks should use:
- Review tasks should use:
- QA tasks should use:
- Security tasks should use:
