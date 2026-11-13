use std::cell::RefCell;
use strapd_portability_poc as operations;

#[derive(Default)]
struct Buffers {
    input: Vec<u8>,
    output: Vec<u8>,
}

thread_local! {
    static BUFFERS: RefCell<Buffers> = RefCell::new(Buffers::default());
}

// The host writes this owned buffer only between calls; calls on an instance are serialized.
#[unsafe(no_mangle)]
pub extern "C" fn input_resize(length: u32) -> u32 {
    BUFFERS.with_borrow_mut(|buffers| {
        if length > 8 * 1024 * 1024 {
            return 0;
        }
        buffers.input.resize(length as usize, 0);
        buffers.input.as_mut_ptr() as u32
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> u32 {
    BUFFERS.with_borrow(|buffers| buffers.output.as_ptr() as u32)
}

#[unsafe(no_mangle)]
pub extern "C" fn output_len() -> u32 {
    BUFFERS.with_borrow(|buffers| buffers.output.len() as u32)
}

#[unsafe(no_mangle)]
pub extern "C" fn call(operation: u32, option: u32, seed: u64, timestamp: i64) -> u32 {
    BUFFERS.with_borrow_mut(|buffers| {
        let result = std::str::from_utf8(&buffers.input)
            .map_err(|_| "Invalid UTF-8".to_owned())
            .and_then(|input| match operation {
                1 => Ok(operations::detect(input, option as u8)
                    .into_iter()
                    .flat_map(|found| [found.category, found.start, found.end])
                    .flat_map(u32::to_le_bytes)
                    .collect()),
                2 => Ok(operations::mask(input, option as u8).into_bytes()),
                3 => operations::decode(input),
                4 => operations::sample(input, option, seed).and_then(|sample| {
                    serde_json::to_vec(&sample).map_err(|error| error.to_string())
                }),
                5 => operations::uuid(option).map(String::into_bytes),
                6 => operations::timestamp(timestamp).map(String::into_bytes),
                _ => Err("Unknown operation".to_owned()),
            });
        let (status, output) = match result {
            Ok(bytes) => (0, bytes),
            Err(error) => (1, error.into_bytes()),
        };
        buffers.output = output;
        status
    })
}
