## Why

Routine work on an already gated feature branch currently pauses for repeated approval of staging, committing, pushing, branch creation, and PR authoring commands. Project-scoped permissions can remove that friction while retaining approval for destructive or release operations.

## What Changes

- Allow normal Git staging, commit, push, and feature-branch creation commands.
- Allow common GitHub PR authoring and inspection commands.
- Keep other destructive Git commands, PR merging/closing, releases, and repository administration approval-gated. Push flags remain covered by the explicit push permission.

## Capabilities

No product capability changes. This is project tooling configuration only, so specs are skipped.

## Impact

- Updates `.codex/rules/strapd.rules`.
- Changes Codex approval behavior only within this repository.
