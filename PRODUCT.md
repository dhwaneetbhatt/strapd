# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers who work primarily in a terminal and need fast, repeatable ways to complete small utility tasks. The webapp is a complementary, quick-access interface for the same users when a browser is more convenient.

## Product Purpose

strapd consolidates common developer utilities—such as string manipulation, data formatting, encoding, identifiers, security operations, random generation, and date/time conversion—into a fast local toolkit. It focuses on the common 80% of repetitive developer problems: quick transformations, inspections, formatting, and validation. Success means developers can complete these routine micro-tasks without hunting for separate websites, remembering fragmented command syntaxes, or writing throwaway scripts.

## Positioning

A single offline utility belt with feature parity between its Rust CLI and browser webapp: users can choose terminal or web access without giving up core commands or capabilities. strapd complements heavyweight Unix tools rather than trying to replace them, making common approachable tasks clearer and more consistent.

## Operating Context

Users work locally in terminal pipelines, scripts, CI jobs, REPL-like workflows, or a browser, often moving between development tasks that require quick conversions, formatting, generation, validation, or analysis. The CLI supports stdin-based workflows; the webapp exposes the same core logic through WebAssembly.

## Capabilities and Constraints

- The Rust core is shared by the CLI and WASM-backed webapp to maintain feature parity.
- All core utility operations work offline.
- User input is never logged and the product collects no telemetry.
- The product supports its intended CLI platforms and browser-accessible webapp.
- Keyboard accessibility and keyboard-first fast access are product requirements.
- Commands should be predictable, composable with pipes, and emit clean script-friendly output while respecting exit codes.
- Defaults should be sensible, human-readable, and safe; risky operations require explicit opt-in.
- Features must remain focused on frequent, easy-to-explain developer tasks rather than duplicating mature heavyweight tools or expanding into deep domain-specific complexity.

## Brand Commitments

The name “strapd” evokes a developer utility belt. Its voice is reliable, offline-first, and focused on automating boring micro-tasks.

## Evidence on Hand

- The feature set and product rationale are documented in `README.md`.
- Shared CLI, core, and WASM architecture is implemented under `crates/`.
- The browser interface and keyboard shortcut configuration are implemented under `webapp/src/`.
- No testimonials, customer stories, or external performance benchmarks are present in the repository; future work must not fabricate them.

## Product Principles

1. Optimize for daily use: prioritize repetitive developer tasks that save time, avoid context switching, or replace scratch scripts.
2. Prefer a smaller, learn-once consistent interface over fragmented completeness.
3. Preserve parity: terminal and web workflows expose the same core utility capabilities.
4. Keep routine tasks local, fast, composable, and safe by default.
5. Protect user input through zero logging and zero telemetry while keeping frequent actions keyboard-accessible and low-friction.

## Accessibility & Inclusion

Keyboard accessibility is required so developers can access frequent actions quickly without relying only on pointer input.
