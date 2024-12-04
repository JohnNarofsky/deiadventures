// Note: The migration files are named with their corresponding
//       database versions to enable us to automatically generate
//       parts of this file if it becomes cumbersome to work with otherwise.

use core::iter::Iterator;

use rusqlite::Connection;

fn run_migration(db: &Connection, name: &str, description: &str, src: &str) -> Result<(), rusqlite::Error> {
    println!("Running migration: {name}");
    db.execute_batch("BEGIN;")?;

    let res = db.execute_batch(src);

    match res {
        Ok(()) => {
            db.execute_batch("COMMIT;")?;
            Ok(())
        },
        Err(e) => {
            eprintln!("error {description}: {e:?}");
            db.execute_batch("ROLLBACK;")?;
            Err(e)
        }
    }
}



pub(crate) fn ensure_updated(db: &Connection) -> Result<(), rusqlite::Error> {
    let version: i64 = db.pragma_query_value(None, "user_version", |row| row.get(0))?;

    const MIGRATIONS: &[(&str, &str, &str)] = &[
        ("add_repeatable_quests", "adding repeatable quests", include_str!("01_add_repeatable_quests.sql")),
        ("add_adventurer_notes", "adding adventurer notes", include_str!("02_add_adventurer_notes.sql")),
    ];
    for (i, (name, description, src)) in MIGRATIONS.iter().enumerate() {
        let dest_version = (i + 1) as i64;
        if dest_version > version {
            run_migration(db, name, description, src)?
        }
    }

    Ok(())
}
