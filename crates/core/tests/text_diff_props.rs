use imara_diff::{Algorithm, Diff, InternedInput, sources::lines};
use proptest::prelude::*;
use strapd_core::string::diff::{LineKind, diff};

fn text() -> impl Strategy<Value = String> {
    let repeated_lines = (
        prop::collection::vec(
            prop::sample::select(vec![
                "a\n",
                "a\n",
                "b\r\n",
                "你好 🦀\n",
                "\n",
                "abc def;\n",
                "a\r\n",
            ]),
            0..40,
        ),
        any::<bool>(),
    )
        .prop_map(|(parts, missing)| {
            let mut result = parts.concat();
            if missing {
                result.pop();
            }
            result
        });
    prop_oneof![
        3 => repeated_lines,
        1 => prop::collection::vec(prop::sample::select(vec![
            'a', 'b', ' ', '_', '1', '!', '\t', '\r', '\n', '你', '🦀', '\0',
        ]), 0..120).prop_map(|chars| chars.into_iter().collect()),
    ]
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 512, failure_persistence: None, .. ProptestConfig::default() })]
    #[test]
    fn matches_untrimmed_engine_and_reconstructs(from in text(), to in text(), context in prop_oneof![0usize..10, Just(usize::MAX)]) {
        let input = InternedInput::new(from.as_str(), to.as_str());
        let engine = Diff::compute(Algorithm::Myers, &input);
        let actual = diff(&from, &to, context);
        let old: Vec<_> = actual.hunks.iter().flat_map(|h| &h.lines)
            .filter_map(|l| if l.kind == LineKind::Removed { l.from_line.map(|n| n - 1) } else { None }).collect();
        let new: Vec<_> = actual.hunks.iter().flat_map(|h| &h.lines)
            .filter_map(|l| if l.kind == LineKind::Added { l.to_line.map(|n| n - 1) } else { None }).collect();
        prop_assert_eq!(&old, &(0..input.before.len()).filter(|&i| engine.is_removed(i as u32)).collect::<Vec<_>>());
        prop_assert_eq!(&new, &(0..input.after.len()).filter(|&i| engine.is_added(i as u32)).collect::<Vec<_>>());
        prop_assert_eq!(actual.removed, old.len());
        prop_assert_eq!(actual.added, new.len());

        let original: Vec<_> = lines(&from).collect();
        let mut cursor = 0;
        let mut reconstructed = String::new();
        for hunk in &actual.hunks {
            let start = hunk.from_start - usize::from(hunk.from_count != 0);
            for line in &original[cursor..start] { reconstructed.push_str(line); }
            cursor = start;
            for line in &hunk.lines {
                if line.kind != LineKind::Added { cursor += 1; }
                if line.kind != LineKind::Removed {
                    reconstructed.push_str(line.text);
                    if !line.missing_newline { reconstructed.push('\n'); }
                }
                let mut end = 0;
                for range in &line.emphasis {
                    prop_assert!(range.start < range.end && range.end <= line.text.len());
                    prop_assert!(line.text.is_char_boundary(range.start) && line.text.is_char_boundary(range.end));
                    prop_assert!(range.start >= end);
                    if end != 0 { prop_assert!(range.start > end); }
                    end = range.end;
                }
            }
        }
        for line in &original[cursor..] { reconstructed.push_str(line); }
        prop_assert_eq!(reconstructed, to);
    }
}
