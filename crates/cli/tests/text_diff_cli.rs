mod common;

use std::{
    fs,
    io::Read,
    process::{Command, Stdio},
    time::Duration,
};

use common::{
    assert_failure_contains, assert_success, command_with_timeout, strapd, strapd_with_open_stdin,
};
use strapd_core::string::diff::{diff, unified};
use unicode_width::UnicodeWidthStr;

fn strip_sgr(bytes: &[u8]) -> Vec<u8> {
    let mut plain = Vec::new();
    let mut rest = bytes;
    while let Some((&byte, tail)) = rest.split_first() {
        if let Some(escape) = rest.strip_prefix(b"\x1b[") {
            let end = escape.iter().position(|byte| *byte == b'm').unwrap();
            assert!(escape[..end].iter().all(u8::is_ascii_digit));
            rest = &escape[end + 1..];
        } else {
            plain.push(byte);
            rest = tail;
        }
    }
    plain
}

#[test]
fn literals_are_exact_and_aliases_work() {
    let from = " a b \t\n";
    let to = " a c \t";
    let patch = unified(&diff(from, to, 3), "a", "b");
    for command in ["text", "string", "str"] {
        let output = strapd(&[command, "diff", from, to], None);
        assert_success(&output, patch.as_bytes());
    }
    for (from, to) in [("--exit-code", ""), ("-x", "y")] {
        let plain = strapd(&["text", "diff", "--", from, to], None);
        assert_success(&plain, unified(&diff(from, to, 3), "a", "b").as_bytes());
    }
}

#[test]
fn unified_patch_applies_cleanly() {
    let dir = std::env::temp_dir().join(format!("strapd-diff-apply-{}", std::process::id()));
    let old = "old/text.txt";
    let new = "new/text.txt";
    fs::create_dir(&dir).unwrap();
    fs::create_dir(dir.join("old")).unwrap();
    fs::create_dir(dir.join("new")).unwrap();
    let context = "common\n".repeat(10);
    let multi_from = format!("before\n{context}old\n");
    let multi_to = format!("after\n{context}new\n");
    for (from, to, hunk_count) in [
        (multi_from.as_str(), multi_to.as_str(), 2),
        ("same\r\nold\r\n", "same\r\nnew\r\n", 1),
        ("same\nold\n", "same\nnew", 1),
    ] {
        fs::write(dir.join(old), from).unwrap();
        fs::write(dir.join(new), to).unwrap();
        fs::copy(dir.join(old), dir.join("text.txt")).unwrap();
        let mut command = Command::new(env!("CARGO_BIN_EXE_strapd"));
        command.current_dir(&dir).args([
            "text",
            "diff",
            "--color",
            "never",
            "--from-file",
            old,
            "--to-file",
            new,
            "--label",
            old,
            "--label",
            new,
        ]);
        let patch = command_with_timeout(&mut command, None, common::DEFAULT_TIMEOUT);
        assert!(patch.output.status.success());
        assert!(patch.output.stderr.is_empty());
        assert_eq!(
            patch
                .output
                .stdout
                .split(|&byte| byte == b'\n')
                .filter(|row| row.starts_with(b"@@ "))
                .count(),
            hunk_count
        );
        let mut apply = Command::new("git");
        apply
            .current_dir(&dir)
            .args(["apply", "--whitespace=nowarn", "-"]);
        let output = command_with_timeout(
            &mut apply,
            Some(&patch.output.stdout),
            common::DEFAULT_TIMEOUT,
        );
        assert!(
            output.output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.output.stderr)
        );
        assert_eq!(
            fs::read(dir.join("text.txt")).unwrap(),
            fs::read(dir.join(new)).unwrap()
        );
    }
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn files_use_path_labels_and_stdin_fills_the_open_side() {
    let dir = std::env::temp_dir().join(format!("strapd-text-diff-{}", std::process::id()));
    fs::create_dir(&dir).unwrap();
    let from = "keep\r\n\tbefore \r\n";
    let to = "keep\r\n\tafter \r\n";
    let old_path = dir.join("old.txt");
    let new_path = dir.join("new.txt");
    let invalid = dir.join("invalid.txt");
    fs::write(&old_path, from).unwrap();
    fs::write(&new_path, to).unwrap();
    fs::write(&invalid, [0xff]).unwrap();
    let old = old_path.to_str().unwrap();
    let new = new_path.to_str().unwrap();
    let result = diff(from, to, 3);
    let files = strapd(
        &["text", "diff", "--from-file", old, "--to-file", new],
        None,
    );
    assert_success(&files, unified(&result, old, new).as_bytes());

    let pipe_to = strapd(
        &["text", "diff", "--from-file", old, "-"],
        Some(to.as_bytes()),
    );
    assert_success(&pipe_to, unified(&result, old, "-").as_bytes());
    let pipe_from = strapd(
        &["text", "diff", "-", "--to-file", new],
        Some(from.as_bytes()),
    );
    assert_success(&pipe_from, unified(&result, "-", new).as_bytes());

    let empty_pipe = strapd(&["text", "diff", "-", ""], Some(b""));
    assert_success(&empty_pipe, b"");

    let invalid_file = strapd(
        &[
            "text",
            "diff",
            "old",
            "--to-file",
            invalid.to_str().unwrap(),
        ],
        None,
    );
    assert_failure_contains(&invalid_file, "to input is not valid UTF-8");
    let missing_path = dir.join("missing");
    let unreadable = strapd(
        &[
            "text",
            "diff",
            "--exit-code",
            "--from-file",
            missing_path.to_str().unwrap(),
            "new",
        ],
        None,
    );
    assert_failure_contains(&unreadable, "Failed to read from file");
    assert_eq!(unreadable.output.status.code(), Some(2));
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn invalid_sources_fail_before_reading() {
    for (args, message) in [
        (&["text", "diff"][..], "Missing from input"),
        (&["text", "diff", "-"], "Missing to input"),
        (&["text", "diff", "-", "-"], "to input cannot use stdin"),
        (
            &["text", "diff", "-", "new", "extra"],
            "both from and to inputs",
        ),
        (
            &["text", "diff", "--to-file", "missing", "first", "extra"],
            "both from and to inputs",
        ),
    ] {
        let output = strapd_with_open_stdin(args, Duration::from_secs(10));
        assert_failure_contains(&output, message);
        assert_eq!(output.output.status.code(), Some(1));
    }
    let invalid = strapd(&["text", "diff", "old", "-"], Some(b"\xff\n"));
    assert_failure_contains(&invalid, "to input is not valid UTF-8");
}

#[test]
fn context_and_labels_match_core() {
    let from = "a\nb\nc\nd\ne\n";
    let to = "a\nb\nC\nd\ne\n";
    for (flags, labels, context) in [
        (
            &["-U", "1", "--label", "before", "--label", "after"][..],
            ("before", "after"),
            1,
        ),
        (
            &["--unified", "0", "--label", "only before"],
            ("only before", "b"),
            0,
        ),
        (&["-U4294967295"], ("a", "b"), u32::MAX as usize),
    ] {
        let mut args = vec!["text", "diff", from, to];
        args.extend_from_slice(flags);
        let output = strapd(&args, None);
        assert_success(
            &output,
            unified(&diff(from, to, context), labels.0, labels.1).as_bytes(),
        );
    }
    let extra_label = strapd(
        &[
            "text", "diff", "old", "new", "--label", "a", "--label", "b", "--label", "c",
        ],
        None,
    );
    assert_failure_contains(&extra_label, "At most two --label options");
}

#[test]
fn color_matches_git_style_and_strips_to_the_core_patch() {
    let from = "keep\r\nlet timeout = 30;\r\nshared\nshared\nshared\nold\n";
    let to = "keep\r\nlet timeout = 60;\r\nshared\nshared\nshared\nnew";
    let expected = unified(&diff(from, to, 1), "before", "after");
    for color in ["auto", "never", "always"] {
        let mut command = Command::new(env!("CARGO_BIN_EXE_strapd"));
        command
            .args([
                "text", "diff", from, to, "-U1", "--label", "before", "--label", "after",
                "--color", color,
            ])
            .env("NO_COLOR", "1");
        let result = command_with_timeout(&mut command, None, common::DEFAULT_TIMEOUT);
        if color == "always" {
            let stdout = String::from_utf8_lossy(&result.output.stdout);
            assert!(
                stdout.starts_with("\x1b[1m--- before\x1b[m\n\x1b[1m+++ after\x1b[m\n\x1b[36m@@ ")
            );
            assert!(stdout.contains("\x1b[31m-let timeout = \x1b[7m30\x1b[27m;\r\x1b[m\n"));
            assert!(stdout.contains("\x1b[32m+let timeout = \x1b[7m60\x1b[27m;\r\x1b[m\n"));
            assert!(result.output.status.success());
            assert!(result.output.stderr.is_empty());
            assert_eq!(strip_sgr(&result.output.stdout), expected.as_bytes());
        } else {
            assert_success(&result, expected.as_bytes());
        }
    }
    let default_color = strapd(
        &[
            "text", "diff", "-U1", "--label", "before", "--label", "after", from, to,
        ],
        None,
    );
    assert_success(&default_color, expected.as_bytes());
}

#[test]
fn color_does_not_emphasize_a_crlf_terminator() {
    let from = "k\na\r\n";
    let to = "k\na\n";
    let output = strapd(&["text", "diff", "--color", "always", from, to], None);
    let patch = unified(&diff(from, to, 3), "a", "b");
    assert!(output.output.status.success());
    assert!(output.output.stderr.is_empty());
    assert_eq!(strip_sgr(&output.output.stdout), patch.as_bytes());
    assert!(
        !String::from_utf8(output.output.stdout)
            .unwrap()
            .contains("\x1b[7m")
    );
}

#[test]
fn side_by_side_expands_tabs_and_keeps_the_gutter_aligned() {
    let args = [
        "text",
        "diff",
        "-y",
        "-W25",
        "keep\né\t界界x\nend\n",
        "keep\n😀\tZ\nextra row\nend\n",
    ];
    let plain = strapd(&args, None);
    assert_success(
        &plain,
        "@@ -1,3 +1,4 @@\nkeep          keep\né       界  | 😀      Z\n            > extra row\nend           end\n".as_bytes(),
    );
    let stdout = String::from_utf8(plain.output.stdout).unwrap();
    for (row, gutter) in stdout.lines().skip(1).zip([' ', '|', '>', ' ']) {
        let (index, ch) = row
            .char_indices()
            .find(|(index, _)| row[..*index].width() == 12)
            .unwrap();
        assert_eq!(ch, gutter);
        assert_eq!(row[..index].width(), 12);
        assert!(row.width() <= 25);
    }
    let mut colored_args = args.to_vec();
    colored_args.extend(["--color", "always"]);
    let colored = strapd(&colored_args, None);
    assert_eq!(strip_sgr(&colored.output.stdout), stdout.as_bytes());

    let removed = strapd(&["str", "diff", "--side-by-side", "gone\n", ""], None);
    assert_success(
        &removed,
        format!("@@ -1 +0,0 @@\n{:63} < \n", "gone").as_bytes(),
    );

    let emphasized = strapd(
        &[
            "str",
            "diff",
            "-y",
            "--color",
            "always",
            "let timeout = 30;\n",
            "let timeout = 60;\n",
        ],
        None,
    );
    let stdout = String::from_utf8(emphasized.output.stdout).unwrap();
    assert!(stdout.contains("\x1b[31mlet timeout = \x1b[7m30\x1b[27m;\x1b[m"));
    assert!(stdout.contains("\x1b[32mlet timeout = \x1b[7m60\x1b[27m;\x1b[m"));
}

#[test]
fn side_by_side_escapes_controls_without_moving_the_gutter() {
    let from = "p\r\né\r\x1b\x08\x7f\r\nq\r";
    let to = "p\r\n界\r\nr\r";
    for (width, gutter, expected) in [
        (
            "-W21",
            10,
            "@@ -1,3 +1,3 @@\np           p\né^M^[^H^? | 界\nq^M       | r^M\n",
        ),
        ("-W3", 1, "@@ -1,3 +1,3 @@\n   \n | \n | \n"),
        ("-W7", 3, "@@ -1,3 +1,3 @@\np    p\né  | 界\nq  | r\n"),
    ] {
        let plain = strapd(&["text", "diff", "-y", width, from, to], None);
        assert_success(&plain, expected.as_bytes());
        let stdout = String::from_utf8(plain.output.stdout).unwrap();
        for (row, marker) in stdout.lines().skip(1).zip([' ', '|', '|']) {
            let (index, ch) = row
                .char_indices()
                .find(|(index, _)| row[..*index].width() == gutter)
                .unwrap();
            assert_eq!(ch, marker);
            assert_eq!(row[..index].width(), gutter);
        }
    }
}

#[test]
fn exit_status_and_identical_output() {
    let expected = unified(&diff("a", "b", 3), "a", "b");
    let differs = strapd(&["text", "diff", "--exit-code", "a", "b"], None);
    assert_eq!(differs.output.status.code(), Some(1));
    assert_eq!(differs.output.stdout, expected.as_bytes());
    assert!(differs.output.stderr.is_empty());
    let default_mode = strapd(&["text", "diff", "a", "b"], None);
    assert_success(&default_mode, expected.as_bytes());

    for (flags, expected_code) in [(&[][..], 1), (&["--exit-code"][..], 2)] {
        let mut args = vec!["text", "diff", "a", "b", "-W20"];
        args.extend_from_slice(flags);
        let invalid = strapd(&args, None);
        assert_failure_contains(&invalid, "--side-by-side");
        assert_eq!(invalid.output.status.code(), Some(expected_code));
    }
    for flags in [
        &[][..],
        &["--exit-code"][..],
        &["-y", "--exit-code", "--color", "always"][..],
    ] {
        let mut args = vec!["text", "diff", "same", "same"];
        args.extend_from_slice(flags);
        assert_success(&strapd(&args, None), b"");
    }
}

#[test]
fn closing_stdout_early_is_not_an_error() {
    let file = std::env::temp_dir().join(format!("strapd-diff-pipe-{}", std::process::id()));
    fs::write(&file, "context line\n".repeat(200_000)).unwrap();
    for (flags, expected_code) in [(&[][..], 0), (&["--exit-code"][..], 1)] {
        let mut child = Command::new(env!("CARGO_BIN_EXE_strapd"))
            .args(["text", "diff", "-U100000000", "--from-file"])
            .arg(&file)
            .arg("")
            .args(flags)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let mut stdout = child.stdout.take().unwrap();
        let mut prefix = [0; 4];
        stdout.read_exact(&mut prefix).unwrap();
        assert_eq!(&prefix, b"--- ");
        drop(stdout);
        let output = child.wait_with_output().unwrap();
        assert!(output.stderr.is_empty(), "{:?}", output.stderr);
        assert_eq!(output.status.code(), Some(expected_code));
    }
    fs::remove_file(file).unwrap();
}
