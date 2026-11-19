# Standards: lint baselines

Starting lint and analyzer configurations for the owner's coding standards, one folder per stack. They are the deterministic half of the rules in `AGENTS.md`: what a tool can check is checked by the tool, on every build, at no token cost.

| Stack | Files | Tool | Tested |
|---|---|---|---|
| Python | `python/ruff.toml` | Ruff | 2026-11-19, Ruff 0.16.9: a sample with eight violations was flagged, a clean sample passed |
| TypeScript | `typescript/eslint.config.mjs` | ESLint with typescript-eslint | 2026-11-19, ESLint 10.15.0, typescript-eslint 8.73.0, TypeScript 6.0.3: a sample with twelve violations was flagged, a clean sample passed |
| C# | `dotnet/.editorconfig`, `dotnet/Directory.Build.props` | .NET SDK analyzers | not yet run: no .NET SDK was available where it was written. `AnalysisLevel` is pinned to 9.0; set it to the SDK in use. |

How they are used (`EngineeringTeam/_shared/rules-detail.md` → Static analysis first):

- A repository's own lint configuration comes first. A baseline is offered only where the repository has none for that tool in any place the tool reads, and it is copied in on the owner's yes, never silently and never merged over an existing one.
- The owner's yes to a baseline is not a yes to its packages: the linter and each plugin (`ruff`; `eslint`, `typescript-eslint`, `typescript`) is its own ask-first dependency. Install exactly the versions in the Tested column, or record the version chosen. Run them from the installed, pinned dependency, never through a runner that downloads on demand.
- A lint configuration can be executable code (the ESLint one is). A change to one is read before the tool is run on it.
- A baseline is a start. Each repository grows its own rules from the corrections made in it.
- A rule is never switched off to get a build green. A rule that is wrong for a repository is changed with a recorded reason.

What a linter cannot check stays with the reviewers: whether a hardcoded message should be a constant, whether a design is the simplest one, whether a name says what the thing is.
