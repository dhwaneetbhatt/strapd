use uuid::Uuid;

fn generate<F>(number: usize, make_uuid: F) -> String
where
    F: Fn() -> Uuid,
{
    // pre-allocate space for n UUIDs + newlines
    let mut out = String::with_capacity(number * 37 - 1);

    // allocate buffer on stack to avoid unnecessay allocations
    let mut buf = Uuid::encode_buffer();

    for i in 0..number {
        if i > 0 {
            out.push('\n');
        }
        let s = make_uuid().hyphenated().encode_lower(&mut buf);
        out.push_str(s);
    }
    out
}

pub fn generate_v4(number: usize) -> String {
    generate(number, Uuid::new_v4)
}

pub fn generate_v7(number: usize) -> String {
    generate(number, Uuid::now_v7)
}
