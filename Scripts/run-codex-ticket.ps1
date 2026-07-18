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

$ContextInstructions = @"
Use only the role instructions below.

Role file:
$RoleFileName

Read project files only if they exist:
- AGENTS.md
- .ai-memory/PROJECT_MEMORY.md only if needed
- .ai-memory/TASKS/$TicketId.md if it exists

Do not load unrelated role files.
Do not inspect the whole repo unless needed.
Start by identifying the 5-12 relevant files likely needed for this task.
Make the smallest safe change.

At the end, update .ai-memory/TASKS/$TicketId.md with:
- files inspected
- files changed
- decisions made
- tests run
- risks
- handoff summary
"@

$Prompt = @"
$RolePrompt

---

$ContextInstructions

---

Ticket:

$TicketText
"@

Push-Location $RepoPath
try {
    codex exec $Prompt
}
finally {
    Pop-Location
}
