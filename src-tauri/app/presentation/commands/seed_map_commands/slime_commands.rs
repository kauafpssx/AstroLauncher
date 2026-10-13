use tauri::{async_runtime, State};

use crate::application::dto::{SlimeChunkDTO, SlimeChunksInput};
use crate::domain::errors::WorldgenError;
use crate::presentation::state::AppState;

const MAX_SLIME_CHUNK_RANGE: i32 = 256;

#[tauri::command]
pub async fn list_slime_chunks(
    state: State<'_, AppState>,
    input: SlimeChunksInput,
) -> Result<Vec<SlimeChunkDTO>, String> {
    let worldgen = state.list_slime_chunks.worldgen().clone();
    async_runtime::spawn_blocking(move || {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;
        let width = input.max_chunk_x - input.min_chunk_x;
        let height = input.max_chunk_z - input.min_chunk_z;
        if width > MAX_SLIME_CHUNK_RANGE || height > MAX_SLIME_CHUNK_RANGE {
            return Err(WorldgenError::InvalidInput(format!(
                "range too large: max {MAX_SLIME_CHUNK_RANGE}x{MAX_SLIME_CHUNK_RANGE} chunks"
            )));
        }
        let mut result = Vec::new();
        for cz in input.min_chunk_z..input.max_chunk_z {
            for cx in input.min_chunk_x..input.max_chunk_x {
                if worldgen.is_slime_chunk(seed, cx, cz) {
                    result.push(SlimeChunkDTO {
                        chunk_x: cx,
                        chunk_z: cz,
                    });
                }
            }
        }
        Ok(result)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}
