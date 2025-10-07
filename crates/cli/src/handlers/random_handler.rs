use crate::{
    args::random::{RandomOperation, RandomStringArgs},
    handlers::{CommandResult, error_result, text_result},
};
use strapd_core::random;

pub fn handle(operation: &RandomOperation) -> CommandResult {
    match operation {
        RandomOperation::String { args } => handle_random_string(args),
        RandomOperation::Number { min, max, count } => text_result(
            random::number(*min, *max, *count)
                .iter()
                .map(|n| n.to_string())
                .collect::<Vec<_>>()
                .join("\n"),
        ),
    }
}

pub(super) fn handle_random_string(args: &RandomStringArgs) -> CommandResult {
    // If no flags are specified then use all the character types
    let any_flag_set = args.lowercase || args.uppercase || args.digits || args.symbols;
    let (lower, upper, digit, symbol) = if any_flag_set {
        (args.lowercase, args.uppercase, args.digits, args.symbols)
    } else {
        (true, true, true, true)
    };

    let mut results = Vec::new();
    for _ in 0..args.count {
        let result = random::string(args.length, lower, upper, digit, symbol);
        match result {
            Ok(s) => results.push(s),
            Err(e) => return error_result(&e),
        }
    }
    text_result(results.join("\n"))
}
