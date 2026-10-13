# GH-34 verification

## Outcome

Implemented local PII masking and invocation-local pseudonyms in the Rust library,
CLI, actual WASM module, WebApp and Pipes. Aadhaar and PAN are included alongside
IP, email, phone and payment-card categories. All required checks pass; the change
remains active for user testing and is not archived.

Synthetic fixtures validate complete output, expected replacement counts and
idempotence before measurement. Native and WASM results agree in all 96 cases.
No performance harness or raw sample data is committed.

## Reference environment

- Apple M4, arm64, 16 GiB memory; macOS 27.0.1 (26A434).
- Rust 1.97.1 (8bab26f4f, 2026-07-14); ordinary Cargo release optimization.
- Node.js 24.14.0; wasm-pack 0.15.0; Playwright Chromium 156.0.8078.4, headless.
- Local shared development machine, not an isolated benchmark host. No deliberate
  concurrent builds/tests during the final benchmark runs; OS scheduling,
  browser allocation/GC and temperature remain sources of variation.
- Native harness built offline against the local core crate in release mode.
  CLI is the release binary; browser imports the real generated release WASM
  through the application's typed wrapper, not a mock.

## Reproducible measurement methodology

Disposable Rust and Node harnesses lived under a dedicated temporary directory,
outside the repository. Their source, raw samples and standalone executable were
removed after extracting the summaries below. To repeat, construct the following
fixtures and use the same release builds, loop counts and timing boundaries.

### Fixture construction

All fixtures are exact ASCII byte lengths of 4,096, 65,536, 262,144 and 1,048,576.
Repeat whole rows `floor(size / row_bytes)` times and pad the remainder with ASCII
spaces; never truncate an identifier.

- Clean row: `status=ready route=/health trace=opaque_value action=read success=true\n`.
- Dense row: `10.1.2.3;a@b.io;+919876543210;4111111111111111;234567890124;ABCPD1234E\n`.
  These are synthetic values covering all six categories. One row is 71 bytes.
- Mixed row: the dense row padded with spaces to 512 bytes.
- Adversarial row: 1,024 nines, `; `, 1,024 `a` characters followed by
  `@missing; `, 1,024 colons, and
  `; 234567890123;4111111111111112;ABCZD0000E\n`.
  It contains overlong digits, incomplete email/domain syntax, colon-heavy text,
  invalid checksums and an invalid standalone PAN; it has zero matches.

Selections are all six categories (bitmask 63), email alone (2), and Aadhaar/PAN
(48), each in mask and pseudonym modes. Each recognized category repeats one
canonical value, so pseudonyms are `[TYPE_1]`; there is no unique-identity-heavy
benchmark. Counts are selected categories per row times whole row copies:
64 KiB mixed/all has 768 replacements; dense/all has 5,538. Full expected output
is assembled independently from the known row values, not by running the
sanitizer. First-call output, marker counts and a second sanitization are checked
outside the timer. CLI stdout is also checked on every measured invocation.

### Native core

Use `Instant` with `black_box` around input and result. Record one first-observed
call per case, validate it, warm up 20 times, then collect 201 individual calls.
Sorted indices 100 and 190 give median and p95. Warm timing includes construction
and disposal of the result; first-call timing ends before validation/disposal.
Throughput is input MiB divided by median seconds. A case's first call is not a
fresh process or guarantee of cold caches: earlier cases have already run.

### Fresh CLI

For each 4 KiB fixture and mode, spawn `strapd sanitize pii` with stdin and capture
stdout. Timing includes process launch, parsing, I/O and Node's UTF-8 decoding.
Record the first process, warm up five pairs, then collect 101 pairs, alternating
sanitizer/baseline order. Compute the median and p95 of total times, baseline
times and each paired difference independently.

The baseline is `strapd sanitize pii --aadhaar` on the expected already-rendered
output. It uses the same dispatch, exact-input reader and output writer, with
identical output size. It still scans one category, so the paired difference is
incremental selected work against a comparable identity-transform baseline,
not pure core cost or a no-op process measurement. Negative differences are
measurement noise, not speedups. The large first launch (809 ms) and wide paired
p95s show why fresh-process totals cannot establish precise sub-ms added cost.
Native timing is the stronger evidence for the hot path.

### Actual browser WASM

Load the application wrapper and release WASM in headless Chromium. Record the
first observed wrapper call per case, validate exact output/count/idempotence,
then warm up 20 calls. Collect 101 samples of ten calls each; divide each sample
duration by ten before taking sorted indices 50 and 95. These are median and
p95 of **ten-call batch means**, not an individual-call tail-latency guarantee.
Timer resolution can round first calls to zero. The timer includes the wrapper,
UTF-8 input/output copying and Rust execution, but excludes page load, WASM
download/initialization and React rendering. Throughput uses input bytes.

## Target comparisons

All-category medians are summarized here. Native p95 is an individual-call p95;
WASM p95 is a batch-mean p95.

| Fixture / size | Native mask / pseudonym median (ms) | WASM mask / pseudonym median (ms) |
| --- | --- | --- |
| clean / 4 KiB | 0.021 / 0.019 | 0.040 / 0.030 |
| mixed / 4 KiB | 0.012 / 0.015 | 0.020 / 0.020 |
| dense / 4 KiB | 0.034 / 0.053 | 0.050 / 0.060 |
| adversarial / 4 KiB | 0.014 / 0.013 | 0.020 / 0.020 |
| clean / 64 KiB | 0.344 / 0.340 | 0.530 / 0.560 |
| mixed / 64 KiB | 0.234 / 0.259 | 0.380 / 0.410 |
| dense / 64 KiB | 0.623 / 0.813 | 0.830 / 0.980 |
| adversarial / 64 KiB | 0.228 / 0.228 | 0.380 / 0.380 |
| clean / 1024 KiB | 5.978 / 5.895 | 8.480 / 8.620 |
| mixed / 1024 KiB | 3.875 / 4.466 | 6.170 / 6.310 |
| dense / 1024 KiB | 10.459 / 16.522 | 13.050 / 20.620 |
| adversarial / 1024 KiB | 4.349 / 4.050 | 11.100 / 11.590 |

- Native 64 KiB median ≤0.5 ms and p95 <1 ms: clean and mixed pass in both modes.
  Dense median is 0.623/0.813 ms, missing the stricter 0.5 ms target. Dense
  pseudonym p95 is 1.008 ms, slightly above 1 ms; mask p95 is 0.767 ms.
- Native 1 MiB median <8 ms: clean, mixed and adversarial pass. Dense mask
  10.459 ms and pseudonym 16.522 ms miss this target and are explicit limitations.
  Dense Aadhaar/PAN-only also misses at 8.243/9.293 ms; email-only passes.
- Added CLI 4 KiB median <1 ms: paired medians range from -0.562 to +0.072 ms,
  numerically within target but smaller than subprocess noise. Total median is
  31.162–45.042 ms; do not describe a fresh CLI process as sub-millisecond.
- Warm WASM 64 KiB median ≤1 ms: all tested fixtures/selections/modes pass.
  All-category dense pseudonym is close at 0.980 ms, with batch-mean p95 1.110 ms.
- Throughput and latency are density-, selection-, runtime- and machine-dependent.
  These are measured results, not a universal latency SLA. Native clean input
  can borrow output; the WASM bridge still copies strings.

## Optimization and bounded-growth evidence

Investigated observed hot paths and removed eager canonical allocations, cached
pseudonym token strings per identity, saturated numeric group storage in bounded
arrays, deferred semantic-label work until fallback is needed, and avoided sorting
already ordered disjoint spans. The monotonic scanner consumes overlong numeric
tokens fully and gates colon-prefix attempts to avoid repeatedly rescanning the
same IPv6-like suffix. There is no runtime service or regex compilation.

Early runs overlapped build/test load and are not used for percentage-speedup
claims. The final measurements above validate the optimized implementation.

| Adversarial size | Native mask / pseudonym median (ms) | WASM mask / pseudonym median (ms) |
| --- | --- | --- |
| 4 KiB | 0.014 / 0.013 | 0.020 / 0.020 |
| 64 KiB | 0.228 / 0.228 | 0.380 / 0.380 |
| 256 KiB | 1.095 / 1.163 | 1.720 / 1.720 |
| 1024 KiB | 4.349 / 4.050 | 11.100 / 11.590 |

Native scaling is approximately linear without a suffix-rescan blow-up. WASM
1 MiB samples show additional browser/runtime variance; the results do not
establish a strict linear timing bound for every runtime. Code inspection and
overlong-candidate regressions establish bounded forward progress; neither
fixture covers every hostile input. Dense output rendering and allocation remain
the main measured limitation, especially at 1 MiB. Correctness was not weakened
to meet a latency target.

## Full summarized measurement matrix

These are distribution summaries, not raw timing samples. Times are ms and
throughput is MiB/s. `pseudonym` means pseudonymize mode.

### Native release (201 measured calls per row)

```csv
fixture,bytes,categories,mode,matches,first_ms,median_ms,p95_ms,MiB_s
clean,4096,all,mask,0,0.044,0.021,0.031,186.380
clean,4096,all,pseudonym,0,0.022,0.019,0.025,207.880
clean,4096,email,mask,0,0.024,0.014,0.024,274.910
clean,4096,email,pseudonym,0,0.014,0.016,0.019,245.410
clean,4096,aadhaar+pan,mask,0,0.013,0.015,0.023,264.830
clean,4096,aadhaar+pan,pseudonym,0,0.011,0.012,0.017,337.240
mixed,4096,all,mask,48,0.019,0.012,0.013,316.730
mixed,4096,all,pseudonym,48,0.020,0.015,0.027,254.760
mixed,4096,email,mask,8,0.010,0.009,0.012,426.170
mixed,4096,email,pseudonym,8,0.011,0.010,0.013,397.220
mixed,4096,aadhaar+pan,mask,16,0.012,0.011,0.015,367.650
mixed,4096,aadhaar+pan,pseudonym,16,0.013,0.011,0.016,339.670
dense,4096,all,mask,342,0.044,0.034,0.052,113.500
dense,4096,all,pseudonym,342,0.050,0.053,0.077,73.760
dense,4096,email,mask,57,0.016,0.015,0.026,263.350
dense,4096,email,pseudonym,57,0.019,0.017,0.033,227.560
dense,4096,aadhaar+pan,mask,114,0.025,0.024,0.040,165.640
dense,4096,aadhaar+pan,pseudonym,114,0.029,0.028,0.041,141.620
adversarial,4096,all,mask,0,0.015,0.014,0.019,283.250
adversarial,4096,all,pseudonym,0,0.013,0.013,0.021,299.510
adversarial,4096,email,mask,0,0.008,0.007,0.011,541.860
adversarial,4096,email,pseudonym,0,0.007,0.007,0.012,538.790
adversarial,4096,aadhaar+pan,mask,0,0.013,0.012,0.013,315.660
adversarial,4096,aadhaar+pan,pseudonym,0,0.013,0.014,0.020,274.930
clean,65536,all,mask,0,0.315,0.344,0.398,181.820
clean,65536,all,pseudonym,0,0.318,0.340,0.383,183.710
clean,65536,email,mask,0,0.232,0.260,0.299,240.770
clean,65536,email,pseudonym,0,0.232,0.259,0.311,241.700
clean,65536,aadhaar+pan,mask,0,0.184,0.210,0.256,298.270
clean,65536,aadhaar+pan,pseudonym,0,0.242,0.215,0.271,290.470
mixed,65536,all,mask,768,0.323,0.234,0.308,266.860
mixed,65536,all,pseudonym,768,0.287,0.259,0.327,241.120
mixed,65536,email,mask,128,0.143,0.145,0.180,432.280
mixed,65536,email,pseudonym,128,0.152,0.174,0.205,359.630
mixed,65536,aadhaar+pan,mask,256,0.171,0.190,0.227,328.520
mixed,65536,aadhaar+pan,pseudonym,256,0.178,0.202,0.234,309.210
dense,65536,all,mask,5538,0.577,0.623,0.767,100.320
dense,65536,all,pseudonym,5538,0.713,0.813,1.008,76.880
dense,65536,email,mask,923,0.307,0.262,0.317,238.400
dense,65536,email,pseudonym,923,0.351,0.258,0.346,242.560
dense,65536,aadhaar+pan,mask,1846,0.368,0.407,0.522,153.700
dense,65536,aadhaar+pan,pseudonym,1846,0.528,0.441,0.561,141.880
adversarial,65536,all,mask,0,0.236,0.228,0.260,273.720
adversarial,65536,all,pseudonym,0,0.232,0.228,0.241,273.920
adversarial,65536,email,mask,0,0.116,0.113,0.169,553.710
adversarial,65536,email,pseudonym,0,0.148,0.123,0.182,507.100
adversarial,65536,aadhaar+pan,mask,0,0.217,0.223,0.272,280.110
adversarial,65536,aadhaar+pan,pseudonym,0,0.226,0.230,0.280,272.030
clean,262144,all,mask,0,1.302,1.304,1.426,191.790
clean,262144,all,pseudonym,0,1.298,1.396,1.569,179.040
clean,262144,email,mask,0,1.088,1.059,1.168,235.980
clean,262144,email,pseudonym,0,1.119,1.069,1.232,233.750
clean,262144,aadhaar+pan,mask,0,0.889,0.826,0.992,302.690
clean,262144,aadhaar+pan,pseudonym,0,0.876,0.909,1.123,274.890
mixed,262144,all,mask,3072,0.783,0.780,0.951,320.670
mixed,262144,all,pseudonym,3072,0.987,0.875,1.033,285.660
mixed,262144,email,mask,512,0.628,0.712,0.761,351.120
mixed,262144,email,pseudonym,512,0.746,0.743,0.787,336.530
mixed,262144,aadhaar+pan,mask,1024,0.880,0.842,0.919,296.780
mixed,262144,aadhaar+pan,pseudonym,1024,0.856,0.891,0.946,280.730
dense,262144,all,mask,22152,2.888,2.745,2.984,91.080
dense,262144,all,pseudonym,22152,3.528,3.810,4.059,65.620
dense,262144,email,mask,3692,1.036,1.128,1.207,221.700
dense,262144,email,pseudonym,3692,1.194,1.327,1.406,188.410
dense,262144,aadhaar+pan,mask,7384,2.128,1.851,2.067,135.060
dense,262144,aadhaar+pan,pseudonym,7384,2.230,2.264,2.476,110.420
adversarial,262144,all,mask,0,1.037,1.095,1.205,228.260
adversarial,262144,all,pseudonym,0,0.970,1.163,1.679,214.910
adversarial,262144,email,mask,0,0.684,0.673,0.806,371.260
adversarial,262144,email,pseudonym,0,0.717,0.738,1.103,338.680
adversarial,262144,aadhaar+pan,mask,0,1.287,1.100,1.273,227.200
adversarial,262144,aadhaar+pan,pseudonym,0,1.051,1.090,1.216,229.450
clean,1048576,all,mask,0,5.965,5.978,6.544,167.270
clean,1048576,all,pseudonym,0,5.814,5.895,6.528,169.650
clean,1048576,email,mask,0,4.719,4.289,4.886,233.170
clean,1048576,email,pseudonym,0,4.006,4.236,4.552,236.090
clean,1048576,aadhaar+pan,mask,0,3.822,3.563,4.066,280.650
clean,1048576,aadhaar+pan,pseudonym,0,4.103,3.526,3.946,283.610
mixed,1048576,all,mask,12288,3.574,3.875,4.231,258.070
mixed,1048576,all,pseudonym,12288,4.674,4.466,4.839,223.890
mixed,1048576,email,mask,2048,2.782,2.693,3.754,371.260
mixed,1048576,email,pseudonym,2048,2.441,2.482,2.941,402.870
mixed,1048576,aadhaar+pan,mask,4096,2.713,2.707,3.310,369.430
mixed,1048576,aadhaar+pan,pseudonym,4096,3.023,3.164,3.928,316.050
dense,1048576,all,mask,88608,12.539,10.459,11.954,95.610
dense,1048576,all,pseudonym,88608,15.140,16.522,18.021,60.520
dense,1048576,email,mask,14768,4.571,4.334,4.698,230.740
dense,1048576,email,pseudonym,14768,5.555,5.360,6.401,186.550
dense,1048576,aadhaar+pan,mask,29536,9.029,8.243,10.340,121.320
dense,1048576,aadhaar+pan,pseudonym,29536,8.836,9.293,10.053,107.610
adversarial,1048576,all,mask,0,4.562,4.349,4.643,229.950
adversarial,1048576,all,pseudonym,0,4.242,4.050,4.877,246.930
adversarial,1048576,email,mask,0,2.859,1.918,2.788,521.500
adversarial,1048576,email,pseudonym,0,2.080,2.036,2.893,491.240
adversarial,1048576,aadhaar+pan,mask,0,3.839,3.777,4.216,264.760
adversarial,1048576,aadhaar+pan,pseudonym,0,3.544,3.158,3.690,316.660
```

### Actual WASM (101 ten-call batches per row)

```csv
fixture,bytes,categories,mode,matches,first_ms,median_ms,p95_ms,MiB_s
clean,4096,all,mask,0,2.000,0.040,0.060,97.656
clean,4096,all,pseudonym,0,0.000,0.030,0.040,130.208
clean,4096,email,mask,0,0.100,0.030,0.040,130.208
clean,4096,email,pseudonym,0,0.000,0.030,0.040,130.208
clean,4096,aadhaar+pan,mask,0,0.000,0.030,0.030,130.208
clean,4096,aadhaar+pan,pseudonym,0,0.000,0.020,0.030,195.312
mixed,4096,all,mask,48,0.300,0.020,0.030,195.313
mixed,4096,all,pseudonym,48,0.300,0.020,0.030,195.312
mixed,4096,email,mask,8,0.100,0.020,0.020,195.313
mixed,4096,email,pseudonym,8,0.100,0.020,0.030,195.313
mixed,4096,aadhaar+pan,mask,16,0.000,0.020,0.030,195.313
mixed,4096,aadhaar+pan,pseudonym,16,0.000,0.020,0.030,195.313
dense,4096,all,mask,342,0.100,0.050,0.060,78.125
dense,4096,all,pseudonym,342,0.100,0.060,0.070,65.104
dense,4096,email,mask,57,0.100,0.030,0.040,130.208
dense,4096,email,pseudonym,57,0.100,0.030,0.040,130.208
dense,4096,aadhaar+pan,mask,114,0.100,0.040,0.040,97.656
dense,4096,aadhaar+pan,pseudonym,114,0.100,0.040,0.050,97.656
adversarial,4096,all,mask,0,0.300,0.020,0.030,195.312
adversarial,4096,all,pseudonym,0,0.000,0.020,0.030,195.312
adversarial,4096,email,mask,0,0.000,0.020,0.020,195.313
adversarial,4096,email,pseudonym,0,0.000,0.020,0.020,195.313
adversarial,4096,aadhaar+pan,mask,0,0.000,0.020,0.030,195.313
adversarial,4096,aadhaar+pan,pseudonym,0,0.000,0.020,0.030,195.313
clean,65536,all,mask,0,1.300,0.530,0.580,117.925
clean,65536,all,pseudonym,0,0.500,0.560,0.690,111.607
clean,65536,email,mask,0,0.700,0.530,0.570,117.925
clean,65536,email,pseudonym,0,0.500,0.530,0.660,117.925
clean,65536,aadhaar+pan,mask,0,0.500,0.460,0.480,135.870
clean,65536,aadhaar+pan,pseudonym,0,0.500,0.470,0.620,132.979
mixed,65536,all,mask,768,0.500,0.380,0.460,164.474
mixed,65536,all,pseudonym,768,0.400,0.410,0.430,152.439
mixed,65536,email,mask,128,0.300,0.300,0.340,208.333
mixed,65536,email,pseudonym,128,0.400,0.340,0.350,183.824
mixed,65536,aadhaar+pan,mask,256,0.300,0.340,0.360,183.824
mixed,65536,aadhaar+pan,pseudonym,256,0.400,0.360,0.370,173.611
dense,65536,all,mask,5538,0.800,0.830,0.850,75.301
dense,65536,all,pseudonym,5538,1.200,0.980,1.110,63.776
dense,65536,email,mask,923,0.400,0.480,0.510,130.208
dense,65536,email,pseudonym,923,0.500,0.460,0.520,135.870
dense,65536,aadhaar+pan,mask,1846,0.500,0.520,0.540,120.192
dense,65536,aadhaar+pan,pseudonym,1846,0.700,0.550,0.610,113.636
adversarial,65536,all,mask,0,0.500,0.380,0.390,164.474
adversarial,65536,all,pseudonym,0,0.300,0.380,0.390,164.474
adversarial,65536,email,mask,0,0.200,0.260,0.270,240.385
adversarial,65536,email,pseudonym,0,0.300,0.260,0.270,240.385
adversarial,65536,aadhaar+pan,mask,0,0.300,0.360,0.370,173.611
adversarial,65536,aadhaar+pan,pseudonym,0,0.400,0.360,0.370,173.611
clean,262144,all,mask,0,1.900,1.850,2.070,135.135
clean,262144,all,pseudonym,0,2.100,1.900,2.080,131.579
clean,262144,email,mask,0,1.700,1.680,1.800,148.810
clean,262144,email,pseudonym,0,1.600,1.690,1.870,147.929
clean,262144,aadhaar+pan,mask,0,1.700,1.560,1.670,160.256
clean,262144,aadhaar+pan,pseudonym,0,1.500,1.700,2.060,147.059
mixed,262144,all,mask,3072,1.700,1.510,1.720,165.563
mixed,262144,all,pseudonym,3072,1.700,1.810,2.010,138.122
mixed,262144,email,mask,512,1.300,1.320,1.490,189.394
mixed,262144,email,pseudonym,512,1.400,1.260,1.350,198.413
mixed,262144,aadhaar+pan,mask,1024,1.300,1.240,1.360,201.613
mixed,262144,aadhaar+pan,pseudonym,1024,1.400,1.320,1.460,189.394
dense,262144,all,mask,22152,3.300,3.210,3.430,77.882
dense,262144,all,pseudonym,22152,3.900,3.990,4.450,62.657
dense,262144,email,mask,3692,2.100,1.990,2.140,125.628
dense,262144,email,pseudonym,3692,2.000,2.210,2.270,113.122
dense,262144,aadhaar+pan,mask,7384,2.400,2.420,2.610,103.306
dense,262144,aadhaar+pan,pseudonym,7384,2.700,2.770,2.970,90.253
adversarial,262144,all,mask,0,1.900,1.720,1.730,145.349
adversarial,262144,all,pseudonym,0,1.700,1.720,1.920,145.349
adversarial,262144,email,mask,0,1.200,1.240,1.380,201.613
adversarial,262144,email,pseudonym,0,1.400,1.320,1.530,189.394
adversarial,262144,aadhaar+pan,mask,0,1.700,1.670,1.900,149.701
adversarial,262144,aadhaar+pan,pseudonym,0,1.900,1.620,1.760,154.321
clean,1048576,all,mask,0,8.500,8.480,9.200,117.925
clean,1048576,all,pseudonym,0,8.500,8.620,9.380,116.009
clean,1048576,email,mask,0,7.400,7.570,8.150,132.100
clean,1048576,email,pseudonym,0,7.400,7.520,8.040,132.979
clean,1048576,aadhaar+pan,mask,0,7.200,7.040,7.520,142.045
clean,1048576,aadhaar+pan,pseudonym,0,6.700,6.860,7.410,145.773
mixed,1048576,all,mask,12288,7.500,6.170,6.910,162.075
mixed,1048576,all,pseudonym,12288,6.800,6.310,6.730,158.479
mixed,1048576,email,mask,2048,4.800,4.970,5.310,201.207
mixed,1048576,email,pseudonym,2048,4.900,4.860,5.120,205.761
mixed,1048576,aadhaar+pan,mask,4096,4.200,5.110,5.920,195.695
mixed,1048576,aadhaar+pan,pseudonym,4096,5.200,6.220,7.420,160.772
dense,1048576,all,mask,88608,13.200,13.050,15.670,76.628
dense,1048576,all,pseudonym,88608,15.900,20.620,30.580,48.497
dense,1048576,email,mask,14768,11.900,12.310,13.230,81.235
dense,1048576,email,pseudonym,14768,14.500,13.280,15.130,75.301
dense,1048576,aadhaar+pan,mask,29536,14.800,15.280,18.060,65.445
dense,1048576,aadhaar+pan,pseudonym,29536,8.500,16.830,18.450,59.418
adversarial,1048576,all,mask,0,11.200,11.100,11.670,90.090
adversarial,1048576,all,pseudonym,0,10.800,11.590,12.130,86.281
adversarial,1048576,email,mask,0,9.200,8.800,9.170,113.636
adversarial,1048576,email,pseudonym,0,8.900,7.800,8.780,128.205
adversarial,1048576,aadhaar+pan,mask,0,8.600,10.280,10.660,97.276
adversarial,1048576,aadhaar+pan,pseudonym,0,10.300,10.290,10.460,97.182
```

### Fresh CLI (101 alternating pairs per row, 4 KiB, all categories)

| Fixture | Mode | Matches | First ms | Total median / p95 ms | Baseline median / p95 ms | Paired added median / p95 ms | Total MiB/s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| clean | mask | 0 | 808.697 | 45.042 / 64.227 | 45.790 / 70.246 | -0.562 / 12.809 | 0.087 |
| clean | pseudonym | 0 | 32.787 | 37.187 / 62.603 | 38.131 / 61.722 | -0.344 / 11.459 | 0.105 |
| mixed | mask | 48 | 32.747 | 31.162 / 36.537 | 31.211 / 36.576 | -0.059 / 3.467 | 0.125 |
| mixed | pseudonym | 48 | 31.108 | 34.404 / 45.344 | 34.652 / 49.422 | 0.041 / 3.910 | 0.114 |
| dense | mask | 342 | 30.301 | 39.494 / 65.170 | 38.893 / 65.170 | -0.147 / 20.726 | 0.099 |
| dense | pseudonym | 342 | 60.816 | 43.810 / 76.354 | 44.316 / 77.813 | -0.284 / 21.012 | 0.089 |
| adversarial | mask | 0 | 37.643 | 37.383 / 46.402 | 37.287 / 54.772 | 0.017 / 5.544 | 0.104 |
| adversarial | pseudonym | 0 | 37.790 | 35.846 / 42.926 | 35.558 / 42.946 | 0.072 / 4.686 | 0.109 |

## Specification audit and functional evidence

| Requirement | Implementation and evidence |
| --- | --- |
| Category/mode selection | Core `Categories` and `Mode`; CLI argument contracts; wrapper, component and Pipes tests cover all, unions, conflicts, empty selection, mask defaults and Indian-only pseudonyms. |
| Exact masking / UTF-8 / overlaps | Shared `spans.rs` renderer and monotonic scanner; core PII regressions cover punctuation, CRLF, Unicode, markers, unchanged text, specific-identifier precedence and overlong numeric boundaries. Existing 42 secret-sanitizer tests remain passing after the shared refactor. |
| Invocation-local relationships | Core category-scoped identity map and cached ordinal tokens; fixtures cover repeated/distinct values, formatting equivalence, exact email local parts, folded domains/PAN, parsed IPs, explicit phone prefix/extensions, deterministic runs and idempotence. |
| IP / email / phone | Dedicated contact and numeric recognition; semantic boundaries, brackets/ports/CIDR, explicit international prefixes, local labels, formatted numbers and extensions tested. No country inference or remote verification. |
| Payment cards | Digit count/grouping and Luhn, explicit-label fallback; malformed standalone values and metadata exclusions tested. |
| Aadhaar | Exact 12-digit / 4-4-4 grouping and Verhoeff, UID/Aadhaar fallback, existing masked-display preservation and canonical digit identity tested. |
| PAN | Ten-character shape, documented holder types/nonzero series, explicit-label fallback, case folding and adjoining-token exclusions tested. |
| Shared/local interfaces | CLI handlers and coarse WASM export call the same core. Browser tests compare native CLI to real WASM across categories/modes and UTF-8. Benchmarks validate complete known output in both runtimes. Production detector source uses no networking or identifier lookup. |
| CLI contract/privacy | Positional precedence, still-open stdin, exact whitespace, empty pipe, modes, safe category conflicts and help are automated; interactive missing-input error checked manually. Success stdout has only sanitized text plus the normal newline. |
| WebApp/Pipes privacy and composition | Real component, discovery/URL privacy and save/reload/export/import tests; real-browser Indian-only frozen pseudonym pipe followed by lowercase. Runtime text is absent from exported configuration. |
| Accessible/responsive UI | Browser checks cover keyboard controls, copying, reset, read-only output, 375 px/desktop, light/dark themes and no page-level overflow. Independent Impeccable finishing review disposition: `ship`, no material fixes. Existing Security tool layout retained. |
| Negligible measured latency | Complete native/WASM matrix and paired CLI table above, explicit target misses, optimization and adversarial evidence. |
| Visible limits | CLI long help, `docs/sanitize-pii.md`, README and tool coverage notice explain finite coverage, local operation, pseudonym scope, syntactic/checksum-vs-issued distinction and lack of verification services. |

Independent correctness review findings were resolved with compact-extension,
quote-boundary and numbered-label regressions. Final review found no confirmed
correctness/privacy/overlap findings.

## Verification commands and results

- `TZ=UTC cargo test --workspace --quiet`: full Rust workspace passes.
  737 tests pass. UTC is needed for an existing unrelated timestamp test that
  assumes UTC.
- Focused core PII and existing secrets: 49 passing tests; CLI PII: 3 passing
  tests, including long-help and exact-input contracts.
- `cargo fmt --all -- --check` and `make lint`: pass (Rust Clippy and WebApp Biome).
- `make cli-release`, `make wasm-build`, `make webapp-build`: pass.
- `TZ=UTC STRAPD_BIN=target/release/strapd bash scripts/smoke-test-cli.sh`:
  99 pass, 1 clipboard skip (no usable graphical clipboard), 0 fail.
- `pnpm test --run --maxWorkers=2`: 335 tests across 29 files pass. Worker
  limiting avoids host contention observed with an unconstrained 29-worker run.
- Relevant real-browser PII and secret-sanitizer tests: 9 pass.
- `openspec validate gh-34-sanitize-pii --strict` and `git diff --check`: pass.

Supplemental `cargo clippy --workspace --all-targets -- -D warnings` reports two
pre-existing `manual_range_contains` warnings in
`crates/cli/tests/random_cli.rs` (lines 102/117). Required project lint passes;
unrelated test code was not modified. Existing Vite bundle-size and home-page
nested-button warnings remain; the new sanitizer does not introduce nested buttons.
No new feature validation failure remains.

Temporary measurement scripts and raw data were removed, and staging was audited
to exclude them. Generated build output is ignored. The OpenSpec change stays
active for the user's manual testing; no archive, push or deployment is performed.

## Follow-up: straight-apostrophe email boundaries

The initial matrices above describe the implementation at `445d43c`. This
follow-up fixes a missed email before a straight apostrophe followed by letters,
matching the existing curly-apostrophe behavior. These measurements describe
the final follow-up scanner, not a remeasurement of the entire initial matrix.

### Correctness and scope

A straight apostrophe after `@` now ends the original email candidate; supported
apostrophes before `@` stay inside the local part. Only the email span is
replaced, preserving `'s`, `’s` and quote delimiters. The scan resumes after the
delimiter, so adjacent addresses are not skipped. Category flags, public APIs,
canonical identity, Pipes configuration and dependencies are unchanged. The
scanner adds one per-token boolean, set when it encounters `@`; there is no
additional input pass or allocation for this boundary check.

The new core regression failed on the pre-fix implementation and passes after
the fix. Synthetic cases cover straight/curly possessives, local-part apostrophes,
domain case folding and repeated pseudonyms, quoted/adjacent addresses, invalid
domains, category isolation, idempotence and a suffix longer than 1,024 bytes.
CLI tests cover stdin masking and positional pseudonyms. Real browser tests
assert known expected output independently for actual WASM and the release CLI
in both modes. An independent correctness review found no confirmed defect.

### Follow-up performance method

Same hardware/toolchain as the reference environment above. A disposable release
harness depended on the local core crate with the same temporary Cargo lockfile
for both versions. Save its compiled pre-fix executable before touching the
scanner, then rebuild the identical harness against the final scanner. Run three
rounds of each binary, alternating order by round (before/after, after/before,
before/after). Do not run builds or tests during final timing. The shared machine
is still subject to frequency, scheduling and background-load variation.

Each case uses all categories, both modes, one first-observed call, 20 warmups
and 201 individually timed calls. Validate independently assembled full output,
known marker counts and idempotence outside the timing region, as in the initial
method. Report the median across the three per-run first-call, median, p95 and
throughput values; these are **medians of run summaries**, not a pooled
distribution or a confidence interval. Each before/after distribution has 603
measured warm calls per case.

Clean, mixed and dense fixtures are the same exact-size rows as the initial
measurement. Additional rows are:

- Apostrophe-heavy:
  `o'connor@example.com's alice@EXAMPLE.com's alice@example.com’s\n`.
  Count UTF-8 bytes, repeat whole rows and pad with ASCII spaces to 65,536 bytes.
  There are 1,008 rows. Pre-fix output replaces only the curly-apostrophe address
  (1,008 matches); fixed output replaces all three (3,024 matches), including
  the apostrophe-bearing local part. The two Alice addresses share one pseudonym.
- Adversarial: 1,024 `a` characters, `@missing's `, 1,024 colons, `; `,
  1,024 nines and newline. Repeat whole rows and pad to 64 KiB, 256 KiB and 1 MiB.
  There are no matches in either version. This exercises invalid, overlong
  email candidates followed by apostrophes and long colon/numeric runs.

Browser timings use final release WASM through the actual typed wrapper in
Chromium 156.0.8078.4: 20 warmups, 101 ten-call batches, sorted indices 50/95.
First call includes possible first-use/JIT effects; median/p95 are per-call
**batch means**, not single-call tail latency. Exact expected output, counts and
idempotence are validated before timing. String transfer is included; page load,
module initialization and React rendering are excluded. No pre-fix WASM A/B was
performed: earlier-browser numbers are historical context, not a causal delta.

### Results and limitations

- Native 64 KiB clean medians increase from 0.370/0.356 ms to 0.393/0.401 ms
  (mask/pseudonym): approximately +0.022/+0.045 ms in this three-round comparison.
  This is a small measured cost, not a zero-cost claim. The clean/pseudonym
  per-run medians range 0.343–0.392 ms before and 0.357–0.407 ms after; overlapping
  ranges and changes in other fixtures limit attribution of small deltas.
- Native mixed medians are 0.223/0.251 ms; both clean and mixed still meet the
  ≤0.5 ms median and <1 ms p95 targets. Mixed/dense apparent improvements should
  not be read as guaranteed speedups on an uncontrolled shared machine.
- Dense native 64 KiB medians are 0.730/0.872 ms: both still miss the stricter
  0.5 ms median target, as documented for the initial implementation.
- The fixed apostrophe-heavy native medians are 0.632/0.970 ms, versus
  0.640/0.688 ms before. This is not equivalent work: the fix replaces three
  times as many values. Both exceed the 0.5 ms native median target.
  Native pseudonym p95 is 1.283 ms, above the 1 ms target.
- Native adversarial medians scale from 0.322/0.310 ms (64 KiB), through
  1.320/1.315 ms (256 KiB), to 5.299/5.331 ms (1 MiB), demonstrating approximately
  linear forward progress. The 1 MiB values are below 8 ms but slower than this
  comparison's pre-fix 4.370/4.762 ms; the refinement is not universally faster.
- Warm WASM mixed medians are 0.380/0.430 ms, within 1 ms. Clean, mixed,
  adversarial and apostrophe-heavy mask cases meet the 64 KiB median target.
  Dense pseudonyms (1.100 ms) and apostrophe-heavy pseudonyms (1.290 ms)
  **miss the 1 ms median target in the final browser run**. Earlier exploratory
  runs varied; this final result is retained rather than choosing a faster run.
- Investigated the initial per-byte state-update cost and changed it to set
  state only upon `@`. This remains a finite single-scan refinement, without
  a general-purpose parser or weakened correctness. The measurements establish
  typical sub-ms latency, not a universal sub-ms guarantee.
- Only the relevant core and actual-WASM hot paths were remeasured. Initial
  fresh CLI process/startup and full category-selection measurements remain
  historical evidence; no new added-CLI-cost claim is made for this follow-up.

### Native summarized distributions

```csv
fixture,bytes,mode,before_matches,after_matches,before_first_ms,after_first_ms,before_median_ms,after_median_ms,before_p95_ms,after_p95_ms,before_MiB_s,after_MiB_s
clean,65536,mask,0,0,0.548,0.386,0.370,0.393,0.443,0.439,168.770,159.130
clean,65536,pseudonym,0,0,0.375,0.384,0.356,0.401,0.458,0.436,175.560,155.700
mixed,65536,mask,768,768,0.309,0.255,0.243,0.223,0.301,0.275,257.290,279.690
mixed,65536,pseudonym,768,768,0.300,0.247,0.284,0.251,0.342,0.313,220.070,248.760
dense,65536,mask,5538,5538,0.757,0.677,0.737,0.730,0.838,0.792,84.770,85.620
dense,65536,pseudonym,5538,5538,1.074,0.888,0.998,0.872,1.114,0.976,62.610,71.670
apostrophe,65536,mask,1008,3024,0.774,0.621,0.640,0.632,0.743,0.817,97.710,98.840
apostrophe,65536,pseudonym,1008,3024,0.732,0.984,0.688,0.970,0.826,1.283,90.800,64.430
adversarial,65536,mask,0,0,0.308,0.286,0.306,0.322,0.365,0.383,204.050,194.270
adversarial,65536,pseudonym,0,0,0.347,0.273,0.304,0.310,0.359,0.379,205.480,201.450
adversarial,262144,mask,0,0,1.323,1.229,1.172,1.320,1.320,1.728,213.270,189.380
adversarial,262144,pseudonym,0,0,1.252,1.262,1.184,1.315,1.353,1.693,211.190,190.190
adversarial,1048576,mask,0,0,4.508,5.321,4.370,5.299,5.218,6.303,228.850,188.700
adversarial,1048576,pseudonym,0,0,4.418,5.363,4.762,5.331,5.102,6.067,209.980,187.590
```

### Actual WASM summarized distributions

```csv
fixture,bytes,mode,matches,first_ms,median_ms,p95_ms,MiB_s
clean,65536,mask,0,5.100,0.620,0.730,100.806
clean,65536,pseudonym,0,0.500,0.560,0.670,111.607
mixed,65536,mask,768,0.700,0.380,0.390,164.474
mixed,65536,pseudonym,768,1.000,0.430,0.430,145.349
dense,65536,mask,5538,1.000,0.820,0.950,76.220
dense,65536,pseudonym,5538,1.300,1.100,1.510,56.818
apostrophe,65536,mask,3024,2.400,0.960,1.180,65.104
apostrophe,65536,pseudonym,3024,2.500,1.290,1.530,48.450
adversarial,65536,mask,0,0.500,0.520,0.610,120.192
adversarial,65536,pseudonym,0,0.500,0.520,0.540,120.192
adversarial,262144,mask,0,2.300,2.080,2.160,120.192
adversarial,262144,pseudonym,0,2.100,2.150,2.410,116.279
adversarial,1048576,mask,0,8.800,8.550,9.310,116.959
adversarial,1048576,pseudonym,0,8.400,8.640,10.060,115.741
```

### Final verification and cleanup

- Final Rust workspace: 739 tests pass with
  `TZ=UTC cargo test --workspace --quiet -- --test-threads=1`.
  An earlier concurrent-build run exceeded an existing input CLI subprocess
  deadline; the serial final run passes without changing that test or timeout.
- Core PII: 8 tests; existing secrets: 42; CLI PII: 4; all pass.
- Real browser PII/secret sanitizer tests: 10 pass on the rebuilt final WASM.
- Formatting, `make lint`, release CLI build, WASM build, WebApp build and strict
  OpenSpec validation pass. Release smoke: 99 pass, 1 clipboard skip, 0 fail.
- No UI production code changed. Existing bundle-size/home-page warnings remain.
- Temporary harness sources, binaries and measurement data were removed.
  Only these summarized results and methodology are committed. The change
  remains active; no archive or push is performed.
