#!/usr/bin/env node
/**
 * Skills/install-skills.mjs - installs every skill on the curated list
 * (Skills/skills.manifest.json) that is missing from the target skills folder,
 * by default the library's own Skills/installed/ folder beside this script.
 *
 * Optional: the role library works with no skill installed. An installed
 * skill is read by path as reviewed third-party guidance, ranked below the role file; nothing is written outside the target.
 * Node only, no dependencies, Windows/macOS/Linux. Needs `git` on PATH.
 *
 * Usage (from the library root):
 *   node Skills/install-skills.mjs              install every missing skill
 *   node Skills/install-skills.mjs --dry-run    print what would happen, change nothing
 *   node Skills/install-skills.mjs --list       print the list and each skill's state
 *   node Skills/install-skills.mjs --upgrade     also replace a skill installed at another commit
 *   node Skills/install-skills.mjs --with-optional  also install the skills the list marks "optional": true
 *   node Skills/install-skills.mjs --skill <name>     act only on the named listed skill, optional or not (repeatable)
 *   node Skills/install-skills.mjs --target <dir>     default: the `installed` folder beside this script
 *   node Skills/install-skills.mjs --manifest <file>  default: skills.manifest.json beside this script
 *
 * `--skill` is for on-demand use (one reviewed skill wanted for one use case):
 * the name must be on the list, an unknown name is a usage error that prints
 * the valid names, and the skills that were not named are neither installed,
 * replaced nor reported. It combines with --dry-run, --list and --upgrade.
 * Without it, behaviour is unchanged. The manifest stays the only source.
 *
 * What it does per skill: fetch exactly the pinned commit with git into a new
 * empty temp directory, check `git rev-parse HEAD` equals the pin, copy only
 * the skill's `path` into <target>/<name>, write a marker file, remove the
 * temp directory. It never runs anything from the fetched repository.
 * Every git call names the temp repository explicitly and runs without any
 * inherited GIT_* variable, so it cannot be redirected into another repository.
 * Every git call also starts in a separate, empty temp directory, never in the
 * checked-out work tree or the caller's directory (on Windows a bare `git` may
 * be looked up in the child's current directory), and `git init` uses an empty
 * template.
 * The checkout is byte-exact: `.git/info/attributes` in the temp repository
 * switches off every filter, line-ending and ident conversion, whatever the
 * user's or the fetched repository's configuration says.
 * The marker stores a sha256 digest of the installed files (paths, bytes and,
 * outside Windows, the executable bits); a skill whose files no longer match
 * is reported as modified. A marker written before the executable bits were
 * included no longer matches either: `--upgrade` reinstalls the pinned commit.
 * A skill is listed only with a review record at `reviews/<name>.md` beside
 * the manifest that holds one `Verdict: Pass` or `Verdict: Pass with
 * conditions` line and the full pinned commit.
 * Every line of the record that states a verdict counts, in any shape
 * (heading, quote, table, `Overall verdict:`, fenced or commented): exactly one
 * is allowed, it is written at the start of its line outside any code fence or
 * HTML comment, and nothing follows `Pass` / `Pass with conditions` but an
 * optional parenthesis.
 *
 * Exit codes: 0 = nothing failed; 1 = at least one skill failed;
 * 2 = bad arguments or an invalid manifest (nothing was installed).
 */

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const MARKER_FILE = ".agentic-skill.json";
const INSTALLED_BY = "Agentic-Organization/Skills/install-skills.mjs";
const SKILL_FILE = "SKILL.md";
const MANIFEST_FILE = "skills.manifest.json";
const MANIFEST_VERSION = 1;
const DEFAULT_TARGET_DIR = "installed";
/** Set only by the test suite: lets the manifest use a local `file:` source. */
const FILE_URL_ENV = "AGENTIC_SKILLS_TEST_ALLOW_FILE_URL";
const GIT_TIMEOUT_MS = 120000;
const SHORT_SHA = 12;
const GIT_ENV_PREFIX = "GIT_";
const GIT_DIR_NAME = ".git";
/** `.git` and its Windows 8.3 short name, compared in lower case. */
const GIT_SEGMENTS = [GIT_DIR_NAME, "git~1"];
const DIGEST_PREFIX = "sha256:";
const MAX_REVIEW_BYTES = 2 * 1024 * 1024;
const REVIEWS_DIR = "reviews";
/** `reviews/<safe-name>.md`, relative to the manifest; group 1 is the file name. */
const REVIEW_PATH_RE = /^reviews\/([a-z0-9]+(?:[._-][a-z0-9]+)*\.md)$/;
/** A line that states a verdict in any shape: the word, then a colon within a few characters. Counted everywhere, fenced and commented lines included. */
const VERDICT_LINE_RE = /\bverdict\b[^:]{0,20}:/i;
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE_RE = /^ {0,3}(`+|~+)[ \t]*$/;
const COMMENT_OPEN = "<!--";
const COMMENT_CLOSE = "-->";
/** The only verdicts that list a skill; group 2 is what follows the verdict words. */
const VERDICT_PASS_RE = /^ {0,3}(?:[-*+]\s+)?(?:\*\*)?Verdict:?(?:\*\*)?:?\s*\**(Pass with conditions|Pass)\b(.*)$/i;
/** After the verdict words: nothing, or one parenthesis (so "Pass is not given" and "Pass - withdrawn, now Fail" are not a Pass). */
const VERDICT_TAIL_RE = /^[*_]*\s*(?:\([^()]*\))?[*_]*\.?\s*$/;
const EXECUTABLE_BITS = 0o111;
/** In the temp repository's .git/info/attributes: no filter, no line-ending, ident or encoding conversion. */
const NO_CONVERSION_ATTRIBUTES = "* -filter -text -ident -working-tree-encoding\n";
const DAY_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_DAYS = 1;

const EXIT_OK = 0;
const EXIT_SKILL_FAILED = 1;
const EXIT_USAGE = 2;

const SKILL_KEYS = ["name", "area", "source", "commit", "path", "license", "reviewed", "review", "hosts", "notes", "optional"];
const NAME_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const NAME_MAX = 64;
const WINDOWS_DEVICE_RE = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HTTPS_RE = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9._~/-]+$/;
const FILE_RE = /^file:\/\/\/[A-Za-z0-9._~/:%-]+$/;

const STATE = {
  missing: "missing",
  present: "present",
  outdated: "outdated",
  modified: "modified",
  clash: "clash",
};

const MSG = {
  usage:
    "Usage: node Skills/install-skills.mjs [--target <dir>] [--manifest <file>] [--dry-run] [--list] [--upgrade] [--with-optional] [--skill <name>]...\n" +
    "Installs every skill on the list that is missing; skills marked optional are installed only with --with-optional.\n" +
    "--skill <name> (repeatable) acts only on the named listed skill(s), optional or not; the others are left as they are.",
  skillName: "--skill takes the name of a listed skill (lowercase letters, digits and single . _ - separators): ",
  skillUnknown: "Not on the list: ",
  skillValid: "Listed skills: ",
  skillNone: "(the list is empty)",
  unknownArg: "Unknown argument: ",
  missingValue: "Missing value for ",
  manifestRead: "Cannot read the manifest: ",
  manifestInvalid: "Invalid manifest - nothing was installed:",
  noGit: "git was not found on PATH (or did not run): ",
  emptyList: "The list is empty: nothing to install.",
  wouldInstall: "would install",
  wouldUpdate: "would update",
  installed: "installed",
  updated: "updated",
  present: "present at the pinned commit - skipped",
  optional: "optional - not installed (re-run with --with-optional to add it)",
  outdated: "installed at another commit - re-run with --upgrade to replace it",
  modified:
    "installed files do not match the digest recorded at install (or none was recorded, or it was recorded in an older format without the executable bits) - re-run with --upgrade to reinstall the pinned commit",
  modifiedStatus: "modified",
  clash: "name clash: a folder with this name exists and was not installed by this script - left untouched",
  failed: "FAILED",
};

function fail(code, message) {
  process.stderr.write(message + "\n");
  process.exit(code);
}

function parseArgs(argv) {
  const options = { target: null, manifest: null, dryRun: false, list: false, update: false, withOptional: false, skills: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--upgrade") options.update = true;
    else if (arg === "--with-optional") options.withOptional = true;
    else if (arg === "--help" || arg === "-h") {
      process.stdout.write(MSG.usage + "\n");
      process.exit(EXIT_OK);
    } else if (arg === "--target" || arg === "--manifest" || arg === "--skill") {
      const value = argv[i + 1];
      if (typeof value !== "string" || value === "" || value.startsWith("--")) {
        fail(EXIT_USAGE, MSG.missingValue + arg + "\n" + MSG.usage);
      }
      if (arg === "--skill") {
        if (!isSafeName(value)) fail(EXIT_USAGE, MSG.skillName + JSON.stringify(value) + "\n" + MSG.usage);
        if (!options.skills.includes(value)) options.skills.push(value);
      } else {
        options[arg.slice(2)] = value;
      }
      i += 1;
    } else {
      fail(EXIT_USAGE, MSG.unknownArg + arg + "\n" + MSG.usage);
    }
  }
  return options;
}

function isSafeName(value) {
  return (
    typeof value === "string" &&
    value.length <= NAME_MAX &&
    NAME_RE.test(value) &&
    !WINDOWS_DEVICE_RE.test(value)
  );
}

/** A relative, forward-slash path with no `.`/`..`/`.git` segment; "." means the repository root. */
function isSafeRelativePath(value, allowDot) {
  if (typeof value !== "string" || value === "") return false;
  if (value === ".") return allowDot;
  return value.split("/").every((segment) => {
    return (
      SEGMENT_RE.test(segment) &&
      !/^\.+$/.test(segment) &&
      !segment.endsWith(".") &&
      segment.toLowerCase() !== ".git" &&
      !WINDOWS_DEVICE_RE.test(segment)
    );
  });
}

function isAllowedSource(value) {
  if (typeof value !== "string") return false;
  if (HTTPS_RE.test(value)) return true;
  return process.env[FILE_URL_ENV] === "1" && FILE_RE.test(value);
}

/** A real calendar date written YYYY-MM-DD, not later than today plus the allowed clock skew. */
function isPastOrPresentDate(value) {
  const match = typeof value === "string" ? DATE_RE.exec(value) : null;
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return date.getTime() <= today + CLOCK_SKEW_DAYS * DAY_MS;
}

/**
 * Every line of a review record that states a verdict, each with `hidden` true
 * when it sits inside a code fence (CommonMark rules; an unclosed fence runs to
 * the end) or touches an HTML comment. Hidden lines still count, so a renderer
 * that disagrees about a fence or a comment cannot show a second verdict.
 */
function verdictLines(text) {
  const found = [];
  let fence = null;
  let inComment = false;
  for (const line of text.split(/\r\n|\n|\r/)) {
    let hidden = fence !== null || inComment || line.includes(COMMENT_OPEN);
    if (fence !== null) {
      const closer = FENCE_CLOSE_RE.exec(line);
      if (closer && closer[1][0] === fence.char && closer[1].length >= fence.length) fence = null;
    } else {
      const opener = inComment ? null : FENCE_OPEN_RE.exec(line);
      if (opener && !(opener[1][0] === "`" && opener[2].includes("`"))) {
        fence = { char: opener[1][0], length: opener[1].length };
        hidden = true;
      } else {
        const open = line.lastIndexOf(COMMENT_OPEN);
        const close = line.lastIndexOf(COMMENT_CLOSE);
        if (open >= 0 && close < open) inComment = true;
        else if (close >= 0) inComment = false;
      }
    }
    if (VERDICT_LINE_RE.test(line)) found.push({ line, hidden });
  }
  return found;
}

/** Why the review record is not acceptable for this commit, or null when it is. */
function reviewRecordProblem(manifestDir, name, commit) {
  const file = path.join(manifestDir, REVIEWS_DIR, name);
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    return "does not exist beside the manifest - a skill is listed only after its review";
  }
  if (!stat.isFile() || stat.size > MAX_REVIEW_BYTES) return "is not a regular file (or is too large)";
  try {
    if (fs.realpathSync(file) !== path.join(fs.realpathSync(manifestDir), REVIEWS_DIR, name)) return "is not a regular file (it is reached through a link)";
  } catch {
    return "cannot be read";
  }
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return "cannot be read";
  }
  const verdicts = verdictLines(text);
  if (verdicts.length === 0) return "has no `Verdict: Pass` or `Verdict: Pass with conditions` line - a skill is listed only after a passing review";
  if (verdicts.length > 1) return "has more than one verdict line - a review record states one verdict";
  if (verdicts[0].hidden) return "has its verdict line inside a code fence or an HTML comment - a reader would not see it as the verdict";
  const pass = VERDICT_PASS_RE.exec(verdicts[0].line);
  if (pass === null || !VERDICT_TAIL_RE.test(pass[2])) {
    return "has a verdict line that is not `Pass` or `Pass with conditions` - a failed or rejected skill is not listed";
  }
  if (typeof commit === "string" && SHA_RE.test(commit) && !text.includes(commit)) {
    return "does not contain the full pinned commit - the review must be of the commit that is installed";
  }
  return null;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/** Returns a list of problems; an empty list means the manifest is valid. */
function validateManifest(manifest, manifestDir) {
  const errors = [];
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["the manifest must be a JSON object"];
  }
  for (const key of Object.keys(manifest)) {
    if (key !== "version" && key !== "skills") errors.push(`unknown top-level key "${key}"`);
  }
  if (manifest.version !== MANIFEST_VERSION) errors.push(`"version" must be ${MANIFEST_VERSION}`);
  if (!Array.isArray(manifest.skills)) {
    errors.push('"skills" must be an array');
    return errors;
  }
  const seen = new Set();
  manifest.skills.forEach((skill, index) => {
    const at = `skills[${index}]`;
    if (skill === null || typeof skill !== "object" || Array.isArray(skill)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(skill)) {
      if (!SKILL_KEYS.includes(key)) errors.push(`${at}: unknown key "${key}"`);
    }
    for (const key of SKILL_KEYS) {
      if (!(key in skill) && key !== "optional") errors.push(`${at}: missing "${key}"`);
    }
    if (!isSafeName(skill.name)) {
      errors.push(`${at}: "name" must be lowercase letters, digits and single . _ - separators (max ${NAME_MAX})`);
    } else if (seen.has(skill.name)) {
      errors.push(`${at}: duplicate name "${skill.name}"`);
    } else {
      seen.add(skill.name);
    }
    if (!isAllowedSource(skill.source)) errors.push(`${at}: "source" must be an https git URL without credentials or query`);
    if (typeof skill.commit !== "string" || !SHA_RE.test(skill.commit)) {
      errors.push(`${at}: "commit" must be a full 40-character lowercase hex sha (a branch or tag is not a pin)`);
    }
    if (!isSafeRelativePath(skill.path, true)) errors.push(`${at}: "path" must be "." or a relative folder with no ".." segment`);
    if (!isNonEmptyString(skill.area)) errors.push(`${at}: "area" must be a non-empty string`);
    if (!isNonEmptyString(skill.license)) errors.push(`${at}: "license" must be a non-empty string`);
    if (!isPastOrPresentDate(skill.reviewed)) errors.push(`${at}: "reviewed" must be a real YYYY-MM-DD date that is not in the future`);
    const reviewPath = typeof skill.review === "string" ? REVIEW_PATH_RE.exec(skill.review) : null;
    if (reviewPath === null || !isSafeRelativePath(skill.review, false)) {
      errors.push(`${at}: "review" must be \`reviews/<name>.md\` beside the manifest (lowercase letters, digits and single . _ - separators)`);
    } else {
      const problem = reviewRecordProblem(manifestDir, reviewPath[1], skill.commit);
      if (problem !== null) errors.push(`${at}: review record "${skill.review}" ${problem}`);
    }
    if (!Array.isArray(skill.hosts) || skill.hosts.length === 0 || !skill.hosts.every(isNonEmptyString)) {
      errors.push(`${at}: "hosts" must be a non-empty array of strings`);
    }
    if (typeof skill.notes !== "string") errors.push(`${at}: "notes" must be a string`);
    if (skill.optional !== undefined && typeof skill.optional !== "boolean") errors.push(`${at}: "optional" must be true or false when present`);
  });
  return errors;
}

function readMarker(dest) {
  try {
    const stat = fs.lstatSync(path.join(dest, MARKER_FILE));
    if (!stat.isFile()) return null;
    const marker = JSON.parse(fs.readFileSync(path.join(dest, MARKER_FILE), "utf8"));
    if (marker === null || typeof marker !== "object" || marker.installedBy !== INSTALLED_BY) return null;
    return marker;
  } catch {
    return null;
  }
}

/**
 * sha256 over the installed tree: every entry below `dir` except the marker,
 * as sorted forward-slash relative paths, each with its kind and, for a file,
 * its bytes and its executable bits (taken as 0 on Windows, which has none).
 * Any added, removed, renamed or edited entry, or a file made executable,
 * changes the digest.
 */
function digestTree(dir) {
  const entries = [];
  const walk = (current, prefix) => {
    for (const name of fs.readdirSync(current)) {
      const relative = prefix === "" ? name : `${prefix}/${name}`;
      if (relative === MARKER_FILE) continue;
      const full = path.join(current, name);
      const stat = fs.lstatSync(full);
      if (stat.isDirectory()) {
        entries.push({ relative, kind: "d", full });
        walk(full, relative);
      } else if (stat.isFile()) {
        entries.push({ relative, kind: "f", full, executable: process.platform === "win32" ? 0 : stat.mode & EXECUTABLE_BITS });
      } else {
        entries.push({ relative, kind: stat.isSymbolicLink() ? "l" : "o", full });
      }
    }
  };
  walk(dir, "");
  entries.sort((a, b) => (a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0));
  const hash = crypto.createHash("sha256");
  for (const entry of entries) {
    hash.update(`${entry.kind}\0${entry.relative}\0`);
    if (entry.kind === "f") {
      const bytes = fs.readFileSync(entry.full);
      hash.update(`${bytes.length}\0${entry.executable}\0`);
      hash.update(bytes);
    } else if (entry.kind === "l") {
      hash.update(`${fs.readlinkSync(entry.full)}\0`);
    }
  }
  return DIGEST_PREFIX + hash.digest("hex");
}

/** Read-only: what is at <target>/<name> right now. */
function inspect(dest, skill) {
  let stat;
  try {
    stat = fs.lstatSync(dest);
  } catch (error) {
    if (error.code === "ENOENT") return { state: STATE.missing, installedCommit: null };
    throw error;
  }
  const marker = stat.isDirectory() ? readMarker(dest) : null;
  if (marker === null || marker.name !== skill.name) return { state: STATE.clash, installedCommit: null };
  const same = marker.commit === skill.commit && marker.source === skill.source && marker.path === skill.path;
  let state = same ? STATE.present : STATE.outdated;
  if (same && (typeof marker.digest !== "string" || marker.digest !== digestTree(dest))) state = STATE.modified;
  return {
    state,
    installedCommit: typeof marker.commit === "string" ? marker.commit : null,
  };
}

/**
 * The environment for git: the caller's, minus every GIT_* variable (GIT_DIR,
 * GIT_WORK_TREE, GIT_INDEX_FILE, GIT_CONFIG_*, GIT_ALLOW_PROTOCOL ... would
 * redirect or reconfigure the call), plus only what the installer needs.
 */
function gitEnv() {
  const env = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.toUpperCase().startsWith(GIT_ENV_PREFIX)) env[name] = value;
  }
  env.GIT_TERMINAL_PROMPT = "0";
  env.GIT_ASKPASS = "";
  env.GCM_INTERACTIVE = "never";
  env.GIT_ALLOW_PROTOCOL = process.env[FILE_URL_ENV] === "1" ? "https:file" : "https";
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_LFS_SKIP_SMUDGE = "1";
  return env;
}

/** Runs `run(cwd)` with a new, empty temp directory as `cwd`, and removes it afterwards. */
function withEmptyDir(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-skill-cwd-"));
  try {
    return run(dir);
  } finally {
    removeDir(dir);
  }
}

/**
 * Runs git against the repository in `repo` and nothing else: --git-dir and --work-tree are explicit on every call.
 * `cwd` is a separate, empty directory: the repository is named by the two flags, and the fetched work tree must
 * never be the child's current directory (on Windows a bare `git` may be looked up there).
 */
function git(repo, cwd, args) {
  const allowedProtocols = ["-c", "protocol.allow=never", "-c", "protocol.https.allow=always"];
  if (process.env[FILE_URL_ENV] === "1") allowedProtocols.push("-c", "protocol.file.allow=always");
  const noFilters = ["-c", "filter.lfs.smudge=", "-c", "filter.lfs.process=", "-c", "filter.lfs.required=false", "-c", "core.autocrlf=false", "-c", "core.eol=lf"];
  const result = spawnSync(
    "git",
    [
      "--git-dir",
      path.join(repo, GIT_DIR_NAME),
      "--work-tree",
      repo,
      "-c",
      `core.hooksPath=${os.devNull}`,
      "-c",
      "core.fsmonitor=false",
      "-c",
      "advice.detachedHead=false",
      ...allowedProtocols,
      ...noFilters,
      ...args,
    ],
    {
      cwd,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: GIT_TIMEOUT_MS,
      env: gitEnv(),
    },
  );
  if (result.error) throw new Error(`git ${args[0]}: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} exited ${result.status}: ${String(result.stderr).trim().split(/\r?\n/).slice(-2).join(" | ")}`);
  }
  return String(result.stdout).trim();
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function hasGitSegment(root, candidate) {
  return path
    .relative(root, candidate)
    .split(/[\\/]/)
    .some((segment) => GIT_SEGMENTS.includes(segment.toLowerCase()));
}

/**
 * Copies a directory tree with no code execution. Regular files and
 * directories only; a symlink is followed only when it resolves to a regular
 * file inside the skill folder, and is otherwise refused. Nothing is ever
 * copied from a `.git` folder: an entry of that name is skipped, and a symlink
 * that resolves into one is refused.
 */
function copyTree(skillRoot, from, to) {
  fs.mkdirSync(to);
  for (const entry of fs.readdirSync(from)) {
    const source = path.join(from, entry);
    const relative = path.relative(skillRoot, source);
    if (GIT_SEGMENTS.includes(entry.toLowerCase())) continue;
    if (entry === MARKER_FILE) throw new Error(`the skill ships its own ${MARKER_FILE} (${relative}) - refused`);
    const stat = fs.lstatSync(source);
    if (stat.isDirectory()) {
      copyTree(skillRoot, source, path.join(to, entry));
    } else if (stat.isFile()) {
      fs.copyFileSync(source, path.join(to, entry), fs.constants.COPYFILE_EXCL);
    } else if (stat.isSymbolicLink()) {
      let resolved;
      try {
        resolved = fs.realpathSync(source);
      } catch {
        throw new Error(`symlink ${relative} does not resolve - refused`);
      }
      if (!isInside(skillRoot, resolved)) throw new Error(`symlink ${relative} points outside the skill folder - refused`);
      if (hasGitSegment(skillRoot, resolved)) throw new Error(`symlink ${relative} resolves into ${GIT_DIR_NAME} - refused`);
      if (!fs.lstatSync(resolved).isFile()) throw new Error(`symlink ${relative} does not point to a regular file - refused`);
      fs.copyFileSync(resolved, path.join(to, entry), fs.constants.COPYFILE_EXCL);
    } else {
      throw new Error(`${relative} is not a regular file or directory - refused`);
    }
  }
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
}

/** Fetch the pinned commit, verify it, copy `path` into <target>/<name>, write the marker. */
function installSkill(skill, target, replace) {
  const dest = path.join(target, skill.name);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-skill-"));
  const staging = path.join(target, `.${skill.name}.installing-${process.pid}`);
  const retired = path.join(target, `.${skill.name}.replaced-${process.pid}`);
  const emptyCwd = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-skill-cwd-"));
  try {
    git(temp, emptyCwd, ["init", "-q", "--template="]);
    const infoDir = path.join(temp, GIT_DIR_NAME, "info");
    fs.mkdirSync(infoDir, { recursive: true });
    fs.writeFileSync(path.join(infoDir, "attributes"), NO_CONVERSION_ATTRIBUTES);
    git(temp, emptyCwd, ["fetch", "-q", "--depth", "1", "--no-tags", "--no-recurse-submodules", skill.source, skill.commit]);
    git(temp, emptyCwd, ["checkout", "-q", "--detach", "FETCH_HEAD"]);
    const head = git(temp, emptyCwd, ["rev-parse", "HEAD"]);
    if (head !== skill.commit) throw new Error(`fetched ${head}, pinned ${skill.commit} - refused`);

    const tempReal = fs.realpathSync(temp);
    const skillDir = skill.path === "." ? tempReal : path.join(tempReal, ...skill.path.split("/"));
    let skillRoot;
    try {
      skillRoot = fs.realpathSync(skillDir);
    } catch {
      throw new Error(`path "${skill.path}" does not exist at the pinned commit`);
    }
    if (skillRoot !== skillDir || !fs.lstatSync(skillRoot).isDirectory()) {
      throw new Error(`path "${skill.path}" is not a plain folder inside the repository - refused`);
    }
    if (hasGitSegment(tempReal, skillRoot)) throw new Error(`path "${skill.path}" resolves into ${GIT_DIR_NAME} - refused`);
    const skillFile = path.join(skillRoot, SKILL_FILE);
    if (!fs.existsSync(skillFile) || !fs.lstatSync(skillFile).isFile()) {
      throw new Error(`path "${skill.path}" holds no ${SKILL_FILE}`);
    }

    removeDir(staging);
    copyTree(skillRoot, skillRoot, staging);
    const marker = {
      installedBy: INSTALLED_BY,
      name: skill.name,
      source: skill.source,
      commit: skill.commit,
      path: skill.path,
      installedAt: new Date().toISOString(),
      digest: digestTree(staging),
    };
    fs.writeFileSync(path.join(staging, MARKER_FILE), JSON.stringify(marker, null, 2) + "\n", { flag: "wx" });

    if (replace) fs.renameSync(dest, retired);
    try {
      fs.renameSync(staging, dest);
    } catch (error) {
      if (replace) fs.renameSync(retired, dest);
      throw error;
    }
    if (replace) removeDir(retired);
  } finally {
    removeDir(staging);
    removeDir(temp);
    removeDir(emptyCwd);
  }
}

function printTable(rows) {
  const header = ["skill", "pinned commit", "status", "detail"];
  const all = [header, ...rows];
  const widths = header.map((_, column) => Math.max(...all.map((row) => row[column].length)));
  const line = (row) => row.map((cell, column) => (column === row.length - 1 ? cell : cell.padEnd(widths[column]))).join("  ");
  process.stdout.write(line(header) + "\n");
  process.stdout.write(widths.map((width) => "-".repeat(width)).join("  ") + "\n");
  for (const row of rows) process.stdout.write(line(row) + "\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(options.manifest ?? path.join(HERE, MANIFEST_FILE));
  const target = path.resolve(options.target ?? path.join(HERE, DEFAULT_TARGET_DIR));
  if (options.target === null || options.target === undefined) {
    // The default target must be a real folder inside the library: a symlink committed at Skills/installed would redirect every write.
    let stat = null;
    try {
      stat = fs.lstatSync(target);
    } catch {
      stat = null;
    }
    if (stat !== null && (stat.isSymbolicLink() || !stat.isDirectory() || fs.realpathSync(target) !== path.join(fs.realpathSync(HERE), DEFAULT_TARGET_DIR))) {
      fail(EXIT_USAGE, `The default target ${target} is not a real folder inside the library (a symlink or a file is in its place) - nothing was installed. Remove it or pass --target.`);
    }
  }
  const readOnly = options.dryRun || options.list;

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(EXIT_USAGE, MSG.manifestRead + error.message);
  }
  const problems = validateManifest(manifest, path.dirname(manifestPath));
  if (problems.length > 0) fail(EXIT_USAGE, [MSG.manifestInvalid, ...problems.map((problem) => "  - " + problem)].join("\n"));

  const selected = options.skills.length > 0;
  const listedNames = manifest.skills.map((skill) => skill.name);
  const unknown = options.skills.filter((name) => !listedNames.includes(name));
  if (unknown.length > 0) {
    fail(EXIT_USAGE, `${MSG.skillUnknown}${unknown.join(", ")}\n${MSG.skillValid}${listedNames.length > 0 ? listedNames.join(", ") : MSG.skillNone}\n${MSG.usage}`);
  }

  process.stdout.write(
    `Manifest: ${manifestPath}\nTarget:   ${target}${selected ? `\nSelected: ${options.skills.join(", ")}` : ""}${options.dryRun ? "\nDry run: nothing is changed." : ""}\n\n`,
  );
  if (manifest.skills.length === 0) {
    process.stdout.write(MSG.emptyList + "\n");
    return EXIT_OK;
  }

  const plans = manifest.skills.filter((skill) => !selected || options.skills.includes(skill.name)).map((skill) => {
    try {
      return { skill, ...inspect(path.join(target, skill.name), skill) };
    } catch (error) {
      return { skill, state: null, installedCommit: null, error: error.message };
    }
  });
  const replaceable = (state) => state === STATE.outdated || state === STATE.modified;
  const skipOptional = (plan) => plan.state === STATE.missing && plan.skill.optional === true && !options.withOptional && !selected;
  const needsGit = !readOnly && plans.some((plan) => (plan.state === STATE.missing && !skipOptional(plan)) || (replaceable(plan.state) && options.update));
  if (needsGit) {
    const probe = withEmptyDir((cwd) => spawnSync("git", ["--version"], { cwd, encoding: "utf8", shell: false, windowsHide: true, env: gitEnv() }));
    if (probe.error || probe.status !== 0) fail(EXIT_SKILL_FAILED, MSG.noGit + (probe.error ? probe.error.message : `exit ${probe.status}`));
    fs.mkdirSync(target, { recursive: true });
  }

  const rows = [];
  const counts = { installed: 0, updated: 0, present: 0, outdated: 0, modified: 0, clash: 0, failed: 0, optional: 0 };
  for (const plan of plans) {
    const { skill } = plan;
    let status;
    let detail;
    if (plan.state === null) {
      counts.failed += 1;
      status = MSG.failed;
      detail = plan.error;
    } else if (skipOptional(plan)) {
      counts.optional += 1;
      status = "skip";
      detail = MSG.optional;
    } else if (plan.state === STATE.present) {
      counts.present += 1;
      status = "skip";
      detail = MSG.present;
    } else if (plan.state === STATE.clash) {
      counts.clash += 1;
      status = "skip";
      detail = MSG.clash;
    } else if (plan.state === STATE.outdated && !options.update) {
      counts.outdated += 1;
      status = "skip";
      detail = `${MSG.outdated} (installed: ${String(plan.installedCommit).slice(0, SHORT_SHA)})`;
    } else if (plan.state === STATE.modified && (!options.update || options.list)) {
      counts.modified += 1;
      status = MSG.modifiedStatus;
      detail = MSG.modified;
    } else {
      const replace = replaceable(plan.state);
      if (readOnly) {
        counts[replace ? "updated" : "installed"] += 1;
        status = replace ? MSG.wouldUpdate : MSG.wouldInstall;
        detail = `${skill.source} (${skill.path})`;
      } else {
        try {
          installSkill(skill, target, replace);
          counts[replace ? "updated" : "installed"] += 1;
          status = replace ? MSG.updated : MSG.installed;
          detail = path.join(target, skill.name);
        } catch (error) {
          counts.failed += 1;
          status = MSG.failed;
          detail = error.message;
        }
      }
    }
    rows.push([skill.name, skill.commit.slice(0, SHORT_SHA), status, options.list ? `${detail} [${skill.area}; ${skill.license}; reviewed ${skill.reviewed}; ${skill.review}]` : detail]);
  }

  printTable(rows);
  const verb = readOnly ? "to install" : "installed";
  const verbUpdate = readOnly ? "to update" : "updated";
  process.stdout.write(
    `\n${selected ? `${plans.length} selected` : `${manifest.skills.length} listed`}: ${counts.installed} ${verb}, ${counts.updated} ${verbUpdate}, ${counts.present} already present, ` +
      `${counts.outdated} at another commit, ${counts.modified} modified, ${counts.clash} name clash, ${counts.optional} optional not installed, ${counts.failed} failed.\n`,
  );
  return counts.failed > 0 ? EXIT_SKILL_FAILED : EXIT_OK;
}

process.exitCode = main();
