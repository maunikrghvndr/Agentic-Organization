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
#   .\Sync-AgentsMd.ps1 -WithRules                   # also copy Rules/*.md verbatim into <repo>\.claude\rules\
#   .\Sync-AgentsMd.ps1 -WithCloudHook               # also register Hooks/session-start-library.mjs in <repo>\.claude\settings.json
#
# Notes:
# - -WithRules and -WithCloudHook are optional overlays (off by default); AGENTS.md is the
#   complete contract without them. Rules are copied byte-for-byte and skipped when they
#   already match. -WithCloudHook copies the hook to <repo>\.claude\hooks\ (cloud sessions
#   clone only the repo, so the hook must live there) and writes .claude\settings.json
#   holding only that SessionStart registration; when a .claude\settings.json already
#   exists it is never merged - the snippet is printed for a manual merge instead.
#   The target repo must commit .claude\ (rules\, hooks\, settings.json) for cloud
#   sessions to see any of it; a repo that gitignores .claude\ gets no overlay there.
# - Overwrites customized AGENTS.md files in target repos. By design, this
#   library treats AGENTS.md as a single source of truth per Maunik's
#   workflow; per-repo customization is not supported here.
# - Only descends one level under RepoRoot (standard "repos folder" layout).
# - -WithCloudHook commits an executable hook into each target repo's .claude/: it runs for
#   every developer and every -p/cloud session after one trust dialog. Protect .claude/** with
#   CODEOWNERS/branch protection and review every change to it as code.
# - Warns (never blocks) when the source is over 32,768 bytes - Codex's default
#   project_doc_max_bytes - naming the sections past the cap, and per target repo
#   when a CLAUDE.md / .claude/CLAUDE.md / CLAUDE.local.md exists there, because
#   Claude Code then ignores AGENTS.md unless the user-level
#   claude-md-and-agents-md setting is on.

[CmdletBinding()]
param(
    [string]$RepoRoot = "$env:USERPROFILE\source\repos",
    [string]$Source   = (Join-Path $PSScriptRoot "..\AGENTS.md"),
    [switch]$DryRun,
    [switch]$WithRules,
    [switch]$WithCloudHook
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

function Get-Sha256([byte[]]$Bytes) {
    [BitConverter]::ToString((New-Object Security.Cryptography.SHA256Managed).ComputeHash($Bytes)).Replace("-","")
}

# Writes $Bytes to $Target unless it already holds them; returns created / updated / unchanged.
function Sync-File([string]$Target, [byte[]]$Bytes, [string]$Hash) {
    if (Test-Path $Target) {
        if ((Get-Sha256 ([IO.File]::ReadAllBytes($Target))) -eq $Hash) { return "unchanged" }
        if (-not $DryRun) { [IO.File]::WriteAllBytes($Target, $Bytes) }
        return "updated"
    }
    if (-not $DryRun) {
        $dir = Split-Path $Target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
        [IO.File]::WriteAllBytes($Target, $Bytes)
    }
    return "created"
}

# Optional overlays, read once. Rules/*.md are copied verbatim; the cloud hook is copied
# into the repo and registered in .claude\settings.json (shell form, quoted placeholder,
# per https://code.claude.com/docs/en/hooks as of 2026-10-19).
$rules = @()
if ($WithRules) {
    $rulesDir = Join-Path $PSScriptRoot "..\Rules"
    if (-not (Test-Path $rulesDir)) { throw "Rules folder not found: $rulesDir" }
    $rules = @(Get-ChildItem $rulesDir -Filter "*.md" -File | ForEach-Object {
        $bytes = [IO.File]::ReadAllBytes($_.FullName)
        [pscustomobject]@{ Name = $_.Name; Bytes = $bytes; Hash = (Get-Sha256 $bytes) }
    })
    if ($rules.Count -eq 0) { throw "No *.md rules found in: $rulesDir" }
}
$hookBytes = $null
if ($WithCloudHook) {
    $hookSource = Join-Path $PSScriptRoot "..\Hooks\session-start-library.mjs"
    if (-not (Test-Path $hookSource)) { throw "Cloud hook not found: $hookSource" }
    $hookBytes = [IO.File]::ReadAllBytes($hookSource)
    $hookHash  = Get-Sha256 $hookBytes
    $HookRelPath = '.claude/hooks/session-start-library.mjs'
    $hookSettingsJson = @'
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/session-start-library.mjs\"",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
'@ -replace "`r`n", "`n"
    $hookSettingsBytes = [Text.Encoding]::UTF8.GetBytes($hookSettingsJson + "`n")
}

$repos = Get-ChildItem $RepoRoot -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName ".git")) -and
    ($LibraryRoot -eq $null -or $_.FullName -ne $LibraryRoot)
}

$created   = New-Object System.Collections.Generic.List[string]
$updated   = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]
$shadowed  = New-Object System.Collections.Generic.List[string]
$ClaudeShadowFiles = @('CLAUDE.md', 'CLAUDE.local.md', (Join-Path '.claude' 'CLAUDE.md'))
$rulesCreated   = New-Object System.Collections.Generic.List[string]
$rulesUpdated   = New-Object System.Collections.Generic.List[string]
$rulesUnchanged = New-Object System.Collections.Generic.List[string]
$hookFileChanged = New-Object System.Collections.Generic.List[string]
$hookWritten     = New-Object System.Collections.Generic.List[string]
$hookRegistered  = New-Object System.Collections.Generic.List[string]
$hookManual      = New-Object System.Collections.Generic.List[string]

foreach ($repo in $repos) {
    $target = Join-Path $repo.FullName "AGENTS.md"

    $present = @($ClaudeShadowFiles | Where-Object { Test-Path (Join-Path $repo.FullName $_) })
    if ($present.Count -gt 0) { $shadowed.Add("$($repo.Name): $($present -join ', ')") }

    foreach ($rule in $rules) {
        $ruleTarget = Join-Path $repo.FullName (Join-Path '.claude' (Join-Path 'rules' $rule.Name))
        switch (Sync-File $ruleTarget $rule.Bytes $rule.Hash) {
            "created"   { $rulesCreated.Add("$($repo.Name)/$($rule.Name)") }
            "updated"   { $rulesUpdated.Add("$($repo.Name)/$($rule.Name)") }
            "unchanged" { $rulesUnchanged.Add("$($repo.Name)/$($rule.Name)") }
        }
    }

    if ($WithCloudHook) {
        $hookTarget = Join-Path $repo.FullName (Join-Path '.claude' (Join-Path 'hooks' 'session-start-library.mjs'))
        $hookState  = Sync-File $hookTarget $hookBytes $hookHash
        if ($hookState -ne "unchanged") { $hookFileChanged.Add("$($repo.Name) ($hookState)") }
        $settingsTarget = Join-Path $repo.FullName (Join-Path '.claude' 'settings.json')
        if (Test-Path $settingsTarget) {
            $existing = [IO.File]::ReadAllText($settingsTarget, [Text.Encoding]::UTF8)
            if ($existing.Contains($HookRelPath)) { $hookRegistered.Add($repo.Name) }
            else { $hookManual.Add($repo.Name) }
        } else {
            if (-not $DryRun) { [IO.File]::WriteAllBytes($settingsTarget, $hookSettingsBytes) }
            $hookWritten.Add($repo.Name)
        }
    }

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
if ($WithRules) {
    Write-Host ""
    Write-Host "Rules overlay (.claude/rules): created $($rulesCreated.Count), updated $($rulesUpdated.Count), unchanged $($rulesUnchanged.Count)"
    $rulesCreated | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
    $rulesUpdated | ForEach-Object { Write-Host "  ~ $_" -ForegroundColor Yellow }
}
if ($WithCloudHook) {
    Write-Host ""
    Write-Host "Cloud hook: hook file created/updated $($hookFileChanged.Count); .claude/settings.json written $($hookWritten.Count), already registered $($hookRegistered.Count), manual merge $($hookManual.Count)"
    $hookFileChanged | ForEach-Object { Write-Host "  ~ $_ $HookRelPath" -ForegroundColor Yellow }
    $hookWritten | ForEach-Object { Write-Host "  + $_ .claude/settings.json" -ForegroundColor Green }
    if ($hookManual.Count -gt 0) {
        Write-Host "  ! .claude/settings.json already exists in: $($hookManual -join ', ') - not merged. Add this by hand:" -ForegroundColor Yellow
        Write-Host $hookSettingsJson
    }
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
