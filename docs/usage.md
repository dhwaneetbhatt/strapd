# Usage

The CLI follows `strapd <tool> <operation> [options] [input]`. Run `strapd --help` for the tool list, or add `--help` after a tool or operation for its exact options. The examples below show the main patterns across the CLI; aliases are available in command help.

## Input and output

Commands that take input accept a final positional argument or read stdin when that argument is omitted. Use quotes around JSON, expressions, and text with spaces. Positional input takes precedence over stdin. Commands that need input fail with guidance instead of waiting on an interactive terminal.

```bash
strapd string uppercase "hello world"
printf 'hello world' | strapd string uppercase
cat payload.json | strapd json beautify
```

Commands print their result to stdout, so they compose with shell pipelines and redirection. Most commands print plain text or the raw transformed value. `json sample --output json` is the current opt-in exception: it wraps the sampled JSON value in `data` and puts loss counts in `metadata`. Use the default raw output when piping it into another command.

## Text, identifiers, and random values

Use `string` for case conversion, replacement, trimming, slug creation, reversal, counting, and frequency analysis. Generators accept counts where applicable.

```bash
strapd string lowercase "Hello World"
strapd string replace "hello world" --find world --replace strapd
strapd string trim --all "  spaced   words  "
strapd string slugify "Hello, World!"
strapd string count --words "one two three"
strapd string frequency --characters "banana"
strapd uuid v4
strapd uuid v7 3
strapd ulid 3
strapd random string 20 --digits --count 2
strapd random number --min 1 --max 10 --count 3
```

`string random` is an alias for `random string`. When no character-set flags are given, random strings use their default character set; specifying flags selects the requested sets.

## Encoding and data formats

`base64`, `url`, and `hex` each have `encode` and `decode` operations. Base64 and Hex encoding preserve piped bytes exactly. Use formatting commands for readable output and conversion commands to change formats.

```bash
printf 'hello' | strapd base64 encode
strapd base64 decode aGVsbG8=
strapd url encode "a b"
strapd hex encode hello

cat payload.json | strapd json beautify
cat payload.json | strapd json minify
strapd json sort '{"z":1,"a":2}'
strapd json convert --to yaml '{"ready":true}'
strapd yaml convert --to json 'ready: true'
strapd xml beautify '<root><item>one</item></root>'
strapd xml convert --to json '<root><item>one</item></root>'
strapd sql beautify 'select id from users'
```

`json sample` makes a compact, representative JSON value for inspection or an LLM. At every array depth it removes `null` and empty-array **entries**, then selects up to three remaining entries using a fixed default seed of `0`. It preserves object keys and their values, including `null` and `[]` fields; it also keeps `0`, `false`, and `""` array entries. Sampling assumes entries in each array are broadly uniform and cannot reveal fields that occur only in omitted entries.

```bash
cat payload.json | strapd json sample > sample.json
strapd json sample --size 5 --seed 42 '[1,2,3,4,5,6,7]'
strapd json sample --output json '{"rows":[null,[],1,2,3,4],"note":null}'
```

`--size N` sets the maximum retained entries per array; `--seed SEED` gives another repeatable random selection. Raw JSON is the default and contains no omission marker. With `--output json`, stdout has exactly `{ "data": ..., "metadata": ... }`. `metadata.filtered` counts removed null and empty-array entries in retained branches; `metadata.sampling` reports total eligible entries omitted and JSON Pointer paths to affected arrays. Sampling can change array lengths and schema validity.

## Hashing, JWTs, and sanitization

Hash and HMAC commands accept a positional message or piped input. HMAC takes its key before the message. JWT commands decode a token, extract its header or payload, verify a signature, or sign JSON claims. Verification and signing accept either `--secret` or `--secret-env`.

```bash
printf 'hello' | strapd hash sha256
strapd hmac sha256 dev-secret "hello"
strapd jwt decode "$TOKEN" --include-analysis
strapd jwt payload "$TOKEN" | strapd json beautify
strapd jwt verify "$TOKEN" --secret-env JWT_SECRET
strapd jwt sign '{"sub":"usr_123"}' --secret-env JWT_SECRET --algorithm HS256
```

Sanitizers process text locally. With no category flags, each sanitizer enables all its categories; individual flags select only their union. PII masking is the default, and `-p` assigns repeatable placeholders within one invocation.

```bash
cat application.log | strapd sanitize secrets
cat application.log | strapd sanitize secrets --api-keys --auth
cat application.log | strapd sanitize pii
cat application.log | strapd sanitize pii --emails --pan -p
```

## Time, calculation, units, and clipboard

`time` reads or converts Unix timestamps. `calc` evaluates a mathematical expression. `convert` accepts a unit conversion expression. `copy` and `paste` connect commands to the system clipboard.

```bash
strapd time now
strapd time now --millis
strapd time from 1700000000 --format iso
strapd calc '2 * (3 + 4)'
strapd convert '10 km to mi'
strapd convert '10 km to mi' --precision 2
strapd copy "hello"
strapd paste | strapd string uppercase
```

## WebApp and Pipes

The [WebApp](https://dhwaneetbhatt.com/strapd/) exposes tools through a browser UI backed by the same Rust core. It displays results in the tool's output area. JSON Sample shows loss statistics beside the raw JSON result; the CLI's `--output json` wrapper is not used in the WebApp.

Pipes connect compatible tools in sequence: one step's raw output becomes the next step's input. Create a pipe under `/pipes`, choose each step's settings, reorder steps, then run the sequence. Generator tools can start without input; other pipes take an initial string. Pipes are stored in the browser's `localStorage` for that origin and profile. Export a pipe before clearing site data or moving browsers. Exported pipe documents include tool IDs, versions, and frozen settings, but not runtime input or output. JSON Sample passes raw JSON to the next step.
