# DEPRECATED (2026-10-18) - kept for reference only; do not run.
# This runner feeds untrusted ticket text to an agent that has repo write access and the
# caller's ambient credentials, with no turn/budget/sandbox/permission flags and no trust
# dialog, and it defaults the library path to %USERPROFILE%\Downloads. It predates
# AGENTS.md routing, LESSONS.md, ROADMAP.md, the constitution and the Grill Checkpoint.
# The supported headless path is documented in README/ORCHESTRATION_README.md under
# "Headless / CI use" (claude -p --bare with explicit limits, or claude-code-action).

param(
    [Parameter(Mandatory = $true)]
    [string]$TicketId,

    [Parameter(Mandatory = $true)]
    [string]$RepoPath,

    [Parameter(Mandatory = $true)]
    [string]$RoleFileName,

    [Parameter(Mandatory = $true)]
    [string]$TicketText,

    [string]$AgentRoot = "$env:USERPROFILE\Downloads\Agentic-Organization"
)

$ErrorActionPreference = "Stop"

$RolePath = Join-Path $AgentRoot "EngineeringTeam\$RoleFileName"

if (-not (Test-Path $RolePath)) {
    throw "Role file not found: $RolePath"
}

$RolePrompt = Get-Content $RolePath -Raw

$Prompt = @"
Use only the role instructions below.

Do not load unrelated role files.
Do not inspect the whole repo unless needed.
Start by identifying the 5-12 relevant files likely needed for this task.

Read project files only if they exist:
- AGENTS.md
- .ai-memory/PROJECT_MEMORY.md only if needed
- .ai-memory/TASKS/$TicketId.md if it exists

At the end, update .ai-memory/TASKS/$TicketId.md with:
- files inspected
- files changed
- decisions made
- tests run
- risks
- handoff summary

---

Role file:
$RoleFileName

$RolePrompt

---

Ticket:

$TicketText
"@

Push-Location $RepoPath
try {
    claude -p $Prompt
}
finally {
    Pop-Location
}
