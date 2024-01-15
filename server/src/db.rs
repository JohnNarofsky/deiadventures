use crate::{GuildId, GuildQuestAction, Password, PermissionType, QuestId, UserId};
use rusqlite::{named_params, Transaction};
use serde::Deserialize;

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
    let mut query =
        db.prepare_cached("SELECT 0 FROM Quest WHERE id = :id AND deleted_date IS NULL")?;
    query.exists(named_params! { ":id": quest })
}
// TODO: provide deleted_quest_exists() for checking for deleted quests?

pub(crate) fn guild_exists(db: &Transaction, quest: GuildId) -> Result<bool, rusqlite::Error> {
    let mut query = db.prepare_cached("SELECT 0 FROM Guild WHERE id = :id")?;
    query.exists(named_params! { ":id": quest })
}

// TODO: make accept_quest set Quest.open_date
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
        "INSERT INTO Quest (guild_id, parent_quest_id, name, quest_type)
             SELECT guild_id, :quest_id, name, 1 FROM Quest WHERE id = :quest_id;",
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

pub(crate) fn lookup_guild_quest_actions(
    db: &Transaction,
    guild: GuildId,
) -> Result<Option<Vec<GuildQuestAction>>, rusqlite::Error> {
    if !guild_exists(&db, guild)? {
        return Ok(None);
    }

    let mut query = db.prepare_cached(
        "SELECT id FROM Quest WHERE guild_id = :guild_id AND deleted_date IS NULL AND quest_type = 0;",
    )?;
    let quests = query
        .query_map(named_params! { ":guild_id": guild }, |row| {
            let mut query =
                db.prepare_cached("SELECT name, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
            let id = row.get(0)?;
            let (name, xp) = query.query_row(named_params! { ":quest_id": id }, |row| {
                Ok((row.get(0)?, row.get(1)?))
            })?;
            Ok(GuildQuestAction { id, name, xp })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Some(quests))
}

pub(crate) fn set_user_permission(
    db: &Transaction,
    user: UserId,
    perm: PermissionType,
    truth: bool,
) -> Result<(), rusqlite::Error> {
    if truth {
        let mut query = db.prepare_cached(
            "INSERT INTO Permission (adventurer_id, permission_type)
                 VALUES (:adventurer_id, :permission_type)
                 ON CONFLICT DO NOTHING;",
        )?;
        let n =
            query.execute(named_params! { ":adventurer_id": user, ":permission_type": perm })?;
        assert!(n <= 1);

        // TODO: perhaps make "Rejected" conflict with every other permission type,
        //  or at least keep an easy to append to list of those types which conflict with it
        // TODO: when someone is rejected, it should also remove their roles
        // TODO: make rejected persons not show up elsewhere

        // "Approved" conflicts with "Rejected"
        if perm == PermissionType::Approved {
            let mut query = db.prepare_cached(
                "DELETE FROM Permission
                     WHERE adventurer_id = :adventurer_id AND permission_type = 3;",
            )?;
            let n = query.execute(named_params! { ":adventurer_id": user })?;
            assert!(n <= 1);
        }
        // ...and "Rejected" conflicts with "Approved"
        if perm == PermissionType::Rejected {
            let mut query = db.prepare_cached(
                "DELETE FROM Permission
                     WHERE adventurer_id = :adventurer_id AND permission_type = 1;",
            )?;
            let n = query.execute(named_params! { ":adventurer_id": user })?;
            assert!(n <= 1);
        }
    } else {
        let mut query = db.prepare_cached(
            "DELETE FROM Permission
                 WHERE adventurer_id = :adventurer_id AND permission_type = :permission_type;",
        )?;
        let n =
            query.execute(named_params! { ":adventurer_id": user, ":permission_type": perm })?;
        assert!(n <= 1);
    }

    Ok(())
}

/// Generate what would be the next to be inserted ID.
/// This only works on tables with AUTOINCREMENT primary keys.
pub(crate) fn next_insert_id(
    db: &Transaction,
    table_name: &str,
) -> Result<i64, rusqlite::Error> {
    let mut query =
        db.prepare_cached("SELECT seq + 1 FROM SQLITE_SEQUENCE WHERE name = :table_name;")?;
    query.query_row(named_params! { ":table_name": table_name }, |row| {
        row.get(0)
    })
}


pub(crate) fn create_account(db: &Transaction, name: Name, email: Email, password: Password) -> Result<UserId, crate::Error> {
    // Steps:
    //  1. Check if account *already* exists. Fail if so.
    //  2. Generate password salt.
    //  3. Compute password hash.
    //  4. Insert name, email, password hash, and password salt, into
    //     the Adventurer table.

    let mut query = db.prepare_cached(
        "SELECT 0 FROM Adventurer WHERE email_address = :email;"
    )?;
    if query.exists(named_params! { ":email": email })? {
        return Err(crate::Error::AccountAlreadyExists)
    }

    let Ok((hash, salt)) = password.salty_hash() else {
        return Err(crate::Error::CannotComputePasswordHash)
    };

    let mut query = db.prepare_cached(
        "INSERT INTO Adventurer (name, email_address, password_hash, password_salt)
                 VALUES (:name, :email, :hash, :salt);"
    )?;
    let n = query.execute(named_params! { ":name": name, ":email": email, ":hash": hash.as_str(), ":salt": salt.as_str() })?;
    assert_eq!(n, 1);
    Ok(UserId(db.last_insert_rowid().try_into().unwrap()))
}

macro_rules! str_wrap {
    ($t:ty) => {
        impl std::str::FromStr for $t {
            type Err = std::convert::Infallible;
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                Ok(Self(s.to_string()))
            }
        }
        impl rusqlite::ToSql for $t {
            fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
                self.0.to_sql()
            }
        }
    }
}

// TODO: We should do email validation.
#[derive(Deserialize, Debug)]
#[serde(transparent)]
pub(crate) struct Email(pub String);
str_wrap!(Email);
#[derive(Deserialize, Debug)]
#[serde(transparent)]
pub(crate) struct Name(pub String);
str_wrap!(Name);
