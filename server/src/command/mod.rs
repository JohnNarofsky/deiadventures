use argh::FromArgs;
use crate::command::add_admin::AddAdmin;
use crate::command::hash_password::HashPassword;
use crate::command::insert_demo::InsertDemo;

pub mod hash_password;
pub mod add_admin;
pub mod insert_demo;

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
    HashPassword(HashPassword),
    InsertDemo(InsertDemo),
}

/// Run the server process.
#[derive(FromArgs)]
#[argh(subcommand, name = "run-server")]
pub struct Server {}
