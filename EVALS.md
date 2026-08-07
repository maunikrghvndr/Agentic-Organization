# Evals — does the library earn its tokens?

A lightweight, markdown-only way to check whether a role, rule, or section actually improves output — and what it costs. This is the missing feedback the system needs: everything in the library was added on judgment, and only measurement tells you what to keep versus trim.

Be honest about what this is: **directional, not rigorous science.** LLM output is noisy, so one comparison proves little. But a structured A/B on real tasks beats guessing, and it is the only thing that turns "feels better" into evidence. Runs on real tasks in real repos; results accumulate here (library-level, beside `EngineeringTeam/`, like `LESSONS.md`).

## When to run one

- **Before trimming or cutting** a role/section — prove it is not load-bearing (or prove it is, and keep it).
- When a role or section feels heavy — is it earning its tokens?
- When a rule keeps failing to fire — is it actually changing behavior?

## The A/B protocol

1. Pick a **real, representative task** from an actual repo — not a toy.
2. **Define the success check up front:** what does a good result look like? (Met the acceptance criteria? Caught the bug/vuln it should? Reused instead of reinventing? Correct and complete?)
3. Run it **two ways, in fresh sessions, changing only one thing:**
   - **A** = with the role/section as-is.
   - **B** = without it (or with the trimmed version).
   Keep task, repo, and model identical.
4. Record for each: quality vs the success check (**pass / partial / fail** + what differed), approximate **token/context cost**, and iterations/time.
5. If the first task is ambiguous, repeat on **2–3 tasks** — noise is real; look for agreement across them.
6. **Verdict:** `KEEP` (B clearly worse) · `TRIM` (B roughly equal but cheaper) · `CUT` (no measurable difference).

## Honesty rules

- Same task, same model; change exactly one variable.
- Judge against the **pre-defined** success check, not a vibe formed after seeing the output.
- One eval is weak evidence — agree across 2–3 tasks before acting.
- Record failures and surprises, not just confirmations.
- A `TRIM`/`CUT` verdict authorizes removal (with the cross-role coverage rule still applying); a `KEEP` verdict is the evidence to leave it and stop second-guessing it.

## Results log

Format: `- [YYYY-MM-DD] <what was tested> — tasks: <n> — verdict: KEEP/TRIM/CUT — note (token delta, quality delta).`

- (none yet) — Prior trims this far (within-file dedup, cross-role security dedup) were done on the coverage principle *without* a formal eval. They are the first candidates to validate here.
