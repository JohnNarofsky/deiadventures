use argh::FromArgs;
use argon2::password_hash::SaltString;
use crate::Password;

/// Compute and display an appropriate hash of a given password,
/// with an optionally specified salt.
#[derive(FromArgs)]
#[argh(subcommand, name = "hash-password")]
pub struct HashPassword {
    #[argh(positional)]
    password: Password,
    /// salt for the password hash
    #[argh(option)]
    salt: Option<String>,
}

pub fn hash_password(args: HashPassword) {
    if let Some(salt) = args.salt {
        let salt = SaltString::from_b64(&salt).unwrap();
        let hash = args.password.hash(salt.as_salt()).unwrap();
        println!("Hash: {hash}")
    } else {
        let (hash, salt) = args.password.salty_hash().unwrap();
        println!("Hash: {hash}");
        println!("Salt: {salt}");
    }
}
