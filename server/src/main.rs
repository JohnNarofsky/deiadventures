mod db;

use axum::extract::{Path, State};
use axum::http::{StatusCode, Uri};
use axum::routing::{delete, get, post, put};
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
        // TODO: replace PUT with PATCH in the request method conventions?
        // Conventions:
        // - GET for pure information retrieval (obviously)
        // - POST for uploading a new object (things which feel like an INSERT)
        // - PUT for setting a property of an existing object (things which feel like an UPDATE)
        // - DELETE for deleting objects (obviously)
        // .route("/user/:user_id", get(get_user))
        .route("/user", get(get_users))
        .route("/user/:user_id/accept-quest", put(accept_quest))
        .route("/user/:user_id/complete-quest", put(complete_quest))
        .route("/user/:user_id/cancel-quest", delete(cancel_quest))
        .route(
            "/user/:user_id/accepted-quest-actions",
            get(get_user_accepted_quest_actions),
        )
        .route(
            "/user/:user_id/completed-quest-actions",
            get(get_user_completed_quest_actions),
        )
        .route(
            "/user/:user_id/available-quest-actions",
            get(get_user_available_quest_actions),
        )
        .route("/guild", get(get_guilds))
        .route("/guild", post(create_guild))
        .route("/guild/:guild_id/name", put(set_guild_name))
        .route("/guild/:guild_id/name", get(get_guild_name))
        .route("/guild/:guild_id/leader", put(set_guild_leader))
        .route("/guild/:guild_id", put(update_guild))
        .route(
            "/guild/:guild_id/quest-action",
            post(create_guild_quest_action),
        )
        .route(
            "/guild/:guild_id/quest-action",
            put(edit_guild_quest_action),
        )
        .route("/perm/allowed-leaders", get(get_allowed_guild_leaders))
        .route("/perm/:user_id/accepted", put(set_user_accepted))
        .route("/perm/:user_id/rejected", put(set_user_rejected))
        .route("/perm/:user_id/superuser", put(set_user_superuser))
        .route(
            "/perm/:user_id/eligible-guild-leader",
            put(set_user_eligible_guild_leader),
        )
        .route(
            // TODO: determine whether this should be under /guild or /quest
            "/guild/:guild_id/quest-action",
            delete(retire_guild_quest_action),
        )
        // - create adventurer
        // - set adventurer super user?
        // - complete quest action
        .route("/guild/:guild_id/leader", get(get_guild_leader))
        .route(
            "/guild/:guild_id/quest-actions",
            get(get_guild_quest_actions),
        )
        .route("/guild/quest-actions", get(get_all_guilds_quest_actions))
        // Auth endpoints.
        .route("/auth/account", post(auth_create_account))
        .route("/auth/login", get(auth_login))
        .route("/auth/logout", delete(auth_logout))
        .route("/auth/renew-session", put(auth_renew_session))
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

#[derive(Serialize, Debug, Copy, Clone, PartialEq, Eq)]
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
impl rusqlite::ToSql for PermissionType {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(*self as i64))
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

#[derive(Serialize, Debug)]
struct AcceptedQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    xp: u32,
}
async fn get_user_accepted_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<AcceptedQuestAction>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Ok(None);
        }
        let mut query = db.prepare_cached(
            "SELECT quest_id FROM PartyMember
                 JOIN Quest ON close_date IS NULL
                 WHERE adventurer_id = :adventurer_id AND Quest.id = quest_id AND Quest.deleted_date IS NULL;",
        )?;
        let quests = query
            .query_map(named_params! { ":adventurer_id": user_id }, |row| {
                let quest_id = row.get(0)?;
                let mut query =
                    db.prepare_cached("SELECT guild_id FROM Quest WHERE id = :quest_id;")?;
                let guild_id =
                    query.query_row(named_params! { ":quest_id": quest_id }, |row| row.get(0))?;
                let mut query = db
                    .prepare_cached("SELECT name, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(AcceptedQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        xp: row.get(1)?,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(Some(quests))
    });

    match data {
        Ok(Some(x)) => Ok(Json(x)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            format!("no user with id = {user_id} exists"),
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

/// A wrapper integer type for enforcing JS's bounds on safe integers
/// on the server side.
///
/// See `Number.MAX_SAFE_INTEGER` and `Number.MIN_SAFE_INTEGER` on MDN.
#[derive(Serialize, Debug)]
#[serde(transparent)]
struct JsInt(i64);
impl TryFrom<i64> for JsInt {
    type Error = ();
    fn try_from(value: i64) -> Result<Self, Self::Error> {
        const MAX_SAFE_INT: i64 = 9007199254740991;
        const MIN_SAFE_INT: i64 = -9007199254740991;
        if (value <= MAX_SAFE_INT) && (value >= MIN_SAFE_INT) {
            Ok(Self(value))
        } else {
            Err(())
        }
    }
}

#[derive(Serialize, Debug)]
struct CompletedQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    xp: u32,
    // To avoid the 2038 problem, we make sure to use the maximum possible
    // integer width supported by JS, which resembles a 53 bit integer.
    completed_date: JsInt,
}
async fn get_user_completed_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<CompletedQuestAction>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Ok(None);
        }
        let mut query = db.prepare_cached(
            "SELECT quest_id, close_date FROM PartyMember
                 JOIN Quest ON close_date IS NOT NULL
                 WHERE adventurer_id = :adventurer_id AND Quest.id = quest_id AND Quest.deleted_date IS NULL;",
        )?;
        let quests = query
            .query_map(named_params! { ":adventurer_id": user_id }, |row| {
                let quest_id = row.get(0)?;
                let close_date = i64::checked_mul(row.get(1)?, 1000).unwrap();
                let completed_date = close_date.try_into().expect("completion date exceeded the year 27000");
                let mut query =
                    db.prepare_cached("SELECT guild_id FROM Quest WHERE id = :quest_id;")?;
                let guild_id =
                    query.query_row(named_params! { ":quest_id": quest_id }, |row| row.get(0))?;
                let mut query = db
                    .prepare_cached("SELECT name, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(CompletedQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        xp: row.get(1)?,
                        completed_date,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(Some(quests))
    });

    match data {
        Ok(Some(x)) => Ok(Json(x)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            format!("no user with id = {user_id} exists"),
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

#[derive(Serialize, Debug)]
struct AvailableQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    xp: u32,
}
async fn get_user_available_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<AvailableQuestAction>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Ok(None);
        }

        let mut query = db.prepare_cached(
            "WITH
                    wa AS (SELECT parent_quest_id FROM Quest
                           JOIN PartyMember ON Quest.id = quest_id
                           WHERE adventurer_id = :adventurer_id AND deleted_date IS NULL)
                 SELECT id, guild_id FROM Quest
                 LEFT OUTER JOIN wa ON Quest.id = wa.parent_quest_id
                 WHERE wa.parent_quest_id IS NULL AND quest_type = 0 AND Quest.deleted_date IS NULL;",
        )?;
        let quests = query
            .query_map(named_params! { ":adventurer_id": user_id }, |row| {
                let quest_id: QuestId = row.get(0)?;
                let guild_id: GuildId = row.get(1)?;
                let mut query = db
                    .prepare_cached("SELECT name, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(AvailableQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        xp: row.get(1)?,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(Some(quests))
    });

    match data {
        Ok(Some(x)) => Ok(Json(x)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            format!("no user with id = {user_id} exists"),
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
        Ok(db::lookup_guild_quest_actions(&db, guild_id)?.ok_or((
            StatusCode::NOT_FOUND,
            format!("no guild with id = {guild_id} exists"),
        )))
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

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GuildQuestActionsBundle {
    guild_id: GuildId,
    guild_title: String,
    guild_quest_actions: Vec<GuildQuestAction>,
}

async fn get_all_guilds_quest_actions(
    State(state): State<ArcState>,
) -> Result<Json<Vec<GuildQuestActionsBundle>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached("SELECT id, name FROM Guild;")?;
        let bundles = query
            .query_map([], |row| {
                let guild_id = row.get(0)?;
                let guild_title = row.get(1)?;
                let guild_quest_actions = db::lookup_guild_quest_actions(&db, guild_id)?.unwrap();

                Ok(GuildQuestActionsBundle {
                    guild_id,
                    guild_title,
                    guild_quest_actions,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(bundles)
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
struct AcceptQuest {
    quest_id: QuestId,
    // TODO: idempotency key?
}

#[derive(Serialize, Debug)]
struct AcceptedQuest {
    quest_id: QuestId,
}

/// As an Adventurer, accept a quest with the specified ID.
async fn accept_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(quest): Json<AcceptQuest>,
) -> Result<Json<AcceptedQuest>, (StatusCode, String)> {
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
        Ok(Ok(quest_id)) => Ok(Json(AcceptedQuest { quest_id })),
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
struct CompleteQuest {
    quest_id: QuestId,
}
async fn complete_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(quest): Json<CompleteQuest>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let CompleteQuest { quest_id } = quest;
        if !db::adventurer_exists(&db, user_id)? {
            return Ok(Err((StatusCode::NOT_FOUND, format!("no user with id = {user_id} exists"))))
        }
        if !db::quest_exists(&db, quest_id)? {
            return Ok(Err((StatusCode::NOT_FOUND, format!("no quest with id = {quest_id} exists"))))
        }
        let mut query = db.prepare_cached(
            "SELECT 0 FROM PartyMember WHERE adventurer_id = :adventurer_id AND quest_id = :quest_id;"
        )?;
        let has_accepted = query.exists(named_params! { ":adventurer_id": user_id, ":quest_id": quest_id })?;
        if !has_accepted {
            return Ok(Err((StatusCode::BAD_REQUEST, format!("adventurer {user_id} is not a member of party for quest {quest_id}"))))
        }

        let mut query = db.prepare_cached(
            "UPDATE Quest SET close_date = unixepoch() WHERE id = :quest_id;"
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
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
struct CancelQuest {
    quest_id: QuestId,
}
async fn cancel_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(cancel): Json<CancelQuest>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        // TODO: unify this with complete_quest somehow, seeing as they're virtually identical
        let CancelQuest { quest_id } = cancel;
        if !db::adventurer_exists(&db, user_id)? {
            return Ok(Err((StatusCode::NOT_FOUND, format!("no user with id = {user_id} exists"))))
        }
        if !db::quest_exists(&db, quest_id)? {
            return Ok(Err((StatusCode::NOT_FOUND, format!("no quest with id = {quest_id} exists"))))
        }
        let mut query = db.prepare_cached(
            "SELECT 0 FROM PartyMember WHERE adventurer_id = :adventurer_id AND quest_id = :quest_id;"
        )?;
        let has_accepted = query.exists(named_params! { ":adventurer_id": user_id, ":quest_id": quest_id })?;
        if !has_accepted {
            return Ok(Err((StatusCode::BAD_REQUEST, format!("adventurer {user_id} is not a member of party for quest {quest_id}"))))
        }

        let mut query = db.prepare_cached(
            "UPDATE Quest SET deleted_date = unixepoch() WHERE id = :quest_id;"
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);
        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
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
    leader_name: Option<String>,
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
                let leader_name = if let Some(leader_id) = leader_id {
                    let mut query = db
                        .prepare_cached("SELECT name FROM Adventurer WHERE id = :adventurer_id;")?;
                    query
                        .query_row(named_params! { ":adventurer_id": leader_id }, |row| {
                            row.get(0)
                        })
                        .optional()?
                } else {
                    None
                };
                Ok(Guild {
                    id: guild_id,
                    name: row.get(1)?,
                    leader_id,
                    leader_name,
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
    leader_id: Option<UserId>,
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

        if let Some(leader_id) = guild.leader_id {
            let mut query = db.prepare_cached(
                "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
            )?;
            let n =
                query.execute(named_params! { ":adventurer_id": leader_id, ":guild_id": id })?;
            assert_eq!(n, 1);
        }

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

#[derive(Deserialize, Debug)]
struct UpdateGuild {
    name: String,
    leader_id: Option<UserId>,
}
async fn update_guild(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(update): Json<UpdateGuild>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let UpdateGuild { name, leader_id } = update;
        if !db::guild_exists(&db, guild_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("no guild with id = {guild_id} exists"),
            )));
        }

        let mut query = db.prepare_cached("UPDATE Guild SET name = :name WHERE id = :guild_id;")?;
        let n = query.execute(named_params! { ":name": name, ":guild_id": guild_id })?;
        assert_eq!(n, 1);

        let mut query = db.prepare_cached(
            "DELETE FROM AdventurerRole WHERE guild_id = :guild_id AND assigned_role = 'leader';",
        )?;
        query.execute(named_params! { ":guild_id": guild_id })?;

        if let Some(leader_id) = leader_id {
            if !db::adventurer_exists(&db, leader_id)? {
                return Ok(Err((
                    StatusCode::NOT_FOUND,
                    format!("no adventurer with id = {leader_id} exists"),
                )));
            }
            let mut query = db.prepare_cached(
                "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
            )?;
            let n = query
                .execute(named_params! { ":adventurer_id": leader_id, ":guild_id": guild_id })?;
            assert_eq!(n, 1);
        }

        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
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
struct CreateGuildQuestAction {
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    xp: u32,
}
#[derive(Serialize, Debug)]
struct CreatedGuildQuestAction {
    quest_id: QuestId,
}
async fn create_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(action): Json<CreateGuildQuestAction>,
) -> Result<Json<CreatedGuildQuestAction>, (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let CreateGuildQuestAction { name, xp } = action;
        let mut query =
            db.prepare_cached("INSERT INTO Quest (guild_id, quest_type) VALUES (:guild_id, 0);")?;
        let n = query.execute(named_params! { ":guild_id": guild_id })?;
        assert_eq!(n, 1);
        let quest_id = db.last_insert_rowid();

        let mut query = db.prepare_cached(
            "INSERT INTO QuestTask (quest_id, order_index, name, xp)
                 VALUES (:quest_id, 0, :name, :xp);",
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id, ":name": name, ":xp": xp })?;
        assert_eq!(n, 1);
        Ok(CreatedGuildQuestAction {
            quest_id: QuestId(quest_id.try_into().unwrap()),
        })
    });

    match res {
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
struct EditGuildQuestAction {
    quest_id: QuestId,
    #[serde(rename = "description")]
    name: String,
    xp: u32,
}
async fn edit_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(action): Json<EditGuildQuestAction>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let EditGuildQuestAction { quest_id, name, xp } = action;
        if !db::guild_exists(&db, guild_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("no guild with id = {guild_id} exists"),
            )));
        }
        if !db::quest_exists(&db, quest_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("no quest with id = {quest_id} exists"),
            )));
        }
        let mut query = db.prepare_cached(
            "UPDATE QuestTask SET name = :name, xp = :xp WHERE quest_id = :quest_id;",
        )?;
        let n = query.execute(named_params! { ":name": name, ":xp": xp, ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
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
    id: Option<UserId>,
}
// TODO: make refuse to set a guild leader when the person given
//  isn't allowed to be a guild leader
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

        let mut query = db.prepare_cached(
            "DELETE FROM AdventurerRole WHERE guild_id = :guild_id AND assigned_role = 'leader';",
        )?;
        query.execute(named_params! { ":guild_id": guild_id })?;

        if let Some(leader_id) = leader.id {
            if !db::adventurer_exists(&db, leader_id)? {
                return Ok(Err(format!("no adventurer with id = {} exists", leader_id)));
            }
            let mut query = db.prepare_cached(
                "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
            )?;
            let n = query
                .execute(named_params! { ":adventurer_id": leader_id, ":guild_id": guild_id })?;
            assert_eq!(n, 1);
        }

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

#[derive(Serialize, Debug)]
struct GetGuildLeader {
    id: UserId,
}
async fn get_guild_leader(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<Option<GetGuildLeader>>, (StatusCode, String)> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached(
            "SELECT adventurer_id FROM AdventurerRole
                 WHERE guild_id = :guild_id AND assigned_role = 'leader';",
        )?;
        let id = query
            .query_row(named_params! { ":guild_id": guild_id }, |row| row.get(0))
            .optional()?;
        Ok(id.map(|id| GetGuildLeader { id }))
    });

    match data {
        Ok(leader) => Ok(Json(leader)),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

fn set_perm_endpoint(
    state: ArcState,
    user: UserId,
    perm: PermissionType,
    truth: bool,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| db::set_user_permission(&db, user, perm, truth));

    match res {
        Ok(()) => Ok(()),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "database access failed".to_string(),
            ))
        }
    }
}

async fn set_user_accepted(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(accepted): Json<bool>,
) -> Result<(), (StatusCode, String)> {
    set_perm_endpoint(state, user_id, PermissionType::Approved, accepted)
}

async fn set_user_rejected(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(rejected): Json<bool>,
) -> Result<(), (StatusCode, String)> {
    set_perm_endpoint(state, user_id, PermissionType::Rejected, rejected)
}

async fn set_user_superuser(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(superuser): Json<bool>,
) -> Result<(), (StatusCode, String)> {
    set_perm_endpoint(state, user_id, PermissionType::SuperUser, superuser)
}

async fn set_user_eligible_guild_leader(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(eligible): Json<bool>,
) -> Result<(), (StatusCode, String)> {
    set_perm_endpoint(
        state,
        user_id,
        PermissionType::GuildLeaderEligible,
        eligible,
    )
}

#[derive(Deserialize, Debug)]
struct DeleteGuildQuestAction {
    quest_id: QuestId,
}
async fn retire_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(delete): Json<DeleteGuildQuestAction>,
) -> Result<(), (StatusCode, String)> {
    let res = state.write_transaction(|db| {
        let DeleteGuildQuestAction { quest_id } = delete;
        if !db::quest_exists(&db, delete.quest_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("no quest with id = {quest_id} exists"),
            )));
        }
        let mut query = db.prepare_cached("SELECT guild_id FROM Quest WHERE id = :quest_id;")?;
        if !query.exists(named_params! { ":quest_id": quest_id })? {
            return Ok(Err((
                StatusCode::BAD_REQUEST,
                format!("quest {quest_id} does not belong to guild {guild_id}"),
            )));
        }
        let mut query = db.prepare_cached(
            // To make recovery from mistakes possible,
            // we mark quests as deleted instead of actually deleting them.
            "UPDATE Quest SET deleted_date = unixepoch()
                 WHERE id = :quest_id;",
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(Ok(()))
    });

    match res {
        Ok(Ok(())) => Ok(()),
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

// These top two are the only ones necessary for the MVP.
async fn auth_create_account() {}
async fn auth_login() {}

// These are optional for the MVP.
async fn auth_logout() {}
async fn auth_renew_session() {}
