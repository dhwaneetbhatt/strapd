use super::Category;

pub(super) struct Number {
    pub end: usize,
    pub digits: [u8; 19],
    pub count: usize,
    pub groups: [u8; 20],
    pub group_count: usize,
    pub separator: Option<u8>,
    pub consistent: bool,
    pub international: bool,
    pub parentheses: bool,
}

pub(super) fn parse(bytes: &[u8], start: usize) -> Option<Number> {
    let mut n = Number {
        end: start,
        digits: [0; 19],
        count: 0,
        groups: [0; 20],
        group_count: 1,
        separator: None,
        consistent: true,
        international: bytes[start] == b'+',
        parentheses: false,
    };
    let mut i = start + usize::from(n.international);
    let mut balance = 0i8;
    while i < bytes.len() {
        let b = bytes[i];
        if b.is_ascii_digit() {
            if n.count < 19 {
                n.digits[n.count] = b - b'0';
            }
            n.count = (n.count + 1).min(20);
            n.groups[n.group_count - 1] = n.groups[n.group_count - 1].saturating_add(1);
            i += 1;
            n.end = i;
        } else if b == b'(' && balance == 0 && i - start < 8 {
            n.parentheses = true;
            balance += 1;
            i += 1;
        } else if b == b')' && balance == 1 {
            balance -= 1;
            i += 1;
            n.end = i;
        } else if matches!(b, b' ' | b'-' | b'.') && n.count > 0 {
            let mut next = i + 1;
            if bytes.get(next) == Some(&b'(') {
                next += 1;
            }
            if !bytes.get(next).is_some_and(u8::is_ascii_digit) {
                break;
            }
            if b == b' ' && (n.groups[0] >= 7 || n.separator.is_some_and(|s| s != b' ')) {
                break;
            }
            if b == b' '
                && bytes[next..]
                    .iter()
                    .take_while(|b| b.is_ascii_digit())
                    .take(6)
                    .count()
                    > 5
            {
                break;
            }
            if n.groups[n.group_count - 1] == 0 {
                break;
            }
            n.group_count = (n.group_count + 1).min(20);
            n.consistent &= n.separator.is_none_or(|old| old == b);
            n.separator.get_or_insert(b);
            i += 1;
        } else {
            break;
        }
    }
    if balance != 0 || n.count == 0 {
        return None;
    }
    Some(n)
}

pub(super) fn classify(
    n: &Number,
    label: impl Fn() -> Option<Category>,
    enabled: super::Categories,
) -> Option<Category> {
    let groups = &n.groups[..n.group_count];
    let plain = n.group_count == 1 && !n.international && !n.parentheses;
    let aadhaar_shape = !n.international
        && !n.parentheses
        && n.count == 12
        && (plain
            || (n.consistent && matches!(n.separator, Some(b' ' | b'-')) && groups == [4, 4, 4]));
    if enabled.contains(Category::Aadhaar)
        && aadhaar_shape
        && (verhoeff(&n.digits[..n.count]) || label() == Some(Category::Aadhaar))
    {
        return Some(Category::Aadhaar);
    }
    let card_shape = !n.international
        && !n.parentheses
        && (13..=19).contains(&n.count)
        && (plain
            || (n.consistent
                && matches!(n.separator, Some(b' ' | b'-'))
                && groups[..groups.len() - 1].iter().all(|&size| size == 4)
                && (1..=4).contains(groups.last().unwrap())
                || (n.consistent && groups == [4, 6, 5])));
    if enabled.contains(Category::PaymentCards)
        && card_shape
        && (luhn(&n.digits[..n.count]) || label() == Some(Category::PaymentCards))
    {
        return Some(Category::PaymentCards);
    }
    let phone_shape = (7..=15).contains(&n.count)
        && ((n.international && n.digits[0] != 0)
            || (n.count >= 10 && n.parentheses)
            || (n.count >= 10
                && n.group_count >= 2
                && !matches!(groups, [4, 4, 4])
                && groups.iter().all(|&size| (2..=5).contains(&size))
                && (n.separator != Some(b' ') || n.group_count >= 3))
            || label() == Some(Category::PhoneNumbers));
    (enabled.contains(Category::PhoneNumbers) && phone_shape).then_some(Category::PhoneNumbers)
}

fn luhn(digits: &[u8]) -> bool {
    let sum: u32 = digits
        .iter()
        .rev()
        .enumerate()
        .map(|(i, &d)| {
            let value = if i % 2 == 1 { d * 2 } else { d };
            u32::from(if value > 9 { value - 9 } else { value })
        })
        .sum();
    sum > 0 && sum.is_multiple_of(10)
}

fn verhoeff(digits: &[u8]) -> bool {
    const D: [[usize; 10]; 10] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];
    const P: [[usize; 10]; 8] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];
    digits
        .iter()
        .rev()
        .enumerate()
        .fold(0, |c, (i, &d)| D[c][P[i % 8][d as usize]])
        == 0
}

pub(super) fn extension(bytes: &[u8], end: usize) -> usize {
    let mut i = end;
    while bytes.get(i) == Some(&b' ') {
        i += 1;
    }
    let rest = &bytes[i..];
    let prefix = if rest.len() >= 3 && rest[..3].eq_ignore_ascii_case(b"ext") {
        3
    } else if rest
        .first()
        .is_some_and(|b| matches!(b, b'x' | b'X' | b'#'))
    {
        1
    } else {
        return end;
    };
    i += prefix;
    if bytes.get(i) == Some(&b'.') {
        i += 1;
    }
    while bytes.get(i) == Some(&b' ') {
        i += 1;
    }
    let start = i;
    while bytes.get(i).is_some_and(u8::is_ascii_digit) && i - start < 7 {
        i += 1;
    }
    if i == start || i - start > 6 || bytes.get(i).is_some_and(u8::is_ascii_alphanumeric) {
        end
    } else {
        i
    }
}
