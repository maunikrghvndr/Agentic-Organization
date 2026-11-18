#!/usr/bin/env node
/**
 * Validate the `## Release Audit` record of a task file.
 *
 * Format and rules: EngineeringTeam/security-engineer.md -> Release Audit
 * (whole application) -> Record Format.
 *
 * Usage:
 *   node Scripts/validate-release-audit.mjs <task-file> [--repo <root>] [--release --head <40-character sha>]
 *
 * --repo is the root of the audited repository; cited paths are resolved
 * against it (default: the current directory).
 * --release additionally requires what a release needs: the latest verdict is
 * `Pass`, profile `standard` or `deep`, `scope full`, no `out-of-scope` row,
 * `critics clean` of 2 or more, and a headline sha that is a prefix of the
 * release head. --release needs --head <the full 40-character release head sha>.
 * Without --release a scoped Pass is valid as a scoped audit; the OK line says
 * `scoped` or `release-grade`.
 *
 * Exit 0 = record is consistent. Exit 1 = validation errors (stderr, one per
 * line). Exit 2 = usage error or unreadable input.
 *
 * A pass proves the record is well formed and self-consistent. It does not
 * prove that a finding is true or that coverage is complete.
 * The validator proves the record is consistent and unambiguous, not that the
 * audit was truthful; the fresh-context verifier and critic are what establish
 * truth.
 *
 * Nothing inside the section is skipped: a code fence, an HTML comment, raw
 * HTML, a headline in another spelling, or a table-like line outside the two
 * tables is an error, because a human reader would see it and the parser
 * would not.
 *
 * The same holds for the whole file, because the record is free-form Markdown
 * and a renderer may disagree with this parser: ambiguity is rejected, never
 * skipped. Code fences are tracked per CommonMark and an unclosed one is an
 * error; an HTML comment may only sit before the section, closed, and silent
 * about the audit (the `<!-- END-OF-FILE -->` line is the one exception); any
 * other heading that reads as "Release Audit" (other case, level, spacing,
 * emphasis, closing hashes, setext, look-alike letters) is an error, except
 * the exact `## Architecture Note (release audit)`; a headline-like line
 * anywhere outside the section, or a heading or headline inside a fence or a
 * comment, is an error. Inside the section, pipe look-alikes, no-break spaces
 * and control characters are errors.
 *
 * Inside the section the rule is an allow-list, not a deny-list: only blank
 * lines, `- Release audit:` headlines, the headings `### Coverage Ledger` and
 * `### Audit Findings`, the table lines directly under them and a line that is
 * exactly `<!-- END-OF-FILE -->` are accepted. Every other line is an error.
 * The section ends only at an unindented level 1 or 2 heading or at the end of
 * the file.
 * Headings and headlines are compared after decoding character references and
 * removing inline HTML tags, backslash escapes, link syntax and emphasis; a
 * line that is only emphasised text naming the audit counts as a heading.
 * Tags that collapse or hide text (`<details`, `<summary`, `<script`, `<style`,
 * `<template`, `<textarea`, `<noscript`, `<iframe`, `<xmp`, `<plaintext`, a
 * `hidden` attribute, also on a tag that continues on the next lines) are errors anywhere
 * in the file outside an inline code span, fenced lines included. A line longer
 * than 20000 characters is an error.
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
const MAX_TOKEN = 4096;
const MAX_SCOPE = 80;
const DAY_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_DAYS = 1;

const SECTION_HEADING = /^##[ \t]+Release Audit[ \t]*$/;
const SECTION_HEADING_TEXT = "## Release Audit";
/** The one other heading that may name the audit (security-engineer.md, Step 1). Its lines are never parsed. */
const ARCHITECTURE_NOTE_HEADING = /^##[ \t]+Architecture Note \(release audit\)[ \t]*$/;
const HEADLINE_PREFIX = "- Release audit:";
/** A letter that is not ASCII: a look-alike standing in for a keyword letter. */
const FOREIGN_LETTER = "(?![\\x00-\\x7f])\\p{L}";
const fuzzyWord = (word) => [...word].map((letter) => `(?:${letter}|${FOREIGN_LETTER})`).join("");
const AUDIT_KEYWORD = "releaseaudit";
const AUDIT_WORDS = `(${fuzzyWord("release")})[^\\p{L}\\p{N}]*(${fuzzyWord("audit")})`;
const AUDIT_WORDS_AT = new RegExp(AUDIT_WORDS, "iuy");
/** A fuzzy match counts only when this many letters are the real ASCII ones, so foreign-language prose is not flagged. */
const MIN_KEYWORD_LETTERS = 3;
/** Any line a reader would take for a headline: other case, bullet, number, checkbox, indent, quote, emphasis or look-alike letters. Tested on folded text. */
const COLON = ":\\u2236\\ua789\\u02d0\\u0589\\u05c3";
const DASH = "-\\u2010-\\u2015\\u2212";
/** After the two words: a colon within a few characters (`Release audit (run 2):`), or a dash that stands in for it. A leading `|` covers a table cell. */
const HEADLINE_LIKE = new RegExp(`^[\\s>|]*(?:(?:[-*+]|\\d+[.)])\\s*)?(?:\\[[ xX]?\\]\\s*)?[*_\`~]*${AUDIT_WORDS}[*_\`~]*(?:[^${COLON}]{0,30}[${COLON}]|\\s*[${DASH}]+(?:\\s|$))`, "iu");
/** Linear: every repetition consumes at least one character and no two alternatives start alike. */
const HEADING_LIKE = /^(?:[\s>]|(?:[-*+]|\d+[.)])\s)*#/;
/** A line that is only emphasised or tagged text: a reader takes it for a heading. */
const PSEUDO_HEADING_START = /^[\s>]*(?:(?:[-+]|\d+[.)])\s+)?(?:[*_]{1,3}[^\s*_]|<[A-Za-z])/;
const PSEUDO_HEADING_END = /(?:[*_]|>)[\s:.]*$/;
/** No line of a task file needs more; the cap bounds every pattern in this file. */
export const MAX_LINE_LENGTH = 20000;
/** Tags that collapse, hide or swallow the text after them. */
const HIDING_TAG = /<\/?(details|summary|script|style|template|textarea|noscript|iframe|xmp|plaintext)(?![A-Za-z0-9-])/i;
const HIDDEN_ATTRIBUTE = /<[A-Za-z][^<>]*\shidden(?![A-Za-z0-9_-])/i;
const OPEN_TAG_AT_END = /<[A-Za-z][^<>]*$/;
const MAX_TAG_LINES = 20;
const INLINE_TAG = /<[!/?A-Za-z][^<>]*>/g;
const CHARACTER_REFERENCE = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,15}));/g;
const NAMED_REFERENCES = new Map(Object.entries({
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", Tab: " ", NewLine: " ",
  colon: ":", num: "#", vert: "|", verbar: "|", VerticalLine: "|", hyphen: "-", dash: "-", ndash: "-", mdash: "-", minus: "-",
  lpar: "(", rpar: ")", lsqb: "[", rsqb: "]", lbrack: "[", rbrack: "]", ast: "*", midast: "*", lowbar: "_", UnderBar: "_",
  period: ".", comma: ",", semi: ";", excl: "!", sol: "/", bsol: "\\", grave: "`", DiacriticalGrave: "`", shy: "", zwj: "", zwnj: "",
}));
const BACKSLASH_ESCAPE = /\\([!-/:-@[-`{-~])/g;
const INLINE_LINK = /\[([^[\]]*)\](?:\([^()]*\)|\[[^[\]]*\])/g;
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_MARKER = /^\s*(?:`{3,}|~{3,})/;
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/;
const HTML_BLOCK_START = /^ {0,3}<(?:\/?[A-Za-z][A-Za-z0-9-]*(?:[\s>/]|$)|[!?])/;
const COMMENT_OPEN = "<!--";
const COMMENT_CLOSE = "-->";
const COMMENT_AUDIT_MENTION = /release[^a-z0-9]*audit/i;
/** Pipe look-alikes, the no-break space, line separators and control characters: not allowed inside the section. */
const FORBIDDEN_IN_SECTION = /[\uFF5C\u2502\u2223\u01C0\u00A6\u00A0\u0085\u2028\u2029\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const GIT_SEGMENTS = [".git", "git~1"];
const EOF_TRAILER = "<!-- END-OF-FILE -->";
const HEADLINE_FIELDS = "verdict, sha, engine, profile, scope, critics clean, run, date";
const LEDGER_HEADING = "Coverage Ledger";
const FINDINGS_HEADING = "Audit Findings";
const recordHeading = (heading) => new RegExp(`^###[ \\t]+${heading}[ \\t]*$`);
const RECORD_HEADINGS = [recordHeading(LEDGER_HEADING), recordHeading(FINDINGS_HEADING)];
const EOF_TRAILER_LINE = /^<!-- END-OF-FILE -->[ \t]*$/;
const LEDGER_COLUMNS = ["id", "surface", "boundary", "subsystem", "checklist", "state", "paths read", "checks", "findings"];
const FINDING_COLUMNS = ["id", "verdict", "severity", "title", "trace", "demonstrated impact", "verified by"];
const STATES = ["planned", "covered", "candidate", "not-applicable", "out-of-scope", "deferred"];
const STATES_NEEDING_REASON = ["not-applicable", "out-of-scope", "deferred"];
const STATES_BLOCKING_PASS = ["planned", "candidate", "deferred"];
const VERDICTS = ["Confirmed", "Needs validation", "Rejected"];
const SEVERITIES = ["Critical", "High", "Medium", "Low", "Informational"];
const PROFILES = ["quick", "standard", "deep"];
const RELEASE_PROFILES = ["standard", "deep"];
const SCOPE_FULL = "full";
const GRADE_SCOPED = "scoped";
const GRADE_RELEASE = "release-grade";
const EMPTY_MARKERS = new Set(["", "-", "--", "\u2014", "none", "n/a"]);
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const SHA = "[0-9a-f]{7,40}";
const SHA_FIELD = new RegExp(`^sha (${SHA})$`);
const ENGINE_FIELD = new RegExp(`^engine (A: cloudflare@${SHA}|B: library) \\((.+)\\)$`);
const HEAD_VALUE = /^[0-9a-f]{40}$/;
const RELEASE_MIN_CRITICS = 2;
const ZERO_SHA = /^0+$/;
const SCOPE_FIELD = /^scope (\S.*)$/;
const CRITICS_FIELD = /^critics clean (0|[1-9][0-9]{0,3})$/;
const RUN_FIELD = /^run ([1-9][0-9]{0,5})$/;
const DATE_FIELD = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Anchored: the marker is the last `;`-separated item of the cell, so "not Resolved: ..." does not match. */
const RESOLVED_MARKER = new RegExp(`(?:^|;\\s*)Resolved:\\s*(${SHA})\\s*$`);
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

/** Compatibility-decompose and drop combining marks and invisible format characters, so look-alike spellings compare equal. */
function fold(line) {
  return line.normalize("NFKD").replace(/[\p{M}\p{Cf}]/gu, "");
}

function decodeReference(whole, decimal, hex, name) {
  if (name !== undefined) return NAMED_REFERENCES.get(name) ?? NAMED_REFERENCES.get(name.toLowerCase()) ?? whole;
  const code = decimal !== undefined ? Number(decimal) : Number.parseInt(hex, 16);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
}

/** What a renderer shows for the inline syntax of a line: character references decoded, backslash escapes and link syntax removed. */
function unwrapInline(text) {
  return text.replace(CHARACTER_REFERENCE, decodeReference).replace(BACKSLASH_ESCAPE, "$1").replace(INLINE_LINK, "$1");
}

/**
 * The spellings of a line a reader may see, folded: with inline HTML tags
 * removed (a renderer hides them) and with them kept (a renderer shows what is
 * not a real tag). A heading or headline test holds when it holds for either.
 */
function views(line) {
  const kept = fold(unwrapInline(line));
  if (!line.includes("<")) return [kept];
  return [fold(unwrapInline(line.replace(INLINE_TAG, ""))), kept];
}

/** The line without its inline code spans, per CommonMark: a run of n backticks is closed by the next run of exactly n; an escaped backtick opens nothing. */
function stripCodeSpans(line) {
  if (!line.includes("`")) return line;
  const length = line.length;
  const runEnd = (from) => {
    let to = from;
    while (to < length && line[to] === "`") to += 1;
    return to;
  };
  let out = "";
  let i = 0;
  while (i < length) {
    if (line[i] !== "`") {
      out += line[i];
      i += 1;
      continue;
    }
    let slashes = 0;
    while (i - slashes > 0 && line[i - slashes - 1] === "\\") slashes += 1;
    if (slashes % 2 === 1) {
      out += "`";
      i += 1;
      continue;
    }
    const end = runEnd(i);
    let closer = -1;
    for (let k = end; k < length; ) {
      if (line[k] !== "`") {
        k += 1;
        continue;
      }
      const stop = runEnd(k);
      if (stop - k === end - i) {
        closer = stop;
        break;
      }
      k = stop;
    }
    if (closer < 0) {
      out += line.slice(i, end);
      i = end;
    } else {
      i = closer;
    }
  }
  return out;
}

function keywordLetters(match) {
  const found = [...(match[1] + match[2]).toLowerCase()];
  return found.filter((letter, index) => letter === AUDIT_KEYWORD[index]).length;
}

function isHeadlineLike(folded) {
  const match = HEADLINE_LIKE.exec(folded);
  return match !== null && keywordLetters(match) >= MIN_KEYWORD_LETTERS;
}

/** True for a line a reader would take for a headline, in any spelling `views` knows. */
function readsAsHeadline(line) {
  return views(line).some(isHeadlineLike);
}

/** True for a line a reader would take for a Release Audit heading: `#`-style, or only emphasised or tagged text naming the audit. */
function readsAsAuditHeading(line) {
  const pseudo = PSEUDO_HEADING_START.test(line) && PSEUDO_HEADING_END.test(line);
  return views(line).some((view) => (pseudo || HEADING_LIKE.test(view)) && mentionsAudit(view));
}

/** True when the folded text holds "release audit" in any case, spacing, punctuation, emphasis or look-alike letters. */
function mentionsAudit(folded) {
  const text = folded.replace(/[*_`~]/g, "");
  for (let i = 0; i < text.length; i += 1) {
    AUDIT_WORDS_AT.lastIndex = i;
    const match = AUDIT_WORDS_AT.exec(text);
    if (match !== null && keywordLetters(match) >= MIN_KEYWORD_LETTERS) return true;
  }
  return false;
}

/**
 * Lines of the single `## Release Audit` section, after a scan of the whole
 * file that rejects everything a Markdown renderer or a reader could take
 * differently from this parser: see the header comment. Nothing is skipped
 * silently; a fence, a comment or another audit heading is reported.
 */
function extractSection(lines, errors) {
  let fence = null;
  let comment = null;
  let start = -1;
  let end = -1;
  let count = 0;
  const section = [];
  const comments = [];
  const htmlBlocks = [];
  const hiding = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const number = i + 1;
    const inSection = start >= 0 && end < 0;
    const headline = readsAsHeadline(line);
    const auditHeading = readsAsAuditHeading(line);

    // Checked on every line, fenced and commented ones included: a renderer may not agree that they are fenced.
    if (line.includes("<")) {
      const bare = stripCodeSpans(line);
      const tag = HIDING_TAG.exec(bare);
      if (tag) hiding.push(`line ${number}: \`<${tag[1].toLowerCase()}\` can collapse or hide the text after it, so a reader may not see the record; write plain Markdown (an inline code span is fine)`);
      else if (HIDDEN_ATTRIBUTE.test(bare)) hiding.push(`line ${number}: a \`hidden\` attribute hides text from a reader; write plain Markdown (an inline code span is fine)`);
      else {
        // A tag whose attributes continue on the following lines.
        const open = OPEN_TAG_AT_END.exec(bare);
        if (open) {
          let rest = "";
          for (let next = i + 1; next < lines.length && next <= i + MAX_TAG_LINES && !rest.includes(">"); next += 1) rest += ` ${lines[next]}`;
          const close = rest.indexOf(">");
          if (close >= 0 && HIDDEN_ATTRIBUTE.test(`${open[0]}${rest.slice(0, close)}`)) hiding.push(`line ${number}: a \`hidden\` attribute (on a tag that continues on the next lines) hides text from a reader; write plain Markdown (an inline code span is fine)`);
        }
      }
    }

    if (fence !== null) {
      if (auditHeading || headline) errors.push(`line ${number}: a Release Audit heading or headline inside a code fence (opened on line ${fence.number}); a fenced record is not a record, and a reader cannot tell which one counts`);
      const closer = /^ {0,3}(`+|~+)[ \t]*$/.exec(line);
      if (closer && closer[1][0] === fence.char && closer[1].length >= fence.length) fence = null;
      continue;
    }

    if (comment !== null) {
      comment.text += `\n${line}`;
      if (auditHeading || headline || (inSection && line.includes("|"))) errors.push(`line ${number}: a Release Audit heading, headline or table row inside an HTML comment (opened on line ${comment.start + 1}); a commented-out record is not a record`);
      if (FENCE_MARKER.test(line)) errors.push(`line ${number}: a code fence marker inside an HTML comment (opened on line ${comment.start + 1}); a renderer and this parser may disagree on which one is open`);
      const close = line.indexOf(COMMENT_CLOSE);
      if (close >= 0) {
        if (line.slice(close + COMMENT_CLOSE.length).trim() !== "") errors.push(`line ${number}: text after the \`-->\` that closes a multi-line HTML comment; a renderer hides the rest of that line`);
        comments.push({ start: comment.start, end: i, text: comment.text });
        comment = null;
      }
      if (inSection) section.push({ text: line, number });
      continue;
    }

    const fenceMatch = FENCE_OPEN.exec(line);
    if (fenceMatch && !(fenceMatch[1][0] === "`" && fenceMatch[2].includes("`"))) {
      if (inSection) errors.push(`line ${number}: code fence inside \`${SECTION_HEADING_TEXT}\`; nothing in the record may be fenced`);
      fence = { char: fenceMatch[1][0], length: fenceMatch[1].length, number };
      continue;
    }
    if (inSection && FENCE_MARKER.test(line)) errors.push(`line ${number}: code fence inside \`${SECTION_HEADING_TEXT}\`; nothing in the record may be fenced`);

    // HTML comments on this line. A comment that stays open must start its line.
    let visible = "";
    if (line.trim() === EOF_TRAILER) visible = "";
    else {
      let from = 0;
      for (;;) {
        const open = line.indexOf(COMMENT_OPEN, from);
        if (open < 0) {
          visible += line.slice(from);
          break;
        }
        visible += line.slice(from, open);
        const close = line.indexOf(COMMENT_CLOSE, open + 2);
        if (close < 0) {
          if (line.slice(0, open).trim() !== "") errors.push(`line ${number}: an HTML comment opened in the middle of a line is not closed on that line; a renderer may show what follows and this parser would not`);
          comment = { start: i, text: line.slice(open) };
          break;
        }
        comments.push({ start: i, end: i, text: line.slice(open, close + COMMENT_CLOSE.length) });
        from = close + COMMENT_CLOSE.length;
      }
    }

    if (comment === null && SECTION_HEADING.test(line)) {
      count += 1;
      if (count === 1) start = i;
      else if (end < 0) end = i;
      continue;
    }
    if (auditHeading && !ARCHITECTURE_NOTE_HEADING.test(line)) {
      errors.push(`line ${number}: heading ${safe(line)} reads as a Release Audit heading but is not the single exact \`${SECTION_HEADING_TEXT}\`; a reader would take it for the record, or for a newer one`);
    } else if (line.trim() !== "" && i + 1 < lines.length && SETEXT_UNDERLINE.test(lines[i + 1]) && views(line).some(mentionsAudit)) {
      errors.push(`line ${number}: heading ${safe(line)} (underlined on the next line) reads as a Release Audit heading but is not the single exact \`${SECTION_HEADING_TEXT}\`; a reader would take it for the record, or for a newer one`);
    }
    if (headline && !inSection) errors.push(`line ${number}: a \`Release audit:\` headline outside the \`${SECTION_HEADING_TEXT}\` section; a reader would take it for a verdict and this parser would not read it`);
    if (start < 0 && HTML_BLOCK_START.test(visible)) htmlBlocks.push(number);

    if (inSection) {
      if (comment === null && /^#{1,2}[ \t]+\S/.test(line)) {
        end = i;
        continue;
      }
      const trimmed = line.trim();
      if (trimmed !== EOF_TRAILER) {
        if (line.includes(COMMENT_OPEN)) errors.push(`line ${number}: HTML comment inside \`${SECTION_HEADING_TEXT}\`; nothing in the record may be commented out`);
        else if (trimmed.startsWith("<")) errors.push(`line ${number}: raw HTML inside \`${SECTION_HEADING_TEXT}\`; the record is plain Markdown`);
      }
      if (SETEXT_UNDERLINE.test(line)) errors.push(`line ${number}: setext underline or thematic break inside \`${SECTION_HEADING_TEXT}\`; a renderer would end or re-head the section there`);
      section.push({ text: line, number });
    }
  }
  if (fence !== null) errors.push(`line ${fence.number}: code fence is never closed; everything after it is code to a renderer`);
  if (comment !== null) errors.push(`line ${comment.start + 1}: HTML comment is never closed; everything after it is hidden by a renderer`);
  if (count === 0) errors.push(`no \`${SECTION_HEADING_TEXT}\` section found (outside code fences)`);
  if (count > 1) errors.push(`${count} \`${SECTION_HEADING_TEXT}\` sections found; a task file carries exactly one`);
  if (count >= 1) {
    const last = end < 0 ? lines.length : end;
    for (const entry of comments) {
      if (entry.end < start) {
        if (COMMENT_AUDIT_MENTION.test(fold(entry.text))) errors.push(`line ${entry.start + 1}: an HTML comment before the section mentions the release audit; nothing about the audit may be hidden`);
      } else if (entry.start >= last || entry.start <= start) {
        errors.push(`line ${entry.start + 1}: HTML comment after the \`${SECTION_HEADING_TEXT}\` heading; only a line that is exactly \`${EOF_TRAILER}\` may follow the record`);
      }
    }
    for (const message of hiding) errors.push(message);
    for (const number of htmlBlocks) errors.push(`line ${number}: raw HTML block before the \`${SECTION_HEADING_TEXT}\` section; a renderer may hide what follows it, write plain Markdown`);
    for (const entry of section) {
      const bad = FORBIDDEN_IN_SECTION.exec(entry.text);
      if (bad) errors.push(`line ${entry.number}: character U+${bad[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} inside \`${SECTION_HEADING_TEXT}\`; pipe look-alikes, no-break spaces and control characters are not allowed in the record`);
    }
  }
  return count === 1 ? section : null;
}

/** UTC midnight of a real YYYY-MM-DD calendar date in milliseconds, or null. */
function parseDate(text) {
  const match = DATE_FIELD.exec(text);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? date.getTime() : null;
}

function parseHeadline(entry, errors) {
  const where = `line ${entry.number}`;
  const fields = entry.text.slice(HEADLINE_PREFIX.length).split("|").map((field) => field.trim());
  if (fields.length !== 8) {
    errors.push(`${where}: headline needs 8 fields separated by \`|\` (${HEADLINE_FIELDS}), found ${fields.length}`);
    return null;
  }
  const [verdictText, shaText, engineText, profileText, scopeText, criticsText, runText, dateText] = fields;
  let verdict = null;
  if (verdictText === "Pass" || verdictText === "Needs Changes") verdict = verdictText;
  else if (/^Incomplete: \S/.test(verdictText)) verdict = "Incomplete";
  else errors.push(`${where}: headline verdict ${safe(verdictText)} is not \`Pass\`, \`Needs Changes\` or \`Incomplete: <reason>\``);
  const shaMatch = SHA_FIELD.exec(shaText);
  if (!shaMatch) errors.push(`${where}: headline field 2 ${safe(shaText)} is not \`sha <7-40 lowercase hex>\``);
  else if (ZERO_SHA.test(shaMatch[1])) errors.push(`${where}: headline field 2 ${safe(shaText)} is all zeros; write the audited commit`);
  if (!ENGINE_FIELD.test(engineText)) errors.push(`${where}: headline field 3 ${safe(engineText)} is not \`engine A: cloudflare@<commit> (<why>)\` or \`engine B: library (<why>)\``);
  const profileMatch = /^profile (\S+)$/.exec(profileText);
  if (!profileMatch || !PROFILES.includes(profileMatch[1])) errors.push(`${where}: headline field 4 ${safe(profileText)} is not \`profile quick|standard|deep\``);
  const scopeMatch = SCOPE_FIELD.exec(scopeText);
  if (!scopeMatch || scopeMatch[1].length > MAX_SCOPE) errors.push(`${where}: headline field 5 ${safe(scopeText)} is not \`scope full\` or \`scope <name of the audited part>\``);
  const criticsMatch = CRITICS_FIELD.exec(criticsText);
  if (!criticsMatch) errors.push(`${where}: headline field 6 ${safe(criticsText)} is not \`critics clean <number of critics that returned nothing new>\``);
  const runMatch = RUN_FIELD.exec(runText);
  if (!runMatch) errors.push(`${where}: headline field 7 ${safe(runText)} is not \`run <positive integer>\``);
  const date = parseDate(dateText);
  if (date === null) errors.push(`${where}: headline field 8 ${safe(dateText)} is not a valid YYYY-MM-DD date`);
  return {
    verdict,
    verdictText: verdict === "Incomplete" ? "Incomplete" : verdictText,
    sha: shaMatch ? shaMatch[1] : null,
    profile: profileMatch && PROFILES.includes(profileMatch[1]) ? profileMatch[1] : null,
    scope: scopeMatch && scopeMatch[1].length <= MAX_SCOPE ? scopeMatch[1] : null,
    criticsClean: criticsMatch ? Number(criticsMatch[1]) : null,
    run: runMatch ? Number(runMatch[1]) : null,
    date,
    dateText,
    number: entry.number,
  };
}

/**
 * Parse the table under `### <heading>` inside the section. The index of every
 * section line that belongs to the table is added to `consumed`.
 */
function parseTable(section, heading, columns, errors, consumed) {
  const headingPattern = recordHeading(heading);
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
  consumed.add(cursor);
  cursor += 1;
  if (cursor >= section.length || !isSeparatorRow(splitRow(section[cursor].text), columns.length)) {
    errors.push(`\`### ${heading}\`: the header row must be followed by a \`|---|\` separator row with ${columns.length} columns`);
    return null;
  }
  consumed.add(cursor);
  cursor += 1;
  const rows = [];
  for (; cursor < section.length && section[cursor].text.trim().startsWith("|"); cursor += 1) {
    const entry = section[cursor];
    consumed.add(cursor);
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

function isGitSegment(segment) {
  return GIT_SEGMENTS.includes(segment.toLowerCase());
}

/**
 * Check the spelling of one cited path without touching the disk.
 * Returns { error } or { segments }.
 */
function parseCitedPath(cited) {
  const normalized = cited.replace(/\\/g, "/");
  if (normalized === "" || normalized.includes("\0")) return { error: "is empty" };
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return { error: "is absolute; cite paths relative to the repository root" };
  if (/[*?]/.test(normalized)) return { error: "is a glob; list the files actually read" };
  const segments = normalized.split("/").filter((segment) => segment !== "" && segment !== ".");
  if (segments.length === 0) return { error: "is empty" };
  if (segments.includes("..")) return { error: "contains `..`; cite paths relative to the repository root" };
  if (segments.some(isGitSegment)) return { error: "is inside `.git`; git's own files are not audited source" };
  return { segments };
}

/**
 * Resolve one cited path against the repository root.
 * Returns { error } or { file } (absolute path of an existing, non-empty
 * regular file inside the root that is neither the task file nor under `.git`).
 * @param {{ root: string, taskFile: string|null }} repo
 */
function resolveCitedPath(cited, repo) {
  const { root } = repo;
  const parsed = parseCitedPath(cited);
  if (parsed.error) return parsed;
  const candidate = path.join(root, ...parsed.segments);
  let real;
  try {
    real = fs.realpathSync(candidate);
  } catch {
    return { error: "does not exist" };
  }
  const relative = path.relative(root, real);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return { error: "resolves outside the repository root" };
  if (relative.split(/[\\/]/).some(isGitSegment)) return { error: "is inside `.git`; git's own files are not audited source" };
  if (repo.taskFile !== null && real === repo.taskFile) return { error: "is the task file itself; the record is not evidence of what was read" };
  let stat;
  try {
    stat = fs.statSync(real);
  } catch {
    return { error: "does not exist" };
  }
  if (stat.isDirectory()) return { error: "is a directory; list the files actually read" };
  if (!stat.isFile()) return { error: "is not a regular file" };
  if (stat.size === 0) return { error: "is an empty file; nothing can have been read in it" };
  return { file: real };
}

function splitList(cell) {
  return cell.split(/<br\s*\/?>|[;,]/i).map(stripTicks).filter((item) => item !== "");
}

/** Error text for a `:line` or `:from-to` suffix that does not fit the file (any file when `file` is null), or null. */
function lineRangeError(match, file) {
  const first = Number(match[1]);
  const last = Number(match[2] ?? match[1]);
  if (first < 1 || last < first) return "has an invalid line range";
  if (file !== null && last > countLines(file)) return "points past the end of the file";
  return null;
}

function hasPathsRead(cell) {
  return splitList(cell).some((item) => !isEmpty(item));
}

function checkPathsRead(row, repo, errors) {
  const where = `ledger row ${safe(row.id)} (line ${row.number})`;
  const items = splitList(row["paths read"]);
  if (items.length > MAX_PATHS_PER_CELL) {
    errors.push(`${where}: more than ${MAX_PATHS_PER_CELL} paths in \`paths read\``);
    return;
  }
  for (const item of items) {
    if (item.length > MAX_TOKEN) {
      errors.push(`${where}: \`paths read\` entry ${safe(item)} is longer than ${MAX_TOKEN} characters`);
      continue;
    }
    const match = LINE_SUFFIX.exec(item);
    const cited = item.replace(LINE_SUFFIX, "");
    const result = resolveCitedPath(cited, repo);
    if (result.error) {
      errors.push(`${where}: \`paths read\` entry ${safe(item)} ${result.error}`);
      continue;
    }
    const rangeError = match ? lineRangeError(match, result.file) : null;
    if (rangeError) errors.push(`${where}: \`paths read\` entry ${safe(item)} ${rangeError}`);
  }
}

/** Strip leading `(`/`[` and trailing `)`/`]`/`.` with index loops: linear, no backtracking. */
function trimPunctuation(token) {
  let from = 0;
  let to = token.length;
  while (from < to && (token[from] === "(" || token[from] === "[")) from += 1;
  while (to > from && (token[to - 1] === ")" || token[to - 1] === "]" || token[to - 1] === ".")) to -= 1;
  return token.slice(from, to);
}

/** `path:line` tokens of a trace cell. A token longer than MAX_TOKEN cannot be a path and is dropped unread. */
function traceTokens(cell) {
  return cell
    .split(/<br\s*\/?>|->|\u2192|[;,\s]/i)
    .filter((token) => token.length <= MAX_TOKEN)
    .map((token) => trimPunctuation(stripTicks(token)))
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

/** `checkExistence` false (a resolved finding): the entries must still be well-formed, the files need not exist. */
function checkTrace(finding, repo, checkExistence, errors) {
  const where = `finding ${safe(finding.id)} (line ${finding.number})`;
  const tokens = traceTokens(finding.trace);
  if (tokens.length === 0) {
    errors.push(`${where}: \`Confirmed\` needs a \`path:line\` trace`);
    return;
  }
  for (const token of tokens.slice(0, MAX_PATHS_PER_CELL)) {
    const match = LINE_SUFFIX.exec(token);
    const cited = token.replace(LINE_SUFFIX, "");
    const result = checkExistence ? resolveCitedPath(cited, repo) : parseCitedPath(cited);
    if (result.error) {
      errors.push(`${where}: trace entry ${safe(token)} ${result.error}`);
      continue;
    }
    const rangeError = lineRangeError(match, checkExistence ? result.file : null);
    if (rangeError) errors.push(`${where}: trace entry ${safe(token)} ${rangeError}`);
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
 * @param {{ repoRoot: string, release?: boolean, head?: string|null, taskFile?: string|null, today?: Date }} options
 *   repoRoot: absolute root of the audited repository; release: also apply the
 *   release rules; head: the full release head sha (required with release);
 *   taskFile: path of the file `text` came from, so the record cannot cite
 *   itself; today: the clock (tests only).
 * @returns {{ errors: string[], summary: { verdict: string|null, ledgerRows: number, findings: number, grade: string } }}
 */
export function validate(text, { repoRoot, release = false, head = null, taskFile = null, today = new Date() }) {
  const errors = [];
  const summary = { verdict: null, ledgerRows: 0, findings: 0, grade: release ? GRADE_RELEASE : GRADE_SCOPED };
  let releaseHead = null;
  if (release && head === null) return { errors: [MISSING_HEAD], summary };
  if (head !== null) {
    releaseHead = String(head).toLowerCase();
    if (!HEAD_VALUE.test(releaseHead) || ZERO_SHA.test(releaseHead)) return { errors: [badHead(head)], summary };
  }
  let root;
  try {
    root = fs.realpathSync(repoRoot);
    if (!fs.statSync(root).isDirectory()) throw new Error("not a directory");
  } catch {
    return { errors: [`--repo ${safe(repoRoot)} is not a readable directory`], summary };
  }
  let taskReal = null;
  if (taskFile !== null) {
    try {
      taskReal = fs.realpathSync(taskFile);
    } catch {
      taskReal = null;
    }
  }
  const repo = { root, taskFile: taskReal };

  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  lines.forEach((line, index) => {
    if (line.length > MAX_LINE_LENGTH) errors.push(`line ${index + 1} is longer than ${MAX_LINE_LENGTH} characters; no line of a task file needs that, and the rest of the file was not read`);
  });
  if (errors.length > 0) return { errors, summary };
  const section = extractSection(lines, errors);
  if (section === null) return { errors, summary };

  // Headline line(s): one per run, the last one counts. A line that reads as a
  // headline but is not written exactly is an error, never silently skipped.
  for (const entry of section) {
    if (readsAsHeadline(entry.text) && !entry.text.startsWith(HEADLINE_PREFIX)) {
      errors.push(`line ${entry.number}: looks like a headline but is not written exactly \`${HEADLINE_PREFIX} ...\` at the start of the line`);
    }
  }
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

  const consumed = new Set();
  const ledger = parseTable(section, LEDGER_HEADING, LEDGER_COLUMNS, errors, consumed);
  const findings = parseTable(section, FINDINGS_HEADING, FINDING_COLUMNS, errors, consumed);
  if (ledger === null || findings === null) return { errors, summary };

  // A table ends at its first line without a leading pipe. Anything table-like
  // after that would be read by a person and not by this parser.
  // Allow-list: whatever is not a blank line, a headline, one of the two
  // headings, a parsed table line or the end-of-file trailer is an error.
  section.forEach((entry, index) => {
    if (consumed.has(index) || entry.text.trim() === "") return;
    if (entry.text.startsWith(HEADLINE_PREFIX) || RECORD_HEADINGS.some((pattern) => pattern.test(entry.text)) || EOF_TRAILER_LINE.test(entry.text)) return;
    if (entry.text.includes("|")) errors.push(`line ${entry.number}: table-like line outside the two record tables (a row after a blank line, prose, a second header or another heading is not part of the record; keep every row directly under its table header)`);
    else errors.push(`line ${entry.number}: ${safe(entry.text)} is not part of the record; inside \`${SECTION_HEADING_TEXT}\` only blank lines, \`${HEADLINE_PREFIX}\` headlines, \`### ${LEDGER_HEADING}\`, \`### ${FINDINGS_HEADING}\`, the table lines directly under them and a line that is exactly \`${EOF_TRAILER}\` are allowed, and the section ends only at an unindented level 1 or 2 heading`);
  });
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
    const hasPaths = hasPathsRead(row["paths read"]);
    const hasChecks = !isEmpty(row.checks);
    if (state === "covered" && !hasPaths) errors.push(`${where}: \`covered\` needs non-empty \`paths read\``);
    if (state === "covered" && !hasChecks) errors.push(`${where}: \`covered\` needs non-empty \`checks\``);
    if (STATES_NEEDING_REASON.includes(state) && !hasChecks) errors.push(`${where}: \`${state}\` needs a reason in \`checks\``);
    if (hasPaths) checkPathsRead(row, repo, errors);
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
      const verifiedBy = stripTicks(finding["verified by"]);
      const resolvedMatch = RESOLVED_MARKER.exec(verifiedBy);
      const resolved = resolvedMatch !== null && !ZERO_SHA.test(resolvedMatch[1]);
      if (resolvedMatch !== null && !splitList(verifiedBy.slice(0, resolvedMatch.index)).some((item) => !isEmpty(item))) {
        errors.push(`${where}: \`verified by\` holds only the \`Resolved:\` marker; name the verifier before \`; Resolved: <fix sha>\``);
      }
      if (!hasSeverity) errors.push(`${where}: \`Confirmed\` needs a severity`);
      if (!hasImpact) errors.push(`${where}: \`Confirmed\` needs a demonstrated impact`);
      // A resolved finding's trace is historical: the fix may have moved or removed the lines,
      // so only its form is checked.
      checkTrace(finding, repo, !resolved, errors);
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
    else if (!ledger.some((row) => row.state === "covered")) errors.push(`${where} no ledger row is \`covered\`; a Pass needs audited coverage`);
    if (current.criticsClean !== null && current.criticsClean < 1) errors.push(`${where} \`critics clean\` is ${current.criticsClean}; a Pass needs at least one critic that returned nothing new`);
    if (current.date !== null) {
      const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      if (current.date > now + CLOCK_SKEW_DAYS * DAY_MS) errors.push(`${where} its date ${safe(current.dateText)} is in the future`);
    }
    for (const state of STATES_BLOCKING_PASS) {
      const ids = ledger.filter((row) => row.state === state).map((row) => row.id);
      if (ids.length > 0) errors.push(`${where} ${ids.length} ledger row(s) are \`${state}\`: ${safe(ids.join(", "))}`);
    }
    if (openConfirmed.length > 0) {
      errors.push(`${where} ${openConfirmed.length} \`Confirmed\` finding(s) have no \`Resolved: <fix sha>\` marker in \`verified by\`: ${safe(openConfirmed.join(", "))}`);
    }
  }

  // Release rules: what a release line needs beyond a consistent record.
  if (release && current) {
    const where = `line ${current.number}: --release:`;
    if (current.verdict !== "Pass") {
      errors.push(`${where} the latest verdict is \`${current.verdict === null ? "unreadable" : current.verdictText}\`, not \`Pass\``);
    } else {
      if (current.profile !== null && !RELEASE_PROFILES.includes(current.profile)) errors.push(`${where} profile is \`${current.profile}\`; a release needs \`${RELEASE_PROFILES.join("` or `")}\``);
      if (current.scope !== null && current.scope !== SCOPE_FULL) errors.push(`${where} scope is ${safe(current.scope)}, not \`${SCOPE_FULL}\``);
      const excluded = ledger.filter((row) => row.state === "out-of-scope").map((row) => row.id);
      if (excluded.length > 0) errors.push(`${where} ${excluded.length} ledger row(s) are \`out-of-scope\`: ${safe(excluded.join(", "))}`);
      if (current.criticsClean !== null && current.criticsClean < RELEASE_MIN_CRITICS) errors.push(`${where} \`critics clean\` is ${current.criticsClean}; a release needs ${RELEASE_MIN_CRITICS} or more`);
      if (releaseHead !== null && current.sha !== null && !releaseHead.startsWith(current.sha)) {
        errors.push(`${where} headline sha ${safe(current.sha)} is not the release head ${safe(releaseHead)}`);
      }
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

const USAGE = "usage: node validate-release-audit.mjs <task-file> [--repo <root>] [--release --head <40-character sha>]";
const MISSING_HEAD = "--release needs --head <the full 40-character release head sha>";

function badHead(head) {
  return `--head ${safe(head)} is not a full 40-character hex sha`;
}

/** @returns {number} process exit code */
export function main(argv, stdout = process.stdout, stderr = process.stderr) {
  let file = null;
  let repo = null;
  let release = false;
  let head = null;
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
    } else if (arg === "--release" && !release) {
      release = true;
    } else if (arg === "--head") {
      i += 1;
      if (i >= argv.length || head !== null) {
        stderr.write(`${USAGE}\n`);
        return 2;
      }
      head = argv[i];
    } else if (arg.startsWith("--") || file !== null) {
      stderr.write(`${USAGE}\n`);
      return 2;
    } else {
      file = arg;
    }
  }
  if (file === null || (head !== null && !release)) {
    stderr.write(`${USAGE}\n`);
    return 2;
  }
  if (release && head === null) {
    stderr.write(`validate-release-audit: ${MISSING_HEAD}\n${USAGE}\n`);
    return 2;
  }
  if (head !== null && (!HEAD_VALUE.test(head.toLowerCase()) || ZERO_SHA.test(head))) {
    stderr.write(`validate-release-audit: ${badHead(head)}\n${USAGE}\n`);
    return 2;
  }
  let text;
  try {
    text = readBounded(file);
  } catch (error) {
    stderr.write(`validate-release-audit: ${error.message}\n`);
    return 2;
  }
  const repoRoot = path.resolve(repo ?? process.cwd());
  const { errors, summary } = validate(text, { repoRoot, release, head, taskFile: path.resolve(file) });
  if (errors.length > 0) {
    for (const message of errors.slice(0, MAX_ERRORS)) stderr.write(`validate-release-audit: ${message}\n`);
    if (errors.length > MAX_ERRORS) stderr.write(`validate-release-audit: ${errors.length - MAX_ERRORS} more error(s) not shown\n`);
    stderr.write(`validate-release-audit: FAILED with ${errors.length} error(s)\n`);
    return 1;
  }
  stdout.write(`validate-release-audit: OK (${summary.verdict}, ${summary.grade}; ${summary.ledgerRows} ledger row(s); ${summary.findings} finding(s)). The record is consistent; this does not prove a finding is true or coverage complete.\n`);
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
