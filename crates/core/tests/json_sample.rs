use strapd_core::data_formats::json_sample::{
    DEFAULT_SAMPLE_SIZE, DEFAULT_SEED, FilteredCounts, SampledArray, SamplingStats, sample,
};

#[test]
fn filters_only_null_and_empty_array_entries() {
    let input = r#"{"keep":null,"rows":[null,[],[null,[]],0,false,"",{},[1,null,[]]],"tags":[]}"#;
    let outcome = sample(input, 10, DEFAULT_SEED).unwrap();

    assert_eq!(
        outcome.output,
        r#"{"keep":null,"rows":[0,false,"",{},[1]],"tags":[]}"#
    );
    assert_eq!(
        outcome.filtered,
        FilteredCounts {
            nulls: 3,
            empty_arrays: 4,
        }
    );
    assert_eq!(outcome.sampling, SamplingStats::default());
}

#[test]
fn preserves_scalar_and_empty_roots() {
    for input in ["{}", "[]", "null", "\"\"", "false", "0"] {
        assert_eq!(
            sample(input, DEFAULT_SAMPLE_SIZE, DEFAULT_SEED)
                .unwrap()
                .output,
            input
        );
    }
}

#[test]
fn samples_without_replacement_and_preserves_relative_order() {
    let outcome = sample("[0,1,2,3,4,5,6,7,8,9]", 3, DEFAULT_SEED).unwrap();
    let values = json::parse(&outcome.output).unwrap();
    let selected: Vec<_> = values
        .members()
        .map(|value| value.as_usize().unwrap())
        .collect();
    assert_eq!(selected.len(), 3);
    assert!(selected.windows(2).all(|pair| pair[0] < pair[1]));
    assert_eq!(outcome.sampling.omitted_total, 7);
    assert_eq!(
        outcome.sampling.arrays,
        vec![SampledArray {
            path: "".into(),
            omitted: 7
        }]
    );
    assert_eq!(
        outcome,
        sample("[0,1,2,3,4,5,6,7,8,9]", 3, DEFAULT_SEED).unwrap()
    );
    assert_ne!(
        outcome.output,
        sample("[0,1,2,3,4,5,6,7,8,9]", 3, 1).unwrap().output
    );
}

#[test]
fn leaves_short_arrays_intact_after_filtering() {
    let outcome = sample("[1,null,[],2]", 3, DEFAULT_SEED).unwrap();
    assert_eq!(outcome.output, "[1,2]");
    assert_eq!(outcome.sampling, SamplingStats::default());
}

#[test]
fn samples_alternating_objects_and_arrays_at_five_levels() {
    let input = r#"{"outer":[{"middle":{"items":[{"values":[1,2,3,4,5]},{"values":[6,7,8,9,10]},{"values":[11,12,13,14,15]}]}}]}"#;
    let outcome = sample(input, 2, DEFAULT_SEED).unwrap();
    let parsed = json::parse(&outcome.output).unwrap();
    let items = &parsed["outer"][0]["middle"]["items"];
    assert_eq!(items.len(), 2);
    assert!(items.members().all(|item| item["values"].len() == 2));
    assert_eq!(outcome.sampling.omitted_total, 7);
    assert!(
        outcome
            .sampling
            .arrays
            .iter()
            .any(|array| array.path == "/outer/0/middle/items")
    );
}

#[test]
fn escaped_paths_include_only_retained_branches() {
    let input =
        r#"{"a/b~c":[{"values":[1,2,3,4]}, {"values":[5,6,7,8]}, {"values":[9,10,11,12]}]}"#;
    let outcome = sample(input, 2, DEFAULT_SEED).unwrap();
    assert_eq!(outcome.sampling.arrays[0].path, "/a~1b~0c");
    assert_eq!(outcome.sampling.arrays.len(), 3);
    assert!(
        outcome.sampling.arrays[1..]
            .iter()
            .all(|entry| entry.path.starts_with("/a~1b~0c/"))
    );
}

#[test]
fn rejects_invalid_input_and_size() {
    assert!(
        sample("{bad}", 3, 0)
            .unwrap_err()
            .starts_with("Invalid JSON input:")
    );
    assert_eq!(
        sample("[]", 0, 0).unwrap_err(),
        "Sample size must be a positive integer"
    );
}

#[test]
fn serializes_escaped_keys_and_values_as_valid_json() {
    let input = "{\"quote\\\"key\":\"line\\nfeed\",\"back\\\\slash\":true}";
    let outcome = sample(input, 3, DEFAULT_SEED).unwrap();
    assert_eq!(
        json::parse(&outcome.output).unwrap(),
        json::parse(input).unwrap()
    );
}
