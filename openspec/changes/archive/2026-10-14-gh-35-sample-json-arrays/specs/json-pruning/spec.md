## REMOVED Requirements

### Requirement: Pruning removes unwanted values recursively
**Reason**: Sampling only filters null and empty array entries from arrays; object values must remain intact.
**Migration**: Use `json sample` and preserve object members.

### Requirement: Named keys can be removed at every object depth
**Reason**: Key removal has no established user intent and risks erasing shape information.
**Migration**: Remove `--drop-keys` and the corresponding WebApp/Pipes control; use `json sample` to shorten arrays while preserving object members.

### Requirement: Optional sampling shortens each surviving long array
**Reason**: First-and-last selection is not random sampling, and sampling is now the primary operation.
**Migration**: Use `json sample --size N` with a seed to choose a repeatable random sample.

### Requirement: Statistics identify loss without changing the JSON data
**Reason**: Pruning and drop-key counts no longer apply.
**Migration**: Read filtering and sampling counts from the new sampling statistics.

### Requirement: All interfaces use the same local transformation
**Reason**: The prune operation is replaced across interfaces.
**Migration**: Use `json sample`, the JSON Sample WebApp tool, or its Pipes step.
