mod common;

#[cfg(target_os = "linux")]
#[test]
fn required_input_fails_promptly_on_a_real_terminal() {
    use std::{process::Command, time::Duration};

    use common::command_with_timeout;

    for arguments in ["base64 encode", "time from"] {
        let command_line = format!("{} {arguments}", env!("CARGO_BIN_EXE_strapd"));
        let output = command_with_timeout(
            Command::new("script").args(["-qefc", &command_line, "/dev/null"]),
            None,
            Duration::from_secs(2),
        );

        assert!(!output.output.status.success());
        let terminal_output = String::from_utf8_lossy(&output.output.stdout);
        assert!(terminal_output.contains("provided"));
        assert!(terminal_output.contains("Pass it as an argument or pipe it through stdin"));
    }
}
