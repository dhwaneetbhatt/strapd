# CLI Input Performance

Measurements use the release binary on the same Linux environment, three runs per case, GNU `time`, zero-filled stdin, and output redirected to `/dev/null`. Times are medians; RSS is the median maximum resident set size reported in KiB. Sub-10 ms results appear as `0.00` because GNU `time` reports hundredths of a second.

## Before

| Operation | Input | Median time | Approx. throughput | Median peak RSS |
|---|---:|---:|---:|---:|
| Base64 encode | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| Base64 encode | 1 MiB | 0.00 s | timer-bound | 6,784 KiB |
| Base64 encode | 16 MiB | 0.04 s | 400 MiB/s | 42,624 KiB |
| Base64 encode | 64 MiB | 0.14 s | 457 MiB/s | 157,312 KiB |
| Hex encode | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| Hex encode | 1 MiB | 0.00 s | timer-bound | 7,296 KiB |
| Hex encode | 16 MiB | 0.08 s | 200 MiB/s | 53,376 KiB |
| Hex encode | 64 MiB | 0.32 s | 200 MiB/s | 200,832 KiB |
| SHA-256 | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| SHA-256 | 1 MiB | 0.00 s | timer-bound | 6,144 KiB |
| SHA-256 | 16 MiB | 0.04 s | 400 MiB/s | 36,864 KiB |
| SHA-256 | 64 MiB | 0.12 s | 533 MiB/s | 135,168 KiB |

The exact command matrix is:

```text
head -c <bytes> /dev/zero | /usr/bin/time -f '%e %M' target/release/strapd <operation> >/dev/null
```

The same commands and environment are used for the after measurements.

## After

| Operation | Input | Median time | Approx. throughput | Median peak RSS |
|---|---:|---:|---:|---:|
| Base64 encode | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| Base64 encode | 1 MiB | 0.00 s | timer-bound | 6,784 KiB |
| Base64 encode | 16 MiB | 0.04 s | 400 MiB/s | 42,624 KiB |
| Base64 encode | 64 MiB | 0.16 s | 400 MiB/s | 157,312 KiB |
| Hex encode | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| Hex encode | 1 MiB | 0.00 s | timer-bound | 7,296 KiB |
| Hex encode | 16 MiB | 0.07 s | 229 MiB/s | 53,504 KiB |
| Hex encode | 64 MiB | 0.28 s | 229 MiB/s | 200,832 KiB |
| SHA-256 | 16 B | 0.00 s | startup-bound | 4,480 KiB |
| SHA-256 | 1 MiB | 0.00 s | timer-bound | 5,248 KiB |
| SHA-256 | 16 MiB | 0.02 s | 800 MiB/s | 20,736 KiB |
| SHA-256 | 64 MiB | 0.09 s | 711 MiB/s | 69,888 KiB |

## Comparison

At 64 MiB, Base64 peak memory is unchanged and timing remains within the observed run-to-run range (the after runs span 0.14–0.17 s). Hex is faster with unchanged peak memory. SHA-256 improves from 0.12 s and 135,168 KiB to 0.09 s and 69,888 KiB because stdin is hashed from its byte buffer without conversion to and duplication as a UTF-8 `String`.

A 120,000-byte positional SHA-256 message—the largest conservative single argument beneath Linux's per-argument limit—also completed successfully in 0.00 s with 4,864 KiB peak RSS. The input-module structural tests independently prove this path returns `Cow::Borrowed` and never reads stdin.
