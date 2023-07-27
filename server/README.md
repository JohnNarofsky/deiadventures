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
