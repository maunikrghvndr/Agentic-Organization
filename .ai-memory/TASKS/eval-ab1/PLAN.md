# A/B #1 — `backend-engineer.md` full file vs core + references (plan written before the first trial)

Owner (Maunik, 2026-11-18): "run the role file split test". This is `EVALS.md` → The first three A/Bs, item 1. It informs Decision B (whether the six large role files may be split).

## What this run is, honestly

- **Exploratory by the protocol's own rules, decided before running:** (1) the task repository is a purpose-built fixture, not one of the owner's real repositories (the only real backend repository visible to this session is private clinical code in another organization and was not added without the owner's say); (2) isolation is partial — every trial runs as a subagent of one host, which adds its own system prompt and this repository's `AGENTS.md` to both arms equally; (3) no enforceable turn or budget cap per trial on this host. A row with `isolation: none` or a fixture task cannot carry a KEEP/TRIM/CUT verdict. The result is a direction, and tells whether a binding run is worth doing.
- **One variable:** the backend role file. Arm A = `Backend/backend-engineer.md` as it is in the library at the recorded sha. Arm B = a scratch variant outside the library: a short core file plus reference files holding every other section verbatim (lossless relocation, nothing reworded), with a table saying when to read each reference.
- Everything else identical: the same library copy (minus `Evals/` and `EVALS.md`), the same fixture commit, the same task text, the same model and effort, delivery `appended` (the task prompt names the library path and the role file).

## Tasks and traps (from `Evals/trap-tasks.md`)

- **T1** — add a feature that needs a user-facing message and a retried outbound call. Traps 6 (hardcoded message where a constants file exists) and 7 (helper reinvented although the repository already has one), plus trap 2 (Evidence row).
- **T2** — add one optional field end to end with three acceptance criteria, the third an empty-input counterpart. Traps 8 (an AC silently dropped) and 10 (a one-field change grows an abstraction), plus trap 2.

## Pre-registered checks (mechanical; pass = every check exits 0)

Per trial, run by the operator after the trial ends, never by the trial agent, from a key directory no trial is pointed at:
1. The project's recorded build and test command exits 0 on the trial's result.
2. A hidden acceptance test file (not in the fixture) exits 0 against the trial's result: one test per AC.
3. Static checks on the diff from the fixture's base commit: no new user-facing string literal outside the constants file (T1); the existing retry helper is imported and no second retry loop is added (T1); no `any` added; no log call built by interpolation or concatenation; no new file beyond those the reference solution's kinds allow and no new interface/abstract class/wrapper (T2).
4. The task file under `.ai-memory/TASKS/` exists and has at least one Evidence row with a command and an exit code.
The grader is validated first: a reference solution passes every check and a naive solution fails the trap checks.

## Trials, metrics, stop rule

- 3 trials per arm per task = 12 trials, each a fresh context, each in its own copy of the fixture.
- Recorded per trial from the host's run record, never from the agent's report: total tokens, tool calls, duration; and each check's exit code.
- Arm comparison: pass^3 per task per arm; median tokens per arm; whether arm B opened reference files and which.
- Noise: with 3 trials per arm, a token difference smaller than arm A's own spread is `no evidence`.
- Ceiling: 12 trials, about 4 million subagent tokens in total. Stop early if the grader validation fails, or if all three arm-A trials of a task fail a trap check (the task is then not a valid task for this section).
- A trial that ends on a provider error or limit is `invalid` and re-run once.

## Departures from the protocol, known in advance

- Fixture repository instead of a real one; partial isolation; no per-trial cap; arm A is not run extra times for a noise floor beyond its 3 trials; the fixture is TypeScript because that is the toolchain available here, while the role file leans to C#.
<!-- END-OF-FILE -->
