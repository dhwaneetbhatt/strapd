use strapd_portability_poc as operations;

wit_bindgen::generate!({ world: "tools" });

struct Tools;

impl Guest for Tools {
    fn detect(input: String, categories: u8) -> Vec<Detection> {
        operations::detect(&input, categories)
            .into_iter()
            .map(|found| Detection {
                category: found.category,
                start: found.start,
                end: found.end,
            })
            .collect()
    }

    fn mask(input: String, categories: u8) -> String {
        operations::mask(&input, categories)
    }

    fn decode(input: String) -> Result<Vec<u8>, String> {
        operations::decode(&input)
    }

    fn sample(input: String, size: u32, seed: u64) -> Result<SampleResult, String> {
        operations::sample(&input, size, seed).map(|sample| SampleResult {
            output: sample.output,
            filtered_nulls: sample.filtered_nulls,
            filtered_empty_arrays: sample.filtered_empty_arrays,
            omitted_total: sample.omitted_total,
            arrays: sample
                .arrays
                .into_iter()
                .map(|array| SampledArray {
                    path: array.path,
                    omitted: array.omitted,
                })
                .collect(),
        })
    }

    fn uuid(count: u32) -> Result<String, String> {
        operations::uuid(count)
    }

    fn timestamp(value: i64) -> Result<String, String> {
        operations::timestamp(value)
    }
}

export!(Tools);
