# Lint-Library.ps1
#
# Static checks for the role library. Run before every library commit:
#   .\Scripts\Lint-Library.ps1            # errors exit 1, warnings exit 0
#   .\Scripts\Lint-Library.ps1 -Verbose   # also print what was scanned
#
# Errors (exit 1):
#   E1  a "`AGENTS.md` -> <Heading>" reference whose heading does not exist in AGENTS.md
#   E2  a role-like name (`<x>-engineer`, `<x>-reviewer`, `<x>-scientist`, analyst, architect,
#       planner, debugger, researcher) used in a role file that is not in the AGENTS.md role table
#   E3  README Structure block names a path that is not on disk
#   E4  relic strings: "Read the project `AGENTS.md` if it exists", "Jira", "tracker file if one exists",
#       "--update" (Graphify has an `update` subcommand, not a flag)
#   E5  a LESSONS line (LESSONS.md / LESSONS/*.md, under a "## Lessons" heading) not ending in a
#       "[YYYY-MM-DD...]" date tag
# Warnings (exit 0):
#   W1  AGENTS.md over 32,768 bytes (Codex default cap) or over 200 lines (Anthropic guidance)
#   W2  >= 8 identical consecutive lines shared by two role files (trim candidates; feeds EVALS.md)
#   W3  hardcoded `wiki/spec-` outside AGENTS.md (the branched Spec Kit / wiki phrase should be used)
#
# Zero runtime tokens: this never runs an agent. PowerShell 5.1+ / 7+.

[CmdletBinding()]
param(
    [string]$LibraryRoot = (Join-Path $PSScriptRoot "..")
)

$ErrorActionPreference = "Stop"
$LibraryRoot = (Resolve-Path $LibraryRoot).Path
$errors   = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Read-Utf8([string]$Path) { [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8) }
function Rel([string]$Path) { $Path.Substring($LibraryRoot.Length).TrimStart('\', '/') }

$agentsPath = Join-Path $LibraryRoot "AGENTS.md"
$agentsText = Read-Utf8 $agentsPath
$agentsLines = $agentsText -split "`n"

$roleFiles = Get-ChildItem (Join-Path $LibraryRoot "EngineeringTeam") -Filter "*.md" -File
$mdFiles = @(Get-ChildItem $LibraryRoot -Recurse -Filter "*.md" -File | Where-Object {
    $rel = Rel $_.FullName
    $rel -notmatch '^(_archive|\.git|graphify-out|\.ai-memory)[\\/]' -and $rel -notmatch '[\\/]_archive[\\/]'
})

# ---- E1: AGENTS.md -> <Heading> references ----------------------------------------------------
$headings = @($agentsLines | Where-Object { $_ -match '^## ' } | ForEach-Object { ($_ -replace '^## ', '').Trim() })
$refPattern = [regex]'`AGENTS\.md`\s*(?:→|->)\s*([A-Z][A-Za-z&-]*(?:\s+[A-Z&][A-Za-z&-]*)*)'   # headings are Capitalised Words
foreach ($f in $mdFiles) {
    if ($f.FullName -eq $agentsPath) { continue }
    $text = Read-Utf8 $f.FullName
    foreach ($m in $refPattern.Matches($text)) {
        $target = $m.Groups[1].Value.Trim()
        $ok = $headings | Where-Object { $_ -eq $target -or $_.StartsWith($target) }
        if (-not $ok) { $errors.Add("E1 $(Rel $f.FullName): references `AGENTS.md` -> '$target' but AGENTS.md has no such heading") }
    }
}

# ---- E2: role names not in the AGENTS.md table -----------------------------------------------
$tableRoles = @($agentsLines | Where-Object { $_ -match '^\| `([a-z-]+)` \| `[a-z-]+\.md` \|' } | ForEach-Object { $Matches[1] })
if ($tableRoles.Count -lt 20) { $errors.Add("E2 AGENTS.md role table parsed only $($tableRoles.Count) roles - table format changed?") }
$singleWordRoles = @('analyst', 'architect', 'planner', 'debugger', 'researcher')
$rolePattern = [regex]'`([a-z]+(?:-[a-z]+)*)`'
foreach ($f in $roleFiles) {
    $text = Read-Utf8 $f.FullName
    $seen = @{}
    foreach ($m in $rolePattern.Matches($text)) {
        $name = $m.Groups[1].Value
        $roleLike = ($name -match '-(engineer|reviewer|scientist)$') -or ($singleWordRoles -contains $name)
        if ($roleLike -and ($tableRoles -notcontains $name) -and -not $seen.ContainsKey($name)) {
            $seen[$name] = $true
            $errors.Add("E2 $(Rel $f.FullName): role-like name '$name' is not in the AGENTS.md role table")
        }
    }
}

# ---- E3: README Structure block vs disk --------------------------------------------------------
$readmePath = Join-Path $LibraryRoot "README\ORCHESTRATION_README.md"
$readme = Read-Utf8 $readmePath
if ($readme -match '(?s)## Structure.*?```text\s*\n(.*?)```') {
    $block = $Matches[1] -split "`n"
    $stack = @()
    foreach ($line in $block) {
        if ($line.Trim() -eq '' -or $line -match '^\S') { continue }   # root line / blanks
        $indent = ($line -replace '^(\s*).*$', '$1').Length
        $name = ($line.Trim() -split '\s{2,}')[0]
        $depth = [math]::Floor($indent / 2) - 1
        if ($depth -lt 0) { $depth = 0 }
        $stack = @($stack[0..([math]::Max($depth - 1, 0))] | Where-Object { $_ })
        if ($depth -eq 0) { $stack = @() }
        $relPath = (($stack + $name) -join '/').TrimEnd('/')
        if ($name.EndsWith('/')) { $stack = $stack + $name.TrimEnd('/') }
        $full = Join-Path $LibraryRoot ($relPath -replace '/', [IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path $full)) { $errors.Add("E3 README Structure lists '$relPath' but it is not on disk") }
    }
} else { $warnings.Add("W0 README has no '## Structure' text block to check") }

# ---- E4: relic strings --------------------------------------------------------------------------
$relics = @('Read the project `AGENTS.md` if it exists', 'Jira', 'tracker file if one exists', '--update')
foreach ($f in $mdFiles + @(Get-Item $agentsPath)) {
    $rel = Rel $f.FullName
    if ($rel -match '^(Router|Scripts)[\\/]' ) { continue }   # deprecated files keep their text
    $text = Read-Utf8 $f.FullName
    foreach ($r in $relics) {
        if ($text.Contains($r)) { $errors.Add("E4 ${rel}: relic string '$r'") }
    }
}

# ---- E5: LESSONS lines carry a date tag ---------------------------------------------------------
$lessonFiles = @(Get-Item (Join-Path $LibraryRoot "LESSONS.md")) + @(Get-ChildItem (Join-Path $LibraryRoot "LESSONS") -Filter "*.md" -File -ErrorAction SilentlyContinue)
foreach ($f in $lessonFiles) {
    $inLessons = $false; $n = 0
    foreach ($line in ((Read-Utf8 $f.FullName) -split "`n")) {
        $n++
        if ($line -match '^## Lessons') { $inLessons = $true; continue }
        if ($line -match '^## ') { $inLessons = $false; continue }
        if ($inLessons -and $line.StartsWith('- ') -and $line -notmatch '\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*$') {
            $errors.Add("E5 $(Rel $f.FullName):${n}: lesson line has no trailing [YYYY-MM-DD] tag")
        }
    }
}

# ---- W1: AGENTS.md size -------------------------------------------------------------------------
$agentsBytes = (Get-Item $agentsPath).Length
if ($agentsBytes -gt 32768) { $warnings.Add("W1 AGENTS.md is $agentsBytes bytes (> 32,768 Codex default cap)") }
if ($agentsLines.Count -gt 200) { $warnings.Add("W1 AGENTS.md is $($agentsLines.Count) lines (> 200 guidance)") }

# ---- W2: >= 8 identical consecutive lines shared by two role files --------------------------------
$window = 8
$roleLineSets = @{}
foreach ($f in $roleFiles) {
    $roleLineSets[$f.Name] = @(((Read-Utf8 $f.FullName) -split "`n") | ForEach-Object { $_.TrimEnd() })
}
$names = @($roleLineSets.Keys | Sort-Object)
for ($i = 0; $i -lt $names.Count; $i++) {
    $a = $roleLineSets[$names[$i]]
    $index = @{}
    for ($p = 0; $p -le $a.Count - $window; $p++) {
        $seg = $a[$p..($p + $window - 1)]
        if (($seg | Where-Object { $_.Length -ge 15 }).Count -lt 4) { continue }   # skip blank/bullet-only runs
        $key = $seg -join "`n"
        if (-not $index.ContainsKey($key)) { $index[$key] = $p }
    }
    for ($j = $i + 1; $j -lt $names.Count; $j++) {
        $b = $roleLineSets[$names[$j]]
        $hits = 0; $p = 0
        while ($p -le $b.Count - $window) {
            $key = ($b[$p..($p + $window - 1)]) -join "`n"
            if ($index.ContainsKey($key)) { $hits++; $p += $window } else { $p++ }
        }
        if ($hits -gt 0) { $warnings.Add("W2 $($names[$i]) <-> $($names[$j]): $hits block(s) of >= $window identical consecutive lines (trim candidate; record in EVALS.md before touching)") }
    }
}

# ---- W3: hardcoded wiki/spec- outside AGENTS.md ----------------------------------------------------
foreach ($f in $mdFiles) {
    if ($f.FullName -eq $agentsPath) { continue }
    $rel = Rel $f.FullName
    if ($rel -match '^(README|_shared)' -or $rel -match '[\\/]_shared[\\/]') { continue }
    $n = 0
    foreach ($line in ((Read-Utf8 $f.FullName) -split "`n")) {
        $n++
        if ($line -match 'wiki/spec-' -and $line -notmatch 'specs/<feature>/spec\.md') { $warnings.Add("W3 ${rel}:${n}: hardcoded wiki/spec- without the Spec Kit branch") }
    }
}

# ---- report --------------------------------------------------------------------------------------
Write-Host ""
Write-Host "=== Library lint ($LibraryRoot) ==="
Write-Host "AGENTS.md: $agentsBytes bytes, $($agentsLines.Count) lines; roles in table: $($tableRoles.Count); role files: $($roleFiles.Count)"
if ($errors.Count -gt 0) {
    Write-Host ""; Write-Host "Errors ($($errors.Count)):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" }
}
if ($warnings.Count -gt 0) {
    Write-Host ""; Write-Host "Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  $_" }
}
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) { Write-Host "Clean." -ForegroundColor Green }
Write-Host ""
if ($errors.Count -gt 0) { exit 1 }
exit 0
