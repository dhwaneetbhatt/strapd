# Contributor workflow

[README](../../README.md) describes the toolkit and feature set. [Usage](../usage.md) documents behavior and examples. Add separate user docs for substantial reference material such as coverage, limits, or performance.

## OpenSpec

Before implementation, clarify the requirements and create a change named `gh-<issue-number>-<short-kebab-case-description>`. Use the relevant [OpenSpec skills](../../.codex/skills/) for exploration, proposal, application, validation, spec sync, and archive. Apply the task list against the specs and design. Validate with `openspec validate <change> --strict`, then archive the completed change. Documentation-only edits and small routine chores such as version bumps, changelog updates, and release tagging need no change proposal or task list. Keep approval rules for archive, releases, and publication in the client.

## Tool integration

- Add domain logic to `crates/core/src/<category>/`. Follow the [Rust engineering rules](../../crates/AGENTS.md). Preserve offline operation, native/WASM parity, useful errors, and fast paths.
- Add clap arguments and the handler under `crates/cli/src/` and wire them in `main.rs`. Keep CLI input, output, and formatting at the adapter edge.
- Export browser operations under `crates/wasm/src/`. Follow the existing error convention of mapping fallible core results to the browser binding's error representation. Keep those bindings compatible when adding portable operations.
- Add new browser operations to the versioned [portable WIT contract](../../crates/wasm-portable/wit/tools.wit) and test the built artifacts. Use typed results and core errors. Follow the [portable WASM host and ownership contract](../usage.md#portable-wasm-library).
- Update `WasmModule` and `WasmWrapper` in `webapp/src/lib/wasm/index.ts`, the category utility and tool definition, and the React component and its export. Follow the [Base64 tool](../../webapp/src/components/tools/encoding/base64-tool.tsx) and the existing `ToolDefinition` pattern for IDs, aliases, and operations. Use `ToolResult` for errors, `useBaseTool` for state, and `useAutoProcess` for auto-processing where the tool uses that pattern. Verify Pipes when the tool is exposed there.
- For browser WASM issues, check the console and `webapp/wasm/` output, rebuild WASM, and compare the exports against `WasmModule`.

## Verification

Use the targets in [Makefile](../../Makefile) for lifecycle commands. Use `make` or the existing `rtk make` convention. Do not invoke `cargo`, `pnpm`, or `wasm-pack` directly in agent workflows. Run one-off diagnostics directly without adding a target for each.

- Keep Rust unit tests in sibling `tests.rs` files or a dedicated test tree and integration tests under each crate's `tests/` directory. Follow [rustfmt](../../.rustfmt.toml) and the Rust contract coverage guidance.
- Use the [Biome configuration](../../webapp/biome.json) for WebApp formatting and lint. Focused examples are `make rust-test TEST_ARGS='-p strapd-core --test json_sample'` and `make webapp-test TEST_ARGS='--run src/tools/json-sample.test.ts'`.
- Follow the required Rust format, lint, and test checks. After Rust changes run `make wasm-build`. For browser exposure also run `make webapp-test webapp-build`, and run `make portable-wasm-test` for a changed portable contract. `make portable-wasm-setup` prepares portable tooling and `make portable-wasm-package` packages local artifacts.
- For manual checks use `make cli-build` and `./target/debug/strapd <command>`, then `make webapp-dev` and check the affected flow at `http://localhost:5173/`. Use `make webapp-e2e` for covered browser flows.
- Before committing run `make rust-fmt-check` and `make webapp-lint`. The [pre-commit hook](../../scripts/pre-commit) runs `make fmt-check`, lint based on staged paths, and `make test` (Rust, WebApp, and browser). GitHub Actions remains the integration gate.

## Delegation and review

Keep requirements, production implementation, integration, and final review in the primary thread. Use the primary model for any delegated implementation. Assign cheaper roles only substantial, bounded testing, benchmarks, research, or exploration. Handle small lookups and edits directly. Group related work into one assignment and keep at most three subagents active.

Start a fresh child for a new assignment. Send the acceptance check, base commit or current diff, relevant evidence and artifact paths, deliverable, owned files, required skills, commands, and exclusions. Make writer ownership disjoint. Reuse evidence for the same inputs and environment and recheck it after relevant changes. Wait for completion notifications. Return commands, results, actionable failures, and file or artifact references. Keep raw logs and larger reports in local artifacts outside the commit and keep the parent context to the summary. The primary thread owns all Git mutations and destructive operations.

Before completing a substantial security or core logic change, request [independent correctness review](reviewer.md) in a fresh review context. The primary agent resolves and verifies the findings.

### Client routing

- **Codex** uses [project config](../../.codex/config.toml) and [role profiles](../../.codex/agents/). Unpinned roles inherit the primary model and reasoning effort in this repo's defaults. Choose a fresh child without history when the surface supports it. The researcher inherits the session sandbox and approvals. Use a read-only parent or separate read-only session when a read-only boundary is required. Rule-approved shell commands and connected tools retain their own permissions.
- **Claude Code** uses the shared root instructions on current versions with AGENTS discovery enabled. For bounded work use a fresh custom or built-in agent given the relevant role brief. The project has no Claude-specific routing defaults.
- **OpenCode** uses [V2 project config](../../opencode.jsonc) and [role profiles](../../.opencode/agents/). It starts custom children with fresh context. Use the pinned coder only when its model matches the primary model. The four Impeccable profiles use the skill's shipped role briefs, including the finish review and manual-edit contract.
- **Antigravity** uses [.agents profiles](../../.agents/agents/) and its [OpenSpec skill manifest](../../.agents/skills.json). Read scoped instructions explicitly when opening the repo root. The existing Impeccable hook needs an Antigravity event adapter to provide automatic feedback. For UI work, follow the Impeccable skill's on-demand checks and finish review while that wiring is unverified.
