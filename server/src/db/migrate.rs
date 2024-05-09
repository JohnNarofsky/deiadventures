// Note: The migration files are named with their corresponding
//       database versions to enable us to automatically generate
//       parts of this file if it becomes cumbersome to work with otherwise.

use rusqlite::Connection;

fn add_repeatable_quests(db: &Connection) -> Result<(), rusqlite::Error> {
    println!("Running migration: add_repeatable_quests");
    db.execute_batch("BEGIN;")?;

    let res = db.execute_batch(include_str!("01_add_repeatable_quests.sql"));

    match res {
        Ok(()) => {
            db.execute_batch("COMMIT;")?;
            Ok(())
        },
        Err(e) => {
            eprintln!("error adding repeatable quests: {e:?}");
            db.execute_batch("ROLLBACK;")?;
            Err(e)
        }
    }
}

pub(crate) fn ensure_updated(db: &Connection) -> Result<(), rusqlite::Error> {
    let version: i64 = db.pragma_query_value(None, "user_version", |row| row.get(0))?;

    match version {
        0 => add_repeatable_quests(db)?,
        _ => (),
    }

    Ok(())
}
