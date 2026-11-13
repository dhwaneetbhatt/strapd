# Integration verification

Verified locally on 2026-11-13. No version bump, tag, release, merge or artifact
publication was performed. The existing WebApp implementation is unchanged.

## Checks

| Check | Result |
| --- | --- |
| Rust format, clippy with warnings denied, workspace tests | Passed; 764 tests including generated doctest |
| Core with default/browser features disabled | 639 tests passed |
| Portable artifact contracts | All 52 component exports; core-module imports/exports and selected Canonical ABI calls passed |
| Ownership/recovery | 1,000 dense detection calls interleaved with valid/invalid decoding; core linear memory unchanged after warmup; component reuse passed |
| Data boundaries | Binary bytes, Unicode spans, 64-bit seeds/timestamps, count/range errors, empty input and >64 KiB clean/dense inputs passed |
| Host services | Real clock values, unique UUIDv4/v7/ULIDs, version-7 timestamps, random strings/numbers passed |
| Browser WASM rebuild | Passed with the existing wasm-bindgen crate |
| WebApp format/lint/tests/build | Passed; 339 tests |
| Browser E2E | 15 passed in the default parallel run |
| CLI smoke | 99 passed, one unavailable graphical clipboard skip, zero failures |
| Packaging | Archive contains both modules, WIT and matching SHA256SUMS |
| Version update script | Scratch update reached all four crates; WIT version unchanged; shell syntax checks passed |
| Independent read-only correctness review | No blockers; checked all forwarders, validation, ownership, services, feature separation and distribution wiring |

The mobile dialog bounds test originally sampled a transient animated position
and failed twice under parallel execution, while passing in isolation. Its
existing bounds assertions now retry during the entrance animation; persistent
overflow still fails. The full parallel suite then passed. Application code and
animation behavior were not changed.

## Go ecosystem check

Gravity 0.0.3 at `ee8d0e55be5cb29cd6b3cdfb93d901b9eaaec623` generated bindings
for all 52 exports from the integration artifact. The complete generated package
compiled without generated-source edits. Selected methods executed in wazero
1.12.0: binary Base64, Unicode PII spans, HMAC, enum timestamp formatting, UUIDv7,
all random character selections, optional JWT expiry and error recovery.

Random character selection uses `list<character-type>` because the generator
does not implement WIT flags. No generator fork or workaround is shipped.
The temporary validation reused the generic WASI setup hook described in
results.md; its private-field coupling remains a consumer-tooling limitation.
It is not included as an SDK or integration module.

A 20-warmup/101-sample sanity check on this machine measured 64 KiB detection
medians of 0.148208 ms clean and 0.708167 ms dense. This checks for a material
latency regression, not a feature-equivalent performance ranking or production
latency guarantee. All 52 methods were exercised through the component; the
generated Go runtime check covered representative methods rather than every
method.

## Local artifacts

| File | Bytes | SHA256 |
| --- | ---: | --- |
| strapd.wasm | 900400 | `37c2307dec39eb7ffaf19c8707736757df2a437a912a55f9dff85ac5f2109009` |
| strapd.component.wasm | 930308 | `a00aea5bcecabcf6071e8d6e4a11798b103907668d4bb844c654a58829dacf14` |
| tools.wit | 5095 | `3e2749196d4fffce86cb642d94d321aca15ffffb6635e65b773802f968369f80` |

These binaries remain ignored build output. Release packaging is wired for a
future reviewed release; that workflow has not been dispatched. Remote CI must
validate the pushed PR independently.

Not checked: additional engines/languages, concurrent production workloads,
Safari/Firefox, exhaustive generated-Go method execution or a production SDK.
