use tauri::{async_runtime, State};

use crate::application::dto::{
    ListStructuresInput, StructurePositionDTO, StructureVariantDTO, StructureVariantInput,
};
use crate::domain::errors::WorldgenError;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn get_structure_variant(
    state: State<AppState>,
    input: StructureVariantInput,
) -> Result<StructureVariantDTO, String> {
    state
        .get_structure_variant
        .execute(input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_structures(
    state: State<'_, AppState>,
    input: ListStructuresInput,
) -> Result<Vec<StructurePositionDTO>, String> {
    let worldgen = state.list_structures.worldgen().clone();
    async_runtime::spawn_blocking(move || {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;
        let result = worldgen.list_structures_in_area(
            seed,
            &input.mc_version,
            &input.dimension,
            &input.structure_type,
            input.min_x,
            input.min_z,
            input.max_x,
            input.max_z,
        )?;
        Ok::<_, WorldgenError>(
            result
                .into_iter()
                .map(|(x, z)| StructurePositionDTO { x, z })
                .collect(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_strongholds(
    state: State<'_, AppState>,
    input: ListStructuresInput,
) -> Result<Vec<StructurePositionDTO>, String> {
    let worldgen = state.list_strongholds.worldgen().clone();
    async_runtime::spawn_blocking(move || {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;
        let result = worldgen.list_strongholds_in_area(
            seed,
            &input.mc_version,
            input.min_x,
            input.min_z,
            input.max_x,
            input.max_z,
        )?;
        Ok::<_, WorldgenError>(
            result
                .into_iter()
                .map(|(x, z)| StructurePositionDTO { x, z })
                .collect(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}
