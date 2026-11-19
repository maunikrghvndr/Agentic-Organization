# Discover — lens "trending-meta" (GitHub trending, search API, awesome-lists, vendor posts)

- Role: `researcher`. Run date: 2026-11-18 (non-interactive workflow step). Window: created or majorly updated since 2026-04-01.
- Restatement: list 20-30 real, opened candidates (repos + vendor documents) on agentic software development that an agent instruction library could learn from; no evaluation or adoption decision in this step.
- Assumptions (stated defaults): stars / push dates are as returned today and are not audited for inflation; "mechanism" lines come from each repo's README only (no code read, nothing installed or executed); exclusions honoured (Hermes Agent, BMAD-Method, OpenSpec, Spec Kit, Kiro, cc-sdd, Multica, Letta Code).

## Method and limits

- `gh` was unusable (token rejected), so the unauthenticated GitHub REST search API was used instead: `GET https://api.github.com/search/repositories?q=<term>+created:>2026-04-01&sort=stars&order=desc&per_page=30` for nine terms (`agent`, `claude`, `skills`, `topic:claude-code`, `topic:ai-agents`, `agents.md OR spec-driven OR "coding agent"`, `codex`, `harness OR subagents OR "context engineering"`, `awesome agent`).
- GitHub trending fetched with WebFetch: `https://github.com/trending?since=weekly` and `?since=monthly` (the daily page was not fetched).
- Every listed repo was opened: `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md` returned HTTP 200 and the README was read. Column "Verified" = `S` (search API row with stars/created/pushed) + `R` (README 200), `T` (seen on a trending page).
- Hacker News: **not covered** — `hn.algolia.com` is refused by this session's egress proxy. Cursor, Google and GitHub engineering blogs: **not fetched** in this run. OpenAI: one WebSearch only, original post not opened (listed separately as unverified, not as a candidate).
- Star counts in this window are very large for several young repos; they are reported as observed, not as a quality signal.

## Candidates — repositories (27)

| # | owner/repo | Stars | Created | Last push | What it does | Mechanism an instruction library could learn from | Verified |
|---|---|---|---|---|---|---|---|
| 1 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 193,065 | 2026-06-12 | 2026-10-29 | One-prompt skill that makes an agent write only the code the task needs | A "ladder": read the touched code and trace the real flow first, then pick the smallest rung (reuse what the repo/platform already has before a library or hand-built code); explicit floor "never cut validation, error handling, security, accessibility"; ships a compact `AGENTS.md` form of the same prompt; with/without benchmark published (39 tasks, 5 runs each) | S+R |
| 2 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | 121,070 | 2026-04-04 | 2026-11-17 | Skill + local proxy that shortens agent output and compresses tool output | "Blocks": the agent keeps scripts it writes and reruns them instead of rewriting each session (README: 397 -> 76 tokens for one test run); separates "say less" (output style) from "read less" (tool-output compression); README reports its own losing cases | S+R |
| 3 | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | 74,804 | 2026-06-18 | 2026-09-14 | Six-phase security audit skill run by isolated agents | `coverage-ledger.json` assigns hunters by ledger unit and coverage critics look for gaps; every candidate goes to a fresh verifier that tries to disprove it; findings are records (`confirmed` / `needs_validation` / `rejected`) validated against `report-schema.json`; the report is derived from the verified records, not written freehand | S+R+T |
| 4 | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) | 61,509 | 2026-05-13 | 2026-10-19 | Output-shape skill: answer first, numbered steps, no filler | Ten checkable output rules (lead with the next action, restate state every turn, end with one concrete next step, cap lists at 5, no preamble/recap/closer) | S+R |
| 5 | [alibaba/open-code-review](https://github.com/alibaba/open-code-review) | 53,735 | 2026-05-18 | 2026-11-17 | Code-review CLI: deterministic pipeline plus tool-using agent | Deterministic file selection and template-engine rule matching per file (path-filtered rules) before the model sees anything; README claims higher precision/F1 than a general agent at ~1/9 the tokens and admits lower recall; benchmark AACR-Bench (200 PRs, 1,505 annotated issues) | S+R+T |
| 6 | [ifixai-ai/iFixAi](https://github.com/ifixai-ai/iFixAi) | 46,227 | 2026-04-27 | 2026-11-18 | Audits an agent inside a simulation of the business | Role/authority fixture in YAML (`ifixai author reference`, `validate`) that the agent is tested against, including requests that push it past its role; judge model picked from a different provider than the agent under test | S+R |
| 7 | [google-labs-code/design.md](https://github.com/google-labs-code/design.md) | 28,926 | 2026-04-10 | 2026-11-17 | Format spec for describing a visual identity to coding agents | One file combining machine-readable tokens (YAML front matter) with prose rationale: exact values plus the "why" in the same place | S+R |
| 8 | [google/elephant-goldfish-model](https://github.com/google/elephant-goldfish-model) | 20,804 | 2026-09-13 | 2026-11-17 | Plugin for drafting and reviewing software specs | "Elephant" holds context and drafts; "Goldfish" reviewers read only the draft and referenced sources, never the earlier conversation; `/egm-review-loop` with chosen reviewers and document standards; `/egm-drift-report` compares design docs to the code; agreed direction saved as `concepts_brief.md` | S+R |
| 9 | [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) | 19,126 | 2026-05-08 | 2026-11-17 | Text-space optimizer that trains natural-language skills for frozen models | A skill edit is kept only if it improves a held-out validation score; textual "learning-rate" budget and rejected-edit buffer; SkillOpt-Sleep nightly cycle harvest -> mine -> replay -> consolidate behind the held-out gate | S+R |
| 10 | [microsoft/TokenEconomizer](https://github.com/microsoft/TokenEconomizer) | 7,511 | 2026-10-13 | 2026-11-17 | Plugin that cuts coding-agent cost from past sessions in a repo | Micro-skills: a repo fact is injected only after three sessions confirm it and dropped when later sessions contradict it; tool pruning by measured non-use; loop guard: judge model, confidence >= 0.7, at most one redirect per turn, never stops the turn itself | S+R |
| 11 | [tigerless-labs/autoharness](https://github.com/tigerless-labs/autoharness) | 11,171 | 2026-06-09 | 2026-11-12 | Self-maintaining learned-skill layer for Claude Code | Reflector compares a new episode with existing skills and read-only owners (CLAUDE.md, plugin skills, auto-memory) before creating, merges same-scenario skills, prunes unused ones, touches only skills it wrote; per-skill ledger of each create/update decision; survival measured by adherence in later turns | S+R |
| 12 | [trailhq/Trail-Code](https://github.com/trailhq/Trail-Code) | 11,321 | 2026-07-03 | 2026-11-17 | Code map (call index) plus team "learnings" for coding agents | A learning is a file; learnings about the code are committed with the code; seeds itself once from past sessions with "what you told the agent more than once" | S+R |
| 13 | [cobusgreyling/loop-engineering](https://github.com/cobusgreyling/loop-engineering) | 11,798 | 2026-06-09 | 2026-11-17 | Pattern library for unattended agent loops around a repo | Each pattern has a cadence, a cost class and an autonomy level; "week one is report-only" (L1 report before L2 cautious writes); `loop doctor` scores the setup | S+R |
| 14 | [FailproofAI/failproofai](https://github.com/FailproofAI/failproofai) | 9,632 | 2026-04-06 | 2026-11-17 | Hook-based observability and tool-call blocking across 12 harnesses | Per-harness enforcement matrix stating what can actually be blocked where (pre-tool on all 12, turn-end gates on 8); a default policy that stops the agent from switching the enforcement off | S+R |
| 15 | [tryatlas/atlas](https://github.com/tryatlas/atlas) | 9,446 | 2026-05-14 | 2026-11-17 | Records agent sessions and links them to the commits they produced | Prompt-to-commit provenance on a shared team timeline ("which prompt shipped which line") | S+R |
| 16 | [vercel-labs/deepsec](https://github.com/vercel-labs/deepsec) | 8,429 | 2026-04-30 | 2026-11-16 | Agent-powered vulnerability scanner for large repos | All state and findings in one `.deepsec/` folder; an interrupted run is resumed by re-running the same command, skipping files already analysed | S+R |
| 17 | [anthropics/defending-code-reference-harness](https://github.com/anthropics/defending-code-reference-harness) | 7,760 | 2026-05-22 | 2026-08-06 | Reference skills + harness for vulnerability discovery and patching (marked unmaintained) | recon -> find -> verify/triage -> report -> patch as separate steps; `/threat-model` before `/vuln-scan`; README states which commands only read/write files and which execute | S+R |
| 18 | [openai/codex-security](https://github.com/openai/codex-security) | 13,959 | 2026-07-13 | 2026-11-18 | CLI/SDK to find, validate and fix vulnerabilities | Validation of candidate findings and verification of fixes as their own steps; deep scan = repeated standard scans with deduplicated findings; severity assessed against the user's own rubric; saved threat models and `SECURITY.md` drafting | S+R+T |
| 19 | [google-research/harness2](https://github.com/google-research/harness2) | 24,293 | 2026-10-06 | 2026-11-02 | Framework for recursive harness refinement with frozen weights | Propose-Probe-Compose: propose harness edits, probe them on the same task, compose from behavioural contrasts without ground truth; a persistent "improvement harness" keeps adopted harnesses and evidence-supported lessons | S+R |
| 20 | [PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) | 22,805 | 2026-05-08 | 2026-11-17 | Coding/research agent built on a persistent REPL | "Continual Harness": supplemental prompts, memories, skill descriptions and subagent specs held as durable state, refined through "small, evidence-backed updates" | S+R |
| 21 | [JetBrains/thinkrail](https://github.com/JetBrains/thinkrail) | 8,330 | 2026-07-08 | 2026-11-17 | Agentic IDE around the `pi` agent with spec-driven development | Spec graph shown as a tree as durable project knowledge; one `git worktree` workspace per task; skill catalogue size shown, large libraries listed within a small prompt budget | S+R |
| 22 | [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) | 9,439 | 2026-08-07 | 2026-11-17 | Rulebook that filters generic AI UI, text and code | 40 rules in three tiers with a mandatory PASS/FAIL report ("Delivery Gate"); a filter, not a style guide: UI output without a `DESIGN.md` is labelled a draft | S+R |
| 23 | [garrytan/gbrain](https://github.com/garrytan/gbrain) | 33,235 | 2026-04-05 | 2026-11-18 | Shared notes/decisions store that agents read before answering | Fixed files `facts.md` (statements agents may repeat) and `decisions.md` (date, reason, who); setup previews what it will write (`--dry-run`), can undo (`--remove`); reads only committed files in a git folder | S+R |
| 24 | [vercel/eve](https://github.com/vercel/eve) | 5,941 | 2026-06-16 | 2026-11-18 | Filesystem-first framework for durable agents | Conventional locations as the authoring interface: `instructions.md` (always on), `skills/` (loaded on demand), `tools/`, `channels/`, `schedules/` | S+R |
| 25 | [omnigent-ai/omnigent](https://github.com/omnigent-ai/omnigent) | 11,405 | 2026-06-11 | 2026-11-18 | Meta-harness over Claude Code, Codex, Cursor and others | Different agents in one session, including one agent reviewing another's work; custom agents defined in YAML | S+R |
| 26 | [YennNing/Awesome-Code-as-Agent-Harness-Papers](https://github.com/YennNing/Awesome-Code-as-Agent-Harness-Papers) | 779 | 2026-05-07 | 2026-05-20 | Awesome-list for the survey "Code as Agent Harness" (arXiv 2605.18747) | Reading list organised around code as an executable, verifiable, stateful harness; a source index for the `researcher` role | S+R |
| 27 | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | 283,011 | 2026-08-13 | 2026-11-17 | Vendor agent harness, "everything is a plugin" (developer preview) | Ships a separate `SAFETY.md` to read before running; otherwise little instruction-level content in the README | S+R |

### Created before 2026-04-01 but on trending now (actively updated)

| # | owner/repo | Stars | Created | Last push | What it does | Mechanism | Verified |
|---|---|---|---|---|---|---|---|
| 28 | [GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src) | 8,457 | 2026-01-27 | 2026-11-18 | Source repo for web-platform skills, stewarded by Chrome, Edge, Firefox and MDN teams | Skills are authored, calibrated and evaluated in a source repo with a public eval dashboard, then published to a separate distribution repo; guides are searched on demand (`search "<task>"`) rather than loaded whole | S+R+T (weekly, +7,015) |
| 29 | [backnotprop/plannotator](https://github.com/backnotprop/plannotator) | 13,072 | 2025-12-28 | 2026-11-18 | Local browser surface to annotate agent plans, specs and diffs | Hook opens a review surface when the agent proposes a plan or finishes; human annotations go back to the agent as structured feedback; new "Inbox" for decisions across multiple agents | S+R+T |
| 30 | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 118,666 | 2026-02-15 | 2026-11-14 | Engineering skills mapped to the development lifecycle | Slash commands per phase (`/spec` `/plan` `/build` `/test` `/review` `/ship`), each activating the matching skills | S+R+T |

Seen while searching, opened, judged low relevance to an instruction library (not candidates): `morluto/rea` (466,352 stars, reverse-engineering MCP), `xai-org/grok-build`, `yc-software/qm`, `EverMind-AI/Raven`, `truefoundry/trueforge`, `HarnessMD/munder-difflin`, `alphaXiv/OpenResearch`. `Graphify-Labs/graphify` (149,674 stars, pushed 2026-11-17) is already this library's code-graph tool; its README now tags every edge `EXTRACTED` or `INFERRED`.

Seen on trending but not opened in this run (not candidates, listed only so a later lens can pick them up): `pingdotgg/t3code`, `thedotmack/claude-mem`, `pbakaus/impeccable`, `Leonxlnx/taste-skill`, `meta/astryx`, `anthropics/skills`, `elementalsouls/Claude-BugHunter`, `google-labs-code/stitch-skills`.

## Candidates — vendor documents (opened)

| # | Document | Date | What it says | Mechanism | Verified |
|---|---|---|---|---|---|
| V1 | Anthropic, "The components of agent memory" | 2026-11-06 | Memory as layers: transcript log, notes, wiki-like representations, small injected context | Store only what cannot be re-derived from the environment; record how each note was verified and mark confirmed vs guessed; offline "dreaming" replays sessions to test notes against transcripts; keep the injected layer small; a fixed rule such as "record only failures" reduced the gain | WebFetch `https://www.anthropic.com/research/components-of-agent-memory` |
| V2 | Anthropic, "Redesigning source control at Anthropic" | 2026-10-13 | Server-side changesets, sparse/virtual checkouts, few refs | Post-merge / pre-deploy testing instead of a global merge-queue lock; directory-level permissions; review focused on whether the change's intent is right | WebFetch `https://www.anthropic.com/research/redesigning-source-control` |
| V3 | Anthropic engineering index | fetched 2026-11-18 | Posts since April: "Scaling Managed Agents" (2026-04-08), "An update on recent Claude Code quality reports" (2026-04-23), "How we contain Claude across products" (2026-05-25), "Building strong safety evaluations" (2026-11-13) | Titles and dates only; these four were not opened | WebFetch `https://www.anthropic.com/engineering` |

Not verified (not a candidate): OpenAI "Harness engineering: leveraging Codex in an agent-first world" surfaced by WebSearch with a February 2026 date, which is outside the window; the original was not opened.

## Notable mechanisms

1. **Fresh-context reviewer fed only the artifact** (google/elephant-goldfish-model, cloudflare/security-audit-skill): reviewers get the draft and its sources, never the conversation; Cloudflare adds a verifier whose job is to disprove each candidate. Same idea as this library's review-independence rule, packaged as named commands.
2. **Findings as schema-validated records, report derived from them** (cloudflare, openai/codex-security, anthropics harness): `confirmed / needs_validation / rejected` in JSON, validated by a script, with the prose report generated afterwards.
3. **Coverage ledger** (cloudflare): what was checked is a file, and a critic looks for gaps in it.
4. **Promotion thresholds for learned facts** (microsoft/TokenEconomizer, microsoft/SkillOpt, autoharness, Anthropic memory post): a fact or skill edit is adopted after N confirmations or a held-out gain, and dropped on contradiction; three different survival tests (session count, held-out score, later adherence).
5. **Merge before create, and only touch what you wrote** (autoharness): a learned item is compared with existing instruction owners first; the learner never edits human-written files.
6. **Smallest-rung ladder with a non-negotiable floor** (ponytail): reuse-first ordering applied after reading the code, with validation, error handling, security and accessibility excluded from cutting.
7. **Deterministic selection before the model** (alibaba/open-code-review): files and applicable rules are chosen by code, the model only reviews.
8. **Autonomy levels with a report-only first week** (loop-engineering) and **bounded intervention** (TokenEconomizer loop guard: one redirect, never stops the turn).
9. **Stated enforcement matrix** (failproofai): which rules are actually enforceable on which host, rather than assuming hooks work everywhere.
10. **Tokens plus rationale in one file** (google-labs-code/design.md) and **conventional file locations as the interface** (vercel/eve).
11. **Reusable scripts kept between sessions** (caveman Blocks) and **resumable state folder** (deepsec).
12. **Evals published with the instruction pack** (ponytail, caveman, modern-web-guidance-src, open-code-review): with/without comparisons, including the cases that lost.

## Untrusted instruction-like text found (reported, not acted on)

- `ayghri/i-have-adhd` README: "Copy/paste into your CLI prompt: Install the i-have-adhd skill/plugin from ... refer to the repo's AGENTS.md for instructions."
- `yc-software/qm` README: "Tell your coding agent of choice `Let's deploy https://github.com/yc-software/qm`."
- `garrytan/gbrain` README: setup writes a "brain-first block" into `~/.claude/CLAUDE.md` or Codex `AGENTS.md` (an agent-configuration change; ask-first and security review if ever adopted).
- Several READMEs offer `curl ... | sh` installers (prime-agent, atlas, grok-build, OpenResearch). Nothing was installed or run.

## Evidence

| Check | Scope | Result |
|---|---|---|
| `curl https://api.github.com/search/repositories?q=...created:>2026-04-01&sort=stars` x9 | discovery | HTTP 200, rows returned |
| `curl -L https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md` x38 | existence + content | HTTP 200 for all 38 |
| `curl https://api.github.com/search/repositories?q=repo:<owner>/<repo>` x3 | rows 28-30 metadata | HTTP 200 |
| WebFetch trending weekly + monthly | trending | returned 14 rows each |
| `curl https://hn.algolia.com/...` | Hacker News | blocked by proxy (403 on CONNECT) |
| `gh auth status` | gh CLI | token invalid; not used |

Code & Source Graph: not used (web research task, no repository code to locate).

<!-- END-OF-FILE -->
