use std::sync::Arc;

use crate::application::dto::{ListStructuresInput, StructurePositionDTO};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct ListStructuresUseCase {
    worldgen: Arc<WorldgenService>,
}

impl ListStructuresUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn worldgen(&self) -> &Arc<WorldgenService> {
        &self.worldgen
    }

    pub fn execute(
        &self,
        input: ListStructuresInput,
    ) -> Result<Vec<StructurePositionDTO>, WorldgenError> {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;

        let result = self.worldgen.list_structures_in_area(
            seed,
            &input.mc_version,
            &input.dimension,
            &input.structure_type,
            input.min_x,
            input.min_z,
            input.max_x,
            input.max_z,
        )?;

        Ok(result
            .into_iter()
            .map(|(x, z)| StructurePositionDTO { x, z })
            .collect())
    }
}
