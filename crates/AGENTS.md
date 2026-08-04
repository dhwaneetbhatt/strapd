# Rust Engineering Guidelines

These instructions apply to all Rust code under `crates/`.

## Design Priorities

Write Rust that is clear, deliberate, and efficient enough for a frequently used
developer tool.

Optimize for:

1. Correctness and explicit behavior.
2. Small, explainable interfaces.
3. Clear ownership and data flow.
4. Avoiding obvious wasted work.
5. Maintainability across native and WASM targets.

Do not trade clarity for speculative micro-optimizations. Do not ignore obvious
costs such as repeated parsing, allocation inside loops, unnecessary cloning, or
holding large values longer than needed.

## Architecture

`strapd-core` owns domain behavior. CLI and WASM code adapt interface-specific
inputs and outputs to the core.

Keep the normal flow explicit:

```text
input → parse → validate → execute → format
```

Use separate stages when they represent distinct responsibilities or can fail
independently. Do not combine parsing, business rules, formatting, and interface
presentation in one function.

- Core modules must not depend on clap, terminal behavior, JavaScript, or React.
- CLI handlers should collect input, call core operations, and select output.
- WASM exports should call coarse core operations and map errors at the boundary.
- Do not duplicate domain rules in CLI handlers or TypeScript.
- Keep module visibility as narrow as possible.
- Do not add unused extension points or abstractions for hypothetical features.

## Functions and Types

Prefer small functions that perform one meaningful operation and compose into the
larger workflow.

- Use descriptive domain names rather than generic names such as `data`, `item`,
  `process`, or `handle` inside the core.
- Prefer early returns for invalid input and exceptional branches.
- Use exhaustive `match` expressions when behavior depends on domain state.
- Extract helpers when they name a real step, isolate an invariant, or remove
  meaningful duplication.
- Introduce generics only when the same behavior genuinely applies to multiple
  types.
- Use structs and enums when fields or states carry distinct semantics.
- Do not introduce a type solely to wrap one primitive without adding an
  invariant or domain distinction.
- Derive `Copy` for small value types when copying is their natural semantic.
- Borrow larger values and collections unless ownership transfer is intentional.
- Every parameter and enum variant must affect behavior. Remove unused code.

## Ownership and Allocation

Choose interfaces that permit efficient callers without complicating ownership.

- Accept `&str` instead of `&String`.
- Accept `&[T]` instead of `&Vec<T>`.
- Return owned values when the function constructs a new result.
- Clone only where ownership must cross a boundary or the result must outlive the
  source.
- Do not clone a large string, byte buffer, JSON value, or collection merely to
  satisfy a temporary borrow.
- Keep borrows scoped to the work that needs them.
- Do not create long-lived references or complex lifetime relationships solely
  to avoid a small, justified boundary allocation.
- Consume owned inputs when doing so eliminates a substantial clone and leaves
  the API clearer.

When output size is reasonably predictable, use `String::with_capacity` or
`Vec::with_capacity`. Do not add brittle capacity arithmetic for negligible
benefit.

## Performance Discipline

Avoid obvious algorithmic and allocation problems before considering low-level
optimization.

- Perform invariant work once, outside loops.
- Do not repeatedly parse, normalize, encode, hash, allocate, or perform registry
  lookup inside a loop when the result can be reused.
- Do not convert values to formatted strings and parse them back when a typed
  operation is available.
- Prefer a single pass over input when it remains clear.
- Avoid collecting an iterator solely to iterate it again.
- Reuse buffers where repeated encoding or formatting makes that useful.
- Use constants for static data.
- Use `OnceLock` or equivalent for derived immutable registries whose construction
  would otherwise repeat.
- Prefer linear algorithms for input-sized work unless the input is explicitly
  small and bounded.
- Consider overflow when calculating capacities, timestamps, counts, and lengths.
- Do not add `#[inline]`, unsafe code, custom allocators, or specialized data
  structures without a concrete reason.
- Benchmark before adopting an optimization that makes the code materially harder
  to understand.

“Zero allocation” and “zero copy” are not goals by themselves. Avoid waste while
keeping ownership and behavior obvious.

## Error Handling

External input is fallible. Invalid input must not panic.

- Return `Result` for parsing, validation, conversion, cryptographic, serialization,
  and environment failures.
- Use a domain error enum when callers must distinguish failure categories or map
  them consistently across CLI and WASM.
- A simple leaf utility may return a string error when no caller needs structured
  matching.
- Preserve the underlying cause when adding context.
- Make errors identify the failed field, segment, operation, or constraint.
- Core errors must not add presentation prefixes such as `Error:`.
- Translate core errors into CLI or `JsValue` presentation only at the adapter
  boundary.
- Do not expose secrets in errors.
- Avoid `unwrap`, `expect`, and indexing on user-controlled data.
- `unwrap` is acceptable only for an invariant established immediately above it
  and obvious to a reviewer. Prefer expressing the invariant through control flow
  when practical.
- Tests may use `unwrap` when success is the behavior being asserted.

## Comments and Documentation

Code structure and naming should carry the explanation.

Use comments for:

- Non-obvious invariants.
- Compatibility constraints.
- Security reasoning.
- Algorithmic choices.
- Why an apparently simpler approach is incorrect.
- Intentional performance decisions.

Do not narrate straightforward statements or repeat function names in comments.
Public documentation should explain observable behavior, not implementation
history.

## CLI Adapters

Keep clap definitions declarative and handlers thin.

- Represent mutually exclusive or required arguments through clap constraints
  where possible.
- Use shared input helpers for positional and stdin behavior.
- Detect terminal stdin before attempting an optional piped read.
- Keep successful machine-consumable stdout free of explanatory text.
- Route failures through the existing stderr and non-zero exit path.
- Do not print secrets or include them in generated commands without an explicit,
  documented user action.

## WASM Adapters

WASM exports must preserve core semantics.

- Accept borrowed strings and slices where the binding permits.
- Do not allocate an intermediate `Vec` merely to pass `str::as_bytes()` to core.
- Prefer one coarse core call per user operation over reconstructing workflows in
  JavaScript.
- Serialize typed results once at the boundary.
- Use the shared WASM error conversion path.
- Keep native and WASM behavior covered by the same core tests.

## Testing

Tests should describe contracts, boundaries, and regressions.

For each capability, cover:

- The primary successful path.
- Empty and missing input.
- Boundary values.
- Invalid structure and invalid values.
- Unicode or binary behavior where relevant.
- Every meaningful enum branch.
- Stable output formatting.
- Error category and useful context.
- Regression cases for previously observed failures.

Use fixed clocks, known cryptographic vectors, or injected dependencies when
ambient state would make a test nondeterministic. Random generators should be
tested through properties and invariants rather than exact output.

Test core behavior in `strapd-core`. Add CLI tests for argument parsing, stdin,
stdout, stderr, aliases, and exit behavior. Adapter tests should not duplicate
every core permutation.

## Dependencies and Compatibility

Before adding a dependency:

- Confirm existing dependencies or standard-library functionality do not already
  cover the requirement clearly.
- Check native and `wasm32` compatibility.
- Consider binary size and transitive maintenance cost.
- Enable only required features.
- Keep dependency-specific types behind the core domain interface when practical.

## Required Verification

For Rust changes, run:

```bash
rtk make rust-fmt-check
rtk make rust-lint
rtk make rust-test
```

When core behavior is exposed through WASM, also run:

```bash
rtk make wasm-build
rtk make webapp-test
rtk make webapp-build
```

Treat warnings as errors. Do not suppress a lint without documenting why the lint
is incorrect for the specific code.
