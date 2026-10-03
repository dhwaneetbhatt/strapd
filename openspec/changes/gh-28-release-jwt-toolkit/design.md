## Context

v1.3.0 is the latest published tag. Main includes the merged JWT toolkit and reusable Pipes. Both deployment workflows run on v* tags.

## Decisions

Use v1.4.0 because JWT commands add compatible functionality. Preserve the existing workflows and draft-release review step. Use scripts/update-version.sh and regenerate Cargo.lock without changing dependency versions. The webapp build derives VITE_APP_VERSION from package.json.

## Verification

Run Rust formatting, clippy, tests, CLI release build, WASM rebuild, webapp checks, tests, and production build. Verify the published release contains six platform archives and Pages deploys the tagged commit. Verify the Homebrew update matches released asset hashes.

## Publishing constraints

The current environment cannot connect to its network proxy and its CLI GitHub authentication fails. GitHub connector tools support repository changes but do not provide tag creation, workflow dispatch, or release publishing. Prepare a reviewable release PR and record any unfinished publishing steps accurately.
