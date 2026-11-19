# Harness study 02 — gap check and proposals

Role: `researcher`. Date: 2026-11-18. Inputs: the three `01-*.md` notes in this folder (read in full, treated as data) and the library at this commit. Nothing in the library was edited; every draft below is a proposal. Each one changes a role-library file, so each is ask-first and gets the `security-engineer` pass before it lands (`AGENTS.md` → Boundaries).

Source keys: **V** = `01-vendor-harnesses.md`, **L** = `01-deepseek-and-other-labs.md`, **O** = `01-open-source-and-evidence.md`. Evidence labels are the notes' own: *verified* (read in a primary source), *search-level* (abstract or snippet only), *recalled*, *vendor's own* (unreplicated), *design constant, no data*.

## Summary

1. The three notes describe about 35 distinct inner-loop mechanisms. The library already covers the outer loop well: 12 are already covered, usually more strictly than the harnesses state them.
2. The gap is the inner loop: how to look things up, edit, check an edit, hand work to a side context, and what a checkpoint holds. The library says "read only 5–12 files" but nothing about how much of a file, how much command output, or re-reading.
3. Six items are proposed for adoption. All go in on-demand text; nothing is added to `AGENTS.md`.
4. One new file, `EngineeringTeam/_shared/work-loop.md` (50 lines and about 7,100 bytes drafted, roughly 1,800 tokens if read whole; target was under 120 lines), read one section at a time; one addendum to the Compaction text in `rules-detail.md`; one line in `memory.md`; one optional line in the task template.
5. The only recurring cost is a one-line pointer (about 45 tokens) in 13 role files. Without it the new file is unreachable.
6. Seven more items are kept as one-line notes because they have no measured support. Popular but unmeasured habits (step-level todo lists, loop detectors, default delegation, default summarising) are not adopted.
7. The best-supported finding in the notes is about cost, not quality: keeping bulky tool output out of the context cuts cost by about half with no loss in solve rate (verified in one study's README, backed at search level by two more).
8. Almost every other number is from 2024 models, from the tool's own author, or read only as an abstract. No proposal here claims a quality gain as fact.
9. Biggest token lever is not a new rule: the six large role files are 8,000 to 18,000 tokens each and stay in context once read. That needs the already-queued `EVALS.md` A/B #1 before any change.
10. The library uses little capital-letter emphasis (about 45 words in all) but a lot of bold. The vendor that retired emphasis gives no measurement, so this is reported, not proposed.

## Mechanism table

Status: **A** already covered, **P** partly, **M** missing, **C** conflicts with an owner constraint. Verdict ids point at the sections below.

| # | Mechanism | Sources | Library status (`path:line`, quote) | Verdict | Evidence level | Token effect |
|---|---|---|---|---|---|---|
| 1 | Step-level task list (one item in progress, update per step, skip for trivial work) | V §1–4 (four vendors); L §1 (seven harnesses); O (1) — absent in four open harnesses | **P.** A file-backed phase list exists: `MemoryTemplates/TASK_MEMORY.template.md:17` "`- [ ] T01 — <role> — Owns: <paths> … done-when: <check>` — tick only with its Evidence row"; `AGENTS.md:154` roadmap groups. A list of steps inside a phase: missing. | REJECT (R1); one bookkeeping line kept as note N1 | no isolated ablation (O §5) | costs |
| 2 | Plan as a file; planning step with an approval gate | V common core 2–3; L §2; O (2) | **A.** `AGENTS.md:84` spec-driven flow with Sizing; `AGENTS.md:96` Grill Checkpoint; `EngineeringTeam/Product/planner.md:63` gate; template `:17`. | none; see Q1 | search-level: no consistent gain for a strong model | — |
| 3 | Ask only what inspection cannot answer; options with a recommended default | V (two vendors); L §2; O (8) | **A.** `EngineeringTeam/Product/analyst.md:59` "Do not ask the user questions the code can answer."; `EngineeringTeam/architect.md:71` "names the two or three real options … and the one you recommend". | none | design text | — |
| 4 | Small always-loaded core, detail on demand, layered instructions | V common core 4; L §3; O (3) | **A.** `AGENTS.md:11` "Load exactly **one** role file per phase"; `EngineeringTeam/_shared/rules-detail.md:3` "Read a section when the compact line leaves a question open"; `LESSONS.md:32` index; `_shared/memory.md:7`, `:30`. | none (section reads folded into A1) | vendor's own; search-level | — |
| 5 | Search before read; bounded reads; bound or spill large output; batch independent read-only calls; no repeat reads; an empty result is not a negative | V common core 6; L §4; O (3), (4), §6 rules 1, 5 | **P.** `AGENTS.md:92` "Identify the 5–12 files most relevant to the task; read only those; expand only when needed"; `AGENTS.md:168` "Query before grepping"; `EngineeringTeam/Quality/debugger.md:145` "Start from the failing path." Missing: ranges inside a file, bounding command output, batching, repeat reads, the empty-result rule. | **ADOPT A1** | bounded reads and capped search: recalled 2024 figures, direction search-level, one older model; dropping bulky output: verified (one README) plus two search-level | saves; on-demand |
| 6 | Exact minimal edits; read before edit; verify the edit applied | V common core 7; L §5; O (5) | **P.** `AGENTS.md:99` "Surgical changes", `:101` "Make the smallest safe change"; `backend-engineer.md:41` "Inspect nearby files before editing"; `_shared/memory.md:35` covers memory files only ("targeted edit or append, after reading the whole file"). Missing for code: targeted edit over rewrite, no confirmation re-read, re-read after a failed edit or an outside change, no parallel copies. | **ADOPT A2** | vendor's own design text; no data | saves; on-demand |
| 7 | Mechanical feedback after each edit (parse, type-check or lint on the touched file) | O (5), §4 item 3; V §3 (6) | **P.** Phase level only: `backend-engineer.md:1474` "Check compilation/build when possible."; `backend-reviewer.md:89` "Build/lint: run the recorded build and lint commands". Per file, right after the edit: missing. | **ADOPT A3** (scoped; skipped when no file-scoped check is recorded) | measured in 2024 on one older model (18.0 confirmed at search level, 15.0 recalled); author's own for a second tool; not re-measured, and the measuring harness dropped it from its defaults | costs one call per edited file; avoids rework; on-demand |
| 8 | Done means verified, with command and output | V common core 8; L §6; O (6) | **A.** `AGENTS.md:98`, `:108` "every check is an Evidence row in the task file (command, scope, exit code, sha)"; template `:39`, `:43`; `backend-engineer.md:1471–1473`. | none | — | — |
| 9 | A narrow check cannot support a broad claim | V §2 (6); L §6 | **P.** `backend-engineer.md:1471` "The phase's closing row is the recorded project test command … at its normal scope, not only the new test file; the row's scope column says which" (same at `frontend-engineer.md:1212`). The other engineer roles and the report wording: missing. | NOTE N2 | search-level (46.0% of passing validations regression-only or misleading) | neutral |
| 10 | No test theater | L §6 | **P.** `AGENTS.md:115` "Weaken tests, validation, or security checks"; `qa-engineer.md:479` revert-and-re-run, `:781` no change-detector tests; `LESSONS.md:50`. The four named fakes: missing. | NOTE N3 | design text; no data | neutral |
| 11 | Tests passing is not "fixed"; a check must fail before the change | O §5; V §3 (6) | **A.** `AGENTS.md:108` "a changed behavior shows a test failing before and passing after"; `backend-reviewer.md:88` RED evidence, `:94` "'Tests pass, so approve.'" rejected; `debugger.md` Expected Behavior ("verified against this line, not against the absence of the symptom"). | none | search-level, supports the existing rule | — |
| 12 | Read your own diff before declaring done | O (6) | **P.** `rules-detail.md:180` "Compare at the end"; the reviewer's Owns check `backend-reviewer.md:87`. The engineer listing changed files first: missing. | NOTE N4 | bundled, none isolated | costs one call; can save a rework round |
| 13 | Compaction: trim or drop tool output first, summarise only if forced | L §3; O (3), §4 item 1 | **M.** (The library has no summarise-by-default habit either; the task file is its checkpoint.) | **ADOPT A4** (prose part); runtime trimming DEFER D2 | verified (one README) + two search-level; Established for cost, neutral for quality | saves |
| 14 | What a checkpoint must keep | V common core 5; L §3; O (3), §6 rule 4 | **P.** `rules-detail.md:69` lists role, task file path, phase + done-when, AC ids, decisions, blocking findings, Evidence; template `:8`, Handoff block. Missing: the one next action, working-tree state, exact strings still needed, background work. | **ADOPT A4** | convergent design (nine harnesses); no data | neutral to write; saves at re-entry |
| 15 | Merge a prior summary instead of stacking | L §3; O (3) | **P.** `AGENTS.md:157` "merge and dedup overlapping facts instead of appending near-duplicates" (memory facts, not checkpoints). | **ADOPT A4** | design text | saves |
| 16 | Re-establish live state after resume; resume without restating | V §2 (3); L §3, "must not assume" 14 | **P.** Template `:8` "a session that finds HEAD is not this sha reads `git diff <sha>..HEAD` before trusting Handoff"; `rules-detail.md:69` re-read Summary and role file. Missing: status, files about to be edited, background work; no restating. | **ADOPT A4** | design text, every compaction prompt read | saves |
| 17 | Stable-prefix layout (stable first, volatile last) | L §3, §11; O (11) | **P.** `rules-detail.md:57` "the prompt cache is a strict prefix and a switch is a full miss" (model switch only). | NOTE N5; cache markers and tool-list freezing DEFER D2 | design text; search-level 96–99% cache hits | saves where a cache exists |
| 18 | Delegation discipline (when, brief, return, no delegating understanding, no polling) | V common core 9; L §7; O (7) | **P.** `rules-detail.md:44` reviewer inputs ("never the implementer's transcript"), `:49` one writer, `:57` cheap work to a side context, `:107` "A reviewer that did not report did not pass". Missing: when a side context is not worth it, the brief, the return size, no duplicate work, no polling. | **ADOPT A5** (as restrictions) | restriction: verified vendor data, confounded (null to negative at +10–29% cost); brief rules: design text | saves |
| 19 | Loop and stuck rules | V common core 11; L §8; O (8) | **P.** Review level only: `rules-detail.md:44` "Cap: 3 rounds", `:102`; `analyst.md:254` "at most two repair passes". Inside a phase: missing. | NOTE N6; detectors DEFER D2 | design constants, no data (O §5) | saves if it fires |
| 20 | Approval does not generalise; a denied action is not done another way | L §10; V §3 (8) | **A.** `rules-detail.md:27` "never reach the same effect through another tool, a script or an interpreter"; `:81` "a bypass is ask-first, per command"; `:94`; `:98` "an explicit yes … to the named action and files". | none | — | — |
| 21 | Adversarial verifier defaults (refute by default, anti-ratchet) | L §6; V §4 | **A / C.** `AGENTS.md:79` "review adversarially"; `backend-reviewer.md:84` "The engineer's row is a claim; yours is the check"; `rules-detail.md:107`. "Default to refuted when uncertain" conflicts with `rules-detail.md:44` "`Unverified` is reported but cannot block"; anti-ratchet is already the effect of that same line. | REJECT (R2) | design text | — |
| 22 | Reasoning-model handling; the "must not assume" list | L §11 | **P.** `AGENTS.md:85` speaks of effort without level names; `rules-detail.md:57` assumes a cache and side contexts exist. | NOTE N7; per-model prompt variants DEFER D3 | verified design facts; one unverified against the vendor doc | neutral |
| 23 | Emphasis style | V §1 (3) | not a rule; see finding (b). Rewording existing text is **C** (word-for-word constraint). | applied to new text only | vendor's own claim, no measurement | — |
| 24 | Instruction-file size versus cost | V common core 4; O §4 item 9, (11) | **A** as a rule: `rules-detail.md:35–36` measure before you trim, weigh before you add. See finding (a). | none | search-level | — |
| 25 | Memory: store only what cannot be re-derived | O (3); L §3 | **A.** `_shared/memory.md:28` "Admit only what the code cannot say"; `:25` "Patterns, not catalogs". | none | — | — |
| 26 | Memory: record how a note was verified | V §4 | **A.** `MemoryTemplates/PROJECT_MEMORY.template.md:5` "Every fact carries its evidence: a `path:line`, the command, or the user's dated words"; `memory.md:29` Verified header. | none | — | — |
| 27 | Memory: re-check a note against the code before relying on it | V §4; L §3 | **P.** `memory.md:31` Re-sync covers a stale fact "found while reading code"; `:29` covers the Commands block. A check before acting on a recorded path or symbol: missing. | **ADOPT A6** | design text, two harnesses; no data | costs one lookup; saves a wrong-path detour |
| 28 | Memory: prune or expire stale notes | V §4 | **C.** `memory.md:8` "Update, don't delete"; `:28` "'Nothing failed lately' is never a ground"; `LESSONS.md:26` "Lines are never deleted or compressed". | REJECT (R3) | runtime feature, no data | — |
| 29 | Raw tool output stays out of notes | O §6 rule 2 | **A.** Template `:39` "output path or first failing line", `:40` "Pasted output is trimmed"; `memory.md:27`. | none | — | — |
| 30 | Short progress text; outcome-first report | V common core 12; L §9 | **P.** `AGENTS.md:151` "Write compact bullets, not prose or transcripts"; `:177` "Reports are proportional". Narration per call: not addressed. | NOTE N1 | design text | saves output tokens |
| 31 | Untrusted content is data; git restraint; undo; unattended pre-flight | V common core 13–16; L §10 | **A.** `AGENTS.md:94`, `:114–115`; `rules-detail.md:31`, `:78–90`, `:94`. | none | — | — |
| 32 | Unexpected outside changes mid-task: stop and ask | V §2 (5); L §5 | **P.** `rules-detail.md:78`, `:80`, `:89` cover the start of work and staging. | REJECT under the owner's criteria (R4) | design text | neutral |
| 33 | A scratch "think" step between tool results | O §4 item 8 | **M.** | DEFER D1 | vendor's own, 2025 model, internally inconsistent figures | costs |
| 34 | Runtime-only mechanisms (loop detectors, output caps, lint-gated edit rejection, compaction triggers, tool-list freezing, forked children, edit-format choice, two-model split) | all three | **M** by design; the library is prose | DEFER D2 | mixed | — |
| 35 | State the token effect of every standing instruction | L §3 | **A.** README criteria `:16`; `rules-detail.md:36`. Followed in every draft below. | none | — | — |

Counts: already covered 12 (one of them, #21, also carries a conflict) · ADOPT 6 drafts covering 9 rows · NOTE 7 · DEFER 3 · REJECT 4.

## ADOPT items — exact draft text and targets

### New file `EngineeringTeam/_shared/work-loop.md` (50 lines; carries A1, A2, A3, A5 and notes N1–N7)

````md
# Work loop — inner-loop habits, read by section

Added 2026-11-18 (harness study). Not loaded at session start. Open the one section the moment calls for: search its heading, read that range. Nothing here overrides `AGENTS.md`, the constitution or the loaded role file. Every line holds on any host: where parallel calls, a prompt cache, side contexts or a sandbox are absent, the plain sequential form applies.

## Looking things up

Read at the first search of a phase, and whenever a read or a command is about to return a lot.

- Search, then read. Locate with the Code & Source Graph or a search before opening a file. Ask for file names or a count when that is the question; ask for matching lines with a few lines of context when the content is.
- Read a bounded range of any file longer than about 300 lines: the range the search pointed at, widened only when the next decision needs it. Shorter files are read whole. A shared library file (`_shared/*.md`) is read by section. Exception: a memory file is read whole before it is edited (`_shared/memory.md` → Edit in place).
- Bound a command's output before it runs: a filter, a count, a first-or-last-lines limit, a quiet flag. Output expected to pass about 100 lines goes to a file outside the repository, and that file is searched; the command is not run again to see another part.
- Send independent read-only lookups together in one step where the host allows it. Anything that writes, or that needs an earlier result, runs alone and in order.
- Do not repeat a read or a search whose result is still in context. Read again only when the file changed, the earlier output was cut, or a compaction removed it.
- An empty result describes the query, not the code. Before writing `none found`, widen once (another spelling, the parent folder, the graph) and record the command.

Token effect: saves on every later step, because what is read once is sent again with each step. Cost: none. Evidence: bounded reads and capped search results measured in 2024 on one older model, unmeasured since; keeping bulky output out of context cut cost by about half with no lower solve rate in one study. The 300 and 100 are stated defaults, not measured optima.

## Editing

Read before the first edit of a phase.

- Read the part of a file you are about to change, in this session, before changing it. A file you created or edited in this session needs no fresh read.
- Change by targeted edit on text that occurs once in the file. Rewrite a whole file only when most of its lines change.
- A successful edit is not read back to confirm it. A failed edit, or a file a formatter, generator, script or another writer touched since your last read, is read again before the retry.
- Edit in place: no `_fix`, `_v2` or `.bak` copy beside the original. Throwaway scripts, logs and captured output live outside the repository; anything kept in it is named in the report.
- After the edits to a file, run the cheapest recorded check that covers that file alone (parse, type-check or lint scoped to it) before building on it. Where `PROJECT_MEMORY.md` records no file-scoped check, go on to the phase's normal checks. This run is not an Evidence row unless it is the closing run.

Token effect: saves (no confirmation reads, no whole-file rewrites). The scoped check costs one call per edited file and removes later rework. Evidence: the check-after-edit gain was measured in 2024 on one older model and has not been re-measured; the rest is harness design text with no data.

## Side contexts

Read before starting any separate context or session for part of the work. Review independence, one writer and the model rules stay as `AGENTS.md` → Phase Protocol states them.

- Worth it for three things only: output that would flood this context and is not needed again (a broad search, a verbose build or log); independent read-only lookups that can run side by side; a reviewer that must not see the reasoning.
- Not worth it for work that takes one or two steps here, for coding steps that depend on each other, or to get a better answer. A side context starts cold, reads again what this one already knows, and pays for its own steps.
- Brief it completely; it sees nothing of this conversation. State: the goal and what done looks like; what is already known (paths, commands, decisions); the question, not a fixed list of steps; what it may touch (read-only unless it owns a worktree phase); the return format and a size (findings with `path:line`, a stated number of lines, no raw output).
- Do not delegate understanding. The decision, the synthesis and the reading of the final diff stay here; the context that merges delegated work runs the checks itself.
- While it runs, do not repeat its searches. When only waiting remains, end the turn; no sleep or poll loop.

Token effect: saves by restriction (each avoided side context saves its cold start; a sized return keeps the result small). Cost: none. Evidence: on coding tasks one vendor's own index shows no success gain from side contexts at 10–29% more cost; the briefing lines are harness design text with no data.

## Notes — unmeasured, one line each

- **Stuck.** The same call with the same arguments and the same result twice is not sent a third time: say what the result means, then change the arguments, the tool or the approach. After two failed attempts at one fix approach, stop patching: restate the task in one line, list the assumptions that could be wrong, then take a materially different approach or report `Blocked: <exact condition>`. Blocked means an outside condition seen more than once, not "hard" or "slow".
- **Claim scope.** A report claims no more than the scope column of its Evidence rows covers: a file-scoped or single-test run supports a claim about that file or test only.
- **Honest tests.** A test does not cover a behaviour when it writes the expected value into the path under test, re-implements the unit inside the test, starts past the changed code, or swaps the unit's own logic for a fake. Faking a boundary (clock, randomness, network) is fine.
- **Own diff.** Before the closing Evidence row, list what changed (`git diff <Baseline> --stat` plus untracked files) against the phase's `Owns:`: only intended files, no stray script, no test or configuration edit nobody asked for.
- **Bookkeeping.** One sentence before a group of actions, none per call. Update the task file when a phase's state changes, not after every call, and do not restate the plan in chat after writing it.
- **Order of text.** In anything read every session, stable text comes first and text that changes (dates, status, counts) comes last; an edit near the top of such a file makes every later step pay for the whole file again where the host caches a prefix.
- **Not assumed anywhere in the library:** that a prompt cache exists, that calls can run in parallel, that a side context or a sandbox is available, that effort levels share names across model families, that longer deliberation helps every model, that a step cap exists, or that the context size is fixed.
````

- **A1 (Looking things up).** Strengthens `AGENTS.md:92` (which files) with how much of each. Token effect: saves; the cost falls on demand only (the section is about 450 tokens, read once per phase).
- **A2 (Editing, first four bullets).** Strengthens `AGENTS.md:99`, `:101` and extends `memory.md:35` from memory files to code. Token effect: saves; on demand (the section is about 330 tokens).
- **A3 (Editing, last bullet).** Strengthens `backend-engineer.md:1474` by moving the cheapest check next to the edit. Token effect: costs one tool call per edited file, on demand; the saving is rework avoided, not measured on current models.
- **A5 (Side contexts).** Strengthens `rules-detail.md:49` and `:57`; it narrows the "cheap work may go to a separate context" clause without changing its words. Token effect: saves; on demand (about 400 tokens).

**Pointer line (the only per-role cost, about 45 tokens each time the role file loads).** Add as the last bullet under `## Required First Step` in the 13 files below. Without it nothing leads to the new file.

```md
- Inner-loop habits — lookups, edits, the check after an edit, side contexts, a stuck loop: `_shared/work-loop.md`, read by section at the moment one applies.
```

Files and heading lines: `Backend/backend-engineer.md:35`, `Frontend/frontend-engineer.md:34`, `DevOps/devops-engineer.md:32`, `Data/data-engineer.md:38`, `Data/data-scientist.md:37`, `ML/ml-engineer.md:37`, `ML/mlops-engineer.md:37`, `AI/ai-engineer.md:37`, `AI/prompt-engineer.md:37`, `AI/rag-engineer.md:37`, `AI/nlp-engineer.md:36`, `Quality/debugger.md:33`, `researcher.md:99`. Not added to the reviewer, QA, security, analyst, architect or planner files: their inner loop is their Mechanical Checks, and they are not the roles that edit.

Owner check before landing: `rules-detail.md:36` (Weigh before you add) asks that a new role-file line prevent a failure that was observed in the library's own work. These lines rest on outside evidence, not on a dated failure here. The honest options are (1) land the file and the pointer in one engineer role first and run a gate-style row per `EVALS.md:75–82` (turns and cost with and without), or (2) accept them on the outside evidence and record that as an owner decision.

### A4 — Compaction addendum in `EngineeringTeam/_shared/rules-detail.md`

Insert as a new section directly after line 69 (the existing Compaction / re-entry bullet stays word for word).

```md
## Compaction / re-entry addendum — checkpoint content and resume (added 2026-11-18, harness study)

- **The task file is the checkpoint.** At a phase end, and when the host signals a compaction is near, bring the task file up to date instead of writing a separate summary of the conversation. Besides the list above it holds: the one next action (or `Next: none established`); the working-tree state (`uncommitted` / `committed <sha>` / `pushed`); any command, path or error string the next step needs, quoted exactly; background work still running and how to check it.
- **Edit, do not stack.** A later checkpoint edits the Summary and Handoff lines in place; a line that is no longer true is replaced, not left beside its successor. Decisions, Approvals and Evidence rows stay append-only.
- **Raw output is not carried.** A checkpoint keeps the finding, its `path:line` and the command; output is a path, or at most its first failing line.
- **A summary holds conclusions, not live state.** After a compaction or in a new session, before the first write: `git status --short` and HEAD against the recorded sha, a fresh read of any file about to be edited, a check on recorded background work. A user message newer than the summary outranks it.
- **Resume without ceremony.** Continue from the next action. Do not restate the summary, acknowledge it, or redo work that carries an Evidence row.
- **When the host lets you choose what to drop,** drop old tool output first; ask for a model-written summary only when that is not enough.
```

- Token effect: neutral to write (four short fields); saves at every re-entry, because the next context reads the task file instead of re-exploring. Cost falls on demand (the section is about 300 tokens, read at a compaction or handoff).
- Strengthens `rules-detail.md:69` and the Handoff contract at `:15`.
- Evidence: the field list is convergent design across nine harnesses with no measurement; "drop tool output first" is the one verified cost result in the study.
- Optional companion, `MemoryTemplates/TASK_MEMORY.template.md`, new last bullet of `## Handoff` (about 35 tokens per task file):

```md
- Next action (one, or `none established`) / tree state (`uncommitted` | `committed <sha>` | `pushed`) / background work and how to check it:
```

### A6 — one line in `EngineeringTeam/_shared/memory.md`

Insert after line 31 (Re-sync), in the "Added 2026-10-19" list.

```md
- **Check before you rely (added 2026-11-18, harness study).** A recorded fact is history, not current truth. Before acting on a line that names a path, command, symbol or version, confirm it with one cheap lookup (the file exists, the symbol is found, the command is still in the manifest); a miss is fixed under Re-sync above. A decision recorded in the user's words is not re-checked this way: it stands until the user changes it.
```

- Token effect: costs one lookup per fact relied on; saves the detour a stale path causes. On demand.
- Strengthens `memory.md:29` (Verified header, Commands block only) and `:31` (Re-sync, which fires only when the stale fact is stumbled on).
- Evidence: design text in two harnesses; no data.

## ADOPT AS NOTE

All seven sit in the Notes section of the draft above, one line each, on demand, no pointer of their own.

- **N1 Bookkeeping and narration** (rows 1, 30). Design text in four harnesses; no data. Saves output tokens.
- **N2 Claim scope** (row 9). Search-level support. Generalises `backend-engineer.md:1471` to every role's report.
- **N3 Honest tests** (row 10). One harness's definition; no data. Candidate for `qa-engineer.md` only after a failure is observed here (`rules-detail.md:36`).
- **N4 Own diff** (row 12). Bundled result only. One cheap call; it catches spillover before a reviewer's Owns check turns it into a rework round.
- **N5 Order of text** (row 17). Library-authoring fact. The ordering advice is safe on any host; cache-marker advice is not and is left out.
- **N6 Stuck** (row 19). Unmeasured; the twos are conventions (harnesses use 2, 3, 4, 5 and 6 with no stated basis). Kept only because it is one on-demand line whose sole effect is to stop spending.
- **N7 Not assumed** (row 22). A check for library authors. Related existing wording: `AGENTS.md:85` "a switch discards the cached context" and `rules-detail.md:57` "subagents or headless flags" assume a cache and side contexts; both read correctly as "where the host has one", so no change is proposed.

Two facts for the owner, not for the library text: `LESSONS.md:15` ("Claude Code auto memory, Codex memories") and `_shared/memory.md:18` ("Hosts without such a store (Cursor)") name tools in prose, against the provider-agnostic constraint. `AGENTS.md` is 32,745 bytes; one harness in the notes caps instruction files at 32 KiB by default and another at 65,536 bytes for the whole chain, dropping broader files first, so the file's size is already at a real limit on some hosts.

## DEFER

- **D1 Scratch "think" step** (row 33). Vendor's own figures on a 2025 model, and the post's text and table disagree. Uncertain for current reasoning models; one lab tells its model to reason less.
- **D2 Runtime mechanisms** (rows 13, 17, 19, 34). Need harness code: output caps and trimming, loop detectors, lint-gated edit rejection, compaction triggers, tool-list freezing, forked children, edit-format selection, the two-model split. Prose can state these and cannot enforce them.
- **D3 Per-model prompt variants and reasoning replay** (row 22). Needs runtime, and a per-family rule set conflicts with the provider-agnostic constraint. The replay requirement is also unverified against the vendor's own documentation.

## REJECT

- **R1 Step-level todo list** (row 1). No isolated ablation; four strong open harnesses have none; it costs calls. The task file's phase list already gives a file-backed list.
- **R2 "Default to refuted when uncertain"** (row 21). Conflicts with `rules-detail.md:44`: an unverified finding cannot block. The anti-ratchet idea needs no text because that line already limits blocking to Confirmed or Probable.
- **R3 Pruning or expiring memory** (row 28). Conflicts with `memory.md:8`, `:28` and `LESSONS.md:26`. Volatile notes already have a home: `memory.md:24` "Anything stale within a week belongs in the task file".
- **R4 Stop on unexpected outside changes mid-task** (row 32). Sensible, but it neither saves tokens nor improves memory, and has no measurement, so it fails the owner's criteria. Recorded as a candidate should the owner widen them; `rules-detail.md:78–80` cover most of it.

## Library habits the evidence questions

Nothing here is a proposal to delete. A trim needs an `EVALS.md` run, and the owner decides.

- **Q1 Up-front planning path for features.** `AGENTS.md:84`; `planner.md:63`. Search-level: no consistent success gain for a strong model and higher cost; +11.6 points for the weakest one. The Sizing clause in the same line already limits the full path.
- **Q2 A gate on every task.** `AGENTS.md:96` Grill Checkpoint, "every role, every task". `EVALS.md:77` already calls existing gates candidates, and its reference datapoint (`:82`) is an unconfirmed benefit at about +37% turns.
- **Q3 A side context for cheap work.** `AGENTS.md:85` "cheap work (classification, file discovery) may go to a separate context on a small model"; `rules-detail.md:57`. Verified vendor data (confounded): no gain on coding at 10–29% more cost; one harness forbids delegation without the user asking.
- **Q4 Checkbox phase lists.** `TASK_MEMORY.template.md:17`. No ablation for task lists. Here the list is also the re-entry record, which the todo studies did not test.
- **Q5 Fixed round caps.** `rules-detail.md:44` "Cap: 3 rounds"; `analyst.md:254`. Design constants; no harness gives data for any such number.
- **Q6 Reproduce first.** `AGENTS.md:69`; `debugger.md:75`. Search-level: helps partly, and causes wrong abstention when a partial fix exists. The library's wording is already conditional (`debugger.md:79` "If you cannot reproduce, say so explicitly"), and the fail-before rule at `AGENTS.md:108` is the part the evidence supports.
- **Q7 Reviewer on a different model family.** `rules-detail.md:45`. The one vendor that ships this states the rationale and gives no measurement.
- **Q8 A keep-going line.** `AGENTS.md:77` "never stop and tell the user to start a new one"; `rules-detail.md:146` "Producing a spec and then stopping is a failure". A vendor's own claim (no data) says such lines now cause over-work, and two vendors advise a fresh session after many compactions. One long session also holds every role file read so far (finding a).
- **Q9 Query the code graph before searching.** `AGENTS.md:168`. No ablation was found for repository maps in either direction.
- **Q10 Long, rule-heavy role files.** Six files of 8,000 to 18,000 tokens. Search-level: context files gave no success gain at over 20% more cost; the harnesses have shortened their own prompts.
- **Q11 Emphasis.** See finding (b).
- Not a library habit: model-written summaries as the default compaction. The library uses the task file instead, which is what the evidence favours.

## Findings for the owner

### (a) Role-file size and what it costs

Tokens are estimated as bytes ÷ 4.

| File | Lines | Bytes | ≈ tokens |
|---|---|---|---|
| `Quality/security-engineer.md` | 1,496 | 72,843 | 18,200 |
| `Backend/backend-engineer.md` | 1,498 | 50,588 | 12,600 |
| `Frontend/frontend-engineer.md` | 1,246 | 47,198 | 11,800 |
| `Backend/backend-reviewer.md` | 1,179 | 40,702 | 10,200 |
| `Frontend/frontend-reviewer.md` | 898 | 34,758 | 8,700 |
| `Quality/qa-engineer.md` | 1,025 | 32,745 | 8,200 |
| `researcher.md` | 257 | 21,845 | 5,500 |
| `DevOps/devops-reviewer.md` | 242 | 20,634 | 5,200 |
| `architect.md` | 293 | 19,089 | 4,800 |
| `Product/planner.md` | 247 | 16,659 | 4,200 |
| `DevOps/devops-engineer.md` | 293 | 14,777 | 3,700 |
| `Product/analyst.md` | 271 | 13,924 | 3,500 |
| `AI/ai-engineer.md` | 126 | 11,457 | 2,900 |
| `Quality/debugger.md` | 249 | 10,734 | 2,700 |
| `AI/ai-reviewer.md` | 124 | 9,269 | 2,300 |
| `ML/ml-engineer.md` | 125 | 8,658 | 2,200 |
| `AI/prompt-engineer.md` | 107 | 7,998 | 2,000 |
| `AI/nlp-engineer.md` | 109 | 7,728 | 1,900 |
| `Data/data-engineer.md` | 118 | 7,429 | 1,900 |
| `AI/rag-engineer.md` | 110 | 7,101 | 1,800 |
| `Data/data-scientist.md` | 102 | 6,798 | 1,700 |
| `ML/mlops-engineer.md` | 112 | 6,724 | 1,700 |
| `ML/ml-reviewer.md` | 94 | 6,670 | 1,700 |
| `Data/data-reviewer.md` | 99 | 6,511 | 1,600 |
| All 24 role files | 10,420 | 482,839 | 120,700 |

Always or often loaded besides these: `AGENTS.md` 32,745 B (≈ 8,200 tokens, every session); `LESSONS.md` 8,981 B (≈ 2,200) plus an area file (≈ 600 to 3,300); `rules-detail.md` 47,803 B (≈ 12,000 if read whole); `memory.md` 10,878 B (≈ 2,700).

What the evidence implies:

- A file read into the context is sent again with every later step. In a full-path backend feature run in one session, as `AGENTS.md:77` asks, the role text read by the end is about 61,700 tokens (analyst 3,500 + architect 4,800 + planner 4,200 + backend-engineer 12,600 + backend-reviewer 10,200 + security-engineer 18,200 + qa-engineer 8,200), on top of about 11,000 to 14,000 for `AGENTS.md` and lessons. Earlier role files are not unloaded at a role switch; they leave only at a compaction.
- Search-level evidence: repository context files gave no success gain at over 20% more cost; the fixed preamble is re-sent every step, but 96–99% of input tokens were cache hits in one study, so where the host caches, the money cost is well below the token count. The context-window room is used in full either way.
- Vendor guidance (their own claim): under 200 lines per always-loaded file. `AGENTS.md` is 196 lines but its lines are long; six role files are 900 to 1,500 lines.

Options under "measure before you trim":

1. Run the queued `EVALS.md` A/B #1 (`backend-engineer.md` full versus a core plus references variant). It is already first in the queue (`EVALS.md:56`) and it decides whether the six large files may be split.
2. No eval needed, existing rule: run review, security and QA in an isolated context, as `AGENTS.md:80` prefers. That keeps about 36,600 tokens of role text (backend-reviewer, security-engineer, qa-engineer) out of the main session.
3. No eval needed, lossless relocation (the precedent is `EVALS.md:89`): move the "previous wording, verbatim" blocks out of the files agents read. They are about 6,000 bytes in `rules-detail.md` (lines 124–146), 733 in `memory.md` (lines 37–39) and about 1,000 in `graph.md`: roughly 1,900 tokens whenever those files are read whole.
4. Read shared files by section (in draft A1). `rules-detail.md:3` already says "Read a section"; `memory.md` and `graph.md` say "read this file".
5. Run the 2026-10-18 duplicate-block candidates (`EVALS.md:90`) as their own A/Bs: 19 identical blocks between the two reviewers and 11 between the two engineers.

### (b) Capital-letter and bold emphasis

Method: whole-word matches of a fixed list of emphasis words in capitals (MUST, NEVER, ALWAYS, NOT, ONLY, NO, DOES, FIRST, AND, EMPTY and similar); EARS keywords excluded. Bold counted as `**…**` spans, and "emphatic" where the span contains never, must, always, do not, only, mandatory, blocking, strongly or every.

| File | Capital emphasis words | Bold spans | Emphatic bold spans |
|---|---|---|---|
| `AGENTS.md` | 3 | 56 | 17 |
| `_shared/rules-detail.md` | 7 (2 are the status token `NOT REVIEWED`) | 101 | 27 |
| `_shared/memory.md` | 0 | 28 | 7 |
| `_shared/graph.md` | 0 | 13 | 4 |
| `LESSONS.md` | 8 | 7 | 1 |
| `LESSONS/data-ml-ai.md` | 8 | 1 | 0 |
| `LESSONS/tooling-agent-workflow.md` | 4 | 1 | 0 |
| `LESSONS/backend.md`, `LESSONS/frontend.md` | 2 each | 1 each | 0 |
| `Product/planner.md` | 4 (severity label `CRITICAL`) | 20 | 8 |
| `researcher.md` | 2 | 37 | 4 |
| `Quality/qa-engineer.md` | 2 | 13 | 3 |
| `Quality/security-engineer.md` | 1 (inside a search pattern) | 42 | 6 |
| `DevOps/devops-reviewer.md` | 1 (status token) | 27 | 8 |
| `EVALS.md` | 0 | 47 | 7 |
| The other role files | 0 or 1 each | 5 to 23 each | 0 to 6 each |

Examples: `AGENTS.md:82` "MUST get a `security-engineer` review"; `AGENTS.md:88` "work that DOES span sessions"; `rules-detail.md:65` "you MUST re-read the changed code from scratch"; `LESSONS.md:46` "an EMPTY scope"; `LESSONS.md:48` "but NO caller"; `LESSONS/tooling-agent-workflow.md:13` "a PIPED exit code … the LAST command's status"; bold: `AGENTS.md:79` "**strongly prefer**", `:82` "**Mandatory security review (blocking, never skippable).**", `:96` "**Grill Checkpoint (mandatory, every role, every task).**".

Reading: capital-letter shouting is rare, about 45 words in the whole library, most of it in lesson lines the owner keeps verbatim. Bold is used mainly as a bullet label, which is not what the vendor retired. The retirement itself is a vendor's own claim with no measurement, and it names one model family. Rewording existing rules also conflicts with the word-for-word constraint. No change is proposed; new text in this file uses neither.

### (c) The five changes that would save the most tokens

How estimated: instruction text as bytes ÷ 4 from the measured file sizes; code as about 10 tokens a line (assumption); "held" means the text stays in context and is sent again with each later step. Session shapes are assumptions, not measurements. Where the host caches a prefix, the money saved is smaller than the tokens saved.

| Rank | Change | Rough saving per session | Gate |
|---|---|---|---|
| 1 | Keep review, security and QA role files out of the main context (existing preference, `AGENTS.md:80`), and decide the large-file split by A/B #1 | about 36,600 tokens held on a full-path backend feature from isolation alone; a core plus references split of the six large files could add roughly 20,000 to 30,000 if the A/B allows it (halving assumed) | isolation: none; split: `EVALS.md` A/B #1 |
| 2 | Bounded reads and bounded command output (A1) | 20,000 to 50,000 tokens held, assuming five reads of 500 to 1,500-line files become 100 to 200-line ranges, plus one or two long command outputs | owner approval; outside evidence only |
| 3 | No confirmation re-reads and no repeat reads (A1, A2) | 10,000 to 30,000 tokens held, assuming ten edits on files of about 300 lines each read back once | owner approval |
| 4 | Checkpoint in the task file with next action and tree state; resume without re-exploring (A4) | 10,000 to 30,000 per compaction or new session, assuming the re-exploration it avoids is 5 to 12 file reads | owner approval |
| 5 | Section reads of shared files, plus relocating the "previous wording" blocks (A1, option 3 above) | about 10,000 to 11,500 each time `rules-detail.md` is consulted for one rule instead of read whole; about 1,900 from the relocation | none (lossless relocation has precedent) |

Close behind: restricting side contexts (A5) saves the cold start of each one avoided, about 8,200 tokens for `AGENTS.md` alone plus a role file when it loads one, against a verified 10–29% cost increase where delegation was the default.

## Coverage

- Read in full: `README.md` of this folder; `01-vendor-harnesses.md`; `01-deepseek-and-other-labs.md`; `01-open-source-and-evidence.md`; `AGENTS.md`; `_shared/rules-detail.md`; `_shared/memory.md`; `LESSONS.md`; `LESSONS/tooling-agent-workflow.md`; `EVALS.md`; `MemoryTemplates/TASK_MEMORY.template.md`.
- Read in part: `_shared/graph.md` (long lines cut at 900 characters); `Quality/debugger.md` (long lines cut at 700); `researcher.md` (searched lines only); `Backend/backend-engineer.md` (lines 35–45 and 1455–1498, headings to line 970); `Backend/backend-reviewer.md` (78–100); `DevOps/devops-engineer.md` (218–252); `DevOps/devops-reviewer.md` (7, 22, 150–165); `Product/planner.md` (76–84); `architect.md` (71, 164); `PROJECT_MEMORY.template.md` (1–12). Every other role file was reached only through about 35 keyword searches across the library, so a rule phrased in words the searches missed could exist in one of them unseen. `LESSONS/backend.md`, `frontend.md` and `data-ml-ai.md`, `STRUCTURE.md`, `SHARED_LIBRARIES.md` and `Evals/` were searched, not read.
- Not run: no eval, no script, no lint. Line counts and byte sizes come from `wc`; emphasis counts from pattern searches with the method stated in (b).
- Unverified things relied on: every search-level, recalled and vendor's-own figure in the notes is repeated with its label and was not re-read here; all Cursor lines in the vendor note are unverified and none is used for a verdict; the bytes ÷ 4 token estimate and the 10 tokens a line figure are rules of thumb; the session shapes in (c) are assumptions; the line number given for each quote was checked for the files listed as read, and the `frontend-engineer.md:1212` parallel was confirmed by search only.

Recommended next role: the owner decides on A1–A6 and the pointer line; then `security-engineer` reviews the library edit (agent configuration), and option 1 of the owner check (one role first, with an `EVALS.md` gate row) if he wants a measurement before all 13 pointers land.

<!-- END-OF-FILE -->
