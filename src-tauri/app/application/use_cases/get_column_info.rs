use std::sync::Arc;

use crate::application::dto::{ColumnInfoDTO, ColumnInfoInput};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct GetColumnInfoUseCase {
    worldgen: Arc<WorldgenService>,
}

impl GetColumnInfoUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn worldgen(&self) -> &Arc<WorldgenService> {
        &self.worldgen
    }

    pub fn execute(&self, input: ColumnInfoInput) -> Result<ColumnInfoDTO, WorldgenError> {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;

        let (biome_id, y) = self.worldgen.column_info(
            seed,
            &input.mc_version,
            &input.dimension,
            &input.layer,
            input.x,
            input.z,
        )?;

        Ok(ColumnInfoDTO { biome_id, y })
    }
}
