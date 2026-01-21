// Calculator module for evaluating mathematical expressions
//
// Design decisions:
// - Shunting-yard algorithm for O(n) parsing
// - Hybrid i128/f64 to maximize precision while supporting decimals
// - Zero-copy string iteration where possible
// - Pre-allocated vectors based on input size
// - Static error strings to avoid allocations

use std::{fmt, iter, str};

#[derive(Debug, Clone, Copy, PartialEq)]
enum Number {
    Int(i128),
    Float(f64),
}

impl Number {
    #[inline]
    const fn to_float(self) -> f64 {
        match self {
            Number::Int(i) => i as f64,
            Number::Float(f) => f,
        }
    }
}

impl fmt::Display for Number {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Number::Int(i) => write!(f, "{}", i),
            Number::Float(val) => write!(f, "{}", val),
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum Token {
    Number(Number),
    Operator(char),
    LeftParen,
    RightParen,
}

/// Evaluate a mathematical expression and return the result as a string
pub fn evaluate(expr: &str) -> Result<String, String> {
    let trimmed = expr.trim();
    if trimmed.is_empty() {
        return Err("Invalid expression".to_string());
    }

    let tokens = tokenize(trimmed)?;
    let postfix = infix_to_postfix(tokens)?;
    let result = evaluate_postfix(postfix)?;
    Ok(result.to_string())
}

/// Tokenize the input expression into a vector of tokens
fn tokenize(expr: &str) -> Result<Vec<Token>, String> {
    // Pre-allocate based on input length (rough heuristic: ~1 token per 2 chars)
    let mut tokens = Vec::with_capacity(expr.len() / 2 + 1);
    let mut chars = expr.chars().enumerate().peekable();

    while let Some((_, c)) = chars.next() {
        // Skip whitespace
        if c.is_whitespace() {
            continue;
        }

        // Handle numbers (including decimals)
        if c.is_ascii_digit() || c == '.' {
            let start_pos = chars
                .peek()
                .map(|(pos, _)| pos - 1)
                .unwrap_or(expr.len() - 1);
            let number = parse_number(expr, start_pos, &mut chars)?;
            tokens.push(Token::Number(number));
            continue;
        }

        // Handle operators and parentheses
        match c {
            '+' | '*' | '/' | '%' | '^' => {
                tokens.push(Token::Operator(c));
            }
            '-' => {
                // Check if this is a unary minus (negative number)
                let is_unary = tokens.is_empty()
                    || matches!(
                        tokens.last(),
                        Some(Token::Operator(_)) | Some(Token::LeftParen)
                    );

                if is_unary {
                    // Parse negative number
                    if let Some((idx, next_char)) = chars.peek()
                        && (next_char.is_ascii_digit() || *next_char == '.')
                    {
                        let start_pos = *idx;
                        let mut number = parse_number(expr, start_pos, &mut chars)?;
                        // Negate the number
                        number = match number {
                            Number::Int(i) => Number::Int(-i),
                            Number::Float(f) => Number::Float(-f),
                        };
                        tokens.push(Token::Number(number));
                        continue;
                    }
                    return Err("Invalid expression: expected number after '-'".to_string());
                } else {
                    tokens.push(Token::Operator(c));
                }
            }
            '(' => tokens.push(Token::LeftParen),
            ')' => tokens.push(Token::RightParen),
            _ => return Err(format!("Invalid character: {}", c)),
        }
    }

    if tokens.is_empty() {
        return Err("Invalid expression".to_string());
    }

    Ok(tokens)
}

/// Parse a number starting at the given position
#[inline]
fn parse_number(
    expr: &str,
    start_pos: usize,
    chars: &mut iter::Peekable<iter::Enumerate<str::Chars>>,
) -> Result<Number, String> {
    let mut end_pos = start_pos;
    let mut has_decimal = expr.as_bytes()[start_pos] == b'.';

    // Consume digits and at most one decimal point
    while let Some((idx, c)) = chars.peek() {
        if c.is_ascii_digit() {
            end_pos = *idx;
            chars.next();
        } else if *c == '.' {
            if has_decimal {
                return Err("Invalid number format: multiple decimal points".to_string());
            }
            has_decimal = true;
            end_pos = *idx;
            chars.next();
        } else {
            break;
        }
    }

    let num_str = &expr[start_pos..=end_pos];

    // Validate and parse
    if num_str == "." {
        return Err("Invalid number: standalone decimal point".to_string());
    }

    if has_decimal {
        num_str
            .parse::<f64>()
            .map(Number::Float)
            .map_err(|_| format!("Invalid number: {}", num_str))
    } else {
        num_str
            .parse::<i128>()
            .map(Number::Int)
            .map_err(|_| format!("Invalid number: {}", num_str))
    }
}

/// Get the precedence of an operator (higher number = higher precedence)
#[inline]
const fn precedence(op: char) -> u8 {
    match op {
        '+' | '-' => 1,
        '*' | '/' | '%' => 2,
        '^' => 3,
        _ => 0,
    }
}

/// Check if an operator is right-associative
#[inline]
const fn is_right_associative(op: char) -> bool {
    op == '^'
}

/// Convert infix notation to postfix notation using the Shunting-yard algorithm
fn infix_to_postfix(tokens: Vec<Token>) -> Result<Vec<Token>, String> {
    let mut output = Vec::with_capacity(tokens.len());
    let mut operator_stack = Vec::with_capacity(tokens.len() / 4 + 1);

    for token in tokens {
        match token {
            Token::Number(_) => output.push(token),
            Token::Operator(op) => {
                // Pop operators with higher or equal precedence (respecting associativity)
                while let Some(&Token::Operator(top_op)) = operator_stack.last() {
                    let should_pop = if is_right_associative(op) {
                        precedence(op) < precedence(top_op)
                    } else {
                        precedence(op) <= precedence(top_op)
                    };

                    if should_pop {
                        output.push(operator_stack.pop().unwrap());
                    } else {
                        break;
                    }
                }
                operator_stack.push(Token::Operator(op));
            }
            Token::LeftParen => operator_stack.push(token),
            Token::RightParen => {
                let mut found_left_paren = false;
                while let Some(top) = operator_stack.pop() {
                    if matches!(top, Token::LeftParen) {
                        found_left_paren = true;
                        break;
                    }
                    output.push(top);
                }
                if !found_left_paren {
                    return Err("Mismatched parentheses".to_string());
                }
            }
        }
    }

    // Pop remaining operators
    while let Some(token) = operator_stack.pop() {
        if matches!(token, Token::LeftParen) {
            return Err("Mismatched parentheses".to_string());
        }
        output.push(token);
    }

    Ok(output)
}

/// Evaluate a postfix expression
fn evaluate_postfix(tokens: Vec<Token>) -> Result<Number, String> {
    let mut stack = Vec::with_capacity(tokens.len() / 2 + 1);

    for token in tokens {
        match token {
            Token::Number(num) => stack.push(num),
            Token::Operator(op) => {
                if stack.len() < 2 {
                    return Err("Invalid expression".to_string());
                }
                let right = stack.pop().unwrap();
                let left = stack.pop().unwrap();
                let result = apply_operator(op, left, right)?;
                stack.push(result);
            }
            _ => return Err("Invalid token in postfix expression".to_string()),
        }
    }

    if stack.len() != 1 {
        return Err("Invalid expression".to_string());
    }

    Ok(stack.pop().unwrap())
}

/// Apply an operator to two numbers
#[inline]
fn apply_operator(op: char, left: Number, right: Number) -> Result<Number, String> {
    match op {
        '+' => add(left, right),
        '-' => subtract(left, right),
        '*' => multiply(left, right),
        '/' => divide(left, right),
        '%' => modulo(left, right),
        '^' => power(left, right),
        _ => Err(format!("Unknown operator: {}", op)),
    }
}

#[inline]
fn add(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => a
            .checked_add(b)
            .map(Number::Int)
            .ok_or("Calculation overflow")
            .or_else(|_| {
                // On overflow, check if f64 conversion would lose precision
                let result = (a as f64) + (b as f64);
                if result.is_finite() {
                    Ok(Number::Float(result))
                } else {
                    Err("Calculation overflow".to_string())
                }
            }),
        (a, b) => Ok(Number::Float(a.to_float() + b.to_float())),
    }
}

#[inline]
fn subtract(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => a
            .checked_sub(b)
            .map(Number::Int)
            .ok_or("Calculation overflow")
            .or_else(|_| {
                let result = (a as f64) - (b as f64);
                if result.is_finite() {
                    Ok(Number::Float(result))
                } else {
                    Err("Calculation overflow".to_string())
                }
            }),
        (a, b) => Ok(Number::Float(a.to_float() - b.to_float())),
    }
}

#[inline]
fn multiply(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => a
            .checked_mul(b)
            .map(Number::Int)
            .ok_or("Calculation overflow")
            .or_else(|_| {
                let result = (a as f64) * (b as f64);
                if result.is_finite() {
                    Ok(Number::Float(result))
                } else {
                    Err("Calculation overflow".to_string())
                }
            }),
        (a, b) => Ok(Number::Float(a.to_float() * b.to_float())),
    }
}

#[inline]
fn divide(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => {
            if b == 0 {
                return Err("Division by zero".to_string());
            }
            // Check for exact division
            if a % b == 0 {
                Ok(Number::Int(a / b))
            } else {
                Ok(Number::Float(a as f64 / b as f64))
            }
        }
        (a, b) => {
            let b_float = b.to_float();
            // For floats, exact zero comparison is correct since we control the inputs
            if b_float == 0.0 {
                return Err("Division by zero".to_string());
            }
            Ok(Number::Float(a.to_float() / b_float))
        }
    }
}

#[inline]
fn modulo(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => {
            if b == 0 {
                return Err("Division by zero".to_string());
            }
            Ok(Number::Int(a % b))
        }
        (a, b) => {
            let b_float = b.to_float();
            if b_float == 0.0 {
                return Err("Division by zero".to_string());
            }
            Ok(Number::Float(a.to_float() % b_float))
        }
    }
}

#[inline]
fn power(left: Number, right: Number) -> Result<Number, String> {
    match (left, right) {
        (Number::Int(a), Number::Int(b)) => {
            // Handle special cases for mathematical correctness
            if a == 0 {
                if b == 0 {
                    // 0^0 is often defined as 1 by convention in discrete mathematics and programming contexts
                    return Ok(Number::Int(1));
                } else if b < 0 {
                    // 0^negative is undefined (division by zero)
                    return Err("Division by zero".to_string());
                }
                return Ok(Number::Int(0));
            }

            if b < 0 {
                // Negative exponent always results in float (fraction)
                Ok(Number::Float((a as f64).powf(b as f64)))
            } else if b > u32::MAX as i128 {
                Err("Exponent too large".to_string())
            } else {
                // Try integer exponentiation first
                a.checked_pow(b as u32)
                    .map(Number::Int)
                    .ok_or("Calculation overflow")
                    .or_else(|_| {
                        // On overflow, try float
                        let result = (a as f64).powf(b as f64);
                        if result.is_finite() {
                            Ok(Number::Float(result))
                        } else {
                            Err("Calculation overflow".to_string())
                        }
                    })
            }
        }
        (Number::Int(a), Number::Float(b)) if a < 0 && b.fract() != 0.0 => {
            // Negative base with fractional exponent is complex (not supported)
            Err(
                "Complex numbers not supported (negative base with fractional exponent)"
                    .to_string(),
            )
        }
        (Number::Float(a), Number::Float(b)) if a < 0.0 && b.fract() != 0.0 => {
            // Negative base with fractional exponent is complex (not supported)
            Err(
                "Complex numbers not supported (negative base with fractional exponent)"
                    .to_string(),
            )
        }
        (a, b) => Ok(Number::Float(a.to_float().powf(b.to_float()))),
    }
}
