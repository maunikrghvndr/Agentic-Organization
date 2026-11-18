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

function errorsOf(text) {
  return validate(text, { repoRoot }).errors;
}

/** Replace exactly one occurrence, so a fixture edit cannot silently miss. */
function swap(text, from, to) {
  assert.equal(text.split(from).length - 1, 1, `fixture must contain exactly one ${JSON.stringify(from)}`);
  return text.replace(from, to);
}

function assertFails(text, pattern) {
  const errors = errorsOf(text);
  assert.ok(errors.some((message) => pattern.test(message)), `expected an error matching ${pattern}, got:\n${errors.join("\n")}`);
}

function runCli(args, cwd = here) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
}

test("valid Pass record has no errors", () => {
  const { errors, summary } = validate(VALID, { repoRoot });
  assert.deepEqual(errors, []);
  assert.deepEqual(summary, { verdict: "Pass", ledgerRows: 4, findings: 3 });
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
  const second = "- Release audit: Pass | sha 4d5e6f70 | engine A: cloudflare@c1c8a8c (skill installed and both validators ran) | profile standard | run 2 | 2026-11-19";
  const first = "- Release audit: Needs Changes | sha 0a1b2c3d | engine B: library (first run) | profile standard | run 1 | 2026-11-18";
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
  assertFails(swap(VALID, "run 1", "run 0"), /headline field 5/);
  assertFails(swap(VALID, "| 2026-11-18", "| 2026-02-30"), /headline field 6/);
  assertFails(swap(VALID, " | profile standard", ""), /needs 6 fields/);
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
  const text = "## Release Audit\n- Release audit: Pass | sha 0a1b2c3d | engine B: library (fallback) | profile quick | run 1 | 2026-11-18\n\n### Coverage Ledger\n| id | surface | boundary | subsystem | checklist | state | paths read | checks | findings |\n|---|---|---|---|---|---|---|---|---|\n\n### Audit Findings\n| id | verdict | severity | title | trace | demonstrated impact | verified by |\n|---|---|---|---|---|---|---|\n";
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
  assert.match(result.stdout, /release-audit: OK \(Pass; 4 ledger row\(s\); 3 finding\(s\)\)/);
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
