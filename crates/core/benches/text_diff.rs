use criterion::{BenchmarkId, Criterion, Throughput, criterion_group, criterion_main};
use std::{hint::black_box, time::Duration};
use strapd_core::string::diff::{diff, unified};

fn inputs(size: usize, scenario: &str) -> (String, String) {
    if scenario == "single_line" {
        let mut from = String::with_capacity(size + 50);
        from.push('[');
        while from.len() < size {
            from.push_str(r#"{"key":"value","number":12345},"#);
        }
        from.push_str("{}]");
        let mut to = from.clone();
        let middle = to.len() / 2;
        let position = middle + to[middle..].find("12345").unwrap();
        to.replace_range(position..position + 5, "54321");
        return (from, to);
    }
    let mut from = String::with_capacity(size + 100);
    let mut to = String::with_capacity(size + 100);
    let mut state = 0x12345678_u64;
    let mut i = 0;
    while from.len() < size {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        let line = format!("let item_{i:06} = compute(0x{state:016x});\n");
        let changed = match scenario {
            "localized" => from.len() <= size / 2 && from.len() + line.len() > size / 2,
            "scattered_1pct" => i % 100 == 50,
            "divergent" => true,
            _ => false,
        };
        if changed {
            if scenario == "divergent" {
                to.push_str(&format!(
                    "// unrelated record {i:06}: {:016x} !!!\n",
                    !state
                ));
            } else {
                to.push_str(&line.replace("compute", "resolve"));
            }
        } else {
            to.push_str(&line);
        }
        from.push_str(&line);
        i += 1;
    }
    (from, to)
}

fn benchmarks(c: &mut Criterion) {
    let mut group = c.benchmark_group("diff");
    for scenario in [
        "identical",
        "localized",
        "single_line",
        "scattered_1pct",
        "divergent",
    ] {
        for (name, size) in [("1MB", 1_000_000), ("10MB", 10_000_000)] {
            let (from, to) = inputs(size, scenario);
            group.bench_with_input(
                BenchmarkId::new(scenario, name),
                &(&from, &to),
                |b, &(a, z)| {
                    b.iter(|| diff(black_box(a), black_box(z), 3));
                },
            );
        }
    }
    group.finish();
    let mut group = c.benchmark_group("unified");
    for scenario in ["localized", "scattered_1pct", "divergent"] {
        for (name, size) in [("1MB", 1_000_000), ("10MB", 10_000_000)] {
            let (from, to) = inputs(size, scenario);
            let result = diff(&from, &to, 3);
            group.throughput(Throughput::Bytes(unified(&result, "a", "b").len() as u64));
            group.bench_function(BenchmarkId::new(scenario, name), |b| {
                b.iter(|| unified(black_box(&result), "a", "b"));
            });
        }
    }
    group.finish();
    let mut group = c.benchmark_group("scaling");
    for scenario in ["identical", "localized", "single_line"] {
        for size in [100_000, 1_000_000, 10_000_000] {
            let (from, to) = inputs(size, scenario);
            group.bench_function(BenchmarkId::new(scenario, size), |b| {
                b.iter(|| diff(black_box(&from), black_box(&to), 3));
            });
        }
    }
    group.finish();
}

criterion_group! {
    name = benches;
    config = Criterion::default().sample_size(30).warm_up_time(Duration::from_secs(1)).measurement_time(Duration::from_secs(2));
    targets = benchmarks
}
criterion_main!(benches);
