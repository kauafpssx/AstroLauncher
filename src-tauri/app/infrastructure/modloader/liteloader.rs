use serde_json::Value;

use super::profile::{LoaderProfile, ProfileLibrary};

const LAUNCHWRAPPER: &str = "net.minecraft:launchwrapper:1.12";

/// LiteLoader tops out at 1.12.2 and never adopted a stable versioned API —
/// its `versions.json` mixes `"artefacts"`/`"snapshots"` keys and either a
/// `"latest"` or a build-hash key per Minecraft version across the file, so
/// this walks the JSON by hand instead of a strict schema.
pub async fn fetch_profile(
    client: &reqwest::Client,
    game_version: &str,
) -> anyhow::Result<LoaderProfile> {
    let root: Value = client
        .get(
            crate::infrastructure::config::api()
                .liteloader_versions
                .as_str(),
        )
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let version_entry = root
        .get("versions")
        .and_then(|v| v.get(game_version))
        .ok_or_else(|| {
            anyhow::anyhow!("LiteLoader não tem build disponível para Minecraft {game_version}")
        })?;

    let bucket = version_entry
        .get("artefacts")
        .or_else(|| version_entry.get("snapshots"))
        .ok_or_else(|| {
            anyhow::anyhow!("Build do LiteLoader para {game_version} não trouxe artefatos")
        })?;

    let builds = bucket
        .get("com.mumfrey:liteloader")
        .and_then(Value::as_object)
        .ok_or_else(|| {
            anyhow::anyhow!(
                "Build do LiteLoader para {game_version} sem entrada com.mumfrey:liteloader"
            )
        })?;

    let build = builds
        .get("latest")
        .or_else(|| builds.values().next())
        .ok_or_else(|| {
            anyhow::anyhow!("Nenhum build do LiteLoader disponível para {game_version}")
        })?;

    let tweak_class = build
        .get("tweakClass")
        .and_then(Value::as_str)
        .unwrap_or("com.mumfrey.liteloader.launch.LiteLoaderTweaker")
        .to_string();
    let version = build
        .get("version")
        .and_then(Value::as_str)
        .unwrap_or(game_version);

    let repo_url = version_entry
        .get("repo")
        .and_then(|r| r.get("url"))
        .and_then(Value::as_str)
        .unwrap_or(
            crate::infrastructure::config::api()
                .liteloader_repo
                .as_str(),
        );

    let mut libraries = vec![ProfileLibrary {
        name: format!("com.mumfrey:liteloader:{version}"),
        url: repo_url.to_string(),
    }];

    if let Some(entries) = bucket.get("libraries").and_then(Value::as_array) {
        for entry in entries {
            let Some(name) = entry.get("name").and_then(Value::as_str) else {
                continue;
            };
            let url = entry
                .get("url")
                .and_then(Value::as_str)
                .unwrap_or(crate::infrastructure::config::api().maven_central.as_str());
            libraries.push(ProfileLibrary {
                name: name.to_string(),
                url: url.to_string(),
            });
        }
    }
    libraries.push(ProfileLibrary {
        name: LAUNCHWRAPPER.to_string(),
        url: crate::infrastructure::config::api()
            .maven_central
            .to_string(),
    });

    Ok(LoaderProfile {
        main_class: "net.minecraft.launchwrapper.Launch".to_string(),
        libraries,
        extra_game_args: vec!["--tweakClass".to_string(), tweak_class],
    })
}
