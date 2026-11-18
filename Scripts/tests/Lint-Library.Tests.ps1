# Lint-Library.Tests.ps1
#
# Positive controls for the two lints (plain PowerShell, no Pester, no dependency):
#   .\Scripts\tests\Lint-Library.Tests.ps1        # exit 0 = every control fired, exit 1 = at least one did not
#
# For each ERROR rule of Lint-Library.ps1 (E1-E7) and Lint-RepoMemory.ps1 (R1-R11) a throwaway fixture with one
# planted violation asserts that the rule id appears in the lint output; one clean fixture per lint asserts that
# no error is reported. A lint that has only been seen to pass has not been seen to work.
# Warnings: only the ones changed on 2026-11-18 are covered (RW1, RW6, W4 threshold); the rest can wait.
#
# Fixtures are built in the temp folder and removed at the end; nothing in the library is written.
# This file stays ASCII: hidden characters are built with [char], never typed. PowerShell 5.1+ / 7+.

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ScriptsDir     = Split-Path $PSScriptRoot -Parent
$LintLibrary    = Join-Path $ScriptsDir "Lint-Library.ps1"
$LintRepoMemory = Join-Path $ScriptsDir "Lint-RepoMemory.ps1"
$TemplatePath   = Join-Path (Split-Path $ScriptsDir -Parent) (Join-Path "MemoryTemplates" "PROJECT_MEMORY.template.md")
$HostExe        = (Get-Process -Id $PID).Path
$TempRoot       = Join-Path ([IO.Path]::GetTempPath()) ("lint-tests-" + [Guid]::NewGuid().ToString("N"))
$Utf8NoBom      = New-Object System.Text.UTF8Encoding($false)
$ZeroWidthSpace = [string][char]0x200B
$script:Failures = New-Object System.Collections.Generic.List[string]
$script:Passed   = 0

function Write-Fixture([string]$Root, [string]$RelPath, [string]$Text) {
    $full = Join-Path $Root ($RelPath -replace '/', [IO.Path]::DirectorySeparatorChar)
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($full, $Text, $Utf8NoBom)
}

# Runs a lint in a child process; returns its text output and exit code.
function Invoke-Lint([string]$Script, [string[]]$Arguments) {
    $output = (& $HostExe -NoProfile -NonInteractive -File $Script @Arguments 2>&1 | Out-String)
    return [pscustomobject]@{ Output = $output; ExitCode = $LASTEXITCODE }
}

function Assert-True([string]$Name, [bool]$Condition, [string]$Detail) {
    if ($Condition) { $script:Passed++; Write-Host "  ok   $Name" }
    else { $script:Failures.Add($Name); Write-Host "  FAIL $Name" -ForegroundColor Red; if ($Detail) { Write-Host $Detail } }
}

function Test-RuleFired([string]$Output, [string]$RuleId) { return $Output -match "(?m)^\s+$RuleId " }

# ---- Lint-Library fixtures ------------------------------------------------------------------------
$RoleNames = @('researcher', 'analyst', 'architect', 'planner', 'backend-engineer', 'frontend-engineer', 'devops-engineer',
    'debugger', 'data-engineer', 'data-scientist', 'ml-engineer', 'mlops-engineer', 'ai-engineer', 'prompt-engineer',
    'rag-engineer', 'nlp-engineer', 'backend-reviewer', 'frontend-reviewer', 'data-reviewer', 'ml-reviewer', 'ai-reviewer',
    'qa-engineer', 'security-engineer')

function New-LibraryFixture([string]$Name) {
    $root = Join-Path $TempRoot $Name
    $table = ($RoleNames | ForEach-Object { '| `' + $_ + '` | `' + $_ + '.md` | scope |' }) -join "`n"
    Write-Fixture $root "AGENTS.md" ("# Agents`n`n## Available Roles`n`n| Role | File | Use for |`n|---|---|---|`n$table`n`n## Routing`n`n- route`n")
    Write-Fixture $root "EngineeringTeam/planner.md" ("# planner`n`nSee ``AGENTS.md`` -> Routing. Hands off to ``backend-engineer``.`n")
    Write-Fixture $root "README/ORCHESTRATION_README.md" ("# Readme`n`n## Structure`n`n``````text`nLibrary/`n  AGENTS.md                master copy`n  EngineeringTeam/         role files`n    planner.md             one role`n``````n")
    Write-Fixture $root "LESSONS.md" ("# Lessons`n`n## Lessons`n`n- A dated lesson. [2026-11-18]`n")
    return $root
}

function Add-ToFixture([string]$Root, [string]$RelPath, [string]$Text) {
    $full = Join-Path $Root ($RelPath -replace '/', [IO.Path]::DirectorySeparatorChar)
    [IO.File]::AppendAllText($full, $Text, $Utf8NoBom)
}

Write-Host ""
Write-Host "=== Lint-Library.ps1 positive controls ==="

$root = New-LibraryFixture "lib-clean"
$r = Invoke-Lint $LintLibrary @('-LibraryRoot', $root)
Assert-True "library clean fixture: exit 0 and no Errors block" (($r.ExitCode -eq 0) -and ($r.Output -notmatch 'Errors \(')) $r.Output

$libraryPlants = @(
    @{ Id = 'E1'; Plant = { param($root) Add-ToFixture $root "EngineeringTeam/planner.md" ("See ``AGENTS.md`` -> Nonexistent Heading.`n") } },
    @{ Id = 'E2'; Plant = { param($root) Add-ToFixture $root "EngineeringTeam/planner.md" ("Hand off to ``ghost-engineer``.`n") } },
    @{ Id = 'E3'; Plant = { param($root) Write-Fixture $root "README/ORCHESTRATION_README.md" ("# Readme`n`n## Structure`n`n``````text`nLibrary/`n  AGENTS.md                master copy`n  not-on-disk.md           planted`n``````n") } },
    @{ Id = 'E4'; Plant = { param($root) Add-ToFixture $root "EngineeringTeam/planner.md" ("Update the tracker file if one exists.`n") } },
    @{ Id = 'E5'; Plant = { param($root) Add-ToFixture $root "LESSONS.md" ("- An undated lesson.`n") } },
    @{ Id = 'E6'; Plant = { param($root) Add-ToFixture $root "EngineeringTeam/planner.md" ("hidden" + $ZeroWidthSpace + "text`n") } },
    @{ Id = 'E7'; Plant = { param($root) Add-ToFixture $root "AGENTS.md" (("x" * 99 + "`n") * 400) } }
)
foreach ($plant in $libraryPlants) {
    $root = New-LibraryFixture ("lib-" + $plant.Id)
    & $plant.Plant $root
    $r = Invoke-Lint $LintLibrary @('-LibraryRoot', $root)
    Assert-True "$($plant.Id) fires on its planted violation" (Test-RuleFired $r.Output $plant.Id) $r.Output
    # E7 is listed under Warnings in the lint header but raised as an error; only its id is asserted.
    if ($plant.Id -ne 'E7') { Assert-True "$($plant.Id) fixture exits 1" ($r.ExitCode -eq 1) "exit code $($r.ExitCode)" }
}

# W4 (warning): 1,800 lines warns, 1,799 does not; exit code stays 0.
$root = New-LibraryFixture "lib-W4-at"
Write-Fixture $root "EngineeringTeam/planner.md" (("line`n") * 1800)
$r = Invoke-Lint $LintLibrary @('-LibraryRoot', $root)
Assert-True "W4 warns at 1,800 lines, exit 0" ((Test-RuleFired $r.Output 'W4') -and ($r.ExitCode -eq 0)) $r.Output
$root = New-LibraryFixture "lib-W4-under"
Write-Fixture $root "EngineeringTeam/planner.md" (("line`n") * 1799)
$r = Invoke-Lint $LintLibrary @('-LibraryRoot', $root)
Assert-True "W4 is silent at 1,799 lines" (-not (Test-RuleFired $r.Output 'W4')) $r.Output

# ---- Lint-RepoMemory fixtures ---------------------------------------------------------------------
function New-RepoFixture([string]$Name) {
    $root = Join-Path $TempRoot $Name
    Write-Fixture $root ".ai-memory/PROJECT_MEMORY.md" ("# Project memory`n`n- ``wiki/arch.md`` - architecture`n- ``wiki/spec-feature.md`` - feature spec`n")
    # docs/wiki/setup.md is a repo path that only ends in wiki/...: it must not be read as a memory link (R2 anchor).
    Write-Fixture $root ".ai-memory/wiki/arch.md" ("# Architecture`n`n- Setup guide: ``docs/wiki/setup.md``; spec: ``wiki/spec-feature.md``.`n")
    Write-Fixture $root ".ai-memory/wiki/spec-feature.md" ("# Spec`n`n- ``AC-1`` WHEN a file is uploaded, the system SHALL validate it.`n")
    Write-Fixture $root ".ai-memory/ROADMAP.md" ("# Roadmap`n`n## In Progress`n- feature - ``TASKS/task-a.md```n`n## Done`n")
    Write-Fixture $root ".ai-memory/TASKS/task-a.md" ("# Task`n`n## Summary`n- goal`n`n## Plan`n- [ ] T01 build it - Owns: src/a`n`n## Evidence`n- ``run-tests`` | unit | 0 | abc1234`n`n## Handoff`n- Next role: qa-engineer`n")
    return $root
}

Write-Host ""
Write-Host "=== Lint-RepoMemory.ps1 positive controls ==="

$root = New-RepoFixture "repo-clean"
$r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root, '-Archived')
Assert-True "repo clean fixture: exit 0 and no Errors block (docs/wiki/setup.md is not a link)" (($r.ExitCode -eq 0) -and ($r.Output -notmatch 'Errors \(')) $r.Output

$repoPlants = @(
    @{ Id = 'R1';  Plant = { param($root) Write-Fixture $root ".ai-memory/wiki/orphan.md" ("# Orphan`n") } },
    @{ Id = 'R2';  Plant = { param($root) Add-ToFixture $root ".ai-memory/ROADMAP.md" ("`n## Backlog`n- later - ``TASKS/missing.md```n") } },
    @{ Id = 'R3';  Plant = { param($root) Add-ToFixture $root ".ai-memory/ROADMAP.md" ("- shipped - ``TASKS/task-a.md```n") } },
    @{ Id = 'R4';  Plant = { param($root) Write-Fixture $root ".ai-memory/CONSTITUTION.md" ("# C`n"); Write-Fixture $root ".specify/memory/constitution.md" ("# C`n") } },
    @{ Id = 'R5';  Plant = { param($root) Write-Fixture $root ".ai-memory/wiki/arch/notes.txt" ("x`n") } },
    @{ Id = 'R6';  Plant = { param($root) Add-ToFixture $root ".ai-memory/wiki/arch.md" ("hidden" + $ZeroWidthSpace + "text`n") } },
    @{ Id = 'R7';  Plant = { param($root) Write-Fixture $root ".ai-memory/TASKS/task-a.md" ("# Task`n`n## Plan`n- [ ] T01 build it - Owns: src/a`n`n## Evidence`n- ``run-tests`` | unit | 0 | abc1234`n`n## Handoff`n- Next role: qa-engineer`n") } },
    @{ Id = 'R8';  Plant = { param($root) Add-ToFixture $root ".ai-memory/TASKS/task-a.md" ("- [ ] T02 a phase with no owner`n") } },
    @{ Id = 'R9';  Plant = { param($root) Add-ToFixture $root ".ai-memory/wiki/spec-feature.md" ("- ``AC-2`` the system validates uploads.`n") } },
    @{ Id = 'R10'; Plant = { param($root) Write-Fixture $root ".ai-memory/TASKS/_archive/2026-01-01-old.md" ("# Old`n`n- [ ] T01 never finished - Owns: src/b`n") } },
    @{ Id = 'R11'; Plant = { param($root) Write-Fixture $root ".claude/agents/reviewer.md" ("---`nname: backend-reviewer`n---`n") } }
)
foreach ($plant in $repoPlants) {
    $root = New-RepoFixture ("repo-" + $plant.Id)
    & $plant.Plant $root
    $r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root, '-Archived')
    Assert-True "$($plant.Id) fires on its planted violation" (Test-RuleFired $r.Output $plant.Id) $r.Output
    Assert-True "$($plant.Id) fixture exits 1" ($r.ExitCode -eq 1) "exit code $($r.ExitCode)"
}

# R2 from a wiki page (link source added 2026-11-18).
$root = New-RepoFixture "repo-R2-wiki"
Add-ToFixture $root ".ai-memory/wiki/arch.md" ("- See ``wiki/not-there.md``.`n")
$r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
Assert-True "R2 fires on a dead link inside a wiki page" ($r.Output -match '(?m)^\s+R2 .*wiki/arch\.md: link wiki/not-there\.md') $r.Output

# RW1 (warning): a template-made PROJECT_MEMORY.md of 101 lines with no index line warns, even though the
# template text itself mentions wiki/; one index line silences it.
$root = New-RepoFixture "repo-RW1"
$template = [IO.File]::ReadAllText($TemplatePath, [Text.Encoding]::UTF8)
$templateLines = ($template -split "`n").Count
$padding = if ($templateLines -lt 101) { ("- a stable fact`n") * (101 - $templateLines) } else { "" }
Remove-Item (Join-Path $root (Join-Path ".ai-memory" "wiki")) -Recurse -Force
Write-Fixture $root ".ai-memory/PROJECT_MEMORY.md" ($template + $padding)
$r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
Assert-True "RW1 warns on a 101+ line template-made file with no index line (template mentions wiki/)" (($template -match 'wiki/') -and (Test-RuleFired $r.Output 'RW1')) $r.Output
Write-Fixture $root ".ai-memory/wiki/arch.md" ("# Architecture`n")
Write-Fixture $root ".ai-memory/PROJECT_MEMORY.md" ($template + $padding + "- ``wiki/arch.md`` - architecture`n")
$r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
Assert-True "RW1 is silent once an index line exists" (-not (Test-RuleFired $r.Output 'RW1')) $r.Output

# RW6 (warning): a tracked memory file cut to under two thirds of its committed line count.
if (Get-Command git -ErrorAction SilentlyContinue) {
    $root = New-RepoFixture "repo-RW6"
    $r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
    Assert-True "RW6 is silent in a folder that is not a git repo" (-not (Test-RuleFired $r.Output 'RW6')) $r.Output
    Write-Fixture $root ".ai-memory/wiki/arch.md" ("# Architecture`n" + (("- a fact`n") * 29))
    $ErrorActionPreference = "Continue"
    & git -C $root init -q 2>&1 | Out-Null
    $r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
    Assert-True "RW6 is silent in a repo with no commits" (-not (Test-RuleFired $r.Output 'RW6')) $r.Output
    & git -C $root add -- .ai-memory 2>&1 | Out-Null
    & git -C $root -c user.name=lint-test -c user.email=lint-test@example.invalid -c commit.gpgsign=false -c core.hooksPath= commit -q -m fixture 2>&1 | Out-Null
    $committed = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = "Stop"
    if ($committed) {
        $r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
        Assert-True "RW6 is silent when nothing shrank" (-not (Test-RuleFired $r.Output 'RW6')) $r.Output
        Write-Fixture $root ".ai-memory/wiki/arch.md" ("# Architecture`n" + (("- a fact`n") * 4))
        Write-Fixture $root ".ai-memory/wiki/untracked.md" ("# New`n")
        Add-ToFixture $root ".ai-memory/PROJECT_MEMORY.md" ("- ``wiki/untracked.md`` - new page`n")
        $r = Invoke-Lint $LintRepoMemory @('-RepoRoot', $root)
        Assert-True "RW6 warns on a 30 -> 5 line shrink, exit 0" (($r.Output -match '(?m)^\s+RW6 \.ai-memory/wiki/arch\.md') -and ($r.ExitCode -eq 0)) $r.Output
        Assert-True "RW6 skips an untracked file" ($r.Output -notmatch 'RW6 \.ai-memory/wiki/untracked\.md') $r.Output
    } else { Write-Host "  skip RW6 shrink cases: could not commit the fixture" -ForegroundColor Yellow }
} else { Write-Host "  skip RW6: git is not on PATH" -ForegroundColor Yellow }

# ---- summary -----------------------------------------------------------------------------------------
Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Passed: $($script:Passed)  Failed: $($script:Failures.Count)"
if ($script:Failures.Count -gt 0) {
    $script:Failures | ForEach-Object { Write-Host "  FAIL $_" -ForegroundColor Red }
    exit 1
}
exit 0
