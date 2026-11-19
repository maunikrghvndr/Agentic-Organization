# Task: fixture release (invalid: Pass over open work)

## Release Audit
- Release audit: Pass | sha 0a1b2c3d | engine B: library (no isolated agents on this host) | profile quick | scope full | critics clean 1 | run 1 | 2026-11-18

### Coverage Ledger
| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |
|---|---|---|---|---|---|---|---|---|
| L1 | GET /invoices | anonymous to tenant data | billing | Authorization And Access Control Review | covered | src/invoices.js | followed tenant parameter | F1 |
| L2 | webhook | third party to billing | billing | API Security Review | planned | - | - | - |
| L3 | export job | scheduler to tenant data | billing | Wildcard | deferred | - | critic row, quick profile | - |

### Audit Findings
| id | verdict | severity | title | trace | demonstrated impact | verified by |
|---|---|---|---|---|---|---|
| F1 | Confirmed | High | Tenant id taken from the query string | src/invoices.js:2 | any signed-in user reads another tenant's invoices | verifier 2 (new session), Probable |
