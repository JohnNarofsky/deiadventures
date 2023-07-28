use crate::{GuildId, QuestId, UserId};
use rusqlite::{named_params, Transaction};

// A randomly generated number. This is hardcoded elsewhere,
// so grep for everywhere it's used in the server before changing it.
/// Number we save in
pub(crate) const APPLICATION_ID: u32 = 249251854;

pub(crate) fn open(path: &std::path::Path) -> Result<rusqlite::Connection, rusqlite::Error> {
    let db = rusqlite::Connection::open(path)?;

    // Perform any needed setup on the DB connection before we wrap it in a Mutex.
    db.execute_batch(include_str!("connection_setup.sql"))?;

    let app_id: u32 = db.pragma_query_value(None, "application_id", |row| row.get(0))?;
    if app_id == 0 {
        db.execute_batch(include_str!("init.sql"))?;
    } else {
        assert_eq!(app_id, APPLICATION_ID);
    }

    Ok(db)
}

pub(crate) fn adventurer_exists(db: &Transaction, user: UserId) -> Result<bool, rusqlite::Error> {
    let mut query = db.prepare_cached("SELECT 0 FROM Adventurer WHERE id = :id")?;
    query.exists(named_params! { ":id": user })
}

pub(crate) fn quest_exists(db: &Transaction, quest: QuestId) -> Result<bool, rusqlite::Error> {
    let mut query = db.prepare_cached("SELECT 0 FROM Quest WHERE id = :id")?;
    query.exists(named_params! { ":id": quest })
}

pub(crate) fn guild_exists(db: &Transaction, quest: GuildId) -> Result<bool, rusqlite::Error> {
    let mut query = db.prepare_cached("SELECT 0 FROM Guild WHERE id = :id")?;
    query.exists(named_params! { ":id": quest })
}

pub(crate) fn accept_quest(
    db: &Transaction,
    user: UserId,
    quest: QuestId,
) -> Result<QuestId, rusqlite::Error> {
    // Steps to begin a quest:
    //  1. Make copy row in Quest, with a flipped quest_type field
    //  2. Copy associated rows in QuestTask
    //  3. Copy associated rows in QuestDetail
    //  4. Insert row(s) into PartyMember which associates the row(s) in Adventurer
    //     with the new row in Quest.

    // Step 1
    let mut query = db.prepare_cached(
        "INSERT INTO Quest (guild_id, name, quest_type)
             SELECT guild_id, name, 1 FROM Quest WHERE id = :quest_id;",
    )?;
    query.execute(named_params! { ":quest_id": quest })?;
    let new_id = db.last_insert_rowid();

    // Step 2
    let mut query = db.prepare_cached(
        "INSERT INTO QuestTask (quest_id, name, description, xp)
             SELECT :new_id, name, description, xp FROM QuestTask WHERE quest_id = :quest_id;",
    )?;
    query.execute(named_params! { ":new_id": new_id, ":quest_id": quest })?;

    // Step 3
    let mut query = db.prepare_cached(
        "INSERT INTO QuestDetail (quest_id, description)
             SELECT :new_id, description FROM QuestDetail WHERE quest_id = :quest_id;",
    )?;
    query.execute(named_params! { ":new_id": new_id, ":quest_id": quest })?;

    // Step 4
    let mut query = db.prepare_cached(
        "INSERT INTO PartyMember (adventurer_id, quest_id)
             VALUES (:adventurer_id, :new_id);",
    )?;
    query.execute(named_params! { ":adventurer_id": user, ":new_id": new_id })?;

    // TODO: adjust ID types to use i64 or u64, but note that JSON -> JS struggles with integers this big
    Ok(QuestId(new_id.try_into().expect(
        "you know, I didn't expect us to have more than 4 billion quests",
    )))
}

/// Generate what would be the next to be inserted ID.
/// This only works on tables with AUTOINCREMENT primary keys.
pub(crate) fn next_insert_id(
    db: &rusqlite::Transaction,
    table_name: &str,
) -> Result<i64, rusqlite::Error> {
    let mut query =
        db.prepare_cached("SELECT seq + 1 FROM SQLITE_SEQUENCE WHERE name = :table_name;")?;
    query.query_row(named_params! { ":table_name": table_name }, |row| {
        row.get(0)
    })
}
