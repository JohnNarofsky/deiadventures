mod db;

use axum::extract::{Path, State};
use axum::http::{StatusCode, Uri};
use axum::routing::{get, post};
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
        .route("/user/:user_id", get(get_user))
        .route("/user/:user_id/accept_quest", post(accept_quest))
        .route("/guild/:guild_id/quests", get(get_guild_quests))
        .route("/guild/:guild_id/name", get(get_guild_name))
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
        let res = f(&mut transaction);
        transaction.commit()?;
        res
    }
    fn write_transaction<T, F: FnOnce(&mut rusqlite::Transaction) -> Result<T, rusqlite::Error>>(
        &self,
        f: F,
    ) -> Result<T, rusqlite::Error> {
        let mut guard = self.db.lock().unwrap();
        let mut transaction =
            rusqlite::Transaction::new(&mut guard, rusqlite::TransactionBehavior::Immediate)?;
        let res = f(&mut transaction);
        transaction.commit()?;
        res
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

async fn get_user(
    State(state): State<ArcState>,
    Path(user_id): Path<UserId>,
) -> Result<Json<User>, StatusCode> {
    dbg!(user_id);
    let data = state.read_transaction(|db| {
        // Steps:
        //  1. Check if adventurer exists. If not, 404.
        //  2. SELECT list of quests associated with the adventurer.
        //  3. Transform that list to a pair of lists, selected and completed,
        //     based on whether close_date is null.

        let mut query = db.prepare_cached("SELECT name FROM Adventurer WHERE id = :id;")?;
        let name: Option<String> = query
            .query_row(
                named_params! {
                    ":id": user_id,
                },
                |row| row.get(0),
            )
            .optional()?;
        if let Some(name) = name {
            let mut query =
                db.prepare_cached("SELECT quest_id FROM PartyMember WHERE adventurer_id = :id;")?;
            let rows = query.query_map(
                named_params! {
                    ":id": user_id,
                },
                |row| row.get::<_, QuestId>(0),
            )?;
            // let selected_quests = vec![];
            // let completed_quests = vec![];
            for row in rows {
                dbg!(row);
            }
            Ok(Some(User {
                name,
                selected_quests: vec![],
                completed_quests: vec![],
            }))
        } else {
            Ok(None)
        }
    });

    match data {
        Ok(Some(x)) => Ok(Json(x)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("rusqlite error: {e:?}");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_guild_quests(State(_state): State<ArcState>, Path(guild_id): Path<GuildId>) {
    dbg!(guild_id);
}
async fn get_guild_name(State(_state): State<ArcState>, Path(guild_id): Path<GuildId>) {
    dbg!(guild_id);
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
    quest: Json<AcceptQuest>,
) -> Result<Json<QuestId>, (StatusCode, String)> {
    let data = state.write_transaction(|db| {
        // Steps:
        //  1. Ensure user exists
        //  2. Ensure quest exists
        //  3. Create slightly-altered copy of quest and associated data
        //  4. Return ID of new quest

        if !db::adventurer_exists(&db, user_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("adventurer with id = {} doesn't exist", user_id.0),
            )));
        }

        if !db::quest_exists(&db, quest.quest_id)? {
            return Ok(Err((
                StatusCode::NOT_FOUND,
                format!("quest with id = {} doesn't exist", quest.quest_id.0),
            )));
        }

        let new_id = db::accept_quest(&db, user_id, quest.quest_id)?;
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

/// Get the list of people who are allowed to be guild leaders.
async fn get_allowed_guild_leaders() {}
