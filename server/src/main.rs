mod db;

use axum::extract::{Path, State};
use axum::http::{StatusCode, Uri};
use axum::routing::{get, post, put};
use axum::{Json, Router};
use rusqlite::types::{FromSqlResult, ToSqlOutput, ValueRef};
use rusqlite::{named_params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

mod env {
    use std::path::PathBuf;
    menv::require_envs! {
        (assert_envs, any_set, gen_help);

        port, "DEI_PORT", u16,
        "DEI_PORT should be set to the intended bind port";

        db, "DEI_DB", PathBuf,
        "DEI_DB should be set to the path to the database";

        // Note: We're currently omitting OAuth functionality in the interest of time,
        // but this is one way we could incorporate this information.
        // oauth_id, "OAUTH_ID", String,
        // "OAUTH_ID should be set to our OAuth client ID";
        // oauth_secret, "OAUTH_SECRET", String,
        // "OAUTH_SECRET should be set to our OAuth client secret";
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    if env::any_set() {
        env::assert_envs();
    } else {
        println!("# Environment Variables Help:\n{}", env::gen_help());
        return;
    }

    let state = Arc::new(AppState::new(&env::db()));

    let app = Router::new()
        // TODO: verify that all information required to know the authorization requirements
        //  of a request is in the URI
        // Conventions:
        // - GET for pure information retrieval (obviously)
        // - POST for uploading a new object (things which feel like an INSERT)
        // - PUT for setting a property of an existing object (things which feel like an UPDATE)
        // .route("/user/:user_id", get(get_user))
        .route("/user", get(get_users))
        .route("/user/:user_id/accept-quest", post(accept_quest))
        .route("/guild", get(get_guilds))
        .route("/guild", post(create_guild))
        .route("/guild/:guild_id/name", put(set_guild_name))
        .route("/guild/:guild_id/name", get(get_guild_name))
        .route("/guild/:guild_id/leader", put(set_guild_leader))
        .route("/perm/allowed-leaders", get(get_allowed_guild_leaders))
        // .route("/guild/:guild_id/leader", get(get_guild_leader))
        .route(
            "/guild/:guild_id/quest-actions",
            get(get_guild_quest_actions),
        )
        .fallback(fallback)
        .with_state(state.clone());

    let addr = SocketAddr::from(([127, 0, 0, 1], env::port()));
    tracing::debug!("listening on {addr}");
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn fallback(uri: Uri) -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, format!("No route for {uri}"))
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to wait for sigint");
    tracing::info!("Received interrupt signal. Shutting down...");
}

struct AppState {
    db: Mutex<rusqlite::Connection>,
}
impl AppState {
    fn new(db_path: &std::path::Path) -> Self {
        let db = db::open(db_path).unwrap();
        let db = Mutex::new(db);
        Self { db }
    }

    // These transaction wrapper methods, conveniently, prevent any async code from being passed to them,
    // which is good because performing an await while we hold a lock on the database will cause a deadlock.
    fn read_transaction<T, F: FnOnce(&mut rusqlite::Transaction) -> Result<T, rusqlite::Error>>(
        &self,
        f: F,
    ) -> Result<T, rusqlite::Error> {
        // Not a fan of lock poisoning, but whatever. We'll cope with it for now.
        let mut guard = self.db.lock().unwrap();
        let mut transaction =
            rusqlite::Transaction::new(&mut guard, rusqlite::TransactionBehavior::Deferred)?;
        let res = f(&mut transaction)?;
        transaction.commit()?;
        Ok(res)
    }
    fn write_transaction<T, F: FnOnce(&mut rusqlite::Transaction) -> Result<T, rusqlite::Error>>(
        &self,
        f: F,
    ) -> Result<T, rusqlite::Error> {
        let mut guard = self.db.lock().unwrap();
        let mut transaction =
            rusqlite::Transaction::new(&mut guard, rusqlite::TransactionBehavior::Immediate)?;
        let res = f(&mut transaction)?;
        transaction.commit()?;
        Ok(res)
    }
}

type ArcState = Arc<AppState>;

// Just making wrapper types so we can annotate
// what our request method parameters are.
macro_rules! decl_ids {
    ($($kind:ident),*) => {
        $(
            #[derive(Serialize, Deserialize, Debug, Copy, Clone)]
            #[serde(transparent)]
            struct $kind (u32);
            impl rusqlite::ToSql for $kind {
                fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
                    self.0.to_sql()
                }
            }
            impl rusqlite::types::FromSql for $kind {
                fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
                    <_ as rusqlite::types::FromSql>::column_result(value).map(Self)
                }
            }
            impl core::fmt::Display for $kind {
                fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
                    write!(f, "{}", self.0)
                }
            }
        )*
    }
}
decl_ids! { GuildId, QuestId, UserId }

#[derive(Serialize)]
struct User {
    name: String,
    selected_quests: Vec<QuestId>,
    completed_quests: Vec<QuestId>,
    // TODO: I've forgotten part of what fields were requested on this object
}

#[derive(Serialize, Debug)]
struct UserSummary {
    id: UserId,
    name: String,
    roles: Vec<Role>,
    permissions: Vec<Permission>,
}

#[derive(Serialize, Debug)]
struct Role {
    guild_id: GuildId,
    name: String,
}

#[derive(Serialize, Debug)]
struct Permission {
    r#type: PermissionType,
}

#[derive(Serialize, Debug)]
enum PermissionType {
    SuperUser = 0,
    Approved = 1,
    GuildLeaderEligible = 2,
    Rejected = 3,
}
impl PermissionType {
    fn extract(x: i64) -> Option<PermissionType> {
        use PermissionType::*;
        if x == SuperUser as i64 {
            Some(SuperUser)
        } else if x == Approved as i64 {
            Some(Approved)
        } else if x == GuildLeaderEligible as i64 {
            Some(GuildLeaderEligible)
        } else if x == Rejected as i64 {
            Some(Rejected)
        } else {
            None
        }
    }
}

async fn get_users(
    State(state): State<ArcState>,
) -> Result<Json<Vec<UserSummary>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached("SELECT id, name FROM Adventurer;")?;
        let users = query.query_map([], |row| {
            let id: UserId = row.get(0)?;
            let name: String = row.get(1)?;
            let mut query = db.prepare_cached(
                "SELECT guild_id, assigned_role FROM AdventurerRole
                     WHERE adventurer_id = :id;",
            )?;
            let roles = query
                .query_map(named_params! { ":id": id }, |row| {
                    Ok(Role {
                        guild_id: row.get(0)?,
                        name: row.get(1)?,
                    })
                })?
                .collect::<Result<Vec<_>, _>>()?;
            let mut query = db.prepare_cached(
                "SELECT permission_type FROM Permission
                     WHERE adventurer_id = :id;",
            )?;
            let permissions = query
                .query_map(named_params! { ":id": id }, |row| {
                    Ok(Permission {
                        r#type: PermissionType::extract(row.get(0)?).unwrap(),
                    })
                })?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(UserSummary {
                id,
                name,
                roles,
                permissions,
            })
        })?;

        users.collect::<Result<Vec<_>, _>>()
    });

    match data {
        Ok(users) => Ok(Json(users)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}
// async fn get_user(
//     State(state): State<ArcState>,
//     Path(user_id): Path<UserId>,
// ) -> Result<Json<User>, StatusCode> {
//     dbg!(user_id);
//     let data = state.read_transaction(|db| {
//         // Steps:
//         //  1. Check if adventurer exists. If not, 404.
//         //  2. SELECT list of quests associated with the adventurer.
//         //  3. Transform that list to a pair of lists, selected and completed,
//         //     based on whether close_date is null.
//
//         let mut query = db.prepare_cached("SELECT name FROM Adventurer WHERE id = :id;")?;
//         let name: Option<String> = query
//             .query_row(
//                 named_params! {
//                     ":id": user_id,
//                 },
//                 |row| row.get(0),
//             )
//             .optional()?;
//         if let Some(name) = name {
//             let mut query =
//                 db.prepare_cached("SELECT quest_id FROM PartyMember WHERE adventurer_id = :id;")?;
//             let rows = query.query_map(
//                 named_params! {
//                     ":id": user_id,
//                 },
//                 |row| row.get::<_, QuestId>(0),
//             )?;
//             // let selected_quests = vec![];
//             // let completed_quests = vec![];
//             for row in rows {
//                 dbg!(row);
//             }
//             Ok(Some(User {
//                 name,
//                 selected_quests: vec![],
//                 completed_quests: vec![],
//             }))
//         } else {
//             Ok(None)
//         }
//     });
//
//     match data {
//         Ok(Some(x)) => Ok(Json(x)),
//         Ok(None) => Err(StatusCode::NOT_FOUND),
//         Err(e) => {
//             tracing::error!("rusqlite error: {e:?}");
//             Err(StatusCode::INTERNAL_SERVER_ERROR)
//         }
//     }
// }

/// An "Action" is stored as a nameless quest with one QuestTask associated with it.
#[derive(Serialize, Debug)]
struct GuildQuestAction {
    id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    xp: u32,
}
async fn get_guild_quest_actions(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<Vec<GuildQuestAction>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        if !db::guild_exists(&db, guild_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("no guild with id = {guild_id} exists"),
            )));
        }

        let mut query = db.prepare_cached(
            "SELECT id, * FROM Quest WHERE guild_id = :guild_id;"
        )?;
        let quests = query
            .query_map(named_params! { ":guild_id": guild_id }, |row| {
                let mut query = db.prepare_cached(
                    "SELECT name, xp FROM QuestTask WHERE quest_id = :quest_id;"
                )?;
                let id = row.get(0)?;
                let (name, xp) = query.query_row(named_params! { ":quest_id": id }, |row| {
                    Ok((row.get(0)?, row.get(1)?))
                })?;
                Ok(GuildQuestAction {
                    id, name, xp
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(Ok(quests))
    });

    match data {
        Ok(Ok(quests)) => Ok(Json(quests)),
        Ok(Err(e)) => Err(e),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

#[derive(Deserialize, Debug)]
struct AcceptQuest {
    quest_id: QuestId,
    // TODO: idempotency key?
}

/// As an Adventurer, accept a quest with the specified ID.
async fn accept_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(quest): Json<AcceptQuest>,
) -> Result<Json<QuestId>, (StatusCode, String)> {
    let data = state.write_transaction(|db| {
        let AcceptQuest { quest_id } = quest;
        // Steps:
        //  1. Ensure user exists
        //  2. Ensure quest exists
        //  3. Create slightly-altered copy of quest and associated data
        //  4. Return ID of new quest

        if !db::adventurer_exists(&db, user_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("adventurer with id = {user_id} doesn't exist"),
            )));
        }

        if !db::quest_exists(&db, quest_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("quest with id = {quest_id} doesn't exist"),
            )));
        }

        let new_id = db::accept_quest(&db, user_id, quest_id)?;
        Ok(Ok(new_id))
    });

    match data {
        Ok(Ok(x)) => Ok(Json(x)),
        Ok(Err(e)) => Err(e),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

#[derive(Serialize, Debug)]
struct AllowedGuildLeader {
    id: UserId,
    name: String,
}

/// Get the list of people who are allowed to be guild leaders.
async fn get_allowed_guild_leaders(
    State(state): State<ArcState>,
) -> Result<Json<Vec<AllowedGuildLeader>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached(
            "SELECT adventurer_id FROM Permission
                 WHERE permission_type = 2 OR permission_type = 0;",
        )?;
        let leaders = query
            .query_map([], |row| {
                let mut query = db.prepare_cached("SELECT name FROM Adventurer WHERE id = :id;")?;
                let id = row.get(0)?;
                let name = query.query_row(named_params! { ":id": id }, |row| row.get(0))?;
                Ok(AllowedGuildLeader { id, name })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(leaders)
    });

    match data {
        Ok(leaders) => Ok(Json(leaders)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

#[derive(Serialize, Debug)]
struct Guild {
    id: GuildId,
    name: String,
    leader_id: Option<UserId>,
}
async fn get_guilds(
    State(state): State<ArcState>,
) -> Result<Json<Vec<Guild>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached("SELECT id, name FROM Guild;")?;
        let guilds = query
            .query_map(named_params! {}, |row| {
                let mut query = db.prepare_cached(
                    "SELECT adventurer_id FROM AdventurerRole
                     WHERE guild_id = :guild_id AND assigned_role = 'leader';",
                )?;
                let guild_id = row.get::<_, GuildId>(0)?;
                let leader_id = query
                    .query_row(named_params! { ":guild_id": guild_id }, |row| row.get(0))
                    .optional()?;
                Ok(Guild {
                    id: guild_id,
                    name: row.get(1)?,
                    leader_id,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(guilds)
    });
    match data {
        Ok(x) => Ok(Json(x)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

#[derive(Deserialize, Debug)]
struct CreateGuild {
    name: String,
}
async fn create_guild(
    State(state): State<ArcState>,
    Json(guild): Json<CreateGuild>,
) -> Result<Json<GuildId>, (StatusCode, String)> {
    let data = state.write_transaction(|db| {
        let mut query = db.prepare_cached("INSERT INTO Guild (name) VALUES (:name);")?;
        let n = query.execute(named_params! { ":name": guild.name })?;
        assert_eq!(n, 1);
        let id = db.last_insert_rowid();

        Ok(GuildId(
            id.try_into().expect("exceeded max ID value, > 4 billion"),
        ))
    });

    match data {
        Ok(x) => Ok(Json(x)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

async fn get_guild_name(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<String>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached("SELECT name FROM Guild WHERE id = :id;")?;
        query
            .query_row(named_params! { ":id": guild_id }, |row| {
                row.get::<_, String>(0)
            })
            .optional()
    });
    match data {
        Ok(Some(x)) => Ok(Json(x)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            format!("no guild with id = {guild_id} exists"),
        )),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

async fn set_guild_name(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(name): Json<String>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let mut query = db.prepare_cached(
            "UPDATE Guild SET name = :name WHERE id = :id;"
        )?;
        let n = query.execute(named_params! { ":name": name, ":id": guild_id })?;
        match n {
            // No guilds existed with that ID.
            0 => Ok(None),
            // One guild existed with that ID.
            1 => Ok(Some(())),
            // More than one guild existed with that ID.
            _ => unreachable!("somehow we affected more than one row when we were updating based on a primary key"),
        }
    });

    match res {
        Ok(Some(())) => Ok(()),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            format!("no guild with id = {guild_id} exists"),
        )),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

#[derive(Deserialize, Debug)]
struct SetGuildLeader {
    id: UserId,
}
async fn set_guild_leader(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(leader): Json<SetGuildLeader>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        // Steps:
        //  1. Ensure the guild exists
        //  2. Ensure the chosen adventurer exists
        //  3. Delete any existing AdventurerRole 'leaders' of the guild
        //  4. Insert a new 'leader' into AdventurerRole
        if !db::guild_exists(&db, guild_id)? {
            return Ok(Err(format!("no guild with id = {guild_id} exists")));
        }
        if !db::adventurer_exists(&db, leader.id)? {
            return Ok(Err(format!("no adventurer with id = {} exists", leader.id)));
        }

        let mut query = db.prepare_cached(
            "DELETE FROM AdventurerRole WHERE guild_id = :guild_id AND assigned_role = 'leader';",
        )?;
        query.execute(named_params! { ":guild_id": guild_id })?;
        let mut query = db.prepare_cached(
            "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
        )?;
        let n =
            query.execute(named_params! { ":adventurer_id": leader.id, ":guild_id": guild_id })?;
        assert_eq!(n, 1);

        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
        Ok(Err(msg)) => Err((StatusCode::NOT_FOUND, msg)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}
// async fn get_guild_leader(
//     State(state): State<ArcState>,
//     Path(guild_id): Path<GuildId>,
// ) -> Result<Json<User>, (StatusCode, String)> {
//     todo!()
// }