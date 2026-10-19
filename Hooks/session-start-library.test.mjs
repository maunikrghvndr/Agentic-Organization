#!/usr/bin/env node
/**
 * Tests for session-start-library.mjs. Run: node Hooks/session-start-library.test.mjs
 * No network: the clone case substitutes a fake `git` on PATH (POSIX only; skipped on Windows).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "session-start-library.mjs");

function makeRepo(pathLine) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "ssl-"));
  const repo = path.join(parent, "repo");
  fs.mkdirSync(repo);
  fs.writeFileSync(
    path.join(repo, "AGENTS.md"),
    `# Project Agent Instructions\n\nRole library root:\n\n\`\`\`text\n${pathLine}\n\`\`\`\n`
  );
  return { parent, repo };
}

function makeLibrary(root) {
  fs.mkdirSync(path.join(root, "EngineeringTeam"), { recursive: true });
  fs.writeFileSync(path.join(root, "EngineeringTeam", "planner.md"), "# Planner\n");
}

function runHook(repo, env) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ session_id: "t", cwd: repo, hook_event_name: "SessionStart", source: "startup" }),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_CODE_REMOTE: "", ...env },
  });
  return result;
}

test("local session (env unset): silent exit 0, nothing cloned", () => {
  const { parent, repo } = makeRepo("C:\\nowhere\\EngineeringTeam\\");
  const r = runHook(repo, {});
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.equal(fs.existsSync(path.join(parent, "Agentic-Organization")), false);
});

test("remote session, path line resolves: silent exit 0, nothing cloned", () => {
  const { parent, repo } = makeRepo("");
  const lib = path.join(parent, "existing-lib");
  makeLibrary(lib);
  fs.writeFileSync(
    path.join(repo, "AGENTS.md"),
    `\`\`\`text\n${path.join(lib, "EngineeringTeam")}${path.sep}\n\`\`\`\n`
  );
  const r = runHook(repo, { CLAUDE_CODE_REMOTE: "true" });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.equal(fs.existsSync(path.join(parent, "Agentic-Organization")), false);
});

test("remote session, sibling library already present: prints the root, no clone", () => {
  const { parent, repo } = makeRepo("C:\\nowhere\\EngineeringTeam\\");
  const sibling = path.join(parent, "Agentic-Organization");
  makeLibrary(sibling);
  const r = runHook(repo, { CLAUDE_CODE_REMOTE: "true", PATH: "" }); // no git available: must not be needed
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^Role library resolved for this remote session: /);
  assert.ok(r.stdout.includes(path.join(sibling, "EngineeringTeam")));
  assert.equal(r.stdout.trim().split("\n").length, 1);
});

test("remote session, path unresolved: clones depth 1 into ../Agentic-Organization", { skip: process.platform === "win32" }, () => {
  const { parent, repo } = makeRepo("C:\\nowhere\\EngineeringTeam\\");
  const binDir = path.join(parent, "fakebin");
  fs.mkdirSync(binDir);
  const log = path.join(parent, "git-args.log");
  const fakeGit = path.join(binDir, "git");
  fs.writeFileSync(
    fakeGit,
    `#!/bin/sh\nprintf '%s\\n' "$@" > "${log}"\ntarget="$5"\nmkdir -p "$target/EngineeringTeam" && echo "# Planner" > "$target/EngineeringTeam/planner.md"\n`
  );
  fs.chmodSync(fakeGit, 0o755);

  const r = runHook(repo, { CLAUDE_CODE_REMOTE: "true", PATH: `${binDir}:${process.env.PATH}` });
  assert.equal(r.status, 0);
  const args = fs.readFileSync(log, "utf8").trim().split("\n");
  assert.deepEqual(args, [
    "clone",
    "--depth",
    "1",
    "https://github.com/maunikrghvndr/Agentic-Organization",
    path.join(parent, "Agentic-Organization"),
  ]);
  assert.ok(r.stdout.includes(path.join(parent, "Agentic-Organization", "EngineeringTeam")));
});
