use json::JsonValue;

pub const DEFAULT_SAMPLE_SIZE: usize = 3;
pub const DEFAULT_SEED: u64 = 0;

enum SampledNode<'a> {
    Scalar(&'a JsonValue),
    Object(Vec<(&'a str, SampledNode<'a>)>),
    Array {
        items: Vec<SampledNode<'a>>,
        omitted: usize,
    },
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct FilteredCounts {
    pub nulls: usize,
    pub empty_arrays: usize,
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
pub struct SampleOutcome {
    pub output: String,
    pub filtered: FilteredCounts,
    pub sampling: SamplingStats,
}

pub fn sample(input: &str, size: usize, seed: u64) -> Result<SampleOutcome, String> {
    if size == 0 {
        return Err("Sample size must be a positive integer".to_string());
    }

    let parsed = json::parse(input).map_err(|error| format!("Invalid JSON input: {error}"))?;
    let mut random = SplitMix64::new(seed);
    let mut filtered = FilteredCounts::default();
    let value = sample_value(&parsed, size, &mut random, &mut filtered);
    let mut sampling = SamplingStats::default();
    record_sampling(&value, &mut String::new(), &mut sampling);

    let mut output = Vec::with_capacity(input.len().min(16 * 1024));
    write_json(&value, &mut output);

    Ok(SampleOutcome {
        output: String::from_utf8(output).expect("JSON serialization emits UTF-8"),
        filtered,
        sampling,
    })
}

fn sample_value<'a>(
    value: &'a JsonValue,
    size: usize,
    random: &mut SplitMix64,
    filtered: &mut FilteredCounts,
) -> SampledNode<'a> {
    match value {
        JsonValue::Object(_) => {
            let mut entries = Vec::with_capacity(value.len());
            for (key, child) in value.entries() {
                entries.push((key, sample_value(child, size, random, filtered)));
            }
            SampledNode::Object(entries)
        }
        JsonValue::Array(values) => {
            let mut selected = Vec::with_capacity(values.len().min(size));
            let mut eligible: usize = 0;
            for (index, child) in values.iter().enumerate() {
                if is_empty_array_entry(child) {
                    count_filtered(child, filtered);
                    continue;
                }
                eligible += 1;
                if selected.len() < size {
                    selected.push(index);
                } else {
                    let replacement = random.below(eligible as u64) as usize;
                    if replacement < size {
                        selected[replacement] = index;
                    }
                }
            }
            selected.sort_unstable();
            let items = selected
                .into_iter()
                .map(|index| sample_value(&values[index], size, random, filtered))
                .collect();
            SampledNode::Array {
                items,
                omitted: eligible.saturating_sub(size),
            }
        }
        _ => SampledNode::Scalar(value),
    }
}

fn is_empty_array_entry(value: &JsonValue) -> bool {
    match value {
        JsonValue::Null => true,
        JsonValue::Array(values) => values.iter().all(is_empty_array_entry),
        _ => false,
    }
}

fn count_filtered(value: &JsonValue, filtered: &mut FilteredCounts) {
    match value {
        JsonValue::Null => filtered.nulls += 1,
        JsonValue::Array(values) => {
            for child in values {
                count_filtered(child, filtered);
            }
            filtered.empty_arrays += 1;
        }
        _ => unreachable!("only removable entries are counted"),
    }
}

fn record_sampling(value: &SampledNode<'_>, path: &mut String, stats: &mut SamplingStats) {
    match value {
        SampledNode::Object(entries) => {
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
        SampledNode::Array { items, omitted } => {
            if *omitted > 0 {
                stats.omitted_total += *omitted;
                stats.arrays.push(SampledArray {
                    path: path.clone(),
                    omitted: *omitted,
                });
            }
            for (index, child) in items.iter().enumerate() {
                let previous_length = path.len();
                path.push('/');
                path.push_str(&index.to_string());
                record_sampling(child, path, stats);
                path.truncate(previous_length);
            }
        }
        SampledNode::Scalar(_) => {}
    }
}

fn write_json(value: &SampledNode<'_>, output: &mut Vec<u8>) {
    match value {
        SampledNode::Scalar(value) => value.write(output).expect("Vec writes cannot fail"),
        SampledNode::Object(entries) => {
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
        SampledNode::Array { items, .. } => {
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

struct SplitMix64 {
    state: u64,
}

impl SplitMix64 {
    fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    fn next(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut value = self.state;
        value = (value ^ (value >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        value = (value ^ (value >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        value ^ (value >> 31)
    }

    fn below(&mut self, limit: u64) -> u64 {
        let threshold = limit.wrapping_neg() % limit;
        loop {
            let value = self.next();
            if value >= threshold {
                return value % limit;
            }
        }
    }
}
