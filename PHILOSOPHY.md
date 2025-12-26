# strapd Philosophy

## What is strapd?

**strapd** is a developer utility belt.

It exists to solve the small, repetitive, everyday problems developers face—quick transformations, inspections, formatting, and validations—without forcing them to remember dozens of specialized tools or write throwaway scripts.

strapd is not trying to replace the Unix toolbox.
It’s trying to make the *common 80%* faster, clearer, and more consistent.

---

## Core Principles

### 1. Optimize for Daily Use

strapd is designed for things you do **multiple times a day**, not once a year.

If a command:

* saves a few seconds every time,
* avoids context switching,
* or replaces a scratch script,

then it belongs in strapd.

If it’s rare, complex, or highly specialized, it probably doesn’t.

---

### 2. Consistency Over Completeness

Every strapd command should:

* behave predictably
* accept input from stdin when possible
* produce clean, script-friendly output
* share common flags (`--copy`, `--json`, `--pretty`, etc.)

We prefer a smaller, consistent interface over a feature-rich but fragmented one.

strapd should feel learn-once, use-everywhere.

---

### 3. Opinionated Defaults, Escape Hatches Optional

strapd favors:

* sensible defaults
* human-readable output
* safe behavior out of the box

Advanced usage should be possible, but not required.

If a feature needs many flags to be usable, it likely doesn’t belong in the core.

---

### 4. Human-Centered CLI

strapd treats the CLI as a **user interface**, not just a transport layer.

That means:

* clear error messages
* actionable suggestions (“did you mean…?”)
* examples in help output
* readable formatting by default

Machines can parse JSON. Humans should not have to.

---

### 5. Composability First

strapd plays well with others.

Commands should:

* work with pipes
* accept files or stdin
* emit predictable output
* respect exit codes

strapd should fit naturally into shell pipelines, scripts, CI jobs, and REPL-like workflows.

---

### 6. No Reinventing Heavyweight Tools

strapd does **not** aim to replace:

* `jq`
* `sed`, `awk`
* `curl`
* full cryptography suites
* full Git clients

Instead, it covers the common, approachable cases where those tools are:

* overkill
* hard to remember
* unfriendly for quick tasks

When in doubt, strapd complements rather than competes.

---

### 7. Safety by Default

strapd avoids:

* destructive actions
* silent mutations
* insecure defaults

Inspection is preferred over mutation.
Validation is preferred over generation.
Explicit flags are required for risky operations.

---

### 8. One Core, Multiple Interfaces

strapd has a single source of truth for logic.

That logic may be exposed via:

* CLI
* Web UI (WASM)

Behavior and results should remain consistent across interfaces.

---

## What Belongs in strapd?

A feature belongs in strapd if it:

* replaces a common scratch script
* is easy to explain in one sentence
* benefits from consistent CLI ergonomics
* is frequently Googled by developers
* feels annoying to re-implement repeatedly

Examples:

* data format conversion
* encoding/decoding
* timestamps and timezones
* UUIDs, hashes, tokens
* light JSON manipulation
* text sanitization and inspection

---

## What Does Not Belong

A feature does **not** belong if it:

* requires deep domain expertise
* duplicates a mature, well-known tool
* significantly expands maintenance surface
* introduces security-sensitive complexity
* is rarely used or highly niche

strapd values focus over breadth.

---

## Focus Over Bloat

strapd grows deliberately.

Every addition increases:

* cognitive load
* maintenance cost
* long-term support burden

Features are added only when they clearly improve everyday developer workflows.

---

## Design Test for New Features

Before adding a feature, ask:

1. Would I use this weekly?
2. Can I explain it in one sentence?
3. Does it fit with existing commands?
4. Is the default behavior obvious?
5. Does this reduce context switching?

If the answer to most is “no”, reconsider.

---

## The Strapd Promise

If you install strapd, you should get:

* fewer one-off scripts
* fewer Google searches
* fewer half-remembered flags
* faster everyday workflows

strapd aims to earn a permanent place in your toolbox.
