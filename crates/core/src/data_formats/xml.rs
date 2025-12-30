use crate::data_formats::util::normalize_whitespace;
use json::JsonValue;
use quick_xml::events::Event;
use quick_xml::{Reader, Writer};
use std::collections::HashMap;

pub fn beautify(input: &str, spaces: u8) -> Result<String, String> {
    format(input, Some(spaces))
}

pub fn minify(input: &str) -> Result<String, String> {
    format(input, None)
}

pub fn convert_to_json(input: &str) -> Result<String, String> {
    let mut reader = Reader::from_str(input);
    reader.config_mut().trim_text(false);
    let json_value = xml_to_json_element(&mut reader)?;
    Ok(json::stringify(json_value))
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

/// Maps XML entity names to their character equivalents
fn entity_to_char(entity_name: &str) -> Option<&'static str> {
    match entity_name {
        "amp" => Some("&"),
        "lt" => Some("<"),
        "gt" => Some(">"),
        "quot" => Some("\""),
        "apos" => Some("'"),
        _ => None,
    }
}

/// Escapes special XML characters to prevent parser misinterpretation.
/// WHY: Characters like &, <, >, ", ' have syntactic meaning in XML and must be escaped so they're
/// treated as literal content rather than markup/delimiters. Without escaping, `<message>1 < 2</message>`
/// would be invalid (parser thinks "<" starts a tag).
pub(crate) fn escape(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => result.push_str("&amp;"),
            '<' => result.push_str("&lt;"),
            '>' => result.push_str("&gt;"),
            '"' => result.push_str("&quot;"),
            '\'' => result.push_str("&apos;"),
            _ => result.push(c),
        }
    }
    result
}

/// Unescapes XML entity references using placeholder-based two-pass replacement.
/// WHY placeholder technique: Direct sequential replacement of "&amp;" to "&" would corrupt other
/// entities. For example, "&amp;lt;" should decode to "&lt;" (the literal text), but if we replace
/// "&amp;" first, we'd get "&lt;" → "<" (wrong!). Placeholder defers "&amp;" replacement until
/// after other entities are replaced, preventing this corruption.
pub(crate) fn unescape(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '&' {
            let mut entity = String::new();

            while let Some(&next) = chars.peek() {
                if next == ';' {
                    chars.next();
                    break;
                }
                entity.push(chars.next().unwrap());
            }

            if let Some(entity_char) = entity_to_char(&entity) {
                result.push_str(entity_char);
            } else {
                // Not a recognized entity, keep it as-is
                result.push('&');
                result.push_str(&entity);
                result.push(';');
            }
        } else {
            result.push(c);
        }
    }

    result
}

fn xml_to_json_element(reader: &mut Reader<&[u8]>) -> Result<JsonValue, String> {
    let mut root = None;
    let mut buf = Vec::with_capacity(8192);

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                let tag_name = String::from_utf8(e.name().as_ref().to_vec())
                    .map_err(|_| "Failed to decode tag name".to_string())?;
                let element_value = read_element(reader, &tag_name)?;

                if root.is_none() {
                    root = Some((tag_name, element_value));
                } else {
                    return Err("XML must have a single root element".to_string());
                }
            }
            Ok(Event::Eof) => break,
            Ok(_) => {}
            Err(e) => return Err(format!("XML parse error: {e}")),
        }
        buf.clear();
    }

    match root {
        Some((tag_name, value)) => {
            let mut obj = JsonValue::new_object();
            obj.insert(&tag_name, value)
                .map_err(|_| "Failed to create JSON object".to_string())?;
            Ok(obj)
        }
        None => Err("No XML elements found".to_string()),
    }
}

fn read_element(reader: &mut Reader<&[u8]>, tag_name: &str) -> Result<JsonValue, String> {
    let mut buf = Vec::with_capacity(8192);
    let mut children: HashMap<String, Vec<JsonValue>> = HashMap::new();
    let mut text_content = String::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                let child_tag = String::from_utf8(e.name().as_ref().to_vec())
                    .map_err(|_| "Failed to decode tag name".to_string())?;
                let child_value = read_element(reader, &child_tag)?;
                children.entry(child_tag).or_default().push(child_value);
            }
            Ok(Event::Text(ref e)) => {
                // Convert bytes to string and unescape XML entities
                let text = String::from_utf8(e.as_ref().to_vec())
                    .map_err(|_| "Failed to decode text".to_string())?;
                let unescaped = unescape(&text);
                text_content.push_str(&unescaped);
            }
            Ok(Event::GeneralRef(ref e)) => {
                // Handle XML entity references (e.g., &amp; &lt; &gt; &quot; &apos;)
                let entity_name = String::from_utf8(e.as_ref().to_vec())
                    .map_err(|_| "Failed to decode entity name".to_string())?;
                if let Some(entity_char) = entity_to_char(&entity_name) {
                    text_content.push_str(entity_char);
                } else {
                    return Err(format!("Unsupported entity reference: &{};", entity_name));
                }
            }
            Ok(Event::End(ref e)) => {
                let end_tag = String::from_utf8(e.name().as_ref().to_vec())
                    .map_err(|_| "Failed to decode end tag".to_string())?;
                if end_tag == tag_name {
                    break;
                }
            }
            Ok(Event::Eof) => return Err("Unexpected EOF while parsing element".to_string()),
            Ok(_) => {}
            Err(e) => return Err(format!("XML parse error: {e}")),
        }
        buf.clear();
    }

    let normalized_text = normalize_whitespace(&text_content);

    if children.is_empty() && normalized_text.is_empty() {
        Ok(JsonValue::Null)
    } else if children.is_empty() {
        Ok(JsonValue::String(normalized_text))
    } else if normalized_text.is_empty() {
        let mut obj = JsonValue::new_object();
        for (key, values) in children {
            let value = if values.len() == 1 {
                values.into_iter().next().unwrap()
            } else {
                JsonValue::Array(values)
            };
            obj.insert(&key, value)
                .map_err(|_| "Failed to create JSON object".to_string())?;
        }
        Ok(obj)
    } else {
        let mut obj = JsonValue::new_object();
        obj.insert("#text", JsonValue::String(normalized_text))
            .map_err(|_| "Failed to create JSON object".to_string())?;
        for (key, values) in children {
            let value = if values.len() == 1 {
                values.into_iter().next().unwrap()
            } else {
                JsonValue::Array(values)
            };
            obj.insert(&key, value)
                .map_err(|_| "Failed to create JSON object".to_string())?;
        }
        Ok(obj)
    }
}
