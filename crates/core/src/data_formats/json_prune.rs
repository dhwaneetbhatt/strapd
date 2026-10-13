use std::collections::HashSet;

use json::JsonValue;

enum PrunedNode<'a> {
    Scalar(&'a JsonValue),
    Object(Vec<(&'a str, PrunedNode<'a>)>),
    Array {
        items: Vec<PrunedNode<'a>>,
        omitted: usize,
    },
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct PrunedCounts {
    pub nulls: usize,
    pub empty_strings: usize,
    pub empty_objects: usize,
    pub empty_arrays: usize,
    pub dropped_keys: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub struct SampledArray {
    pub path: String,
    pub omitted: usize,
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct SamplingStats {
    pub omitted_total: usize,
    pub arrays: Vec<SampledArray>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct PruneOutcome {
    pub output: String,
    pub pruned: PrunedCounts,
    pub sampling: SamplingStats,
}

pub fn prune(
    input: &str,
    drop_keys: &str,
    sample_size: Option<usize>,
) -> Result<PruneOutcome, String> {
    if sample_size == Some(0) {
        return Err("Sample size must be a positive integer".to_string());
    }

    let parsed = json::parse(input).map_err(|error| format!("Invalid JSON input: {error}"))?;
    let keys: HashSet<&str> = drop_keys
        .split(',')
        .map(str::trim)
        .filter(|key| !key.is_empty())
        .collect();
    let mut pruned = PrunedCounts::default();
    let mut value = prune_value(&parsed, true, &keys, sample_size, &mut pruned)
        .expect("root JSON value is always retained");
    let mut sampling = SamplingStats::default();

    if sample_size.is_some() {
        record_sampling(&mut value, &mut String::new(), &mut sampling);
    }

    let mut output = Vec::with_capacity(input.len());
    write_json(&value, &mut output);

    Ok(PruneOutcome {
        output: String::from_utf8(output).expect("JSON serialization emits UTF-8"),
        pruned,
        sampling,
    })
}

fn prune_value<'a>(
    value: &'a JsonValue,
    is_root: bool,
    drop_keys: &HashSet<&str>,
    sample_size: Option<usize>,
    counts: &mut PrunedCounts,
) -> Option<PrunedNode<'a>> {
    match value {
        JsonValue::Null if !is_root => {
            counts.nulls += 1;
            None
        }
        JsonValue::String(text) if text.is_empty() && !is_root => {
            counts.empty_strings += 1;
            None
        }
        JsonValue::Short(text) if text.as_str().is_empty() && !is_root => {
            counts.empty_strings += 1;
            None
        }
        JsonValue::Object(_) => {
            let mut retained = Vec::with_capacity(value.len());
            for (key, child) in value.entries() {
                if drop_keys.contains(key) {
                    counts.dropped_keys += 1;
                    continue;
                }
                if let Some(pruned_child) =
                    prune_value(child, false, drop_keys, sample_size, counts)
                {
                    retained.push((key, pruned_child));
                }
            }
            if !is_root && retained.is_empty() {
                counts.empty_objects += 1;
                None
            } else {
                Some(PrunedNode::Object(retained))
            }
        }
        JsonValue::Array(items) => {
            let limit = sample_size.map(|size| size.saturating_mul(2));
            let mut retained = Vec::with_capacity(items.len().min(limit.unwrap_or(items.len())));
            let mut count = 0;
            let mut tail = None;
            for item in items {
                if let Some(pruned_child) = prune_value(item, false, drop_keys, sample_size, counts)
                {
                    count += 1;
                    if limit.is_none_or(|limit| count <= limit) {
                        retained.push(pruned_child);
                    } else {
                        tail = Some(pruned_child);
                    }
                }
            }
            if !is_root && count == 0 {
                counts.empty_arrays += 1;
                None
            } else {
                let omitted = if let Some(last) = tail {
                    let size = sample_size.expect("a tail requires sampling");
                    retained.truncate(size);
                    retained.push(last);
                    count - size - 1
                } else {
                    0
                };
                Some(PrunedNode::Array {
                    items: retained,
                    omitted,
                })
            }
        }
        _ => Some(PrunedNode::Scalar(value)),
    }
}

fn record_sampling(value: &mut PrunedNode<'_>, path: &mut String, stats: &mut SamplingStats) {
    match value {
        PrunedNode::Object(entries) => {
            for (key, child) in entries {
                let previous_length = path.len();
                path.push('/');
                for character in key.chars() {
                    match character {
                        '~' => path.push_str("~0"),
                        '/' => path.push_str("~1"),
                        _ => path.push(character),
                    }
                }
                record_sampling(child, path, stats);
                path.truncate(previous_length);
            }
        }
        PrunedNode::Array { items, omitted } => {
            if *omitted > 0 {
                stats.omitted_total += *omitted;
                stats.arrays.push(SampledArray {
                    path: path.clone(),
                    omitted: *omitted,
                });
            }
            for (index, child) in items.iter_mut().enumerate() {
                let previous_length = path.len();
                path.push('/');
                path.push_str(&index.to_string());
                record_sampling(child, path, stats);
                path.truncate(previous_length);
            }
        }
        _ => {}
    }
}

fn write_json(value: &PrunedNode<'_>, output: &mut Vec<u8>) {
    match value {
        PrunedNode::Scalar(value) => value.write(output).expect("Vec writes cannot fail"),
        PrunedNode::Object(entries) => {
            output.push(b'{');
            for (index, (key, child)) in entries.iter().enumerate() {
                if index > 0 {
                    output.push(b',');
                }
                serde_json::to_writer(&mut *output, key).expect("Vec writes cannot fail");
                output.push(b':');
                write_json(child, output);
            }
            output.push(b'}');
        }
        PrunedNode::Array { items, .. } => {
            output.push(b'[');
            for (index, child) in items.iter().enumerate() {
                if index > 0 {
                    output.push(b',');
                }
                write_json(child, output);
            }
            output.push(b']');
        }
    }
}
