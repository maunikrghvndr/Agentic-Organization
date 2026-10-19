# Lint-RepoMemory.ps1
#
# Static checks for a repository's .ai-memory/ folder (the repo memory AGENTS.md defines).
# Optional, like Graphify: run it at the completion sweep and paste its summary as an Evidence row.
#   .\Scripts\Lint-RepoMemory.ps1 -RepoRoot <path to a repo that has .ai-memory/>
#   .\Scripts\Lint-RepoMemory.ps1 -RepoRoot <path> -Archived   # also check archived task files are closed
#
# Errors (exit 1):
#   R1  a wiki page with no index line in PROJECT_MEMORY.md, or more than one; an index line whose page is missing
#   R2  a link to TASKS/... or wiki/... in ROADMAP.md or a task file that does not resolve
#   R3  a Done item whose task file is not under TASKS/_archive/, or an In Progress / In Review / Blocked
#       item whose task file is under TASKS/_archive/
#   R4  both .ai-memory/CONSTITUTION.md and .specify/memory/constitution.md exist
#   R5  a wiki file and directory with the same stem
#   R6  hidden characters (same pattern as Lint-Library E6) in any .ai-memory markdown file
#   R7  the newest open task file lacks "## Summary", an "## Evidence" row of the required shape
#       (or a "Not run:" line), or a "## Handoff" with a "Next role:" value
#   R8  a Plan phase line ("- [ ] T01 ..." / "- [x] T01 ...") without an "Owns:" field
#   R9  a spec "AC-n" line without SHALL
#   R10 with -Archived: an archived task file with an unticked phase or a non-empty "Remaining:"
# Warnings (exit 0):
#   RW1 PROJECT_MEMORY.md over 100 lines with no wiki/ index lines
#   RW2 a spec page over ~120 lines
#   RW3 always-on weight table (bytes / 4 ~ tokens) per memory file; 10% of the context budget is a soft guideline
#
# Zero runtime tokens. PowerShell 5.1+ / 7+.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RepoRoot,
    [switch]$Archived
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path $RepoRoot).Path
$mem = Join-Path $RepoRoot ".ai-memory"
if (-not (Test-Path $mem)) { Write-Host "No .ai-memory/ under $RepoRoot - nothing to lint."; exit 0 }

$errors   = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
function Read-Utf8([string]$Path) { [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8) }
function Rel([string]$Path) { $Path.Substring($RepoRoot.Length).TrimStart('\', '/') -replace '\\', '/' }

$pmPath   = Join-Path $mem "PROJECT_MEMORY.md"
$roadPath = Join-Path $mem "ROADMAP.md"
$wikiDir  = Join-Path $mem "wiki"
$tasksDir = Join-Path $mem "TASKS"
$archDir  = Join-Path $tasksDir "_archive"
$pm   = if (Test-Path $pmPath)   { Read-Utf8 $pmPath }   else { "" }
$road = if (Test-Path $roadPath) { Read-Utf8 $roadPath } else { "" }
$allMd = @(Get-ChildItem $mem -Recurse -Filter "*.md" -File)

# ---- R1: wiki index contract -----------------------------------------------------------------
if (Test-Path $wikiDir) {
    foreach ($page in Get-ChildItem $wikiDir -Filter "*.md" -File) {
        $hits = ([regex]::Matches($pm, [regex]::Escape("wiki/$($page.Name)"))).Count
        if ($hits -eq 0) { $errors.Add("R1 wiki/$($page.Name) has no index line in PROJECT_MEMORY.md (unreachable)") }
        elseif ($hits -gt 1) { $errors.Add("R1 wiki/$($page.Name) is indexed $hits times in PROJECT_MEMORY.md (one line per page)") }
    }
}
foreach ($m in [regex]::Matches($pm, 'wiki/([A-Za-z0-9_.-]+\.md)')) {
    if (-not (Test-Path (Join-Path $wikiDir $m.Groups[1].Value))) { $errors.Add("R1 PROJECT_MEMORY.md indexes wiki/$($m.Groups[1].Value) but the page is missing") }
}

# ---- R2: links resolve --------------------------------------------------------------------------
$linkSources = @()
if (Test-Path $roadPath) { $linkSources += Get-Item $roadPath }
if (Test-Path $tasksDir) { $linkSources += Get-ChildItem $tasksDir -Filter "*.md" -File }
foreach ($f in $linkSources) {
    foreach ($m in [regex]::Matches((Read-Utf8 $f.FullName), '`?((?:TASKS|wiki)/[A-Za-z0-9_./-]+\.md)`?')) {
        $target = Join-Path $mem ($m.Groups[1].Value -replace '/', [IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path $target)) { $errors.Add("R2 $(Rel $f.FullName): link $($m.Groups[1].Value) does not resolve") }
    }
}

# ---- R3: roadmap group vs archive location ---------------------------------------------------------
if ($road) {
    $group = ""
    foreach ($line in ($road -split "`n")) {
        if ($line -match '^## (.+)$') { $group = $Matches[1].Trim(); continue }
        foreach ($m in [regex]::Matches($line, 'TASKS/((?:_archive/)?[A-Za-z0-9_.-]+\.md)')) {
            $isArchived = $m.Groups[1].Value.StartsWith("_archive/")
            if ($group -eq "Done" -and -not $isArchived) { $errors.Add("R3 ROADMAP Done item links TASKS/$($m.Groups[1].Value) - a Done task file lives under TASKS/_archive/") }
            if (($group -in @("In Progress", "In Review", "Blocked")) -and $isArchived) { $errors.Add("R3 ROADMAP '$group' item links an archived task file TASKS/$($m.Groups[1].Value)") }
        }
    }
}

# ---- R4: one constitution --------------------------------------------------------------------------
if ((Test-Path (Join-Path $mem "CONSTITUTION.md")) -and (Test-Path (Join-Path $RepoRoot ".specify\memory\constitution.md"))) {
    $errors.Add("R4 both .ai-memory/CONSTITUTION.md and .specify/memory/constitution.md exist - keep one")
}

# ---- R5: stem collisions in wiki -------------------------------------------------------------------
if (Test-Path $wikiDir) {
    $stems = @{}
    foreach ($e in Get-ChildItem $wikiDir) {
        $stem = if ($e.PSIsContainer) { $e.Name } else { [IO.Path]::GetFileNameWithoutExtension($e.Name) }
        if ($stems.ContainsKey($stem)) { $errors.Add("R5 wiki/ has both a file and a directory named '$stem'") } else { $stems[$stem] = $true }
    }
}

# ---- R6: hidden characters ------------------------------------------------------------------------
$hiddenPattern = [regex]'[\u00AD\u034F\u061C\u115F\u1160\u180E\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\u2066-\u2069\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF9-\uFFFB]|\uDB40[\uDC00-\uDC7F]|\uDB40[\uDD00-\uDDEF]'
foreach ($f in $allMd) {
    $n = 0
    foreach ($line in ((Read-Utf8 $f.FullName) -split "`n")) {
        $n++
        $m = $hiddenPattern.Match($line)
        if ($m.Success) { $errors.Add("R6 $(Rel $f.FullName):${n}: hidden character U+$([Convert]::ToInt32($m.Value[0]).ToString('X4'))") }
    }
}

# ---- R7 / R8: newest open task file -----------------------------------------------------------------
$openTasks = @()
if (Test-Path $tasksDir) { $openTasks = @(Get-ChildItem $tasksDir -Filter "*.md" -File | Sort-Object LastWriteTime -Descending) }
if ($openTasks.Count -gt 0) {
    $newest = $openTasks[0]; $text = Read-Utf8 $newest.FullName; $rel = Rel $newest.FullName
    if ($text -notmatch '(?m)^## Summary') { $errors.Add("R7 ${rel}: no '## Summary' section") }
    $evidenceRow = [regex]'(?m)^- `[^`]+`\s*\|[^|]*\|\s*\d+\s*\|'
    if (-not ($evidenceRow.IsMatch($text) -or $text -match '(?m)^- Not run:')) { $errors.Add("R7 ${rel}: no Evidence row of the shape '- `<command>` | scope | <exit code> | ...' and no 'Not run:' line") }
    if ($text -notmatch '(?m)^## Handoff') { $errors.Add("R7 ${rel}: no '## Handoff' section") }
    elseif ($text -notmatch '(?m)^- Next role:\s*\S') { $errors.Add("R7 ${rel}: Handoff has no 'Next role:' value") }
}
foreach ($f in $openTasks) {
    $n = 0
    foreach ($line in ((Read-Utf8 $f.FullName) -split "`n")) {
        $n++
        if ($line -match '^\s*- \[[ xX]\] T\d{2}' -and $line -notmatch 'Owns:') { $errors.Add("R8 $(Rel $f.FullName):${n}: phase line without 'Owns:'") }
    }
}

# ---- R9: spec AC lines are EARS -----------------------------------------------------------------------
$specFiles = @()
if (Test-Path $wikiDir) { $specFiles += Get-ChildItem $wikiDir -Filter "spec-*.md" -File }
$specsDir = Join-Path $RepoRoot "specs"
if (Test-Path $specsDir) { $specFiles += Get-ChildItem $specsDir -Recurse -Filter "spec.md" -File }
foreach ($f in $specFiles) {
    $n = 0; $lines = (Read-Utf8 $f.FullName) -split "`n"
    foreach ($line in $lines) {
        $n++
        if ($line -match '^\s*- `AC-\d+`' -and $line -notmatch '\bSHALL\b') { $errors.Add("R9 $(Rel $f.FullName):${n}: AC line without SHALL (not EARS)") }
    }
    if ($lines.Count -gt 120) { $warnings.Add("RW2 $(Rel $f.FullName) is $($lines.Count) lines (> ~120; split the feature?)") }
}

# ---- R10: archived task files are closed ---------------------------------------------------------------
if ($Archived -and (Test-Path $archDir)) {
    foreach ($f in Get-ChildItem $archDir -Filter "*.md" -File) {
        $text = Read-Utf8 $f.FullName; $rel = Rel $f.FullName
        if ($text -match '(?m)^\s*- \[ \] T\d{2}') { $errors.Add("R10 ${rel}: archived task file has an unticked phase") }
        if ($text -match '(?m)^- Remaining:\s*\S') { $errors.Add("R10 ${rel}: archived task file has a non-empty 'Remaining:'") }
    }
}

# ---- RW1 / RW3: size signals ---------------------------------------------------------------------------
if ($pm) {
    $pmLines = ($pm -split "`n").Count
    if ($pmLines -gt 100 -and $pm -notmatch 'wiki/') { $warnings.Add("RW1 PROJECT_MEMORY.md is $pmLines lines with no wiki/ index - split into wiki/ pages (grow by reorganizing)") }
}
$weight = @()
foreach ($f in $allMd) {
    if ((Rel $f.FullName) -match '/_archive/') { continue }
    $weight += [pscustomobject]@{ File = (Rel $f.FullName); Bytes = $f.Length; ApproxTokens = [math]::Round($f.Length / 4) }
}

# ---- report ----------------------------------------------------------------------------------------------
Write-Host ""
Write-Host "=== Repo memory lint ($RepoRoot) ==="
Write-Host "Files: $($allMd.Count) markdown under .ai-memory/; open task files: $($openTasks.Count)"
if ($errors.Count -gt 0)   { Write-Host ""; Write-Host "Errors ($($errors.Count)):" -ForegroundColor Red;      $errors   | ForEach-Object { Write-Host "  $_" } }
if ($warnings.Count -gt 0) { Write-Host ""; Write-Host "Warnings ($($warnings.Count)):" -ForegroundColor Yellow; $warnings | ForEach-Object { Write-Host "  $_" } }
Write-Host ""
Write-Host "RW3 always-on weight (bytes / 4 ~ tokens; ~10% of the context budget is a soft guideline, size is a signal only):"
$weight | Sort-Object Bytes -Descending | Select-Object -First 12 | ForEach-Object { Write-Host ("  {0,8} B  ~{1,6} tok  {2}" -f $_.Bytes, $_.ApproxTokens, $_.File) }
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) { Write-Host ""; Write-Host "Clean." -ForegroundColor Green }
Write-Host ""
if ($errors.Count -gt 0) { exit 1 }
exit 0
