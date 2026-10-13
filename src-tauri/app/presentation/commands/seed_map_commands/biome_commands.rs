use tauri::{async_runtime, State};

use crate::application::dto::{
    BiomePaletteEntryDTO, BiomeTileDTO, ColumnInfoDTO, ColumnInfoInput, GenerateBiomeTileInput,
};
use crate::domain::errors::WorldgenError;
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn generate_biome_tile(
    state: State<'_, AppState>,
    input: GenerateBiomeTileInput,
) -> Result<BiomeTileDTO, String> {
    let worldgen = state.generate_biome_tile.worldgen().clone();
    let result = async_runtime::spawn_blocking(move || {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;
        let total = i64::from(input.grid_width) * i64::from(input.grid_height);
        if total > 512 * 512 {
            return Err(WorldgenError::InvalidInput(
                "grid too large: max 512x512 cells".to_string(),
            ));
        }
        let biome_ids = worldgen.sample_biome_grid(
            seed,
            &input.mc_version,
            &input.dimension,
            &input.layer,
            input.origin_x,
            input.origin_z,
            input.cell_size_blocks,
            input.grid_width,
            input.grid_height,
        )?;
        let heights = if input.include_heights && input.dimension == "overworld" {
            Some(worldgen.sample_height_grid(
                seed,
                &input.mc_version,
                &input.dimension,
                input.origin_x,
                input.origin_z,
                input.cell_size_blocks,
                input.grid_width,
                input.grid_height,
            )?)
        } else {
            None
        };
        Ok(BiomeTileDTO {
            origin_x: input.origin_x,
            origin_z: input.origin_z,
            cell_size_blocks: input.cell_size_blocks,
            grid_width: input.grid_width,
            grid_height: input.grid_height,
            biome_ids,
            heights,
        })
    })
    .await
    .map_err(|e| e.to_string())?;

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_biome_palette(
    state: State<AppState>,
    mc_version: String,
) -> Result<Vec<BiomePaletteEntryDTO>, String> {
    state
        .list_biome_palette
        .execute(&mc_version)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn filter_supported_seed_map_versions(
    state: State<AppState>,
    version_ids: Vec<String>,
) -> Vec<String> {
    state.filter_supported_versions.execute(&version_ids)
}

#[tauri::command]
pub fn get_column_info(
    state: State<AppState>,
    input: ColumnInfoInput,
) -> Result<ColumnInfoDTO, String> {
    state
        .get_column_info
        .execute(input)
        .map_err(|e| e.to_string())
}
