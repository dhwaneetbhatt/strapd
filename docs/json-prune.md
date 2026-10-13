# JSON Prune

JSON Prune removes noise from a JSON value locally. It is available as `strapd json prune`, as **Data Formats → JSON Prune** in the WebApp, and as a Pipes transform.

## What it removes

The operation recursively removes `null`, empty strings (`""`), empty objects (`{}`), and empty arrays (`[]`) from object members and array entries. A parent container is removed when pruning leaves it empty, so removal can cascade. Numbers, booleans, nonempty strings, and whitespace-only strings stay. The root value remains valid JSON even if it is `{}`, `[]`, `null`, or `""`.

`--drop-keys` removes matching object members at every depth before visiting their values. Names are comma-separated, trimmed, matched exactly, and case-sensitive. The statistics count each removed member as one dropped key; values inside that discarded subtree are not counted separately.

```bash
strapd json prune --drop-keys debug,trace '{"debug":1,"nested":{"trace":2,"keep":3}}'
# {"nested":{"keep":3}}
```

## Sampling

Sampling is off by default. `--sample` enables it with N=3; `--sample-size N` enables it with another positive integer. Pruning runs first. A surviving array is sampled only when it has more than 2N entries. The result keeps the first N entries and the final entry, in order, with no omission marker.

```bash
strapd json prune --sample '[1,2,3,4,5,6,7]'
# [1,2,3,7]

strapd json prune --sample-size 2 '[1,2,3,4,5]'
# [1,2,5]
```

Pruning and sampling can change whether the result satisfies an input JSON schema. Sampling is lossy and should be enabled only when shorter arrays are useful.

## CLI output and statistics

Raw JSON is the default, including when input comes from stdin. It can be piped to another command:

```bash
cat payload.json | strapd json prune --drop-keys debug | strapd json minify
```

`--output json` prints a two-key CLI response with typed `data` and separate `metadata`:

```bash
strapd json prune --sample --output json '{"items":[1,2,3,4,5,6,7],"unused":null}'
# {"data":{"items":[1,2,3,7]},"metadata":{"pruned":{"nulls":1,"emptyStrings":0,"emptyObjects":0,"emptyArrays":0,"droppedKeys":0},"sampling":{"omittedTotal":3,"arrays":[{"path":"/items","omitted":3}]}}}
```

`metadata.pruned` always reports counts for nulls, empty strings, empty objects, empty arrays, and dropped keys, including zeros. `metadata.sampling.omittedTotal` counts array entries omitted by sampling. Each `arrays` entry gives an omission count and a JSON Pointer path into the final `data`: `/orders/0/items` names the `items` array in the first retained order. The root path is `""`. Object names escape `~` as `~0` and `/` as `~1`. Nested arrays inside an omitted parent entry have no path in the result and are not listed. Pruned-value counts can include values in branches later omitted by sampling because pruning happens first.

The CLI wrapper exists only for `--output json` and only for commands that explicitly support it; currently that is `json prune`. The WebApp shows raw JSON in its result box with a separate summary. Pipes forward only raw JSON to the next step. All processing runs locally.
