use std::io::Read;
use std::path::Path;

use serde::Deserialize;

pub fn world_seed(world_dir: &Path) -> Option<i64> {
    read_seed_from_level_dat(world_dir).or_else(|| read_seed_from_world_gen_settings(world_dir))
}

fn read_seed_from_level_dat(world_dir: &Path) -> Option<i64> {
    let data = std::fs::read(world_dir.join("level.dat")).ok()?;
    let raw = decompress_nbt(&data)?;
    let level: LevelDat = fastnbt::from_bytes(&raw).ok()?;
    level
        .data
        .world_gen_settings
        .and_then(|wgs| wgs.seed)
        .or(level.data.random_seed)
}

fn read_seed_from_world_gen_settings(world_dir: &Path) -> Option<i64> {
    let path = world_dir.join("data/minecraft/world_gen_settings.dat");
    let data = std::fs::read(path).ok()?;
    let raw = decompress_nbt(&data)?;
    let file: WorldGenSettingsFile = fastnbt::from_bytes(&raw).ok()?;
    file.data.seed
}

fn decompress_nbt(data: &[u8]) -> Option<Vec<u8>> {
    if data.starts_with(&[0x1F, 0x8B]) {
        let mut decoder = flate2::read::GzDecoder::new(data);
        let mut buf = Vec::new();
        decoder.read_to_end(&mut buf).ok()?;
        Some(buf)
    } else {
        Some(data.to_vec())
    }
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

#[derive(Debug, Deserialize)]
struct WorldGenSettingsFile {
    data: WorldGenSettingsData,
}

#[derive(Debug, Deserialize)]
struct WorldGenSettingsData {
    seed: Option<i64>,
}

#[cfg(test)]
#[path = "tests/world_seed_tests.rs"]
mod tests;
