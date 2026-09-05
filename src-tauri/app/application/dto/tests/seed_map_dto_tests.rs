use super::*;

#[test]
#[ignore]
fn biome_tile_json_serialization_cost() {
    use std::time::Instant;

    let biome_ids: Vec<u8> = (0..16384u32).map(|i| (i % 50) as u8).collect();
    let dto = BiomeTileDTO {
        origin_x: 0,
        origin_z: 0,
        cell_size_blocks: 4,
        grid_width: 128,
        grid_height: 128,
        biome_ids,
        heights: None,
    };

    const ITERS: usize = 200;
    let mut last_len = 0usize;
    let start = Instant::now();
    for _ in 0..ITERS {
        let json = serde_json::to_string(&dto).unwrap();
        last_len = json.len();
    }
    let elapsed = start.elapsed();

    println!(
        "serde_json::to_string(BiomeTileDTO 128x128): {:?} avg/call over {} iters, json size = {} bytes",
        elapsed / ITERS as u32,
        ITERS,
        last_len
    );
}
