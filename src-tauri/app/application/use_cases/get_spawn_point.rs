use std::sync::Arc;

use crate::application::dto::{SpawnPointDTO, SpawnPointInput};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct GetSpawnPointUseCase {
    worldgen: Arc<WorldgenService>,
}

impl GetSpawnPointUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn execute(&self, input: SpawnPointInput) -> Result<SpawnPointDTO, WorldgenError> {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;

        let (x, z) = self.worldgen.spawn_point(seed, &input.mc_version)?;
        Ok(SpawnPointDTO { x, z })
    }
}
