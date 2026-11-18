#!/usr/bin/env node
/**
 * Validate the `## Release Audit` record of a task file.
 *
 * Format and rules: EngineeringTeam/security-engineer.md -> Release Audit
 * (whole application) -> Record Format.
 *
 * Usage:
 *   node Scripts/validate-release-audit.mjs <task-file> [--repo <root>]
 *
 * --repo is the root of the audited repository; cited paths are resolved
 * against it (default: the current directory).
 *
 * Exit 0 = record is consistent. Exit 1 = validation errors (stderr, one per
 * line). Exit 2 = usage error or unreadable input.
 *
 * A pass proves the record is well formed and self-consistent. It does not
 * prove that a finding is true or that coverage is complete.
 *
 * The task file is untrusted input: size is bounded, nothing in it is
 * evaluated or passed to a shell, cited paths cannot leave the repository
 * root, and text echoed in diagnostics is escaped and truncated.
 * No dependencies; Node built-ins only. Works on Windows, macOS and Linux.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_PATHS_PER_CELL = 500;
const MAX_ERRORS = 100;
const MAX_ECHO = 120;

const SECTION_HEADING = /^##[ \t]+Release Audit[ \t]*$/;
const HEADLINE_PREFIX = "- Release audit:";
const LEDGER_HEADING = "Coverage Ledger";
const FINDINGS_HEADING = "Audit Findings";
const LEDGER_COLUMNS = ["id", "surface", "boundary", "subsystem", "checklist", "state", "paths read", "checks", "findings"];
const FINDING_COLUMNS = ["id", "verdict", "severity", "title", "trace", "demonstrated impact", "verified by"];
const STATES = ["planned", "covered", "candidate", "not-applicable", "out-of-scope", "deferred"];
const STATES_NEEDING_REASON = ["not-applicable", "out-of-scope", "deferred"];
const STATES_BLOCKING_PASS = ["planned", "candidate", "deferred"];
const VERDICTS = ["Confirmed", "Needs validation", "Rejected"];
const SEVERITIES = ["Critical", "High", "Medium", "Low", "Informational"];
const PROFILES = ["quick", "standard", "deep"];
const EMPTY_MARKERS = new Set(["", "-", "--", "\u2014", "none", "n/a"]);
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const SHA = "[0-9a-f]{7,40}";
const SHA_FIELD = new RegExp(`^sha (${SHA})$`);
const ENGINE_FIELD = new RegExp(`^engine (A: cloudflare@${SHA}|B: library) \\((.+)\\)$`);
const RUN_FIELD = /^run ([1-9][0-9]{0,5})$/;
const DATE_FIELD = /^(\d{4})-(\d{2})-(\d{2})$/;
const RESOLVED_MARKER = new RegExp(`\\bResolved: ${SHA}\\b`);
const MISSING_FACT_PREFIX = /^missing fact:\s*\S/i;
const LINE_SUFFIX = /:(\d{1,7})(?:-(\d{1,7}))?$/;

/** Escape control, format and non-ASCII characters and truncate, for safe diagnostics. */
export function safe(value) {
  const text = String(value);
  const cut = text.length > MAX_ECHO ? `${text.slice(0, MAX_ECHO)}...` : text;
  let out = "";
  for (const ch of cut) {
    const code = ch.codePointAt(0);
    out += code < 0x20 || code > 0x7e ? `\\u{${code.toString(16)}}` : ch;
  }
  return `"${out}"`;
}

function isEmpty(cell) {
  return EMPTY_MARKERS.has(cell.toLowerCase());
}

function stripTicks(cell) {
  return cell.replace(/`/g, "").trim();
}

/** Split one Markdown table line into trimmed cells; `\|` is a literal pipe. */
function splitRow(line) {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);
  const cells = [];
  let current = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\\" && text[i + 1] === "|") {
      current += "|";
      i += 1;
    } else if (ch === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isSeparatorRow(cells, width) {
  return cells.length === width && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

/** Lines of the single `## Release Audit` section, with fenced code blocks removed. */
function extractSection(lines, errors) {
  let fence = null;
  let start = -1;
  let count = 0;
  const section = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    if (SECTION_HEADING.test(line)) {
      count += 1;
      if (count === 1) start = i;
      continue;
    }
    if (start !== -1 && count === 1) {
      if (/^#{1,2}[ \t]+\S/.test(line)) start = -2;
      else if (start >= 0) section.push({ text: line, number: i + 1 });
    }
  }
  if (count === 0) errors.push("no `## Release Audit` section found (outside code fences)");
  if (count > 1) errors.push(`${count} \`## Release Audit\` sections found; a task file carries exactly one`);
  return count === 1 ? section : null;
}

function isValidDate(text) {
  const match = DATE_FIELD.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseHeadline(entry, errors) {
  const where = `line ${entry.number}`;
  const fields = entry.text.slice(HEADLINE_PREFIX.length).split("|").map((field) => field.trim());
  if (fields.length !== 6) {
    errors.push(`${where}: headline needs 6 fields separated by \`|\` (verdict, sha, engine, profile, run, date), found ${fields.length}`);
    return null;
  }
  const [verdictText, shaText, engineText, profileText, runText, dateText] = fields;
  let verdict = null;
  if (verdictText === "Pass" || verdictText === "Needs Changes") verdict = verdictText;
  else if (/^Incomplete: \S/.test(verdictText)) verdict = "Incomplete";
  else errors.push(`${where}: headline verdict ${safe(verdictText)} is not \`Pass\`, \`Needs Changes\` or \`Incomplete: <reason>\``);
  if (!SHA_FIELD.test(shaText)) errors.push(`${where}: headline field 2 ${safe(shaText)} is not \`sha <7-40 lowercase hex>\``);
  if (!ENGINE_FIELD.test(engineText)) errors.push(`${where}: headline field 3 ${safe(engineText)} is not \`engine A: cloudflare@<commit> (<why>)\` or \`engine B: library (<why>)\``);
  const profileMatch = /^profile (\S+)$/.exec(profileText);
  if (!profileMatch || !PROFILES.includes(profileMatch[1])) errors.push(`${where}: headline field 4 ${safe(profileText)} is not \`profile quick|standard|deep\``);
  const runMatch = RUN_FIELD.exec(runText);
  if (!runMatch) errors.push(`${where}: headline field 5 ${safe(runText)} is not \`run <positive integer>\``);
  if (!isValidDate(dateText)) errors.push(`${where}: headline field 6 ${safe(dateText)} is not a valid YYYY-MM-DD date`);
  return { verdict, run: runMatch ? Number(runMatch[1]) : null, number: entry.number };
}

/** Parse the table under `### <heading>` inside the section. */
function parseTable(section, heading, columns, errors) {
  const headingPattern = new RegExp(`^###[ \\t]+${heading}[ \\t]*$`);
  const indexes = [];
  section.forEach((entry, index) => {
    if (headingPattern.test(entry.text)) indexes.push(index);
  });
  if (indexes.length === 0) {
    errors.push(`missing \`### ${heading}\` under \`## Release Audit\``);
    return null;
  }
  if (indexes.length > 1) {
    errors.push(`\`### ${heading}\` appears ${indexes.length} times; exactly one is allowed`);
    return null;
  }
  let cursor = indexes[0] + 1;
  while (cursor < section.length && !section[cursor].text.trim().startsWith("|")) {
    if (/^#{1,6}[ \t]+\S/.test(section[cursor].text)) break;
    cursor += 1;
  }
  if (cursor >= section.length || !section[cursor].text.trim().startsWith("|")) {
    errors.push(`\`### ${heading}\`: table is missing`);
    return null;
  }
  const header = splitRow(section[cursor].text).map((cell) => cell.toLowerCase());
  if (header.length !== columns.length || header.some((cell, index) => cell !== columns[index])) {
    errors.push(`\`### ${heading}\` line ${section[cursor].number}: header must be exactly \`| ${columns.join(" | ")} |\``);
    return null;
  }
  cursor += 1;
  if (cursor >= section.length || !isSeparatorRow(splitRow(section[cursor].text), columns.length)) {
    errors.push(`\`### ${heading}\`: the header row must be followed by a \`|---|\` separator row with ${columns.length} columns`);
    return null;
  }
  cursor += 1;
  const rows = [];
  for (; cursor < section.length && section[cursor].text.trim().startsWith("|"); cursor += 1) {
    const entry = section[cursor];
    if (rows.length >= MAX_ROWS) {
      errors.push(`\`### ${heading}\`: more than ${MAX_ROWS} rows; the rest was not read`);
      break;
    }
    const cells = splitRow(entry.text);
    if (cells.length !== columns.length) {
      errors.push(`\`### ${heading}\` line ${entry.number}: row has ${cells.length} cells, expected ${columns.length} (write a literal pipe as \`\\|\`)`);
      continue;
    }
    const row = { number: entry.number };
    columns.forEach((column, index) => {
      row[column] = cells[index];
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Resolve one cited path against the repository root.
 * Returns { error } or { file } (absolute path of an existing regular file inside the root).
 */
function resolveCitedPath(cited, root) {
  const normalized = cited.replace(/\\/g, "/");
  if (normalized === "" || normalized.includes("\0")) return { error: "is empty" };
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return { error: "is absolute; cite paths relative to the repository root" };
  if (/[*?]/.test(normalized)) return { error: "is a glob; list the files actually read" };
  const segments = normalized.split("/").filter((segment) => segment !== "" && segment !== ".");
  if (segments.length === 0) return { error: "is empty" };
  if (segments.includes("..")) return { error: "contains `..`; cite paths relative to the repository root" };
  const candidate = path.join(root, ...segments);
  let real;
  try {
    real = fs.realpathSync(candidate);
  } catch {
    return { error: "does not exist" };
  }
  const relative = path.relative(root, real);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return { error: "resolves outside the repository root" };
  let stat;
  try {
    stat = fs.statSync(real);
  } catch {
    return { error: "does not exist" };
  }
  if (stat.isDirectory()) return { error: "is a directory; list the files actually read" };
  if (!stat.isFile()) return { error: "is not a regular file" };
  return { file: real };
}

function splitList(cell) {
  return cell.split(/<br\s*\/?>|[;,]/i).map(stripTicks).filter((item) => item !== "");
}

function checkPathsRead(row, root, errors) {
  const where = `ledger row ${safe(row.id)} (line ${row.number})`;
  const items = splitList(row["paths read"]);
  if (items.length > MAX_PATHS_PER_CELL) {
    errors.push(`${where}: more than ${MAX_PATHS_PER_CELL} paths in \`paths read\``);
    return;
  }
  for (const item of items) {
    const cited = item.replace(LINE_SUFFIX, "");
    const result = resolveCitedPath(cited, root);
    if (result.error) errors.push(`${where}: \`paths read\` entry ${safe(item)} ${result.error}`);
  }
}

/** `path:line` tokens of a trace cell. */
function traceTokens(cell) {
  return cell
    .split(/<br\s*\/?>|->|\u2192|[;,\s]/i)
    .map((token) => stripTicks(token).replace(/^[([]+|[)\].]+$/g, ""))
    .filter((token) => !token.includes("://") && LINE_SUFFIX.test(token));
}

function countLines(file) {
  const stat = fs.statSync(file);
  if (stat.size > MAX_FILE_BYTES * 8) return Infinity;
  const buffer = fs.readFileSync(file);
  let count = buffer.length > 0 ? 1 : 0;
  for (let i = 0; i < buffer.length - 1; i += 1) {
    if (buffer[i] === 0x0a) count += 1;
  }
  return count;
}

function checkTrace(finding, root, checkExistence, errors) {
  const where = `finding ${safe(finding.id)} (line ${finding.number})`;
  const tokens = traceTokens(finding.trace);
  if (tokens.length === 0) {
    errors.push(`${where}: \`Confirmed\` needs a \`path:line\` trace`);
    return;
  }
  if (!checkExistence) return;
  for (const token of tokens.slice(0, MAX_PATHS_PER_CELL)) {
    const match = LINE_SUFFIX.exec(token);
    const result = resolveCitedPath(token.replace(LINE_SUFFIX, ""), root);
    if (result.error) {
      errors.push(`${where}: trace entry ${safe(token)} ${result.error}`);
      continue;
    }
    const last = Number(match[2] ?? match[1]);
    if (Number(match[1]) < 1 || last < Number(match[1])) errors.push(`${where}: trace entry ${safe(token)} has an invalid line range`);
    else if (last > countLines(result.file)) errors.push(`${where}: trace entry ${safe(token)} points past the end of the file`);
  }
}

function checkIds(rows, label, errors) {
  const seen = new Set();
  for (const row of rows) {
    row.id = stripTicks(row.id);
    if (!ID_PATTERN.test(row.id)) errors.push(`${label} line ${row.number}: id ${safe(row.id)} must start with a letter and use only letters, digits, \`.\`, \`_\`, \`-\``);
    else if (seen.has(row.id)) errors.push(`${label} line ${row.number}: duplicate id ${safe(row.id)}`);
    seen.add(row.id);
  }
  return seen;
}

/**
 * Validate the release-audit record in `text`.
 * @param {string} text task file contents
 * @param {{ repoRoot: string }} options absolute root of the audited repository
 * @returns {{ errors: string[], summary: { verdict: string|null, ledgerRows: number, findings: number } }}
 */
export function validate(text, { repoRoot }) {
  const errors = [];
  const summary = { verdict: null, ledgerRows: 0, findings: 0 };
  let root;
  try {
    root = fs.realpathSync(repoRoot);
    if (!fs.statSync(root).isDirectory()) throw new Error("not a directory");
  } catch {
    return { errors: [`--repo ${safe(repoRoot)} is not a readable directory`], summary };
  }

  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const section = extractSection(lines, errors);
  if (section === null) return { errors, summary };

  // Headline line(s): one per run, the last one counts.
  const headlines = section.filter((entry) => entry.text.startsWith(HEADLINE_PREFIX)).map((entry) => parseHeadline(entry, errors));
  if (headlines.length === 0) errors.push(`missing the \`${HEADLINE_PREFIX} ...\` line under \`## Release Audit\``);
  const parsed = headlines.filter((headline) => headline !== null);
  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i].run !== null && parsed[i - 1].run !== null && parsed[i].run <= parsed[i - 1].run) {
      errors.push(`line ${parsed[i].number}: run numbers must increase from one headline line to the next`);
    }
  }
  const current = headlines.length > 0 ? headlines[headlines.length - 1] : null;
  summary.verdict = current ? current.verdict : null;

  const ledger = parseTable(section, LEDGER_HEADING, LEDGER_COLUMNS, errors);
  const findings = parseTable(section, FINDINGS_HEADING, FINDING_COLUMNS, errors);
  if (ledger === null || findings === null) return { errors, summary };
  summary.ledgerRows = ledger.length;
  summary.findings = findings.length;

  checkIds(ledger, "ledger", errors);
  const findingIds = checkIds(findings, "findings", errors);

  // Ledger rows.
  const referenced = new Set();
  for (const row of ledger) {
    const where = `ledger row ${safe(row.id)} (line ${row.number})`;
    const state = stripTicks(row.state);
    row.state = state;
    if (!STATES.includes(state)) errors.push(`${where}: state ${safe(state)} is not one of ${STATES.join(", ")}`);
    const hasPaths = !isEmpty(stripTicks(row["paths read"]));
    const hasChecks = !isEmpty(row.checks);
    if (state === "covered" && !hasPaths) errors.push(`${where}: \`covered\` needs non-empty \`paths read\``);
    if (state === "covered" && !hasChecks) errors.push(`${where}: \`covered\` needs non-empty \`checks\``);
    if (STATES_NEEDING_REASON.includes(state) && !hasChecks) errors.push(`${where}: \`${state}\` needs a reason in \`checks\``);
    if (hasPaths) checkPathsRead(row, root, errors);
    if (!isEmpty(stripTicks(row.findings))) {
      for (const id of row.findings.split(/[;,\s]+/).map(stripTicks).filter((item) => item !== "")) {
        referenced.add(id);
        if (!findingIds.has(id)) errors.push(`${where}: \`findings\` cites ${safe(id)}, which has no row under \`### ${FINDINGS_HEADING}\``);
      }
    }
  }

  // Finding rows.
  const openConfirmed = [];
  for (const finding of findings) {
    const where = `finding ${safe(finding.id)} (line ${finding.number})`;
    const verdict = stripTicks(finding.verdict);
    const severity = stripTicks(finding.severity);
    const hasSeverity = !isEmpty(severity);
    const hasImpact = !isEmpty(finding["demonstrated impact"]);
    if (!VERDICTS.includes(verdict)) errors.push(`${where}: verdict ${safe(verdict)} is not one of ${VERDICTS.join(", ")}`);
    if (hasSeverity && !SEVERITIES.includes(severity)) errors.push(`${where}: severity ${safe(severity)} is not one of ${SEVERITIES.join(", ")} or \`-\``);
    if (isEmpty(finding.title)) errors.push(`${where}: title is empty`);
    if (isEmpty(finding["verified by"])) errors.push(`${where}: \`verified by\` is empty; every finding names the verifier that did not find it`);
    if (!referenced.has(finding.id)) errors.push(`${where}: no ledger row lists this finding in its \`findings\` cell`);
    if (verdict === "Confirmed") {
      const resolved = RESOLVED_MARKER.test(finding["verified by"]);
      if (!hasSeverity) errors.push(`${where}: \`Confirmed\` needs a severity`);
      if (!hasImpact) errors.push(`${where}: \`Confirmed\` needs a demonstrated impact`);
      // A resolved finding's trace is historical: the fix may have moved or removed the lines.
      checkTrace(finding, root, !resolved, errors);
      if (!resolved) openConfirmed.push(finding.id);
    } else if (verdict === "Needs validation") {
      if (hasSeverity) errors.push(`${where}: \`Needs validation\` carries no severity (write \`-\`)`);
      if (!MISSING_FACT_PREFIX.test(finding["demonstrated impact"])) errors.push(`${where}: \`Needs validation\` names the missing fact: start \`demonstrated impact\` with \`Missing fact: ...\``);
    } else if (verdict === "Rejected") {
      if (!hasImpact) errors.push(`${where}: \`Rejected\` keeps its reason in \`demonstrated impact\``);
    }
  }

  // Headline against the tables.
  if (current && current.verdict === "Pass") {
    const where = `line ${current.number}: headline says \`Pass\` but`;
    if (ledger.length === 0) errors.push(`${where} the coverage ledger is empty; the ledger is the only coverage claim`);
    for (const state of STATES_BLOCKING_PASS) {
      const ids = ledger.filter((row) => row.state === state).map((row) => row.id);
      if (ids.length > 0) errors.push(`${where} ${ids.length} ledger row(s) are \`${state}\`: ${safe(ids.join(", "))}`);
    }
    if (openConfirmed.length > 0) {
      errors.push(`${where} ${openConfirmed.length} \`Confirmed\` finding(s) have no \`Resolved: <fix sha>\` marker in \`verified by\`: ${safe(openConfirmed.join(", "))}`);
    }
  }

  return { errors, summary };
}

/** Read a file with a hard size bound; throws an Error with a user-facing message. */
export function readBounded(file) {
  let fd;
  try {
    fd = fs.openSync(file, "r");
  } catch {
    throw new Error(`cannot open ${safe(file)}`);
  }
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error(`${safe(file)} is not a regular file`);
    if (stat.size > MAX_FILE_BYTES) throw new Error(`${safe(file)} is larger than ${MAX_FILE_BYTES} bytes`);
    const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
    let total = 0;
    for (;;) {
      const read = fs.readSync(fd, buffer, total, buffer.length - total, null);
      if (read === 0) break;
      total += read;
      if (total > MAX_FILE_BYTES) throw new Error(`${safe(file)} is larger than ${MAX_FILE_BYTES} bytes`);
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, total));
    } catch {
      throw new Error(`${safe(file)} is not valid UTF-8`);
    }
  } finally {
    fs.closeSync(fd);
  }
}

const USAGE = "usage: node validate-release-audit.mjs <task-file> [--repo <root>]";

/** @returns {number} process exit code */
export function main(argv, stdout = process.stdout, stderr = process.stderr) {
  let file = null;
  let repo = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      stdout.write(`${USAGE}\n`);
      return 0;
    }
    if (arg === "--repo") {
      i += 1;
      if (i >= argv.length || repo !== null) {
        stderr.write(`${USAGE}\n`);
        return 2;
      }
      repo = argv[i];
    } else if (arg.startsWith("--") || file !== null) {
      stderr.write(`${USAGE}\n`);
      return 2;
    } else {
      file = arg;
    }
  }
  if (file === null) {
    stderr.write(`${USAGE}\n`);
    return 2;
  }
  let text;
  try {
    text = readBounded(file);
  } catch (error) {
    stderr.write(`release-audit: ${error.message}\n`);
    return 2;
  }
  const repoRoot = path.resolve(repo ?? process.cwd());
  const { errors, summary } = validate(text, { repoRoot });
  if (errors.length > 0) {
    for (const message of errors.slice(0, MAX_ERRORS)) stderr.write(`release-audit: ${message}\n`);
    if (errors.length > MAX_ERRORS) stderr.write(`release-audit: ${errors.length - MAX_ERRORS} more error(s) not shown\n`);
    stderr.write(`release-audit: FAILED with ${errors.length} error(s)\n`);
    return 1;
  }
  stdout.write(`release-audit: OK (${summary.verdict}; ${summary.ledgerRows} ledger row(s); ${summary.findings} finding(s)). The record is consistent; this does not prove a finding is true or coverage complete.\n`);
  return 0;
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  process.exitCode = main(process.argv.slice(2));
}
