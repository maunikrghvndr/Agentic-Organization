// Tests for validate-release-audit.mjs. Run: node --test Scripts/validate-release-audit.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { MAX_FILE_BYTES, safe, validate } from "./validate-release-audit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "validate-release-audit.mjs");
const fixtures = path.join(here, "tests", "release-audit");
const repoRoot = path.join(fixtures, "repo");
const validFile = path.join(fixtures, "valid-pass.md");
const VALID = fs.readFileSync(validFile, "utf8");

const RELEASE = fs.readFileSync(path.join(fixtures, "valid-release.md"), "utf8");
const releaseFile = path.join(fixtures, "valid-release.md");
const HEAD = "0a1b2c3d4e5f60718293a4b5c6d7e8f901234567";

function errorsOf(text, options = {}) {
  return validate(text, { repoRoot, ...options }).errors;
}

const PLANNED_ROW = "| L9 | webhook | third party to billing | billing | API Security Review | planned | - | - | - |";
const OPEN_CRITICAL = "| F9 | Confirmed | Critical | Unauthenticated export | src/auth.js:1 | anyone downloads every invoice | verifier 4 (new session) |";
const LAST_LEDGER_ROW = "| L4 | admin console | operator to all tenants | admin | Authorization And Access Control Review | out-of-scope | - | separate repository, excluded by the user for this run | - |";
const LAST_FINDING_ROW = "| F3 | Rejected | - | SQL injection in invoice query | src/invoices.js:3 | Reason: the value is bound as parameter $1 at src/invoices.js:3 | verifier 3 (new session) |";

/** Replace exactly one occurrence, so a fixture edit cannot silently miss. */
function swap(text, from, to) {
  assert.equal(text.split(from).length - 1, 1, `fixture must contain exactly one ${JSON.stringify(from)}`);
  return text.replace(from, to);
}

function assertFails(text, pattern, options = {}) {
  const errors = errorsOf(text, options);
  assert.ok(errors.some((message) => pattern.test(message)), `expected an error matching ${pattern}, got:\n${errors.join("\n")}`);
}

function runCli(args, cwd = here) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
}

test("valid Pass record has no errors", () => {
  const { errors, summary } = validate(VALID, { repoRoot });
  assert.deepEqual(errors, []);
  assert.deepEqual(summary, { verdict: "Pass", ledgerRows: 4, findings: 3, grade: "scoped" });
});

test("CRLF line endings and a BOM are accepted", () => {
  assert.deepEqual(errorsOf(`\uFEFF${VALID.replace(/\n/g, "\r\n")}`), []);
});

test("Needs Changes with an open Confirmed finding is valid", () => {
  let text = swap(VALID, "- Release audit: Pass |", "- Release audit: Needs Changes |");
  text = swap(text, "; Resolved: 4d5e6f70", "");
  assert.deepEqual(errorsOf(text), []);
});

test("Incomplete with planned rows is valid, and needs a reason", () => {
  let text = swap(VALID, "- Release audit: Pass |", "- Release audit: Incomplete: budget exhausted before the critic |");
  text = swap(text, "| not-applicable | - | the application has no upload or download endpoint |", "| planned | - | - |");
  assert.deepEqual(errorsOf(text), []);
  assertFails(swap(VALID, "- Release audit: Pass |", "- Release audit: Incomplete |"), /headline verdict/);
});

test("a later run adds a headline line; the last one counts", () => {
  const second = "- Release audit: Pass | sha 4d5e6f70 | engine A: cloudflare@c1c8a8c (skill installed and both validators ran) | profile standard | scope billing | critics clean 2 | run 2 | 2026-11-19";
  const first = "- Release audit: Needs Changes | sha 0a1b2c3d | engine B: library (first run) | profile standard | scope billing | critics clean 0 | run 1 | 2026-11-18";
  const line = VALID.split("\n").find((candidate) => candidate.startsWith("- Release audit:"));
  assert.deepEqual(errorsOf(swap(VALID, line, `${first}\n${second}`)), []);
  assertFails(swap(VALID, line, `${second}\n${first}`), /run numbers must increase/);
});

test("section, line and tables must be present", () => {
  assertFails("# Task\n\n## Summary\n- nothing\n", /no `## Release Audit` section/);
  assertFails(`${VALID}\n## Release Audit\n`, /2 `## Release Audit` sections/);
  assertFails(VALID.replace(/^- Release audit:.*$/m, ""), /missing the `- Release audit: \.\.\.` line/);
  assertFails(swap(VALID, "### Coverage Ledger", "### Ledger"), /missing `### Coverage Ledger`/);
  assertFails(swap(VALID, "### Audit Findings", "### Findings"), /missing `### Audit Findings`/);
});

test("a record inside a code fence is not a record", () => {
  assertFails(`# Task\n\n\`\`\`md\n${VALID}\n\`\`\`\n`, /no `## Release Audit` section/);
});

test("malformed headline fields are reported", () => {
  assertFails(swap(VALID, "- Release audit: Pass |", "- Release audit: Passed |"), /headline verdict "Passed"/);
  assertFails(swap(VALID, "sha 0a1b2c3d", "sha HEAD"), /headline field 2/);
  assertFails(swap(VALID, "engine B: library (skill validators cannot run on native Windows)", "engine B: library"), /headline field 3/);
  assertFails(swap(VALID, "engine B: library", "engine C: other"), /headline field 3/);
  assertFails(swap(VALID, "profile standard", "profile thorough"), /headline field 4/);
  assertFails(swap(VALID, "scope billing", "scope"), /headline field 5/);
  assertFails(swap(VALID, "critics clean 2", "critics clean many"), /headline field 6/);
  assertFails(swap(VALID, "run 1", "run 0"), /headline field 7/);
  assertFails(swap(VALID, "| 2026-11-18", "| 2026-02-30"), /headline field 8/);
  assertFails(swap(VALID, " | profile standard", ""), /needs 8 fields/);
  assertFails(swap(VALID, " | scope billing | critics clean 2", ""), /needs 8 fields/);
});

test("malformed tables are reported", () => {
  assertFails(swap(VALID, "| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |", "| id | surface | boundary | subsystem | state | paths read | checks | findings |"), /`### Coverage Ledger` line \d+: header must be exactly/);
  assertFails(swap(VALID, "|---|---|---|---|---|---|---|---|---|\n", ""), /separator row with 9 columns/);
  assertFails(swap(VALID, "| L4 | admin console |", "| L4 | admin | console |"), /row has 10 cells, expected 9/);
  assertFails(swap(VALID, "| F3 | Rejected | - |", "| F3 | Rejected |"), /row has 6 cells, expected 7/);
  assertFails(swap(VALID, "| L2 | GET /invoices", "| L1 | GET /invoices"), /duplicate id "L1"/);
  assertFails(swap(VALID, "| L4 | admin console", "| 4 | admin console"), /id "4" must start with a letter/);
});

test("an escaped pipe stays inside its cell", () => {
  assert.deepEqual(errorsOf(swap(VALID, "query is parameterized at line 3", "query is parameterized \\| line 3")), []);
});

test("state and verdict must be in the allowed sets", () => {
  assertFails(swap(VALID, "| not-applicable |", "| reviewed |"), /state "reviewed" is not one of/);
  assertFails(swap(VALID, "| F3 | Rejected |", "| F3 | Likely |"), /verdict "Likely" is not one of/);
  assertFails(swap(VALID, "| Confirmed | High |", "| Confirmed | Severe |"), /severity "Severe" is not one of/);
});

test("covered needs paths and checks; closed-without-review states need a reason", () => {
  assertFails(swap(VALID, "| covered | src/invoices.js | query is parameterized at line 3 |", "| covered | - | query is parameterized at line 3 |"), /`covered` needs non-empty `paths read`/);
  assertFails(swap(VALID, "| covered | src/invoices.js | query is parameterized at line 3 |", "| covered | src/invoices.js | - |"), /`covered` needs non-empty `checks`/);
  assertFails(swap(VALID, "the application has no upload or download endpoint", "-"), /`not-applicable` needs a reason/);
  assertFails(swap(VALID, "separate repository, excluded by the user for this run", ""), /`out-of-scope` needs a reason/);
});

test("cited paths must exist as files inside the repository root", () => {
  const cell = "| covered | src/invoices.js | query";
  assertFails(swap(VALID, cell, "| covered | src/missing.js | query"), /`paths read` entry "src\/missing\.js" does not exist/);
  assertFails(swap(VALID, cell, "| covered | src | query"), /is a directory/);
  assertFails(swap(VALID, cell, "| covered | src/*.js | query"), /is a glob/);
  assertFails(swap(VALID, cell, "| covered | ../valid-pass.md | query"), /contains `\.\.`/);
  assertFails(swap(VALID, cell, "| covered | /etc/hostname | query"), /is absolute/);
  assertFails(swap(VALID, cell, "| covered | C:\\Windows\\win.ini | query"), /is absolute/);
});

test("a symlink that leaves the repository root is rejected", (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "release-audit-"));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, "repo");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "src", "invoices.js"), path.join(root, "src", "invoices.js"));
  fs.copyFileSync(path.join(repoRoot, "src", "auth.js"), path.join(root, "src", "auth.js"));
  fs.writeFileSync(path.join(temp, "outside.txt"), "outside\n");
  try {
    fs.symlinkSync(path.join(temp, "outside.txt"), path.join(root, "src", "link.js"));
  } catch {
    t.skip("symlinks are not available on this host");
    return;
  }
  const text = swap(VALID, "| covered | src/invoices.js | query", "| covered | src/link.js | query");
  const { errors } = validate(text, { repoRoot: root });
  assert.ok(errors.some((message) => /resolves outside the repository root/.test(message)), errors.join("\n"));
});

test("ledger and findings must agree with each other", () => {
  assertFails(swap(VALID, "| F1, F2 |", "| F1, F2, F9 |"), /`findings` cites "F9", which has no row/);
  assertFails(swap(VALID, "at line 3 | F3 |", "at line 3 | - |"), /finding "F3" \(line \d+\): no ledger row lists this finding/);
});

test("Confirmed needs severity, a path:line trace and a demonstrated impact", () => {
  assertFails(swap(VALID, "| Confirmed | High |", "| Confirmed | - |"), /`Confirmed` needs a severity/);
  assertFails(swap(VALID, "`src/invoices.js:2` -> `src/invoices.js:3`", "the invoices handler"), /`Confirmed` needs a `path:line` trace/);
  assertFails(swap(VALID, "any signed-in user reads another tenant's invoices", "-"), /`Confirmed` needs a demonstrated impact/);
});

test("an open Confirmed trace must point at real lines; a resolved one is historical", () => {
  const open = swap(swap(VALID, "- Release audit: Pass |", "- Release audit: Needs Changes |"), "; Resolved: 4d5e6f70", "");
  assertFails(swap(open, "`src/invoices.js:2` ->", "`src/gone.js:2` ->"), /trace entry "src\/gone\.js:2" does not exist/);
  assertFails(swap(open, "-> `src/invoices.js:3`", "-> `src/invoices.js:300`"), /points past the end of the file/);
  assert.deepEqual(errorsOf(swap(VALID, "`src/invoices.js:2` ->", "`src/gone.js:2` ->")), []);
});

test("Needs validation carries no severity and names the missing fact; Rejected keeps its reason", () => {
  assertFails(swap(VALID, "| F2 | Needs validation | - |", "| F2 | Needs validation | Medium |"), /`Needs validation` carries no severity/);
  assertFails(swap(VALID, "Missing fact: whether the gateway limits this route; check: owner reads the gateway route table", "probably unlimited"), /names the missing fact/);
  assertFails(swap(VALID, "Reason: the value is bound as parameter $1 at src/invoices.js:3", "-"), /`Rejected` keeps its reason/);
  assertFails(swap(VALID, "| verifier 3 (new session) |", "| - |"), /`verified by` is empty/);
});

test("Pass is refused over planned, candidate or deferred rows", () => {
  for (const state of ["planned", "candidate", "deferred"]) {
    const text = swap(VALID, "| out-of-scope | - | separate repository", `| ${state} | - | separate repository`);
    assertFails(text, new RegExp(`headline says \`Pass\` but 1 ledger row\\(s\\) are \`${state}\`: "L4"`));
  }
});

test("Pass is refused over a Confirmed finding with no Resolved marker", () => {
  assertFails(swap(VALID, "; Resolved: 4d5e6f70", ""), /headline says `Pass` but 1 `Confirmed` finding\(s\) have no `Resolved: <fix sha>` marker.*"F1"/);
  assertFails(swap(VALID, "; Resolved: 4d5e6f70", "; Resolved: soon"), /have no `Resolved: <fix sha>` marker/);
});

test("Pass is refused over an empty ledger", () => {
  const text = "## Release Audit\n- Release audit: Pass | sha 0a1b2c3d | engine B: library (fallback) | profile quick | scope full | critics clean 1 | run 1 | 2026-11-18\n\n### Coverage Ledger\n| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |\n|---|---|---|---|---|---|---|---|---|\n\n### Audit Findings\n| id | verdict | severity | title | trace | demonstrated impact | verified by |\n|---|---|---|---|---|---|---|\n";
  assertFails(text, /the coverage ledger is empty/);
});

test("diagnostics escape control and non-ASCII characters and truncate", () => {
  assert.equal(safe("a\u001b[31m\u202eb"), '"a\\u{1b}[31m\\u{202e}b"');
  assert.ok(safe("x".repeat(500)).length < 140);
  const errors = errorsOf(swap(VALID, "| not-applicable |", "| \u001b[2Jcovered\u200b |"));
  assert.ok(errors.length > 0);
  assert.ok(errors.every((message) => /^[\x20-\x7e]*$/.test(message)), errors.join("\n"));
});

test("a bad --repo root is an error, not a pass", () => {
  const { errors } = validate(VALID, { repoRoot: path.join(repoRoot, "does-not-exist") });
  assert.match(errors[0], /is not a readable directory/);
});

test("CLI: exit 0 on the valid fixture", () => {
  const result = runCli([validFile, "--repo", repoRoot]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /release-audit: OK \(Pass, scoped; 4 ledger row\(s\); 3 finding\(s\)\)/);
});

test("CLI: --repo defaults to the current directory", () => {
  assert.equal(runCli([validFile], repoRoot).status, 0);
  assert.equal(runCli([validFile], here).status, 1);
});

test("CLI: exit 1 with clear messages on the invalid fixture", () => {
  const result = runCli([path.join(fixtures, "invalid-pass-with-open-work.md"), "--repo", repoRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /headline says `Pass` but 1 ledger row\(s\) are `planned`: "L2"/);
  assert.match(result.stderr, /headline says `Pass` but 1 ledger row\(s\) are `deferred`: "L3"/);
  assert.match(result.stderr, /`Confirmed` finding\(s\) have no `Resolved: <fix sha>` marker/);
  assert.match(result.stderr, /FAILED with 3 error\(s\)/);
});

test("CLI: exit 2 on usage errors and unreadable or oversized input", (t) => {
  assert.equal(runCli([]).status, 2);
  assert.equal(runCli([validFile, "--repo"]).status, 2);
  assert.equal(runCli([validFile, "--unknown"]).status, 2);
  assert.equal(runCli([path.join(fixtures, "no-such-file.md")]).status, 2);
  assert.equal(runCli([fixtures]).status, 2);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "release-audit-"));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const big = path.join(temp, "big.md");
  fs.writeFileSync(big, Buffer.alloc(MAX_FILE_BYTES + 1, 0x61));
  const oversized = runCli([big]);
  assert.equal(oversized.status, 2);
  assert.match(oversized.stderr, /is larger than/);
  const binary = path.join(temp, "binary.md");
  fs.writeFileSync(binary, Buffer.from([0x23, 0xff, 0xfe, 0x0a]));
  assert.match(runCli([binary]).stderr, /is not valid UTF-8/);
});

// --- Security review 2026-11-18: B1-B3, N5, N6 ---

test("B1: a planned row after a blank line is not ignored", () => {
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n\n${PLANNED_ROW}`), /line \d+: table-like line outside the two record tables/);
});

test("B1: a planned row after a prose line is not ignored", () => {
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\nSecond pass:\n${PLANNED_ROW}`), /table-like line outside the two record tables/);
});

test("B1: a planned row inside a code fence is not ignored", () => {
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n\`\`\`\n${PLANNED_ROW}\n\`\`\``), /line \d+: code fence inside `## Release Audit`/);
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n~~~md\n${PLANNED_ROW}\n~~~`), /code fence inside `## Release Audit`/);
});

test("B1: an open Confirmed Critical finding after a blank line is not ignored", () => {
  assertFails(swap(VALID, LAST_FINDING_ROW, `${LAST_FINDING_ROW}\n\n${OPEN_CRITICAL}`), /table-like line outside the two record tables/);
});

test("B1: a planned row inside an HTML comment is not ignored", () => {
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n<!--\n${PLANNED_ROW}\n-->`), /line \d+: HTML comment inside `## Release Audit`/);
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n<!-- ${PLANNED_ROW} -->`), /HTML comment inside `## Release Audit`/);
});

test("B1: a deferred row in a second table segment is not ignored", () => {
  const second = "| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |\n|---|---|---|---|---|---|---|---|---|\n| L9 | export job | scheduler to tenant data | billing | Wildcard | deferred | - | critic row | - |";
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n\n${second}`), /table-like line outside the two record tables/);
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n\n#### More\n${second}`), /table-like line outside the two record tables/);
});

test("B1: a row written without its leading pipe is not ignored", () => {
  assertFails(swap(VALID, LAST_LEDGER_ROW, `${LAST_LEDGER_ROW}\n${PLANNED_ROW.slice(2)}`), /table-like line outside the two record tables/);
});

test("B1: the end-of-file trailer is the only comment allowed in the section", () => {
  assert.deepEqual(errorsOf(VALID.replace(/\n## Handoff[\s\S]*$/, "\n<!-- END-OF-FILE -->\n")), []);
});

test("B2: a later headline in another spelling does not leave an old Pass standing", () => {
  const line = VALID.split("\n").find((candidate) => candidate.startsWith("- Release audit:"));
  const later = line.replace("Pass", "Needs Changes").replace("run 1", "run 2");
  for (const variant of [
    later.replace("- Release audit:", "- Release Audit:"),
    `  ${later}`,
    `\t${later}`,
    later.replace("- Release audit:", "* Release audit:"),
    later.replace("- Release audit:", "+ release audit :"),
    later.replace("- Release audit:", "-Release audit:"),
    later.replace("- Release audit:", "Release audit:"),
    later.replace("- Release audit:", "- **Release audit:**"),
    `> ${later}`,
  ]) {
    assertFails(swap(VALID, line, `${line}\n${variant}`), /line \d+: looks like a headline but is not written exactly `- Release audit: \.\.\.` at the start of the line/);
  }
});

test("B3: Pass needs a covered row, a clean critic, a real sha and a date that is not in the future", () => {
  let none = swap(VALID, "| covered | `src/invoices.js:1-4`; `src/auth.js` | followed tenant parameter from request to query; read the guard |", "| not-applicable | - | no tenant data |");
  none = swap(none, "| covered | src/invoices.js | query is parameterized at line 3 |", "| not-applicable | - | no database |");
  assertFails(none, /headline says `Pass` but no ledger row is `covered`/);
  assertFails(swap(VALID, "critics clean 2", "critics clean 0"), /headline says `Pass` but `critics clean` is 0/);
  assertFails(swap(VALID, "sha 0a1b2c3d", "sha 0000000"), /headline field 2 .* is all zeros/);
  assertFails(swap(VALID, "| 2026-11-18", "| 2999-01-01"), /headline says `Pass` but its date "2999-01-01" is in the future/);
  const today = new Date(Date.UTC(2026, 10, 18, 23, 0, 0));
  assert.deepEqual(errorsOf(swap(VALID, "| 2026-11-18", "| 2026-11-19"), { today }), [], "one day of clock skew is allowed");
  assertFails(swap(VALID, "| 2026-11-18", "| 2026-11-20"), /is in the future/, { today });
  assert.deepEqual(errorsOf(VALID, { today }), []);
});

test("B3: a Needs Changes record does not need a clean critic", () => {
  let text = swap(VALID, "- Release audit: Pass |", "- Release audit: Needs Changes |");
  text = swap(swap(text, "; Resolved: 4d5e6f70", ""), "critics clean 2", "critics clean 0");
  assert.deepEqual(errorsOf(text), []);
});

test("B3: --release needs a full-scope standard or deep Pass at the release head", () => {
  const { errors, summary } = validate(RELEASE, { repoRoot, release: true, head: HEAD });
  assert.deepEqual(errors, []);
  assert.equal(summary.grade, "release-grade");
  assert.deepEqual(errorsOf(RELEASE, { release: true, head: "0a1b2c3d" }), []);
  assert.deepEqual(errorsOf(swap(RELEASE, "profile standard", "profile deep"), { release: true, head: HEAD }), []);
  assert.equal(validate(RELEASE, { repoRoot }).summary.grade, "scoped");

  const release = { release: true, head: HEAD };
  assertFails(VALID, /--release: scope is "billing", not `full`/, release);
  assertFails(VALID, /--release: 1 ledger row\(s\) are `out-of-scope`: "L4"/, release);
  assertFails(swap(RELEASE, "profile standard", "profile quick"), /--release: profile is `quick`; a release needs `standard` or `deep`/, release);
  assertFails(RELEASE, /--release: headline sha "0a1b2c3d" is not the release head/, { release: true, head: "1a1b2c3d4e5f60718293a4b5c6d7e8f901234567" });
  assertFails(RELEASE, /--head .* is not a 7-40 character hex sha/, { release: true, head: "HEAD" });
  let open = swap(RELEASE, "- Release audit: Pass |", "- Release audit: Needs Changes |");
  open = swap(open, "; Resolved: 4d5e6f70", "");
  assertFails(open, /--release: the latest verdict is `Needs Changes`, not `Pass`/, release);
});

test("N5: `paths read` made only of separators is empty", () => {
  for (const cell of [";", "; ;", ",", "`;`", "- ; -"]) {
    assertFails(swap(VALID, "| covered | src/invoices.js | query", `| covered | ${cell} | query`), /`covered` needs non-empty `paths read`/);
  }
});

test("N5: the Resolved marker is anchored and its sha is real", () => {
  for (const cell of ["; not Resolved: 0000000", "; Resolved: 0000000", "; Resolved: 4d5e6f70 (planned)", "; unResolved: 4d5e6f70", "; Resolved: 4d5e6f70; reopened"]) {
    assertFails(swap(VALID, "; Resolved: 4d5e6f70", cell), /have no `Resolved: <fix sha>` marker/);
  }
  assert.deepEqual(errorsOf(swap(VALID, "; Resolved: 4d5e6f70", "; Resolved: `4d5e6f70`")), []);
});

test("N5: a line beyond the end of a cited file is an error in `paths read` too", () => {
  assertFails(swap(VALID, "`src/invoices.js:1-4`;", "`src/invoices.js:1-400`;"), /`paths read` entry "src\/invoices\.js:1-400" points past the end of the file/);
  assertFails(swap(VALID, "`src/invoices.js:1-4`;", "`src/invoices.js:9`;"), /`paths read` entry "src\/invoices\.js:9" points past the end of the file/);
  assertFails(swap(VALID, "`src/invoices.js:1-4`;", "`src/invoices.js:4-1`;"), /has an invalid line range/);
});

test("N6: a 200 KB token in a trace cell is handled in under 2 seconds", () => {
  const open = swap(swap(VALID, "- Release audit: Pass |", "- Release audit: Needs Changes |"), "; Resolved: 4d5e6f70", "");
  for (const token of [`${")".repeat(200 * 1024)}x`, `${"(".repeat(200 * 1024)}`, `x${".".repeat(200 * 1024)}:1x`]) {
    const started = process.hrtime.bigint();
    const errors = errorsOf(swap(open, "`src/invoices.js:2` ->", `${token} ->`));
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    assert.ok(elapsedMs < 2000, `took ${elapsedMs} ms`);
    assert.ok(Array.isArray(errors));
  }
});

test("CLI: --release and --head", () => {
  const ok = runCli([releaseFile, "--repo", repoRoot, "--release", "--head", HEAD]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /release-audit: OK \(Pass, release-grade; 4 ledger row\(s\); 3 finding\(s\)\)/);
  assert.match(runCli([releaseFile, "--repo", repoRoot]).stdout, /OK \(Pass, scoped;/);
  const scoped = runCli([validFile, "--repo", repoRoot, "--release", "--head", HEAD]);
  assert.equal(scoped.status, 1);
  assert.match(scoped.stderr, /--release: scope is "billing", not `full`/);
  assert.equal(runCli([releaseFile, "--repo", repoRoot, "--head", HEAD]).status, 2, "--head needs --release");
  assert.equal(runCli([releaseFile, "--repo", repoRoot, "--release", "--head"]).status, 2);
});
