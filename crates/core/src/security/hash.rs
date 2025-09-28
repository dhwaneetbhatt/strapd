use md5::{Digest, Md5};
use sha1::Sha1;
use sha2::{Sha256, Sha512};

pub fn md5(input: &str) -> String {
    hash_with_algorithm::<Md5>(input)
}

pub fn sha1(input: &str) -> String {
    hash_with_algorithm::<Sha1>(input)
}

pub fn sha256(input: &str) -> String {
    hash_with_algorithm::<Sha256>(input)
}

pub fn sha512(input: &str) -> String {
    hash_with_algorithm::<Sha512>(input)
}

fn hash_with_algorithm<D: Digest>(input: &str) -> String {
    let mut hasher = D::new();
    hasher.update(input);
    hex::encode(hasher.finalize())
}
