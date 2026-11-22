#![allow(dead_code)]

use std::{
    io::{Read, Write},
    process::{Command, Output, Stdio},
    thread,
    time::{Duration, Instant},
};

pub const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

pub struct CommandOutput {
    pub output: Output,
    pub elapsed: Duration,
}

pub fn strapd(args: &[&str], stdin: Option<&[u8]>) -> CommandOutput {
    strapd_with_timeout(args, stdin, DEFAULT_TIMEOUT)
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
    command.args(args).stdin(Stdio::piped());
    capture_output(&mut command, None, timeout, "strapd with open stdin")
}

pub fn command_with_timeout(
    command: &mut Command,
    stdin: Option<&[u8]>,
    timeout: Duration,
) -> CommandOutput {
    command.stdin(if stdin.is_some() {
        Stdio::piped()
    } else {
        Stdio::null()
    });
    capture_output(command, stdin, timeout, "command")
}

fn capture_output(
    command: &mut Command,
    stdin: Option<&[u8]>,
    timeout: Duration,
    description: &str,
) -> CommandOutput {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    let started = Instant::now();
    let mut child = command.spawn().expect("failed to start command");
    let stdout = read_pipe(child.stdout.take().expect("stdout was not piped"));
    let stderr = read_pipe(child.stderr.take().expect("stderr was not piped"));

    if let Some(input) = stdin {
        child
            .stdin
            .take()
            .expect("stdin was not piped")
            .write_all(input)
            .expect("failed to write test stdin");
    }

    loop {
        if let Some(status) = child.try_wait().expect("failed to poll command") {
            return CommandOutput {
                output: Output {
                    status,
                    stdout: stdout.join().expect("stdout reader panicked"),
                    stderr: stderr.join().expect("stderr reader panicked"),
                },
                elapsed: started.elapsed(),
            };
        }

        if started.elapsed() >= timeout {
            child.kill().expect("failed to kill timed-out command");
            let _ = child.wait();
            panic!("{description} did not complete within {timeout:?}");
        }

        thread::sleep(Duration::from_millis(10));
    }
}

fn read_pipe(mut pipe: impl Read + Send + 'static) -> thread::JoinHandle<Vec<u8>> {
    thread::spawn(move || {
        let mut bytes = Vec::new();
        pipe.read_to_end(&mut bytes).expect("failed to read output");
        bytes
    })
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
