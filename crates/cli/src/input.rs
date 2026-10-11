use std::{
    borrow::Cow,
    io::{self, IsTerminal, Read},
};

pub fn required_text<'a>(argument: Option<&'a str>, name: &str) -> Result<Cow<'a, str>, String> {
    let stdin = io::stdin();
    required_text_from(argument, name, stdin.lock(), stdin.is_terminal())
}

pub fn required_bytes<'a>(argument: Option<&'a str>, name: &str) -> Result<Cow<'a, [u8]>, String> {
    let stdin = io::stdin();
    required_bytes_from(argument, name, stdin.lock(), stdin.is_terminal())
}

pub fn piped_text() -> Result<Option<String>, String> {
    let stdin = io::stdin();
    piped_text_from(stdin.lock(), stdin.is_terminal())
}

#[allow(
    clippy::ptr_arg,
    reason = "Cow ownership records whether input came from stdin"
)]
pub fn text_with_piped_trim<'a>(input: &'a Cow<'_, str>) -> &'a str {
    match input {
        Cow::Borrowed(argument) => argument,
        Cow::Owned(stdin) => stdin.trim(),
    }
}

#[allow(
    clippy::ptr_arg,
    reason = "Cow ownership records whether input came from stdin"
)]
pub fn bytes_with_piped_trim<'a>(input: &'a Cow<'_, [u8]>) -> &'a [u8] {
    match input {
        Cow::Borrowed(argument) => argument,
        Cow::Owned(stdin) => match std::str::from_utf8(stdin) {
            Ok(text) => text.trim().as_bytes(),
            Err(_) => trim_ascii_whitespace(stdin),
        },
    }
}

fn trim_ascii_whitespace(input: &[u8]) -> &[u8] {
    let start = input
        .iter()
        .position(|byte| !byte.is_ascii_whitespace())
        .unwrap_or(input.len());
    let end = input
        .iter()
        .rposition(|byte| !byte.is_ascii_whitespace())
        .map_or(start, |index| index + 1);
    &input[start..end]
}

fn required_text_from<'a, R: Read>(
    argument: Option<&'a str>,
    name: &str,
    mut reader: R,
    is_terminal: bool,
) -> Result<Cow<'a, str>, String> {
    if let Some(argument) = argument {
        return Ok(Cow::Borrowed(argument));
    }

    ensure_piped_input(name, is_terminal)?;
    let mut input = String::new();
    reader
        .read_to_string(&mut input)
        .map_err(|error| format!("Failed to read {name} from stdin: {error}"))?;
    Ok(Cow::Owned(input))
}

fn required_bytes_from<'a, R: Read>(
    argument: Option<&'a str>,
    name: &str,
    mut reader: R,
    is_terminal: bool,
) -> Result<Cow<'a, [u8]>, String> {
    if let Some(argument) = argument {
        return Ok(Cow::Borrowed(argument.as_bytes()));
    }

    ensure_piped_input(name, is_terminal)?;
    let mut input = Vec::new();
    reader
        .read_to_end(&mut input)
        .map_err(|error| format!("Failed to read {name} from stdin: {error}"))?;
    Ok(Cow::Owned(input))
}

fn piped_text_from<R: Read>(mut reader: R, is_terminal: bool) -> Result<Option<String>, String> {
    if is_terminal {
        return Ok(None);
    }

    let mut input = String::new();
    reader
        .read_to_string(&mut input)
        .map_err(|error| format!("Failed to read input from stdin: {error}"))?;
    Ok(Some(input))
}

fn ensure_piped_input(name: &str, is_terminal: bool) -> Result<(), String> {
    if is_terminal {
        Err(format!(
            "No {name} provided. Pass it as an argument or pipe it through stdin."
        ))
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests;
