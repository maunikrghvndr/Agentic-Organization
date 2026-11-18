# Shortlist for deep reading (merge of `01-discover/`)

- Role: `researcher`. Observed: 2026-11-18. Non-interactive workflow step.
- Input: the eight lens files in `01-discover/` (`instruction-libs`, `spec-driven`, `memory`, `harnesses`, `hooks-rules-skills`, `security`, `trending-meta`, `verification`).
- Ranking: (a) what a markdown role library for coding agents could learn, (b) adoption or vendor authority, (c) recency; then lens coverage, so no lens holds more than four of the 16.
- Evidence level: every "why" is a README or vendor-page claim recorded by the discover step. Nothing was installed or run. Star counts are single unauthenticated search-API observations and were not audited.
- Hints from the lost earlier run: 11 of 16 were found in the discover files. Four were not (`affaan-m/ECC`, `spec-kitty/spec-kitty`, `OthmanAdi/planning-with-files`, `jszmajda/lid`); each was checked today (search API row plus README opening, HTTP 200). ECC enters the shortlist on that check; the other three are in the long tail, marked. `Anthropic "AI-Native SDLC Playbook"` appears in no discover file and was not checked, so it is not listed as a candidate.
- Lens coverage of the 16: instruction libraries 4 (ranks 2, 4, 6, 10), spec-driven 2 (1, 7), verification 2 (5, 11), security 2 (3, 8), hooks/rules/skills 2 (9, 13), memory 3 (12, 14, 15), harnesses 1 (16; ranks 4 and 7 also carry harness mechanisms).

## Shortlist

| Rank | Repo | URL | Slug | Why | Lens files that named it |
|---|---|---|---|---|---|
| 1 | google/elephant-goldfish-model | https://github.com/google/elephant-goldfish-model | google-elephant-goldfish-model | Review independence made structural: reviewers get the draft and its sources, never the conversation, and the review stops if the host cannot create fresh contexts; named review loop and a spec-to-code drift report. Vendor repo, 20.8k stars, created 2026-09-13. | instruction-libs, spec-driven, harnesses, trending-meta |
| 2 | obra/superpowers | https://github.com/obra/superpowers | obra-superpowers | Most adopted skills methodology (319k stars, 16 hosts): bootstrap text that makes the agent actually use the skills, spec shown back in short chunks; has a separate behavioural eval lab (prime-radiant-inc/superpowers-evals) that grades workflow compliance with a fresh assessor. | instruction-libs (verification names its eval lab) |
| 3 | cloudflare/security-audit-skill | https://github.com/cloudflare/security-audit-skill | cloudflare-security-audit-skill | Six-phase audit by isolated agents: a coverage ledger file assigns hunters, a fresh verifier tries to disprove every candidate, findings are schema-validated records (confirmed, needs_validation, rejected) and the report is derived from them. Vendor repo, 74.8k stars, created 2026-06-18. | instruction-libs, trending-meta |
| 4 | affaan-m/ECC | https://github.com/affaan-m/ECC | affaan-m-ecc | Closest large peer to a role library: one installed loop of plan, test, implement, review from a fresh context, verify, remember, improve, with capability-limited adapters and a support status matrix across hosts. 305.5k stars, pushed 2026-11-17. Not in the discover files; added on today's check (search API row and README opening only). | none (own check 2026-11-18; security names its sibling affaan-m/agentshield) |
| 5 | Anthropic: Test plugins with evals (`claude plugin eval`) | https://code.claude.com/docs/en/plugin-evals | anthropic-plugin-evals | First-party runner for the measurement behind "measure before you trim": with/without ablation, runs default 3, threshold exit code, cost ceiling, pinned model so a model rollout is not read as a regression, separate judge model, must-not-trigger graders. Vendor page fetched 2026-11-18. | verification |
| 6 | garrytan/gstack | https://github.com/garrytan/gstack | garrytan-gstack | Roles packaged as slash commands forming a virtual engineering team (CEO, eng manager, designer, reviewer, QA with a real browser, security officer running OWASP and STRIDE, release engineer); the nearest role-per-phase analogue with large adoption (141.9k stars, pushed 2026-11-18). | instruction-libs |
| 7 | open-gsd/gsd-core | https://github.com/open-gsd/gsd-core | open-gsd-gsd-core | Discuss, Plan, Execute, Verify, Ship loop where each plan is checked to fit a fresh context window before execution and executors run in parallel waves in clean contexts; installer handles cross-runtime compatibility. 11.6k stars, created 2026-05-22, pushed 2026-11-18. | instruction-libs, spec-driven |
| 8 | NVIDIA/SkillSpector | https://github.com/NVIDIA/SkillSpector | nvidia-skillspector | Supply-chain scanner for skills: 71 patterns in 17 categories, static stage then optional LLM stage, 0-100 risk score, SARIF output, baseline file for accepted findings, gate before install; pairs with NVIDIA/skills signing and NVIDIA/SkillEvaluator. Vendor repo, 26.6k stars. | security |
| 9 | FailproofAI/failproofai | https://github.com/FailproofAI/failproofai | failproofai-failproofai | Published per-host enforcement matrix (pre-tool block verified on all 12 harnesses, turn-end gates on 8) and a default policy that stops the agent switching enforcement off; the model for stating which prose rule has a hard overlay on which host. 9.6k stars, created 2026-04-06. | harnesses, hooks-rules-skills, security, trending-meta |
| 10 | EveryInc/compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin | everyinc-compound-engineering-plugin | Learning capture is a step of the loop, written where the next change will read it; `ce-explain` (why does this behaviour exist) and `ce-pov` with optional independent model opinions; 38 skills, 14 hosts, 26.1k stars. | instruction-libs |
| 11 | microsoft/SkillOpt | https://github.com/microsoft/SkillOpt | microsoft-skillopt | Skill edits treated like training: an edit is kept only if a held-out validation score improves, with an edit budget and a rejected-edit buffer; nightly offline cycle (harvest, mine, replay, consolidate) behind the same gate. Vendor repo, 19.1k stars, created 2026-05-08. | instruction-libs, hooks-rules-skills, trending-meta, verification |
| 12 | Anthropic: The components of agent memory | https://www.anthropic.com/research/components-of-agent-memory | anthropic-agent-memory-components | Vendor account of memory layers (transcript log, notes, wiki-like pages, small injected context): store only what cannot be re-derived, record how each note was verified, offline replay tests notes against transcripts, and a fixed "record only failures" rule reduced the gain. Dated 2026-11-06. | trending-meta, harnesses (index entry, not opened there) |
| 13 | Claude Code docs: hooks reference (with the memory and rules page) | https://code.claude.com/docs/en/hooks | claude-code-hooks-docs | Host facts the optional overlays depend on: 33 hook events, `onFailure: block` to fail closed, `InstructionsLoaded`, `PreCompact`/`PostCompact`, `TaskCompleted`; companion page https://code.claude.com/docs/en/memory covers native `AGENTS.md` reading, `paths:` rules that load unscoped on bad YAML, and the 200-line / 25KB load limit. Only the first 100k of 294k characters of the hooks page was read. | hooks-rules-skills, memory |
| 14 | tigerless-labs/autoharness | https://github.com/tigerless-labs/autoharness | tigerless-labs-autoharness | Lesson lifecycle beyond capture: compares a new episode with existing skills and read-only owners (CLAUDE.md, plugin skills, auto memory) before creating, merges same-scenario skills, prunes unused ones, touches only what it wrote, keeps a per-skill decision ledger. 11.2k stars, created 2026-06-09. | instruction-libs, trending-meta |
| 15 | akitaonrails/ai-memory | https://github.com/akitaonrails/ai-memory | akitaonrails-ai-memory | File and git backed memory with a markdown `wiki/` as source of truth and a rebuildable index: access-weighted decay, cold notes compacted into durable facts, contradiction flagging, nothing hard-deleted, typed claim-once handoffs between vendors. 16.1k stars, created 2026-05-21. | memory |
| 16 | cursor/plugins (pstack) | https://github.com/cursor/plugins | cursor-plugins-pstack | Vendor skill stack of 22 playbooks: one entry skill routes to a playbook per task type, an explicit skill dependency table, per-role model and reasoning budget written by a setup skill, multi-model review panels, skills that create per-repo verification skills. 16.9k stars; mirrored by backnotprop/pstack and michael-denyer/pstack-claude. | harnesses, hooks-rules-skills |

## Dropped as already studied

No discover file tabled any of the eight studied projects (each lens excluded them up front). Items touching that set, kept out of the shortlist and noted here:

- `Ardha-Eco-System/RUDR9` — nine-role team built on Hermes Agent; seen in a search row only (instruction-libs), excluded lineage.
- `skyf0xx/hedgehog` — BMAD-based; opened, not tabled (spec-driven); its README carries agent-directed install text (reported as data).
- `sudokar/openspec-plus` — OpenSpec add-on; search row only (spec-driven).
- Built on a studied project but listed in the long tail for their own additions only: `intent-driven-dev/intent-driven-template`, `renzrollon/interlock`, `h4nz4/saidwhen`, `MageByte-Zero/spec-superflow` (OpenSpec); `aws-samples/sample-specship` (Kiro Power); `rpamis/comet` (Classic mode on OpenSpec + Superpowers); `mori-shin-x/artgraph` (ships Spec Kit and Kiro integrations).

## Long tail

One line per remaining candidate. Lens codes: IL instruction-libs, SD spec-driven, M memory, H harnesses, HRS hooks-rules-skills, SEC security, TM trending-meta, V verification.

### Runners-up (first to promote if a shortlist item disappoints)

- `mattpocock/skills` (IL) — hint; 326.8k stars; small composable skills the user adapts, two install channels; discover file found little mechanism in the README opening.
- `DietrichGebert/ponytail` (IL, HRS, TM) — minimalism skill with a non-negotiable floor and an in-repo with/without benchmark; 193k stars.
- `jszmajda/lid` (own check) — hint; Linked-Intent Development: HLD, LLD and EARS specs, an experimental EARS-to-code coherence audit, evals stored beside each skill; 119 stars.
- `spec-kitty/spec-kitty` (SD seen as pre-window; own check) — hint; spec, plan, tasks, review, accept, merge kept in the repo with a governing Charter and worktrees; 1.7k stars, 4.0 release candidates.
- `OthmanAdi/planning-with-files` (own check) — hint; `task_plan.md`, `findings.md`, `progress.md` re-injected by lifecycle hooks so the plan survives `/clear` and compaction; 28.1k stars.
- `GanyuanRan/Aegis` (SD) — hint; done-claims carry fresh evidence, covered scope and residual risk; published held-out A/B with stated limits.
- `KbWen/agentic-os` (IL, HRS) — hint; validator fails a work trail missing a phase or its evidence and states it cannot catch a faked record.
- `karanb192/claude-code-hooks` (HRS, SEC) — hint; guard pack with per-host coverage limits and an OWASP LLM Top 10 mapping.
- `NVIDIA/SkillEvaluator` (SEC, V) — cheap-first tiers, per-host `harness-check` that the skill loads at all, with/without A/B, CI template.
- `alchaincyf/darwin-skill` (IL, HRS) — keep-or-roll-back ratchet judged by blind comparison of real run outputs, no-skill baseline first.
- Google Cloud, "Evaluate agent skills before they bloat your context window" (V) — five rules: collision gate, no laptop evals, paired ablation at k=3, orthogonal metrics, delete zero-delta skills.
- Claude Code docs, "Orchestrate teams of Claude Code sessions" (H) — file-locked claiming, hooks rejecting with exit 2, relayed approval is never user consent.
- `wshobson/agents` (IL) — one source format, adapters generate each host's format, CI regenerates, capability matrix.
- `trailhq/Trail-Code` (M, TM) — a learning is a file; repo learnings committed, personal ones never; seeded from things said more than once.
- `no-human-ai/no_human` (H) — gate runs offered tests on the merge base (must fail) and the new tree (must pass); counts tautological tests.
- `lennney/stop-that-shit` (HRS, SEC) — hook guard with a four-part over-work taxonomy and 18 public Bad/Good cases.

### Instruction libraries, rule sets and skills

- `anthropics/skills` (IL; TM seen) — vendor reference skills repository.
- `agentskills/agentskills` (IL) — SKILL.md folder contract specification.
- `vercel-labs/skills` (IL) — `npx skills` installer most new skill repos use.
- `addyosmani/agent-skills` (IL, TM) — lifecycle slash commands that activate matching skills.
- `msitarzewski/agency-agents` (IL) — large persona roster with a native installer.
- `microsoft/apm` (IL) — manifest of agent dependencies plus an org install policy.
- `janestreet/agent_skills` (IL) — exported-from-internal skills with a no-text-PR policy.
- `miqdadbadjuber/anti-slop` (IL, TM) — 40 rules in three tiers with a mandatory PASS/FAIL report.
- `ciembor/agent-rules-books` (IL, HRS) — each rule set in nano, mini and full sizes; public CRITICISM.md.
- `QoderAI/better-harness` (IL, H) — session evidence turned into prioritized improvements, missing evidence kept explicit.
- `kunchenguid/backpass` (IL) — instruction edits need verbatim quotes from two sessions, under a token budget, human-applied.
- `agent0ai/dox` (IL) — hierarchical AGENTS.md walked root to leaf before an edit and updated after.
- `LilMGenius/paperthin` (IL) — catalogue of low-level agentic design patterns.
- `hoangnb24/repository-harness` (IL) — compact AGENTS.md plus repo map with a safe updater and stated non-goals.
- `Kulaxyz/self-learning-skills` (IL, M, HRS) — explicit capture triggers plus a "what didn't work" note; captures without asking.
- `wanshuiyin/HERO-Anti-OverDefense` (IL) — named over-defence failure shapes (Hashing, Edge cases, Rubrics, Overbuild).
- `FerroxLabs/agents-md` (IL) — drop-in AGENTS.md with symlinked host files and manifest-verified project facts.
- `Arch1eSUN/Arcgentic` (IL) — separate self-audit and external-audit gates with NEEDS_FIX verdicts.
- `yzhao062/anywhere-agents` (IL) — on-demand packs, per-role model and effort config, local override file.
- `K-Dense-AI/scientific-agents` (IL) — profession profiles with a fixed schema for framing, tools, stress-testing, reporting.
- `scarletkc/agents` (IL) — project vs user AGENTS.md split, skill table generated from skill metadata.
- `sjsyrek/design-council` (IL) — eleven independent-context seats debate a design decision.
- `pliablepixels/gap-trap` (IL, HRS) — every rule ships with a commit/CI gate; "proven red" job.
- `sohaibt/product-mode` (IL) — preflight and decision commands that write records to disk.
- `PrimeFoldTools/Andon` (IL, HRS) — defect, cause, countermeasure records with a check tested on failing and passing cases.
- `Anbeeld/AGENTS.md` (IL) — fixed execution order; embedded instructions treated as data.
- `hitianqi/troupe` (IL) — one worktree per role, build and review by different agents.
- `llopresto87/Cypress` (IL) — process sized to task risk; clean-context steps go to separate agents.
- `kucherenko/gangsta` (IL) — named gate artifact per phase; proposer vs devil's-advocate debate before the spec.
- `backnotprop/pstack` (HRS) and `michael-denyer/pstack-claude` (H) — mirrors/ports of the shortlisted cursor pstack.
- `randommonicle/claude-skills` (HRS) — guardrail skills each traced to a shipped defect; `prove-it-can-fail`.
- `WoJiSama/skill-based-architecture` (HRS) — distills scattered rules into one routable project skill.
- `Unity-Technologies/skills` (HRS) — one router skill listing all others; also shipped as a versioned plugin.
- `MemTensor/skills-vote` (HRS) — skill updates driven by attribution of whether the skill helped.
- `entropyvortex/meta-llm-charter` (HRS) — always-loaded core size gated in CI; provenance tags on claims.
- `LeeYudok/agents-scaffold` (HRS) — AGENTS.md as single brain, per-host layers generated, pre-commit gate as floor.
- `NEXL-LTS/agent-apropos` (HRS) — rules scoped by code construct as well as path; reviewer loads the same index.
- `mi4646/claude-rules-lint` (HRS) — lints unindexed rule files, dangling references, empty `paths:`.
- `agent-clinic/claude-md-doctor` (HRS) — backtests each rule against session history (followed, violated, never triggered).
- `pathrule/pathrule` (HRS) — memories and rules scoped to code paths, delivered by hook.
- `anthropics/claude-plugins-official` (HRS) — third-party marketplace listing being phased out for directory submission.
- `openai/plugins` (HRS) — Codex plugin layout; successor to deprecated `openai/skills`.
- `JuliusBrussee/caveman` (TM) — output shortening plus kept scripts ("Blocks") rerun across sessions.
- `ayghri/i-have-adhd` (TM) — ten checkable output-shape rules.
- `google-labs-code/design.md` (TM) — tokens plus rationale in one file.
- `vercel/eve` (TM) — conventional file locations as the authoring interface.
- `GoogleChrome/modern-web-guidance-src` (TM) — skills authored and evaluated in a source repo with a public eval dashboard.
- `DenisSergeevitch/agents-best-practices` (H) — harness maturity levels; stale-worker rule; matched-baseline team evals.
- `lopopolo/harness-engineering` (H; IL seen) — five-part worker test from the author of OpenAI's harness post.

### Spec-driven

- `JetBrains/thinkrail` (SD, TM) — spec graph as durable knowledge; worktree workspaces settled on PR merge.
- `dzhng/skills` (SD) — spec re-sliced mid-run; human role defined as curation.
- `MageByte-Zero/spec-superflow` (SD) — v2 cut ceremony to two paths; stable issue ids, third failure goes to a human.
- `AmazingAng/old-coder` (SD) — human reviews a test plan before and an evidence report after.
- `aiblueprinthq/ai-blueprint` (SD) — stop for spec review; "current need" rule before any abstraction.
- `responsibleai/ASSERT` (SD) — test cases generated from a natural-language spec, judged against stated policies.
- `gokulrajaram/ProductSpec` (SD) — spec states what not to build and when to stop; pinned spec revisions.
- `MicTx/spec-harness` (SD) — thick planning then no questions during execution; machine-linted plans.
- `aws-samples/sample-specship` (SD) — brownfield RECON phase; parallel validators returning typed verdicts.
- `av/facts` (SD) — one atomic claim per line with lifecycle tags and an optional check command.
- `genkovich/sdd` (SD) — each stage hard-refuses without its prerequisite artifact.
- `tetrionlabs/mathema` (SD) — verification records bound to a hash of the code.
- `intent-driven-dev/intent-driven-template` (SD) — ADR as a lifecycle stage, project glossary.
- `JeiKeiLim/tenet` (SD) — grounded vs ungrounded critics; plan granularity by declared model capability.
- `3338902669-ops/agent-orchestra` (SD) — self-declared done rejected in code; model-free failure-mode benchmark.
- `renzrollon/interlock` (SD) — one human checkpoint; gates as CLI exit codes.
- `specdd/specdd` (SD) — small spec files co-located with the code they describe.
- `leaderiop/SpecForge` (SD) — rules enforced by a deterministic compiler, traceability as a graph property.
- `felipefontoura/pi-sdd-kit` (SD) — a `.status` file is the only approval gate; EARS by default.
- `wrtnlabs/evidence` (SD) — every code unit must answer every rule heading; can use AGENTS.md headings as the obligation set.
- `mori-shin-x/artgraph` (SD) — hashes each side of requirement, code and test links and reports which side moved.
- `rodolfo-mendes/breadcrumb-sdd` (SD) — front-matter claims checked against code by line match.
- `emmanuel-D/truthboard` (SD) — status derived from git, never typed.
- `hmbseaotter/agent-specification-toolkit` (SD) — every SHALL maps to a machine-checkable criterion, linted.
- `Unsupervisedcom/2119` (SD) — requirement coverage lint; hash-bound reviewer verdicts that expire on change.
- `IgnacioMarin402/spec-flow-plugin` (SD) — requirement id must appear in a test that actually executed.
- `laithalsaadoon/symspec` (SD) — SMT check for contradictions between EARS requirements; "no conflict proven".
- `h4nz4/saidwhen` (SD) — each decision records who, when and what would reopen it.
- `AlesKracik/quintessence` (SD) — EARS to formal model to witness traces replayed through the code.
- `tbhb/vale-ears` (SD) — Vale rules that lint EARS sentences.
- `tsnee/ears-checker` (SD) — EARS conformance checker that suggests a fix.

### Memory, compaction and re-entry

- Anthropic API docs, Memory tool (M) — "assume interruption" protocol; initializer session plus progress log pattern.
- `tigerless-labs/agent-memory` (M) — one-line abstracts first, sleep-time consolidation with a per-run report.
- `code-yeongyu/lazycodex` (M, H) — hierarchical per-directory AGENTS.md generated by complexity; completion sentinel.
- `Ar9av/obsidian-wiki` (M) — claims tagged extracted, inferred or ambiguous; wiki lint.
- `Asymptote-Labs/agent-beacon` (M) — cross-harness session traces turned into reviewed knowledge.
- `VictorTaelin/OptMem` (M) — append-only log, rebuildable summary, separate reading budget.
- `codejunkie99/agentic-stack` (M) — candidate lessons that must be accepted; screened on a fixed task sample.
- `aoci-spec/aoci-code` (M) — codebase index with Missing, Orphan, Stale, Unbaselined verification.
- `aakarim/OpenLore` (M) — markdown knowledge folder served over SSH/MCP with per-path permissions.
- `vshulcz/deja-vu` (M) — handoff across agents; rejected approaches flagged on later recall.
- `coleam00/claude-memory-compiler` (M) — SessionEnd and PreCompact hooks compile sessions into a knowledge base.
- `riponcm/projectmem` (M) — typed issue, attempt, fix, decision entries; precheck before repeating a failed approach.
- `okf-memory/okf-agent-memory` (M) — 400-token AGENTS.md cap, everything else pulled on demand.
- `ReflexioAI/claude-smart` (M) — three promotion tiers; per-skill usage citations.
- `Storybloq/storybloq` (M) — lessons with reinforcement counts; handovers as files.
- `raiyanyahya/recall` (M) — append-only history plus an overwritten "where are we" file, no LLM.
- `mindmuxai/brain.md` (M) — CLI-only writes; six-month admission test.
- `aerovato/operator-memory` (M) — user and project partitions, consult-first loop.
- `grpcer/ownmem` (M) — "evidence before authority"; unreviewed entries arrive as leads; evidence drift downgrades.
- `mcncarl/agent-memory-vault` (M) — session-scoped claims and immutable receipts for high-impact writes.
- `Brain0-ai/brain0` (M) — passive decision graph linking commits to prompts.
- `oliver-zehentleitner/keep-the-why` (M) — "why layer" in the repo with a CI linter.
- `big0lives/codex-task-pointer` (M, HRS) — schema-checked goal pointer re-injected after compaction, CAS-guarded.
- `mainline-org/mainline` (M) — intent, trade-offs and abandoned routes tied to the commit.
- `ctxr-dev/llm-wiki-memory` (M) — actions classed Automatic, Agent-led, Asks first; one approval per lesson.
- `supermemoryai/memoryrepo` (M) — one fact per line with source and date; every write a commit.
- `isaachinman/encephalon` (M) — replacement records must supersede every active head.
- `disler/self-compact-pi-agent` (M) — graded context thresholds ending in a forced handoff note.
- `Qin-sor/agent-context-lab` (M) — measures whether start-of-task constraints survive compaction.
- `garrytan/gbrain` (TM) — fixed `facts.md` and `decisions.md`; setup previews and can undo.
- `microsoft/TokenEconomizer` (TM) — a repo fact is injected after three sessions confirm it, dropped on contradiction.
- `tryatlas/atlas` (TM) — prompt-to-commit provenance.
- Opened, lower fit (M): `entireio/entire-brain`, `neosigmaai/auto-harness`, `alpertarhan/pi-smart-compact`, `nguyenvuthientrang/cliffcompaction`, `memorax-ai/memorax-code`, `TencentCloud/TencentDB-Agent-Memory`.

### Harnesses and orchestration

- `Intelligent-Internet/zenith` (H) — explicit per-turn stop decision; names premature completion as the main failure.
- `pullboard-dev/pullboard` (H; SD seen) — claim state machine; a different agent verifies the exact commit.
- `dualface/kander` (H) — isolated two-stage review; publishes its review hit rate.
- `VisionForge-OU/foreman` (H) — hash-sealed approval, declared `touches` footprint, harness-owned cost caps.
- `naw103/foremerge` (H) — agents publish intent and get overlaps back, no locks.
- `omnigent-ai/omnigent` (H, TM) — diff routed to a reviewer from a different vendor.
- `Nanako0129/pilotfish` (H) — plan-verifier returns READY or REVISE; model floor for reviewers.
- `GammaLabTechnologies/harmonist` (H) — stop hook checks reviewers ran and handoff updated; sha-verified manifest.
- `loopx-project/loopx` (H) — single-flight lease queue; gates for unattended runs.
- `professorpalmer/Puppetmaster` (H) — typed worker results persisted; budget reservations.
- `firstintent/ccteam` (H) — journaled flows; policy hook on every delegation.
- `Tencent/LoopForge` (H) — approval gates that send work back to a chosen step.
- `OrchestratorInc/agent-orchestrator` (H) — failures routed to the worker that owns the branch.
- `Yeachan-Heo/oh-my-claudecode` (H) — one loop authority per session.
- `open-mercato/cezar` (H) — child tasks share the parent's budget; nothing auto-merges.
- `HarnessMD/munder-difflin` (H; TM low relevance) — escalates only spend, destructive operations, scope change.
- `Orkas-AI/Orkas` (H) — tool-round budgets, repeated-call checks, idle watchdogs.
- `fujibee/agmsg` (H) — cross-vendor messaging with role identity lock.
- `alamops/agetor` (H) — base commit recorded per task worktree.
- `savannahfeder/agentbox` (H) — inbox row per finished agent: what it did, what it needs.
- `cobusgreyling/loop-engineering` (H, TM) — loop patterns with autonomy level; report-only first week.
- `wanshuiyin/Auto-claude-code-research-in-sleep` (H) — executor and reviewer from different model families.
- `wangmiaozero/pi-harness` (H) — checkpoints with resume, fork, retry.
- `razzant/claudexor` (H) — typed approval for edits to protected gate/test paths.
- `google-research/harness2` (TM) — propose, probe, compose harness edits from behavioural contrasts.
- `PrimeIntellect-ai/prime-agent` (TM) — prompts, memories and subagent specs as durable, evidence-updated state.
- `deepseek-ai/deepseek-harness` (TM) — vendor harness with a separate SAFETY.md.
- `backnotprop/plannotator` (TM) — hook opens a human annotation surface for plans and diffs.
- `YennNing/Awesome-Code-as-Agent-Harness-Papers` (TM) — reading list for the survey arXiv 2605.18747.
- Anthropic, "Scaling Managed Agents" (H) — append-only session log outside context; stateless `wake`.
- Anthropic, "Redesigning source control at Anthropic" (H, TM) — humans review the intent of a change; directory-level permissions.

### Hooks, gates and governed workflows

- `qkal/Canny` (HRS) — only facts block; done-gate keyed to "no check passed since last edit".
- `nizos/probity` (HRS) — block message carries reason plus next legal step.
- `coldteadotai/abide` (HRS) — one question per prose rule; judge sees rule and diff only.
- `Nari-Ab/agent-roast` (HRS) — detects "green by weakening the checks".
- `dooly6276/claude-bulkhead` (HRS) — ownership-aware blocking across sessions.
- `leepokai/jev-guard` (HRS) — per-call `risk`, `user_requested`, `from_untrusted` questions.
- `nesaminua/claude-code-lsp-enforcement-kit` (HRS) — progressive gate forcing symbol navigation before grep.
- `open-coder-ai/chock` (HRS) — policy compiled to the strongest control per host, with evals that prove it fires.
- `SebastienDegodez/skraft-plugin` (HRS) — fail-closed hooks block out-of-sequence dispatch and unloaded mandatory skills.
- `me2resh/apexyard` (HRS) — approval bound to the exact commit sha by reviewer and named human.
- `databricks-solutions/consort` (HRS) — sequencing held by a state machine; tests immutable once approved.
- `thepragmaticbear/bearpaws` (HRS) — "difficulty is not danger": ceremony sized by consequence.
- `alxshelepenok/grove` (HRS) — context kept as a structured graph instead of summaries.
- `inoichi1009207/custodiet` (HRS) — false-positive ledger; 7 of 31 rules block; rules re-tested per model.
- `NYCU-Chung/my-claude-devteam` (HRS) — per-agent tool permissions and a delegation rulebook.

### Security

- `anthropics/defending-code-reference-harness` (HRS, TM) — recon, find, triage, report, patch as separate skills; unmaintained.
- `openai/codex-security` (TM) — validation of findings and verification of fixes as separate steps.
- `vercel-labs/deepsec` (TM) — resumable scan state in one folder.
- `alibaba/open-code-review` (TM) — deterministic file and rule selection before the model reviews.
- `ifixai-ai/iFixAi` (TM) — role/authority fixture the agent is tested against.
- `NVIDIA/skills` (SEC) — scan, evaluate, sign pipeline; unsigned skills dropped.
- `cisco-ai-defense/skill-scanner` (SEC) — patterns, dataflow, optional judge, typed decision layer; states its limits.
- `cisco-ai-defense/mcp-scanner` (SEC) — three independent engines for MCP servers.
- `snyk/agent-scan` (SEC) — machine-wide inventory of agents, MCP servers and skills, then scan.
- `berabuddies/Semia` (SEC) — capability audit grounded in source lines, never executes the skill.
- `affaan-m/agentshield` (SEC) — config auditor where listed defenses add no score.
- `Pantheon-Security/medusa` (SEC) — vets `.claude/` hooks and permissions as attack surface.
- `HarmonicSecurity/claudit-sec` (SEC) — read-only inventory of Claude Desktop config surfaces.
- `paladini/harness-score` (SEC) — deterministic maturity score from filesystem facts.
- `Agent-Threat-Rule/agent-threat-rules` (SEC) — YAML detection-rule format with hunt and enforce lanes.
- `cosai-oasis/project-codeguard` (SEC) — one canonical secure-coding ruleset translated per agent format.
- `OWASP/www-project-agentic-skills-top-10` (SEC) — AST01-AST10 risk ids for skill reviews.
- `OWASP/www-project-mcp-top-10` (SEC) — MCP01-MCP10 risk ids.
- `Dicklesworthstone/destructive_command_guard` (SEC) — one guard binary adapted to many hook protocols.
- `kenryu42/cc-safety-net` (SEC) — parses what a command does; broken config falls back to safe defaults.
- `statewright/statewright` (SEC) — per-phase tool allowlists.
- `hardenrun/aif` (SEC) — on-device firewall with per-agent coverage table.
- `perplexityai/numbat` (SEC) — sequence rules; blocking off by default.
- `uber/ADR` (SEC) — two-tier detection of unsanctioned agents and MCP servers; ADR-Bench.
- `archestra-ai/OpenAPPA` (SEC) — sensitivity and trust labels checked per tool call.
- `provos/ironcurtain` (SEC) — English constitution compiled to deterministic rules, tested on generated scenarios.
- `nolabs-ai/nono` (SEC) — Sigstore attestation of skills, hooks and instruction files.
- `pipelab-org/pipelock` (SEC) — egress firewall with signed action receipts.
- `denoland/clawpatrol` (SEC) — wire-level rules with deny or pause-for-approval.
- `solongate/agent-security` (SEC) — a policy inside a repository cannot switch the guard off.
- `Cygnux-Labs/Tracekit` (SEC) — signed append-only log; held call runs only with approved arguments.
- `trailofbits/coop` (SEC) — disposable VMs with a host-side credential proxy.
- `trailofbits/claude-code-devcontainer` (SEC) — bypass mode only inside a disposable container.
- `eugene1g/agent-safehouse` (SEC) — deny-first macOS sandbox profiles.
- `microsoft/nvx` (SEC) — micro-VM sandbox with pinned kernel and toolchain.
- `perplexityai/SPACE` (SEC) — Firecracker sandbox platform.
- `docker/sbx-releases` (SEC) — Docker Sandboxes CLI.
- `anthropic-experimental/sandbox-runtime` (SEC) — filesystem plus network-proxy sandbox; README read, no search row.
- Claude Code docs, Sandboxing (SEC) — protected paths, `failIfUnavailable`, managed settings a repo cannot loosen.
- Claude Code docs, Security (SEC) — `ConfigChange` hooks, no trust prompt in `-p` sessions.
- Surfaced, read, not ranked (SEC): `LLMSecurity/awesome-agent-skills-security`, `hashgraph-online/hol-guard`, `secureagentics/Adrian`, `getagentseal/agentseal`.

### Verification, evals, linting and cost

- `UiPath/coder_eval` (V) — `skill_triggered` criterion separate from outcome; A/B layer.
- `prime-radiant-inc/superpowers-evals` (V) — behavioural eval lab for superpowers; read with shortlist rank 2.
- `darkrishabh/agent-skills-eval` (V) — every eval runs with and without the skill.
- `boheling/skillbench` (V) — both arms graded by the same script; stale since May.
- `google/skill-reach` (V) — trigger and collision probes; README not read.
- `rpamis/comet` (V) — Pass@k and Pass^k reliability scoring.
- `china-qijizhifeng/agentic-harness-engineering` (V) — harness split into seven git-tracked components.
- `alifurkangokce/driftlint` (V) — instruction claims checked against the tree; reviewed memory with file:line evidence.
- `YawLabs/ctxlint` (V) — broken paths and wrong commands in context files; SARIF.
- `yegor256/dogent` (V) — pass/fail prose linter for instruction files.
- `HMAKT99/Agentspec` (V) — contradiction lint as a PR check.
- `Taiizor/agents-md-cookbook` (V) — linted AGENTS.md templates.
- `jed1978/instrlint` (V) — dead-rule detection; search row only, unmaintained.
- `Katta041/asitis-agent-tools` (V) — "what really loads" per host; search row only.
- `pavangupta352/stalegreen` (V) — names stale green and masked results; receipts with a tree fingerprint.
- `vnmoorthy/groundtruth` (V) — Stop hook refusing a completion claim without same-turn verification.
- `B0yko/agent-claimcheck` (V) — rules first, judge last, three-way verdict with an abstain band.
- `azrtydxb/procoder` (V) — "unchecked counts as failing".
- `svetdev/cleat` (V) — ratchet gates including `doc-size` and `doc-citations`.
- `r-tatarinov/codex-harness` (V) — pre/post-edit analyzer diff with a retry budget.
- `amElnagdy/guard-skills` (V) — second-pass review skills per artifact type.
- `llm-as-a-verifier/llm-as-a-verifier` (V) — logprob-expectation scoring for a verifier.
- `KovantAI/fermut` (V) — mutation testing with deterministic ids for an agent loop.
- `cribro-dev/cribro` (V) — diff coverage and diff mutation testing.
- `samzhu/topplecat` (V) — hidden cases and mutation per acceptance criterion.
- `dmoka/skills` (V) — mutation-testing skill; shows a bug surviving a 95% score.
- `ai-evals-course/evals-skills` (V) — judge calibrated against human labels (TPR/TNR).
- `Calibre-Labs/reforge-ai-evals` (V) — names the two steps that stay human.
- `ankurpand3y/judicator` (V) — bias audit of the judge; stale.
- `getagentseal/codeburn` (V) — cost by tool, model, project and task type.
- `splunk/token-meter` (V) — missing evidence is "unavailable, never zero".
- `alibaba/loongsuite-pilot` (V) — one telemetry schema across agents.
- `jackulau/coding.sh` (V) — failed session turned into an eval case.
- `xiufengsun/TokenTracker` (V) — token tracker; search row only.
- `QuesmaOrg/awesome-ai-tokenomics` (V) — curated index on token spend.
- Referenced, outside window or not opened (V): `harbor-framework/harbor`, `agent-sh/agnix`, `huggingface/Repo2RLEnv`.

### Seen by a lens but not opened or judged off-lens (not candidates; listed so nothing is lost)

- IL: `K-Dense-AI/mimeo`, `coco-research/coco`, `Avinash-jetwani/jevmem`, `whitelonng/mancode`, `johnpapa/ai-ready`, `MihaiCiprianChezan/Agentic-First-Enterprises`; awesome-lists `hesreallyhim/awesome-claude-code`, `VoltAgent/awesome-agent-skills`, `ai-boost/awesome-harness-engineering`, `karanb192/awesome-claude-code-mods`.
- SD: `prekuter/dryforge`, `open-gsd/gsd-pi`, `kant2002/ears-parser`, `labeth/ears-lint-go`, `yulongbai-nov/fuse-spec`, `Wyzer-it/reqlint`, `kj648/requirement-clarifier`, `ericrisco/rsc-harness`, `zeeshanhanif/agentic-sdlc-kit`, `Benni-OS/conductor-sdd`, `mavwolverine/wolverine-kit`; pre-window: `modu-ai/moai-adk`, `buildermethods/agent-os`, `gemini-cli-extensions/conductor`, `m0n0x41d/haft`, `tzachbon/smart-ralph`, `astrio-labs/forall-mcp`.
- HRS: `openqodex/openqodex` (separate-reviewer tool), `Jia-Ethan/codex-keysmith` (preview, confirm, verify, revoke flow for instruction deployment), `Unity-Technologies/unity-agent-plugin`.
- TM: `morluto/rea`, `xai-org/grok-build`, `yc-software/qm`, `EverMind-AI/Raven`, `truefoundry/trueforge`, `alphaXiv/OpenResearch`, `Graphify-Labs/graphify` (already this library's graph tool), `pingdotgg/t3code`, `thedotmack/claude-mem`, `pbakaus/impeccable`, `Leonxlnx/taste-skill`, `meta/astryx`, `elementalsouls/Claude-BugHunter`, `google-labs-code/stitch-skills`.
- V: `raindrop-ai/workshop`.
- Vendor pages named but not opened: Anthropic "How we contain Claude across products" (2026-05-25), "Building strong safety evaluations" (2026-11-13), "An update on recent Claude Code quality reports" (2026-04-23); OpenAI Codex memories, hooks and security docs and Cursor blog (hosts blocked); Cognition agent-memory-repo page (host blocked).
- Hint not found anywhere: Anthropic "AI-Native SDLC Playbook" (unverified, not checked).

## Untrusted instruction-like text

- Every lens file reports agent-directed install prompts in READMEs (for example harmonist, zenith, hedgehog, FerroxLabs/agents-md, OptMem, Canny). None was acted on; see each lens file's own section.
- Today's check: the `affaan-m/ECC` README opens with an "official sources only" install warning and sponsorship text; `OthmanAdi/planning-with-files` leads with sponsor links. Treated as data; nothing installed.

<!-- END-OF-FILE -->
