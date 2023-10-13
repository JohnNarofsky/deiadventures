use std::convert::Infallible;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use crate::{GuildId, QuestId, UserId};

// See the `IntoResponse` impl below.
/// Errors for which we have defined HTTP responses,
/// and so can bubble up to the top.
///
/// [`Error::Other`] is, essentially, for workarounds.
/// We require this error type when returning from a transaction,
/// so we should have *some* way of exiting a transaction
/// on the failure path with arbitrary data.
#[derive(Debug)]
pub(crate) enum Error<E = Infallible> {
    DbError(rusqlite::Error),
    AdventurerNotFound {
        id: Option<UserId>,
    },
    GuildNotFound {
        id: Option<GuildId>,
    },
    QuestNotFound {
        id: Option<QuestId>,
    },
    Other(E),
}

impl<E> From<rusqlite::Error> for Error<E> {
    fn from(value: rusqlite::Error) -> Self {
        Self::DbError(value)
    }
}

impl<E: IntoResponse> IntoResponse for Error<E> {
    fn into_response(self) -> Response {
        match self {
            Self::DbError(e) => {
                tracing::error!("rusqlite error: {e:?}");
                (StatusCode::INTERNAL_SERVER_ERROR, "database access failed").into_response()
            },
            Self::AdventurerNotFound { id } => {
                if let Some(id) = id {
                    (StatusCode::NOT_FOUND, format!("no adventurer with id = {id} exists")).into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified adventurer not found").into_response()
                }
            },
            Self::GuildNotFound { id } => {
                if let Some(id) = id {
                    (StatusCode::NOT_FOUND, format!("no guild with id = {id} exists")).into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified guild not found").into_response()
                }
            },
            Self::QuestNotFound { id } => {
                if let Some(id) = id {
                    (StatusCode::NOT_FOUND, format!("no quest with id = {id} exists")).into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified quest not found").into_response()
                }
            },
            Self::Other(e) => e.into_response(),
        }
    }
}