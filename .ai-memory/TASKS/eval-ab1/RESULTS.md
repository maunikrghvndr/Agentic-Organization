# A/B #1 — results (2026-11-18)

Plan and pre-registered checks: `PLAN.md` (committed before the first trial, `c5e8d09`). **Status: exploratory, as the plan said before running. No KEEP/TRIM/CUT verdict.**

## Result in one paragraph

Both arms passed every pre-registered check on every trial (pass^3 on both tasks, both arms). The split made no measurable difference to token use: on each task the difference between the arms is smaller than arm A's own run-to-run spread, which the protocol logs as `no evidence`. Arm B cost about 3 more tool calls and about 20 seconds more per trial, because the agent opened 5 to 9 of the 13 reference files on tasks this small.

## Per trial (scored by `grade.sh` from the key directory; usage from the host's run record)

| Trial | Arm | Task | Checks | Result | Total tokens | Tool calls | Seconds | Reference files opened (agent's own list) |
|---|---|---|---|---|---|---|---|---|
| A-T1-1 | A full file | T1 | 12/12 | PASS | 169,377 | 11 | 141 | n/a |
| A-T1-2 | A | T1 | 12/12 | PASS | 176,140 | 12 | 146 | n/a |
| A-T1-3 | A | T1 | 12/12 | PASS | 165,537 | 11 | 141 | n/a |
| A-T2-1 | A | T2 | 10/10 | PASS | 145,532 | 11 | 111 | n/a |
| A-T2-2 | A | T2 | 10/10 | PASS | 151,064 | 12 | 119 | n/a |
| A-T2-3 | A | T2 | 10/10 | PASS | 164,689 | 13 | 131 | n/a |
| B-T1-1 | B core + references | T1 | 12/12 | PASS | 177,774 | 13 | 163 | 9 |
| B-T1-2 | B | T1 | 12/12 | PASS | 171,010 | 14 | 152 | 6 |
| B-T1-3 | B | T1 | 12/12 | PASS | 182,371 | 16 | 177 | 8 |
| B-T2-1 | B | T2 | 10/10 | PASS | 145,835 | 15 | 148 | 5 |
| B-T2-2 | B | T2 | 10/10 | PASS | 141,839 | 14 | 132 | 5 |
| B-T2-3 | B | T2 | 10/10 | PASS | 147,390 | 15 | 144 | 5 |

## Per arm

| Task | Arm | pass^3 | Tokens min / median / max | Mean | Spread | Tool calls (mean) | Seconds (mean) |
|---|---|---|---|---|---|---|---|
| T1 | A | yes | 165,537 / 169,377 / 176,140 | 170,351 | 10,603 | 11.3 | 143 |
| T1 | B | yes | 171,010 / 177,774 / 182,371 | 177,052 | 11,361 | 14.3 | 164 |
| T2 | A | yes | 145,532 / 151,064 / 164,689 | 153,762 | 19,157 | 12.0 | 121 |
| T2 | B | yes | 141,839 / 145,835 / 147,390 | 145,021 | 5,551 | 14.7 | 141 |

- T1: arm B mean is 6,701 tokens higher; arm A's spread is 10,603 → `no evidence`.
- T2: arm B mean is 8,741 tokens lower; arm A's spread is 19,157 → `no evidence`.
- Total subagent tokens for the 12 trials: 1,938,558 (under the 4 million ceiling). Builders and graders are not in that figure.

## What the split looked like

Source 50,777 bytes (about 12,700 tokens); core 21,045 bytes (about 5,300); 13 references, about 8,500 tokens together; a script confirmed every non-blank source line is present byte-identical in core + references (0 missing; 31 added lines: the "read when" table and file headings). The core is 41% of the source because the 2026-11-18 paragraphs (placement, simplest design, shared code) are long and all stay in the core.

## Why the saving did not appear

- The references the agents opened on T1 included the two largest (`logging-and-observability-detail`, about 2,500 tokens, and in one trial `architecture-and-design`, about 1,750). Core + opened references came to roughly 9,000–11,500 tokens against 12,700 for the full file: a saving of 1,000–3,500 tokens per trial at best, against 3 more tool calls whose overhead is of the same order.
- The table tells the agent to read a reference "when unsure whether it applies". Agents followed that and read more rather than less.
- The role file is about 8% of a trial's tokens. The rest is `AGENTS.md`, lessons, shared rules, the repository and the work itself, which the split does not touch.

## What this does and does not show

- Shows, for these two small tasks on this host and model: a lossless core + references split of `backend-engineer.md` does not lose quality and does not save tokens.
- Does not show: behaviour on a real repository, on C#, on a large multi-area task (where more references would be read, so less saving still), or on a task so narrow that no reference applies (where the saving would be largest, about 7,400 tokens of role text).
- **The traps did not bite in arm A** (no trial in either arm tripped trap 6, 7, 8 or 10). By `Evals/trap-tasks.md`, a task that trips no trap in arm A cannot show that a section prevents that failure; it can only show that the variant is not worse here.

## Departures from the protocol

- Fixture repository, not a real one (plan). TypeScript fixture; the role file leans to C#.
- Isolation partial: each trial was a subagent of one host, which added its own system prompt and this repository's `AGENTS.md` to both arms. Nine of twelve trials reported running one `diff` against `/home/user/Agentic-Organization/AGENTS.md` (outside the allowed paths; output unused by their account) — recorded as an isolation leak, both arms.
- No per-trial turn or budget cap was enforceable. No extra arm-A runs for a noise floor beyond its 3.
- Reference files opened are the agents' own lists, not a transcript count.
- One extra grader check beyond the plan (`retry-through-helper`, a dynamic probe that the retry goes through the existing helper), added by the grader's builder because the static import check passes trivially; validated on reference and naive solutions before any trial.
- Library copy for both arms taken at `c5e8d09` (before the consistency-audit fixes `06d7406`); `Evals/` and `EVALS.md` excluded from the copy.
- Host: one cloud coding-agent session; model and effort identical for all 12 trials (the session's own); trial artefacts are in the session scratch folder and are not committed.

## Reading for Decision B

Decision B was "test first, split only if quality holds". Quality held; the reason to split (a token saving) did not show up. On this evidence there is no case for splitting the large role files this way. A binding run needs one of the owner's real repositories and a clean, capped setup. Larger savings identified elsewhere (harness study): keeping review, security and QA role files out of the main context, bounded reads, and resuming from the task-file checkpoint.
<!-- END-OF-FILE -->
