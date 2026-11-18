#!/usr/bin/env node
/**
 * Skills/install-skills.mjs - installs every skill on the curated list
 * (Skills/skills.manifest.json) that is missing from the target skills folder.
 *
 * Optional overlay: the role library works with no skill installed.
 * Node only, no dependencies, Windows/macOS/Linux. Needs `git` on PATH.
 *
 * Usage (from the library root):
 *   node Skills/install-skills.mjs              install every missing skill
 *   node Skills/install-skills.mjs --dry-run    print what would happen, change nothing
 *   node Skills/install-skills.mjs --list       print the list and each skill's state
 *   node Skills/install-skills.mjs --upgrade     also replace a skill installed at another commit
 *   node Skills/install-skills.mjs --target <dir>     default: ~/.claude/skills
 *   node Skills/install-skills.mjs --manifest <file>  default: skills.manifest.json beside this script
 *
 * What it does per skill: fetch exactly the pinned commit with git into a new
 * empty temp directory, check `git rev-parse HEAD` equals the pin, copy only
 * the skill's `path` into <target>/<name>, write a marker file, remove the
 * temp directory. It never runs anything from the fetched repository.
 *
 * Exit codes: 0 = nothing failed; 1 = at least one skill failed;
 * 2 = bad arguments or an invalid manifest (nothing was installed).
 */

import { spawnSync } from "node:child_process";
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
const DEFAULT_TARGET_PARTS = [".claude", "skills"];
/** Set only by the test suite: lets the manifest use a local `file:` source. */
const FILE_URL_ENV = "AGENTIC_SKILLS_TEST_ALLOW_FILE_URL";
const GIT_TIMEOUT_MS = 120000;
const SHORT_SHA = 12;

const EXIT_OK = 0;
const EXIT_SKILL_FAILED = 1;
const EXIT_USAGE = 2;

const SKILL_KEYS = ["name", "area", "source", "commit", "path", "license", "reviewed", "review", "hosts", "notes"];
const NAME_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const NAME_MAX = 64;
const WINDOWS_DEVICE_RE = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_RE = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9._~/-]+$/;
const FILE_RE = /^file:\/\/\/[A-Za-z0-9._~/:%-]+$/;

const STATE = {
  missing: "missing",
  present: "present",
  outdated: "outdated",
  clash: "clash",
};

const MSG = {
  usage:
    "Usage: node Skills/install-skills.mjs [--target <dir>] [--manifest <file>] [--dry-run] [--list] [--upgrade]\n" +
    "Installs every skill on the list that is missing. There is no per-skill selection.",
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
  outdated: "installed at another commit - re-run with --upgrade to replace it",
  clash: "name clash: a folder with this name exists and was not installed by this script - left untouched",
  failed: "FAILED",
};

function fail(code, message) {
  process.stderr.write(message + "\n");
  process.exit(code);
}

function parseArgs(argv) {
  const options = { target: null, manifest: null, dryRun: false, list: false, update: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--upgrade") options.update = true;
    else if (arg === "--help" || arg === "-h") {
      process.stdout.write(MSG.usage + "\n");
      process.exit(EXIT_OK);
    } else if (arg === "--target" || arg === "--manifest") {
      const value = argv[i + 1];
      if (typeof value !== "string" || value === "" || value.startsWith("--")) {
        fail(EXIT_USAGE, MSG.missingValue + arg + "\n" + MSG.usage);
      }
      options[arg.slice(2)] = value;
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
      if (!(key in skill)) errors.push(`${at}: missing "${key}"`);
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
    if (typeof skill.reviewed !== "string" || !DATE_RE.test(skill.reviewed)) errors.push(`${at}: "reviewed" must be a YYYY-MM-DD date`);
    if (!isSafeRelativePath(skill.review, false)) {
      errors.push(`${at}: "review" must be a relative path to the review record`);
    } else if (!fs.existsSync(path.join(manifestDir, ...skill.review.split("/")))) {
      errors.push(`${at}: review record "${skill.review}" does not exist beside the manifest - a skill is listed only after its review`);
    }
    if (!Array.isArray(skill.hosts) || skill.hosts.length === 0 || !skill.hosts.every(isNonEmptyString)) {
      errors.push(`${at}: "hosts" must be a non-empty array of strings`);
    }
    if (typeof skill.notes !== "string") errors.push(`${at}: "notes" must be a string`);
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
  return {
    state: same ? STATE.present : STATE.outdated,
    installedCommit: typeof marker.commit === "string" ? marker.commit : null,
  };
}

function git(cwd, args) {
  const allowedProtocols = ["-c", "protocol.allow=never", "-c", "protocol.https.allow=always"];
  if (process.env[FILE_URL_ENV] === "1") allowedProtocols.push("-c", "protocol.file.allow=always");
  const result = spawnSync(
    "git",
    ["-c", `core.hooksPath=${os.devNull}`, "-c", "core.fsmonitor=false", "-c", "advice.detachedHead=false", ...allowedProtocols, ...args],
    {
      cwd,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: GIT_TIMEOUT_MS,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "", GCM_INTERACTIVE: "never" },
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

/**
 * Copies a directory tree with no code execution. Regular files and
 * directories only; a symlink is followed only when it resolves to a regular
 * file inside the skill folder, and is otherwise refused.
 */
function copyTree(skillRoot, from, to) {
  fs.mkdirSync(to);
  for (const entry of fs.readdirSync(from)) {
    const source = path.join(from, entry);
    const relative = path.relative(skillRoot, source);
    if (entry.toLowerCase() === ".git") continue;
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
  try {
    git(temp, ["init", "-q"]);
    git(temp, ["fetch", "-q", "--depth", "1", "--no-tags", "--no-recurse-submodules", skill.source, skill.commit]);
    git(temp, ["checkout", "-q", "--detach", "FETCH_HEAD"]);
    const head = git(temp, ["rev-parse", "HEAD"]);
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
  const target = path.resolve(options.target ?? path.join(os.homedir(), ...DEFAULT_TARGET_PARTS));
  const readOnly = options.dryRun || options.list;

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(EXIT_USAGE, MSG.manifestRead + error.message);
  }
  const problems = validateManifest(manifest, path.dirname(manifestPath));
  if (problems.length > 0) fail(EXIT_USAGE, [MSG.manifestInvalid, ...problems.map((problem) => "  - " + problem)].join("\n"));

  process.stdout.write(`Manifest: ${manifestPath}\nTarget:   ${target}${options.dryRun ? "\nDry run: nothing is changed." : ""}\n\n`);
  if (manifest.skills.length === 0) {
    process.stdout.write(MSG.emptyList + "\n");
    return EXIT_OK;
  }

  const plans = manifest.skills.map((skill) => {
    try {
      return { skill, ...inspect(path.join(target, skill.name), skill) };
    } catch (error) {
      return { skill, state: null, installedCommit: null, error: error.message };
    }
  });
  const needsGit = !readOnly && plans.some((plan) => plan.state === STATE.missing || (plan.state === STATE.outdated && options.update));
  if (needsGit) {
    const probe = spawnSync("git", ["--version"], { encoding: "utf8", shell: false, windowsHide: true });
    if (probe.error || probe.status !== 0) fail(EXIT_SKILL_FAILED, MSG.noGit + (probe.error ? probe.error.message : `exit ${probe.status}`));
    fs.mkdirSync(target, { recursive: true });
  }

  const rows = [];
  const counts = { installed: 0, updated: 0, present: 0, outdated: 0, clash: 0, failed: 0 };
  for (const plan of plans) {
    const { skill } = plan;
    let status;
    let detail;
    if (plan.state === null) {
      counts.failed += 1;
      status = MSG.failed;
      detail = plan.error;
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
    } else {
      const replace = plan.state === STATE.outdated;
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
    `\n${manifest.skills.length} listed: ${counts.installed} ${verb}, ${counts.updated} ${verbUpdate}, ${counts.present} already present, ` +
      `${counts.outdated} at another commit, ${counts.clash} name clash, ${counts.failed} failed.\n`,
  );
  return counts.failed > 0 ? EXIT_SKILL_FAILED : EXIT_OK;
}

process.exitCode = main();
