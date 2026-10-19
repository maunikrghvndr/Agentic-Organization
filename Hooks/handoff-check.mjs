#!/usr/bin/env node
/**
 * Stop hook: enforce the phase-memory / handoff contract from AGENTS.md.
 *
 * Fires when Claude Code finishes a turn. Blocks the stop if the session
 * changed source files but the newest task memory file under .ai-memory/TASKS/
 * is older than that work, has no `## Handoff` section, or has no Evidence row.
 * Prose-only turns (.md/.txt/.csv, LICENSE, CHANGELOG) are exempt.
 *
 * Loop guard: the platform sets `stop_hook_active: true` when it is already
 * continuing because of a Stop hook, and overrides any block after eight
 * consecutive continuations with no tool call in between. We exit 0 on
 * `stop_hook_active`, so the check nudges at most once per stop attempt.
 *
 * Silent no-op unless the repo has opted in by having AGENTS.md at its root
 * that mentions `.ai-memory`, so a single user-level install is safe across
 * every repo on the machine.
 *
 * Exit 0 = allow stop. Exit 2 + stderr = block, stderr goes back to Claude.
 * The same decision is also written to stdout as `{"decision":"block","reason"}`
 * — the Stop-hook JSON shape Claude Code and Kiro document (see Hooks/README.md).
 *
 * Contract checked against the Claude Code hooks reference and guide
 * (code.claude.com/docs/en/hooks, /hooks-guide) on 2026-10-19; the pages carry
 * no "last updated" date and reference Claude Code v2.1.296.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ALLOW = 0;
const BLOCK = 2;

/** Directories whose changes never count as "work that needs recording". */
const IGNORED_PREFIXES = [".ai-memory/", ".claude/", ".claude/worktrees/", "graphify-out/"];

/** Prose/data files: a turn that changes only these needs no new task-file entry. */
const PROSE_EXTENSIONS = [".md", ".txt", ".csv"];
const PROSE_BASENAMES = /^(LICENSE|CHANGELOG)(\..+)?$/i;

const HANDOFF_HEADING = /^##\s+Handoff\b/m;
/** An Evidence row: "- `<command>` | <scope> | <exit code> | ..." (TASK_MEMORY template). */
const EVIDENCE_ROW = /^\s*-\s*`[^`\n]+`\s*\|[^\n|]*\|\s*\d+\s*\|/m;

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
    // existsSync, not a directory check: in a linked worktree `.git` is a file
    // (a "gitdir: ..." pointer) and must still count as the repo root.
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
    // `all`, not `normal`: normal collapses a new directory to `dir/` and its files vanish.
    status = git(repoRoot, ["status", "--porcelain", "--untracked-files=all"]);
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

function isProse(rel) {
  const base = path.basename(rel);
  if (PROSE_EXTENSIONS.some((ext) => base.toLowerCase().endsWith(ext))) return true;
  if (PROSE_BASENAMES.test(base)) return true;
  // JSON counts as prose/data only inside repo memory.
  return rel.startsWith(".ai-memory/") && base.toLowerCase().endsWith(".json");
}

/** Newest task memory file (name, mtime, text), or null if the TASKS dir has none. */
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
    const abs = path.join(tasksDir, entry.name);
    const st = fs.statSync(abs);
    if (!newest || st.mtimeMs > newest.mtimeMs) {
      newest = { name: entry.name, abs, mtimeMs: st.mtimeMs };
    }
  }
  if (newest) newest.text = fs.readFileSync(newest.abs, "utf8");
  return newest;
}

/** Repo root: hook input `cwd`, then CLAUDE_PROJECT_DIR, then the process cwd. */
function resolveRepoRoot(input) {
  return findRepoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
}

/** Human-readable reasons the newest task file does not record this work; empty = it does. */
function failedConditions(taskFile, newestChange) {
  if (!taskFile) return ["No task memory file exists under `.ai-memory/TASKS/`."];
  const file = `\`.ai-memory/TASKS/${taskFile.name}\``;
  const failed = [];
  if (taskFile.mtimeMs < newestChange) failed.push(`${file} is older than the code you changed.`);
  if (!HANDOFF_HEADING.test(taskFile.text)) failed.push(`${file} has no \`## Handoff\` section.`);
  if (!EVIDENCE_ROW.test(taskFile.text)) {
    failed.push(`${file} has no Evidence row (\`- \`<command>\` | scope | exit code | sha\`).`);
  }
  return failed;
}

function main() {
  const input = readStdin();
  // Already continuing because of a Stop hook: never block twice in a row.
  if (input.stop_hook_active === true) return ALLOW;

  const repoRoot = resolveRepoRoot(input);
  if (!repoRoot) return ALLOW;
  if (!usesRoleLibrary(repoRoot)) return ALLOW;

  const changed = changedSourceFiles(repoRoot);
  if (changed.length === 0) return ALLOW;
  if (changed.every((f) => isProse(f.rel))) return ALLOW;

  const newestChange = Math.max(...changed.map((f) => f.mtimeMs));
  const failed = failedConditions(newestTaskFile(repoRoot), newestChange);
  if (failed.length === 0) return ALLOW;

  const sample = changed.slice(0, 8).map((f) => `  - ${f.rel}`).join("\n");
  const more = changed.length > 8 ? `\n  ...and ${changed.length - 8} more` : "";

  const reason =
    `Phase not recorded (AGENTS.md memory contract).\n\n` +
    `${failed.map((r) => `- ${r}`).join("\n")}\n\n` +
    `Changed this session:\n${sample}${more}\n\n` +
    `Before stopping, update (or create) the task memory file for this task:\n` +
    `  - Files changed and why\n` +
    `  - Decisions and their reasons\n` +
    `  - \`## Evidence\`: one row per check — \`<exact command>\` | scope | exit code | sha\n` +
    `  - \`## Handoff\`: next role, files to read first (path:line), ` +
    `done + verified, remaining, settled decisions\n\n` +
    `Also move the item in \`.ai-memory/ROADMAP.md\` to its current status. ` +
    `If this session genuinely produced no task work, say so and stop again — ` +
    `this check does not block a stop it already continued.\n`;

  process.stderr.write(reason);
  process.stdout.write(JSON.stringify({ decision: "block", reason }) + "\n");
  return BLOCK;
}

process.exit(main());
