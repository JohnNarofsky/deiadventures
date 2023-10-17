use crate::{GuildId, QuestId, UserId};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use std::convert::Infallible;

// TODO: We could plausibly split a lot of the error types out of this,
//  to make the return type of each endpoint more specific.

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
    AdventurerNotFoundByEmail {
        email: String,
    },
    GuildNotFound {
        id: Option<GuildId>,
    },
    QuestNotFound {
        id: Option<QuestId>,
    },
    NotQuestMember {
        user_id: UserId,
        quest_id: QuestId,
    },
    QuestNotBelongToGuild {
        quest_id: QuestId,
        guild_id: GuildId,
    },
    AccountAlreadyExists,
    CannotComputePasswordHash,
    UnauthorizedLogin,
    SessionNotFound,
    // TODO: decide how to model this
    InsufficientPermissions {
        msg: String,
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
            }
            Self::AdventurerNotFound { id } => {
                if let Some(id) = id {
                    (
                        StatusCode::NOT_FOUND,
                        format!("no adventurer with id = {id} exists"),
                    )
                        .into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified adventurer not found").into_response()
                }
            }
            Self::AdventurerNotFoundByEmail { email } => (
                StatusCode::NOT_FOUND,
                format!("no adventurer with email = {email} exists"),
            )
                .into_response(),
            Self::GuildNotFound { id } => {
                if let Some(id) = id {
                    (
                        StatusCode::NOT_FOUND,
                        format!("no guild with id = {id} exists"),
                    )
                        .into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified guild not found").into_response()
                }
            }
            Self::QuestNotFound { id } => {
                if let Some(id) = id {
                    (
                        StatusCode::NOT_FOUND,
                        format!("no quest with id = {id} exists"),
                    )
                        .into_response()
                } else {
                    (StatusCode::NOT_FOUND, "specified quest not found").into_response()
                }
            }
            Self::NotQuestMember { user_id, quest_id } => (
                StatusCode::BAD_REQUEST,
                format!("adventurer {user_id} is not a member of party for quest {quest_id}"),
            )
                .into_response(),
            Self::QuestNotBelongToGuild { quest_id, guild_id } => (
                StatusCode::BAD_REQUEST,
                format!("quest {quest_id} does not belong to guild {guild_id}"),
            )
                .into_response(),
            Self::AccountAlreadyExists => {
                (StatusCode::BAD_REQUEST, "account already exists").into_response()
            }
            Self::CannotComputePasswordHash => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to compute password hash",
            )
                .into_response(),
            Self::UnauthorizedLogin => (StatusCode::UNAUTHORIZED, "failed login").into_response(),
            Self::SessionNotFound => {
                (StatusCode::UNAUTHORIZED, "session not found").into_response()
            }
            Self::InsufficientPermissions { msg } => {
                (StatusCode::UNAUTHORIZED, msg).into_response()
            }
            Self::Other(e) => e.into_response(),
        }
    }
}
