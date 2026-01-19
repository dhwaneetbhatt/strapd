use clap::Args;

#[derive(Args, Debug)]
pub struct ConvertArgs {
    /// Conversion expression like "10 km to mi" (or reads from stdin)
    /// Quote the expression: strapd convert "10 km to mi"
    /// Or use unquoted: strapd convert 10 km to mi
    /// Note: Flags can be placed before or after the expression
    pub expression: Vec<String>,

    /// Convert to all equivalent units in the category
    #[arg(short = 'a', long)]
    pub all: bool,

    /// Number of decimal places (0-10)
    #[arg(short = 'p', long)]
    pub precision: Option<usize>,
}
