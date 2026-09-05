use super::*;

#[test]
fn tile_cache_hit_matches_fresh_computation_and_respects_key() {
    let service = WorldgenService::new();

    let first = service
        .sample_biome_grid(42, "1.21", "overworld", "surface", 0, 0, 4, 16, 16)
        .expect("first grid");
    let second = service
        .sample_biome_grid(42, "1.21", "overworld", "surface", 0, 0, 4, 16, 16)
        .expect("second grid");
    assert_eq!(
        first, second,
        "cached tile result diverges from a fresh one"
    );

    let nether = service
        .sample_biome_grid(42, "1.21", "nether", "surface", 0, 0, 4, 16, 16)
        .expect("nether grid");
    assert_ne!(
        first, nether,
        "tile cache key must include dimension, not just seed/coords"
    );

    let shifted = service
        .sample_biome_grid(42, "1.21", "overworld", "surface", 4096, 0, 4, 16, 16)
        .expect("shifted grid");
    assert_ne!(
        first, shifted,
        "tile cache key must include origin, not just seed/dimension"
    );
}

#[test]
fn samples_non_trivial_biome_grid() {
    let service = WorldgenService::new();
    let grid = service
        .sample_biome_grid(0, "1.21", "overworld", "surface", 0, 0, 16, 16, 16)
        .expect("grid");
    assert_eq!(grid.len(), 256);
    assert!(grid.iter().any(|&id| id != 0));
    assert!(grid.windows(2).any(|w| w[0] != w[1]));
}

#[test]
fn samples_legacy_biome_grid() {
    let service = WorldgenService::new();
    let grid = service
        .sample_biome_grid(0, "1.12.2", "overworld", "surface", 0, 0, 16, 8, 8)
        .expect("grid");
    assert_eq!(grid.len(), 64);
    assert!(grid.iter().any(|&id| id != 0));
}

#[test]
fn falls_back_to_newest_known_version_for_unrecognized_future_version() {
    let service = WorldgenService::new();
    let grid = service
        .sample_biome_grid(0, "26.2", "overworld", "surface", 0, 0, 16, 16, 16)
        .expect("should fallback to newest known version");
    assert_eq!(grid.len(), 256);
}

#[test]
fn get_biome_at_matches_single_cell_batch() {
    let seed = 12345;
    let mc_version = "1.21";
    let dimension = "overworld";
    let origin_x: i32 = 100;
    let origin_z: i32 = -50;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();

    let old_biome = unsafe {
        super::ffi::getBiomeAt(
            generator.as_ptr(),
            4,
            origin_x.div_euclid(4),
            0,
            origin_z.div_euclid(4),
        )
    };

    let range = super::Range {
        scale: 4,
        x: origin_x.div_euclid(4),
        z: origin_z.div_euclid(4),
        sx: 1,
        sz: 1,
        y: 0,
        sy: 1,
    };
    let cache_ptr = unsafe { super::ffi::allocCache(generator.as_ptr(), range) };
    assert!(!cache_ptr.is_null(), "allocCache failed");
    let ret = unsafe { super::ffi::genBiomes(generator.as_ptr(), cache_ptr, range) };
    assert_eq!(ret, 0, "genBiomes failed");
    let new_biome = unsafe { *cache_ptr };
    unsafe { super::ffi::rust_free_int_buffer(cache_ptr) };

    assert_eq!(old_biome, new_biome, "single cell batch mismatch");
}

#[test]
fn batch_generation_matches_individual_calls_for_real_cell_sizes() {
    let service = WorldgenService::new();
    let seed = 12345;
    let mc_version = "1.21";
    let dimension = "overworld";
    let origin_x = 100;
    let origin_z = -50;
    let grid_width = 8;
    let grid_height = 8;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();

    for &cell_size_blocks in &[64, 16, 4, 2] {
        let grid = service
            .sample_biome_grid(
                seed,
                mc_version,
                dimension,
                "surface",
                origin_x,
                origin_z,
                cell_size_blocks,
                grid_width,
                grid_height,
            )
            .expect("grid should generate");
        assert_eq!(
            grid.len(),
            (grid_width * grid_height) as usize,
            "len mismatch for cell_size_blocks={}",
            cell_size_blocks
        );
        assert!(
            grid.iter().all(|&id| id != 255),
            "invalid biome id for cell_size_blocks={}",
            cell_size_blocks
        );
    }

    let cell_size_blocks = 4;
    let new_grid = service
        .sample_biome_grid(
            seed,
            mc_version,
            dimension,
            "surface",
            origin_x,
            origin_z,
            cell_size_blocks,
            grid_width,
            grid_height,
        )
        .expect("new grid");

    let surface_noise = super::SurfaceNoiseHandle::new(0, seed).expect("surface noise");
    let mut old_grid = vec![0i32; (grid_width * grid_height) as usize];
    for z in 0..grid_height {
        for x in 0..grid_width {
            let world_x = origin_x + x * cell_size_blocks;
            let world_z = origin_z + z * cell_size_blocks;
            // The oracle samples at the approximated surface height, like
            // `sample_overworld_surface_grid` does — y=0 would compare
            // bedrock-level biomes against surface biomes.
            let mut height = 0f32;
            let ret = unsafe {
                super::ffi::mapApproxHeight(
                    &mut height,
                    std::ptr::null_mut(),
                    generator.as_ptr(),
                    surface_noise.as_ptr(),
                    world_x.div_euclid(4),
                    world_z.div_euclid(4),
                    1,
                    1,
                )
            };
            assert_eq!(ret, 0, "mapApproxHeight failed in oracle");
            let biome = unsafe {
                super::ffi::getBiomeAt(
                    generator.as_ptr(),
                    4,
                    world_x.div_euclid(4),
                    (height as i32).div_euclid(4),
                    world_z.div_euclid(4),
                )
            };
            old_grid[(z * grid_width + x) as usize] = biome;
        }
    }

    assert_eq!(new_grid.len(), old_grid.len());
    for (i, (&new_val, &old_val)) in new_grid.iter().zip(old_grid.iter()).enumerate() {
        assert_eq!(
            new_val,
            old_val.clamp(0, 255) as u8,
            "mismatch at index {} for cell_size_blocks={}",
            i,
            cell_size_blocks
        );
    }
}

#[test]
fn parallel_bands_match_sequential_reference() {
    let seed = 999i64;
    let mc_version = "1.21";
    let dimension = "overworld";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 128;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();

    let range = super::Range {
        scale: cell_size_blocks,
        x: 10,
        z: -7,
        sx: grid_width,
        sz: grid_height,
        y: 0,
        sy: 0,
    };

    let mut sequential = vec![0u8; (grid_width * grid_height) as usize];
    super::sample_band_into(&generator, range, &mut sequential).unwrap();

    let mut parallel = vec![0u8; (grid_width * grid_height) as usize];
    super::sample_range_into(&generator, range, grid_width, &mut parallel).unwrap();

    assert_eq!(
        sequential, parallel,
        "parallel band-split output diverges from the sequential reference"
    );
}

#[test]
fn adjacent_tiles_are_continuous_in_world_space() {
    let service = WorldgenService::new();
    let seed = 12345;
    let mc_version = "1.21";
    let dimension = "overworld";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 8;

    let tile_a = service
        .sample_biome_grid(
            seed,
            mc_version,
            dimension,
            "surface",
            0,
            0,
            cell_size_blocks,
            grid_width,
            grid_height,
        )
        .expect("tile A");

    let tile_b = service
        .sample_biome_grid(
            seed,
            mc_version,
            dimension,
            "surface",
            grid_width * cell_size_blocks,
            0,
            cell_size_blocks,
            grid_width,
            grid_height,
        )
        .expect("tile B");

    assert_eq!(tile_a.len(), tile_b.len());

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();

    let boundary_world_x = grid_width * cell_size_blocks;
    let boundary_biome_x = boundary_world_x.div_euclid(cell_size_blocks);

    let sample_a = unsafe {
        super::ffi::getBiomeAt(
            generator.as_ptr(),
            cell_size_blocks,
            boundary_biome_x - 1,
            0,
            0,
        )
    };
    let sample_b = unsafe {
        super::ffi::getBiomeAt(generator.as_ptr(), cell_size_blocks, boundary_biome_x, 0, 0)
    };

    let tile_a_last_col_idx = (grid_width - 1) as usize;
    let tile_b_first_col_idx = 0usize;

    assert_eq!(
        tile_a[tile_a_last_col_idx],
        sample_a.clamp(0, 255) as u8,
        "tile A edge does not match direct sample"
    );
    assert_eq!(
        tile_b[tile_b_first_col_idx],
        sample_b.clamp(0, 255) as u8,
        "tile B edge does not match direct sample"
    );
}
