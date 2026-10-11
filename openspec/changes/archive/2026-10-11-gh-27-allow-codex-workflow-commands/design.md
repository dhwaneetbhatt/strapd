## Context

Codex project rules use command-prefix allowlists. The existing file permits build and read-only GitHub commands but not the routine write actions needed to deliver a feature branch.

## Goals / Non-Goals

**Goals:**
- Permit the normal branch-to-PR workflow without repeated approval.
- Keep permissions reviewable and local to this repository.

**Non-Goals:**
- Permit resets, branch deletion, merging, releases, or repository administration.

## Decisions

- Add separate rules for `git add`, `git commit`, branch creation, and non-force `git push` so intent is visible.
- Allow `git push` as a prefix because the policy language cannot reliably distinguish every placement of Git push flags; this matches the user's explicit trust in the PR gate.
- Permit common `gh pr` creation, editing, viewing, and checks, but omit merge, close, and review decisions.

## Risks / Trade-offs

- [Allowed commands can publish an accidental commit or force push] → PR review remains the integration gate; reset, branch deletion, merge, and release commands stay gated.
- [Prefix rules can be broader than intended] → Validate representative matches and non-matches with Codex's policy checker.
