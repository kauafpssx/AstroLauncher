use std::os::raw::{c_char, c_int, c_uint, c_ulonglong};

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MCVersion {
    McUndef = 0,
    McB17 = 1,
    McB18 = 2,
    Mc100 = 3,
    Mc110 = 4,
    Mc125 = 5,
    Mc132 = 6,
    Mc147 = 7,
    Mc152 = 8,
    Mc164 = 9,
    Mc1710 = 10,
    Mc189 = 11,
    Mc194 = 12,
    Mc1102 = 13,
    Mc1112 = 14,
    Mc1122 = 15,
    Mc1132 = 16,
    Mc1144 = 17,
    Mc1152 = 18,
    Mc1161 = 19,
    Mc1165 = 20,
    Mc1171 = 21,
    Mc1182 = 22,
    Mc1192 = 23,
    Mc1194 = 24,
    Mc1206 = 25,
    Mc1211 = 26,
    Mc1213 = 27,
    Mc121Wd = 28,
    Mc1215 = 29,
    Mc1216 = 30,
    Mc1219 = 31,
    Mc12111 = 32,
    Mc261 = 33,
    Mc262 = 34,
}

#[repr(C)]
pub struct Generator {
    _private: [u8; 0],
}

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Pos {
    pub x: c_int,
    pub z: c_int,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Range {
    pub scale: c_int,
    pub x: c_int,
    pub z: c_int,
    pub sx: c_int,
    pub sz: c_int,
    pub y: c_int,
    pub sy: c_int,
}

#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct StrongholdIter {
    pub pos: Pos,
    pub nextapprox: Pos,
    pub index: c_int,
    pub ringnum: c_int,
    pub ringmax: c_int,
    pub ringidx: c_int,
    pub angle: f64,
    pub dist: f64,
    pub rnds: c_ulonglong,
    pub mc: c_int,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default)]
pub struct StructureVariant {
    pub abandoned: u8,
    pub giant: u8,
    pub underground: u8,
    pub airpocket: u8,
    pub basement: u8,
    pub cracked: u8,
    pub size: u8,
    pub start: u8,
    pub biome: i16,
    pub rotation: u8,
    pub mirror: u8,
    pub x: i16,
    pub y: i16,
    pub z: i16,
    pub sx: i16,
    pub sy: i16,
    pub sz: i16,
}

#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct StructureConfig {
    pub salt: i32,
    pub region_size: i8,
    pub chunk_range: i8,
    pub struct_type: u8,
    pub dim: i8,
    pub rarity: f32,
}

unsafe extern "C" {
    pub fn rust_alloc_generator() -> *mut Generator;
    pub fn rust_free_generator(generator: *mut Generator);
    pub fn rust_alloc_surface_noise() -> *mut std::ffi::c_void;
    pub fn rust_free_surface_noise(surface_noise: *mut std::ffi::c_void);
    pub fn rust_init_surface_noise(
        surface_noise: *mut std::ffi::c_void,
        dim: c_int,
        seed: c_ulonglong,
    );
    pub fn setupGenerator(generator: *mut Generator, mc: c_int, flags: c_uint);
    pub fn applySeed(generator: *mut Generator, dim: c_int, seed: c_ulonglong);
    pub fn getBiomeAt(
        generator: *const Generator,
        scale: c_int,
        x: c_int,
        y: c_int,
        z: c_int,
    ) -> c_int;
    pub fn initFirstStronghold(sh: *mut StrongholdIter, mc: c_int, s48: c_ulonglong) -> Pos;
    pub fn nextStronghold(sh: *mut StrongholdIter, generator: *const Generator) -> c_int;
    pub fn mapApproxHeight(
        y: *mut f32,
        ids: *mut c_int,
        generator: *const Generator,
        surface_noise: *const std::ffi::c_void,
        x: c_int,
        z: c_int,
        w: c_int,
        h: c_int,
    ) -> c_int;
    pub fn getMinCacheSize(
        generator: *const Generator,
        scale: c_int,
        sx: c_int,
        sy: c_int,
        sz: c_int,
    ) -> usize;
    pub fn allocCache(generator: *const Generator, r: Range) -> *mut c_int;
    pub fn genBiomes(generator: *const Generator, cache: *mut c_int, r: Range) -> c_int;
    pub fn rust_free_int_buffer(ptr: *mut c_int);
    pub fn getSpawn(generator: *const Generator) -> Pos;
    pub fn rust_is_slime_chunk(seed: c_ulonglong, chunk_x: c_int, chunk_z: c_int) -> c_int;
    pub fn getVariant(
        sv: *mut StructureVariant,
        struct_type: c_int,
        mc: c_int,
        seed: c_ulonglong,
        block_x: c_int,
        block_z: c_int,
        biome_id: c_int,
    ) -> c_int;
    pub fn getStructurePos(
        structure_type: c_int,
        mc: c_int,
        seed: c_ulonglong,
        reg_x: c_int,
        reg_z: c_int,
        pos: *mut Pos,
    ) -> c_int;
    pub fn isViableStructurePos(
        struct_type: c_int,
        generator: *const Generator,
        block_x: c_int,
        block_z: c_int,
        flags: c_uint,
    ) -> c_int;
    pub fn getStructureConfig(
        structure_type: c_int,
        mc: c_int,
        sconf: *mut StructureConfig,
    ) -> c_int;
    pub fn initBiomeColors(biome_colors: *mut [[u8; 3]; 256]);
    pub fn biome2str(mc: c_int, id: c_int) -> *const c_char;
    pub fn getDimension(id: c_int) -> c_int;
}
