use super::*;

#[test]
#[ignore]
fn benchmark_generator_cache_speedup() {
    use std::time::Instant;

    let seed = 12345i64;
    let mc_version = "1.21";
    let dimension = "overworld";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 128;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();

    const ITERS: usize = 20;

    let start = Instant::now();
    for _ in 0..ITERS {
        let _handle = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
    }
    let init_only_total = start.elapsed();

    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
    let start = Instant::now();
    for i in 0..ITERS {
        let range = super::Range {
            scale: cell_size_blocks,
            x: (i as i32 * grid_width).div_euclid(cell_size_blocks),
            z: 0,
            sx: grid_width,
            sz: grid_height,
            y: 0,
            sy: 0,
        };
        let cache_ptr = unsafe { super::ffi::allocCache(generator.as_ptr(), range) };
        assert!(!cache_ptr.is_null());
        let ret = unsafe { super::ffi::genBiomes(generator.as_ptr(), cache_ptr, range) };
        assert_eq!(ret, 0);
        unsafe { super::ffi::rust_free_int_buffer(cache_ptr) };
    }
    let genbiomes_only_total = start.elapsed();
    drop(generator);

    println!(
        "setupGenerator+applySeed only:     {:?} total / {:?} avg over {} iters",
        init_only_total,
        init_only_total / ITERS as u32,
        ITERS
    );
    println!(
        "genBiomes only (cached generator): {:?} total / {:?} avg over {} iters",
        genbiomes_only_total,
        genbiomes_only_total / ITERS as u32,
        ITERS
    );

    let start = Instant::now();
    for i in 0..ITERS {
        let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
        let range = super::Range {
            scale: cell_size_blocks,
            x: (i as i32 * grid_width).div_euclid(cell_size_blocks),
            z: 0,
            sx: grid_width,
            sz: grid_height,
            y: 0,
            sy: 0,
        };
        let cache_ptr = unsafe { super::ffi::allocCache(generator.as_ptr(), range) };
        assert!(!cache_ptr.is_null());
        let ret = unsafe { super::ffi::genBiomes(generator.as_ptr(), cache_ptr, range) };
        assert_eq!(ret, 0);
        unsafe { super::ffi::rust_free_int_buffer(cache_ptr) };
    }
    let uncached_total = start.elapsed();

    let service = WorldgenService::new();
    let start = Instant::now();
    for i in 0..ITERS {
        service
            .sample_biome_grid(
                seed,
                mc_version,
                dimension,
                "surface",
                i as i32 * grid_width * cell_size_blocks,
                0,
                cell_size_blocks,
                grid_width,
                grid_height,
            )
            .unwrap();
    }
    let cached_total = start.elapsed();

    println!(
        "uncached (new generator per tile): {:?} total / {:?} avg over {} tiles",
        uncached_total,
        uncached_total / ITERS as u32,
        ITERS
    );
    println!(
        "cached (shared generator):         {:?} total / {:?} avg over {} tiles",
        cached_total,
        cached_total / ITERS as u32,
        ITERS
    );
}

#[test]
#[ignore]
fn benchmark_intra_tile_parallelism() {
    use std::time::Instant;

    let seed = 12345i64;
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
        x: 0,
        z: 0,
        sx: grid_width,
        sz: grid_height,
        y: 0,
        sy: 0,
    };

    const ITERS: usize = 20;
    let mut output = vec![0u8; (grid_width * grid_height) as usize];

    let start = Instant::now();
    for _ in 0..ITERS {
        super::sample_band_into(&generator, range, &mut output).unwrap();
    }
    let sequential_total = start.elapsed();

    let start = Instant::now();
    for _ in 0..ITERS {
        super::sample_range_into(&generator, range, grid_width, &mut output).unwrap();
    }
    let parallel_total = start.elapsed();

    println!("rayon threads available: {}", rayon::current_num_threads());
    println!(
        "sequential (1 genBiomes call/tile): {:?} total / {:?} avg over {} tiles",
        sequential_total,
        sequential_total / ITERS as u32,
        ITERS
    );
    println!(
        "parallel ({} bands via rayon):       {:?} total / {:?} avg over {} tiles",
        super::MAX_PARALLEL_BANDS,
        parallel_total,
        parallel_total / ITERS as u32,
        ITERS
    );
}

#[test]
#[ignore]
fn benchmark_dimension_comparison() {
    use std::time::Instant;

    let seed = 12345i64;
    let mc_version = "1.21";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 128;
    const ITERS: usize = 20;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let mut output = vec![0u8; (grid_width * grid_height) as usize];

    for dimension in ["overworld", "nether", "end"] {
        let dim = super::parse_dimension(dimension).unwrap();
        let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
        let range = super::Range {
            scale: cell_size_blocks,
            x: 0,
            z: 0,
            sx: grid_width,
            sz: grid_height,
            y: 0,
            sy: 0,
        };

        let start = Instant::now();
        for _ in 0..ITERS {
            super::sample_range_into(&generator, range, grid_width, &mut output).unwrap();
        }
        let elapsed = start.elapsed();
        println!(
            "{dimension:9} ({} bands): {:?} total / {:?} avg over {} tiles",
            super::MAX_PARALLEL_BANDS,
            elapsed,
            elapsed / ITERS as u32,
            ITERS
        );
    }
}

#[test]
#[ignore]
fn benchmark_overworld_band_count_sweep() {
    use rayon::prelude::*;
    use std::time::Instant;

    let seed = 12345i64;
    let mc_version = "1.21";
    let dimension = "overworld";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 128;
    const ITERS: usize = 20;

    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
    let range = super::Range {
        scale: cell_size_blocks,
        x: 0,
        z: 0,
        sx: grid_width,
        sz: grid_height,
        y: 0,
        sy: 0,
    };
    let row_len = grid_width as usize;
    let mut output = vec![0u8; (grid_width * grid_height) as usize];

    println!("rayon threads available: {}", rayon::current_num_threads());
    for band_count in [1, 4, 8, 12, 16] {
        let band_rows = (range.sz / band_count).max(1);
        let start = Instant::now();
        for _ in 0..ITERS {
            output
                .par_chunks_mut(band_rows as usize * row_len)
                .enumerate()
                .try_for_each(|(band_idx, chunk)| -> Result<(), super::WorldgenError> {
                    let band_height = (chunk.len() / row_len) as i32;
                    let band_range = super::Range {
                        scale: range.scale,
                        x: range.x,
                        z: range.z + band_idx as i32 * band_rows,
                        sx: range.sx,
                        sz: band_height,
                        y: range.y,
                        sy: range.sy,
                    };
                    super::sample_band_into(&generator, band_range, chunk)
                })
                .unwrap();
        }
        let elapsed = start.elapsed();
        println!(
            "{band_count:2} bands: {:?} total / {:?} avg over {} tiles",
            elapsed,
            elapsed / ITERS as u32,
            ITERS
        );
    }
}

#[test]
#[ignore]
fn benchmark_band_count_and_reuse_check() {
    use rayon::prelude::*;
    use std::time::Instant;

    let seed = 12345i64;
    let mc_version = "1.21";
    let cell_size_blocks = 4;
    let grid_width = 128;
    let grid_height = 128;
    const ITERS: usize = 20;
    let row_len = grid_width as usize;

    let mc = super::parse_mc_version(mc_version).unwrap();

    println!("--- 1) 8 vs 12 parallel bands, per dimension ---");
    for dimension in ["overworld", "nether", "end"] {
        let dim = super::parse_dimension(dimension).unwrap();
        let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
        let range = super::Range {
            scale: cell_size_blocks,
            x: 0,
            z: 0,
            sx: grid_width,
            sz: grid_height,
            y: 0,
            sy: 0,
        };
        let mut output = vec![0u8; (grid_width * grid_height) as usize];

        for band_count in [8, 12] {
            let band_rows = (range.sz / band_count).max(1);
            let start = Instant::now();
            for _ in 0..ITERS {
                output
                    .par_chunks_mut(band_rows as usize * row_len)
                    .enumerate()
                    .try_for_each(|(band_idx, chunk)| -> Result<(), super::WorldgenError> {
                        let band_height = (chunk.len() / row_len) as i32;
                        let band_range = super::Range {
                            scale: range.scale,
                            x: range.x,
                            z: range.z + band_idx as i32 * band_rows,
                            sx: range.sx,
                            sz: band_height,
                            y: range.y,
                            sy: range.sy,
                        };
                        super::sample_band_into(&generator, band_range, chunk)
                    })
                    .unwrap();
            }
            let elapsed = start.elapsed();
            println!(
                "{dimension:9} {band_count:2} bands: {:?} avg/tile",
                elapsed / ITERS as u32
            );
        }
    }

    println!(
        "\n--- 2) noise-reuse check (Overworld, single-threaded, no concurrency contention) ---"
    );
    let dim = super::parse_dimension("overworld").unwrap();
    let generator = super::GeneratorHandle::new(mc as i32, dim, seed).unwrap();
    let range = super::Range {
        scale: cell_size_blocks,
        x: 0,
        z: 0,
        sx: grid_width,
        sz: grid_height,
        y: 0,
        sy: 0,
    };
    let mut output = vec![0u8; (grid_width * grid_height) as usize];

    let start = Instant::now();
    for _ in 0..ITERS {
        super::sample_band_into(&generator, range, &mut output).unwrap();
    }
    let whole_tile_total = start.elapsed();

    let band_count = 12i32;
    let band_rows = (range.sz / band_count).max(1);
    let start = Instant::now();
    for _ in 0..ITERS {
        let mut z = 0;
        while z < range.sz {
            let h = band_rows.min(range.sz - z);
            let band_range = super::Range {
                scale: range.scale,
                x: range.x,
                z: range.z + z,
                sx: range.sx,
                sz: h,
                y: range.y,
                sy: range.sy,
            };
            let offset = (z * grid_width) as usize;
            let len = (h * grid_width) as usize;
            super::sample_band_into(&generator, band_range, &mut output[offset..offset + len])
                .unwrap();
            z += h;
        }
    }
    let banded_sequential_total = start.elapsed();

    println!(
        "whole tile, 1 call:            {:?} avg/tile",
        whole_tile_total / ITERS as u32
    );
    println!(
        "same tile, 12 bands, 1 thread: {:?} avg/tile",
        banded_sequential_total / ITERS as u32
    );
    let overhead_pct =
        (banded_sequential_total.as_secs_f64() / whole_tile_total.as_secs_f64() - 1.0) * 100.0;
    println!("banding overhead: {overhead_pct:.1}%");
}

#[test]
#[ignore]
fn benchmark_tile_result_cache() {
    use std::time::Instant;

    let service = WorldgenService::new();
    let seed = 12345i64;
    let mc_version = "1.21";
    let args = (seed, mc_version, "overworld", "surface", 0, 0, 4, 128, 128);

    let start = Instant::now();
    service
        .sample_biome_grid(
            args.0, args.1, args.2, args.3, args.4, args.5, args.6, args.7, args.8,
        )
        .unwrap();
    let cold = start.elapsed();

    service
        .sample_biome_grid(seed, mc_version, "nether", "surface", 0, 0, 4, 128, 128)
        .unwrap();

    let start = Instant::now();
    service
        .sample_biome_grid(
            args.0, args.1, args.2, args.3, args.4, args.5, args.6, args.7, args.8,
        )
        .unwrap();
    let warm = start.elapsed();

    println!("Overworld cold (first visit):          {cold:?}");
    println!("Overworld warm (after Nether, revisit): {warm:?}");
    println!(
        "speedup: {:.0}x",
        cold.as_secs_f64() / warm.as_secs_f64().max(1e-9)
    );
}

#[test]
#[ignore]
fn benchmark_concurrent_tile_contention() {
    use std::sync::atomic::{AtomicI32, Ordering};
    use std::sync::Arc;
    use std::thread;
    use std::time::Instant;

    let seed = 12345i64;
    let mc_version = "1.21";
    let dimension = "overworld";
    let mc = super::parse_mc_version(mc_version).unwrap();
    let dim = super::parse_dimension(dimension).unwrap();

    println!("rayon threads available: {}", rayon::current_num_threads());

    println!(
        "\n--- WITH intra-tile banding (current: up to {} rayon bands/tile) ---",
        super::MAX_PARALLEL_BANDS
    );
    {
        let service = Arc::new(WorldgenService::new());
        let tile_counter = Arc::new(AtomicI32::new(0));
        for n in [1, 4, 8, 12, 16, 24] {
            let start = Instant::now();
            let handles: Vec<_> = (0..n)
                .map(|_| {
                    let service = Arc::clone(&service);
                    let tile_counter = Arc::clone(&tile_counter);
                    thread::spawn(move || {
                        let idx = tile_counter.fetch_add(1, Ordering::SeqCst);
                        service
                            .sample_biome_grid(
                                seed,
                                mc_version,
                                dimension,
                                "surface",
                                idx * 128 * 4,
                                0,
                                4,
                                128,
                                128,
                            )
                            .unwrap();
                    })
                })
                .collect();
            for h in handles {
                h.join().unwrap();
            }
            let elapsed = start.elapsed();
            println!(
                "N={n:2} concurrent tiles: {:?} wall / {:?} avg-per-tile",
                elapsed,
                elapsed / n as u32
            );
        }
    }

    println!(
        "\n--- WITHOUT intra-tile banding (1 genBiomes call/tile, OS-thread concurrency only) ---"
    );
    {
        let generator = Arc::new(super::GeneratorHandle::new(mc as i32, dim, seed).unwrap());
        let tile_counter = Arc::new(AtomicI32::new(100_000));
        for n in [1, 4, 8, 12, 16, 24] {
            let start = Instant::now();
            let handles: Vec<_> = (0..n)
                .map(|_| {
                    let generator = Arc::clone(&generator);
                    let tile_counter = Arc::clone(&tile_counter);
                    thread::spawn(move || {
                        let idx = tile_counter.fetch_add(1, Ordering::SeqCst);
                        let range = super::Range {
                            scale: 4,
                            x: idx * 128,
                            z: 0,
                            sx: 128,
                            sz: 128,
                            y: 0,
                            sy: 0,
                        };
                        let mut output = vec![0u8; 128 * 128];
                        super::sample_band_into(&generator, range, &mut output).unwrap();
                    })
                })
                .collect();
            for h in handles {
                h.join().unwrap();
            }
            let elapsed = start.elapsed();
            println!(
                "N={n:2} concurrent tiles: {:?} wall / {:?} avg-per-tile",
                elapsed,
                elapsed / n as u32
            );
        }
    }
}
