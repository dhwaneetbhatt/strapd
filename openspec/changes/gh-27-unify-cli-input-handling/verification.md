# Verification Notes

Automated coverage lives in the input-module tests and CLI process tests. The Linux PTY test uses `script` with a two-second timeout to prove required commands fail immediately when stdin is a real terminal.

On platforms where that PTY test is not compiled, manually run:

```text
strapd base64 encode
```

The command must immediately exit unsuccessfully and say that input can be supplied as an argument or piped through stdin. It must not wait for keyboard input.

## Acceptance Coverage

| Acceptance area | Automated evidence |
|---|---|
| Argument precedence, empty arguments, borrowed fast path, and no stdin read | `input::tests` and `input_cli::supplied_argument_does_not_wait_for_open_stdin` |
| Missing interactive input | `terminal_input_cli` on Linux; manual check above elsewhere |
| Read failures, partial reads, invalid UTF-8, and fallible numeric parsing | `input::tests` and `input_cli::datetime_invalid_number_is_fallible` |
| Positional versus piped whitespace compatibility | `input_cli` text, format, string, security, calculator, conversion, and datetime cases |
| Empty operation-specific input | `input_cli`, `security_input_cli`, and existing JWT process tests |
| Exact Base64/Hex binary input | `input_cli::byte_encoding_preserves_exact_piped_bytes` |
| Arbitrary-byte hash/HMAC with compatible piped trimming | `security_input_cli` and core security byte-API tests |
| Conversion argument-only, stdin-only, combined, and empty sources | `input_cli::conversion_supports_each_source_combination_and_empty_input` |
| JWT token, payload, and environment-secret behavior | `jwt_cli` and `input_cli::jwt_rejects_empty_normalized_input` |
| Core/WASM source compatibility | full Rust suite, `make wasm-build`, and `make webapp-build` |
| Webapp runtime and regression coverage | Headless Chromium exercised Base64 encode and SHA-256 through React and the rebuilt WASM with exact expected outputs; `make webapp-test` passed 321 tests in 27 files |
| Release performance and peak memory | before/after results in `benchmarks.md` |
