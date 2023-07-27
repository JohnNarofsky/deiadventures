use std::net::SocketAddr;
use std::path::Path;
use std::sync::{Arc, Mutex};
use axum::extract::State;
use axum::{Json, Router};
use axum::routing::get;
use serde::Serialize;


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
        return
    }

    let state = Arc::new(AppState::new(&env::db()));

    let app = Router::new()
        .route("/user", get(get_user))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], env::port()));
    tracing::debug!("listening on {addr}");
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

struct AppState {
    db: Mutex<rusqlite::Connection>,
}
impl AppState {
    fn new(db_path: &Path) -> Self {
        let db = rusqlite::Connection::open(db_path).unwrap();
        let db = Mutex::new(db);
        Self { db }
    }
}

type ArcState = Arc<AppState>;

#[derive(Serialize)]
struct User {

}

async fn get_user(State(_state): State<ArcState>) -> Result<Json<User>, ()> {
    Err(())
}
