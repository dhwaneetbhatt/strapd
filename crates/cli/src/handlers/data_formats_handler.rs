use crate::{
    args::data_formats::{JsonOperation, JsonOutput, SqlOperation, XmlOperation, YamlOperation},
    handlers::{CommandResult, error_result, text_result},
    input::{required_text, text_with_piped_trim},
};
use strapd_core::data_formats::{json, json_prune, sql, xml, yaml};

pub fn handle_json(operation: &JsonOperation) -> CommandResult {
    match operation {
        JsonOperation::Prune {
            input,
            drop_keys,
            sample,
            sample_size,
            output,
        } => {
            let input = required_text(input.as_deref(), "JSON input")?;
            let sample_size = if *sample || sample_size.is_some() {
                Some(sample_size.unwrap_or(3))
            } else {
                None
            };
            let outcome = json_prune::prune(
                text_with_piped_trim(&input),
                drop_keys.as_deref().unwrap_or(""),
                sample_size,
            )?;
            match output {
                JsonOutput::Raw => text_result(outcome.output),
                JsonOutput::Json => text_result(json_prune_response(&outcome)),
            }
        }
        JsonOperation::Beautify {
            input,
            spaces,
            sort,
        } => {
            let input = required_text(input.as_deref(), "JSON input")?;
            match json::beautify(text_with_piped_trim(&input), *spaces, *sort) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Minify { input, sort } => {
            let input = required_text(input.as_deref(), "JSON input")?;
            match json::minify(text_with_piped_trim(&input), *sort) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Sort { input, format } => {
            let input = required_text(input.as_deref(), "JSON input")?;
            match json::sort(text_with_piped_trim(&input), *format) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Convert { input, to, root } => {
            let input = required_text(input.as_deref(), "JSON input")?;
            let input = text_with_piped_trim(&input);
            match to.as_str() {
                "yaml" => match json::convert_to_yaml(input) {
                    Ok(json) => text_result(json),
                    Err(e) => error_result(&e),
                },
                "xml" => match json::convert_to_xml(input, root.as_deref()) {
                    Ok(xml) => text_result(xml),
                    Err(e) => error_result(&e),
                },
                _ => error_result("JSON can only be converted to yaml or xml"),
            }
        }
    }
}

fn json_prune_response(outcome: &json_prune::PruneOutcome) -> String {
    let arrays: Vec<_> = outcome
        .sampling
        .arrays
        .iter()
        .map(|array| serde_json::json!({ "path": array.path, "omitted": array.omitted }))
        .collect();
    let metadata = serde_json::json!({
        "pruned": {
            "nulls": outcome.pruned.nulls,
            "emptyStrings": outcome.pruned.empty_strings,
            "emptyObjects": outcome.pruned.empty_objects,
            "emptyArrays": outcome.pruned.empty_arrays,
            "droppedKeys": outcome.pruned.dropped_keys,
        },
        "sampling": {
            "omittedTotal": outcome.sampling.omitted_total,
            "arrays": arrays,
        },
    });
    let metadata = serde_json::to_string(&metadata).expect("CLI metadata is JSON serializable");
    format!("{{\"data\":{},\"metadata\":{metadata}}}", outcome.output)
}

pub fn handle_yaml(operation: &YamlOperation) -> CommandResult {
    match operation {
        YamlOperation::Convert { input, to } => {
            if *to != "json" {
                return error_result("YAML can only be converted to json");
            }
            let input = required_text(input.as_deref(), "YAML input")?;
            match yaml::convert_to_json(text_with_piped_trim(&input)) {
                Ok(json) => text_result(json),
                Err(e) => error_result(&e),
            }
        }
    }
}

pub fn handle_xml(operation: &XmlOperation) -> CommandResult {
    match operation {
        XmlOperation::Beautify { input, spaces } => {
            let input = required_text(input.as_deref(), "XML input")?;
            match xml::beautify(text_with_piped_trim(&input), *spaces) {
                Ok(xml) => text_result(xml),
                Err(e) => error_result(&e),
            }
        }
        XmlOperation::Minify { input } => {
            let input = required_text(input.as_deref(), "XML input")?;
            match xml::minify(text_with_piped_trim(&input)) {
                Ok(xml) => text_result(xml),
                Err(e) => error_result(&e),
            }
        }
        XmlOperation::Convert { input, to } => {
            if *to != "json" {
                return error_result("XML can only be converted to json");
            }
            let input = required_text(input.as_deref(), "XML input")?;
            match xml::convert_to_json(text_with_piped_trim(&input)) {
                Ok(json) => text_result(json),
                Err(e) => error_result(&e),
            }
        }
    }
}

pub fn handle_sql(operation: &SqlOperation) -> CommandResult {
    match operation {
        SqlOperation::Beautify { input, spaces } => {
            let input = required_text(input.as_deref(), "SQL input")?;
            text_result(sql::beautify(text_with_piped_trim(&input), *spaces))
        }
        SqlOperation::Minify { input } => {
            let input = required_text(input.as_deref(), "SQL input")?;
            text_result(sql::minify(text_with_piped_trim(&input)))
        }
    }
}
