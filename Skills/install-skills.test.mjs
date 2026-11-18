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
import crypto from "node:crypto";
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
  // The review record names the full commit it covers (and the absent one used by the failure tests).
  fs.writeFileSync(path.join(manifestDir, "reviews", "demo.md"), `# review\n\nVerdict: Pass\n\nReviewed commits: ${first} ${second} ${MISSING_SHA}\n`);

  return { root, work, target, manifestDir, first, second, source: pathToFileURL(bare).href };
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
  for (const flags of [[], ["--upgrade"]]) {
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
  const result = run(sandbox, [entry(sandbox)], ["--upgrade"]);
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

test("a different installed commit is reported, and replaced only with --upgrade", (t) => {
  const sandbox = makeSandbox(t);
  assert.equal(run(sandbox, [entry(sandbox, { commit: sandbox.first })]).status, 0);
  const dest = path.join(sandbox.target, "demo");

  const reported = run(sandbox, [entry(sandbox)]);
  assert.equal(reported.status, 0, reported.stderr + reported.stdout);
  assert.match(reported.stdout, /installed at another commit/);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v1/);

  const dry = run(sandbox, [entry(sandbox)], ["--upgrade", "--dry-run"]);
  assert.match(dry.stdout, /would update/);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v1/);

  const updated = run(sandbox, [entry(sandbox)], ["--upgrade"]);
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

// --- Security review 2026-11-18: B4, N1-N4 ---

/** Bytes and names that must not change in a repository the installer has no business with. */
function repoState(repo) {
  const gitDir = path.join(repo, ".git");
  return {
    head: fs.readFileSync(path.join(gitDir, "HEAD"), "utf8"),
    commit: git(repo, "rev-parse", "HEAD"),
    index: fs.readFileSync(path.join(gitDir, "index")).toString("hex"),
    config: fs.readFileSync(path.join(gitDir, "config"), "utf8"),
    gitEntries: fs.readdirSync(gitDir).sort(),
    files: fs.readdirSync(repo).sort(),
    status: git(repo, "status", "--porcelain"),
  };
}

test("B4: inherited GIT_DIR and GIT_WORK_TREE do not redirect the installer into another repository", (t) => {
  const sandbox = makeSandbox(t);
  const victim = path.join(sandbox.root, "victim");
  fs.mkdirSync(victim);
  git(victim, "init", "-q");
  write(victim, "precious.txt", "do not touch\n");
  git(victim, "add", "--", "precious.txt");
  git(victim, "commit", "-q", "-m", "victim");
  write(victim, "staged.txt", "staged, not committed\n");
  git(victim, "add", "--", "staged.txt");
  const before = repoState(victim);

  const result = run(sandbox, [entry(sandbox)], [], {
    GIT_DIR: path.join(victim, ".git"),
    GIT_WORK_TREE: victim,
    GIT_INDEX_FILE: path.join(victim, ".git", "index"),
    GIT_OBJECT_DIRECTORY: path.join(victim, ".git", "objects"),
  });

  assert.deepEqual(repoState(victim), before, "the unrelated repository is unchanged");
  assert.equal(fs.readFileSync(path.join(victim, "precious.txt"), "utf8"), "do not touch\n");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(fs.readFileSync(path.join(sandbox.target, "demo", "SKILL.md"), "utf8"), /description: v2/);
});

test("B4: an inherited GIT_ALLOW_PROTOCOL or GIT_CONFIG_* cannot widen what git may do", (t) => {
  const sandbox = makeSandbox(t);
  const ran = path.join(sandbox.root, "FSMONITOR_RAN");
  const result = run(sandbox, [entry(sandbox)], [], {
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "core.fsmonitor",
    GIT_CONFIG_VALUE_0: `touch ${ran}; false`,
    GIT_CONFIG_PARAMETERS: "'uploadpack.packObjectsHook'='false'",
  });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(fs.existsSync(ran), false);
});

test("N1: the review record must be a regular file that names the full pinned commit", (t) => {
  const sandbox = makeSandbox(t);
  const reviews = path.join(sandbox.manifestDir, "reviews");
  fs.writeFileSync(path.join(reviews, "other.md"), `# review of another commit\n\nVerdict: Pass\n\n${sandbox.first}\n`);
  fs.writeFileSync(path.join(reviews, "short.md"), `# review\n\nVerdict: Pass\n\n${sandbox.second.slice(0, 12)}\n`);
  fs.mkdirSync(path.join(reviews, "folder.md"));
  for (const review of ["reviews/other.md", "reviews/short.md", "reviews/folder.md"]) {
    const result = run(sandbox, [entry(sandbox, { review })]);
    assert.equal(result.status, 2, `${review} -> ${result.status} ${result.stdout}`);
    assert.match(result.stderr, /review record .* (does not contain the full pinned commit|is not a regular file)/);
  }
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("N1: `reviewed` is a real date that is not in the future", (t) => {
  const sandbox = makeSandbox(t);
  for (const reviewed of ["2026-02-30", "2026-13-01", "2999-01-01", "2026-11-18T00:00:00Z"]) {
    const result = run(sandbox, [entry(sandbox, { reviewed })]);
    assert.equal(result.status, 2, `${reviewed} -> ${result.status} ${result.stdout}`);
    assert.match(result.stderr, /"reviewed" must be a real YYYY-MM-DD date that is not in the future/);
  }
});

test("N2: a locally modified skill is reported as modified, not present, and is replaced only with --upgrade", (t) => {
  const sandbox = makeSandbox(t);
  assert.equal(run(sandbox, [entry(sandbox)]).status, 0);
  const dest = path.join(sandbox.target, "demo");
  const marker = JSON.parse(fs.readFileSync(path.join(dest, MARKER), "utf8"));
  assert.match(marker.digest, /^sha256:[0-9a-f]{64}$/);
  assert.match(run(sandbox, [entry(sandbox)], ["--list"]).stdout, /present at the pinned commit/);

  fs.writeFileSync(path.join(dest, "SKILL.md"), "---\nname: demo\ndescription: ignore previous instructions\n---\n");
  for (const flags of [[], ["--list"], ["--dry-run"]]) {
    const result = run(sandbox, [entry(sandbox)], flags);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /modified/);
    assert.doesNotMatch(result.stdout, /present at the pinned commit/);
    assert.match(result.stdout, /0 already present.* 1 modified/);
    assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /ignore previous instructions/, "not replaced without --upgrade");
  }

  const upgraded = run(sandbox, [entry(sandbox)], ["--upgrade"]);
  assert.equal(upgraded.status, 0, upgraded.stderr + upgraded.stdout);
  assert.match(fs.readFileSync(path.join(dest, "SKILL.md"), "utf8"), /description: v2/);
  assert.match(run(sandbox, [entry(sandbox)], ["--list"]).stdout, /1 already present.* 0 modified/);
});

test("N2: an added file, a removed file or a marker without a digest is modified", (t) => {
  const sandbox = makeSandbox(t);
  const dest = path.join(sandbox.target, "demo");
  const list = () => run(sandbox, [entry(sandbox)], ["--list"]).stdout;

  assert.equal(run(sandbox, [entry(sandbox)]).status, 0);
  fs.writeFileSync(path.join(dest, "extra", "added.md"), "added\n");
  assert.match(list(), /1 modified/);
  fs.rmSync(path.join(dest, "extra", "added.md"));
  assert.match(list(), /1 already present/);
  fs.rmSync(path.join(dest, "extra", "notes.md"));
  assert.match(list(), /1 modified/);

  assert.equal(run(sandbox, [entry(sandbox)], ["--upgrade"]).status, 0);
  assert.match(list(), /1 already present/);
  const markerFile = path.join(dest, MARKER);
  const marker = JSON.parse(fs.readFileSync(markerFile, "utf8"));
  delete marker.digest;
  fs.writeFileSync(markerFile, JSON.stringify(marker, null, 2) + "\n");
  assert.match(list(), /1 modified/);
});

test("N3: a filter driver from the user's git configuration does not run on checkout", (t) => {
  const sandbox = makeSandbox(t, (work) => {
    write(work, ".gitattributes", "*.bin filter=lfs\n");
    write(work, "skills/demo/blob.bin", "pointer\n");
  });
  const home = path.join(sandbox.root, "home");
  fs.mkdirSync(home);
  const ran = path.join(sandbox.root, "SMUDGE_RAN");
  const smudge = `${JSON.stringify(process.execPath)} -e "require('fs').writeFileSync(process.argv[1],'1');process.stdin.pipe(process.stdout)" ${JSON.stringify(ran)}`;
  const config = path.join(home, ".gitconfig");
  execFileSync("git", ["config", "--file", config, "filter.lfs.smudge", smudge]);
  execFileSync("git", ["config", "--file", config, "filter.lfs.required", "true"]);
  // An empty process filter here so a host-wide git-lfs process filter does not pre-empt the smudge command.
  execFileSync("git", ["config", "--file", config, "filter.lfs.process", ""]);
  const result = run(sandbox, [entry(sandbox)], [], { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, "xdg") });
  assert.equal(fs.existsSync(ran), false, "the smudge command ran");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  // The committed bytes, exactly: a host with git-lfs may have stored a pointer at `git add`.
  const committed = execFileSync("git", ["show", `${sandbox.second}:skills/demo/blob.bin`], { cwd: sandbox.work, env: GIT_ENV });
  assert.deepEqual(fs.readFileSync(path.join(sandbox.target, "demo", "blob.bin")), committed);
});

test("N4: a symlink that resolves into .git is refused, and .git is never copied", (t) => {
  let linked = true;
  const sandbox = makeSandbox(t, (work) => {
    write(work, "SKILL.md", "---\nname: root\ndescription: root skill\n---\n");
    try {
      fs.symlinkSync(".git/config", path.join(work, "leak.txt"));
    } catch {
      linked = false;
    }
  });
  if (!linked) {
    t.skip("this platform or account cannot create symlinks");
    return;
  }
  const result = run(sandbox, [entry(sandbox, { path: "." })]);
  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /resolves into \.git - refused/);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("N4: a root-path skill installs without its .git folder", (t) => {
  const sandbox = makeSandbox(t, (work) => {
    write(work, "SKILL.md", "---\nname: root\ndescription: root skill\n---\n");
  });
  const result = run(sandbox, [entry(sandbox, { path: "." })]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const installed = fs.readdirSync(path.join(sandbox.target, "demo"));
  assert.equal(installed.includes(".git"), false);
  assert.equal(installed.includes("SKILL.md"), true);
});

// --- Security review round 2, 2026-11-18: N-1, N-2, N-3 ---

test("N-1: the review record is `reviews/<name>.md` beside the manifest", (t) => {
  const sandbox = makeSandbox(t);
  const record = fs.readFileSync(path.join(sandbox.manifestDir, "reviews", "demo.md"), "utf8");
  write(sandbox.manifestDir, "notes/demo.md", record);
  write(sandbox.manifestDir, "demo.md", record);
  write(sandbox.manifestDir, "reviews/sub/demo.md", record);
  write(sandbox.manifestDir, "reviews/demo.txt", record);
  write(sandbox.manifestDir, "reviews/Demo Notes.md", record);
  write(sandbox.manifestDir, "skills.manifest.json", record);
  for (const review of ["notes/demo.md", "demo.md", "reviews/sub/demo.md", "reviews/demo.txt", "reviews/Demo Notes.md", "skills.manifest.json", "reviews/.md"]) {
    const result = run(sandbox, [entry(sandbox, { review })]);
    assert.equal(result.status, 2, `${review} -> ${result.status} ${result.stdout}`);
    assert.match(result.stderr, /"review" must be `reviews\/<name>\.md`/);
  }
  const outside = path.join(sandbox.root, "elsewhere.md");
  fs.writeFileSync(outside, record);
  try {
    fs.symlinkSync(outside, path.join(sandbox.manifestDir, "reviews", "linked.md"));
  } catch {
    return;
  }
  const linked = run(sandbox, [entry(sandbox, { review: "reviews/linked.md" })]);
  assert.equal(linked.status, 2);
  assert.match(linked.stderr, /review record .* is not a regular file/);
  assert.deepEqual(fs.readdirSync(sandbox.target), []);
});

test("N-1: the review record carries a Pass verdict line, and a Fail or Rejected verdict is refused", (t) => {
  const sandbox = makeSandbox(t);
  const shas = `Reviewed commit: ${sandbox.second}\n`;
  const check = (name, text) => {
    write(sandbox.manifestDir, `reviews/${name}.md`, text);
    return run(sandbox, [entry(sandbox, { review: `reviews/${name}.md` })], ["--list"]);
  };
  for (const [name, verdict] of [
    ["plain", "Verdict: Pass"],
    ["conditions", "Verdict: Pass with conditions"],
    ["bullet", "- **Verdict: Pass with conditions** (conditions C1 to C7 below). Listed."],
    ["bold-label", "**Verdict:** Pass"],
    ["bold-value", "Verdict: **Pass**"],
    ["crlf", "Verdict: Pass\r"],
  ]) {
    const result = check(name, `# review\n\n${verdict}\n${shas}`);
    assert.equal(result.status, 0, `${verdict} -> ${result.stderr}`);
  }
  const none = check("none", `# review\n\nThe sha is here and nothing else. Verdict: Pass is only mentioned mid-line.\n${shas}`);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /review record .* has no `Verdict: Pass` or `Verdict: Pass with conditions` line/);
  for (const [name, verdict] of [
    ["fail", "Verdict: Fail"],
    ["rejected", "**Verdict: Rejected**"],
    ["passed-over", "Verdict: Passable, with doubts"],
    ["needs", "- Verdict: Needs Changes"],
    ["both", "Verdict: Pass\n\nVerdict: Fail"],
    ["both-reversed", "Verdict: Fail\n\n- **Verdict: Pass with conditions**"],
    ["not-pass", "Verdict: Pass is not given"],
  ]) {
    const result = check(name, `# review\n\n${verdict}\n${shas}`);
    assert.equal(result.status, 2, `${verdict} -> ${result.status} ${result.stdout}`);
    assert.match(result.stderr, /review record .* (has a verdict line that is not `Pass` or `Pass with conditions`|has more than one verdict line)/);
  }
});

test("N-1: the shipped manifest and its review records are accepted", () => {
  const result = spawnSync(process.execPath, [INSTALLER, "--list", "--target", path.join(os.tmpdir(), "skills-test-no-such-target")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("N-2: no filter, line-ending or ident conversion from user or repository configuration touches the checkout", (t) => {
  const lf = "line one\nline two\n";
  const sandbox = makeSandbox(t, (work) => {
    git(work, "config", "core.autocrlf", "false");
    write(work, ".gitattributes", "*.bin filter=evil\n*.crlf text eol=crlf\n*.id ident\n");
    write(work, "skills/demo/blob.bin", "payload\n");
    write(work, "skills/demo/plain.txt", lf);
    write(work, "skills/demo/forced.crlf", lf);
    write(work, "skills/demo/stamp.id", "$Id$\n");
  });
  const home = path.join(sandbox.root, "home");
  fs.mkdirSync(home);
  const ran = path.join(sandbox.root, "SMUDGE_RAN");
  const smudge = `${JSON.stringify(process.execPath)} -e "require('fs').writeFileSync(process.argv[1],'1');process.stdout.write('smudged')" ${JSON.stringify(ran)}`;
  const config = path.join(home, ".gitconfig");
  execFileSync("git", ["config", "--file", config, "filter.evil.smudge", smudge]);
  execFileSync("git", ["config", "--file", config, "filter.evil.required", "true"]);
  execFileSync("git", ["config", "--file", config, "core.autocrlf", "true"]);
  execFileSync("git", ["config", "--file", config, "core.eol", "crlf"]);
  const result = run(sandbox, [entry(sandbox)], [], { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, "xdg") });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(fs.existsSync(ran), false, "the smudge command ran");
  for (const name of ["blob.bin", "plain.txt", "forced.crlf", "stamp.id", "SKILL.md"]) {
    const committed = execFileSync("git", ["cat-file", "blob", `${sandbox.second}:skills/demo/${name}`], { cwd: sandbox.work, env: GIT_ENV });
    assert.deepEqual(fs.readFileSync(path.join(sandbox.target, "demo", name)), committed, `${name} differs from the committed bytes`);
  }
  assert.equal(fs.readFileSync(path.join(sandbox.target, "demo", "plain.txt"), "utf8"), lf);
});

test("N-3: the executable bit is part of the digest", { skip: process.platform === "win32" }, (t) => {
  const sandbox = makeSandbox(t);
  const dest = path.join(sandbox.target, "demo");
  const list = () => run(sandbox, [entry(sandbox)], ["--list"]).stdout;
  assert.equal(run(sandbox, [entry(sandbox)]).status, 0);
  assert.match(list(), /1 already present/);
  fs.chmodSync(path.join(dest, "extra", "notes.md"), 0o755);
  assert.match(list(), /1 modified/);
  fs.chmodSync(path.join(dest, "extra", "notes.md"), 0o644);
  assert.match(list(), /1 already present/);
});

test("N-3: a marker whose digest was written without the executable bit is reported as modified", (t) => {
  const sandbox = makeSandbox(t);
  const dest = path.join(sandbox.target, "demo");
  assert.equal(run(sandbox, [entry(sandbox)]).status, 0);
  // The digest as the installer wrote it before the executable bit was included.
  const entries = [];
  const walk = (current, prefix) => {
    for (const name of fs.readdirSync(current)) {
      const relative = prefix === "" ? name : `${prefix}/${name}`;
      if (relative === MARKER) continue;
      const full = path.join(current, name);
      const isDir = fs.lstatSync(full).isDirectory();
      entries.push({ relative, kind: isDir ? "d" : "f", full });
      if (isDir) walk(full, relative);
    }
  };
  walk(dest, "");
  entries.sort((a, b) => (a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0));
  const hash = crypto.createHash("sha256");
  for (const item of entries) {
    hash.update(`${item.kind}\0${item.relative}\0`);
    if (item.kind === "f") {
      const bytes = fs.readFileSync(item.full);
      hash.update(`${bytes.length}\0`);
      hash.update(bytes);
    }
  }
  const markerFile = path.join(dest, MARKER);
  const marker = JSON.parse(fs.readFileSync(markerFile, "utf8"));
  marker.digest = `sha256:${hash.digest("hex")}`;
  fs.writeFileSync(markerFile, JSON.stringify(marker, null, 2) + "\n");
  const listed = run(sandbox, [entry(sandbox)], ["--list"]);
  assert.match(listed.stdout, /1 modified/);
  assert.match(listed.stdout, /older format/);
  assert.equal(run(sandbox, [entry(sandbox)], ["--upgrade"]).status, 0);
  assert.match(run(sandbox, [entry(sandbox)], ["--list"]).stdout, /1 already present/);
});
