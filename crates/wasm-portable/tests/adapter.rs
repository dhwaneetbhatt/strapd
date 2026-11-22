use serde_json::{Value, json};
use strapd_core::string::diff;
use strapd_wasm_portable::{CharacterType, DiffHunk, DiffLine, DiffLineKind, Guest, Tools};

#[test]
fn generation_rejects_invalid_counts_and_ranges() {
    for count in [0, 1025, u32::MAX] {
        assert!(Tools::uuid_generate_v4(count).is_err());
        assert!(Tools::uuid_generate_v7(count).is_err());
        assert!(Tools::ulid_generate(count).is_err());
        assert!(Tools::random_number(1, 2, count).is_err());
        assert!(Tools::random_string(count, 8, vec![CharacterType::Lowercase], None).is_err());
    }
    assert!(Tools::random_number(2, 1, 1).is_err());
    assert_eq!(
        Tools::random_number(i64::MIN, i64::MIN, 1).unwrap(),
        [i64::MIN]
    );
    assert_eq!(
        Tools::random_number(i64::MAX, i64::MAX, 1).unwrap(),
        [i64::MAX]
    );
    assert_eq!(Tools::uuid_generate_v7(1024).unwrap().lines().count(), 1024);
}

#[test]
fn binary_and_sampling_adapters_preserve_core_results() {
    let bytes = vec![0, 255, 128, 10];
    assert_eq!(
        Tools::base64_decode(Tools::base64_encode(bytes.clone())).unwrap(),
        bytes
    );
    assert_eq!(
        Tools::hex_decode(Tools::hex_encode(bytes.clone())).unwrap(),
        bytes
    );
    let input = r#"[null, [], 1, 2, 3]"#;
    for seed in [0, 1 << 63, u64::MAX] {
        let expected = strapd_core::data_formats::json_sample::sample(input, 1, seed).unwrap();
        let actual = Tools::json_sample(input.into(), 1, seed).unwrap();
        assert_eq!(actual.output, expected.output);
        assert_eq!(actual.filtered_nulls, 1);
        assert_eq!(actual.filtered_empty_arrays, 1);
        assert_eq!(actual.omitted_total, 2);
        assert_eq!(actual.arrays[0].path, expected.sampling.arrays[0].path);
    }
}

#[test]
fn detection_adapter_uses_utf8_offsets_and_category_bits() {
    let input = "🙂 dev@example.com";
    let expected =
        strapd_core::sanitize::pii::detect(input, strapd_core::sanitize::pii::Categories::ALL);
    let actual = Tools::detect_pii(input.into(), 255);
    assert_eq!(actual.len(), expected.len());
    for (actual, expected) in actual.iter().zip(expected) {
        assert_eq!(actual.category, expected.category as u8);
        assert_eq!(actual.start as usize, expected.range.start);
        assert_eq!(actual.end as usize, expected.range.end);
    }
    assert!(Tools::detect_pii(input.into(), 0).is_empty());
}

#[test]
fn diff_adapters_match_shared_fixture_and_core_unified_output() {
    let fixture: Value = serde_json::from_str(include_str!("fixtures/text-diff.json")).unwrap();
    let from = fixture["from"].as_str().unwrap();
    let to = fixture["to"].as_str().unwrap();
    let context = fixture["context"].as_u64().unwrap() as u32;
    let from_label = fixture["from-label"].as_str().unwrap();
    let to_label = fixture["to-label"].as_str().unwrap();
    let expected = diff::unified(
        &diff::diff(from, to, context as usize),
        from_label,
        to_label,
    );

    let actual = Tools::text_diff(from.into(), to.into(), context);
    assert_eq!(
        json!({
            "added": actual.added,
            "removed": actual.removed,
            "hunks": actual.hunks.into_iter().map(hunk_json).collect::<Vec<_>>(),
        }),
        fixture["structured"]
    );
    assert_eq!(expected, fixture["unified"].as_str().unwrap());
    assert_eq!(
        Tools::text_diff_unified(
            from.into(),
            to.into(),
            context,
            from_label.into(),
            to_label.into()
        ),
        expected
    );
}

fn hunk_json(hunk: DiffHunk) -> Value {
    json!({
        "from-start": hunk.from_start,
        "from-count": hunk.from_count,
        "to-start": hunk.to_start,
        "to-count": hunk.to_count,
        "lines": hunk.lines.into_iter().map(line_json).collect::<Vec<_>>(),
    })
}

fn line_json(line: DiffLine) -> Value {
    let segments: Vec<_> = line
        .segments
        .into_iter()
        .map(|segment| json!({"text": segment.text, "emphasized": segment.emphasized}))
        .collect();
    json!({
        "kind": match line.kind {
            DiffLineKind::Context => "context",
            DiffLineKind::Removed => "removed",
            DiffLineKind::Added => "added",
        },
        "from-line": line.from_line,
        "to-line": line.to_line,
        "segments": segments,
        "missing-newline": line.missing_newline,
    })
}
