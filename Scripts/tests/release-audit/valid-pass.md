# Task: fixture release (valid, Pass)

## Summary
- Fixture for `Scripts/validate-release-audit.test.mjs`. Not a real audit.

## Release Audit
- Release audit: Pass | sha 0a1b2c3d | engine B: library (skill validators cannot run on native Windows) | profile standard | run 1 | 2026-11-18

### Coverage Ledger
| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |
|---|---|---|---|---|---|---|---|---|
| L1 | GET /invoices | anonymous to tenant data | billing | Authorization And Access Control Review | covered | `src/invoices.js:1-4`; `src/auth.js` | followed tenant parameter from request to query; read the guard | F1, F2 |
| L2 | GET /invoices | user to database | billing | Input Validation And Injection Review | covered | src/invoices.js | query is parameterized at line 3 | F3 |
| L3 | file upload | user to storage | billing | File Upload / Download Review | not-applicable | - | the application has no upload or download endpoint | - |
| L4 | admin console | operator to all tenants | admin | Authorization And Access Control Review | out-of-scope | - | separate repository, excluded by the user for this run | - |

### Audit Findings
| id | verdict | severity | title | trace | demonstrated impact | verified by |
|---|---|---|---|---|---|---|
| F1 | Confirmed | High | Tenant id taken from the query string | `src/invoices.js:2` -> `src/invoices.js:3` | any signed-in user reads another tenant's invoices | verifier 2 (new session), Probable; Resolved: 4d5e6f70 |
| F2 | Needs validation | - | Rate limit on invoice listing | src/invoices.js:1 | Missing fact: whether the gateway limits this route; check: owner reads the gateway route table | verifier 2 (new session) |
| F3 | Rejected | - | SQL injection in invoice query | src/invoices.js:3 | Reason: the value is bound as parameter $1 at src/invoices.js:3 | verifier 3 (new session) |

## Handoff
- Next role: none.
