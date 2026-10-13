use std::sync::Arc;

use crate::application::dto::{SlimeChunkDTO, SlimeChunksInput};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

const MAX_SLIME_CHUNK_RANGE: i32 = 256;

pub struct ListSlimeChunksUseCase {
    worldgen: Arc<WorldgenService>,
}

impl ListSlimeChunksUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn worldgen(&self) -> &Arc<WorldgenService> {
        &self.worldgen
    }

    pub fn execute(&self, input: SlimeChunksInput) -> Result<Vec<SlimeChunkDTO>, WorldgenError> {
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
                if self.worldgen.is_slime_chunk(seed, cx, cz) {
                    result.push(SlimeChunkDTO {
                        chunk_x: cx,
                        chunk_z: cz,
                    });
                }
            }
        }
        Ok(result)
    }
}
