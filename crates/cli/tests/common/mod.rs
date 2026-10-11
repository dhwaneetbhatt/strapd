#![allow(dead_code)]

use std::{
    io::Write,
    process::{Command, Output, Stdio},
    thread,
    time::{Duration, Instant},
};

pub struct CommandOutput {
    pub output: Output,
    pub elapsed: Duration,
}

pub fn strapd(args: &[&str], stdin: Option<&[u8]>) -> CommandOutput {
    strapd_with_timeout(args, stdin, Duration::from_secs(5))
}

pub fn strapd_with_timeout(
    args: &[&str],
    stdin: Option<&[u8]>,
    timeout: Duration,
) -> CommandOutput {
    let mut command = Command::new(env!("CARGO_BIN_EXE_strapd"));
    command.args(args);
    command_with_timeout(&mut command, stdin, timeout)
}

pub fn strapd_with_open_stdin(args: &[&str], timeout: Duration) -> CommandOutput {
    let mut command = Command::new(env!("CARGO_BIN_EXE_strapd"));
    command
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let started = Instant::now();
    let mut child = command.spawn().expect("failed to start strapd");

    loop {
        if child.try_wait().expect("failed to poll strapd").is_some() {
            let output = child
                .wait_with_output()
                .expect("failed to collect strapd output");
            return CommandOutput {
                output,
                elapsed: started.elapsed(),
            };
        }
        if started.elapsed() >= timeout {
            child.kill().expect("failed to kill timed-out strapd");
            let _ = child.wait();
            panic!("strapd did not ignore open stdin when an argument was supplied");
        }
        thread::sleep(Duration::from_millis(10));
    }
}

pub fn command_with_timeout(
    command: &mut Command,
    stdin: Option<&[u8]>,
    timeout: Duration,
) -> CommandOutput {
    command
        .stdin(if stdin.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let started = Instant::now();
    let mut child = command.spawn().expect("failed to start strapd");

    if let Some(input) = stdin {
        child
            .stdin
            .take()
            .expect("stdin was not piped")
            .write_all(input)
            .expect("failed to write test stdin");
    }

    loop {
        if child.try_wait().expect("failed to poll strapd").is_some() {
            let output = child
                .wait_with_output()
                .expect("failed to collect strapd output");
            return CommandOutput {
                output,
                elapsed: started.elapsed(),
            };
        }

        if started.elapsed() >= timeout {
            child.kill().expect("failed to kill timed-out strapd");
            let _ = child.wait();
            panic!("command did not complete within {timeout:?}");
        }

        thread::sleep(Duration::from_millis(10));
    }
}

pub fn assert_success(result: &CommandOutput, stdout: &[u8]) {
    assert!(
        result.output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&result.output.stderr)
    );
    assert_eq!(result.output.stdout, stdout);
    assert!(result.output.stderr.is_empty());
}

pub fn assert_failure_contains(result: &CommandOutput, stderr: &str) {
    assert!(!result.output.status.success());
    assert!(result.output.stdout.is_empty());
    assert!(
        String::from_utf8_lossy(&result.output.stderr).contains(stderr),
        "stderr: {}",
        String::from_utf8_lossy(&result.output.stderr)
    );
}
