use serde::Serialize;
use strapd_core::{
    data_formats::json_sample, datetime::timestamp, encoding, identifiers, sanitize::pii,
};

#[derive(Debug, PartialEq, Serialize)]
pub struct Detection {
    pub category: u32,
    pub start: u32,
    pub end: u32,
}

#[derive(Debug, PartialEq, Serialize)]
pub struct SampledArray {
    pub path: String,
    pub omitted: u32,
}

#[derive(Debug, PartialEq, Serialize)]
pub struct Sample {
    pub output: String,
    pub filtered_nulls: u32,
    pub filtered_empty_arrays: u32,
    pub omitted_total: u32,
    pub arrays: Vec<SampledArray>,
}

pub fn detect(input: &str, categories: u8) -> Vec<Detection> {
    pii::detect(input, pii::Categories::from_bits(categories))
        .into_iter()
        .map(|found| Detection {
            category: found.category as u32,
            start: found.range.start as u32,
            end: found.range.end as u32,
        })
        .collect()
}

pub fn mask(input: &str, categories: u8) -> String {
    pii::sanitize(
        input,
        pii::Categories::from_bits(categories),
        pii::Mode::Mask,
    )
    .into_owned()
}

pub fn decode(input: &str) -> Result<Vec<u8>, String> {
    encoding::base64::decode(input).map_err(str::to_owned)
}

pub fn sample(input: &str, size: u32, seed: u64) -> Result<Sample, String> {
    json_sample::sample(input, size as usize, seed).map(|outcome| Sample {
        output: outcome.output,
        filtered_nulls: outcome.filtered.nulls as u32,
        filtered_empty_arrays: outcome.filtered.empty_arrays as u32,
        omitted_total: outcome.sampling.omitted_total as u32,
        arrays: outcome
            .sampling
            .arrays
            .into_iter()
            .map(|array| SampledArray {
                path: array.path,
                omitted: array.omitted as u32,
            })
            .collect(),
    })
}

pub fn uuid(count: u32) -> Result<String, String> {
    if !(1..=1024).contains(&count) {
        return Err("PoC UUID count must be between 1 and 1024".into());
    }
    Ok(identifiers::uuid::generate_v7(count as usize))
}

pub fn timestamp(value: i64) -> Result<String, String> {
    timestamp::from_timestamp(value, timestamp::TimestampFormat::Iso).map_err(str::to_owned)
}

pub fn fixture(kind: &str, size: usize) -> String {
    let row = match kind {
        "clean" => "ordinary application content without identifiers. ",
        "dense" => "dev@example.com 4111111111111111 +91 98765 43210 ",
        _ => panic!("unknown fixture"),
    };
    let mut input = row.repeat(size / row.len());
    input.extend(std::iter::repeat_n(' ', size - input.len()));
    input
}
