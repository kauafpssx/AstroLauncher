use std::io::Write;

use flate2::write::GzEncoder;
use flate2::Compression;
use serde::Serialize;
use tempfile::tempdir;

use super::world_seed;

#[derive(Serialize)]
struct TestLevelDat<'a> {
    #[serde(rename = "Data")]
    data: &'a TestData,
}

#[derive(Serialize)]
struct TestData {
    #[serde(rename = "WorldGenSettings")]
    world_gen_settings: Option<TestWorldGen>,
    #[serde(rename = "RandomSeed")]
    random_seed: Option<i64>,
}

#[derive(Serialize)]
struct TestWorldGen {
    seed: i64,
}

fn write_level_dat(dir: &std::path::Path, data: &TestData) {
    let nbt = fastnbt::to_bytes_with_opts(&TestLevelDat { data }, fastnbt::SerOpts::new()).unwrap();
    let mut encoder = GzEncoder::new(Vec::new(), Compression::fast());
    encoder.write_all(&nbt).unwrap();
    let gzipped = encoder.finish().unwrap();
    std::fs::write(dir.join("level.dat"), gzipped).unwrap();
}

#[test]
fn extracts_seed_from_world_gen_settings() {
    let dir = tempdir().unwrap();
    write_level_dat(
        dir.path(),
        &TestData {
            world_gen_settings: Some(TestWorldGen {
                seed: 2235361989111784311,
            }),
            random_seed: None,
        },
    );
    assert_eq!(world_seed(dir.path()), Some(2235361989111784311));
}

#[test]
fn extracts_seed_from_legacy_random_seed() {
    let dir = tempdir().unwrap();
    write_level_dat(
        dir.path(),
        &TestData {
            world_gen_settings: None,
            random_seed: Some(42),
        },
    );
    assert_eq!(world_seed(dir.path()), Some(42));
}

#[test]
fn returns_none_for_missing_level_dat() {
    let dir = tempdir().unwrap();
    assert_eq!(world_seed(dir.path()), None);
}

#[test]
fn reads_uncompressed_level_dat() {
    let dir = tempdir().unwrap();
    let data = TestData {
        world_gen_settings: Some(TestWorldGen { seed: 7 }),
        random_seed: None,
    };
    let nbt = fastnbt::to_bytes_with_opts(&TestLevelDat { data: &data }, fastnbt::SerOpts::new())
        .unwrap();
    std::fs::write(dir.path().join("level.dat"), nbt).unwrap();
    assert_eq!(world_seed(dir.path()), Some(7));
}
