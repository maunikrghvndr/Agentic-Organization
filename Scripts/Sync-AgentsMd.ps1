# Sync-AgentsMd.ps1
#
# Copies (or refreshes) AGENTS.md from this library into every git repo under
# a parent folder. Idempotent -repos whose AGENTS.md already matches source
# are skipped. The library repo itself is skipped so its master AGENTS.md
# is never overwritten by a copy of itself.
#
# Usage:
#   .\Sync-AgentsMd.ps1                              # default: sync into every git repo in C:\Users\mauni\source\repos
#   .\Sync-AgentsMd.ps1 -DryRun                      # preview only, write nothing
#   .\Sync-AgentsMd.ps1 -RepoRoot D:\work            # different parent folder
#   .\Sync-AgentsMd.ps1 -Source <path or URL>        # override source AGENTS.md
#
# Notes:
# - Overwrites customized AGENTS.md files in target repos. By design, this
#   library treats AGENTS.md as a single source of truth per Maunik's
#   workflow; per-repo customization is not supported here.
# - Only descends one level under RepoRoot (standard "repos folder" layout).

[CmdletBinding()]
param(
    [string]$RepoRoot = "$env:USERPROFILE\source\repos",
    [string]$Source   = (Join-Path $PSScriptRoot "..\AGENTS.md"),
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Resolve source: allow http(s) URL as an alternative to a local path
if ($Source -match '^https?://') {
    $sourceContent = (Invoke-WebRequest -Uri $Source -UseBasicParsing).Content
    $sourceLabel   = $Source
} else {
    if (-not (Test-Path $Source)) { throw "Source AGENTS.md not found: $Source" }
    $Source        = (Resolve-Path $Source).Path
    $sourceContent = Get-Content $Source -Raw
    $sourceLabel   = $Source
}

if (-not (Test-Path $RepoRoot)) { throw "RepoRoot not found: $RepoRoot" }
$RepoRoot = (Resolve-Path $RepoRoot).Path

# Skip the library repo itself if the source lives inside it
$LibraryRoot = $null
if (Test-Path $Source) { $LibraryRoot = Split-Path $Source -Parent | Resolve-Path | Select-Object -ExpandProperty Path }

# Hash the source once so per-target comparison is cheap
$sourceHash = [BitConverter]::ToString(
    (New-Object Security.Cryptography.SHA256Managed).ComputeHash(
        [Text.Encoding]::UTF8.GetBytes($sourceContent)
    )
).Replace("-","")

$repos = Get-ChildItem $RepoRoot -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName ".git")) -and
    ($LibraryRoot -eq $null -or $_.FullName -ne $LibraryRoot)
}

$created   = New-Object System.Collections.Generic.List[string]
$updated   = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]

foreach ($repo in $repos) {
    $target = Join-Path $repo.FullName "AGENTS.md"

    if (Test-Path $target) {
        $targetContent = Get-Content $target -Raw
        $targetHash = [BitConverter]::ToString(
            (New-Object Security.Cryptography.SHA256Managed).ComputeHash(
                [Text.Encoding]::UTF8.GetBytes($targetContent)
            )
        ).Replace("-","")

        if ($targetHash -eq $sourceHash) {
            $unchanged.Add($repo.Name)
            continue
        }
        if (-not $DryRun) {
            Set-Content -Path $target -Value $sourceContent -Encoding UTF8 -NoNewline
        }
        $updated.Add($repo.Name)
    } else {
        if (-not $DryRun) {
            Set-Content -Path $target -Value $sourceContent -Encoding UTF8 -NoNewline
        }
        $created.Add($repo.Name)
    }
}

Write-Host ""
Write-Host "=== AGENTS.md sync ==="
Write-Host "Source : $sourceLabel"
Write-Host "Root   : $RepoRoot"
Write-Host "Repos  : $($repos.Count) (skipping library repo, non-git folders)"
Write-Host ""

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
if ($DryRun) {
    Write-Host ""
    Write-Host "(DryRun - nothing was written)" -ForegroundColor Cyan
}
