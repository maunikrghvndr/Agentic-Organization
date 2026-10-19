/**
 * Tests for Hooks/handoff-check.mjs (and a smoke test for session-reentry.mjs).
 * Run (from the library root): node --test "Hooks/*.test.mjs"
 * (Node 22 takes files or glob patterns, not a bare directory.)
 *
 * Self-contained: node:test + node:child_process, no dependencies. Each test
 * builds a throwaway git repo that has opted in (AGENTS.md mentions .ai-memory)
 * and drives the hook the way Claude Code does — JSON on stdin, exit code and
 * stderr out (hooks reference read 2026-10-19).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOK = path.join(HERE, "handoff-check.mjs");
const REENTRY = path.join(HERE, "session-reentry.mjs");

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.invalid",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.invalid",
};
// The hook falls back to CLAUDE_PROJECT_DIR; a test run inside a Claude session
// must not leak the real project into the temp repo.
delete GIT_ENV.CLAUDE_PROJECT_DIR;

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, env: GIT_ENV, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-check-"));
  const repo = path.join(root, "repo");
  fs.mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# Agents\nUse `.ai-memory/` in this repository.\n");
  git(repo, "add", "AGENTS.md");
  git(repo, "commit", "-q", "-m", "init");
  return repo;
}

function run(script, cwd, input) {
  const res = spawnSync(process.execPath, [script], {
    cwd,
    env: GIT_ENV,
    input: JSON.stringify({ session_id: "s1", hook_event_name: "Stop", cwd, ...input }),
    encoding: "utf8",
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}

function touchAt(file, secondsFromNow) {
  const t = new Date(Date.now() + secondsFromNow * 1000);
  fs.utimesSync(file, t, t);
}

function writeSource(repo, rel = "src/app.js") {
  const abs = path.join(repo, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, "export const x = 1;\n");
  touchAt(abs, -60);
  return abs;
}

const GOOD_TASK_FILE =
  "# Task\n\n## Summary\n- Goal: demo\n\n## Evidence\n- `node --test` | hooks | 0 | uncommitted |\n\n## Handoff\n- Next role: done\n";

function writeTaskFile(repo, text, name = "demo.md") {
  const dir = path.join(repo, ".ai-memory", "TASKS");
  fs.mkdirSync(dir, { recursive: true });
  const abs = path.join(dir, name);
  fs.writeFileSync(abs, text);
  touchAt(abs, 0);
  return abs;
}

test("(i) no changes -> exit 0", () => {
  const repo = makeRepo();
  const r = run(HOOK, repo, {});
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stderr, "");
});

test("(ii) source change + no task file -> exit 2 with the reason on stderr", () => {
  const repo = makeRepo();
  writeSource(repo);
  const r = run(HOOK, repo, {});
  assert.equal(r.code, 2);
  assert.match(r.stderr, /No task memory file exists/);
  assert.match(r.stderr, /src\/app\.js/);
  assert.equal(JSON.parse(r.stdout).decision, "block");
});

test("(iii) source change + task file with ## Handoff and an Evidence row, newer than the change -> exit 0", () => {
  const repo = makeRepo();
  writeSource(repo);
  writeTaskFile(repo, GOOD_TASK_FILE);
  const r = run(HOOK, repo, {});
  assert.equal(r.code, 0, r.stderr);
});

test("task file missing ## Handoff or an Evidence row -> exit 2 naming the condition", () => {
  const repo = makeRepo();
  writeSource(repo);
  writeTaskFile(repo, "# Task\n\n## Evidence\n- `cmd` | all | 0 | abc |\n");
  let r = run(HOOK, repo, {});
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no `## Handoff` section/);
  assert.doesNotMatch(r.stderr, /no Evidence row/);

  writeTaskFile(repo, "# Task\n\n## Evidence\n- Not run: tests — no runner\n\n## Handoff\n- Next role: qa\n");
  r = run(HOOK, repo, {});
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no Evidence row/);
  assert.doesNotMatch(r.stderr, /no `## Handoff` section/);
});

test("task file older than the change -> exit 2 naming the condition", () => {
  const repo = makeRepo();
  const taskFile = writeTaskFile(repo, GOOD_TASK_FILE);
  touchAt(taskFile, -120);
  writeSource(repo);
  const r = run(HOOK, repo, {});
  assert.equal(r.code, 2);
  assert.match(r.stderr, /is older than the code you changed/);
});

test("(iv) prose-only change -> exit 0", () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, "README.md"), "# readme\n");
  fs.writeFileSync(path.join(repo, "CHANGELOG"), "v1\n");
  fs.writeFileSync(path.join(repo, "notes.txt"), "x\n");
  const r = run(HOOK, repo, {});
  assert.equal(r.code, 0, r.stderr);
});

test("(v) stop_hook_active true -> exit 0 even when the check would fail", () => {
  const repo = makeRepo();
  writeSource(repo);
  const r = run(HOOK, repo, { stop_hook_active: true });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stderr, "");
});

test("(vi) runs inside a linked worktree (.git is a file) without throwing", () => {
  const repo = makeRepo();
  const wt = path.join(path.dirname(repo), "wt");
  git(repo, "worktree", "add", "-q", "-b", "wt", wt);
  assert.ok(fs.statSync(path.join(wt, ".git")).isFile(), ".git should be a file in the worktree");

  writeSource(wt);
  const r = run(HOOK, wt, {});
  assert.equal(r.code, 2, r.stderr);
  assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/, "stack trace on stderr");
  assert.match(r.stderr, /src\/app\.js/);

  writeTaskFile(wt, GOOD_TASK_FILE);
  assert.equal(run(HOOK, wt, {}).code, 0);
});

test("repo without the AGENTS.md opt-in -> exit 0", () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# Agents\nno memory here\n");
  writeSource(repo);
  assert.equal(run(HOOK, repo, {}).code, 0);
});

test("session-reentry prints the newest task file's Summary and Handoff on compact; silent otherwise", () => {
  const repo = makeRepo();
  let r = run(REENTRY, repo, { hook_event_name: "SessionStart", source: "compact" });
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "", "no TASKS dir -> silent");

  writeTaskFile(repo, "# Old\n\n## Summary\n- old\n\n## Handoff\n- old\n", "old.md");
  const newest = writeTaskFile(repo, GOOD_TASK_FILE, "new.md");
  touchAt(newest, 5);
  r = run(REENTRY, repo, { hook_event_name: "SessionStart", source: "compact" });
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^Re-entry \(AGENTS\.md → Compaction \/ re-entry\)/);
  assert.match(r.stdout, /Task file: \.ai-memory\/TASKS\/new\.md/);
  assert.match(r.stdout, /## Summary\n- Goal: demo/);
  assert.match(r.stdout, /## Handoff\n- Next role: done/);
  assert.doesNotMatch(r.stdout, /- `node --test`/, "Evidence section must not be printed");

  r = run(REENTRY, repo, { hook_event_name: "SessionStart", source: "startup" });
  assert.equal(r.stdout, "", "startup source -> silent");
});
