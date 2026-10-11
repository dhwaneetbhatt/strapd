use std::{
    borrow::Cow,
    io::{self, Cursor, Read},
};

use super::{
    bytes_with_piped_trim, piped_text_from, required_bytes_from, required_text_from,
    text_with_piped_trim,
};

struct PanicReader;

impl Read for PanicReader {
    fn read(&mut self, _buffer: &mut [u8]) -> io::Result<usize> {
        panic!("argument precedence must avoid reading stdin")
    }
}

struct PartialReader {
    chunks: Vec<Vec<u8>>,
}

impl Read for PartialReader {
    fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
        if self.chunks.is_empty() {
            return Ok(0);
        }
        let chunk = self.chunks.remove(0);
        buffer[..chunk.len()].copy_from_slice(&chunk);
        Ok(chunk.len())
    }
}

struct FailingReader;

impl Read for FailingReader {
    fn read(&mut self, _buffer: &mut [u8]) -> io::Result<usize> {
        Err(io::Error::other("injected failure"))
    }
}

#[test]
fn text_argument_is_borrowed_without_reading() {
    let value = required_text_from(Some(" value "), "input", PanicReader, true).unwrap();
    assert!(matches!(value, Cow::Borrowed(" value ")));
}

#[test]
fn byte_argument_is_borrowed_without_reading() {
    let value = required_bytes_from(Some("value"), "input", PanicReader, true).unwrap();
    assert!(matches!(value, Cow::Borrowed(b"value")));
}

#[test]
fn missing_interactive_input_is_actionable() {
    let error = required_text_from(None, "JSON input", Cursor::new([]), true).unwrap_err();
    assert_eq!(
        error,
        "No JSON input provided. Pass it as an argument or pipe it through stdin."
    );
}

#[test]
fn empty_non_interactive_input_is_present() {
    assert_eq!(
        required_text_from(None, "input", Cursor::new([]), false).unwrap(),
        Cow::Owned::<str>(String::new())
    );
    assert_eq!(
        required_bytes_from(None, "input", Cursor::new([]), false).unwrap(),
        Cow::Owned::<[u8]>(Vec::new())
    );
    assert_eq!(
        piped_text_from(Cursor::new([]), false).unwrap(),
        Some(String::new())
    );
}

#[test]
fn partial_reads_are_collected() {
    let reader = PartialReader {
        chunks: vec![b"one".to_vec(), b"-two".to_vec()],
    };
    assert_eq!(
        required_text_from(None, "input", reader, false).unwrap(),
        "one-two"
    );
}

#[test]
fn read_failures_are_returned() {
    let error = required_bytes_from(None, "message", FailingReader, false).unwrap_err();
    assert!(error.contains("Failed to read message from stdin"));
    assert!(error.contains("injected failure"));
}

#[test]
fn invalid_utf8_is_returned_as_an_error() {
    let error = required_text_from(None, "input", Cursor::new([0xff]), false).unwrap_err();
    assert!(error.contains("Failed to read input from stdin"));
    assert!(error.contains("valid UTF-8"));
}

#[test]
fn arbitrary_bytes_are_exact() {
    let bytes = [0, b' ', b'\n', 0xff];
    let input = required_bytes_from(None, "input", Cursor::new(bytes), false).unwrap();
    assert_eq!(input.as_ref(), bytes);
}

#[test]
fn optional_pipe_distinguishes_terminal_from_empty_pipe() {
    assert_eq!(piped_text_from(Cursor::new([]), true).unwrap(), None);
    assert_eq!(
        piped_text_from(Cursor::new([]), false).unwrap(),
        Some(String::new())
    );
}

#[test]
fn compatibility_trimming_only_applies_to_owned_stdin() {
    let argument = Cow::Borrowed("  value  ");
    let stdin = Cow::Owned(String::from("  value  \n"));
    assert_eq!(text_with_piped_trim(&argument), "  value  ");
    assert_eq!(text_with_piped_trim(&stdin), "value");

    let argument = Cow::Borrowed(&b"  value  "[..]);
    let stdin = Cow::Owned(b" \tvalue\r\n".to_vec());
    assert_eq!(bytes_with_piped_trim(&argument), b"  value  ");
    assert_eq!(bytes_with_piped_trim(&stdin), b"value");

    let unicode_stdin = Cow::Owned("\u{2003}value\u{2003}".as_bytes().to_vec());
    assert_eq!(bytes_with_piped_trim(&unicode_stdin), b"value");
}
