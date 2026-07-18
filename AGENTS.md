# Project Agent Instructions

This repository uses Maunik's external Agentic Organization role library.

The role files live outside this repository at:

```text
C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\
```

This repository should not contain copies of the full role files.

---

## Available Roles

Use these role names when requested or inferred:

| Role Name | External Role File |
|---|---|
| `backend-engineer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\backend-engineer.md` |
| `frontend-engineer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\frontend-engineer.md` |
| `backend-reviewer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\backend-reviewer.md` |
| `frontend-reviewer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\frontend-reviewer.md` |
| `qa-engineer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\qa-engineer.md` |
| `security-engineer` | `C:\Users\mauni\source\repos\Agentic-Organization\EngineeringTeam\security-engineer.md` |

---

## Automatic Role Routing

For every user request, infer the most appropriate primary role before doing work.

The user does not need to explicitly name the role.

Examples:

- “Fix the button color” → `frontend-engineer`
- “Add upload validation” → `backend-engineer`
- “Fix the API response shape” → `backend-engineer`
- “Update the dashboard filter UI” → `frontend-engineer`
- “Review this backend diff” → `backend-reviewer`
- “Review this UI change” → `frontend-reviewer`
- “Create QA plan” → `qa-engineer`
- “Find security vulnerabilities” → `security-engineer`
- “Check dependencies for vulnerabilities” → `security-engineer`

Use exactly one primary role unless the task clearly requires multiple phases.

Do not load all role files.

Use only the selected role’s behavior.

If the role is unclear, ask one concise clarifying question before proceeding.

---

## Role Selection Rules

Choose `backend-engineer` when the task involves:

- APIs
- Controllers
- Endpoints
- Services
- Domain logic
- Business rules
- Repositories
- Database access
- Database migrations
- Queues
- Workers
- Message handlers
- Backend validation
- Authentication or authorization logic
- Backend logging/telemetry
- Backend tests
- Server-side integrations

Choose `frontend-engineer` when the task involves:

- UI
- Components
- Pages
- Layouts
- Forms
- Client-side validation
- Routing
- Browser behavior
- State management
- Hooks
- API clients
- Styling
- Design tokens
- Accessibility
- Responsive behavior
- Frontend tests

Choose `backend-reviewer` when the task asks to review:

- Backend code
- Backend diff
- Backend PR
- Backend architecture
- Backend performance
- Backend security
- Backend tests
- Backend maintainability
- Backend correctness

Choose `frontend-reviewer` when the task asks to review:

- Frontend code
- Frontend diff
- Frontend PR
- UI changes
- Accessibility
- Responsive behavior
- State management
- API integration
- Frontend tests
- Frontend maintainability
- Frontend correctness

Choose `qa-engineer` when the task involves:

- Test plans
- Acceptance criteria
- Regression testing
- Manual QA
- QA scripts
- Automated test coverage
- Bug reproduction
- Release validation
- Edge cases
- Quality gates
- Test location planning

Choose `security-engineer` when the task involves:

- Security audit
- Vulnerability review
- OWASP review
- Dependency vulnerability scan
- Secret scan
- Authentication security
- Authorization security
- Token/session security
- Frontend security
- Backend security
- Infrastructure security
- CI/CD security
- Docker/container security

---

## Role Loading Rules

- Load only the role file explicitly requested or inferred.
- Do not load unrelated role files.
- Do not paste external role file contents into this repository.
- Do not create local duplicates of the external role files.
- Do not use reviewer, QA, or security roles unless the user asks for review, QA, testing, release-readiness, security, vulnerability review, or unless the current role completes and recommends the next phase.
- If the selected external role file cannot be read, continue with the closest matching behavior described in this `AGENTS.md`, but report that the external role file could not be loaded.

---

## Repo Memory Rules

Use repo-local memory.

If missing, create:

```text
.ai-memory/
  PROJECT_MEMORY.md
  TASKS/
```

Use `.ai-memory/PROJECT_MEMORY.md` only for stable project facts:

- Tech stack
- Repo structure
- Build/test/lint commands
- Existing backend patterns
- Existing frontend patterns
- Existing test patterns
- Existing security patterns
- Existing logging/telemetry patterns
- Existing constants/configuration patterns
- Hard project rules
- Architecture decisions

Use `.ai-memory/TASKS/` for task-specific memory.

For every non-trivial task, create or update one task memory file.

Create task file names automatically using short kebab-case names.

Examples:

```text
.ai-memory/TASKS/frontend-fix-button-color.md
.ai-memory/TASKS/backend-upload-validation.md
.ai-memory/TASKS/security-dependency-audit.md
.ai-memory/TASKS/review-backend-export-endpoint.md
.ai-memory/TASKS/qa-login-regression.md
```

Keep task memory compact.

Do not put task-specific details in `PROJECT_MEMORY.md`.

If `.ai-memory/PROJECT_MEMORY.md` does not exist, create it with compact stable facts discovered from the repository.

If `.ai-memory/TASKS/` does not exist, create it.

---

## Context Discipline

Do not inspect the whole repository unless necessary.

Before editing, identify the 5–12 files most likely relevant to the task.

Read only relevant files first.

Expand only when needed.

Reuse existing:

- Methods
- Components
- Hooks
- Services
- Repositories
- Validators
- Constants
- Configuration
- Utilities
- Tests
- Documentation patterns

Make the smallest safe change.

Do not create parallel architecture.

Do not perform unrelated refactors.

Do not rewrite large areas unless explicitly requested.

---

## Universal Engineering Rules

Preserve existing behavior unless explicitly changing it.

Do not remove or weaken:

- Validation
- Logging
- Telemetry
- Tracing
- Retries
- Idempotency
- Security checks
- Authorization checks
- Accessibility
- Tests
- Error handling
- Existing public contracts

Do not hardcode:

- Log messages
- Exception messages
- Validation messages
- UI labels
- Routes
- API paths
- Styling values when design tokens exist
- Configuration keys
- Queue names
- Provider names
- Business constants
- Magic strings
- Magic numbers

Use existing:

- Constants
- Configuration
- Options classes
- Localization/i18n
- Route builders
- Design tokens
- Shared utilities
- Existing patterns

Add or update tests for behavior changes.

Update documentation or tracker files when behavior, configuration, architecture, security, testing, or usage changes.

Do not claim tests passed if they were not run.

---

## Backend-Specific Defaults

When the selected role is `backend-engineer`:

- Keep controllers/endpoints thin.
- Put business logic in services/domain/application layers.
- Put persistence logic in repositories/data access layers.
- Use existing validation patterns.
- Use existing logging/telemetry patterns.
- Use constants/configuration instead of hardcoding.
- Avoid `var` for class instances, DTOs, entities, collections, repository results, API results, query results, tasks, commands, events, domain objects, service objects, or result wrappers when explicit type improves readability.
- Preserve API contracts unless explicitly changing them.
- Add or update backend tests.

---

## Frontend-Specific Defaults

When the selected role is `frontend-engineer`:

- Reuse existing components, hooks, API clients, styles, design tokens, route builders, localization, and utilities.
- Preserve loading, empty, error, success, unauthorized, and disabled states where applicable.
- Preserve accessibility and responsive behavior.
- Preserve frontend security behavior.
- Do not hardcode labels, styles, routes, API paths, or auth/security values.
- Use constants, design tokens, localization, and configuration where appropriate.
- Add or update frontend tests.

---

## Reviewer Defaults

When the selected role is `backend-reviewer` or `frontend-reviewer`:

- Review only.
- Do not edit files unless explicitly asked.
- Review the current diff and changed files.
- Read task memory if it exists.
- Return blocking issues first.
- Separate blocking issues from non-blocking suggestions.
- Check whether existing behavior was deleted or changed accidentally.
- Check whether the implementation satisfies the task.
- Check whether it is unnecessarily complex.
- Check whether tests are missing.
- Update task memory with review notes.

Backend reviewer must check:

- Correctness
- Deleted behavior
- Validation
- Logging cost
- Memory leaks
- Parallelism/concurrency
- Time complexity
- Space complexity
- Security
- Constants/hardcoding
- Explicit typing / `var`
- Tests

Frontend reviewer must always check:

- Security
- XSS
- Token/session leakage
- OAuth/OIDC/PKCE risk
- Open redirect / unsafe URL handling
- CSRF/CORS/CSP assumptions
- Accessibility
- State management
- API integration
- Constants/hardcoding
- Responsive behavior
- Tests

---

## QA Defaults

When the selected role is `qa-engineer`:

- Create a QA plan.
- Identify missing tests.
- Define where QA scripts should live.
- Check unit, integration, E2E, smoke, regression, security, accessibility, and performance test needs.
- Do not scatter QA scripts randomly in the project root.
- Use existing test folder conventions.
- Update task memory with QA notes.

---

## Security Defaults

When the selected role is `security-engineer`:

- Do not edit files unless explicitly asked.
- Audit security risks across the requested scope.
- Check OWASP-style vulnerabilities.
- Check dependencies and lockfiles.
- Check secrets.
- Check authentication and authorization.
- Check token/session handling.
- Check frontend security.
- Check backend security.
- Check infrastructure, Docker, CI/CD, and configuration if present and in scope.
- Return findings by severity with evidence and fix direction.
- Update task memory with security notes.

---

## Completion Rules

At the end of non-trivial work:

1. Update the task memory file under `.ai-memory/TASKS/`.
2. Update `.ai-memory/PROJECT_MEMORY.md` only if stable project facts were discovered.
3. Update documentation/tracker files if behavior, configuration, architecture, security, testing, or usage changed.
4. Summarize:
   - Inferred role
   - Task memory file created/updated
   - Files inspected
   - Files changed
   - Tests added/updated
   - Tests run
   - Documentation updated
   - Risks/assumptions
   - Recommended next step, if any

Do not claim tests passed if they were not run.

---

## First-Time Repository Setup

If this is the first time this repository is used with this workflow:

- Create `.ai-memory/PROJECT_MEMORY.md` if missing.
- Create `.ai-memory/TASKS/` if missing.
- Populate `PROJECT_MEMORY.md` with only compact stable facts discovered from the repository.
- Do not modify application code during setup unless the user task requires implementation.
- Do not paste external role files into the repository.
