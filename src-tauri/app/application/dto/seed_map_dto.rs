use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateBiomeTileInput {
    pub seed: String,
    pub mc_version: String,
    pub dimension: String,
    pub layer: String,
    pub origin_x: i32,
    pub origin_z: i32,
    pub cell_size_blocks: i32,
    pub grid_width: i32,
    pub grid_height: i32,
    #[serde(default)]
    pub include_heights: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BiomeTileDTO {
    pub origin_x: i32,
    pub origin_z: i32,
    pub cell_size_blocks: i32,
    pub grid_width: i32,
    pub grid_height: i32,
    pub biome_ids: Vec<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heights: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BiomePaletteEntryDTO {
    pub id: u8,
    pub name: String,
    pub label: String,
    pub color_hex: String,
    pub dimension: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpawnPointInput {
    pub seed: String,
    pub mc_version: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpawnPointDTO {
    pub x: i32,
    pub z: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlimeChunksInput {
    pub seed: String,
    pub min_chunk_x: i32,
    pub min_chunk_z: i32,
    pub max_chunk_x: i32,
    pub max_chunk_z: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SlimeChunkDTO {
    pub chunk_x: i32,
    pub chunk_z: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListStructuresInput {
    pub seed: String,
    pub mc_version: String,
    pub dimension: String,
    pub structure_type: String,
    pub min_x: i32,
    pub min_z: i32,
    pub max_x: i32,
    pub max_z: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StructurePositionDTO {
    pub x: i32,
    pub z: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfoInput {
    pub seed: String,
    pub mc_version: String,
    pub dimension: String,
    pub layer: String,
    pub x: i32,
    pub z: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfoDTO {
    pub biome_id: u8,
    pub y: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructureVariantInput {
    pub seed: String,
    pub mc_version: String,
    pub dimension: String,
    pub structure_type: String,
    pub x: i32,
    pub z: i32,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StructureVariantDTO {
    pub abandoned: Option<bool>,
    pub bastion_type: Option<String>,
    pub village_biome: Option<String>,
    pub ruined_portal_giant: Option<bool>,
    pub ruined_portal_underground: Option<bool>,
    pub ruined_portal_air_pocket: Option<bool>,
    pub ruined_portal_biome: Option<String>,
    pub igloo_has_basement: Option<bool>,
    pub shipwreck_beached: Option<bool>,
    pub geode_cracked: Option<bool>,
    pub geode_size: Option<i32>,
}

#[cfg(test)]
#[path = "tests/seed_map_dto_tests.rs"]
mod tests;
