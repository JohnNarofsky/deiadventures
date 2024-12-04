//! # The Web API Server
//! This program is the go-between the Web frontend and the database.
//! It has these jobs:
//! 1. Receive requests, authenticate them, and execute them.
//! 2. Run scheduled jobs. (Cleanup of expired sessions, for example.)
//! 3. Abstract away the particular database in use.


mod db;
mod error;
mod command;

use std::convert::Infallible;
use crate::error::Error;
use argon2::password_hash::{PasswordHashString, Salt, SaltString};
use argon2::{Argon2, password_hash, PasswordHash, PasswordHasher};
use axum::extract::{Path, State};
use axum::headers::HeaderValue;
use axum::http::{StatusCode, Uri};
use axum::routing::{delete, get, post, put};
use axum::{headers, Json, Router, TypedHeader};
use rand::Rng;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSqlOutput, ValueRef};
use rusqlite::{named_params, OptionalExtension, ToSql};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
#[cfg(feature = "cors_permissive")]
use tower_http::cors::CorsLayer;
use crate::db::{Email, Name};

/// This module defines all the environment variables we read in this program.
mod env {
    use std::path::PathBuf;
    menv::require_envs! {
        (assert_envs, any_set, gen_help);

        port, "DEI_PORT", u16,
        "DEI_PORT should be set to the intended bind port";

        db, "DEI_DB", PathBuf,
        "DEI_DB should be set to the path to the database";
        
        site_url, "DEI_SITE_URL", String,
        "DEI_SITE_URL should be set to the URL for the frontend of this instance";
        
        pw_reset_email_from, "DEI_RESET_EMAIL_FROM", String,
        "DEI_RESET_EMAIL_FROM should be set to the FROM email for password resets sent from this instance (example: noreply@auto.deiadventures.quest)";
        
        _aws_access_key_id, "AWS_ACCESS_KEY_ID", String,
        "AWS_ACCESS_KEY_ID should be set to the AWS access key ID (used for email sending)";
        _aws_secret_access_key, "AWS_SECRET_ACCESS_KEY", String,
        "AWS_ACCESS_KEY_ID should be set to the AWS secret access key (used for email sending)";
        _aws_region, "AWS_REGION", String,
        "AWS_REGION should be set to the AWS region (used for email sending)";

        // Note: We're currently omitting OAuth functionality in the interest of time,
        // but this is one way we could incorporate this information.
        // oauth_id, "OAUTH_ID", String,
        // "OAUTH_ID should be set to our OAuth client ID";
        // oauth_secret, "OAUTH_SECRET", String,
        // "OAUTH_SECRET should be set to our OAuth client secret";
    }
}

/// The program entry point.
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

    // If no arguments are provided, we default to running the server.
    // This is primarily to avoid needing to update docs or scripts,
    // we should remove the default at some point, but I want zero barriers
    // to immediately merging the new utilities.
    let args: command::Args = if std::env::args().len() > 1 {
        argh::from_env()
    } else {
        command::Args {
            command: command::Subcommand::Server(command::Server {}),
        }
    };

    match args.command {
        command::Subcommand::Server(command::Server {}) => run_server(state).await,
        command::Subcommand::AddAdmin(command::add_admin::AddAdmin {}) => command::add_admin::add_admin(state),
        command::Subcommand::HashPassword(args) => command::hash_password::hash_password(args),
        command::Subcommand::InsertDemo(args) => command::insert_demo::insert_demo(state, args),
    }
}

/// Invoked by [`main`], this sets up the Web server and attaches
/// every endpoint to the appropriate function.
async fn run_server(state: Arc<AppState>) {
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
        .route("/user/:user_id", get(get_user))
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
        .route("/guild/:guild_id/participation", get(get_guild_participation))
        .route("/quest-action/:quest_action_id/participation", get(get_quest_action_participation))
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
        .route("/auth/login", post(auth_login))
        .route("/auth/logout", delete(auth_logout))
        .route("/auth/renew-session", put(auth_renew_session))
        .route(
            "/auth/account/:user_id/set-password",
            put(auth_set_password),
        )
        .route(
            "/auth/account/forgot-password",
            post(auth_forgot_password)
        )
        .fallback(fallback);
    #[cfg(feature = "cors_permissive")]
    let app = app
        // TODO: we're going to want to narrow this,
        //  but it's currently the least of our worries
        //  (remember, we're not yet even authenticating API requests)
        .layer(CorsLayer::very_permissive());
    let app = app
        .with_state(state.clone());

    let addr = SocketAddr::from(([127, 0, 0, 1], env::port()));
    tracing::debug!("listening on {addr}");
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

/// The fallback route handler,
/// called when the request matches no known endpoint.
async fn fallback(uri: Uri) -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, format!("No route for {uri}"))
}

/// This function waits for a shutdown signal. It is called by [`run_server`], and controls
/// when the server begins winding down.
async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to wait for sigint");
    tracing::info!("Received interrupt signal. Shutting down...");
}

/// The global state of this server. Contains our connection to the database.
struct AppState {
    db: Mutex<rusqlite::Connection>,
}
impl AppState {
    fn new(db_path: &std::path::Path) -> Self {
        let db = db::open(db_path).unwrap();
        let db = Mutex::new(db);
        Self { db }
    }

    /// Run some code inside of a SQLite read transaction.
    // These transaction wrapper methods, conveniently, prevent any async code from being passed to them,
    // which is good because performing an await while we hold a lock on the database will cause a deadlock.
    fn read_transaction<T, E, F: FnOnce(&mut rusqlite::Transaction) -> Result<T, Error<E>>>(
        &self,
        f: F,
    ) -> Result<T, Error<E>> {
        // Not a fan of lock poisoning, but whatever. We'll cope with it for now.
        let mut guard = self.db.lock().unwrap();
        let mut transaction =
            rusqlite::Transaction::new(&mut guard, rusqlite::TransactionBehavior::Deferred)?;
        let res = f(&mut transaction)?;
        transaction.commit()?;
        Ok(res)
    }
    /// Run some code inside of a SQLite write transaction.
    fn write_transaction<T, E, F: FnOnce(&mut rusqlite::Transaction) -> Result<T, Error<E>>>(
        &self,
        f: F,
    ) -> Result<T, Error<E>> {
        let mut guard = self.db.lock().unwrap();
        let mut transaction =
            rusqlite::Transaction::new(&mut guard, rusqlite::TransactionBehavior::Immediate)?;
        let res = f(&mut transaction)?;
        transaction.commit()?;
        Ok(res)
    }
}

type ArcState = Arc<AppState>;

/// Single purpose macro for newtyping a 32 bit integer ID from the database.
/// Used by [`GuildId`], [`QuestId`], and [`UserId`].
// Just making wrapper types so we can annotate
// what our request method parameters are.
macro_rules! decl_ids {
    ($($(#[$m:meta])* $kind:ident),*) => {
        $(
            $(#[$m])*
            #[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq)]
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
decl_ids! {
    /// The ID number for a guild.
    GuildId,
    /// The ID number for a quest.
    QuestId,
    /// The ID number for a user.
    UserId
}

#[derive(Serialize)]
struct User {
    name: String,
    selected_quests: Vec<QuestId>,
    completed_quests: Vec<QuestId>,
    // TODO: I've forgotten part of what fields were requested on this object
}

/// The user data object returned by [`get_user`] and [`get_users`].
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
impl FromSql for PermissionType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let code: i64 = <i64 as FromSql>::column_result(value)?;
        if let Some(ty) = Self::extract(code) {
            Ok(ty)
        } else {
            Err(FromSqlError::OutOfRange(code))
        }
    }
}

/// Get a list of [`UserSummary`]s describing all users.
async fn get_users(State(state): State<ArcState>) -> Result<Json<Vec<UserSummary>>, Error> {
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

        Ok::<_, Error>(users.collect::<Result<Vec<_>, _>>()?)
    });

    data.map(Json)
}

/// Get a [`UserSummary`] describing a user.
async fn get_user(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<UserSummary>, Error> {
    let data: Result<UserSummary, Error> = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) });
        }
        let name: String = db.query_row(
            "SELECT name FROM Adventurer WHERE id = :user_id",
            named_params! { ":user_id": user_id },
            |row| row.get(0),
        )?;
        let mut query = db.prepare_cached(
            "SELECT guild_id, assigned_role FROM AdventurerRole
                 WHERE adventurer_id = :user_id;",
        )?;
        let roles = query
            .query_map(named_params! { ":user_id": user_id }, |row| {
                Ok(Role {
                    guild_id: row.get(0)?,
                    name: row.get(1)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        let mut query = db.prepare_cached(
            "SELECT permission_type FROM Permission
                 WHERE adventurer_id = :user_id;",
        )?;
        let permissions = query
            .query_map(named_params! { ":user_id": user_id }, |row| {
                Ok(Permission {
                    r#type: PermissionType::extract(row.get(0)?).unwrap(),
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(UserSummary {
            id: user_id,
            name,
            roles,
            permissions,
        })
    });

    data.map(Json)
}

#[derive(Serialize, Debug)]
struct AcceptedQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    open_date: Option<JsTimestamp>,
}
async fn get_user_accepted_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<AcceptedQuestAction>>, Error> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) })
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
                    db.prepare_cached("SELECT guild_id, open_date FROM Quest WHERE id = :quest_id;")?;
                let (guild_id, open_date) =
                    query.query_row(named_params! { ":quest_id": quest_id }, |row| Ok((row.get(0)?, row.get(1)?)))?;
                let mut query = db
                    .prepare_cached("SELECT name, description, adventurer_note, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(AcceptedQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        description: row.get(1)?,
                        adventurer_note: row.get(2)?,
                        xp: row.get(3)?,
                        open_date,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(quests)
    });

    data.map(Json)
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
impl FromSql for JsInt {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        i64::column_result(value)
            .and_then(|x| JsInt::try_from(x).map_err(|()| FromSqlError::OutOfRange(x)))
    }
}

#[derive(Serialize, Debug)]
struct JsTimestamp(JsInt);

impl FromSql for JsTimestamp {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        // Note: To exceed the range of a JS timestamp,
        // we'd need to reach past the year 27000.
        i64::column_result(value)
            .and_then(|x| i64::checked_mul(x, 1000).ok_or(FromSqlError::OutOfRange(x)))
            .and_then(|x| JsInt::try_from(x).map_err(|()| FromSqlError::OutOfRange(x)))
            .map(|x| Self(x))
    }
}

#[derive(Serialize, Debug)]
struct CompletedQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    accepted_date: Option<JsTimestamp>,
    // To avoid the 2038 problem, we make sure to use the maximum possible
    // integer width supported by JS, which resembles a 53 bit integer.
    completed_date: JsInt,
}
async fn get_user_completed_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<CompletedQuestAction>>, Error> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) })
        }
        let mut query = db.prepare_cached(
            "SELECT quest_id, close_date, open_date FROM PartyMember
                 JOIN Quest ON close_date IS NOT NULL
                 WHERE adventurer_id = :adventurer_id AND Quest.id = quest_id AND Quest.deleted_date IS NULL;",
        )?;
        let quests = query
            .query_map(named_params! { ":adventurer_id": user_id }, |row| {
                let quest_id = row.get(0)?;
                let close_date = i64::checked_mul(row.get(1)?, 1000).unwrap();
                let completed_date = close_date.try_into().expect("completion date exceeded the year 27000");
                let accepted_date = row.get(2)?;
                let mut query =
                    db.prepare_cached("SELECT guild_id FROM Quest WHERE id = :quest_id;")?;
                let guild_id =
                    query.query_row(named_params! { ":quest_id": quest_id }, |row| row.get(0))?;
                let mut query = db
                    .prepare_cached("SELECT name, description, adventurer_note, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(CompletedQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        description: row.get(1)?,
                        adventurer_note: row.get(2)?,
                        xp: row.get(3)?,
                        accepted_date,
                        completed_date,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(quests)
    });

    data.map(Json)
}

#[derive(Serialize, Debug)]
struct AvailableQuestAction {
    guild_id: GuildId,
    quest_id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    repeatable: bool,
}
async fn get_user_available_quest_actions(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<Vec<AvailableQuestAction>>, Error> {
    let data = state.read_transaction(|db| {
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) })
        }

        let mut query = db.prepare_cached(
            "WITH
                    -- This is the body of quests which have been accepted by the current adventurer.
                    -- They may be out of date on whether their parent quest is repeatable.
                    wa AS (SELECT parent_quest_id FROM Quest
                           JOIN PartyMember ON Quest.id = quest_id
                           WHERE adventurer_id = :adventurer_id AND deleted_date IS NULL)
                 SELECT id, guild_id, repeatable FROM Quest
                 LEFT OUTER JOIN wa ON Quest.id = wa.parent_quest_id AND Quest.repeatable = 0
                 WHERE wa.parent_quest_id IS NULL AND quest_type = 0 AND Quest.deleted_date IS NULL;",
        )?;
        let quests = query
            .query_map(named_params! { ":adventurer_id": user_id }, |row| {
                let quest_id: QuestId = row.get(0)?;
                let guild_id: GuildId = row.get(1)?;
                let repeatable: bool = row.get(2)?;
                let mut query = db
                    .prepare_cached("SELECT name, description, adventurer_note, xp FROM QuestTask WHERE quest_id = :quest_id;")?;
                query.query_row(named_params! { ":quest_id": quest_id }, |row| {
                    Ok(AvailableQuestAction {
                        guild_id,
                        quest_id,
                        name: row.get(0)?,
                        description: row.get(1)?,
                        adventurer_note: row.get(2)?,
                        xp: row.get(3)?,
                        repeatable,
                    })
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(quests)
    });

    data.map(Json)
}

/// An "Action" is stored as a nameless quest with one QuestTask associated with it.
///
/// The element type of the response body for [`get_guild_quest_actions`].
#[derive(Serialize, Debug)]
struct GuildQuestAction {
    id: QuestId,
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    repeatable: bool,
}

/// Get all quest actions associated with a guild.
async fn get_guild_quest_actions(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<Vec<GuildQuestAction>>, Error> {
    let data = state.read_transaction(|db| {
        db::lookup_guild_quest_actions(&db, guild_id)?
            .ok_or(Error::GuildNotFound { id: Some(guild_id) })
    });

    data.map(Json)
}

/// The element type of the response body for [`get_all_guilds_quest_actions`].
///
/// Represents a guild, together with every quest action associated with that guild.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GuildQuestActionsBundle {
    guild_id: GuildId,
    guild_title: String,
    guild_quest_actions: Vec<GuildQuestAction>,
}

/// Get a list of all guilds, each together with all their quest actions.
async fn get_all_guilds_quest_actions(
    State(state): State<ArcState>,
) -> Result<Json<Vec<GuildQuestActionsBundle>>, Error> {
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

    data.map(Json)
}

/// The request body for [`accept_quest`].
#[derive(Deserialize, Debug)]
struct AcceptQuest {
    quest_id: QuestId,
    // TODO: idempotency key?
}

/// The response body for [`accept_quest`].
#[derive(Serialize, Debug)]
struct AcceptedQuest {
    quest_id: QuestId,
}

/// As an Adventurer, accept a quest with the specified ID.
async fn accept_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(quest): Json<AcceptQuest>,
) -> Result<Json<AcceptedQuest>, Error> {
    let data = state.write_transaction(|db| {
        let AcceptQuest { quest_id } = quest;
        // Steps:
        //  1. Ensure user exists
        //  2. Ensure quest exists
        //  3. Create slightly-altered copy of quest and associated data
        //  4. Return ID of new quest

        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) });
        }

        if !db::quest_exists(&db, quest_id)? {
            return Err(Error::QuestNotFound { id: Some(quest_id) });
        }

        let new_id = db::accept_quest(&db, user_id, quest_id)?;
        Ok(new_id)
    });

    data.map(|quest_id| Json(AcceptedQuest { quest_id }))
}

/// The request body for [`complete_quest`].
#[derive(Deserialize, Debug)]
struct CompleteQuest {
    quest_id: QuestId,
}

/// As an Adventurer, complete the quest with the specified ID.
async fn complete_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(quest): Json<CompleteQuest>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let CompleteQuest { quest_id } = quest;
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) })
        }
        if !db::quest_exists(&db, quest_id)? {
            return Err(Error::QuestNotFound { id: Some(quest_id) })
        }
        let mut query = db.prepare_cached(
            "SELECT 0 FROM PartyMember WHERE adventurer_id = :adventurer_id AND quest_id = :quest_id;"
        )?;
        let has_accepted = query.exists(named_params! { ":adventurer_id": user_id, ":quest_id": quest_id })?;
        if !has_accepted {
            return Err(Error::NotQuestMember { user_id, quest_id })
        }

        let mut query = db.prepare_cached(
            "UPDATE Quest SET close_date = unixepoch() WHERE id = :quest_id;"
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(())
    });

    res
}

/// Request body for [`cancel_quest`].
#[derive(Deserialize, Debug)]
struct CancelQuest {
    quest_id: QuestId,
}

/// As an Adventurer, cancel the quest with the specified ID.
async fn cancel_quest(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(cancel): Json<CancelQuest>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        // TODO: unify this with complete_quest somehow, seeing as they're virtually identical
        let CancelQuest { quest_id } = cancel;
        if !db::adventurer_exists(&db, user_id)? {
            return Err(Error::AdventurerNotFound { id: Some(user_id) })
        }
        if !db::quest_exists(&db, quest_id)? {
            return Err(Error::QuestNotFound { id: Some(quest_id) })
        }
        let mut query = db.prepare_cached(
            "SELECT 0 FROM PartyMember WHERE adventurer_id = :adventurer_id AND quest_id = :quest_id;"
        )?;
        let has_accepted = query.exists(named_params! { ":adventurer_id": user_id, ":quest_id": quest_id })?;
        if !has_accepted {
            return Err(Error::NotQuestMember { user_id, quest_id })
        }

        let mut query = db.prepare_cached(
            "UPDATE Quest SET deleted_date = unixepoch() WHERE id = :quest_id;"
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);
        Ok(())
    });

    res
}

/// Identification of a user who is allowed to be a guild leader.
/// The element type of the response body of [`get_allowed_guild_leaders`].
#[derive(Serialize, Debug)]
struct AllowedGuildLeader {
    id: UserId,
    name: String,
}

/// Get the list of people who are allowed to be guild leaders.
async fn get_allowed_guild_leaders(
    State(state): State<ArcState>,
) -> Result<Json<Vec<AllowedGuildLeader>>, Error> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached(
            "SELECT adventurer_id FROM Permission
                 WHERE permission_type = 2 OR permission_type = 0
                 GROUP BY adventurer_id;",
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

    data.map(Json)
}

/// Pertinent data for a guild.
/// The element type of the response body of [`get_guilds`].
#[derive(Serialize, Debug)]
struct Guild {
    id: GuildId,
    name: String,
    leader_id: Option<UserId>,
    leader_name: Option<String>,
}
/// Get the list of guilds.
async fn get_guilds(State(state): State<ArcState>) -> Result<Json<Vec<Guild>>, Error> {
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

    data.map(Json)
}

/// The request body of [`create_guild`].
#[derive(Deserialize, Debug)]
struct CreateGuild {
    name: String,
    leader_id: Option<UserId>,
}
/// As a super user, create a new guild.
async fn create_guild(
    State(state): State<ArcState>,
    Json(guild): Json<CreateGuild>,
) -> Result<Json<GuildId>, Error> {
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

    data.map(Json)
}

/// The request body for [`update_guild`].
#[derive(Deserialize, Debug)]
struct UpdateGuild {
    name: String,
    leader_id: Option<UserId>,
}
/// As a super user, edit the name and leader of a guild.
async fn update_guild(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(update): Json<UpdateGuild>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let UpdateGuild { name, leader_id } = update;
        if !db::guild_exists(&db, guild_id)? {
            return Err(Error::GuildNotFound { id: Some(guild_id) });
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
                return Err(Error::AdventurerNotFound {
                    id: Some(leader_id),
                });
            }
            let mut query = db.prepare_cached(
                "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
            )?;
            let n = query
                .execute(named_params! { ":adventurer_id": leader_id, ":guild_id": guild_id })?;
            assert_eq!(n, 1);
        }

        Ok(())
    });

    res
}

/// The request body for [`create_guild_quest_action`].
#[derive(Deserialize, Debug)]
struct CreateGuildQuestAction {
    // "name" is the column name, but we're putting it in a "description" field
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    // This field is defaulted to be backward compatible with the frontend,
    // which is not yet passing this field.
    #[serde(default)]
    repeatable: bool,
}

/// The response body for [`create_guild_quest_action`].
#[derive(Serialize, Debug)]
struct CreatedGuildQuestAction {
    quest_id: QuestId,
}
/// As a guild leader, create a quest action for a guild you are the leader of.
async fn create_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(action): Json<CreateGuildQuestAction>,
) -> Result<Json<CreatedGuildQuestAction>, Error> {
    let res = state.write_transaction(|db| {
        let CreateGuildQuestAction { name, description, adventurer_note, xp, repeatable } = action;
        let mut query =
            db.prepare_cached("INSERT INTO Quest (guild_id, quest_type, repeatable) VALUES (:guild_id, 0, :repeatable);")?;
        let n = query.execute(named_params! {
            ":guild_id": guild_id,
            ":repeatable": repeatable,
        })?;
        assert_eq!(n, 1);
        let quest_id = db.last_insert_rowid();

        let mut query = db.prepare_cached(
            "INSERT INTO QuestTask (quest_id, order_index, name, description, adventurer_note, xp)
                 VALUES (:quest_id, 0, :name, :description, :adventurer_note, :xp);",
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id, ":name": name, ":description": description, ":adventurer_note": adventurer_note, ":xp": xp })?;
        assert_eq!(n, 1);
        Ok(CreatedGuildQuestAction {
            quest_id: QuestId(quest_id.try_into().unwrap()),
        })
    });

    res.map(Json)
}

/// The request body for [`edit_guild_quest_action`].
#[derive(Deserialize, Debug)]
struct EditGuildQuestAction {
    quest_id: QuestId,
    #[serde(rename = "description")]
    name: String,
    #[serde(rename = "name")]
    description: Option<String>,
    adventurer_note: Option<String>,
    xp: u32,
    #[serde(default)]
    repeatable: bool,
}
/// As a guild leader, edit the name and xp value of a quest action.
async fn edit_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(action): Json<EditGuildQuestAction>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let EditGuildQuestAction { quest_id, name, description, adventurer_note, xp, repeatable } = action;
        if !db::guild_exists(&db, guild_id)? {
            return Err(Error::GuildNotFound { id: Some(guild_id) });
        }
        if !db::quest_exists(&db, quest_id)? {
            return Err(Error::QuestNotFound { id: Some(quest_id) });
        }

        let mut query = db.prepare_cached("UPDATE Quest SET repeatable = :repeatable WHERE id = :quest_id;")?;
        let _n = query.execute(named_params! { ":repeatable": repeatable, ":quest_id": quest_id })?;

        let mut query = db.prepare_cached(
            "UPDATE QuestTask SET name = :name, description = :description, adventurer_note = :adventurer_note, xp = :xp WHERE quest_id = :quest_id;",
        )?;
        let n = query.execute(named_params! { ":name": name, ":description": description, ":adventurer_note": adventurer_note, ":xp": xp, ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(())
    });

    res
}

/// Get the name of a guild with a specified ID.
async fn get_guild_name(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<String>, Error> {
    let data = state.read_transaction(|db| {
        let mut query = db.prepare_cached("SELECT name FROM Guild WHERE id = :id;")?;
        query
            .query_row(named_params! { ":id": guild_id }, |row| {
                row.get::<_, String>(0)
            })
            .optional()
            .map_err(Error::DbError)
            .and_then(|x| x.ok_or(Error::GuildNotFound { id: Some(guild_id) }))
    });
    data.map(Json)
}

/// As a super user, set the name of a guild with a specified ID.
async fn set_guild_name(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(name): Json<String>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let mut query = db.prepare_cached(
            "UPDATE Guild SET name = :name WHERE id = :id;"
        )?;
        let n = query.execute(named_params! { ":name": name, ":id": guild_id })?;
        match n {
            // No guilds existed with that ID.
            0 => Err(Error::GuildNotFound { id: Some(guild_id) }),
            // One guild existed with that ID.
            1 => Ok(()),
            // More than one guild existed with that ID.
            _ => unreachable!("somehow we affected more than one row when we were updating based on a primary key"),
        }
    });

    res
}

/// The request body for [`set_guild_leader`].
#[derive(Deserialize, Debug)]
struct SetGuildLeader {
    id: Option<UserId>,
}

/// As a super user, set the guild leader of a guild with a specified ID.
// TODO: make refuse to set a guild leader when the person given
//  isn't allowed to be a guild leader
async fn set_guild_leader(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(leader): Json<SetGuildLeader>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        // Steps:
        //  1. Ensure the guild exists
        //  2. Ensure the chosen adventurer exists
        //  3. Delete any existing AdventurerRole 'leaders' of the guild
        //  4. Insert a new 'leader' into AdventurerRole
        if !db::guild_exists(&db, guild_id)? {
            return Err(Error::GuildNotFound { id: Some(guild_id) });
        }

        let mut query = db.prepare_cached(
            "DELETE FROM AdventurerRole WHERE guild_id = :guild_id AND assigned_role = 'leader';",
        )?;
        query.execute(named_params! { ":guild_id": guild_id })?;

        if let Some(leader_id) = leader.id {
            if !db::adventurer_exists(&db, leader_id)? {
                return Err(Error::AdventurerNotFound {
                    id: Some(leader_id),
                });
            }
            let mut query = db.prepare_cached(
                "INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
                 VALUES (:adventurer_id, :guild_id, 'leader');",
            )?;
            let n = query
                .execute(named_params! { ":adventurer_id": leader_id, ":guild_id": guild_id })?;
            assert_eq!(n, 1);
        }

        Ok(())
    });

    res
}

/// The response body for [`get_guild_leader`].
#[derive(Serialize, Debug)]
struct GetGuildLeader {
    id: UserId,
}
/// Get the leader of a guild.
async fn get_guild_leader(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
) -> Result<Json<Option<GetGuildLeader>>, Error> {
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

    data.map(Json)
}

#[derive(Debug, Serialize)]
struct GuildParticipation {
    quest_actions: Vec<QuestActionParticipation>,
}
async fn get_guild_participation(State(state): State<ArcState>, Path(guild_id): Path<GuildId>) -> Result<Json<GuildParticipation>, Error> {
    let data = state.read_transaction(|db| {
        let actions = db::lookup_guild_quest_actions(&db, guild_id)?
            .ok_or(Error::GuildNotFound { id: Some(guild_id) })?;
        
        let mut participation = db.prepare_cached("
            SELECT Adventurer.id, Adventurer.name, QuestTask.name, QuestTask.description, Quest.open_date, Quest.close_date
            FROM PartyMember
                INNER JOIN Quest ON Quest.parent_quest_id = :quest_action_id AND Quest.id = PartyMember.quest_id
                INNER JOIN Adventurer ON Adventurer.id = PartyMember.adventurer_id
                INNER JOIN QuestTask ON QuestTask.quest_id = PartyMember.quest_id
                LEFT OUTER JOIN Permission ON Permission.adventurer_id = PartyMember.adventurer_id AND Permission.permission_type = 3
            WHERE Quest.deleted_date IS NULL;
")?;
        let mut quest_actions = Vec::with_capacity(actions.len());
        for action in actions {
            let adventurers = participation.query_map(named_params! {
                ":quest_action_id": action.id,
            }, |row| {
                Ok(QuestActionIndividualParticipation {
                    user: QuestActionParticipant {
                        id: row.get(0)?,
                        name: row.get(1)?,
                    },
                    quest_name: row.get(2)?,
                    quest_description: row.get(3)?,
                    accepted_date: row.get(4)?,
                    completed_date: row.get(5)?,
                    adventurer_note: None,
                })
            })?.collect::<Result<Vec<_>, _>>()?;
            quest_actions.push(QuestActionParticipation {
                adventurers,
                quest_id: action.id,
            });
        }
        Ok(GuildParticipation { quest_actions })
    });
    data.map(Json)
}

/// Set the state of a given permission, for a user. Deals with opening a write transaction,
/// so we can write several endpoints which do only this by making their body just a call to this.
fn set_perm_endpoint(
    state: ArcState,
    user: UserId,
    perm: PermissionType,
    truth: bool,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        db::set_user_permission(&db, user, perm, truth).map_err(Error::DbError)
    });

    res
}

/// The request body for several methods:
/// - [`set_user_accepted`]
/// - [`set_user_rejected`]
/// - [`set_user_superuser`]
/// - [`set_user_eligible_guild_leader`]
#[derive(Deserialize, Debug)]
struct SetPerm {
    set: bool,
}

/// As a super user, mark whether a user is accepted or not.
async fn set_user_accepted(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(accepted): Json<SetPerm>,
) -> Result<(), Error> {
    set_perm_endpoint(state, user_id, PermissionType::Approved, accepted.set)
}

/// As a super user, mark whether a user is rejected or not.
async fn set_user_rejected(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(rejected): Json<SetPerm>,
) -> Result<(), Error> {
    set_perm_endpoint(state, user_id, PermissionType::Rejected, rejected.set)
}

/// As a super user, mark whether a user is a super user or not.
async fn set_user_superuser(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(superuser): Json<SetPerm>,
) -> Result<(), Error> {
    set_perm_endpoint(state, user_id, PermissionType::SuperUser, superuser.set)
}

/// As a super user, mark whether a user is eligible to be a guild leader or not.
async fn set_user_eligible_guild_leader(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
    Json(eligible): Json<SetPerm>,
) -> Result<(), Error> {
    set_perm_endpoint(
        state,
        user_id,
        PermissionType::GuildLeaderEligible,
        eligible.set,
    )
}

/// The request body for [`retire_guild_quest_action`].
#[derive(Deserialize, Debug)]
struct DeleteGuildQuestAction {
    quest_id: QuestId,
}

/// As a guild leader, unpublish a quest action which is currently available
/// for acceptance by adventurers.
async fn retire_guild_quest_action(
    State(state): State<ArcState>,
    Path(guild_id): Path<GuildId>,
    Json(delete): Json<DeleteGuildQuestAction>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let DeleteGuildQuestAction { quest_id } = delete;
        if !db::quest_exists(&db, delete.quest_id)? {
            return Err(Error::QuestNotFound { id: Some(quest_id) });
        }
        let mut query = db.prepare_cached("SELECT guild_id FROM Quest WHERE id = :quest_id;")?;
        if !query.exists(named_params! { ":quest_id": quest_id })? {
            return Err(Error::QuestNotBelongToGuild { quest_id, guild_id });
        }
        let mut query = db.prepare_cached(
            // To make recovery from mistakes possible,
            // we mark quests as deleted instead of actually deleting them.
            "UPDATE Quest SET deleted_date = unixepoch()
                 WHERE id = :quest_id;",
        )?;
        let n = query.execute(named_params! { ":quest_id": quest_id })?;
        assert_eq!(n, 1);

        Ok(())
    });

    res
}


#[derive(Debug, Serialize)]
struct QuestActionParticipation {
    adventurers: Vec<QuestActionIndividualParticipation>,
    quest_id: QuestId,
}
#[derive(Debug, Serialize)]
struct QuestActionParticipant {
    id: UserId,
    name: String,
}
#[derive(Debug, Serialize)]
struct QuestActionIndividualParticipation {
    user: QuestActionParticipant,
    #[serde(rename = "quest_description")]
    quest_name: String,
    #[serde(rename = "quest_name")]
    quest_description: Option<String>,
    accepted_date: Option<JsTimestamp>,
    completed_date: Option<JsTimestamp>,
    /// This is a note that an adventurer has attached to a quest action,
    /// which is meant to describe how they participated in the quest.
    adventurer_note: Option<String>,
}
/// Get the list of other adventurers who've participated in this quest action, and available details about how they've done so.
/// 
/// Note that this omits adventurers who *canceled* their participation in the specified quest action.
async fn get_quest_action_participation(State(state): State<ArcState>, Path(quest_action_id): Path<QuestId>) -> Result<Json<QuestActionParticipation>, Error> {
    let res = state.read_transaction(|db| {
        let mut participation = db.prepare_cached("
            SELECT Adventurer.id, Adventurer.name, QuestTask.name, QuestTask.description, Quest.open_date, Quest.close_date
            FROM PartyMember
                INNER JOIN Quest ON Quest.parent_quest_id = :quest_action_id AND Quest.id = PartyMember.quest_id
                INNER JOIN Adventurer ON Adventurer.id = PartyMember.adventurer_id
                INNER JOIN QuestTask ON QuestTask.quest_id = PartyMember.quest_id
                LEFT OUTER JOIN Permission ON Permission.adventurer_id = PartyMember.adventurer_id AND Permission.permission_type = 3
            WHERE Quest.deleted_date IS NULL;
")?;
        let adventurers = participation.query_map(named_params! {
            ":quest_action_id": quest_action_id,
        }, |row| {
            Ok(QuestActionIndividualParticipation {
                user: QuestActionParticipant {
                    id: row.get(0)?,
                    name: row.get(1)?,
                },
                quest_name: row.get(2)?,
                quest_description: row.get(3)?,
                accepted_date: row.get(4)?,
                completed_date: row.get(5)?,
                adventurer_note: None,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(QuestActionParticipation {
            adventurers,
            quest_id: quest_action_id,
        })
    });
    res.map(Json)
}

/// Wrapper type for consuming passwords to prevent obvious misuse
/// and accidental logging of passwords.
/// Doesn't avoid extra copies of passwords lingering in memory,
/// but should be good enough in the absence of memory safety bugs.
///
/// DO NOT put this in the database.
#[derive(Deserialize)]
#[serde(transparent)]
struct Password {
    text: String,
}
// Manual Debug impl to avoid leaking password in logs.
impl core::fmt::Debug for Password {
    fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
        write!(f, "Password {{ ... }}")
    }
}
impl FromStr for Password {
    type Err = Infallible;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self { text: s.to_string() })
    }
}
impl Password {
    /// Compute a hash of this password, given a salt.
    /// This is used by [`salty_hash`](Self::salty_hash) and [`check_hash`](Self::check_hash), both of which
    /// you should see about using instead of this.
    fn hash(&self, salt: Salt<'_>) -> Result<PasswordHashString, password_hash::Error> {
        // TODO: we should pick something specific and save the
        //       particular hash alg used with a row so that, when
        //       there is a desire to change algs, we can replace
        //       hashes as soon as we receive their password again
        let argon2 = Argon2::default();

        let hash = argon2.hash_password(self.text.as_bytes(), salt)?;

        Ok(hash.into())
    }

    /// Generate a new salt and compute the hash of this password using it.
    /// This is meant for use in saving a new password for a user.
    // I can have fun with names, right? lol
    fn salty_hash(&self) -> Result<(PasswordHashString, SaltString), password_hash::Error> {
        let salt = SaltString::generate(&mut rand::thread_rng());
        let hash = self.hash(salt.as_salt());
        Ok((hash?, salt))
    }

    /// Check if this password matches a given hash and salt.
    /// This is meant for use in validating a user's password at login.
    fn check_hash(
        &self,
        test_hash: PasswordHash,
        salt: Salt,
    ) -> Result<bool, password_hash::Error> {
        let hash = self.hash(salt)?;
        Ok(hash.password_hash() == test_hash)
    }
}

/// The request body for [`auth_create_account`].
// These top two are the only ones necessary for the MVP.
#[derive(Deserialize, Debug)]
struct CreateAccount {
    name: Name,
    email: Email,
    password: Password,
}

/// As an adventurer who is not registered yet, create a new account.
async fn auth_create_account(
    State(state): State<ArcState>,
    Json(account): Json<CreateAccount>,
) -> Result<(), Error> {
    let res = state.write_transaction(|db| {
        let CreateAccount {
            name,
            email,
            password,
        } = account;
        db::create_account(db, name, email, password)?;
        Ok(())
    });

    res
}

/// The request body for [`auth_login`].
#[derive(Deserialize, Debug)]
struct AuthLogin {
    email: String,
    password: Password,
}

// In a similar vein to `Password`, this type prevents obvious misuse,
// and has a manual `Debug` impl to avoid accidentally leaking it in logs.
#[derive(Serialize, Deserialize)]
#[serde(transparent)]
struct AuthToken {
    token: String,
}
impl core::fmt::Debug for AuthToken {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "Token {{ ... }}")
    }
}
impl ToSql for AuthToken {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        self.token.to_sql()
    }
}
impl headers::authorization::Credentials for AuthToken {
    const SCHEME: &'static str = "Bearer";

    fn decode(value: &HeaderValue) -> Option<Self> {
        let s = value.to_str().ok()?;
        // The documentation for Credentials says this this will always be the case.
        assert!(s.starts_with(Self::SCHEME));
        println!("auth decode: {s}");
        let rest = &s[Self::SCHEME.len()..];
        let rest = rest.trim_start();
        Some(Self {
            token: rest.to_string(),
        })
    }

    fn encode(&self) -> HeaderValue {
        let cred = Self::SCHEME.to_string() + " " + &self.token;
        // Since we restrict the token to printable ASCII,
        // this is infallible.
        let mut header = HeaderValue::from_str(&cred).unwrap();
        header.set_sensitive(true);
        header
    }
}
impl AuthToken {
    fn generate() -> Self {
        // To make things easy to work with in JSON,
        // our tokens are a buffer of printable ASCII text.
        // The printable ASCII range is from 0x20 to 0x7e.
        // To equal 128 bits of representation space, we want to compute
        // a number of ASCII characters equal to
        // 128 / log2(0x7e - 0x20), which roughly equals 20.
        const WIDTH: usize = 20;
        let mut rng = rand::thread_rng();
        let mut token = String::with_capacity(WIDTH);
        for _ in 0..WIDTH {
            let c = rng.gen_range(0x20..0x7eu8);
            token.push(c as char);
        }
        Self { token }
    }
}

#[derive(Serialize, Debug)]
struct AuthLoginSession {
    id: UserId,
    token: AuthToken,
    start_time: JsInt,
    time_to_live: JsInt,
}
/// As a user who wants to be able to make API calls using
/// their account, login using your credentials and acquire a [session](AuthLoginSession).
async fn auth_login(
    State(state): State<ArcState>,
    Json(login): Json<AuthLogin>,
) -> Result<Json<AuthLoginSession>, Error> {
    let data = state.write_transaction(|db| {
        let AuthLogin { email, password } = login;
        // Steps:
        //  1. Lookup user by email. If doesn't exist, fail.
        //  2. Pull the user's password hash and salt.
        //  3. Compute the hash of the attempted password,
        //     and compare it to the one from the database.
        //     If it doesn't match, fail.
        //  4. Generate an AuthToken and insert a new row in AuthSession.
        //  5. Return the adventurer_id, token, start_time, and time_to_live.
        //     (Note: It'd also be easy to return the adventurer name.)

        let mut query = db.prepare_cached(
            "SELECT id, password_hash, password_salt FROM Adventurer
                 WHERE email_address = :email;",
        )?;
        let Some((adventurer_id, test_hash, salt)) = query
            .query_row(named_params! { ":email": email }, |row| {
                Ok((
                    row.get(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })
            .optional()?
        else {
            return Err(Error::AdventurerNotFoundByEmail { email });
        };

        let test_hash =
            PasswordHashString::new(&test_hash).expect("expected to save a valid password hash");
        let salt = SaltString::from_b64(&salt).expect("expected to save a valid hash salt");

        let check = password.check_hash(test_hash.password_hash(), salt.as_salt());
        match check {
            Ok(true) => (),
            _ => return Err(Error::UnauthorizedLogin),
        }

        let mut query = db.prepare_cached(
            "INSERT INTO AuthSession (adventurer_id, token, start_time, time_to_live)
                 VALUES (:adventurer_id, :token, unixepoch(), 2592000);",
        )?;

        let token = AuthToken::generate();
        let n =
            query.execute(named_params! { ":adventurer_id": adventurer_id, ":token": token })?;
        assert_eq!(n, 1);

        let session_id = db.last_insert_rowid();

        let mut query = db.prepare_cached(
            "SELECT start_time, time_to_live FROM AuthSession WHERE id = :session_id;",
        )?;
        let (start_time, time_to_live) = query
            .query_row(named_params! { ":session_id": session_id }, |row| {
                Ok((row.get(0)?, row.get(1)?))
            })?;

        Ok(AuthLoginSession {
            id: adventurer_id,
            token,
            start_time,
            time_to_live,
        })
    });

    data.map(Json)
}

/// As a user who currently has a valid [login session](AuthLoginSession),
/// logout: invalidate the session. (UNIMPLEMENTED)
// These are optional for the MVP.
async fn auth_logout() {}
/// As a user who currently has a valid [login session](AuthLoginSession),
/// renew that session so it takes longer to expire. (UNIMPLEMENTED)
async fn auth_renew_session() {}

/// The request body for [`auth_set_password`].
#[derive(Deserialize, Debug)]
struct SetPassword {
    password: Password,
}

/// As either a user doing this for their own account, or a super user doing it for anyone's,
/// set a new password for an account.
async fn auth_set_password(
    State(state): State<ArcState>,
    Path(target_user_id): Path<UserId>,
    TypedHeader(headers::Authorization(token)): TypedHeader<headers::Authorization<AuthToken>>,
    Json(set_password): Json<SetPassword>,
) -> Result<(), Error> {
    let SetPassword { password } = set_password;
    // Steps:
    // 1. Check that the request is authorized.
    // 2. Execute UPDATE and report failure if it tried to update a row which didn't exist
    //    (since a request is always authorized if sent by an admin)
    let res = state.write_transaction(|db| {
        // TODO: we are intentionally not checking ttl right now, but
        //  we should in the future, when the client knows how to refresh a session
        // TODO: we should be able to do db::is_user() || db::is_admin()
        //  or similar for this permission check
        let mut executing_user_id =
            db.prepare_cached("SELECT adventurer_id FROM AuthSession WHERE token = :token;")?;
        let Some(executing_user_id): Option<UserId> = executing_user_id
            .query_row(
                named_params! {
                    ":token": token,
                },
                |row| row.get(0),
            )
            .optional()?
        else {
            return Err(Error::SessionNotFound);
        };
        let mut is_admin = db.prepare_cached(
            "SELECT 0 FROM Permission WHERE
                 permission_type = :admin_type AND adventurer_id = :adventurer_id;",
        )?;
        if target_user_id == executing_user_id
            || is_admin.exists(named_params! {
                ":admin_type": PermissionType::SuperUser,
                ":adventurer_id": executing_user_id,
            })?
        {
            // The request is authorized.
            let mut password_salt =
                db.prepare_cached("SELECT password_salt FROM Adventurer WHERE id = :user_id;")?;
            let mut set_password = db.prepare_cached(
                "UPDATE Adventurer SET password_hash = :password_hash WHERE id = :user_id;",
            )?;
            let password_salt: String = password_salt.query_row(
                named_params! {
                    ":user_id": target_user_id,
                },
                |row| row.get(0),
            )?;

            let password_salt = match Salt::from_b64(&password_salt) {
                Ok(salt) => salt,
                Err(e) => {
                    tracing::error!("salt decoding failure: {e:?}");
                    return Err(Error::CannotComputePasswordHash);
                }
            };

            let new_hash = match password.hash(password_salt) {
                Ok(hash) => hash,
                Err(e) => {
                    tracing::error!("password hashing failure: {e:?}");
                    return Err(Error::CannotComputePasswordHash);
                }
            };
            let n = set_password.execute(named_params! {
                ":password_hash": new_hash.as_str(),
                ":user_id": target_user_id,
            })?;
            assert_eq!(n, 1);
            Ok(())
        } else {
            // The request is not authorized.
            Err(Error::InsufficientPermissions {
                msg: "insufficient permissions to set another user's password".to_string(),
            })
        }
    });

    res
}

#[derive(Debug, Deserialize)]
struct ForgotPassword {
    email: String,
}
/// This is an unauthenticated endpoint for initiating a password reset.
///
/// Currently, if a user initiates a password reset,
/// we generate a new password for them and send it to them in an email.
async fn auth_forgot_password(State(state): State<ArcState>, Json(ForgotPassword { email }): Json<ForgotPassword>) -> Result<(), Error> {
    // Since the requirements for a secure password and
    // a secure session token are identical, we're just reusing that here to make a password.
    let new_pass = Password { text: AuthToken::generate().token };
    let aws_cfg = aws_config::load_defaults(aws_config::BehaviorVersion::v2024_03_28()).await;
    let ses = aws_sdk_ses::Client::new(&aws_cfg);
    let res: Result<(), Error<()>> = state.write_transaction(|db| {
        let mut password_salt =
            db.prepare_cached("SELECT id, password_salt FROM Adventurer WHERE email_address = :user_email;")?;
        let mut set_password = db.prepare_cached(
            "UPDATE Adventurer SET password_hash = :password_hash WHERE id = :user_id;",
        )?;
        
        let (user_id, password_salt): (UserId, String) = password_salt.query_row(
            named_params! {
                ":user_email": email,
            },
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).optional()?.ok_or(Error::AdventurerNotFound { id: None })?;
        let password_salt = match Salt::from_b64(&password_salt) {
            Ok(salt) => salt,
            Err(e) => {
                tracing::error!("salt decoding failure: {e:?}");
                return Err(Error::CannotComputePasswordHash);
            }
        };
        
        let new_hash = match new_pass.hash(password_salt) {
            Ok(hash) => hash,
            Err(e) => {
                tracing::error!("password hashing failure: {e:?}");
                return Err(Error::CannotComputePasswordHash);
            }
        };
        let n = set_password.execute(named_params! {
            ":password_hash": new_hash.as_str(),
            ":user_id": user_id,
        })?;
        if n == 1 {
            Ok(())
        } else {
            assert_eq!(n, 0);
            Err(Error::AdventurerNotFound { id: Some(user_id) })
        }
    });
    match res {
        Ok(()) => {
            let target = aws_sdk_ses::types::Destination::builder()
                .to_addresses(email)
                .build();
            let body_text = aws_sdk_ses::types::Content::builder()
                .data(format!(
                    "This is your new password for DEI Adventures!\n\n{}\n\nLogin at {}",
                    &new_pass.text,
                    env::site_url(),
                ))
                    // "this is a test text message, have a new password: ".to_string() + &new_pass.text)
                .build()
                .unwrap();
            let body = aws_sdk_ses::types::Body::builder()
                .text(body_text)
                .build();
            let subject_text = aws_sdk_ses::types::Content::builder()
                .data("DEI Adventures Password Reset")
                .build()
                .unwrap();
            let message = aws_sdk_ses::types::Message::builder()
                .subject(subject_text)
                .body(body)
                .build();
            let res = ses.send_email()
                .source(env::pw_reset_email_from())
                .destination(target)
                .message(message)
                .send()
                .await;
            match res {
                Ok(output) => {
                    tracing::info!("successfully sent email: {output:?}");
                    Ok(())
                },
                Err(e) => {
                    tracing::warn!("failed to send email: {e:?}");
                    Ok(())
                }
            }
        }
        Err(e) => {
            tracing::warn!("failed to do password reset: {e:?}");
            Ok(())
        },
    }
}
