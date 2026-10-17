#!/usr/bin/env node
/**
 * Stop hook: enforce the phase-memory / handoff contract from AGENTS.md.
 *
 * Fires when Claude Code finishes a turn. Blocks the stop exactly once per
 * session if the session changed source files but did not record the work in
 * a task memory file under .ai-memory/TASKS/.
 *
 * Silent no-op unless the repo has opted in by having AGENTS.md at its root,
 * so a single global install is safe across every repo on the machine.
 *
 * Exit 0 = allow stop. Exit 2 + stderr = block, stderr goes back to Claude.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ALLOW = 0;
const BLOCK = 2;

/** Directories whose changes never count as "work that needs recording". */
const IGNORED_PREFIXES = [".ai-memory/", ".claude/", "graphify-out/"];

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function git(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** True only for repos that adopted this role library. */
function usesRoleLibrary(repoRoot) {
  const agentsMd = path.join(repoRoot, "AGENTS.md");
  if (!fs.existsSync(agentsMd)) return false;
  return fs.readFileSync(agentsMd, "utf8").includes(".ai-memory");
}

/** Working-tree changes that represent real work, newest mtime first. */
function changedSourceFiles(repoRoot) {
  let status;
  try {
    status = git(repoRoot, ["status", "--porcelain", "--untracked-files=normal"]);
  } catch {
    return [];
  }

  const files = [];
  for (const line of status.split("\n")) {
    if (!line.trim()) continue;
    // Porcelain v1: XY<space>path, or XY<space>old -> new for renames.
    let rel = line.slice(3).trim();
    const arrow = rel.indexOf(" -> ");
    if (arrow !== -1) rel = rel.slice(arrow + 4);
    rel = rel.replace(/^"|"$/g, "");
    if (IGNORED_PREFIXES.some((p) => rel.startsWith(p))) continue;

    const abs = path.join(repoRoot, rel);
    try {
      const st = fs.statSync(abs);
      if (st.isFile()) files.push({ rel, mtimeMs: st.mtimeMs });
    } catch {
      // Deleted file — it is work, but has no mtime to compare.
      files.push({ rel, mtimeMs: 0 });
    }
  }
  return files;
}

/** Newest task memory file, or null if the TASKS dir has none. */
function newestTaskFile(repoRoot) {
  const tasksDir = path.join(repoRoot, ".ai-memory", "TASKS");
  let entries;
  try {
    entries = fs.readdirSync(tasksDir, { withFileTypes: true });
  } catch {
    return null;
  }

  let newest = null;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const st = fs.statSync(path.join(tasksDir, entry.name));
    if (!newest || st.mtimeMs > newest.mtimeMs) {
      newest = { name: entry.name, mtimeMs: st.mtimeMs };
    }
  }
  return newest;
}

/**
 * Block at most once per session, so a Claude that cannot satisfy the check
 * never gets trapped in a stop/continue loop.
 */
function alreadyFiredThisSession(repoRoot, sessionId) {
  if (!sessionId) return false;
  const marker = path.join(repoRoot, ".git", "agentic-handoff", `${sessionId}`);
  if (fs.existsSync(marker)) return true;
  fs.mkdirSync(path.dirname(marker), { recursive: true });
  fs.writeFileSync(marker, new Date().toISOString());
  return false;
}

function main() {
  const input = readStdin();
  const repoRoot = findRepoRoot(input.cwd || process.cwd());
  if (!repoRoot) return ALLOW;
  if (!usesRoleLibrary(repoRoot)) return ALLOW;

  const changed = changedSourceFiles(repoRoot);
  if (changed.length === 0) return ALLOW;

  const newestChange = Math.max(...changed.map((f) => f.mtimeMs));
  const taskFile = newestTaskFile(repoRoot);
  if (taskFile && taskFile.mtimeMs >= newestChange) return ALLOW;

  if (alreadyFiredThisSession(repoRoot, input.session_id)) return ALLOW;

  const sample = changed.slice(0, 8).map((f) => `  - ${f.rel}`).join("\n");
  const more = changed.length > 8 ? `\n  ...and ${changed.length - 8} more` : "";

  const reason = taskFile
    ? `The task memory file \`.ai-memory/TASKS/${taskFile.name}\` is older than the code you changed.`
    : `No task memory file exists under \`.ai-memory/TASKS/\`.`;

  process.stderr.write(
    `Phase not recorded (AGENTS.md memory contract).\n\n` +
      `${reason}\n\n` +
      `Changed this session:\n${sample}${more}\n\n` +
      `Before stopping, update (or create) the task memory file for this task:\n` +
      `  - Files changed and why\n` +
      `  - Decisions and their reasons\n` +
      `  - Tests added/run, with results\n` +
      `  - The \`## Handoff\` section: next role, files to read first (path:line), ` +
      `done + verified, remaining, settled decisions\n\n` +
      `Also move the item in \`.ai-memory/ROADMAP.md\` to its current status. ` +
      `If this session genuinely produced no task work, say so and stop again — ` +
      `this check fires only once per session.\n`
  );
  return BLOCK;
}

process.exit(main());
