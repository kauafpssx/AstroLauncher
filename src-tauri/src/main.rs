// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// This bin target only calls into app_lib — it doesn't use most of the
// workspace's dependencies directly, so the unused_crate_dependencies lint
// (enabled crate-wide in lib.rs) would otherwise false-positive here.
#![allow(unused_crate_dependencies)]

fn main() {
    app_lib::run();
}
