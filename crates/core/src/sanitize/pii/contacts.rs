use std::net::IpAddr;

pub(super) fn ip(token: &str) -> Option<(usize, IpAddr)> {
    let token = token.trim_end_matches('.');
    if token.len() > 45 {
        return None;
    }
    if let Ok(address) = token.parse::<IpAddr>() {
        return Some((token.len(), address));
    }
    if let Some((address, port)) = token.split_once(':')
        && !port.is_empty()
        && port.bytes().all(|b| b.is_ascii_digit())
        && let Ok(address) = address.parse::<std::net::Ipv4Addr>()
    {
        return Some((address.to_string().len(), IpAddr::V4(address)));
    }
    let address = token.strip_suffix(':')?;
    address.parse().ok().map(|ip| (address.len(), ip))
}

pub(super) fn email(token: &str) -> Option<(&str, &str)> {
    if token.len() > 254 {
        return None;
    }
    let (local, domain) = token.split_once('@')?;
    if local.is_empty()
        || local.len() > 64
        || local.starts_with('.')
        || local.ends_with('.')
        || local.contains("..")
    {
        return None;
    }
    if !local
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b".!#$%&'*+-/=?^_`{|}~".contains(&b))
    {
        return None;
    }
    let domain = domain.trim_end_matches(['.', '!', '#', '$', '%', '^', '`', '~', '*', '\'', '&']);
    if !domain.contains('.') || domain.len() > 253 {
        return None;
    }
    if !domain.split('.').all(|part| {
        !part.is_empty()
            && part.len() <= 63
            && part.as_bytes()[0].is_ascii_alphanumeric()
            && part.as_bytes()[part.len() - 1].is_ascii_alphanumeric()
            && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
    }) {
        return None;
    }
    Some((local, domain))
}

pub(super) fn pan(token: &str, labelled: bool) -> bool {
    let b = token.as_bytes();
    b.len() == 10
        && b[..5].iter().all(u8::is_ascii_alphabetic)
        && b[5..9].iter().all(u8::is_ascii_digit)
        && b[9].is_ascii_alphabetic()
        && (labelled || (b"ABCFGHJLPT".contains(&b[3].to_ascii_uppercase()) && &b[5..9] != b"0000"))
}
