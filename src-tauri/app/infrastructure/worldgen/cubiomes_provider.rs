use std::collections::{HashMap, VecDeque};
use std::ffi::CStr;
use std::ptr::NonNull;
use std::sync::{Arc, Mutex};

use rayon::prelude::*;

use crate::domain::errors::WorldgenError;

use super::ffi;
use ffi::{Generator, MCVersion, Range};

const MAX_CACHED_GENERATORS: usize = 8;

const MIN_HEIGHT_FOR_PARALLEL_BANDS: i32 = 32;

const MIN_BAND_ROWS: i32 = 8;

const MAX_PARALLEL_BANDS: i32 = 12;

type GeneratorKey = (i64, i32, i32);

#[derive(Default)]
struct GeneratorCacheState {
    map: HashMap<GeneratorKey, Arc<GeneratorHandle>>,
    order: VecDeque<GeneratorKey>,
}

type TileKey = (i64, i32, i32, i32, i32, i32, i32, i32, i32);

const MAX_TILE_CACHE_BYTES: usize = 64 * 1024 * 1024;

#[derive(Default)]
struct TileCacheState {
    map: HashMap<TileKey, Vec<u8>>,
    order: VecDeque<TileKey>,
    total_bytes: usize,
}

pub struct WorldgenService {
    generator_cache: Mutex<GeneratorCacheState>,
    tile_cache: Mutex<TileCacheState>,
}

impl Default for WorldgenService {
    fn default() -> Self {
        Self::new()
    }
}

impl WorldgenService {
    pub fn new() -> Self {
        Self {
            generator_cache: Mutex::new(GeneratorCacheState::default()),
            tile_cache: Mutex::new(TileCacheState::default()),
        }
    }

    fn get_cached_tile(&self, key: &TileKey) -> Option<Vec<u8>> {
        let state = self
            .tile_cache
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        state.map.get(key).cloned()
    }

    fn cache_tile(&self, key: TileKey, data: Vec<u8>) {
        let mut state = self
            .tile_cache
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if state.map.contains_key(&key) {
            return;
        }
        let data_len = data.len();
        while state.total_bytes + data_len > MAX_TILE_CACHE_BYTES {
            let Some(oldest) = state.order.pop_front() else {
                break;
            };
            if let Some(removed) = state.map.remove(&oldest) {
                state.total_bytes -= removed.len();
            }
        }
        state.total_bytes += data_len;
        state.order.push_back(key);
        state.map.insert(key, data);
    }

    fn get_or_create_generator(
        &self,
        mc: i32,
        dim: i32,
        seed: i64,
    ) -> Result<Arc<GeneratorHandle>, WorldgenError> {
        let key: GeneratorKey = (seed, mc, dim);
        let state = self
            .generator_cache
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if let Some(handle) = state.map.get(&key) {
            return Ok(Arc::clone(handle));
        }
        drop(state);
        let handle = Arc::new(GeneratorHandle::new(mc, dim, seed)?);
        let mut state = self
            .generator_cache
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if let Some(existing) = state.map.get(&key) {
            return Ok(Arc::clone(existing));
        }
        if state.order.len() >= MAX_CACHED_GENERATORS {
            if let Some(oldest) = state.order.pop_front() {
                state.map.remove(&oldest);
            }
        }
        state.order.push_back(key);
        state.map.insert(key, Arc::clone(&handle));
        Ok(handle)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn sample_biome_grid(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        layer: &str,
        origin_x: i32,
        origin_z: i32,
        cell_size_blocks: i32,
        grid_width: i32,
        grid_height: i32,
    ) -> Result<Vec<u8>, WorldgenError> {
        if grid_width <= 0 || grid_height <= 0 {
            return Err(WorldgenError::InvalidInput(
                "grid dimensions must be positive".to_string(),
            ));
        }
        if cell_size_blocks <= 0 {
            return Err(WorldgenError::InvalidInput(
                "cell size must be positive".to_string(),
            ));
        }
        let total = i64::from(grid_width) * i64::from(grid_height);
        if total > 512 * 512 {
            return Err(WorldgenError::InvalidInput(
                "requested biome grid is too large".to_string(),
            ));
        }

        let mc = parse_mc_version(mc_version)?;
        let dim = parse_dimension(dimension)?;
        let (layer_y, layer_sy) = parse_layer(layer)?;

        let cache_key: TileKey = (
            seed,
            mc as i32,
            dim,
            origin_x,
            origin_z,
            cell_size_blocks,
            grid_width,
            grid_height,
            layer_y,
        );
        if let Some(cached) = self.get_cached_tile(&cache_key) {
            return Ok(cached);
        }

        let generator = self.get_or_create_generator(mc as i32, dim, seed)?;

        if layer == "surface" && dim == 0 {
            let output = self.sample_overworld_surface_grid(
                &generator,
                seed,
                origin_x,
                origin_z,
                cell_size_blocks,
                grid_width,
                grid_height,
            )?;
            self.cache_tile(cache_key, output.clone());
            return Ok(output);
        }

        let scale = match cell_size_blocks {
            1 | 4 | 16 | 64 | 256 => cell_size_blocks,
            _ => {
                let mut output = vec![0u8; total as usize];
                for z in 0..grid_height {
                    for x in 0..grid_width {
                        let world_x = origin_x + x * cell_size_blocks;
                        let world_z = origin_z + z * cell_size_blocks;
                        let biome = unsafe {
                            ffi::getBiomeAt(
                                generator.as_ptr(),
                                4,
                                world_x.div_euclid(4),
                                layer_y,
                                world_z.div_euclid(4),
                            )
                        };
                        output[(z * grid_width + x) as usize] = biome.clamp(0, 255) as u8;
                    }
                }
                self.cache_tile(cache_key, output.clone());
                return Ok(output);
            }
        };

        let range = Range {
            scale,
            x: origin_x.div_euclid(scale),
            z: origin_z.div_euclid(scale),
            sx: grid_width,
            sz: grid_height,
            y: layer_y,
            sy: layer_sy,
        };

        let mut output = vec![0u8; total as usize];
        sample_range_into(&generator, range, grid_width, &mut output)?;
        self.cache_tile(cache_key, output.clone());
        Ok(output)
    }

    pub fn spawn_point(&self, seed: i64, mc_version: &str) -> Result<(i32, i32), WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let generator = self.get_or_create_generator(mc as i32, 0, seed)?;
        let pos = unsafe { ffi::getSpawn(generator.as_ptr()) };
        Ok((pos.x, pos.z))
    }

    pub fn list_strongholds_in_area(
        &self,
        seed: i64,
        mc_version: &str,
        min_x: i32,
        min_z: i32,
        max_x: i32,
        max_z: i32,
    ) -> Result<Vec<(i32, i32)>, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let generator = self.get_or_create_generator(mc as i32, 0, seed)?;

        let max_radius_blocks = [min_x, max_x, min_z, max_z]
            .iter()
            .map(|v| i64::from(*v).unsigned_abs())
            .max()
            .unwrap_or(0) as f64
            * std::f64::consts::SQRT_2;

        let mut sh = ffi::StrongholdIter {
            pos: ffi::Pos { x: 0, z: 0 },
            nextapprox: ffi::Pos { x: 0, z: 0 },
            index: 0,
            ringnum: 0,
            ringmax: 0,
            ringidx: 0,
            angle: 0.0,
            dist: 0.0,
            rnds: 0,
            mc: 0,
        };
        unsafe { ffi::initFirstStronghold(&mut sh, mc as i32, seed as u64) };

        let mut result = Vec::new();
        let mut iterations = 0;
        loop {
            let remaining = unsafe { ffi::nextStronghold(&mut sh, generator.as_ptr()) };
            iterations += 1;
            if sh.pos.x >= min_x && sh.pos.x <= max_x && sh.pos.z >= min_z && sh.pos.z <= max_z {
                result.push((sh.pos.x, sh.pos.z));
            }
            let next_dist_blocks = sh.dist * 16.0;
            if remaining <= 0 || iterations >= 128 || next_dist_blocks > max_radius_blocks {
                break;
            }
        }
        Ok(result)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn structure_variant(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        structure_type: &str,
        x: i32,
        z: i32,
    ) -> Result<ffi::StructureVariant, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let dim = parse_dimension(dimension)?;
        let struct_type = WorldgenService::parse_structure_type(structure_type)?;
        let generator = self.get_or_create_generator(mc as i32, dim, seed)?;
        const VILLAGE: i32 = 5;
        let biome_id = if struct_type == VILLAGE && mc as i32 >= MCVersion::Mc1182 as i32 {
            self.village_viable_biome(generator.as_ptr(), mc as i32, seed as u64, x, z)
        } else {
            unsafe { ffi::getBiomeAt(generator.as_ptr(), 4, x.div_euclid(4), 0, z.div_euclid(4)) }
        };
        let mut sv = ffi::StructureVariant::default();
        unsafe {
            ffi::getVariant(&mut sv, struct_type, mc as i32, seed as u64, x, z, biome_id);
        }
        Ok(sv)
    }

    fn village_viable_biome(
        &self,
        generator: *const ffi::Generator,
        mc: i32,
        seed: u64,
        x: i32,
        z: i32,
    ) -> i32 {
        const PLAINS: i32 = 1;
        const DESERT: i32 = 2;
        const TAIGA: i32 = 5;
        const SNOWY_TUNDRA: i32 = 12;
        const SAVANNA: i32 = 35;
        const MEADOW: i32 = 177;
        const VILLAGE: i32 = 5;
        let chunk_x = x >> 4;
        let chunk_z = z >> 4;
        for candidate in [PLAINS, DESERT, SAVANNA, TAIGA, SNOWY_TUNDRA] {
            let mut sv = ffi::StructureVariant::default();
            unsafe {
                ffi::getVariant(&mut sv, VILLAGE, mc, seed, x, z, candidate);
            }
            let sample_x = ((chunk_x * 32 + 2 * sv.x as i32 + sv.sx as i32 - 1) / 2) >> 2;
            let sample_z = ((chunk_z * 32 + 2 * sv.z as i32 + sv.sz as i32 - 1) / 2) >> 2;
            let sample_y = 319 >> 2;
            let id = unsafe { ffi::getBiomeAt(generator, 0, sample_x, sample_y, sample_z) };
            if id == candidate || (id == MEADOW && candidate == PLAINS) {
                return candidate;
            }
        }
        PLAINS
    }

    pub fn biome_name(&self, mc_version: &str, biome_id: i32) -> Result<String, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let name_ptr = unsafe { ffi::biome2str(mc as i32, biome_id) };
        if name_ptr.is_null() {
            return Ok(String::new());
        }
        Ok(unsafe { CStr::from_ptr(name_ptr) }
            .to_string_lossy()
            .into_owned())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn list_structures(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        structure_type: &str,
        min_reg_x: i32,
        min_reg_z: i32,
        max_reg_x: i32,
        max_reg_z: i32,
    ) -> Result<Vec<(i32, i32)>, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let dim = parse_dimension(dimension)?;
        let struct_type = WorldgenService::parse_structure_type(structure_type)?;
        let generator = self.get_or_create_generator(mc as i32, dim, seed)?;

        let mut result = Vec::new();
        for reg_z in min_reg_z..max_reg_z {
            for reg_x in min_reg_x..max_reg_x {
                let mut pos = ffi::Pos { x: 0, z: 0 };
                let found = unsafe {
                    ffi::getStructurePos(
                        struct_type,
                        mc as i32,
                        seed as u64,
                        reg_x,
                        reg_z,
                        &mut pos,
                    )
                };
                if found == 0 {
                    continue;
                }
                let viable = unsafe {
                    ffi::isViableStructurePos(struct_type, generator.as_ptr(), pos.x, pos.z, 0)
                };
                if viable != 0 {
                    result.push((pos.x, pos.z));
                }
            }
        }
        Ok(result)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn list_structures_in_area(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        structure_type: &str,
        min_x: i32,
        min_z: i32,
        max_x: i32,
        max_z: i32,
    ) -> Result<Vec<(i32, i32)>, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let struct_type = WorldgenService::parse_structure_type(structure_type)?;

        let mut sconf = ffi::StructureConfig {
            salt: 0,
            region_size: 0,
            chunk_range: 0,
            struct_type: 0,
            dim: 0,
            rarity: 0.0,
        };
        let ok = unsafe { ffi::getStructureConfig(struct_type, mc as i32, &mut sconf) };
        if ok == 0 {
            return Err(WorldgenError::InvalidInput(format!(
                "structure type '{structure_type}' not supported in this MC version"
            )));
        }
        let region_blocks = i64::from(sconf.region_size) * 16;
        if region_blocks <= 0 {
            return Err(WorldgenError::InvalidInput(
                "invalid region size for structure type".to_string(),
            ));
        }

        let min_reg_x = (i64::from(min_x)).div_euclid(region_blocks) as i32;
        let max_reg_x = (i64::from(max_x)).div_euclid(region_blocks) as i32 + 1;
        let min_reg_z = (i64::from(min_z)).div_euclid(region_blocks) as i32;
        let max_reg_z = (i64::from(max_z)).div_euclid(region_blocks) as i32 + 1;

        const MAX_STRUCTURE_REGION_RANGE: i32 = 64;
        if max_reg_x - min_reg_x > MAX_STRUCTURE_REGION_RANGE
            || max_reg_z - min_reg_z > MAX_STRUCTURE_REGION_RANGE
        {
            return Err(WorldgenError::InvalidInput(
                "requested area is too large for this structure type".to_string(),
            ));
        }

        self.list_structures(
            seed,
            mc_version,
            dimension,
            structure_type,
            min_reg_x,
            min_reg_z,
            max_reg_x,
            max_reg_z,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn sample_height_grid(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        origin_x: i32,
        origin_z: i32,
        cell_size_blocks: i32,
        grid_width: i32,
        grid_height: i32,
    ) -> Result<Vec<i32>, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let dim = parse_dimension(dimension)?;
        if dim != 0 {
            return Err(WorldgenError::InvalidInput(
                "height grid only available for the Overworld".to_string(),
            ));
        }
        let generator = self.get_or_create_generator(mc as i32, dim, seed)?;
        let surface_noise = SurfaceNoiseHandle::new(0, seed)?;
        let total = (grid_width as usize) * (grid_height as usize);
        let mut heights = vec![0i32; total];

        if cell_size_blocks == 4 {
            let mut buf = vec![0f32; total];
            let ok = unsafe {
                ffi::mapApproxHeight(
                    buf.as_mut_ptr(),
                    std::ptr::null_mut(),
                    generator.as_ptr(),
                    surface_noise.as_ptr(),
                    origin_x.div_euclid(4),
                    origin_z.div_euclid(4),
                    grid_width,
                    grid_height,
                )
            };
            if ok != 0 {
                return Err(WorldgenError::InvalidInput(
                    "mapApproxHeight failed".to_string(),
                ));
            }
            for i in 0..total {
                heights[i] = buf[i] as i32;
            }
            return Ok(heights);
        }

        for z in 0..grid_height {
            for x in 0..grid_width {
                let world_x = origin_x + x * cell_size_blocks;
                let world_z = origin_z + z * cell_size_blocks;
                let mut h = 0f32;
                let ok = unsafe {
                    ffi::mapApproxHeight(
                        &mut h,
                        std::ptr::null_mut(),
                        generator.as_ptr(),
                        surface_noise.as_ptr(),
                        world_x.div_euclid(4),
                        world_z.div_euclid(4),
                        1,
                        1,
                    )
                };
                if ok != 0 {
                    return Err(WorldgenError::InvalidInput(
                        "mapApproxHeight failed".to_string(),
                    ));
                }
                heights[(z * grid_width + x) as usize] = h as i32;
            }
        }
        Ok(heights)
    }

    pub fn column_info(
        &self,
        seed: i64,
        mc_version: &str,
        dimension: &str,
        layer: &str,
        x: i32,
        z: i32,
    ) -> Result<(u8, i32), WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let dim = parse_dimension(dimension)?;

        if layer == "surface" && dim == 0 {
            let generator = self.get_or_create_generator(mc as i32, dim, seed)?;
            let surface_noise = SurfaceNoiseHandle::new(0, seed)?;
            let mut height = 0f32;
            let ok = unsafe {
                ffi::mapApproxHeight(
                    &mut height,
                    std::ptr::null_mut(),
                    generator.as_ptr(),
                    surface_noise.as_ptr(),
                    x.div_euclid(4),
                    z.div_euclid(4),
                    1,
                    1,
                )
            };
            if ok != 0 {
                return Err(WorldgenError::InvalidInput(
                    "mapApproxHeight failed (non-Overworld generator?)".to_string(),
                ));
            }
            let y = height as i32;
            let biome = unsafe {
                ffi::getBiomeAt(
                    generator.as_ptr(),
                    4,
                    x.div_euclid(4),
                    y.div_euclid(4),
                    z.div_euclid(4),
                )
            };
            return Ok((biome.clamp(0, 255) as u8, y));
        }

        let (layer_y, _) = parse_layer(layer)?;
        let generator = self.get_or_create_generator(mc as i32, dim, seed)?;
        let biome = unsafe {
            ffi::getBiomeAt(
                generator.as_ptr(),
                4,
                x.div_euclid(4),
                layer_y,
                z.div_euclid(4),
            )
        };
        Ok((biome.clamp(0, 255) as u8, layer_y * 4))
    }

    #[allow(clippy::too_many_arguments)]
    fn sample_overworld_surface_grid(
        &self,
        generator: &GeneratorHandle,
        seed: i64,
        origin_x: i32,
        origin_z: i32,
        cell_size_blocks: i32,
        grid_width: i32,
        grid_height: i32,
    ) -> Result<Vec<u8>, WorldgenError> {
        let total = (grid_width as usize) * (grid_height as usize);
        let mut output = vec![0u8; total];
        // mapApproxHeight dereferences `surface_noise` unconditionally for MC
        // versions between beta and 1.18 (see generator.c) — a null pointer
        // there is a guaranteed access violation. >=1.18 and beta generators
        // ignore this parameter, but we always pass a real one to be safe.
        let surface_noise = SurfaceNoiseHandle::new(0, seed)?;

        if cell_size_blocks == 4 {
            let x0 = origin_x.div_euclid(4);
            let z0 = origin_z.div_euclid(4);
            let mut heights = vec![0f32; total];
            let ok = unsafe {
                ffi::mapApproxHeight(
                    heights.as_mut_ptr(),
                    std::ptr::null_mut(),
                    generator.as_ptr(),
                    surface_noise.as_ptr(),
                    x0,
                    z0,
                    grid_width,
                    grid_height,
                )
            };
            if ok != 0 {
                return Err(WorldgenError::InvalidInput(
                    "mapApproxHeight failed (non-Overworld generator?)".to_string(),
                ));
            }
            for z in 0..grid_height {
                for x in 0..grid_width {
                    let idx = (z * grid_width + x) as usize;
                    let y4 = (heights[idx] as i32).div_euclid(4);
                    let biome =
                        unsafe { ffi::getBiomeAt(generator.as_ptr(), 4, x0 + x, y4, z0 + z) };
                    output[idx] = biome.clamp(0, 255) as u8;
                }
            }
            return Ok(output);
        }

        for z in 0..grid_height {
            for x in 0..grid_width {
                let world_x = origin_x + x * cell_size_blocks;
                let world_z = origin_z + z * cell_size_blocks;
                let bx4 = world_x.div_euclid(4);
                let bz4 = world_z.div_euclid(4);
                let mut height = 0f32;
                let ok = unsafe {
                    ffi::mapApproxHeight(
                        &mut height,
                        std::ptr::null_mut(),
                        generator.as_ptr(),
                        surface_noise.as_ptr(),
                        bx4,
                        bz4,
                        1,
                        1,
                    )
                };
                if ok != 0 {
                    return Err(WorldgenError::InvalidInput(
                        "mapApproxHeight failed (non-Overworld generator?)".to_string(),
                    ));
                }
                let y4 = (height as i32).div_euclid(4);
                let biome = unsafe { ffi::getBiomeAt(generator.as_ptr(), 4, bx4, y4, bz4) };
                output[(z * grid_width + x) as usize] = biome.clamp(0, 255) as u8;
            }
        }
        Ok(output)
    }

    pub fn is_slime_chunk(&self, seed: i64, chunk_x: i32, chunk_z: i32) -> bool {
        unsafe { ffi::rust_is_slime_chunk(seed as u64, chunk_x, chunk_z) != 0 }
    }

    pub fn parse_structure_type(name: &str) -> Result<i32, WorldgenError> {
        match name {
            "village" => Ok(5),
            "desert_pyramid" => Ok(1),
            "jungle_temple" => Ok(2),
            "swamp_hut" => Ok(3),
            "igloo" => Ok(4),
            "ocean_ruin" => Ok(6),
            "shipwreck" => Ok(7),
            "monument" => Ok(8),
            "mansion" => Ok(9),
            "outpost" => Ok(10),
            "ruined_portal" => Ok(11),
            "ruined_portal_n" => Ok(12),
            "ancient_city" => Ok(13),
            "treasure" => Ok(14),
            "mineshaft" => Ok(15),
            "desert_well" => Ok(16),
            "geode" => Ok(17),
            "fortress" => Ok(18),
            "bastion" => Ok(19),
            "nether_fossil" => Ok(20),
            "end_city" => Ok(21),
            "end_gateway" => Ok(22),
            "end_island" => Ok(23),
            "trail_ruins" => Ok(24),
            "trial_chambers" => Ok(25),
            "stronghold" => Ok(26),
            other => Err(WorldgenError::InvalidInput(format!(
                "unknown structure type: {other}"
            ))),
        }
    }

    pub fn is_version_supported(&self, mc_version: &str) -> bool {
        parse_mc_version(mc_version).is_ok()
    }

    #[allow(clippy::type_complexity)]
    pub fn biome_palette(
        &self,
        mc_version: &str,
    ) -> Result<Vec<(u8, String, [u8; 3], String)>, WorldgenError> {
        let mc = parse_mc_version(mc_version)?;
        let mut colors = [[[0u8; 3]; 256]; 1];
        unsafe { ffi::initBiomeColors(&mut colors[0]) };
        let mut palette = Vec::new();
        for id in 0..256i32 {
            let name_ptr = unsafe { ffi::biome2str(mc as i32, id) };
            if name_ptr.is_null() {
                continue;
            }
            let name = unsafe { CStr::from_ptr(name_ptr) }
                .to_string_lossy()
                .into_owned();
            if name.is_empty() {
                continue;
            }
            let color = colors[0][id as usize];
            let dimension = dimension_name(unsafe { ffi::getDimension(id) });
            palette.push((id as u8, name, color, dimension));
        }
        Ok(palette)
    }
}

fn dimension_name(dim: i32) -> String {
    match dim {
        0 => "overworld",
        -1 => "nether",
        1 => "end",
        _ => "unknown",
    }
    .to_string()
}

struct GeneratorHandle(NonNull<Generator>);

unsafe impl Send for GeneratorHandle {}
unsafe impl Sync for GeneratorHandle {}

impl GeneratorHandle {
    fn new(mc: i32, dim: i32, seed: i64) -> Result<Self, WorldgenError> {
        let ptr = unsafe { ffi::rust_alloc_generator() };
        let ptr = NonNull::new(ptr)
            .ok_or_else(|| WorldgenError::Ffi("failed to allocate generator".to_string()))?;
        unsafe {
            ffi::setupGenerator(ptr.as_ptr(), mc, 0);
            ffi::applySeed(ptr.as_ptr(), dim, seed as u64);
        }
        Ok(Self(ptr))
    }

    fn as_ptr(&self) -> *const Generator {
        self.0.as_ptr()
    }
}

struct SurfaceNoiseHandle(NonNull<std::ffi::c_void>);

unsafe impl Send for SurfaceNoiseHandle {}
unsafe impl Sync for SurfaceNoiseHandle {}

impl SurfaceNoiseHandle {
    fn new(dim: i32, seed: i64) -> Result<Self, WorldgenError> {
        let ptr = unsafe { ffi::rust_alloc_surface_noise() };
        let ptr = NonNull::new(ptr)
            .ok_or_else(|| WorldgenError::Ffi("failed to allocate surface noise".to_string()))?;
        unsafe { ffi::rust_init_surface_noise(ptr.as_ptr(), dim, seed as u64) };
        Ok(Self(ptr))
    }

    fn as_ptr(&self) -> *const std::ffi::c_void {
        self.0.as_ptr()
    }
}

impl Drop for SurfaceNoiseHandle {
    fn drop(&mut self) {
        unsafe { ffi::rust_free_surface_noise(self.0.as_ptr()) };
    }
}

impl Drop for GeneratorHandle {
    fn drop(&mut self) {
        unsafe { ffi::rust_free_generator(self.0.as_ptr()) };
    }
}

struct BiomeCache(*mut i32);

impl Drop for BiomeCache {
    fn drop(&mut self) {
        if !self.0.is_null() {
            unsafe { ffi::rust_free_int_buffer(self.0) };
        }
    }
}

fn sample_range_into(
    generator: &GeneratorHandle,
    range: Range,
    grid_width: i32,
    output: &mut [u8],
) -> Result<(), WorldgenError> {
    let band_count = if range.sz >= MIN_HEIGHT_FOR_PARALLEL_BANDS {
        MAX_PARALLEL_BANDS.min(range.sz / MIN_BAND_ROWS).max(1)
    } else {
        1
    };

    if band_count <= 1 {
        return sample_band_into(generator, range, output);
    }

    let band_rows = (range.sz / band_count).max(1);
    let row_len = grid_width as usize;

    output
        .par_chunks_mut(band_rows as usize * row_len)
        .enumerate()
        .try_for_each(|(band_idx, chunk)| -> Result<(), WorldgenError> {
            let band_height = (chunk.len() / row_len) as i32;
            let band_range = Range {
                scale: range.scale,
                x: range.x,
                z: range.z + band_idx as i32 * band_rows,
                sx: range.sx,
                sz: band_height,
                y: range.y,
                sy: range.sy,
            };
            sample_band_into(generator, band_range, chunk)
        })
}

fn sample_band_into(
    generator: &GeneratorHandle,
    range: Range,
    output: &mut [u8],
) -> Result<(), WorldgenError> {
    let cache_ptr = unsafe { ffi::allocCache(generator.as_ptr(), range) };
    if cache_ptr.is_null() {
        return Err(WorldgenError::Ffi(
            "failed to allocate biome cache".to_string(),
        ));
    }
    let cache = BiomeCache(cache_ptr);

    let ret = unsafe { ffi::genBiomes(generator.as_ptr(), cache.0, range) };
    if ret != 0 {
        return Err(WorldgenError::Ffi("genBiomes failed".to_string()));
    }

    for (idx, slot) in output.iter_mut().enumerate() {
        let biome = unsafe { *cache.0.add(idx) };
        *slot = biome.clamp(0, 255) as u8;
    }
    Ok(())
}

fn parse_dimension(dimension: &str) -> Result<i32, WorldgenError> {
    match dimension {
        "overworld" => Ok(0),
        "nether" => Ok(-1),
        "end" => Ok(1),
        other => Err(WorldgenError::InvalidDimension(other.to_string())),
    }
}

fn parse_layer(layer: &str) -> Result<(i32, i32), WorldgenError> {
    match layer {
        "surface" => Ok((0, 0)),
        "underground" => Ok(((-11i32).div_euclid(4), 1)),
        "bottom" => Ok(((-51i32).div_euclid(4), 1)),
        other => Err(WorldgenError::InvalidInput(format!(
            "invalid seed map layer: {other}"
        ))),
    }
}

fn is_plausible_future_version(normalized: &str) -> bool {
    let mut parts = normalized.split('.');
    let major = parts.next().unwrap_or("");
    let minor = parts.next().unwrap_or("");
    !major.is_empty()
        && !minor.is_empty()
        && major.chars().all(|c| c.is_ascii_digit())
        && minor.chars().all(|c| c.is_ascii_digit())
}

fn parse_mc_version(mc_version: &str) -> Result<MCVersion, WorldgenError> {
    let normalized = mc_version.trim();
    if normalized.starts_with("1.21.11") {
        return Ok(MCVersion::Mc12111);
    }
    if normalized.starts_with("1.21.9") {
        return Ok(MCVersion::Mc1219);
    }
    if normalized.starts_with("1.21.6") {
        return Ok(MCVersion::Mc1216);
    }
    if normalized.starts_with("1.21.5") {
        return Ok(MCVersion::Mc1215);
    }
    if normalized.starts_with("1.21.4") || normalized.starts_with("1.21 WD") {
        return Ok(MCVersion::Mc121Wd);
    }
    if normalized.starts_with("1.21.3") {
        return Ok(MCVersion::Mc1213);
    }
    if normalized.starts_with("1.21.1") {
        return Ok(MCVersion::Mc1211);
    }
    if normalized == "1.21" {
        return Ok(MCVersion::Mc12111);
    }
    if normalized.starts_with("1.20.6")
        || normalized.starts_with("1.20.")
        || normalized.starts_with("1.20")
    {
        return Ok(MCVersion::Mc1206);
    }
    if normalized.starts_with("1.19.2") {
        return Ok(MCVersion::Mc1192);
    }
    if normalized.starts_with("1.19.4")
        || normalized.starts_with("1.19.")
        || normalized.starts_with("1.19")
    {
        return Ok(MCVersion::Mc1194);
    }
    if normalized.starts_with("1.18.2") || normalized.starts_with("1.18") {
        return Ok(MCVersion::Mc1182);
    }
    if normalized.starts_with("1.17.1") || normalized.starts_with("1.17") {
        return Ok(MCVersion::Mc1171);
    }
    if normalized.starts_with("1.16.1") {
        return Ok(MCVersion::Mc1161);
    }
    if normalized.starts_with("1.16.5") || normalized.starts_with("1.16") {
        return Ok(MCVersion::Mc1165);
    }
    if normalized.starts_with("1.15.2") || normalized.starts_with("1.15") {
        return Ok(MCVersion::Mc1152);
    }
    if normalized.starts_with("1.14.4") || normalized.starts_with("1.14") {
        return Ok(MCVersion::Mc1144);
    }
    if normalized.starts_with("1.13.2") || normalized.starts_with("1.13") {
        return Ok(MCVersion::Mc1132);
    }
    if normalized.starts_with("1.12.2") || normalized.starts_with("1.12") {
        return Ok(MCVersion::Mc1122);
    }
    if normalized.starts_with("1.11.2") || normalized.starts_with("1.11") {
        return Ok(MCVersion::Mc1112);
    }
    if normalized.starts_with("1.10.2") || normalized.starts_with("1.10") {
        return Ok(MCVersion::Mc1102);
    }
    if normalized.starts_with("1.9.4") || normalized.starts_with("1.9") {
        return Ok(MCVersion::Mc194);
    }
    if normalized.starts_with("1.8.9") || normalized.starts_with("1.8") {
        return Ok(MCVersion::Mc189);
    }
    if normalized.starts_with("1.7.10") || normalized.starts_with("1.7") {
        return Ok(MCVersion::Mc1710);
    }
    if normalized.starts_with("1.6.4") || normalized.starts_with("1.6") {
        return Ok(MCVersion::Mc164);
    }
    if normalized.starts_with("1.5.2") || normalized.starts_with("1.5") {
        return Ok(MCVersion::Mc152);
    }
    if normalized.starts_with("1.4.7") || normalized.starts_with("1.4") {
        return Ok(MCVersion::Mc147);
    }
    if normalized.starts_with("1.3.2") || normalized.starts_with("1.3") {
        return Ok(MCVersion::Mc132);
    }
    if normalized.starts_with("1.2.5") || normalized.starts_with("1.2") {
        return Ok(MCVersion::Mc125);
    }
    if normalized.starts_with("1.1") {
        return Ok(MCVersion::Mc110);
    }
    if normalized.starts_with("1.0") {
        return Ok(MCVersion::Mc100);
    }
    if normalized.starts_with("b1.8") {
        return Ok(MCVersion::McB18);
    }
    if normalized.starts_with("b1.7") {
        return Ok(MCVersion::McB17);
    }
    if normalized.starts_with("26.2") {
        return Ok(MCVersion::Mc262);
    }
    if normalized.starts_with("26.1") {
        return Ok(MCVersion::Mc261);
    }
    if is_plausible_future_version(normalized) {
        return Ok(MCVersion::Mc262);
    }
    Err(WorldgenError::UnsupportedVersion(mc_version.to_string()))
}

#[cfg(test)]
#[path = "tests/cubiomes_provider_benchmark_tests.rs"]
mod benchmark_tests;
#[cfg(test)]
#[path = "tests/cubiomes_provider_correctness_tests.rs"]
mod correctness_tests;
