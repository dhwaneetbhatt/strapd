# GH-43 verification

Status: implementation and validation complete; requirements synced and change
archived for review in PR #44. Versions are unchanged. No tag or release was
published.

## Scope and correctness

Implemented issue #43 items 1–4: public resolved `pii::detect` byte spans,
packed browser WASM detection, issuer/length checks
for unlabelled cards, compact numeric JSON, and Amex/Diners grouping. Exact
`card` labels gain the same plausible-value fallback as `card_number`.

Optional item 5 (Unicode emails) is deferred. Unicode alphanumeric support was
prototyped but is outside the final patch
to keep the latency-sensitive scanner change focused. Early combined experiments
showed increased ASCII latency; a later controlled comparison isolated the
JSON colon branch as a separate source of overhead and eliminated it. This patch
keeps the established ASCII-only email contract; UTF-8 surrounding text and byte
ranges remain supported.

- Detection/mask/pseudonym span parity passes for all 64 category selections.
- Regression fixtures cover compact and spaced JSON, labelled invalid values,
  Amex 4-6-5, Diners 4-6-4, issuer-range endpoints and adjacent invalid ranges,
  wrong brand lengths, IPv6/ports, boundaries, category isolation and idempotence.
- A thread-local counting allocator verifies zero allocations for clean native
  detection and both sanitizer modes, including empty and UTF-8 input.
- Deterministic xorshift seed 43: 276/10,000 random 16-digit strings match as
  cards (2.76%); 0/10,000 epoch-ms values between 2020 and 2030 match.
  These rates describe synthetic identifiers,
  not a recall/precision guarantee on a production corpus.
- Independent read-only correctness review found no blockers, including after
  Unicode support was removed. Earlier review also exercised 30,000 deterministic
  mixed Unicode/punctuation/numeric inputs without traps or invalid span ranges.

## Checks

| Check | Result |
| --- | --- |
| Rust workspace tests (`TZ=UTC`, one test thread) | 760 passed |
| WebApp tests | 339 passed across 30 files |
| Browser suite, final rebuilt WASM, one worker | 15 passed |
| CLI smoke script | 99 passed, 1 clipboard skip, 0 failed |
| Rust formatting and clippy | Passed |
| WebApp lint and production build | Passed |
| Browser WASM and release CLI builds | Passed |
| Strict OpenSpec validation and diff whitespace check | Passed |

One parallel browser run timed out in an existing mobile delete-dialog test.
A subsequent existing secrets keyboard test exposed a test-action focus race:
`focus()` left the active element on a DIV, so page-level Space missed the
checkbox. Three focused diagnostics reproduced this; locator-level `press()`
reached the checkbox and toggled it correctly. That test now uses locator-level
Space for both toggles with its existing output assertions unchanged. An
intermediate Rust run hit the existing
local-time-sensitive epoch assertion; rerunning with UTC passed. Neither test
was weakened. Chromium and wasm-opt needed execution outside the macOS sandbox.
Generated browser test artifacts were moved to `/private/tmp` before linting:
Biome currently includes that ignored generated directory. Existing Vite
plugin and bundle-size notices remain. Clipboard integration was unavailable.

## Measurement method

Reference: macOS 27.2.1 (26B131), arm64, Rust 1.97.1, Node 24.22.3,
wasm-pack 0.15.0 and installed Playwright Chromium.
This is a shared development machine; distributions are evidence, not an SLA.
No Presidio comparison was rerun and no speedup claim is inferred.

A disposable Rust benchmark reproduced the archived GH-34 method: exact 4 KiB, 64 KiB, 256 KiB and 1 MiB fixtures made by repeating whole
rows and padding with spaces, never truncating identifiers. Clean, mixed, dense
and adversarial rows are the same as that report. All categories, email only,
and Aadhaar/PAN are each measured in mask and pseudonym mode (96 cases).
Expected complete output, replacement counts, borrowed clean output and
idempotence are checked before timing. Native timings include result disposal:
one first-observed call, 20 warmups, 201 samples, sorted indexes 100/190 for
median/p95. The benchmark source and Make target were removed during review;
repeat measurements using these fixture and timing definitions.

A disposable Playwright harness checked the same 96 complete outputs through
the real browser wrapper and final release WASM. It recorded first-observed
calls, 20 warmups, then 101 batches of ten calls. Browser p95 is a percentile
of batch means, not an individual-request tail guarantee; timer quantization
can round first-observed calls to zero. Timings exclude module initialization,
download and React rendering but include wrapper and UTF-8 copies.

Fresh CLI timing follows GH-34: eight 4 KiB fixture/mode combinations, first
process, five warmup pairs, then 101 alternating sanitizer/baseline pairs.
Baseline is `sanitize pii --aadhaar` applied to independently expected output
with the same final output size. Every invocation's stdout is verified. Paired
differences include process/scheduling noise and are not pure core overhead.

Native, browser and CLI summarized matrices and target comparisons follow.

## Results and target comparison

Final native timing used the workspace release build with no concurrent builds or
browser tests. The initial leading-colon check in the outer scanner loop was
rejected after it raised clean 64 KiB latency to about 0.24 ms. Moving the check
into the existing colon handler avoids that extra clean-input branch. A separate
source-only, same-compiler comparison measured clean mask/pseudonym medians of
0.160/0.161 ms at HEAD and 0.164/0.162 ms after the fix; dense medians were
0.299/0.394 ms before and 0.291/0.384 ms after. These are local comparisons,
not a claim that every input has identical latency.

All-category 64 KiB results (milliseconds):

| Fixture | Native mask median / p95 | Native pseudonym median / p95 | Browser mask median / p95 | Browser pseudonym median / p95 |
| --- | --- | --- | --- | --- |
| clean | 0.164 / 0.193 | 0.163 / 0.196 | 0.280 / 0.310 | 0.280 / 0.310 |
| mixed | 0.110 / 0.136 | 0.127 / 0.142 | 0.200 / 0.220 | 0.220 / 0.240 |
| dense | 0.295 / 0.316 | 0.383 / 0.400 | 0.440 / 0.460 | 0.570 / 0.620 |
| adversarial | 0.126 / 0.134 | 0.126 / 0.132 | 0.220 / 0.240 | 0.220 / 0.230 |

- Native 64 KiB median ≤0.5 ms and p95 <1 ms: every fixture/selection/mode
  passes (maximum median 0.383 ms, maximum p95 0.400 ms).
- Native 1 MiB median <8 ms: every measured case passes; maximum 6.504 ms.
- Warm browser WASM 64 KiB median ≤1 ms: every case passes; maximum
  0.570 ms. Browser p95 values are batch-mean percentiles.
- Fresh CLI total medians are 21.018–22.095 ms.
  Paired added medians are -0.149–0.098 ms,
  numerically below 1 ms but within substantial subprocess/scheduling noise.
  Negative differences are noise, not speedups; fresh CLI launch is not sub-ms.

### Native release matrix

```csv
fixture,bytes,categories,mode,matches,first_ms,median_ms,p95_ms,MiB_s
clean,4096,all,Mask,0,0.080917,0.022458,0.026750,173.936000
clean,4096,all,Pseudonymize,0,0.022583,0.018875,0.019291,206.954000
clean,4096,email,Mask,0,0.015333,0.014334,0.014417,272.516000
clean,4096,email,Pseudonymize,0,0.014792,0.012667,0.014334,308.380000
clean,4096,aadhaar+pan,Mask,0,0.011417,0.010667,0.010792,366.199000
clean,4096,aadhaar+pan,Pseudonymize,0,0.010834,0.010667,0.010875,366.199000
mixed,4096,all,Mask,48,0.017584,0.010958,0.011083,356.475000
mixed,4096,all,Pseudonymize,48,0.016750,0.012125,0.012292,322.165000
mixed,4096,email,Mask,8,0.008625,0.006833,0.007459,571.674000
mixed,4096,email,Pseudonymize,8,0.008209,0.007250,0.007333,538.793000
mixed,4096,aadhaar+pan,Mask,16,0.009125,0.007792,0.008000,501.315000
mixed,4096,aadhaar+pan,Pseudonymize,16,0.009542,0.008458,0.008583,461.841000
dense,4096,all,Mask,342,0.032791,0.023792,0.025792,164.183000
dense,4096,all,Pseudonymize,342,0.034042,0.030292,0.032083,128.953000
dense,4096,email,Mask,57,0.010583,0.009500,0.009625,411.184000
dense,4096,email,Pseudonymize,57,0.011833,0.010583,0.011083,369.106000
dense,4096,aadhaar+pan,Mask,114,0.015375,0.014292,0.014500,273.317000
dense,4096,aadhaar+pan,Pseudonymize,114,0.016500,0.015375,0.015584,254.065000
adversarial,4096,all,Mask,0,0.008792,0.007209,0.007292,541.857000
adversarial,4096,all,Pseudonymize,0,0.008791,0.007208,0.007292,541.933000
adversarial,4096,email,Mask,0,0.004459,0.004209,0.004292,928.071000
adversarial,4096,email,Pseudonymize,0,0.004292,0.004167,0.004250,937.425000
adversarial,4096,aadhaar+pan,Mask,0,0.006958,0.006792,0.006875,575.125000
adversarial,4096,aadhaar+pan,Pseudonymize,0,0.006833,0.006791,0.006875,575.210000
clean,65536,all,Mask,0,0.176208,0.163833,0.193041,381.486000
clean,65536,all,Pseudonymize,0,0.172250,0.163334,0.196125,382.651000
clean,65536,email,Mask,0,0.134333,0.130666,0.148458,478.319000
clean,65536,email,Pseudonymize,0,0.139208,0.129208,0.135166,483.716000
clean,65536,aadhaar+pan,Mask,0,0.107125,0.106083,0.120750,589.161000
clean,65536,aadhaar+pan,Pseudonymize,0,0.108292,0.109708,0.114209,569.694000
mixed,65536,all,Mask,768,0.140417,0.110417,0.136458,566.036000
mixed,65536,all,Pseudonymize,768,0.134459,0.126709,0.142083,493.256000
mixed,65536,email,Mask,128,0.083125,0.084583,0.090291,738.919000
mixed,65536,email,Pseudonymize,128,0.092875,0.088834,0.094791,703.559000
mixed,65536,aadhaar+pan,Mask,256,0.097625,0.095750,0.100917,652.742000
mixed,65536,aadhaar+pan,Pseudonymize,256,0.097417,0.100958,0.107167,619.069000
dense,65536,all,Mask,5538,0.309833,0.295291,0.315875,211.656000
dense,65536,all,Pseudonymize,5538,0.379000,0.382750,0.399958,163.292000
dense,65536,email,Mask,923,0.138208,0.131083,0.138125,476.797000
dense,65536,email,Pseudonymize,923,0.150750,0.144209,0.151625,433.399000
dense,65536,aadhaar+pan,Mask,1846,0.203875,0.203833,0.209959,306.624000
dense,65536,aadhaar+pan,Pseudonymize,1846,0.236875,0.229084,0.239375,272.826000
adversarial,65536,all,Mask,0,0.134750,0.126084,0.134166,495.701000
adversarial,65536,all,Pseudonymize,0,0.127208,0.126000,0.131917,496.032000
adversarial,65536,email,Mask,0,0.068625,0.067333,0.070750,928.222000
adversarial,65536,email,Pseudonymize,0,0.067833,0.067291,0.070625,928.802000
adversarial,65536,aadhaar+pan,Mask,0,0.122958,0.119458,0.134500,523.196000
adversarial,65536,aadhaar+pan,Pseudonymize,0,0.134459,0.119500,0.137125,523.013000
clean,262144,all,Mask,0,0.660959,0.641333,0.660542,389.813000
clean,262144,all,Pseudonymize,0,0.616542,0.606250,0.629458,412.371000
clean,262144,email,Mask,0,0.484709,0.482459,0.501000,518.179000
clean,262144,email,Pseudonymize,0,0.480083,0.507750,0.529542,492.368000
clean,262144,aadhaar+pan,Mask,0,0.412334,0.421375,0.436583,593.296000
clean,262144,aadhaar+pan,Pseudonymize,0,0.415208,0.421000,0.433750,593.824000
mixed,262144,all,Mask,3072,0.414250,0.395750,0.411000,631.712000
mixed,262144,all,Pseudonymize,3072,0.447834,0.459084,0.469833,544.563000
mixed,262144,email,Mask,512,0.330750,0.311125,0.322834,803.536000
mixed,262144,email,Pseudonymize,512,0.324125,0.323000,0.333667,773.994000
mixed,262144,aadhaar+pan,Mask,1024,0.342833,0.343459,0.354625,727.889000
mixed,262144,aadhaar+pan,Pseudonymize,1024,0.366750,0.365917,0.377000,683.215000
dense,262144,all,Mask,22152,1.199334,1.186459,1.240375,210.711000
dense,262144,all,Pseudonymize,22152,1.502875,1.522333,1.552458,164.222000
dense,262144,email,Mask,3692,0.514541,0.517291,0.540417,483.287000
dense,262144,email,Pseudonymize,3692,0.586667,0.579667,0.648208,431.282000
dense,262144,aadhaar+pan,Mask,7384,0.816042,0.792958,0.813209,315.275000
dense,262144,aadhaar+pan,Pseudonymize,7384,0.927916,0.925833,0.969000,270.027000
adversarial,262144,all,Mask,0,0.519917,0.516917,0.531250,483.637000
adversarial,262144,all,Pseudonymize,0,0.517500,0.516958,0.533000,483.598000
adversarial,262144,email,Mask,0,0.271459,0.268584,0.278667,930.807000
adversarial,262144,email,Pseudonymize,0,0.272083,0.269375,0.279917,928.074000
adversarial,262144,aadhaar+pan,Mask,0,0.500333,0.489834,0.508625,510.377000
adversarial,262144,aadhaar+pan,Pseudonymize,0,0.496041,0.492250,0.505291,507.872000
clean,1048576,all,Mask,0,2.603417,2.549583,2.628292,392.221000
clean,1048576,all,Pseudonymize,0,2.362208,2.527500,2.609000,395.648000
clean,1048576,email,Mask,0,1.986292,2.026000,2.568750,493.583000
clean,1048576,email,Pseudonymize,0,2.084083,2.025375,2.747125,493.736000
clean,1048576,aadhaar+pan,Mask,0,1.781500,1.659708,1.719208,602.516000
clean,1048576,aadhaar+pan,Pseudonymize,0,1.682834,1.684250,1.756958,593.736000
mixed,1048576,all,Mask,12288,1.623583,1.554584,1.589500,643.259000
mixed,1048576,all,Pseudonymize,12288,1.822500,1.783375,1.833458,560.735000
mixed,1048576,email,Mask,2048,1.255417,1.228583,1.280291,813.946000
mixed,1048576,email,Pseudonymize,2048,1.274792,1.288458,1.339459,776.122000
mixed,1048576,aadhaar+pan,Mask,4096,1.402417,1.477167,1.892333,676.972000
mixed,1048576,aadhaar+pan,Pseudonymize,4096,1.503792,1.501666,1.616042,665.927000
dense,1048576,all,Mask,88608,4.943583,5.015500,5.191375,199.382000
dense,1048576,all,Pseudonymize,88608,6.451167,6.504334,7.199375,153.744000
dense,1048576,email,Mask,14768,2.230583,2.092042,2.222833,478.002000
dense,1048576,email,Pseudonymize,14768,2.316708,2.322458,2.656750,430.578000
dense,1048576,aadhaar+pan,Mask,29536,3.337667,3.238000,3.391875,308.833000
dense,1048576,aadhaar+pan,Pseudonymize,29536,3.630125,3.680458,3.790167,271.705000
adversarial,1048576,all,Mask,0,2.099750,2.081541,2.117208,480.413000
adversarial,1048576,all,Pseudonymize,0,2.088000,2.085916,2.130666,479.406000
adversarial,1048576,email,Mask,0,1.103208,1.082792,1.106625,923.538000
adversarial,1048576,email,Pseudonymize,0,1.096958,1.081958,1.103542,924.250000
adversarial,1048576,aadhaar+pan,Mask,0,1.976917,1.971791,2.020334,507.153000
adversarial,1048576,aadhaar+pan,Pseudonymize,0,1.960000,1.971000,2.000917,507.357000
```

### Actual browser WASM matrix

```csv
fixture,bytes,categories,pseudonym,matches,first_ms,median_ms,p95_ms,MiB_s
clean,4096,63,false,0,1.300000,0.020000,0.040000,195.312504
clean,4096,63,true,0,0.000000,0.020000,0.030000,195.312504
clean,4096,2,false,0,0.000000,0.010000,0.020000,390.624994
clean,4096,2,true,0,0.100000,0.010000,0.020000,390.624994
clean,4096,48,false,0,0.000000,0.010000,0.020000,390.624994
clean,4096,48,true,0,0.100000,0.010000,0.020000,390.624994
mixed,4096,63,false,48,0.100000,0.010000,0.020000,390.624994
mixed,4096,63,true,48,0.200000,0.010000,0.020000,390.624994
mixed,4096,2,false,8,0.000000,0.010000,0.020000,390.624994
mixed,4096,2,true,8,0.000000,0.010000,0.020000,390.624994
mixed,4096,48,false,16,0.100000,0.010000,0.020000,390.624994
mixed,4096,48,true,16,0.000000,0.010000,0.020000,390.624994
dense,4096,63,false,342,0.100000,0.030000,0.040000,130.208335
dense,4096,63,true,342,0.000000,0.040000,0.050000,97.656250
dense,4096,2,false,57,0.000000,0.020000,0.020000,195.312504
dense,4096,2,true,57,0.000000,0.020000,0.020000,195.312504
dense,4096,48,false,114,0.000000,0.020000,0.030000,195.312497
dense,4096,48,true,114,0.000000,0.020000,0.040000,195.312497
adversarial,4096,63,false,0,0.100000,0.010000,0.020000,390.624994
adversarial,4096,63,true,0,0.000000,0.010000,0.020000,390.624994
adversarial,4096,2,false,0,0.000000,0.010000,0.020000,390.624994
adversarial,4096,2,true,0,0.000000,0.010000,0.020000,390.624994
adversarial,4096,48,false,0,0.000000,0.010000,0.020000,390.624994
adversarial,4096,48,true,0,0.000000,0.010000,0.020000,390.624994
clean,65536,63,false,0,0.800000,0.280000,0.310000,223.214286
clean,65536,63,true,0,0.200000,0.280000,0.310000,223.214286
clean,65536,2,false,0,0.300000,0.240000,0.270000,260.416667
clean,65536,2,true,0,0.200000,0.240000,0.250000,260.416667
clean,65536,48,false,0,0.200000,0.220000,0.230000,284.090909
clean,65536,48,true,0,0.200000,0.220000,0.240000,284.090909
mixed,65536,63,false,768,0.200000,0.200000,0.220000,312.500000
mixed,65536,63,true,768,0.200000,0.220000,0.240000,284.090910
mixed,65536,2,false,128,0.200000,0.170000,0.180000,367.647058
mixed,65536,2,true,128,0.200000,0.180000,0.180000,347.222223
mixed,65536,48,false,256,0.100000,0.190000,0.200000,328.947369
mixed,65536,48,true,256,0.300000,0.190000,0.200000,328.947369
dense,65536,63,false,5538,0.500000,0.440000,0.460000,142.045454
dense,65536,63,true,5538,0.600000,0.570000,0.620000,109.649123
dense,65536,2,false,923,0.200000,0.230000,0.240000,271.739131
dense,65536,2,true,923,0.200000,0.250000,0.260000,250.000000
dense,65536,48,false,1846,0.300000,0.310000,0.320000,201.612903
dense,65536,48,true,1846,0.400000,0.350000,0.360000,178.571429
adversarial,65536,63,false,0,0.200000,0.220000,0.240000,284.090909
adversarial,65536,63,true,0,0.200000,0.220000,0.230000,284.090909
adversarial,65536,2,false,0,0.200000,0.150000,0.160000,416.666667
adversarial,65536,2,true,0,0.200000,0.150000,0.160000,416.666667
adversarial,65536,48,false,0,0.300000,0.210000,0.220000,297.619047
adversarial,65536,48,true,0,0.200000,0.210000,0.220000,297.619047
clean,262144,63,false,0,1.000000,0.960000,0.980000,260.416667
clean,262144,63,true,0,0.900000,0.960000,0.980000,260.416667
clean,262144,2,false,0,0.800000,0.860000,0.880000,290.697674
clean,262144,2,true,0,0.900000,0.860000,0.870000,290.697675
clean,262144,48,false,0,0.800000,0.770000,0.790000,324.675325
clean,262144,48,true,0,0.900000,0.860000,0.880000,290.697674
mixed,262144,63,false,3072,0.900000,0.780000,0.800000,320.512821
mixed,262144,63,true,3072,0.900000,0.860000,0.930000,290.697674
mixed,262144,2,false,512,0.600000,0.680000,0.690000,367.647059
mixed,262144,2,true,512,0.700000,0.690000,0.710000,362.318840
mixed,262144,48,false,1024,0.800000,0.730000,0.740000,342.465754
mixed,262144,48,true,1024,0.800000,0.760000,0.770000,328.947368
dense,262144,63,false,22152,1.900000,1.780000,1.810000,140.449438
dense,262144,63,true,22152,2.300000,2.310000,2.350000,108.225108
dense,262144,2,false,3692,1.000000,1.010000,1.040000,247.524752
dense,262144,2,true,3692,1.000000,1.090000,1.180000,229.357798
dense,262144,48,false,7384,1.300000,1.320000,1.350000,189.393939
dense,262144,48,true,7384,1.400000,1.510000,1.540000,165.562914
adversarial,262144,63,false,0,1.000000,1.010000,1.020000,247.524752
adversarial,262144,63,true,0,1.000000,1.010000,1.050000,247.524752
adversarial,262144,2,false,0,0.700000,0.720000,0.730000,347.222222
adversarial,262144,2,true,0,0.800000,0.720000,0.730000,347.222222
adversarial,262144,48,false,0,1.000000,0.940000,0.950000,265.957447
adversarial,262144,48,true,0,0.900000,0.950000,0.960000,263.157895
clean,1048576,63,false,0,4.400000,4.330000,4.410000,230.946882
clean,1048576,63,true,0,4.400000,4.340000,4.450000,230.414747
clean,1048576,2,false,0,3.900000,3.890000,3.990000,257.069409
clean,1048576,2,true,0,4.100000,3.940000,4.020000,253.807107
clean,1048576,48,false,0,3.600000,3.570000,3.680000,280.112045
clean,1048576,48,true,0,3.600000,3.600000,3.690000,277.777778
mixed,1048576,63,false,12288,3.500000,3.200000,3.300000,312.500000
mixed,1048576,63,true,12288,3.500000,3.510000,3.590000,284.900285
mixed,1048576,2,false,2048,2.900000,2.780000,2.820000,359.712230
mixed,1048576,2,true,2048,2.800000,2.830000,2.880000,353.356890
mixed,1048576,48,false,4096,2.900000,2.980000,3.050000,335.570470
mixed,1048576,48,true,4096,3.100000,3.100000,3.170000,322.580645
dense,1048576,63,false,88608,7.700000,7.260000,7.340000,137.741047
dense,1048576,63,true,88608,9.300000,9.330000,9.480000,107.181136
dense,1048576,2,false,14768,4.000000,4.110000,4.190000,243.309002
dense,1048576,2,true,14768,4.500000,4.430000,4.540000,225.733634
dense,1048576,48,false,29536,5.500000,5.420000,5.880000,184.501845
dense,1048576,48,true,29536,6.100000,6.110000,6.210000,163.666121
adversarial,1048576,63,false,0,4.400000,4.110000,4.200000,243.309002
adversarial,1048576,63,true,0,4.100000,4.110000,4.200000,243.309002
adversarial,1048576,2,false,0,3.000000,2.940000,3.020000,340.136054
adversarial,1048576,2,true,0,2.900000,2.940000,2.990000,340.136054
adversarial,1048576,48,false,0,3.800000,3.870000,3.940000,258.397933
adversarial,1048576,48,true,0,4.000000,3.870000,3.950000,258.397933
```

### Fresh CLI paired matrix

```csv
fixture,pseudonym,first_ms,total_median,total_p95,baseline_median,baseline_p95,added_median,added_p95
clean,false,54.947750,21.226083,30.248750,21.218625,29.617208,0.095624,3.512291
clean,true,22.414250,21.157916,31.049792,21.334375,31.293791,-0.148792,5.321251
mixed,false,21.412833,21.573084,35.203750,21.665250,35.804625,0.005499,6.124042
mixed,true,21.346667,22.095334,32.817666,21.750292,31.307541,0.097750,9.821959
dense,false,19.915625,21.401000,35.087792,21.340250,37.464125,0.035417,6.000751
dense,true,21.739042,21.272625,29.331958,21.135125,30.095125,0.073416,7.139249
adversarial,false,20.219666,21.187459,25.917791,21.023167,23.592292,0.048208,4.820833
adversarial,true,20.944791,21.018417,23.388292,20.960958,23.000292,-0.004667,2.416917
```

## Post-review cleanup verification

- No new standalone scripts, benchmark targets or example binaries were added.
- Moved relevant empty/clean, category-selection, compact JSON, Amex and UTF-8
  byte-offset detection cases into the existing PII browser test. Duplicate
  synthetic corpus loops were removed from JavaScript; Rust retains them.
- Focused PII browser suite: 5 passed. Focused Rust PII/allocation tests:
  12 + 1 passed. Rust formatting and WebApp lint pass after removing generated
  browser artifacts from the lint input, as in the earlier verification.
- The pre-commit hook's Rust-only branch was exercised with in-memory Git/Make
  stubs: calls are exactly fmt-check, rust-lint, test. Shell syntax and the real
  rust-lint Make target were checked. No Git index or repository mutations were
  used by this test.
