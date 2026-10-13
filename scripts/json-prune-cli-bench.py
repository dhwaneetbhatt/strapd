#!/usr/bin/env python3
"""Measure release CLI wall time, including startup, stdin, and stdout."""

import argparse
import re
import statistics
import subprocess
import time
from pathlib import Path


BINARY = Path(__file__).resolve().parents[1] / "target/release/strapd"


def cases() -> dict[str, str]:
    wide = "{" + ",".join(
        f'"key{index}":' + ("null" if index % 4 == 0 else str(index))
        for index in range(1_000)
    ) + "}"
    deep = '{"leaf":1,"unused":null}'
    for _ in range(64):
        deep = '{"child":' + deep + "}"
    large_array = "[" + ",".join(str(index) for index in range(10_000)) + "]"
    return {
        "small": '{"name":"Ada","unused":null,"items":[1,2,3,4,5,6,7]}',
        "wide": wide,
        "deep": deep,
        "large-array": large_array,
    }


def measure(input_text: str, operation: str, source: str, output: str, runs: int) -> tuple[int, int, int]:
    args = [str(BINARY), "json", operation]
    if operation == "prune":
        args += ["--sample", "--output", output]
    stdin = input_text.encode() if source == "stdin" else None
    if source == "argument":
        args.append(input_text)

    for _ in range(5):
        result = subprocess.run(args, input=stdin, capture_output=True, check=True)
    elapsed = []
    for _ in range(runs):
        start = time.perf_counter_ns()
        result = subprocess.run(args, input=stdin, capture_output=True, check=True)
        elapsed.append((time.perf_counter_ns() - start) // 1_000)
    elapsed.sort()
    return int(statistics.median(elapsed)), elapsed[int(0.95 * (runs - 1))], len(result.stdout)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=60)
    parser.add_argument("--memory", action="store_true")
    args = parser.parse_args()
    if args.runs < 2:
        parser.error("--runs must be at least 2")

    if args.memory:
        print("case,operation,output,max_rss_bytes")
        for name, input_text in cases().items():
            for operation, output in (("minify", "raw"), ("prune", "raw"), ("prune", "json")):
                command = ["/usr/bin/time", "-l", str(BINARY), "json", operation]
                if operation == "prune":
                    command += ["--sample", "--output", output]
                result = subprocess.run(command, input=input_text.encode(), capture_output=True, check=True)
                match = re.search(rb"(\d+)\s+maximum resident set size", result.stderr)
                if match is None:
                    raise RuntimeError(result.stderr.decode(errors="replace"))
                print(f"{name},{operation},{output},{int(match.group(1))}")
        return

    for label, command in (
        ("system-true", ["/usr/bin/true"]),
        ("strapd-version", [str(BINARY), "--version"]),
    ):
        samples = []
        for _ in range(args.runs):
            start = time.perf_counter_ns()
            subprocess.run(command, capture_output=True, check=True)
            samples.append((time.perf_counter_ns() - start) // 1_000)
        print(f"launch-baseline,{label},median_us,{int(statistics.median(samples))}")

    print("case,input_bytes,operation,source,output,median_us,p95_us,output_bytes")
    for name, input_text in cases().items():
        for operation, output in (("minify", "raw"), ("prune", "raw"), ("prune", "json")):
            for source in ("argument", "stdin"):
                median, p95, output_bytes = measure(input_text, operation, source, output, args.runs)
                print(
                    f"{name},{len(input_text.encode())},{operation},{source},{output},"
                    f"{median},{p95},{output_bytes}"
                )


if __name__ == "__main__":
    main()
