#!/usr/bin/env node
/**
 * SessionStart hook (matchers: compact, resume): re-entry context for AGENTS.md.
 *
 * After a compaction or a resume the host re-injects AGENTS.md but not a role
 * file loaded by Read, and the on-disk re-entry point is the task file. This
 * hook prints the newest open task file's path, its `## Summary` and its
 * `## Handoff` sections to stdout; Claude Code adds SessionStart stdout to
 * Claude's context (hooks reference, "Exit code 0", read 2026-10-19; the page
 * carries no "last updated" date and references Claude Code v2.1.296).
 *
 * Silent (exit 0, no output) when the repo has not opted in (no AGENTS.md
 * mentioning `.ai-memory`) or has no `.ai-memory/TASKS/`. Never blocks:
 * SessionStart cannot be blocked, and a failure here must not cost the session.
 */

import fs from "node:fs";
import path from "node:path";

const REENTRY_LINE =
  "Re-entry (AGENTS.md → Compaction / re-entry): re-read the task file Summary and the incoming role file before continuing.";
const SOURCES = new Set(["compact", "resume"]);
const SECTIONS = ["Summary", "Handoff"];

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    // existsSync: `.git` is a file in a linked worktree and still marks the root.
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function usesRoleLibrary(repoRoot) {
  const agentsMd = path.join(repoRoot, "AGENTS.md");
  if (!fs.existsSync(agentsMd)) return false;
  return fs.readFileSync(agentsMd, "utf8").includes(".ai-memory");
}

/** Newest open task file (archived ones live in a subdirectory and are skipped). */
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
    const mtimeMs = fs.statSync(abs).mtimeMs;
    if (!newest || mtimeMs > newest.mtimeMs) newest = { abs, mtimeMs };
  }
  return newest;
}

/** The `## <name>` section body up to the next heading, or null when absent. */
function section(text, name) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${name}\\b`).test(l));
  if (start === -1) return null;
  const body = [];
  for (let i = start + 1; i < lines.length && !/^#/.test(lines[i]); i++) body.push(lines[i]);
  return body.join("\n").trim();
}

function main() {
  const input = readStdin();
  // Registered on compact|resume; stay silent if wired to another source by mistake.
  if (input.source && !SOURCES.has(input.source)) return;

  const repoRoot = findRepoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!repoRoot || !usesRoleLibrary(repoRoot)) return;

  const taskFile = newestTaskFile(repoRoot);
  if (!taskFile) return;

  const text = fs.readFileSync(taskFile.abs, "utf8");
  const rel = path.relative(repoRoot, taskFile.abs).split(path.sep).join("/");
  const out = [REENTRY_LINE, `Task file: ${rel}`];
  for (const name of SECTIONS) {
    const body = section(text, name);
    out.push(`## ${name}`, body === null ? `(no \`## ${name}\` section in the task file)` : body);
  }
  process.stdout.write(out.join("\n") + "\n");
}

main();
