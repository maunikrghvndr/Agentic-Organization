# Install-Overlays.ps1
#
# Installs the optional user-level overlays of this library on the current machine.
# AGENTS.md is the complete contract without any of them; every overlay only enforces
# or scopes what AGENTS.md already says.
#
#   - Copies Agents/claude/*.md (reviewer subagent shims) into ~/.claude/agents/.
#     Idempotent: files whose bytes already match are skipped. Skips with a message
#     when the folder does not exist yet.
#   - Prints Hooks/settings.snippet.json and Settings/claude-baseline.settings.json
#     (each only when present) with the instruction to merge them into
#     ~/.claude/settings.json by hand. This script never writes that file.
#
# Usage:
#   .\Scripts\Install-Overlays.ps1            # install agents, print the snippets
#   .\Scripts\Install-Overlays.ps1 -DryRun    # preview only, write nothing
#
# Mutates: ~/.claude/agents/ only. PowerShell 5.1+ / 7+.

[CmdletBinding()]
param(
    [string]$LibraryRoot = (Join-Path $PSScriptRoot ".."),
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$LibraryRoot = (Resolve-Path $LibraryRoot).Path

$agentsSource = Join-Path $LibraryRoot (Join-Path "Agents" "claude")
$agentsTarget = Join-Path $HOME (Join-Path ".claude" "agents")
$userSettings = Join-Path $HOME (Join-Path ".claude" "settings.json")
$snippets = @(
    (Join-Path $LibraryRoot (Join-Path "Hooks" "settings.snippet.json")),
    (Join-Path $LibraryRoot (Join-Path "Settings" "claude-baseline.settings.json"))
)

function Get-Sha256([byte[]]$Bytes) {
    [BitConverter]::ToString((New-Object Security.Cryptography.SHA256Managed).ComputeHash($Bytes)).Replace("-", "")
}

$created   = New-Object System.Collections.Generic.List[string]
$updated   = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]

Write-Host ""
Write-Host "=== Overlay install ==="
Write-Host "Library : $LibraryRoot"
Write-Host "Agents  : $agentsTarget"
Write-Host ""

# ---- Subagent shims -> ~/.claude/agents/ ---------------------------------------------------
if (-not (Test-Path $agentsSource)) {
    Write-Host "Agents/claude/ not present in the library - no subagent shims to install." -ForegroundColor DarkGray
} else {
    $shims = @(Get-ChildItem $agentsSource -Filter "*.md" -File)
    if ($shims.Count -eq 0) {
        Write-Host "Agents/claude/ holds no *.md files - nothing to install." -ForegroundColor DarkGray
    }
    if ($shims.Count -gt 0 -and -not $DryRun -and -not (Test-Path $agentsTarget)) {
        New-Item -ItemType Directory -Path $agentsTarget | Out-Null
    }
    foreach ($shim in $shims) {
        $sourceBytes = [IO.File]::ReadAllBytes($shim.FullName)
        $target = Join-Path $agentsTarget $shim.Name
        if (Test-Path $target) {
            if ((Get-Sha256 ([IO.File]::ReadAllBytes($target))) -eq (Get-Sha256 $sourceBytes)) {
                $unchanged.Add($shim.Name)
                continue
            }
            $firstLine = (Get-Content $target -TotalCount 2 | Select-Object -Last 1)
            if (-not $Force -and ($firstLine -notlike '# Optional Claude Code overlay*')) {
                Write-Host "  ! $($shim.Name): an existing user agent of the same name is not a library shim - skipped (use -Force to overwrite)" -ForegroundColor Yellow
                continue
            }
            if (-not $DryRun) { [IO.File]::WriteAllBytes($target, $sourceBytes) }
            $updated.Add($shim.Name)
        } else {
            if (-not $DryRun) { [IO.File]::WriteAllBytes($target, $sourceBytes) }
            $created.Add($shim.Name)
        }
    }
    if ($created.Count -gt 0) {
        Write-Host "Created ($($created.Count)):" -ForegroundColor Green
        $created | ForEach-Object { Write-Host "  + $_" }
    }
    if ($updated.Count -gt 0) {
        Write-Host "Updated ($($updated.Count)):" -ForegroundColor Yellow
        $updated | ForEach-Object { Write-Host "  ~ $_" }
    }
    if ($unchanged.Count -gt 0) {
        Write-Host "Unchanged ($($unchanged.Count)):" -ForegroundColor DarkGray
        $unchanged | ForEach-Object { Write-Host "  = $_" }
    }
}

# ---- Settings snippets: print only, never written -----------------------------------------
foreach ($snippet in $snippets) {
    if (-not (Test-Path $snippet)) { continue }
    Write-Host ""
    Write-Host "Merge the following into $userSettings by hand (this script never writes it):" -ForegroundColor Cyan
    Write-Host "--- $snippet ---"
    Write-Host ([IO.File]::ReadAllText($snippet, [Text.Encoding]::UTF8))
}

if ($DryRun) {
    Write-Host ""
    Write-Host "(DryRun - nothing was written)" -ForegroundColor Cyan
}
