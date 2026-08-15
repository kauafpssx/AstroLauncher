use std::io::Read;
use std::path::Path;

use serde::Deserialize;

/// Extracts the world seed from a Minecraft world's `level.dat`.
///
/// The file is NBT compressed with gzip (older and current versions). The
/// seed lives in different places depending on the version:
/// - 1.16.2+ stores it as a `TAG_Long` under `Data.WorldGenSettings.seed`.
/// - older versions store `Data.RandomSeed`.
///
/// Best-effort: a missing/corrupt file must never fail the world listing, so
/// any error degrades to `None` (the UI shows "—" for unknown seeds).
pub fn world_seed(world_dir: &Path) -> Option<i64> {
    let data = std::fs::read(world_dir.join("level.dat")).ok()?;
    let raw = if data.starts_with(&[0x1F, 0x8B]) {
        let mut decoder = flate2::read::GzDecoder::new(&data[..]);
        let mut buf = Vec::new();
        decoder.read_to_end(&mut buf).ok()?;
        buf
    } else {
        data
    };

    let level: LevelDat = fastnbt::from_bytes(&raw).ok()?;
    level
        .data
        .world_gen_settings
        .and_then(|wgs| wgs.seed)
        .or(level.data.random_seed)
}

#[derive(Debug, Deserialize)]
struct LevelDat {
    #[serde(rename = "Data")]
    data: Data,
}

#[derive(Debug, Deserialize)]
struct Data {
    #[serde(rename = "WorldGenSettings")]
    world_gen_settings: Option<WorldGenSettings>,
    #[serde(rename = "RandomSeed")]
    random_seed: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct WorldGenSettings {
    seed: Option<i64>,
}

#[cfg(test)]
#[path = "tests/world_seed_tests.rs"]
mod tests;
