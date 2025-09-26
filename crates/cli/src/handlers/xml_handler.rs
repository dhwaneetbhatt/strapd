use crate::{
    args::data_formats::XmlOperation,
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::data_formats::xml;

pub fn handle(operation: &XmlOperation) -> CommandResult {
    match operation {
        XmlOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            text_result(xml::beautify(&input, *spaces)?)
        }
        XmlOperation::Minify { input } => {
            let input = get_input_string(input);
            text_result(xml::minify(&input)?)
        }
    }
}
