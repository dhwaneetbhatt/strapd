/// Normalizes XML whitespace to canonical JSON format.
/// WHY necessary: XML preserves all whitespace (newlines, indentation) literally. A formatted XML
/// element like `<description>\n  Hello\n  World\n</description>` should become `"Hello World"` in JSON,
/// not `"\n  Hello\n  World\n"`. Trim removes formatting artifacts; split/join collapses internal
/// whitespace while preserving semantic content like spaces in "a & b".
pub(crate) fn normalize_whitespace(s: &str) -> String {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        String::new()
    } else {
        let mut result = String::with_capacity(trimmed.len());
        let mut in_whitespace = false;

        for c in trimmed.chars() {
            if c.is_whitespace() {
                if !in_whitespace && !result.is_empty() {
                    result.push(' ');
                    in_whitespace = true;
                }
            } else {
                result.push(c);
                in_whitespace = false;
            }
        }

        result
    }
}
