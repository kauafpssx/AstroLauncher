#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused_crate_dependencies)]

fn main() {
    if cfg!(target_os = "windows") {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--ignore-gpu-blocklist --disable-gpu-driver-bug-workarounds --use-angle=d3d11 --enable-gpu-rasterization --enable-zero-copy",
        );
    }

    app_lib::run();
}
