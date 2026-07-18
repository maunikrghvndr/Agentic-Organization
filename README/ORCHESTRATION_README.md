# Agentic Organization Orchestration Files

Use these files beside your existing `EngineeringTeam` folder.

Expected structure:

```text
Agentic-Organization/
  EngineeringTeam/
    backend-engineer.md
    frontend-engineer.md
    backend-reviewer.md
    frontend-reviewer.md
    qa-engineer.md
    security-engineer.md

  Router/
    classify-ticket.md

  MemoryTemplates/
    PROJECT_MEMORY.template.md
    TASK_MEMORY.template.md
    HANDOFF.template.md

  Scripts/
    run-codex-ticket.ps1
    run-claude-ticket.ps1
```

## Per-project setup

Each project should have:

```text
project/
  AGENTS.md
  .ai-memory/
    PROJECT_MEMORY.md
    TASKS/
      <TICKET-ID>.md
```

## Main rule

Do not load all role files into one model context.

Load only:

1. The selected role file
2. The ticket
3. Project `AGENTS.md`
4. The task memory file
5. Relevant source files

## Recommended flow

```text
Jira ticket
  -> classify-ticket.md
  -> selected role file
  -> Codex / Claude / Cursor
  -> task memory update
  -> reviewer / QA / security as needed
```
