## Context

See proposal.md for motivation and specs/secret-sanitization/spec.md for the behavior contract. Core already owns business logic and has base64/serde_json; CLI `required_text` preserves arguments/stdin, while `main` adds an output newline. WebApp tool definitions declare sensitive input exclusions and versioned Pipes contracts. Tool operations are synchronous WASM calls and the shared auto-processing hook defaults to 300 ms.

## Goals / Non-Goals

**Goals:** Explainable detection rules with explicit category ownership; complete sensitive spans; identical native/WASM behavior; readable selection; measured low startup and processing cost.

**Non-Goals:** Credential validity checks, entropy-based guessing, network services, exhaustive provider catalogs, binary key parsing, recursive decoding of arbitrary base64 blobs, a general source-code parser, and automatic redaction of personally identifying data. Specialized Oracle and Go MySQL DSNs are outside the documented initial connection-string formats.

## Decisions

### Shared category model and simple adapters

Core exposes a small category enum and compact selection type with `all`, `none`, and category inclusion. CLI uses flattened declarative booleans and resolves omission to all; clap rejects `--all` with selected flags. WASM accepts a category mask and returns a string through the normal wrapper. WebApp uses eight booleans matching the core mask, with all enabled by default. An empty explicit mask means identity, avoiding a surprising default reset when users deselect everything. A provider credential's API-key rule remains usable inside a deselected header/container; disabling auth only prevents auth's broad redaction rule.

### Scan original text and render once

Use focused scanners for assignments/headers, URI/connection-string boundaries, private-key blocks, JWK objects, and distinctive standalone candidates. Each returns original byte ranges with a category placeholder; ranges are merged with deterministic enclosing-match precedence and rendered in one output allocation. Return borrowed input when there are no matches. Do not repeatedly replace whole strings or parse/reserialize whole documents. Scanner progress must be monotonic; unmatched containers consume their enclosing range so repeated openings cannot trigger suffix rescans. UTF-8 slicing occurs only at established boundaries.

Alternatives: A giant copied detector regex catalog adds cold compilation, historical-length assumptions, and broad false positives; whole JSON/YAML parsing changes surrounding text and misses mixed logs. A service-backed verifier violates offline behavior. Start with standard-library scanners and existing dependencies; use additional matching crates only if benchmarks justify them.

### Field and container boundaries

Normalize field names into ASCII semantic segments without matching innocent substrings. Match exact secret names or provider-prefixed suffixes; metadata suffixes such as `_path`, `_id`, `_length`, `_count`, and `_name` are excluded unless the complete label explicitly denotes a credential component (AWS access-key ID). Use enclosing quoting/header/query/DSN context to consume values. Headers recognize colon/assignment forms and JSON quoted values; curl headers respect their surrounding quote. Set-Cookie masks its first pair while Cookie masks every pair. Empty values and complete sanitizer placeholders are no-ops.

Dotted/indexed application configuration uses the same semantic suffix rules: `accessKey` is an API key, `webhookSecret` is a signing key, and `appSecret` or a scoped `secret` segment is a token-category credential. Specific cryptographic suffixes take precedence over generic secret labels. Salts and key versions remain public metadata. Keep this refinement within the existing scanner; do not infer secrets from entropy or add application-specific property names.

Database URI scanners preserve original spans rather than decode/reserialize URLs, support known scheme bases with driver suffixes, and recognize credential parameters only in database context. SQL Server braced values recognize doubled closing braces. Recognized libpq/SQL Server connection strings enable contextual username redaction; generic ordinary `user`/`username` fields remain public.

Private-key blocks consume complete matching BEGIN/END containers, including escaped newlines in JSON values, and redact truncated containers conservatively. JWK recognition uses local object structure and original member spans (including duplicates) with `kty` context; avoid converting maps back into text. Secret RSA other-prime subtrees can be replaced with a JSON-compatible placeholder value; other key values retain their surrounding string quotes.

### Provider recognition and bounded structural token checks

Maintain a small readable family table for GitHub, GitLab, Slack, Stripe, OpenAI, Anthropic, npm, SendGrid, Google, and AWS ID candidates. Require distinctive prefixes, compatible alphabets, semantic boundaries, and a plausible minimum shape, then consume the entire candidate. Handle evolving forms explicitly: GitHub `ghs_APPID_JWT`, GitLab routable suffixes, Slack `xoxe.*`/`xwfp-`, Stripe `sk_org_`, and age PQ identities. No exact historical maximum can expose credential tails. Legacy OpenAI keys require their distinctive marker; arbitrary `sk-` strings are not presumed secrets.

For compact JWS/JWE candidates, check segment counts and locally decode only the protected header with existing base64/JSON support, requiring the relevant algorithm fields. Do not validate signatures or time. Bound structural work to candidate size and avoid decoding arbitrary ordinary text. Signed-URL recognition examines original query names within AWS/Azure signature context, percent-decodes names only when needed, and preserves ordinary parameters.

### WebApp integration

Use the incumbent Operate tool layout and typography: input/output panes, compact accessible category checkboxes, an all-categories control, copy/clear actions, and short pattern-coverage copy. Register under Security with `sensitiveInputs: ["text"]`. Shared category metadata drives UI controls and pipe boolean configuration to avoid drift. Pipes config defaults all booleans true; `result` is the canonical output. Use a short tool-specific auto-process delay and no delay in the operation itself. Literal output beginning `Error:` is valid text and must not be classified as a WASM failure.

### Verification and performance

Add broad core fixtures for every category, disabled-category isolation, overlap/idempotence, Unicode/CRLF, short/escaped values, truncated containers, repeated near-matches, and duplicate JSON members. CLI tests cover flags/conflicts/aliases/stdin/argument precedence/exact content/errors. Run real generated WASM over shared fixtures, not only mock-wrapper tests. WebApp tests cover category controls, URL exclusion, discovery, Pipes freeze/import/export, and failures. Browser verification covers actual WASM, desktop/mobile, keyboard, themes, and sanitizer-to-downstream pipe composition.

Use temporary local harnesses to measure release core processing, cold CLI subprocess overhead, and actual WASM separately, with deterministic clean, mixed/dense, and adversarial fixtures at several sizes. Report median/p95 and first-call measurements with the reference environment. Keep these harnesses and raw data out of the repository; a maintained benchmark suite is outside this ticket's scope. Optimize observed hot paths while retaining small functions and readable interfaces. Do not infer Rust latency from the earlier Python research spike.

## Risks / Trade-offs

- [Unknown credential formats] → Document coverage and accept recognized labels as fallback; keep provider families reviewable.
- [Over-redaction of explicit fields or Google keys] → Clear category choices and documented conservative policy; public Stripe prefixes remain exempt from standalone recognition.
- [Malformed or truncated containers] → Prefer removing their remaining sensitive container content over leaving a tail; document possible loss of trailing context.
- [Overlapping patterns] → Original spans with stable precedence and tests for category subsets; no replacement rescans.
- [Large JSON objects and near-matches] → Monotonic lexical traversal, bounded nesting/candidate checks, and growth benchmarks.
- [Cold startup or large-output latency] → Benchmark fresh CLI processes and WASM first-call costs separately; avoid loading disabled rules.

## Migration Plan

Add an additive tool and bindings; rebuild generated WASM before WebApp verification. Existing CLI commands and pipe contracts stay compatible. Commit planning artifacts before implementation, then commit verified code and documentation. Keep the change active for the user's testing; archive and sync only after their explicit request. Rollback removes the new tool/export; existing saved sanitizer steps remain diagnosable through the existing unavailable-tool contract.
