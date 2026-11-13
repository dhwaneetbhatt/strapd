# Usage

Use strapd from your terminal, in the WebApp, or as a library in your application. All tools run locally.

[CLI examples](#input-and-output) · [WebApp and Pipes](#webapp-and-pipes) · [Rust and browser bindings](#rust-and-browser-wasm-detection) · [Portable WASM](#portable-wasm-library)

Start with a command like this:

```bash
strapd string uppercase "hello world"
# HELLO WORLD
```

Run `strapd --help` to see the available tools. For help with one command, use `strapd json sample --help`, for example.

## Input and output

Pass text after the command, or pipe it in from another command. Put quotes around text with spaces, JSON, and expressions. If you supply both text and piped input, strapd uses the text you supplied.

```bash
strapd string uppercase "hello world"
printf 'hello world' | strapd string uppercase
cat payload.json | strapd json beautify
```

Save a result to a file with `>`, or pass it to another tool with `|`:

```bash
cat payload.json | strapd json beautify > formatted.json
strapd string lowercase "Hello World" | strapd string uppercase
```

Commands normally print just their result. `json sample --output json` also includes sampling statistics; leave that option out when you want only the sampled JSON.

## Text, identifiers, and random values

Change text, count words, or generate identifiers and random values:

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

Random strings include letters, digits, and symbols by default. Add flags to choose what to include: `--digits` creates a string of digits only. `string random` also works in place of `random string`.

## Encoding and data formats

Encode or decode text with `base64`, `url`, or `hex`. When encoding a file as Base64 or Hex, pipe it in to preserve its bytes. For text, use `printf` instead of `echo` to avoid adding a newline:

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

### Make large JSON easier to read

Use `json sample` to shorten long arrays before inspecting a response or sending it to an LLM. By default, it keeps up to three items in each array, including nested arrays. It removes `null` and empty-array items first.

```bash
cat payload.json | strapd json sample > sample.json
strapd json sample '[null,[],1,2]'
# [1,2]
strapd json sample --size 5 --seed 42 '[1,2,3,4,5,6,7]'
strapd json sample --output json '{"rows":[null,[],1,2,3,4],"note":null}'
```

Use `--size` to change the limit and `--seed` to choose a different repeatable sample. The default seed is `0`; the same input and settings give the same result.

Object fields are kept, even when their values are `null` or `[]`. Array items such as `0`, `false`, and `""` are also kept. Sampling can leave out unusual items or required array entries, so use it for inspection rather than as a replacement for the original data.

Add `--output json` to get `{ "data": ..., "metadata": ... }`. `data` holds the sampled value. `metadata.filtered` counts removed null and empty-array items in the kept branches. `metadata.sampling` counts skipped items and lists the affected array paths. Without this option, the output contains only the sampled JSON.

## Hashing, JWTs, and sanitization

Hash a message or create an HMAC with a key. For HMAC, put the key before the message:

```bash
printf 'hello' | strapd hash sha256
strapd hmac sha256 dev-secret "hello"
```

Read a JWT, check its signature, or create a new token. Set `TOKEN` to the token you want to inspect. To sign or verify, set `JWT_SECRET` to your signing key and use `--secret-env JWT_SECRET`:

```bash
strapd jwt decode "$TOKEN" --include-analysis
strapd jwt payload "$TOKEN" | strapd json beautify
strapd jwt verify "$TOKEN" --secret-env JWT_SECRET
strapd jwt sign '{"sub":"usr_123"}' --secret-env JWT_SECRET --algorithm HS256
```

### Hide secrets and personal information

Use `sanitize secrets` to hide recognized credentials and `sanitize pii` to hide personal information. With no flags, they check every supported category. Add category flags to limit what gets hidden:

```bash
cat application.log | strapd sanitize secrets
cat application.log | strapd sanitize secrets --api-keys --auth
cat application.log | strapd sanitize pii
cat application.log | strapd sanitize pii --emails --pan -p
strapd sanitize pii '{"card":4111111111111111,"phone":9876543210}'
strapd sanitize pii --emails 'Contact: dev@example.com'
# Contact: [REDACTED_EMAIL]
```

PII categories are IP addresses, emails, phone numbers, payment cards, Aadhaar, and PAN. Use `-p` to give repeated values the same numbered placeholder within one run. Numbering starts over on the next run.

Detection uses local rules. It can miss identifiers or hide ordinary text; it does not check whether a phone number, card, or government ID exists. Names and Unicode email addresses are not detected.

<details>
<summary>PII matching details and supported card ranges</summary>

Emails must use ASCII characters. Local phone numbers without separators need a label such as `phone` or `mobile`. International prefixes and common phone-number grouping can match without a label. IP ports and CIDR suffixes stay visible.

Aadhaar uses a Verhoeff checksum; PAN uses format rules. Labels such as `aadhaar`, `pan`, or `card_number` also hide plausible mistyped values. A field such as `card_status` does not trigger this fallback.

Unlabelled cards require Luhn **and** one of these prefix/length combinations. This is a local plausibility check, not issuer verification. Labelled cards (including `card`, `card_number` and `payment_card`) retain plausible 13–19 digit fallback without issuer or checksum restrictions. Compact numbers, consistent space/hyphen groups of four, Amex `4-6-5` and Diners `4-6-4` grouping are supported.

| Card | Prefix | Digits |
| --- | --- | --- |
| Visa | 4 | 13, 16, 19 |
| Mastercard | 51–55, 2221–2720 | 16 |
| Amex | 34, 37 | 15 |
| Discover | 6011, 65, 644–649 | 16, 19 |
| RuPay | 60, 65, 81, 82, 508 | 16 |
| Diners | 300–305, 36, 38, 39 | 14 |
| JCB | 3528–3589 | 16 |

Partially masked Aadhaar values stay as they are. When assigning numbered placeholders, email domains ignore letter case, but the part before `@` must match exactly.

</details>

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

Open the [WebApp](https://dhwaneetbhatt.com/strapd/), choose a tool, and enter or paste your input. Results appear in the output area. JSON Sample shows counts of removed and skipped items beside the shortened JSON.

Use Pipes to run several tools in sequence. For example, lowercase some text, then Base64-encode the result:

1. Open **Pipes** and create a new pipe.
2. Add **Case Converter** and set **Output case** to **Lowercase**.
3. Add **Base64** and set its mode to **encode**.
4. Enter `Hello World` and run the pipe.
5. The result is `aGVsbG8gd29ybGQ=`.

Each step passes its result to the next. Generator tools can start a pipe without input. JSON Sample passes only the sampled JSON, without its statistics.

Saved pipes stay in the current browser and profile. Export them before clearing browser data or moving to another browser. Exports include the steps and settings, but not the text you ran through them.

## Rust and browser WASM detection

In Rust, use `detect` when you want to find personal information without changing the text:

```rust
use strapd_core::sanitize::pii::{detect, Categories};

let text = "Contact: dev@example.com";
for found in detect(text, Categories::ALL) {
    println!("{}", &text[found.range]);
}
// dev@example.com
```

Each match has a `category` and a `range`. The range counts **UTF-8 bytes**, includes its start, and excludes its end. Matches appear in input order and do not overlap.

Build the browser bindings with `make wasm-build`. In an app configured to load the generated package, use `detect_pii(text, bits)`:

```javascript
import * as wasm from "./wasm/strapd_wasm.js";

const matches = wasm.detect_pii("Contact: dev@example.com", 2);
console.log(Array.from(matches));
// [2, 9, 24]
```

Each three numbers mean `[category, start, end]`. These are byte offsets, which can differ from JavaScript string indexes. Use a UTF-8 byte buffer when slicing by these offsets. The browser package needs its generated JavaScript files alongside the WASM file.

Choose categories by adding their bits:

| Category | Bit |
| --- | ---: |
| IP addresses | 1 |
| Emails | 2 |
| Phone numbers | 4 |
| Payment cards | 8 |
| Aadhaar | 16 |
| PAN | 32 |

For example, `3` selects IP addresses and emails. Use `63` for all PII categories or `0` for none. Secret sanitization uses a separate mask: API keys=1, auth=2, cookies=4, databases=8, crypto keys=16, passwords=32, tokens=64, signed URLs=128; all=255.

## Portable WASM library

Use the portable WASM library to call strapd tools from your own application without JavaScript. It includes the same tools as the browser package, such as encoding, hashing, JSON sampling, and PII sanitization.

### Build the library

From the repository root, run:

```bash
make portable-wasm-setup
make portable-wasm-package
```

The files are in `target/portable-wasm/`. The archive at `target/strapd-wasm.tar.gz` contains the same files:

| File | Use |
| --- | --- |
| `strapd.wasm` | Use with a core WASM runtime, such as wazero, and compatible generated bindings |
| `strapd.component.wasm` | Use with a runtime that supports WASM components, such as Wasmtime |
| `tools.wit` | Function names, inputs, and outputs for generating bindings in your language |
| `SHA256SUMS` | Checksums for verifying the three files |

To run the library's checks, use `make portable-wasm-test`.

### Example: hide email addresses with Python

This example loads the component with Wasmtime. First, create a Python environment and install the tested runtime version:

```bash
python3 -m venv target/wasm-example
source target/wasm-example/bin/activate
python -m pip install wasmtime==50.0.1
```

Save this as `mask.py` in the repository root and run `python mask.py`:

```python
import wasmtime
from wasmtime.component import Component, Linker

engine = wasmtime.Engine()
store = wasmtime.Store(engine)
store.set_wasi(wasmtime.WasiConfig())

module = Component.from_file(engine, "target/portable-wasm/strapd.component.wasm")
linker = Linker(engine)
linker.add_wasip2()
instance = linker.instantiate(store, module)

mask = instance.get_func(store, "sanitize-pii")
# 2 selects emails; False uses masking rather than numbered placeholders.
result = mask(store, "Contact: dev@example.com", 2, False)
try:
    print(result)
finally:
    mask.post_return(store)

# Contact: [REDACTED_EMAIL]
```

For other languages, generate bindings from `tools.wit` for world `tools`. The package name is `strapd:tools@0.1.0`. Choose a generator that supports your runtime and the types used in the [function reference](../crates/wasm-portable/wit/tools.wit).

### Inputs and results

- Base64 and hex use byte arrays, so decoding preserves binary data. For example, `base64-decode("/w==")` returns the byte `255`.
- `detect-pii` returns `{category, start, end}` records. Offsets count UTF-8 bytes; use the [PII category bits above](#rust-and-browser-wasm-detection). Secret sanitization has its own category mask.
- `json-sample` returns the shortened JSON plus counts of removed and skipped items. Its seed is a 64-bit unsigned integer.
- Functions that can fail return either a result or an error message. For example, invalid Base64 returns an error rather than an empty byte array.
- UUIDs and ULIDs are returned as newline-separated text. Generation counts must be between 1 and 1024. Random numbers and random strings are returned as lists.
- Random strings accept a list of character types (`lowercase`, `uppercase`, `digits`, `symbols`) and an optional custom character set. Unlike the CLI, you must choose the character types or supply a custom set.
- Timestamps use **UTC**. This can differ from the WebApp, which formats dates in the browser's local timezone.

<details>
<summary>Embedding in another runtime</summary>

Use `strapd.wasm` with a WASI Preview 1 core runtime, or `strapd.component.wasm` with a component runtime. The core file includes WIT metadata, but you still need bindings to call its functions. The browser's wasm-bindgen package is separate and needs JavaScript.

Provide secure randomness and real wall and monotonic clocks. For wazero, register `wasi_snapshot_preview1` and configure the module with `WithRandSource(crypto/rand.Reader)`, `WithSysWalltime()`, and `WithSysNanotime()`. Runtime defaults can use fixed random values or clocks; these are unsuitable for UUID generation and JWT expiry. The tools do not need filesystem access, network access, or inherited environment variables.

Use generated bindings to manage WASM memory. With low-level Canonical ABI calls, inputs transfer to the guest; copy returned values before calling the generated post-return cleanup exactly once. The Python example above calls `post_return` for this reason. Strings must be valid UTF-8; use byte arrays for binary data.

Make one call at a time on each instance. Use separate instances for parallel calls, and set runtime limits for memory and execution time when handling untrusted input. If a runtime failure traps, discard that instance. Normal input errors use WIT `result<T, string>` and do not need a new instance.

Keep signed and unsigned 64-bit values exact, particularly timestamps and sampling seeds. Some languages lose precision when converting these values to floating-point numbers. JWT and unit conversion results keep their core text/JSON formats; unit discovery returns records. Timestamp format, JWT algorithm, and unit category accept the enum values listed in `tools.wit`.

The WIT interface version is separate from the strapd release version. Regenerate bindings when adopting a newer interface. Breaking changes need a new minor version before 1.0, or a new major version after 1.0. Do not depend on generated memory layouts or private generator fields. Check your generator's handling of UTF-8, WASI setup, errors, and cleanup before using its output in production.

</details>
