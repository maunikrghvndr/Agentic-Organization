#!/usr/bin/env node
/**
 * SessionStart hook: make the role library resolvable in cloud / CI sessions.
 *
 * Cloud sessions clone only the repo, so the library path in AGENTS.md (a
 * local folder on the owner's machine) does not resolve and AGENTS.md falls
 * back to Universal Rules only. When CLAUDE_CODE_REMOTE=true and that path
 * does not resolve, this hook clones the library (depth 1) into a sibling
 * folder of the repo, `../Agentic-Organization`, and prints one line naming
 * the resolved library root so the AGENTS.md resolution step finds it.
 *
 * Silent exit 0 in every other case: local interactive sessions (env var not
 * set), a path line that already resolves, or a repo without AGENTS.md.
 * Never clones when the path resolves. Prints paths only, never git output.
 *
 * Docs checked 2026-10-19 (https://code.claude.com/docs/en/hooks, page shows
 * no last-updated date; references Claude Code v2.1.295):
 *   - CLAUDE_CODE_REMOTE is "true" in remote web environments, unset locally;
 *     cloud sessions do not read ~/.claude/settings.json, so the registration
 *     must live in the repo's .claude/settings.json (Sync-AgentsMd -WithCloudHook).
 *   - SessionStart stdin JSON: session_id, cwd, hook_event_name, source
 *     (startup|resume|clear|compact|fork). No field marks a session as
 *     non-interactive, so there is no stdin-based fallback to the env var.
 *   - Plain stdout on exit 0 is added as context Claude can see.
 *   - CLAUDE_PROJECT_DIR is exported to the hook process.
 *
 * Exit 0 always; a failed clone is reported on stderr (shown to the user).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LIBRARY_URL = "https://github.com/maunikrghvndr/Agentic-Organization";
// Pinned ref: move it deliberately (a tag is preferable once the library is tagged). The resolved sha is
// printed so the task file's Evidence can record which library revision the session obeyed.
const LIBRARY_REF = "main";
const LIBRARY_DIR_NAME = "Agentic-Organization";
const ROLE_DIR_NAME = "EngineeringTeam";
const PROBE_FILE = "planner.md"; // the file AGENTS.md step 1 tests for
const REMOTE_ENV = "CLAUDE_CODE_REMOTE";

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

/** Nearest ancestor (inclusive) that holds AGENTS.md, or null. */
function findAgentsRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, "AGENTS.md"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** The single line inside the first ```text fence of AGENTS.md, or null. */
function libraryPathLine(agentsMd) {
  const text = fs.readFileSync(agentsMd, "utf8");
  const m = /```text\r?\n([^\r\n`]+)\r?\n```/.exec(text);
  return m ? m[1].trim() : null;
}

/** True when the path line points at a folder that holds the probe file. */
function resolves(pathLine, repoRoot) {
  if (!pathLine) return false;
  const normalized = process.platform === "win32" ? pathLine : pathLine.replace(/\\/g, "/");
  return fs.existsSync(path.join(path.resolve(repoRoot, normalized), PROBE_FILE));
}

function main() {
  if (process.env[REMOTE_ENV] !== "true") return 0;

  const input = readStdin();
  const start = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const repoRoot = findAgentsRoot(start);
  if (!repoRoot) return 0;

  if (resolves(libraryPathLine(path.join(repoRoot, "AGENTS.md")), repoRoot)) return 0;

  const libraryRoot = path.resolve(repoRoot, "..", LIBRARY_DIR_NAME);
  const roleRoot = path.join(libraryRoot, ROLE_DIR_NAME);

  if (!fs.existsSync(path.join(roleRoot, PROBE_FILE))) {
    try {
      execFileSync("git", ["clone", "--depth", "1", "--branch", LIBRARY_REF, LIBRARY_URL, libraryRoot], {
        stdio: ["ignore", "ignore", "ignore"],
      });
    } catch (err) {
      const status = err && typeof err.status === "number" ? err.status : "unknown";
      process.stderr.write(
        `session-start-library: git clone into ${libraryRoot} failed (exit ${status}); ` +
          `AGENTS.md falls back to Universal Rules only.\n`
      );
      return 0;
    }
  }

  if (!fs.existsSync(path.join(roleRoot, PROBE_FILE))) {
    process.stderr.write(`session-start-library: ${libraryRoot} exists but is not the role library; nothing resolved.\n`);
    return 0;
  }
  let sha = "unknown";
  try {
    sha = execFileSync("git", ["-C", libraryRoot, "rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    // not a git checkout (e.g. a copied folder): report unknown, still usable
  }
  process.stdout.write(
    `Role library resolved for this remote session: ${roleRoot} (revision ${sha}) ` +
      `(the AGENTS.md path line does not resolve here; load role files from this folder and ` +
      `LESSONS.md from ${libraryRoot}; do not edit the AGENTS.md path line).\n`
  );
  return 0;
}

process.exit(main());
