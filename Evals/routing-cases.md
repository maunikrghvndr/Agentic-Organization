# Routing cases — expected role per one-line ticket

Use these to check `AGENTS.md` → Routing after any change to it (an EVALS.md row records the run: date, host, model, cases passed / total). A case passes when the agent's **first** adopted role matches the expected one without the user naming it. Near-misses are deliberate; the last case is the negative test — a trivial fix must **not** trigger the analyst grill.

| # | Ticket (as the user would type it) | Expected first role | Why / near-miss |
|---|---|---|---|
| 1 | "Add a `DELETE /api/orders/{id}` endpoint that soft-deletes and audits the actor" | `backend-engineer` (Grill Checkpoint; security pass later) | single-area implementation; touches authz → mandatory security review after |
| 2 | "The export button shows a spinner forever when the API returns 500" | `debugger` | "why is it broken" → diagnosis before fix, even though the fix is frontend |
| 3 | "Users should be able to share a report with a colleague" | `analyst` | vague product idea, no acceptance criteria |
| 4 | "Is pgvector still the right choice, or should we move to a dedicated vector DB?" | `researcher` | "is there a better/current way" with an external choice open |
| 5 | "Review PR #142 (the retry policy change in the payment worker)" | `backend-reviewer` | review of a backend diff |
| 6 | "Write a test plan for the new onboarding flow before release" | `qa-engineer` | test plan / release readiness |
| 7 | "Scan our dependencies for CVEs and check that no secrets are committed" | `security-engineer` | audit / dependency / secrets |
| 8 | "Build the nightly ETL that loads the claims CSVs into the warehouse with quality checks" | `data-engineer` | pipeline / ingestion / data quality — not `data-scientist` |
| 9 | "Which features predict churn? Compare three models and report lift over baseline" | `data-scientist` | analysis / model selection — not `data-engineer`, not `ml-engineer` |
| 10 | "The summarizer should refuse to answer when the retrieved context is empty" | `ai-engineer` | LLM app guardrail logic — not `prompt-engineer` (no prompt wording change) |
| 11 | "Rewrite the extraction prompt so it stops inventing dates; keep the eval green" | `prompt-engineer` | prompt wording + eval — not `ai-engineer` |
| 12 | "Chunking is splitting tables mid-row; recall on tabular questions dropped" | `rag-engineer` | retrieval / chunking — not `nlp-engineer` |
| 13 | "Link extracted drug mentions to RxNorm and report per-type precision" | `nlp-engineer` | entity linking / clinical NLP |
| 14 | "Add a GitHub Actions job that runs the tests on every PR" | `devops-engineer` | CI/CD |
| 15 | "We need multi-tenant file upload with virus scanning, quotas and an admin UI" | `analyst` (then `architect`, `planner`) | spans >2 roles, new service, hits the security list → full path |
| 16 | "The review said the logger interpolates the user id — fix it" | `backend-engineer` | fixing findings from a review → engineer, findings as input |
| 17 | "Typo: the Save button says 'Sav'" | `frontend-engineer` (one-line Grill, no analyst) | **negative case:** trivial change must not trigger the analyst grill or planner |
