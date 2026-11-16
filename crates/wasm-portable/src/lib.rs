//! WIT/Canonical ABI adapter for non-browser WASM hosts.

use strapd_core::{
    conversion, data_formats, datetime::timestamp, encoding, identifiers, jwt, random, sanitize,
    security, string,
};

wit_bindgen::generate!({ world: "tools" });

pub struct Tools;

fn generation_count(count: u32) -> Result<usize, String> {
    if !(1..=1024).contains(&count) {
        return Err("Count must be between 1 and 1024".into());
    }
    Ok(count as usize)
}

impl From<TimestampFormat> for timestamp::TimestampFormat {
    fn from(format: TimestampFormat) -> Self {
        match format {
            TimestampFormat::Human => Self::Human,
            TimestampFormat::Iso => Self::Iso,
        }
    }
}

impl From<UnitCategory> for conversion::types::UnitCategory {
    fn from(category: UnitCategory) -> Self {
        match category {
            UnitCategory::Bytes => Self::Bytes,
            UnitCategory::Time => Self::Time,
            UnitCategory::Length => Self::Length,
            UnitCategory::Temperature => Self::Temperature,
        }
    }
}

impl Guest for Tools {
    fn base64_encode(input: Vec<u8>) -> String {
        encoding::base64::encode(&input)
    }
    fn base64_decode(input: String) -> Result<Vec<u8>, String> {
        encoding::base64::decode(&input).map_err(|error| error.to_string())
    }
    fn hex_encode(input: Vec<u8>) -> String {
        encoding::hex::encode(&input)
    }
    fn hex_decode(input: String) -> Result<Vec<u8>, String> {
        encoding::hex::decode(&input).map_err(|error| error.to_string())
    }
    fn url_encode(input: String) -> String {
        encoding::url::encode(&input)
    }
    fn url_decode(input: String) -> Result<String, String> {
        encoding::url::decode(&input)
    }

    fn string_to_uppercase(input: String) -> String {
        string::case::to_uppercase(&input)
    }
    fn string_to_lowercase(input: String) -> String {
        string::case::to_lowercase(&input)
    }
    fn string_to_capitalcase(input: String) -> String {
        string::case::to_capitalcase(&input)
    }
    fn string_count_lines(input: String) -> u32 {
        string::analysis::count_lines(&input) as u32
    }
    fn string_count_words(input: String) -> u32 {
        string::analysis::count_words(&input) as u32
    }
    fn string_count_chars(input: String) -> u32 {
        string::analysis::count_chars(&input) as u32
    }
    fn string_count_bytes(input: String) -> u32 {
        string::analysis::count_bytes(&input) as u32
    }
    fn string_reverse(input: String) -> String {
        string::transform::reverse(&input)
    }
    fn string_replace(input: String, search: String, replacement: String) -> String {
        string::transform::replace(&input, &search, &replacement)
    }
    fn string_slugify(input: String, separator: char) -> String {
        string::transform::slugify(&input, separator)
    }
    fn string_trim(input: String, left: bool, right: bool, all: bool) -> String {
        string::whitespace::trim(&input, left, right, all)
    }

    fn json_beautify(input: String, sort: bool, spaces: u8) -> Result<String, String> {
        data_formats::json::beautify(&input, spaces, sort).map_err(|error| error.to_string())
    }
    fn json_minify(input: String, sort: bool) -> Result<String, String> {
        data_formats::json::minify(&input, sort).map_err(|error| error.to_string())
    }
    fn json_sample(input: String, size: u32, seed: u64) -> Result<SampleResult, String> {
        data_formats::json_sample::sample(&input, size as usize, seed).map(|outcome| SampleResult {
            output: outcome.output,
            filtered_nulls: outcome.filtered.nulls as u32,
            filtered_empty_arrays: outcome.filtered.empty_arrays as u32,
            omitted_total: outcome.sampling.omitted_total as u32,
            arrays: outcome
                .sampling
                .arrays
                .into_iter()
                .map(|array| SampledArray {
                    path: array.path,
                    omitted: array.omitted as u32,
                })
                .collect(),
        })
    }
    fn xml_beautify(input: String, spaces: u8) -> Result<String, String> {
        data_formats::xml::beautify(&input, spaces)
    }
    fn xml_minify(input: String) -> Result<String, String> {
        data_formats::xml::minify(&input)
    }
    fn json_to_yaml(input: String) -> Result<String, String> {
        data_formats::json::convert_to_yaml(&input)
    }
    fn yaml_to_json(input: String) -> Result<String, String> {
        data_formats::yaml::convert_to_json(&input)
    }
    fn json_to_xml(input: String, root: Option<String>) -> Result<String, String> {
        data_formats::json::convert_to_xml(&input, root.as_deref())
    }
    fn xml_to_json(input: String) -> Result<String, String> {
        data_formats::xml::convert_to_json(&input)
    }

    fn uuid_generate_v4(count: u32) -> Result<String, String> {
        Ok(identifiers::uuid::generate_v4(generation_count(count)?))
    }
    fn uuid_generate_v7(count: u32) -> Result<String, String> {
        Ok(identifiers::uuid::generate_v7(generation_count(count)?))
    }
    fn ulid_generate(count: u32) -> Result<String, String> {
        Ok(identifiers::ulid::generate(generation_count(count)?))
    }
    fn random_string(
        count: u32,
        length: u8,
        types: Vec<CharacterType>,
        custom_charset: Option<String>,
    ) -> Result<Vec<String>, String> {
        random::string(
            generation_count(count)?,
            length,
            types.contains(&CharacterType::Lowercase),
            types.contains(&CharacterType::Uppercase),
            types.contains(&CharacterType::Digits),
            types.contains(&CharacterType::Symbols),
            custom_charset.as_deref(),
        )
    }
    fn random_number(min: i64, max: i64, count: u32) -> Result<Vec<i64>, String> {
        let count = generation_count(count)?;
        if min > max {
            return Err("Minimum must not exceed maximum".into());
        }
        Ok(random::number(min, max, count))
    }

    fn datetime_now(millis: bool) -> i64 {
        if millis {
            timestamp::now_millis()
        } else {
            timestamp::now()
        }
    }
    fn datetime_from_timestamp(value: i64, format: TimestampFormat) -> Result<String, String> {
        timestamp::from_timestamp(value, format.into()).map_err(|error| error.to_string())
    }
    fn datetime_from_timestamp_millis(
        value: i64,
        format: TimestampFormat,
    ) -> Result<String, String> {
        timestamp::from_timestamp_millis(value, format.into()).map_err(|error| error.to_string())
    }

    fn hash_md5(input: String) -> String {
        security::hash::md5(&input)
    }
    fn hash_sha1(input: String) -> String {
        security::hash::sha1(&input)
    }
    fn hash_sha256(input: String) -> String {
        security::hash::sha256(&input)
    }
    fn hash_sha512(input: String) -> String {
        security::hash::sha512(&input)
    }
    fn hmac_sha256(input: String, key: String) -> Result<String, String> {
        security::hmac::sha256(&input, &key)
    }
    fn hmac_sha512(input: String, key: String) -> Result<String, String> {
        security::hmac::sha512(&input, &key)
    }

    fn jwt_decode(input: String) -> Result<String, String> {
        jwt::decode_json(&input, false).map_err(|error| error.to_string())
    }
    fn jwt_decode_with_analysis(input: String) -> Result<String, String> {
        jwt::decode_json(&input, true).map_err(|error| error.to_string())
    }
    fn jwt_header(input: String) -> Result<String, String> {
        jwt::header_json(&input).map_err(|error| error.to_string())
    }
    fn jwt_payload(input: String) -> Result<String, String> {
        jwt::payload_json(&input).map_err(|error| error.to_string())
    }
    fn jwt_verify(input: String, secret: String) -> Result<String, String> {
        let verification = jwt::verify(&input, &secret).map_err(|error| error.to_string())?;
        serde_json::to_string(&verification).map_err(|error| error.to_string())
    }
    fn jwt_sign(
        payload: String,
        secret: String,
        algorithm: JwtAlgorithm,
        expires_in_seconds: Option<i64>,
    ) -> Result<String, String> {
        let algorithm = match algorithm {
            JwtAlgorithm::Hs256 => jwt::Algorithm::HS256,
            JwtAlgorithm::Hs384 => jwt::Algorithm::HS384,
            JwtAlgorithm::Hs512 => jwt::Algorithm::HS512,
        };
        jwt::sign(
            &payload,
            &secret,
            jwt::SignOptions {
                algorithm,
                expires_in_seconds,
            },
        )
        .map_err(|error| error.to_string())
    }

    fn convert(value: f64, from_unit: String, to_unit: String) -> Result<String, String> {
        let result = conversion::engine::convert(&conversion::types::ConversionRequest {
            value,
            from_unit,
            to_unit: Some(to_unit),
        })?;
        conversion::formatter::format_output(&[result], None).map_err(|error| error.to_string())
    }
    fn convert_all(value: f64, from_unit: String) -> Result<String, String> {
        let results = conversion::engine::convert_to_all(value, &from_unit)?;
        conversion::formatter::format_output(&results, None).map_err(|error| error.to_string())
    }
    fn get_units_in_category(category: UnitCategory) -> Vec<Unit> {
        conversion::types::get_units_in_category(category.into())
            .into_iter()
            .map(|unit| Unit {
                canonical_name: unit.canonical_name.into(),
                aliases: unit.aliases.iter().map(|alias| (*alias).into()).collect(),
                category,
            })
            .collect()
    }

    fn detect_pii(input: String, categories: u8) -> Vec<Detection> {
        sanitize::pii::detect(&input, sanitize::pii::Categories::from_bits(categories))
            .into_iter()
            .map(|found| Detection {
                category: found.category as u8,
                start: found.range.start as u32,
                end: found.range.end as u32,
            })
            .collect()
    }
    fn sanitize_pii(input: String, categories: u8, pseudonymize: bool) -> String {
        sanitize::pii::sanitize(
            &input,
            sanitize::pii::Categories::from_bits(categories),
            if pseudonymize {
                sanitize::pii::Mode::Pseudonymize
            } else {
                sanitize::pii::Mode::Mask
            },
        )
        .into_owned()
    }
    fn sanitize_secrets(input: String, categories: u8) -> String {
        sanitize::secrets(&input, sanitize::Categories::from_bits(categories)).into_owned()
    }
}

export!(Tools);
