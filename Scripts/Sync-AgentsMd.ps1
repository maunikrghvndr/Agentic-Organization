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
# - Warns (never blocks) when the source is over 32,768 bytes - Codex's default
#   project_doc_max_bytes - naming the sections past the cap, and per target repo
#   when a CLAUDE.md / .claude/CLAUDE.md / CLAUDE.local.md exists there, because
#   Claude Code then ignores AGENTS.md unless the user-level
#   claude-md-and-agents-md setting is on.

[CmdletBinding()]
param(
    [string]$RepoRoot = "$env:USERPROFILE\source\repos",
    [string]$Source   = (Join-Path $PSScriptRoot "..\AGENTS.md"),
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Resolve source: allow http(s) URL as an alternative to a local path.
# We read bytes (not text) so we never add a BOM, and never convert line endings.
if ($Source -match '^https?://') {
    $sourceBytes = (Invoke-WebRequest -Uri $Source -UseBasicParsing).Content
    if ($sourceBytes -is [string]) { $sourceBytes = [Text.Encoding]::UTF8.GetBytes($sourceBytes) }
    $sourceLabel = $Source
} else {
    if (-not (Test-Path $Source)) { throw "Source AGENTS.md not found: $Source" }
    $Source      = (Resolve-Path $Source).Path
    $sourceBytes = [IO.File]::ReadAllBytes($Source)
    $sourceLabel = $Source
}

# Size check against the Codex default cap (32 KiB); name what would be truncated.
$CodexCapBytes = 32768
$sourceWarnings = New-Object System.Collections.Generic.List[string]
if ($sourceBytes.Length -gt $CodexCapBytes) {
    $sourceText = [Text.Encoding]::UTF8.GetString($sourceBytes)
    $headText   = [Text.Encoding]::UTF8.GetString($sourceBytes, 0, $CodexCapBytes)
    $allHeadings = [regex]::Matches($sourceText, '(?m)^## .+$') | ForEach-Object { $_.Value }
    $keptHeadings = [regex]::Matches($headText, '(?m)^## .+$') | ForEach-Object { $_.Value }
    $pastCap = @($allHeadings | Where-Object { $keptHeadings -notcontains $_ })
    $lastKept = if ($keptHeadings.Count -gt 0) { $keptHeadings[-1] } else { '(none)' }
    $sourceWarnings.Add("Source is $($sourceBytes.Length) bytes, over Codex's default $CodexCapBytes-byte cap. Truncated mid-section: '$lastKept'. Sections entirely past the cap: $(if ($pastCap.Count) { $pastCap -join ', ' } else { '(none)' }).")
}

if (-not (Test-Path $RepoRoot)) { throw "RepoRoot not found: $RepoRoot" }
$RepoRoot = (Resolve-Path $RepoRoot).Path

# Skip the library repo itself if the source lives inside it
$LibraryRoot = $null
if (Test-Path $Source) { $LibraryRoot = Split-Path $Source -Parent | Resolve-Path | Select-Object -ExpandProperty Path }

# Hash the source once so per-target comparison is cheap
$sourceHash = [BitConverter]::ToString(
    (New-Object Security.Cryptography.SHA256Managed).ComputeHash($sourceBytes)
).Replace("-","")

$repos = Get-ChildItem $RepoRoot -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName ".git")) -and
    ($LibraryRoot -eq $null -or $_.FullName -ne $LibraryRoot)
}

$created   = New-Object System.Collections.Generic.List[string]
$updated   = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]
$shadowed  = New-Object System.Collections.Generic.List[string]
$ClaudeShadowFiles = @('CLAUDE.md', 'CLAUDE.local.md', (Join-Path '.claude' 'CLAUDE.md'))

foreach ($repo in $repos) {
    $target = Join-Path $repo.FullName "AGENTS.md"

    $present = @($ClaudeShadowFiles | Where-Object { Test-Path (Join-Path $repo.FullName $_) })
    if ($present.Count -gt 0) { $shadowed.Add("$($repo.Name): $($present -join ', ')") }

    if (Test-Path $target) {
        $targetBytes = [IO.File]::ReadAllBytes($target)
        $targetHash = [BitConverter]::ToString(
            (New-Object Security.Cryptography.SHA256Managed).ComputeHash($targetBytes)
        ).Replace("-","")

        if ($targetHash -eq $sourceHash) {
            $unchanged.Add($repo.Name)
            continue
        }
        if (-not $DryRun) {
            [IO.File]::WriteAllBytes($target, $sourceBytes)
        }
        $updated.Add($repo.Name)
    } else {
        if (-not $DryRun) {
            [IO.File]::WriteAllBytes($target, $sourceBytes)
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
if ($sourceWarnings.Count -gt 0 -or $shadowed.Count -gt 0) {
    Write-Host ""
    Write-Host "Warnings:" -ForegroundColor Yellow
    $sourceWarnings | ForEach-Object { Write-Host "  ! $_" }
    $shadowed | ForEach-Object { Write-Host "  ! $_ - Claude Code will ignore AGENTS.md here unless the user-level 'claude-md-and-agents-md' setting is on" }
}
if ($DryRun) {
    Write-Host ""
    Write-Host "(DryRun - nothing was written)" -ForegroundColor Cyan
}
