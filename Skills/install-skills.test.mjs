/**
 * Tests for Skills/install-skills.mjs.
 * Run (from the library root): node --test "Skills/*.test.mjs"
 *
 * Self-contained: node:test + node:child_process, no dependencies, no network.
 * Each test builds a local bare git repository in a temp directory and uses it
 * as the skill source through a `file:` URL, which the installer accepts only
 * while AGENTIC_SKILLS_TEST_ALLOW_FILE_URL=1 is set (set here, never in use).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSTALLER = path.join(HERE, "install-skills.mjs");
const MARKER = ".agentic-skill.json";
const FILE_URL_ENV = "AGENTIC_SKILLS_TEST_ALLOW_FILE_URL";
const MISSING_SHA = "0123456789abcdef0123456789abcdef01234567";

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.invalid",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.invalid",
  GIT_TERMINAL_PROMPT: "0",
};

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, env: GIT_ENV, encoding: "utf8" }).trim();
}

function write(root, relative, content) {
  const file = path.join(root, ...relative.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/**
 * A sandbox with a bare source repository holding two commits of a skill at
 * skills/demo/, plus an empty target folder and a manifest directory.
 */
function makeSandbox(t, extraWork) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "skills-test-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 }));
  const work = path.join(root, "work");
  const bare = path.join(root, "source.git");
  const target = path.join(root, "target");
  const manifestDir = path.join(root, "manifest");
  fs.mkdirSync(work);
  fs.mkdirSync(target);
  fs.mkdirSync(path.join(manifestDir, "reviews"), { recursive: true });
  fs.writeFileSync(path.join(manifestDir, "reviews", "demo.md"), "# review\n");

  git(work, "init", "-q");
  write(work, "skills/demo/SKILL.md", "---\nname: demo\ndescription: v1\n---\n");
  write(work, "skills/demo/extra/notes.md", "notes\n");
  write(work, "outside.txt", "not part of the skill\n");
  write(work, "package.json", '{"scripts":{"postinstall":"node -e \\"require(\'fs\').writeFileSync(\'RAN\',\'1\')\\""}}\n');
  if (extraWork) extraWork(work);
  git(work, "add", "--", ".");
  git(work, "commit", "-q", "-m", "one");
  const first = git(work, "rev-parse", "HEAD");
  write(work, "skills/demo/SKILL.md", "---\nname: demo\ndescription: v2\n---\n");
  git(work, "add", "--", "skills/demo/SKILL.md");
  git(work, "commit", "-q", "-m", "two");
  const second = git(work, "rev-parse", "HEAD");
  git(root, "clone", "-q", "--bare", work, bare);
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");

  return { root, target, manifestDir, first, second, source: pathToFileURL(bare).href };
}

function entry(sandbox, overrides = {}) {
  return {
    name: "demo",
    area: "testing",
    source: sandbox.source,
    commit: sandbox.second,
    path: "skills/demo",
    license: "MIT",
    reviewed: "2026-11-18",
    review: "reviews/demo.md",
    hosts: ["any"],
    notes: "",
    ...overrides,
  };
}

function run(sandbox, skills, flags = [], env = {}) {
  const manifest = path.join(sandbox.manifestDir, "skills.manifest.json");
  fs.writeFileSync(manifest, JSON.stringify({ version: 1, skills }, null, 2));
  return spawnSync(process.execPath, [INSTALLER, "--manifest", manifest, "--target", sandbox.target, ...flags], {
    encoding: "utf8",
    env: { ...GIT_ENV, [FILE_URL_ENV]: "1", ...env },
  });
}

function snapshot(dir) {
  const out = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current).sort()) {
      const full = path.join(current, name);
      const stat = fs.lstatSync(full);
      out.push(`${path.relative(dir, full)}|${stat.isDirectory() ? "d" : stat.size}|${stat.mtimeMs}`);
      if (stat.isDirectory()) walk(full);
    }
  };
  walk(dir);
  return out;
}

test("fresh install copies only the skill path and writes the marker", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox)]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const dest = path.join(sandbox.target, "demo");
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v2/);
  assert.equal(fs.readFileSync(path.join(dest, "extra", "notes.md"), "utf8"), "notes\n");
  assert.deepEqual(fs.readdirSync(dest).sort(), [MARKER, "SKILL.md", "extra"]);
  const marker = JSON.parse(fs.readFileSync(path.join(dest, MARKER), "utf8"));
  assert.equal(marker.name, "demo");
  assert.equal(marker.source, sandbox.source);
  assert.equal(marker.commit, sandbox.second);
  assert.deepEqual(fs.readdirSync(sandbox.target), ["demo"], "no staging folder is left behind");
  assert.match(result.stdout, /1 installed/);
});

test("installs the pinned commit, not the branch head", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox, { commit: sandbox.first })]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(fs.readFileSync(path.join(sandbox.target, "demo", "SKILL.md"), "utf8"), /description: v1/);
});

test("second run skips a skill already at the pinned commit", (t) => {
  const sandbox = makeSandbox(t);
  assert.equal(run(sandbox, [entry(sandbox)]).status, 0);
  const before = snapshot(sandbox.target);
  const result = run(sandbox, [entry(sandbox)]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /0 installed, 0 updated, 1 already present/);
  assert.deepEqual(snapshot(sandbox.target), before);
});

test("a commit that is not in the source fails and installs nothing", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox, { commit: MISSING_SHA })]);
  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /FAILED/);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("one failing skill does not stop the others, and the exit code is non-zero", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox, { name: "broken", commit: MISSING_SHA }), entry(sandbox)]);
  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.deepEqual(fs.readdirSync(sandbox.target), ["demo"]);
});

test("manifest validation rejects traversal, unsafe names, bad shas and non-https sources", (t) => {
  const sandbox = makeSandbox(t);
  const bad = [
    { name: "../escape" },
    { name: "a/b" },
    { name: ".." },
    { name: "Demo" },
    { name: "nul" },
    { path: "../.." },
    { path: "skills/../../x" },
    { path: "/etc" },
    { path: "skills\\demo" },
    { path: ".git" },
    { commit: "main" },
    { commit: sandbox.second.slice(0, 12) },
    { commit: sandbox.second.toUpperCase() },
    { source: "http://example.invalid/x.git" },
    { source: "https://user:pw@example.invalid/x.git" },
    { source: "--upload-pack=touch x" },
    { source: "ssh://example.invalid/x.git" },
    { review: "../outside.md" },
    { review: "reviews/absent.md" },
    { reviewed: "yesterday" },
    { hosts: [] },
    { extra: true },
  ];
  for (const overrides of bad) {
    const result = run(sandbox, [entry(sandbox, overrides)]);
    assert.equal(result.status, 2, `${JSON.stringify(overrides)} -> ${result.status} ${result.stdout}`);
    assert.match(result.stderr, /Invalid manifest/);
  }
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
  assert.deepEqual(fs.readdirSync(sandbox.root).sort(), ["manifest", "source.git", "target", "work"]);
});

test("a file: source is rejected unless the test variable is set", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox)], [], { [FILE_URL_ENV]: "" });
  assert.equal(result.status, 2, result.stderr + result.stdout);
  assert.match(result.stderr, /"source" must be an https git URL/);
});

test("an existing folder without the marker is reported as a clash and left untouched", (t) => {
  const sandbox = makeSandbox(t);
  const own = path.join(sandbox.target, "demo");
  fs.mkdirSync(own);
  fs.writeFileSync(path.join(own, "SKILL.md"), "my own skill\n");
  const before = snapshot(sandbox.target);
  for (const flags of [[], ["--update"]]) {
    const result = run(sandbox, [entry(sandbox)], flags);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /name clash/);
    assert.deepEqual(snapshot(sandbox.target), before);
  }
  assert.equal(fs.readFileSync(path.join(own, "SKILL.md"), "utf8"), "my own skill\n");
});

test("a marker written by something else does not make the folder ours", (t) => {
  const sandbox = makeSandbox(t);
  const own = path.join(sandbox.target, "demo");
  fs.mkdirSync(own);
  fs.writeFileSync(path.join(own, MARKER), JSON.stringify({ name: "demo", commit: sandbox.first }));
  const before = snapshot(sandbox.target);
  const result = run(sandbox, [entry(sandbox)], ["--update"]);
  assert.match(result.stdout, /name clash/);
  assert.deepEqual(snapshot(sandbox.target), before);
});

test("--dry-run and --list change nothing", (t) => {
  const sandbox = makeSandbox(t);
  fs.rmdirSync(sandbox.target);
  for (const flag of ["--dry-run", "--list"]) {
    const result = run(sandbox, [entry(sandbox)], [flag]);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /would install/);
    assert.equal(fs.existsSync(sandbox.target), false, `${flag} must not create the target`);
  }
});

test("a different installed commit is reported, and replaced only with --update", (t) => {
  const sandbox = makeSandbox(t);
  assert.equal(run(sandbox, [entry(sandbox, { commit: sandbox.first })]).status, 0);
  const dest = path.join(sandbox.target, "demo");

  const reported = run(sandbox, [entry(sandbox)]);
  assert.equal(reported.status, 0, reported.stderr + reported.stdout);
  assert.match(reported.stdout, /installed at another commit/);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v1/);

  const dry = run(sandbox, [entry(sandbox)], ["--update", "--dry-run"]);
  assert.match(dry.stdout, /would update/);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v1/);

  const updated = run(sandbox, [entry(sandbox)], ["--update"]);
  assert.equal(updated.status, 0, updated.stderr + updated.stdout);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v2/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dest, MARKER), "utf8")).commit, sandbox.second);
  assert.deepEqual(fs.readdirSync(sandbox.target), ["demo"]);
});

test("a symlink that points outside the skill folder is refused", (t) => {
  let linked = true;
  const sandbox = makeSandbox(t, (work) => {
    try {
      fs.symlinkSync("../../outside.txt", path.join(work, "skills", "demo", "leak.txt"));
    } catch {
      linked = false;
    }
  });
  if (!linked) {
    t.skip("this platform or account cannot create symlinks");
    return;
  }
  const result = run(sandbox, [entry(sandbox)]);
  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /points outside the skill folder/);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("a symlink to a file inside the skill folder is copied as a plain file", (t) => {
  let linked = true;
  const sandbox = makeSandbox(t, (work) => {
    try {
      fs.symlinkSync("extra/notes.md", path.join(work, "skills", "demo", "alias.md"));
    } catch {
      linked = false;
    }
  });
  if (!linked) {
    t.skip("this platform or account cannot create symlinks");
    return;
  }
  const result = run(sandbox, [entry(sandbox)]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const alias = path.join(sandbox.target, "demo", "alias.md");
  assert.equal(fs.lstatSync(alias).isFile(), true);
  assert.equal(fs.readFileSync(alias, "utf8"), "notes\n");
});

test("a path with no SKILL.md fails", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox, { path: "skills/demo/extra" })]);
  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /holds no SKILL\.md/);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("nothing from the fetched repository is executed", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox, { path: "." })]);
  assert.equal(result.status, 1, "the repository root holds no SKILL.md");
  const again = run(sandbox, [entry(sandbox)]);
  assert.equal(again.status, 0, again.stderr + again.stdout);
  assert.equal(fs.existsSync(path.join(sandbox.target, "demo", "RAN")), false);
  assert.equal(fs.existsSync(path.join(sandbox.target, "demo", "package.json")), false);
});

test("an empty list is valid and installs nothing", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, []);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /nothing to install/);
});

test("unknown flags, including --only, are refused", (t) => {
  const sandbox = makeSandbox(t);
  const result = run(sandbox, [entry(sandbox)], ["--only", "demo"]);
  assert.equal(result.status, 2);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});
