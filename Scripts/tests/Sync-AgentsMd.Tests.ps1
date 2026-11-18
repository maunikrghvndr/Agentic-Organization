# Sync-AgentsMd.Tests.ps1
#
# Tests for the CLAUDE.md shadow check of Sync-AgentsMd.ps1 (plain PowerShell, no Pester, no dependency):
#   .\Scripts\tests\Sync-AgentsMd.Tests.ps1       # exit 0 = all passed, exit 1 = at least one failed
#
# Builds a throwaway tree in the temp folder, points USERPROFILE at it for the child process only, and runs the
# sync script with -DryRun. Nothing outside the temp folder is written. ASCII only. PowerShell 5.1+ / 7+.
#
#   <temp>/src/AGENTS.md                 the source
#   <temp>/home/.claude/CLAUDE.md        user-level file: must NOT be reported (it does not shadow AGENTS.md)
#   <temp>/home/repos/repo-a/.git/       one target repo
#   then, case by case: <temp>/home/CLAUDE.md, <temp>/home/repos/CLAUDE.local.md, <temp>/home/repos/.claude/CLAUDE.md

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$SyncScript = Join-Path (Split-Path $PSScriptRoot -Parent) "Sync-AgentsMd.ps1"
$HostExe    = (Get-Process -Id $PID).Path
$TempRoot   = Join-Path ([IO.Path]::GetTempPath()) ("sync-tests-" + [Guid]::NewGuid().ToString("N"))
$Utf8NoBom  = New-Object System.Text.UTF8Encoding($false)
$script:Failures = New-Object System.Collections.Generic.List[string]
$script:Passed   = 0

function Write-Fixture([string]$RelPath, [string]$Text) {
    $full = Join-Path $TempRoot ($RelPath -replace '/', [IO.Path]::DirectorySeparatorChar)
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($full, $Text, $Utf8NoBom)
    return $full
}

function Assert-True([string]$Name, [bool]$Condition, [string]$Detail) {
    if ($Condition) { $script:Passed++; Write-Host "  ok   $Name" }
    else { $script:Failures.Add($Name); Write-Host "  FAIL $Name" -ForegroundColor Red; if ($Detail) { Write-Host $Detail } }
}

$source    = Write-Fixture "src/AGENTS.md" ("# Agents`n`nUses .ai-memory.`n")
$userLevel = Write-Fixture "home/.claude/CLAUDE.md" ("# user-level`n")
New-Item -ItemType Directory -Path (Join-Path $TempRoot (Join-Path "home" (Join-Path "repos" (Join-Path "repo-a" ".git")))) -Force | Out-Null
$homeDir  = Join-Path $TempRoot "home"
$reposDir = Join-Path $homeDir "repos"
$AncestorMarker = "sits in or above the repos folder"

function Invoke-Sync {
    $savedProfile = $env:USERPROFILE
    $env:USERPROFILE = $homeDir
    try {
        return (& $HostExe -NoProfile -NonInteractive -File $SyncScript -RepoRoot $reposDir -Source $source -DryRun 2>&1 | Out-String)
    } finally { $env:USERPROFILE = $savedProfile }
}

# True when the output carries an ancestor-shadow warning line that names this path.
function Test-Reported([string]$Output, [string]$Path) {
    foreach ($line in ($Output -split "`n")) {
        if ($line.Contains($Path) -and $line.Contains($AncestorMarker)) { return $true }
    }
    return $false
}

Write-Host ""
Write-Host "=== Sync-AgentsMd.ps1 shadow check ==="

$out = Invoke-Sync
Assert-True "user-level <home>/.claude/CLAUDE.md is not reported" (-not (Test-Reported $out $userLevel)) $out
Assert-True "the run saw the target repo" ($out -match 'repo-a') $out
Assert-True "-DryRun wrote nothing into the repo" (-not (Test-Path (Join-Path $reposDir (Join-Path "repo-a" "AGENTS.md")))) ""

$inHome = Write-Fixture "home/CLAUDE.md" ("# stray`n")
$out = Invoke-Sync
Assert-True "CLAUDE.md directly in the home folder is reported" (Test-Reported $out $inHome) $out
Assert-True "user-level file still not reported beside it" (-not (Test-Reported $out $userLevel)) $out
Remove-Item $inHome -Force

$inRepos = Write-Fixture "home/repos/CLAUDE.local.md" ("# stray`n")
$out = Invoke-Sync
Assert-True "CLAUDE.local.md in the repos folder is reported" (Test-Reported $out $inRepos) $out
Remove-Item $inRepos -Force

$inReposDotClaude = Write-Fixture "home/repos/.claude/CLAUDE.md" ("# stray`n")
$out = Invoke-Sync
Assert-True ".claude/CLAUDE.md in the repos folder is reported" (Test-Reported $out $inReposDotClaude) $out
Remove-Item $inReposDotClaude -Force

$inRepo = Write-Fixture "home/repos/repo-a/CLAUDE.md" ("# repo-level`n")
$out = Invoke-Sync
Assert-True "repo-root CLAUDE.md keeps its existing per-repo warning" ($out -match 'repo-a: CLAUDE\.md') $out

Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Passed: $($script:Passed)  Failed: $($script:Failures.Count)"
if ($script:Failures.Count -gt 0) {
    $script:Failures | ForEach-Object { Write-Host "  FAIL $_" -ForegroundColor Red }
    exit 1
}
exit 0
