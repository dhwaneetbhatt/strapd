#!/usr/bin/env bash

set -uo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
OUTPUT=""

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    printf 'PASS  %s\n' "$1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf 'FAIL  %s\n      %s\n' "$1" "$2"
}

skip() {
    SKIP_COUNT=$((SKIP_COUNT + 1))
    printf 'SKIP  %s\n      %s\n' "$1" "$2"
}

run_command() {
    local name=$1
    shift
    if OUTPUT=$("$@" 2>&1); then
        return 0
    fi
    fail "$name" "command exited unsuccessfully: $OUTPUT"
    return 1
}

run_pipe() {
    local name=$1
    local input=$2
    shift 2
    if OUTPUT=$(printf '%b' "$input" | "$@" 2>&1); then
        return 0
    fi
    fail "$name" "piped command exited unsuccessfully: $OUTPUT"
    return 1
}

check_eq() {
    local name=$1
    local expected=$2
    shift 2
    run_command "$name" "$@" || return
    if [[ $OUTPUT == "$expected" ]]; then
        pass "$name"
    else
        fail "$name" "expected '$expected', got '$OUTPUT'"
    fi
}

check_pipe_eq() {
    local name=$1
    local input=$2
    local expected=$3
    shift 3
    run_pipe "$name" "$input" "$@" || return
    if [[ $OUTPUT == "$expected" ]]; then
        pass "$name"
    else
        fail "$name" "expected '$expected', got '$OUTPUT'"
    fi
}

check_contains() {
    local name=$1
    local expected=$2
    shift 2
    run_command "$name" "$@" || return
    if [[ $OUTPUT == *"$expected"* ]]; then
        pass "$name"
    else
        fail "$name" "expected output containing '$expected', got '$OUTPUT'"
    fi
}

check_pipe_contains() {
    local name=$1
    local input=$2
    local expected=$3
    shift 3
    run_pipe "$name" "$input" "$@" || return
    if [[ $OUTPUT == *"$expected"* ]]; then
        pass "$name"
    else
        fail "$name" "expected output containing '$expected', got '$OUTPUT'"
    fi
}

check_regex() {
    local name=$1
    local pattern=$2
    shift 2
    run_command "$name" "$@" || return
    if [[ $OUTPUT =~ $pattern ]]; then
        pass "$name"
    else
        fail "$name" "output did not match /$pattern/: $OUTPUT"
    fi
}

check_pipe_regex() {
    local name=$1
    local input=$2
    local pattern=$3
    shift 3
    run_pipe "$name" "$input" "$@" || return
    if [[ $OUTPUT =~ $pattern ]]; then
        pass "$name"
    else
        fail "$name" "output did not match /$pattern/: $OUTPUT"
    fi
}

check_line_count() {
    local name=$1
    local expected=$2
    shift 2
    run_command "$name" "$@" || return
    local actual
    actual=$(printf '%s\n' "$OUTPUT" | awk 'END { print NR }')
    if [[ $actual == "$expected" ]]; then
        pass "$name"
    else
        fail "$name" "expected $expected lines, got $actual: $OUTPUT"
    fi
}

expect_failure() {
    local name=$1
    local expected=$2
    shift 2
    if OUTPUT=$("$@" 2>&1); then
        fail "$name" "expected failure, command succeeded with: $OUTPUT"
    elif [[ $OUTPUT == *"$expected"* ]]; then
        pass "$name"
    else
        fail "$name" "failed as expected, but output did not contain '$expected': $OUTPUT"
    fi
}

expect_pipe_failure() {
    local name=$1
    local input=$2
    local expected=$3
    shift 3
    if OUTPUT=$(printf '%b' "$input" | "$@" 2>&1); then
        fail "$name" "expected failure, command succeeded with: $OUTPUT"
    elif [[ $OUTPUT == *"$expected"* ]]; then
        pass "$name"
    else
        fail "$name" "failed as expected, but output did not contain '$expected': $OUTPUT"
    fi
}

if [[ -n ${STRAPD_BIN:-} ]]; then
    if [[ $STRAPD_BIN != /* ]]; then
        STRAPD_BIN="$REPO_ROOT/$STRAPD_BIN"
    fi
else
    printf 'Building strapd CLI...\n'
    cargo build -p strapd || exit 1
    STRAPD_BIN="$REPO_ROOT/target/debug/strapd"
fi

if [[ ! -x $STRAPD_BIN ]]; then
    printf 'strapd binary is not executable: %s\n' "$STRAPD_BIN" >&2
    exit 1
fi

SMOKE_TMP_DIR=$(mktemp -d)
cleanup() {
    if [[ -n ${SMOKE_TMP_DIR:-} && -d $SMOKE_TMP_DIR ]]; then
        rm -rf -- "$SMOKE_TMP_DIR"
    fi
}
trap cleanup EXIT

printf '\nCLI metadata\n'
check_contains "root help" "Swiss Army knife" "$STRAPD_BIN" --help
check_regex "version" '^strapd [0-9]+\.[0-9]+\.[0-9]+$' "$STRAPD_BIN" --version

printf '\nString tools\n'
check_eq "uppercase argument" "HELLO WORLD" "$STRAPD_BIN" string uppercase "hello world"
check_pipe_eq "lowercase trims shell newline" 'HELLO WORLD\n' "hello world" "$STRAPD_BIN" string lowercase
check_eq "capital case" "Hello World" "$STRAPD_BIN" string capital-case "hello world"
check_pipe_eq "reverse stdin" 'abcd\n' "dcba" "$STRAPD_BIN" string reverse
check_eq "replace" "hello rust" "$STRAPD_BIN" string replace "hello world" --find world --replace rust
check_eq "trim both edges" "spaced" "$STRAPD_BIN" string trim "  spaced  "
check_eq "trim left only" "spaced  " "$STRAPD_BIN" string trim "  spaced  " --left
check_eq "trim right only" "  spaced" "$STRAPD_BIN" string trim "  spaced  " --right
check_eq "collapse whitespace preserves first whitespace kind" $'a\tb c' "$STRAPD_BIN" string trim $'  a\t b   c  ' --all
check_pipe_eq "slugify stdin" 'Hello, World!\n' "hello-world" "$STRAPD_BIN" string slugify
check_contains "count all metrics" "Words: 2" "$STRAPD_BIN" string count "one two"
check_pipe_contains "word frequency" 'one one two\n' "one: 2" "$STRAPD_BIN" string frequency --words
check_contains "character frequency" "a: 2" "$STRAPD_BIN" string frequency "aba" --characters
check_regex "nested random string" '^[a-z]{12}$' "$STRAPD_BIN" string random 12 --lowercase
expect_pipe_failure "text rejects non-UTF-8" '\377' "valid UTF-8" "$STRAPD_BIN" string uppercase

printf '\nIdentifiers and random values\n'
check_regex "UUID v4" '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' "$STRAPD_BIN" uuid v4
check_regex "UUID v7" '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' "$STRAPD_BIN" uuid v7
check_line_count "multiple UUIDs" 3 "$STRAPD_BIN" uuid v4 3
check_regex "ULID" '^[0-9A-HJKMNP-TV-Z]{26}$' "$STRAPD_BIN" ulid
check_line_count "multiple ULIDs" 3 "$STRAPD_BIN" ulid 3
check_regex "random string charset" '^[abc]{20}$' "$STRAPD_BIN" random string 20 --charset abc
check_line_count "multiple random strings" 3 "$STRAPD_BIN" random string 8 --digits --count 3
check_regex "random negative number range" '^-[0-9]+$' "$STRAPD_BIN" random number --min=-20 --max=-10

printf '\nEncoding tools\n'
check_eq "base64 argument" "aGVsbG8=" "$STRAPD_BIN" base64 encode hello
check_pipe_eq "base64 exact binary stdin" '\000\377' "AP8=" "$STRAPD_BIN" base64 encode
check_eq "base64 decode" "hello" "$STRAPD_BIN" base64 decode aGVsbG8=
check_eq "URL encode" "hello%20world%3F" "$STRAPD_BIN" url encode "hello world?"
check_pipe_eq "URL decode stdin" 'hello%20world\n' "hello world" "$STRAPD_BIN" url decode
check_eq "hex argument" "68656c6c6f" "$STRAPD_BIN" hex encode hello
check_pipe_eq "hex exact binary stdin" '\000\377' "00ff" "$STRAPD_BIN" hex encode
check_eq "hex decode" "hello" "$STRAPD_BIN" hex decode 68656c6c6f
expect_failure "invalid base64" "Invalid base64" "$STRAPD_BIN" base64 decode '%%%'
expect_failure "invalid hex" "Invalid hex" "$STRAPD_BIN" hex decode xyz

if "$STRAPD_BIN" base64 decode AP8= >"$SMOKE_TMP_DIR/base64.bin" 2>"$SMOKE_TMP_DIR/base64.err"; then
    BINARY_HEX=$(od -An -tx1 -v "$SMOKE_TMP_DIR/base64.bin" | tr -d ' \n')
    if [[ $BINARY_HEX == "00ff0a" ]]; then
        pass "binary decode writes exact bytes plus CLI newline"
    else
        fail "binary decode writes exact bytes plus CLI newline" "expected 00ff0a, got $BINARY_HEX"
    fi
else
    fail "binary decode writes exact bytes plus CLI newline" "$(<"$SMOKE_TMP_DIR/base64.err")"
fi

printf '\nStructured data tools\n'
check_pipe_contains "JSON beautify and sort" '{"b":2,"a":1}\n' '"a": 1' "$STRAPD_BIN" json beautify --sort
check_eq "JSON minify" '{"a":1}' "$STRAPD_BIN" json minify '{"a": 1}'
check_eq "JSON sort" '{"a":2,"z":1}' "$STRAPD_BIN" json sort '{"z":1,"a":2}'
check_contains "JSON to YAML" "a: 1" "$STRAPD_BIN" json convert '{"a":1}' --to yaml
check_pipe_contains "JSON to XML with root" '{"a":1}\n' '<sample>' "$STRAPD_BIN" json convert --to xml --root sample
check_pipe_eq "YAML to JSON" 'a: 1\nb: 2\n' '{"a":1,"b":2}' "$STRAPD_BIN" yaml convert --to json
check_contains "XML beautify" '<a>1</a>' "$STRAPD_BIN" xml beautify '<root><a>1</a></root>'
check_pipe_eq "XML minify" '<root>  <a>1</a>  </root>\n' '<root><a>1</a></root>' "$STRAPD_BIN" xml minify
check_contains "XML to JSON" '"a"' "$STRAPD_BIN" xml convert '<root><a>1</a></root>' --to json
check_pipe_contains "SQL beautify" 'select a from users where id=1\n' $'select a\nfrom users' "$STRAPD_BIN" sql beautify
check_contains "SQL minify" "SELECT" "$STRAPD_BIN" sql minify $'SELECT a\nFROM users\nWHERE id = 1'
expect_failure "invalid JSON" "Invalid json input" "$STRAPD_BIN" json minify '{'
expect_failure "unsupported conversion" "only be converted" "$STRAPD_BIN" yaml convert 'a: 1' --to xml

printf '\nSecurity tools\n'
check_eq "MD5" "5d41402abc4b2a76b9719d911017c592" "$STRAPD_BIN" hash md5 hello
check_pipe_eq "SHA-1 trims shell newline" 'hello\n' "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d" "$STRAPD_BIN" hash sha1
check_eq "SHA-256" "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" "$STRAPD_BIN" hash sha256 hello
check_pipe_regex "SHA-512 binary stdin" '\000\377' '^[0-9a-f]{128}$' "$STRAPD_BIN" hash sha512
check_regex "HMAC SHA-256" '^[0-9a-f]{64}$' "$STRAPD_BIN" hmac sha256 secret hello
check_pipe_regex "HMAC SHA-512 binary stdin" '\000\377' '^[0-9a-f]{128}$' "$STRAPD_BIN" hmac sha512 secret
check_pipe_eq "SHA-256 empty stdin" '' "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" "$STRAPD_BIN" hash sha256

printf '\nJWT tools\n'
run_pipe "JWT sign" '{"sub":"smoke","admin":true}\n' "$STRAPD_BIN" jwt sign --secret smoke-secret --algorithm hs256 || true
JWT_TOKEN=$OUTPUT
if [[ $JWT_TOKEN =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    pass "JWT sign"
    check_contains "JWT decode" '"sub": "smoke"' "$STRAPD_BIN" jwt decode "$JWT_TOKEN"
    check_contains "JWT decode analysis" '"analysis"' "$STRAPD_BIN" jwt decode "$JWT_TOKEN" --include-analysis
    check_pipe_contains "JWT payload stdin" "$JWT_TOKEN\n" '"admin": true' "$STRAPD_BIN" jwt payload
    check_contains "JWT header" '"alg": "HS256"' "$STRAPD_BIN" jwt header "$JWT_TOKEN"
    check_pipe_contains "JWT verify stdin" "$JWT_TOKEN\n" "SUCCESS: Signature valid" "$STRAPD_BIN" jwt verify --secret smoke-secret
    check_contains "JWT environment secret" "SUCCESS: Signature valid" env STRAPD_SMOKE_SECRET=smoke-secret "$STRAPD_BIN" jwt verify "$JWT_TOKEN" --secret-env STRAPD_SMOKE_SECRET
    expect_failure "JWT wrong secret" "Signature verification failed" "$STRAPD_BIN" jwt verify "$JWT_TOKEN" --secret wrong-secret
else
    fail "JWT sign" "expected compact token, got: $JWT_TOKEN"
fi
expect_pipe_failure "JWT rejects empty normalized input" '  \n' "No JWT token provided" "$STRAPD_BIN" jwt decode

printf '\nCalculator, conversion, and time tools\n'
check_pipe_eq "calculator stdin" '2+3*4\n' "14" "$STRAPD_BIN" calc
expect_failure "calculator invalid expression" "Error" "$STRAPD_BIN" calc '2+'
check_contains "convert arguments" "6.21 mi" "$STRAPD_BIN" convert "10 km to mi"
check_pipe_contains "convert stdin" '10 km to mi\n' "6.21 mi" "$STRAPD_BIN" convert
check_pipe_contains "convert combined stdin and argument" '10 km\n' "6.21 mi" "$STRAPD_BIN" convert mi
check_contains "convert precision" "6.214 mi" "$STRAPD_BIN" convert "10 km to mi" --precision 3
check_contains "convert all units" "m" "$STRAPD_BIN" convert "1 km" --all
check_contains "convert temperature" "32" "$STRAPD_BIN" convert "0 c to f"
expect_pipe_failure "convert rejects empty input" '' "No input provided" "$STRAPD_BIN" convert
check_regex "current Unix time" '^[0-9]{10}$' "$STRAPD_BIN" time now
check_regex "current Unix time milliseconds" '^[0-9]{13}$' "$STRAPD_BIN" time now --millis
check_eq "time from epoch argument" "1970-01-01T00:00:00+00:00" "$STRAPD_BIN" time from 0 --format iso
check_pipe_eq "time from epoch stdin" '0\n' "1970-01-01T00:00:00+00:00" "$STRAPD_BIN" time from --format iso
expect_pipe_failure "invalid timestamp" 'not-a-number\n' "expected a whole number" "$STRAPD_BIN" time from

if command -v timeout >/dev/null 2>&1; then
    if OUTPUT=$(timeout 2 "$STRAPD_BIN" base64 encode hello < <(tail -f /dev/null) 2>&1); then
        if [[ $OUTPUT == "aGVsbG8=" ]]; then
            pass "argument does not wait for open stdin"
        else
            fail "argument does not wait for open stdin" "unexpected output: $OUTPUT"
        fi
    else
        fail "argument does not wait for open stdin" "command timed out or failed: $OUTPUT"
    fi
else
    skip "argument does not wait for open stdin" "timeout utility is unavailable"
fi

printf '\nClipboard tools\n'
CLIPBOARD_VALUE="strapd-smoke-$RANDOM-$RANDOM"
COPY_OK=false
PASTE_OK=false
if COPY_OUTPUT=$(printf '%s\n' "$CLIPBOARD_VALUE" | "$STRAPD_BIN" copy 2>&1); then
    COPY_OK=true
fi
if PASTE_OUTPUT=$("$STRAPD_BIN" paste 2>&1); then
    PASTE_OK=true
fi

if [[ $COPY_OK == true && $PASTE_OK == true ]]; then
    if [[ $PASTE_OUTPUT == "$CLIPBOARD_VALUE" ]]; then
        pass "clipboard copy and paste round-trip"
    else
        fail "clipboard copy and paste round-trip" "expected '$CLIPBOARD_VALUE', got '$PASTE_OUTPUT'"
    fi
elif [[ $COPY_OK == false && $PASTE_OK == false && "$COPY_OUTPUT $PASTE_OUTPUT" =~ (clipboard|Clipboard|XCB|display|Display|Wayland|connection|conection) ]]; then
    skip "clipboard copy and paste round-trip" "no usable graphical clipboard backend in this environment"
else
    fail "clipboard copy and paste round-trip" "copy: $COPY_OUTPUT; paste: $PASTE_OUTPUT"
fi

printf '\nSummary: %d passed, %d skipped, %d failed\n' "$PASS_COUNT" "$SKIP_COUNT" "$FAIL_COUNT"
if ((FAIL_COUNT > 0)); then
    exit 1
fi
