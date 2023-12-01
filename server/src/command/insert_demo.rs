use std::convert::Infallible;
use std::sync::Arc;
use argh::FromArgs;
use crate::AppState;

/// Insert demo data into the database.
#[derive(FromArgs)]
#[argh(subcommand, name = "insert-demo")]
pub struct InsertDemo {}

pub fn insert_demo(state: Arc<AppState>, InsertDemo {}: InsertDemo) {
    let res = state.write_transaction(|db| {
        db.execute_batch(include_str!("../example_data.sql"))?;
        Ok::<_, crate::Error<Infallible>>(())
    });

    res.unwrap();
}
