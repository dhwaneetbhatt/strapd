use uuid::Uuid;

fn generate<F>(number: &Option<usize>, make_uuid: F) -> String
where
    F: Fn() -> Uuid,
{
    match number {
        None => make_uuid().to_string(),
        Some(n) => {
            if *n == 0 {
                return String::new();
            }

            // pre-allocate space for n UUIDs + newlines
            let mut out = String::with_capacity(*n * 37 - 1);

            // allocate buffer on stack to avoid unnecessay allocations
            let mut buf = Uuid::encode_buffer();

            for i in 0..*n {
                if i > 0 {
                    out.push('\n');
                }
                let s = make_uuid().hyphenated().encode_lower(&mut buf);
                out.push_str(s);
            }

            out
        }
    }
}

pub fn generate_v4(number: &Option<usize>) -> String {
    generate(number, Uuid::new_v4)
}

pub fn generate_v7(number: &Option<usize>) -> String {
    generate(number, Uuid::now_v7)
}
