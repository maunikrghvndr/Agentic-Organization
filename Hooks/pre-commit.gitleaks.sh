#!/bin/sh
# Secret gate: block any commit whose staged changes contain a secret (gitleaks).
# Optional overlay (Decision A, 2026-10-19); AGENTS.md "never commit secrets" is the contract, this hook enforces it.
# Fails closed: a missing scanner blocks the commit instead of silently passing.
#
# Install (one repo):   cp Hooks/pre-commit.gitleaks.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# Install (all repos):  mkdir -p ~/.githooks && cp Hooks/pre-commit.gitleaks.sh ~/.githooks/pre-commit \
#                       && chmod +x ~/.githooks/pre-commit && git config --global core.hooksPath ~/.githooks
# Scanner install and allowlisting: Settings/README.md -> "Secret gate".

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "pre-commit: gitleaks is not on PATH; commit blocked (install gitleaks, see Settings/README.md)" >&2
  exit 1
fi

gitleaks git --pre-commit --staged --redact
exit $?
