use strapd_core::data_formats::json_prune::{PrunedCounts, SampledArray, SamplingStats, prune};

#[test]
fn prunes_recursively_and_counts_cascading_containers() {
    let outcome = prune(
        r#"{"keep":0,"false":false,"space":" ","outer":{"inner":null},"items":["",{},false]}"#,
        "",
        None,
    )
    .unwrap();

    assert_eq!(
        outcome.output,
        r#"{"keep":0,"false":false,"space":" ","items":[false]}"#
    );
    assert_eq!(
        outcome.pruned,
        PrunedCounts {
            nulls: 1,
            empty_strings: 1,
            empty_objects: 2,
            ..PrunedCounts::default()
        }
    );
    assert_eq!(outcome.sampling, SamplingStats::default());
}

#[test]
fn preserves_empty_and_scalar_roots() {
    for input in ["{}", "[]", "null", "\"\"", "false", "0", r#"" ""#] {
        let outcome = prune(input, "", None).unwrap();
        assert_eq!(outcome.output, input);
        assert_eq!(outcome.pruned, PrunedCounts::default());
    }
}

#[test]
fn drops_exact_keys_at_every_depth_without_counting_their_subtrees() {
    let outcome = prune(
        r#"{"debug":{"empty":null},"Debug":1,"nested":{"trace":"","keep":3},"items":[{"debug":4,"keep":5}]}"#,
        " debug, trace, , debug ",
        None,
    )
    .unwrap();

    assert_eq!(
        outcome.output,
        r#"{"Debug":1,"nested":{"keep":3},"items":[{"keep":5}]}"#
    );
    assert_eq!(outcome.pruned.dropped_keys, 3);
    assert_eq!(outcome.pruned.nulls, 0);
    assert_eq!(outcome.pruned.empty_strings, 0);
}

#[test]
fn samples_only_after_pruning_and_only_above_twice_the_size() {
    let at_threshold = prune("[1,2,3,4,5,6]", "", Some(3)).unwrap();
    assert_eq!(at_threshold.output, "[1,2,3,4,5,6]");
    assert_eq!(at_threshold.sampling, SamplingStats::default());

    let above_threshold = prune("[1,2,3,4,5,6,7]", "", Some(3)).unwrap();
    assert_eq!(above_threshold.output, "[1,2,3,7]");
    assert_eq!(above_threshold.sampling.omitted_total, 3);
    assert_eq!(
        above_threshold.sampling.arrays,
        vec![SampledArray {
            path: "".to_string(),
            omitted: 3,
        }]
    );

    let pruned_first = prune("[1,null,2,{},3,4,5,6]", "", Some(3)).unwrap();
    assert_eq!(pruned_first.output, "[1,2,3,4,5,6]");
    assert_eq!(pruned_first.sampling, SamplingStats::default());
}

#[test]
fn reports_nested_paths_in_the_final_result() {
    let outcome = prune(
        r#"{"orders":[{"items":[1,2,3,4,5,6,7]},{"items":[10,11,12,13,14,15,16]}]}"#,
        "",
        Some(3),
    )
    .unwrap();

    assert_eq!(
        outcome.output,
        r#"{"orders":[{"items":[1,2,3,7]},{"items":[10,11,12,16]}]}"#
    );
    assert_eq!(outcome.sampling.omitted_total, 6);
    assert_eq!(
        outcome.sampling.arrays,
        vec![
            SampledArray {
                path: "/orders/0/items".to_string(),
                omitted: 3,
            },
            SampledArray {
                path: "/orders/1/items".to_string(),
                omitted: 3,
            },
        ]
    );
}

#[test]
fn prunes_and_samples_through_alternating_objects_and_arrays() {
    let outcome = prune(
        r#"{"outer":[null,{"middle":[{},{"items":[1,null,2,3,4,5,6,7]}]}]}"#,
        "",
        Some(3),
    )
    .unwrap();

    assert_eq!(
        outcome.output,
        r#"{"outer":[{"middle":[{"items":[1,2,3,7]}]}]}"#
    );
    assert_eq!(outcome.pruned.nulls, 2);
    assert_eq!(outcome.pruned.empty_objects, 1);
    assert_eq!(outcome.sampling.omitted_total, 3);
    assert_eq!(
        outcome.sampling.arrays,
        vec![SampledArray {
            path: "/outer/0/middle/0/items".to_string(),
            omitted: 3,
        }]
    );
}

#[test]
fn samples_arrays_directly_nested_in_an_array_after_pruning() {
    let outcome = prune("[[1,2,3,4,5,6,7],[],[10,11,12,13,14,15,16]]", "", Some(3)).unwrap();

    assert_eq!(outcome.output, "[[1,2,3,7],[10,11,12,16]]");
    assert_eq!(outcome.pruned.empty_arrays, 1);
    assert_eq!(outcome.sampling.omitted_total, 6);
    assert_eq!(
        outcome.sampling.arrays,
        vec![
            SampledArray {
                path: "/0".to_string(),
                omitted: 3,
            },
            SampledArray {
                path: "/1".to_string(),
                omitted: 3,
            },
        ]
    );
}

#[test]
fn handles_deep_input_and_reports_parser_depth_limit() {
    let within_limit = format!("{}1{}", "[".repeat(512), "]".repeat(512));
    assert_eq!(prune(&within_limit, "", None).unwrap().output, within_limit);

    let too_deep = format!("{}1{}", "[".repeat(513), "]".repeat(513));
    assert!(
        prune(&too_deep, "", None)
            .unwrap_err()
            .starts_with("Invalid JSON input:")
    );
}

#[test]
fn reports_only_retained_branches_and_escapes_object_keys() {
    let outcome = prune(
        r#"{"a/b~c":[{"items":[1,2,3,4,5,6,7]},1,2,{"items":[9,9,9,9,9,9,9]},4,5,{"items":[10,11,12,13,14,15,16]}]}"#,
        "",
        Some(3),
    )
    .unwrap();

    assert_eq!(
        outcome.output,
        r#"{"a/b~c":[{"items":[1,2,3,7]},1,2,{"items":[10,11,12,16]}]}"#
    );
    assert_eq!(outcome.sampling.omitted_total, 9);
    assert_eq!(
        outcome.sampling.arrays,
        vec![
            SampledArray {
                path: "/a~1b~0c".to_string(),
                omitted: 3,
            },
            SampledArray {
                path: "/a~1b~0c/0/items".to_string(),
                omitted: 3,
            },
            SampledArray {
                path: "/a~1b~0c/3/items".to_string(),
                omitted: 3,
            },
        ]
    );
}

#[test]
fn rejects_bad_input_and_zero_sample_size() {
    assert!(
        prune("{bad}", "", None)
            .unwrap_err()
            .starts_with("Invalid JSON input:")
    );
    assert_eq!(
        prune("[]", "", Some(0)).unwrap_err(),
        "Sample size must be a positive integer"
    );
}

#[test]
fn serializes_escaped_keys_and_values_as_valid_json() {
    let input = "{\"quote\\\"key\":\"line\\nfeed\",\"back\\\\slash\":true}";
    let outcome = prune(input, "", None).unwrap();
    assert_eq!(
        json::parse(&outcome.output).unwrap(),
        json::parse(input).unwrap()
    );
}
