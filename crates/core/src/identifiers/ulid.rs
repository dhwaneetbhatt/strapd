use ulid::Ulid;

pub fn generate(number: usize) -> String {
    let mut out = String::with_capacity(number * 27 - 1);

    for i in 0..number {
        if i > 0 {
            out.push('\n');
        }
        let s = Ulid::generate().to_string();
        out.push_str(&s);
    }
    out
}
