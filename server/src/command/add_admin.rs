//! This module provides the `add-admin` subcommand, which creates
//! a new admin user in the mounted database.

use std::fmt::Debug;
use std::io::Write;
use std::str::FromStr;
use crate::{AppState, db, Password, PermissionType};
use argh::FromArgs;
use std::sync::Arc;
use crate::db::{Email, Name};

/// Add a new admin user to the database.
#[derive(FromArgs)]
#[argh(subcommand, name = "add-admin")]
pub struct AddAdmin {}

pub fn add_admin(state: Arc<AppState>) {
    let email: Email = read_prop("email: ");
    let name: Name = read_prop("name: ");
    let password: Password = read_prop("password: ");

    state.write_transaction(|db| {
        let user = db::create_account(db, name, email, password)?;
        db::set_user_permission(db, user, PermissionType::Approved, true)?;
        db::set_user_permission(db, user, PermissionType::SuperUser, true)?;
        Ok(())
    }).unwrap();
}

fn read_prop<T: FromStr>(prompt: &str) -> T
where T::Err: Debug
{
    let stdin = std::io::stdin();
    let mut stderr = std::io::stderr();
    let mut buf = String::with_capacity(64);
    loop {
        buf.clear();
        stderr.write_all(prompt.as_bytes()).unwrap();
        let n = stdin.read_line(&mut buf).unwrap();
        if n == 0 {
            continue
        }

        let res = T::from_str(buf.trim());
        match res {
            Ok(x) => return x,
            Err(e) => {
                stderr.write_fmt(format_args!("{e:?}")).unwrap();
            }
        }
    }
}
