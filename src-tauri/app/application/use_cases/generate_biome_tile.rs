use std::sync::Arc;

use crate::application::dto::{BiomeTileDTO, GenerateBiomeTileInput};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct GenerateBiomeTileUseCase {
    worldgen: Arc<WorldgenService>,
}

impl GenerateBiomeTileUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn worldgen(&self) -> &Arc<WorldgenService> {
        &self.worldgen
    }

    pub fn execute(&self, input: GenerateBiomeTileInput) -> Result<BiomeTileDTO, WorldgenError> {
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

        let biome_ids = self.worldgen.sample_biome_grid(
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
            Some(self.worldgen.sample_height_grid(
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
    }
}
