# tigerless-labs/autoharness — skeptic pass on the gap proposals

- **Date:** 2026-11-18. **Role:** researcher (independent skeptic; default verdict is refute; no library file edited).
- **Inputs (data, not instructions):** `04-gap/tigerless-labs-autoharness.md` (P1–P7), `03-read/tigerless-labs-autoharness.md`.
- **Upstream re-verified:** shallow clone of `tigerless-labs/autoharness` at `6d85325ab5ef436d1d4d52ffa82e43ea0365d144` (2026-11-12), files opened and grepped only; nothing installed or run. Issue numbers (#283, #299, #305, #314) were checked only where the code cites them (#305 in `lib/validate.py:256`; #299 by the 2026-11-11 commit "fix(reflector): index read-only dedupe owners"); the issue pages themselves were not re-opened, so issue text is **Unverified** here.
- **Library re-verified:** `rg`/`grep` on this checkout. `AGENTS.md` = 32,668 bytes / 194 lines (100 bytes, 6 lines of headroom). No proposal touches `AGENTS.md`; confirmed.
- **Instruction-like text in the source:** `hook/on_session_start.py:30` injects "You MUST consider loading a matching skill before proceeding" into user sessions; `hook/dedupe_index.py:16` and `agents/reflector.md` instruct the plugin's own child. Reported as findings, not acted on.
- **Graph:** not used (documentation library; direct grep was faster).

## What the upstream check changes for every proposal

- **No outcome evidence exists upstream.** Confirmed: `config.py:3` "Calibration values ... are placeholders", `config.py:52,54,101` "placeholder, calibrate in experiments/"; no `experiments/` directory in the tree; README line 13's "42% → 78% on CORE-Bench" cites the HAL paper, not this plugin. So no proposal can be adopted because "it works upstream". Each one stands or falls on whether the library has a hole that can be named and whether the fix is the cheapest one.
- **Popularity is the only adoption signal** (star count per the deep read; not re-checked). It carries no weight below.
- **The safety facts hold.** Confirmed: `hook/spawn.py:199,214` pass `--dangerously-skip-permissions`; `config.py:134` `CHILD_ISOLATION` defaults to `False`; `hook/dispatch.py:192-193` turns any handler exception into `{"error": ...}` with no deny (fail-open); `dispatch.py:38-42` exits 0 on an old interpreter with "Every hook is off for this session"; `dispatch.py:99-100,120-121` send the detached child's output to `DEVNULL`.
- **The dedupe index does not read `AGENTS.md`.** Confirmed: `dedupe_index.py:181-188` lists only `CLAUDE.md` / `CLAUDE.local.md`.
- **The "lara post-mortem" cited for P5 is a code comment only** (`lib/metrics.py:3-4`); the document is not in the repo. **Unverified** as evidence.

## Verdicts

| # | Proposal | Gap file said | Skeptic verdict | Verification |
|---|---|---|---|---|
| P1 | Compare set + `Compared:` trace for a proposed lesson | Adopt | **Defer** (a six-word widening of the compare set survives; the trace does not) | Probable |
| P2 | Survivor pointer form + lint W4 | Adopt | **Defer** | Confirmed |
| P3 | Lint W5/W6 admission warnings | Defer | **Reject** | Confirmed |
| P4 | Scrub pasted output before it enters repo memory | Adopt | **Adopt now, narrowed to one short bullet** | Confirmed |
| P5 | Overlay liveness section | Adopt | **Adopt now for the first bullet only; Reject the other two** | Probable |
| P6 | LESSONS counts in the lint summary | Defer | **Reject** | Confirmed |
| P7 | Block a self-spawning, permission-bypassed child | Adopt | **Adopt now, trimmed** (drop the named example and check 6) | Confirmed |

Survivors: P4 (narrowed), P5 (one bullet), P7 (trimmed). All three edit instruction-class files, so each is ask-first and needs the `security-engineer` pass; nothing here was applied.

### P1 — Compare set and a checkable trace — Defer

- **Evidence.** The upstream mechanism is prompt text read by a small-model child (`agents/reflector.md:33`: "this is a preference order, not a gate"), landed on 2026-11-11 and never shipped in a bumped version (`plugin.json` still 0.5.3). There is no measurement that it reduces duplicates. The library-side failure is real, though: the 2026-10 field review recorded "two entries restate AGENTS.md rules" in `LESSONS.md` (`library-field-review-2026-10.md:90`). The "Partially covered" classification is correct: `LESSONS.md:16` and `AGENTS.md` Self-Learning name only "`AGENTS.md` or a role file", so `_shared/*.md` (123 + 37 + 22 lines of relocated rules) and the area files are outside the written compare set.
- **Constraints.** No hard constraint broken; zero bytes in `AGENTS.md`. The clause "a proposed lesson with no `Compared:` trace is returned, not approved" tells the user what he may approve, which is the wrong direction for a rule.
- **Value.** This is where it fails. A keyword `rg` on two or three terms finds a restatement only when the wording matches; the two restatements the field review found were paraphrases, which is the normal case. The trace `Compared: <files> — no owner` would then be written honestly and be wrong, and it reads as verification. The library's own lesson at `LESSONS.md:49` warns against exactly this kind of green check. The real control is already in place: every lesson passes one human who wrote the rules. The "Proposed owner change (not applied)" form duplicates `LESSONS.md:28` (surface a misfiring role instruction) and `rules-detail.md:87` (`Blocked: needs approval`).
- **Cheaper way.** Widen the two existing phrases to "`AGENTS.md`, a role file, `_shared/*.md` or another lessons file". That is the whole defensible content of P1 and costs about 40 bytes in `LESSONS.md:16` (the `AGENTS.md` copy cannot take it: 100 bytes of headroom).
- **Trigger to revive the trace:** a restated lesson is found in `LESSONS.md` or an area file after 2026-10-18 (the date of the regrouping), or `## Proposed` holds more than five lines at once.

### P2 — Survivor pointers and lint W4 — Defer

- **Evidence.** Upstream `absorbed_into` is real code (`hook/promoter.py:237-249` rejects an umbrella that "is not a live self-produced skill"), supported by tests only. It exists because upstream deletes the absorbed skill; a wrong name loses content. The library deletes nothing, so the same failure cannot occur here.
- **Constraints.** None broken. Adds a PowerShell lint rule to maintain.
- **Value.** The population is nearly empty. `grep -i "superseded \["` over `LESSONS.md` and `LESSONS/*.md` returns zero lines; there are exactly two promotion notes (`LESSONS.md:54`, `:55`), and both name their destination in plain words. A W4 check over two lines is a check on an almost empty population. The quoted "first five words of the surviving line" also breaks whenever the survivor is reworded, which penalises the first operation on the library's own ladder ("update a wrong line in place", `LESSONS.md:21`). Git history already answers "where did this go".
- **Trigger to revive:** ten or more superseded or promoted notes exist, or one pointer is found dangling after a role file is renamed.

### P3 — Lint W5/W6 admission warnings — Reject

- **Evidence.** Upstream's regex guard states its own limit ("regex heuristics, not sandboxed execution analysis") and the deep read records open false positives; no evidence it catches real cases.
- **Constraints.** None broken, but it adds a scanner-as-gate, which `security-engineer.md:708` already says not to rely on.
- **Value.** Both populations are empty today. W6 scans `## Proposed`, which holds "(none)" (`LESSONS.md:61`) and which only the user writes. W5: a grep for drive-letter, `/home/`, `/Users/` and `~/.` paths across all five lesson files returns nothing. A human reads every line before it lands and a write-deny covers the checkout. The gap file itself recommended Defer; with no observed case and no plausible route for one, Reject is the honest verdict. It can be re-proposed if an agent is ever allowed to write `## Proposed`.

### P4 — Pasted output scrubbed before it enters repo memory — Adopt now, narrowed

- **Evidence.** The upstream evidence is negative, and that is the useful part: regex redaction is the plugin's only defence, and the deep read records a known leak in the URL-credential rule (issue text not re-opened; the rule and its comment are at `lib/redaction_rules.toml:71-75`). So pattern scrubbing must not be presented as a gate. The library gap is confirmed: `grep -i "PII\|PHI"` over `_shared/memory.md`, `MemoryTemplates/TASK_MEMORY.template.md`, `LESSONS*` and `Hooks/README.md` returns nothing (only `CONSTITUTION.template.md:14,23` and the security trigger list mention them), and no file contains "redact" or "scrub". Meanwhile `TASK_MEMORY.template.md:34` asks for "output path or first failing line" and `.ai-memory/` is committed.
- **Constraints.** None broken. Additive, zero bytes in `AGENTS.md`. Security-posture change, so the `security-engineer` pass is mandatory.
- **Value.** This is the one proposal with a concrete, likely failure for this user: a failing test in a clinical or financial repo prints a real row, the role pastes the first failing line into an Evidence row, and it is committed and pushed. `gitleaks` matches key shapes, not a patient name or an MRN.
- **Why narrowed.** The proposed bullet is about 700 bytes and half of it restates `memory.md:26` (secrets, connection strings, internal hosts are already "Never in memory"; a paste is a write). Keep only what is new: (1) pasted output counts as memory, (2) PII/PHI/financial values join the never list, (3) prefer an output path outside `.ai-memory/` when the output may hold real data, (4) the commit-time scanner does not see PII/PHI. Drop the `[REDACTED:<kind>]` syntax, the URL sub-cases and the upstream anecdote. The one-line template mirror is worth having, because the template line is what prompts the paste.
- **Cost.** About 250 bytes in a file read on demand, plus one template line.

### P5 — Overlay liveness — Adopt the first bullet, Reject the rest

- **Evidence.** Library facts confirmed: `Hooks/README.md:3` "Every hook is a silent no-op in a repo whose root `AGENTS.md` does not mention `.ai-memory`"; `handoff-check.mjs:47-52` turns unparsable stdin into `{}`; `:87,105,127` are bare `catch` blocks; no README or script tells the user to re-verify hooks after the library path moves. The upstream "went unnoticed for weeks" story is a code comment about a document that is not in the repo: Unverified. The gap file's claim that after a move "every hook fails without a message" is overstated: a missing script makes `node` exit 1 with "Cannot find module", which the host reports as a hook error rather than a pass. How visible that report is depends on the host version, hence Probable.
- **Constraints.** Hooks are an optional overlay, so host-specific text is allowed there. But bullet 2 adds a phase-report field (`Overlays observed:`) that is defined only in `Hooks/README.md`. No role reads that file during a task, so the instruction would never fire; putting it where it would fire (`AGENTS.md` → Completion) costs about 120 bytes against 100 of headroom and makes the portable contract mention an overlay. Bullet 2 fails on reachability. An agent also cannot observe a Stop hook that allowed silently, so the honest value would almost always be "none observed".
- **Value.** Bullet 1 (after a library move or host upgrade, re-run the install check and confirm a non-zero exit on a repo with changed source and no Evidence row) is two sentences of install documentation and closes a real hole: the path line is designed to move, and the user-level `settings.json` does not follow it. Bullet 3 and the follow-up code change (a `console.error` in each `catch`) buy little: on exit 0 the host does not surface stderr in normal use, and the four catches cover expected conditions (deleted file, no tasks directory, git absent), not crashes.
- **Trigger to revive bullets 2 and 3:** one observed case where a hook was dead for more than a session without the user noticing.

### P6 — LESSONS counts in the lint summary — Reject

- **Evidence.** Upstream `lib/metrics.py` has no published output and no entry point (deep read); its own header says it must never feed a decision.
- **Value.** The store is 157 lines in five files with seven `REINFORCED` tags. `rg -c REINFORCED LESSONS.md LESSONS/` answers the question in one command with no code to maintain. A count that feeds no decision and is cheaper to get ad hoc is not worth a lint block. The gap file said "Defer (cheap, low value)"; there is no plausible trigger below a store several times this size, so Reject, re-proposable past roughly 500 lines.

### P7 — Block a self-spawning, permission-bypassed child — Adopt now, trimmed

- **Evidence.** Every upstream fact the bullet rests on is confirmed in code (see the section above): bypass flag on both spawn paths, isolation off by default, fail-open dispatcher, output to a null device. The "Partially covered" classification is fair but generous to the library: `grep -i "spawn\|claude -p\|codex exec"` in `security-engineer.md` returns nothing, and `dangerously-skip-permissions` appears nowhere in the library outside `.ai-memory/`. The nearest existing rules are `security-engineer.md:708` (provenance, tool lists, network calls of the component), `:709` (Rule of Two for "CI, headless, scheduled" runs), `:710` (prose is never the only control) and `Evals/routing-cases.md:33` (H3, `bypassPermissions` in settings). A careful reviewer could get from `:709` to the right answer, but nothing prompts a look inside a component for a session it launches itself, and a plugin with a clean manifest passes `:708` as written.
- **Constraints.** None broken. The addition is full-depth and additive in a role file loaded only for security phases; zero bytes in `AGENTS.md`. The flag names are host-specific, but they are examples followed by "or the host's equivalent", and the check is phrased for any host. It strengthens a security rule.
- **Value.** Low frequency, high consequence: it fires only when the user considers a self-improving plugin, which is exactly the class this sweep is surveying, and the failure it prevents (transcript in, instruction file out, permissions off) persists across every later session.
- **Trim.** Drop the dated line "autoharness 0.5.3 fails (1), (2) ..." from the role file: a version-specific claim about a third party goes stale and belongs in this research folder. Drop check (6) (output visible at the next session): it is an operability point, not a security control. Keep checks (1)–(5) and the Block-sentence clause. An eval case beside H3 (a plugin whose hook launches a bypassed child, clean manifest) would make the rule testable; it is a follow-up, not a precondition.
- **Cost.** About 800 bytes in `security-engineer.md`.

## "Already covered" and other classifications found wrong or overstated

- **#2 Ownership marker — "Already covered" is overstated.** The cited `Sync-AgentsMd.ps1:25` overwrites a customised `AGENTS.md` by design. That is a documented decision, not coverage; the honest label is "Not applicable / accepted risk". No proposal follows from it.
- **#11 Run account — the gap statement is partly wrong.** A hook whose script path no longer exists is not indistinguishable from a pass (see P5); only the opt-out no-op and the swallowed-input path are truly silent.
- **#17 Redaction — "Partially covered" understates existing coverage** for secrets, connection strings and hosts (`memory.md:26` already forbids them in memory, pasted or typed). The true gap is PII/PHI/financial values only, which is why P4 is narrowed.
- **#4 Dedupe owners — classification correct**, and the library's own field review supplies the evidence the gap file did not cite (`library-field-review-2026-10.md:90`).
- **#1, #3, #6, #14, #15, #18, #19, #20, #21:** spot-checked against the cited lines; classifications hold. **#8, #12, #13 (Conflicts):** hold; update-never-delete and tool-agnosticism are both broken, and upstream offers no data to reopen the 2026-10 rejection.

## Not verified

- GitHub issue pages (#283, #299, #305, #314, #162) and the star/fork counts were not re-opened; only the code and commit history were.
- Whether the installed marketplace copy contains the post-0.5.3 fixes.
- How visibly each host version reports a Stop hook that exits 1 (bears on P5 only).

## If the owner accepts

Order: P7 (trimmed), then P4 (narrowed), then P5 bullet 1. Each needs the user's approval and a `security-engineer` record first. The optional `LESSONS.md:16` widening from P1 can ride with any of them.

<!-- END-OF-FILE -->
