Note: This server provides the Web API which the frontend connects to,
but does not serve the frontend web pages itself. That's done from S3.

# Getting Started with Cargo
This subproject is made with Cargo, the official tool for building Rust applications.

## Cargo subcommands
In the subproject directory, you can run:

### `cargo run`
Runs the app with the debug profile.

You can pass `--release` to this command to build with optimizations.

You can pass arguments to the server executable after a `--`, like this:
```
cargo run -- arguments go here
```

You can omit the separating `--` if the first argument you're passing to the server
executable is not interpreted by Cargo, like in `cargo run insert-demo`, but
it is necessary in `cargo run -- --help` if you're meaning to get the server executable
to print its own help message.

### `cargo build`
Builds the app with the debug profile.

You can pass `--release` to this command to build with optimizations.

The binary is placed at `target/<profile>/server`.

### `cargo test`
We don't actually *have* any tests defined in this subproject yet,
but they'd be run with this.

## Deployment
To deploy this project, build it with `cargo build --release`
(or just `cargo build` if you're in a hurry and the service isn't public yet)
and copy the `server` binary over to your server machine,
then run it with the appropriate environment variables.

(I'll be adding a script for doing all those steps at once,
and making us run at server boot, but that's low priority right now.)

## Making an Axum web server
I don't have time to write a tutorial, but you can read this for an introduction to Axum:
<https://docs.rs/axum/latest/axum/index.html>.

# SQLite
We're starting out using SQLite for our database,
because it makes testing and deployment *so* easy.

If you have SQLite installed on your machine, you can use the `sqlite3` binary
to open a database file and run SQL and stuff on it.

If you don't, I do strongly recommend installing it if you're going to work on this
part of the codebase, but you don't have to: this subproject is configured
to build the SQLite library from source and so has no system dependency for it.

Note that, due to our use of `STRICT` tables,
we require version 3.37.0 or later, of SQLite.

SQLite can be downloaded here: <https://www.sqlite.org/download.html>

# Glossary
I wasn't sure where to put this, but we need a list of terms we're using to avoid getting too mixed up,
and this API is in the middle of two bodies of code which don't use the *exact* same phrasing, so... I put it here.

## Guilds
- "Guild": A "guild" is a loose category for quests, based on theme.
  Each guild has a "leader" who publishes quests for it.
## Roles
The term "role" is internal, in the sense that our use of it here
is not mentioned anywhere in the frontend.
- "Role": A tag which can be attached to an adventurer on a per-guild basis.
- "Guild Leader": A "role" which allows an adventurer to publish quests for a guild.
## Coalitions (UNIMPLEMENTED)
- "Coalition": A home for cross-guild quests. (TODO: expand description)
## Quests
- "Quest": The focus of this whole application. A thing which an individual (an "adventurer"),
  or group of individuals (a "party") can do to make something better for humans.
- "Template Quest": When a quest is accepted, we create a copy of it in the database
  to associate with the users who accepted it. This ensures we don't accidentally alter
  our record of what people actually did, if someone decides to edit an already published quest.
  The quest which is being copied is sometimes called a "template quest".
- "Task" / "Quest Task": A quest is structured like a to-do list.
  A "task" is an item on that list.
- "Quest Detail": ??????????????????
- "Action" / "Quest Action": We use this to mean a quest which has only one task.
- "Open Date" / "Accepted Date": The date on which a quest was accepted.
- "Close Date" / "Completed Date": The date on which a quest was completed.
- "Deleted Date" / "Cancelled Date": Instead of wiping out records of quests which have been
  unpublished from the database, we record the date they were unpublished.
## Adventurers
- "Adventurer" / "User": A user of this application.
- "Party Member": Every quest which has been accepted has a list of
  "party members" associated with it.
  These are the people working on completing the quest.
## Permissions
The term "permission" is internal, in the sense that our use of it here
is not mentioned anywhere in the frontend. This data, however, is directly
reported on the Administration page of the Web frontend.
There is a list of attributes associated with every user, which describes
things they are allowed to do.
- "Super User": A user who has this permission can do anything.
  This is another way of saying "administrator".
- "Eligible To Be Guild Leader": A user who has this permission can
  be assigned as a guild leader. (But they cannot do the assigning.)
- "Approved": A user who has this permission has been vetted to be
  a legitimate member, and can accept and complete quests.
- "Rejected": A user who has this permission has *failed* the vetting process,
  and cannot do anything.
