use crate::{
    args::data_formats::SqlOperation,
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::data_formats::sql;

pub fn handle(operation: &SqlOperation) -> CommandResult {
    match operation {
        SqlOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            text_result(sql::beautify(&input, *spaces))
        }
        SqlOperation::Minify { input } => {
            let input = get_input_string(input);
            text_result(sql::minify(&input))
        }
    }
}
