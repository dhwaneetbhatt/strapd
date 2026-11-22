use std::{
    env,
    ffi::OsStr,
    fs,
    io::{self, BufWriter, IsTerminal, Write},
    path::PathBuf,
};

#[cfg(test)]
#[path = "../../tests/common/diff_handler_tests.rs"]
mod tests;

use strapd_core::string::diff::diff;

use super::diff_render::{side_by_side, unified};
use crate::{
    args::string::{DiffArgs, DiffColor},
    input::read_stdin_bytes,
};

enum Source {
    Literal(String),
    File(PathBuf),
    Stdin,
}

impl Source {
    fn resolve(
        file: Option<PathBuf>,
        inputs: &mut impl Iterator<Item = String>,
        side: &str,
    ) -> Result<Self, String> {
        match file {
            Some(path) => Ok(Self::File(path)),
            None => match inputs.next() {
                Some(text) if text == "-" => Ok(Self::Stdin),
                Some(text) => Ok(Self::Literal(text)),
                None => Err(format!(
                    "Missing {side} input: supply text, --{side}-file, or - for stdin"
                )),
            },
        }
    }

    fn read(
        self,
        side: &str,
        label: Option<String>,
        literal_label: &str,
    ) -> Result<(String, String), String> {
        let (bytes, label) = match self {
            Self::Literal(text) => {
                return Ok((text, label.unwrap_or_else(|| literal_label.into())));
            }
            Self::File(path) => {
                let bytes = fs::read(&path).map_err(|error| {
                    format!("Failed to read {side} file {}: {error}", path.display())
                })?;
                (
                    bytes,
                    label.unwrap_or_else(|| path.to_string_lossy().into_owned()),
                )
            }
            Self::Stdin => (
                read_stdin_bytes(&format!("{side} input"))?,
                label.unwrap_or_else(|| "-".into()),
            ),
        };
        let text = String::from_utf8(bytes).map_err(|error| {
            format!(
                "The {side} input is not valid UTF-8: {}",
                error.utf8_error()
            )
        })?;
        Ok((text, label))
    }
}

fn resolve_sources(
    inputs: Vec<String>,
    from_file: Option<PathBuf>,
    to_file: Option<PathBuf>,
) -> Result<(Source, Source), String> {
    let mut inputs = inputs.into_iter();
    let from = Source::resolve(from_file, &mut inputs, "from")?;
    let to = Source::resolve(to_file, &mut inputs, "to")?;
    if inputs.next().is_some() {
        return Err(
            "Unexpected positional input: both from and to inputs are already supplied".into(),
        );
    }
    if matches!((&from, &to), (Source::Stdin, Source::Stdin)) {
        return Err("The to input cannot use stdin when the from input already uses it".into());
    }
    Ok((from, to))
}

fn auto_color(is_terminal: bool, no_color: Option<&OsStr>) -> bool {
    is_terminal && no_color.is_none_or(OsStr::is_empty)
}

pub fn handle(args: DiffArgs) -> Result<bool, String> {
    let (from, to) = resolve_sources(args.inputs, args.from_file, args.to_file)?;
    if args.labels.len() > 2 {
        return Err("At most two --label options can be supplied (from and to)".into());
    }
    let mut labels = args.labels.into_iter();
    let (from, from_label) = from.read("from", labels.next(), "a")?;
    let (to, to_label) = to.read("to", labels.next(), "b")?;
    let result = diff(&from, &to, args.context as usize);
    if result.hunks.is_empty() {
        return Ok(false);
    }

    let stdout = io::stdout();
    let color = match args.color {
        DiffColor::Always => true,
        DiffColor::Never => false,
        DiffColor::Auto => auto_color(stdout.is_terminal(), env::var_os("NO_COLOR").as_deref()),
    };
    let mut out = BufWriter::with_capacity(64 * 1024, stdout.lock());
    let written = if args.side_by_side {
        side_by_side(&result, args.width as usize, color, &mut out)
    } else {
        unified(&result, &from_label, &to_label, color, &mut out)
    };
    match written.and_then(|()| out.flush()) {
        Ok(()) => Ok(true),
        Err(error) if error.kind() == io::ErrorKind::BrokenPipe => {
            // Discard any buffered bytes instead of retrying the write on drop.
            let _ = out.into_parts();
            Ok(true)
        }
        Err(error) => Err(format!("Failed to write diff to stdout: {error}")),
    }
}
