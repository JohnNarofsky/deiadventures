Note: This server provides the Web API which the frontend connects to,
but does not serve the frontend web pages itself. That's done from S3.

# Getting Started with Cargo
This subproject is made with Cargo, the official tool for building Rust applications.

## Cargo subcommands
In the subproject directory, you can run:

### `cargo run`
Runs the app with the debug profile.

You can pass `--release` to this command to build with optimizations.

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
