use quick_xml::events::Event;
use quick_xml::{Reader, Writer};

pub fn beautify(input: &str, spaces: u8) -> Result<String, String> {
    format(input, Some(spaces))
}

pub fn minify(input: &str) -> Result<String, String> {
    format(input, None)
}

fn format(input: &str, spaces: Option<u8>) -> Result<String, String> {
    let mut reader = Reader::from_str(input);
    reader.config_mut().trim_text(true);

    let mut writer = match spaces {
        None => Writer::new(Vec::<u8>::new()),
        Some(spaces) => Writer::new_with_indent(Vec::<u8>::new(), b' ', spaces.into()),
    };

    loop {
        match reader.read_event() {
            Ok(Event::Eof) => break,
            Ok(event) => writer
                .write_event(event)
                .map_err(|e| format!("XML write error: {e}"))?,
            Err(e) => return Err(format!("XML parse error: {e}")),
        }
    }
    String::from_utf8(writer.into_inner()).map_err(|e| format!("UTF-8 conversion error: {e}"))
}
