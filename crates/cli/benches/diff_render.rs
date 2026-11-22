use criterion::{BenchmarkId, Criterion, criterion_group, criterion_main};
use std::{
    fmt::Write as _,
    hint::black_box,
    io::{BufWriter, Write, sink},
    time::Duration,
};
use strapd_core::string::diff::{DEFAULT_CONTEXT, diff};

#[path = "../src/handlers/diff_render.rs"]
mod diff_render;

fn inputs(size: usize, scattered: bool) -> (String, String) {
    let mut from = String::with_capacity(size);
    let mut to = String::with_capacity(size);
    // Each line below is exactly 50 bytes.
    let lines = size / 50;
    for i in 0..lines {
        let changed = if scattered {
            i % 100 == 50
        } else {
            i == lines / 2
        };
        let state = (i as u64).wrapping_mul(0x9e3779b97f4a7c15);
        writeln!(from, "\tlet item_{i:06} = compute(0x{state:016x});//").unwrap();
        let function = if changed { "resolve" } else { "compute" };
        writeln!(to, "\tlet item_{i:06} = {function}(0x{state:016x});//").unwrap();
    }
    (from, to)
}

fn benchmarks(c: &mut Criterion) {
    let mut group = c.benchmark_group("cli_render");
    for (scenario, scattered) in [("localized", false), ("scattered_1pct", true)] {
        for (name, size) in [("1MB", 1_000_000), ("10MB", 10_000_000)] {
            let (from, to) = inputs(size, scattered);
            let result = diff(&from, &to, DEFAULT_CONTEXT);
            let mut out = BufWriter::with_capacity(64 * 1024, sink());
            group.bench_function(BenchmarkId::new(format!("unified_{scenario}"), name), |b| {
                b.iter(|| {
                    diff_render::unified(black_box(&result), "a", "b", true, black_box(&mut out))
                        .unwrap();
                    out.flush().unwrap();
                });
            });
            group.bench_function(
                BenchmarkId::new(format!("side_by_side_{scenario}"), name),
                |b| {
                    b.iter(|| {
                        diff_render::side_by_side(
                            black_box(&result),
                            130,
                            true,
                            black_box(&mut out),
                        )
                        .unwrap();
                        out.flush().unwrap();
                    });
                },
            );
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
