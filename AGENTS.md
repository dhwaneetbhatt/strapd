# strapd

strapd is an offline developer toolkit. Rust core owns behavior shared by the CLI, browser WASM, typed portable WASM, WebApp, and Pipes. Keep observable behavior consistent wherever an operation is exposed. Favor small, clear interfaces and useful errors.

## Required workflow

- Use OpenSpec before any feature, fix, or other implementation change. Name changes `gh-<issue-number>-<short-description>`. Explore, propose, apply, validate, then archive. Documentation-only changes and small routine chores are exempt. See [the workflow guide](docs/agents/workflow.md#openspec).
- Use `make` for setup, build, format, lint, tests, and the dev server. Pass focused test arguments via `TEST_ARGS`. Use direct commands for one-off diagnostics. Keep Rust test bodies outside implementation files.
- Run `make wasm-build` after Rust changes. Verify affected CLI and browser flows. Add typed portable exports and artifact contract tests for new browser operations. Before committing, run `make rust-fmt-check` and `make webapp-lint` and honor the pre-commit checks.
- Keep Git mutations and destructive operations in the primary thread. Keep the existing client permissions and approval boundaries. Before completing a substantial security or core logic change, obtain an independent correctness review. The primary agent resolves findings and verifies the final result.
- Start bounded handoffs with fresh context and keep at most three subagents active. Use cheaper models only for substantial research, exploration, testing, or benchmarks. The primary thread owns requirements, implementation, integration, and final review. Any delegated production coding uses the primary model.
- Use `docker exec <container> psql ...` for Postgres. Find the container with `docker ps` if needed. LocalStack and Keycloak also run via `~/workspace/local_infra`.

## Read when relevant

- Read [the workflow guide](docs/agents/workflow.md) before delegating, reviewing, or changing application code. It maps the tool integration and verification commands.
- Read [the Rust engineering rules](crates/AGENTS.md) before working under `crates/`, including when the client starts at the repo root.
- Keep README an overview. Put shared CLI, WebApp, and Pipes examples in [the usage guide](docs/usage.md). Keep README and agent guidance current as features change.
