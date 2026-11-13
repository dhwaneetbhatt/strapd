use serde::Serialize;
use serde_json::{Value, json};
use std::{hint::black_box, time::Instant};
use strapd_core::sanitize::pii;
use strapd_portability_poc as operations;

#[derive(Serialize)]
struct Case {
    name: String,
    operation: u32,
    input: String,
    option: u32,
    seed: String,
    timestamp: String,
    expected: Value,
    error: bool,
}

fn case(name: &str, operation: u32, input: &str, option: u32, seed: u64, timestamp: i64) -> Case {
    let result: Result<Value, String> = match operation {
        1 => Ok(json!(operations::detect(input, option as u8))),
        2 => Ok(json!(operations::mask(input, option as u8))),
        3 => operations::decode(input).map(|value| json!(value)),
        4 => operations::sample(input, option, seed).map(|value| json!(value)),
        5 => operations::uuid(option).map(|_| json!("validate-uuid-v7")),
        6 => operations::timestamp(timestamp).map(|value| json!(value)),
        _ => unreachable!(),
    };
    let (error, expected) = match result {
        Ok(value) => (false, value),
        Err(error) => (true, json!(error)),
    };
    Case {
        name: name.into(),
        operation,
        input: input.into(),
        option,
        seed: seed.to_string(),
        timestamp: timestamp.to_string(),
        expected,
        error,
    }
}

fn main() {
    let mut cases = Vec::new();
    let mut timings = String::from("engine,interface,fixture,bytes,operation,median_ms,p95_ms\n");
    for kind in ["clean", "dense"] {
        for size in [128, 1024, 4096, 20480, 65536] {
            let input = operations::fixture(kind, size);
            for operation in [1, 2] {
                cases.push(case(
                    &format!("{kind}-{size}-{operation}"),
                    operation,
                    &input,
                    63,
                    0,
                    0,
                ));
                let run = || {
                    if operation == 1 {
                        black_box(pii::detect(black_box(&input), pii::Categories::ALL));
                    } else {
                        black_box(pii::sanitize(
                            black_box(&input),
                            pii::Categories::ALL,
                            pii::Mode::Mask,
                        ));
                    }
                };
                for _ in 0..20 {
                    run();
                }
                let mut samples = (0..201)
                    .map(|_| {
                        let start = Instant::now();
                        run();
                        start.elapsed().as_secs_f64() * 1000.0
                    })
                    .collect::<Vec<_>>();
                samples.sort_by(f64::total_cmp);
                timings.push_str(&format!(
                    "native,core,{kind},{size},{operation},{:.6},{:.6}\n",
                    samples[100], samples[190]
                ));
            }
        }
    }
    for input in [
        "",
        "🙂 dev@example.com; {\"phone\":9876543210}",
        "{\"card\":4111111111111111}",
        "3782 822463 10005",
        "::1 dev@example.com",
    ] {
        for operation in [1, 2] {
            for categories in [0, 2, 63] {
                cases.push(case("pii-edge", operation, input, categories, 0, 0));
            }
        }
    }
    for input in ["", "/wCAaGk=", "aGVsbG8=", "%%%"] {
        cases.push(case("base64", 3, input, 0, 0, 0));
    }
    for input in ["{\"a\":[null,[],1,2,3,{\"b\":[4,5,6]}]}", "invalid"] {
        for seed in [0, 9007199254740993, u64::MAX] {
            cases.push(case("sample", 4, input, 2, seed, 0));
        }
    }
    cases.push(case("sample-zero", 4, "[]", 0, 0, 0));
    for count in [0, 1, 2, 1025] {
        cases.push(case("uuid", 5, "", count, 0, 0));
    }
    for timestamp in [-1, 0, 1700000000, i64::MAX] {
        cases.push(case("timestamp", 6, "", 0, 0, timestamp));
    }
    std::fs::write("build/cases.json", serde_json::to_vec(&cases).unwrap()).unwrap();
    std::fs::write("build/native.csv", timings).unwrap();
    println!(
        "Native oracle: {} cases; PII timing matrix written",
        cases.len()
    );
}
