use crate::string;
use sqlparse::{FormatOption, Formatter};

pub fn beautify(input: &str, spaces: u8) -> String {
    let mut f = Formatter::default();
    let mut options = FormatOption::default();
    options.reindent = true;
    options.indent_width = spaces.into();
    f.format(input, &mut options)
}

pub fn minify(input: &str) -> String {
    let mut f = Formatter::default();
    let mut options = FormatOption::default();
    options.reindent = true;
    let formatted = f.format(input, &mut options).replace('\n', "");
    string::whitespace::trim(&formatted, false, false, true)
}
