use argh::FromArgs;
use crate::command::add_admin::AddAdmin;
use crate::command::hash_password::HashPassword;

pub mod hash_password;
pub mod add_admin;

/// The DEI adventures API server.
#[derive(FromArgs)]
pub struct Args {
    #[argh(subcommand)]
    pub command: Subcommand,
}

#[derive(FromArgs)]
#[argh(subcommand)]
pub enum Subcommand {
    Server(Server),
    AddAdmin(AddAdmin),
    HashPassword(HashPassword)
}

/// Run the server process.
#[derive(FromArgs)]
#[argh(subcommand, name = "run-server")]
pub struct Server {}
