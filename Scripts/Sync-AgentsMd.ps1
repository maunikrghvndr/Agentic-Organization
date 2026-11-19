# Sync-AgentsMd.ps1
#
# Copies (or refreshes) AGENTS.md from this library into every git repo under
# a parent folder. Idempotent -repos whose AGENTS.md already matches source
# are skipped. The library repo itself is skipped so its master AGENTS.md
# is never overwritten by a copy of itself.
#
# Usage:
#   .\Sync-AgentsMd.ps1                              # default: sync into every git repo in <home>/source/repos
#   .\Sync-AgentsMd.ps1 -DryRun                      # preview only, write nothing
#   .\Sync-AgentsMd.ps1 -RepoRoot D:\work            # different parent folder
#   .\Sync-AgentsMd.ps1 -Source <path or URL>        # override source AGENTS.md
#
# Notes:
# - Overwrites customized AGENTS.md files in target repos. By design, this
#   library treats AGENTS.md as a single source of truth per Maunik's
#   workflow; per-repo customization is not supported here.
# - Only descends one level under RepoRoot (standard "repos folder" layout).
# - Warns (never blocks) when the source is over 32,768 bytes - the library's own size
#   limit for AGENTS.md - naming the sections past the limit.

[CmdletBinding()]
param(
    [string]$RepoRoot = (Join-Path ([Environment]::GetFolderPath('UserProfile')) (Join-Path 'source' 'repos')),
    [string]$Source   = (Join-Path (Split-Path $PSScriptRoot -Parent) 'AGENTS.md'),
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Resolve source: an https URL is allowed as an alternative to a local path (never plain http:
# the fetched bytes become the instruction file of every repository).
# We read bytes (not text) so we never add a BOM, and never convert line endings.
$SourceIsUrl = $Source -match '^[A-Za-z][A-Za-z0-9+.-]*://'
if ($SourceIsUrl) {
    if ($Source -notmatch '^https://') { throw "Source must be a local path or an https:// URL: $Source" }
    $response = Invoke-WebRequest -Uri $Source -UseBasicParsing -MaximumRedirection 0
    $sourceBytes = $response.RawContentStream.ToArray()
    $sourceLabel = $Source
} else {
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Source AGENTS.md not found: $Source" }
    $Source      = (Resolve-Path -LiteralPath $Source).Path
    $sourceBytes = [IO.File]::ReadAllBytes($Source)
    $sourceLabel = $Source
}
# Whatever was read must be the library's AGENTS.md, not an error page or another file.
$ExpectedFirstLine = '# Project Agent Instructions'
$sourceStart = [Text.Encoding]::UTF8.GetString($sourceBytes, 0, [Math]::Min($sourceBytes.Length, $ExpectedFirstLine.Length))
if ($sourceStart -ne $ExpectedFirstLine) { throw "Source does not start with '$ExpectedFirstLine'; nothing was written: $sourceLabel" }

# Size check against the library's own limit for AGENTS.md (32 KiB); name the sections past it.
$AgentsMaxBytes = 32768
$sourceWarnings = New-Object System.Collections.Generic.List[string]
if ($sourceBytes.Length -gt $AgentsMaxBytes) {
    $sourceText = [Text.Encoding]::UTF8.GetString($sourceBytes)
    $headText   = [Text.Encoding]::UTF8.GetString($sourceBytes, 0, $AgentsMaxBytes)
    $allHeadings = [regex]::Matches($sourceText, '(?m)^## .+$') | ForEach-Object { $_.Value }
    $keptHeadings = [regex]::Matches($headText, '(?m)^## .+$') | ForEach-Object { $_.Value }
    $pastLimit = @($allHeadings | Where-Object { $keptHeadings -notcontains $_ })
    $lastKept = if ($keptHeadings.Count -gt 0) { $keptHeadings[-1] } else { '(none)' }
    $sourceWarnings.Add("Source is $($sourceBytes.Length) bytes, over the library's $AgentsMaxBytes-byte limit. Section crossing the limit: '$lastKept'. Sections entirely past the limit: $(if ($pastLimit.Count) { $pastLimit -join ', ' } else { '(none)' }).")
}

if (-not (Test-Path -LiteralPath $RepoRoot -PathType Container)) { throw "RepoRoot not found: $RepoRoot" }
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

# Always skip the library repo itself, whatever the source is, so its master AGENTS.md is never overwritten.
$LibraryRoot = (Resolve-Path -LiteralPath (Split-Path $PSScriptRoot -Parent)).Path

# A link (symlink, junction) is never read or written through: a repository could point AGENTS.md at any file.
function Test-IsLink([string]$Path) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    return ($null -ne $item) -and (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
}
$skipped = New-Object System.Collections.Generic.List[string]

# Hash the source once so per-target comparison is cheap
$sourceHash = [BitConverter]::ToString(
    (New-Object Security.Cryptography.SHA256Managed).ComputeHash($sourceBytes)
).Replace("-","")

$repos = Get-ChildItem -LiteralPath $RepoRoot -Directory | Where-Object {
    (Test-Path -LiteralPath (Join-Path $_.FullName ".git")) -and
    ($_.FullName -ne $LibraryRoot)
}

$created   = New-Object System.Collections.Generic.List[string]
$updated   = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]
foreach ($repo in $repos) {
    $target = Join-Path $repo.FullName "AGENTS.md"

    if (Test-IsLink $repo.FullName) { $skipped.Add("$($repo.Name) (the repository folder is a link)"); continue }
    if (Test-IsLink $target) { $skipped.Add("$($repo.Name) (AGENTS.md is a link)"); continue }
    if ((Test-Path -LiteralPath $target) -and -not (Test-Path -LiteralPath $target -PathType Leaf)) { $skipped.Add("$($repo.Name) (AGENTS.md is not a file)"); continue }

    if (Test-Path -LiteralPath $target) {
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
if ($skipped.Count -gt 0) {
    Write-Host "Skipped ($($skipped.Count)):" -ForegroundColor Yellow
    $skipped | ForEach-Object { Write-Host "  ! $_" }
}
if ($sourceWarnings.Count -gt 0) {
    Write-Host ""
    Write-Host "Warnings:" -ForegroundColor Yellow
    $sourceWarnings | ForEach-Object { Write-Host "  ! $_" }
}
if ($DryRun) {
    Write-Host ""
    Write-Host "(DryRun - nothing was written)" -ForegroundColor Cyan
}
